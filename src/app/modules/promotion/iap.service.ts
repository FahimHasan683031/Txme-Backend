import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

const verifyApplePurchase = async (receiptData: string) => {
    const itunesUrl = "https://buy.itunes.apple.com/verifyReceipt";
    const sandboxUrl = "https://sandbox.itunes.apple.com/verifyReceipt";

    const verify = async (url: string) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'receipt-data': receiptData,
                'password': config.iap.appleSharedSecret
            })
        });
        return await response.json() as any;
    };

    let data = await verify(itunesUrl);

    // If sandbox receipt sent to production, retry on sandbox
    if (data.status === 21007) {
        data = await verify(sandboxUrl);
    }

    if (data.status !== 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Apple IAP verification failed with status: ${data.status}`);
    }

    // Return the latest transaction info
    const latestReceipt = data.latest_receipt_info ? data.latest_receipt_info[data.latest_receipt_info.length - 1] : data.receipt.in_app[0];

    return {
        transactionId: latestReceipt.transaction_id,
        productId: latestReceipt.product_id,
        purchaseDate: new Date(parseInt(latestReceipt.purchase_date_ms))
    };
};

import NodeRSA from 'node-rsa';

const verifyGooglePurchase = async (productId: string, receipt: string) => {
    // 1. Get Public Key
    const publicKeyBase64 = config.iap.googlePlayPublicKey;
    if (!publicKeyBase64) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Google Play Public Key not configured");
    }

    // 2. Parse Receipt
    // Expected format from client: JSON string of { data: string, signature: string }
    // 'data' is the 'purchaseData' JSON string from Google
    let receiptObj: { data: string, signature: string };
    try {
        receiptObj = JSON.parse(receipt);
    } catch (error) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid receipt format. Expected JSON string.");
    }

    const { data: purchaseData, signature } = receiptObj;

    if (!purchaseData || !signature) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Missing purchase data or signature in receipt");
    }

    // 3. Verify Signature
    try {
        const key = new NodeRSA();
        // Google keys are standard PEM but often provided as just the Base64 payload in console.
        // node-rsa can handle public-der keys if formatted correctly, or we reconstruct PEM.

        // Standardize Key Format
        const formattedKey = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.replace(/(.{64})/g, '$1\n')}\n-----END PUBLIC KEY-----`;

        key.importKey(formattedKey, 'pkcs8-public');

        // Signature is Base64, data is the raw string
        // We convert the data to a Buffer to avoid encoding ambiguity and satisfy types
        const isValid = key.verify(Buffer.from(purchaseData), signature, undefined, 'base64');

        if (!isValid) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Google IAP Signature");
        }
    } catch (err: any) {
        console.error("IAP Verification Error:", err);
        throw new ApiError(StatusCodes.BAD_REQUEST, `IAP Verification failed: ${err.message}`);
    }

    // 4. Parse Purchase Data to get details
    const purchaseDetails = JSON.parse(purchaseData);

    // Basic structure of purchaseDetails:
    // {
    //   "orderId": "GPA.1234-5678-9012-34567",
    //   "packageName": "com.example.app",
    //   "productId": "exampleSku",
    //   "purchaseTime": 1345678900000,
    //   "purchaseState": 0, (0=Purchased, 1=Canceled, 2=Pending)
    //   "purchaseToken": "..."
    // }

    // 5. Basic Validation
    if (purchaseDetails.productId !== productId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID in receipt does not match requested product");
    }

    if (purchaseDetails.packageName !== config.iap.packageName) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Package Name mismatch");
    }

    // purchaseState 0 = Purchased
    if (purchaseDetails.purchaseState !== 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Purchase state is not 'Purchased'");
    }

    return {
        transactionId: purchaseDetails.orderId,
        productId: purchaseDetails.productId,
        purchaseDate: new Date(purchaseDetails.purchaseTime),
        // Additional info if needed
        token: purchaseDetails.purchaseToken
    };
};

export const IapService = {
    verifyApplePurchase,
    verifyGooglePurchase
};
