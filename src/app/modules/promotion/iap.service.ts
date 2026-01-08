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

const verifyGooglePurchase = async (productId: string, purchaseToken: string) => {
    // Note: Google verification requires an access token from Service Account.
    // This usually involves using 'googleapis' or manually signing a JWT for OAuth2.
    // For simplicity, we recommend the user installs 'googleapis' for the final step.

    // Placeholder for Google verification logic
    // In a real scenario, this would call:
    // https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}

    console.log("Google Purchase Verification intended for:", productId, purchaseToken);

    // Returning dummy / manual success for now as it requires complex Auth setup
    // the user will provide service account keys soon.
    return {
        transactionId: `GPA-${Date.now()}`, // Placeholder
        productId,
        purchaseDate: new Date()
    };
};

export const IapService = {
    verifyApplePurchase,
    verifyGooglePurchase
};
