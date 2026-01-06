import { ComplyCube } from "@complycube/api";
import config from "../../../config";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import crypto from 'crypto';

// Initialize ComplyCube
// Note: We need to ensure apiKey is present.
const complycube = new ComplyCube({
    apiKey: config.complycube.apiKey as string,
});

const getMobileToken = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    let clientId = user.complyCubeClientId;

    // 1. If user doesn't have a Client ID, create one
    if (!clientId) {
        try {
            const client = await complycube.client.create({
                type: "person",
                email: user.email,
                personDetails: {
                    firstName: user.fullName ? user.fullName.split(" ")[0] : "Unknown",
                    lastName: user.fullName ? user.fullName.split(" ").slice(1).join(" ") : "User",
                }
            });
            clientId = client.id;

            // Save the new Client ID using findByIdAndUpdate to avoid triggering pre-save hooks
            await User.findByIdAndUpdate(userId, { complyCubeClientId: clientId });

        } catch (error: any) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create ComplyCube client: ${error.message}`);
        }
    }

    // 2. Generate a Client Token for the Mobile SDK
    try {
        const token = await complycube.token.generate(clientId, {
            referrer: "*://*/*" // Allow all referrers for mobile app usage
        });
        return { token: token.token, clientId };
    } catch (error: any) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to generate SDK token: ${error.message}`);
    }
};

const getKycStatus = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user || !user.complyCubeClientId) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User or KYC profile not found");
    }

    // Fetch the latest check from ComplyCube
    const checks = await complycube.check.list(user.complyCubeClientId);

    // Find the latest completed identity check
    const latestCheck = checks.find((c: any) => c.type === 'document_check' && c.status === 'complete') as any; // Adjust check type if needed

    let kycDetails = null;

    if (latestCheck && latestCheck.outcome === 'clear' && latestCheck.documentId) {
        try {
            const document: any = await complycube.document.get(latestCheck.documentId);
            kycDetails = {
                firstName: document.fields?.firstName?.value,
                lastName: document.fields?.lastName?.value,
                dateOfBirth: document.fields?.dob?.value ?
                    new Date(document.fields.dob.value).toISOString().split('T')[0] : undefined,
                documentNumber: document.fields?.documentNumber?.value,
                documentType: document.type, // passport, driving_license, etc.
                nationality: document.fields?.nationality?.value,
                gender: document.fields?.gender?.value
            };
        } catch (error) {
            console.error("Error fetching document details:", error);
        }
    }

    return {
        isVerified: user.isIdentityVerified || false,
        status: user.status,
        kycDetails
    };
};

const handleWebhook = async (event: any) => {
    console.log("ComplyCube Webhook Event:", event.type);

    if (event.type === 'check.completed') {
        const { clientId, outcome } = event.payload;

        if (outcome === 'clear') {
            // Update User Status only, do not save PII
            await User.findOneAndUpdate(
                { complyCubeClientId: clientId },
                {
                    isIdentityVerified: true,
                    status: 'active'
                }
            );
        }
    }
};

// --- Didit KYC Integration ---

const createDiditSessionToDB = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const apiKey = config.didit.apiKey;
    if (!apiKey) {
        console.error("DIDIT_API_KEY is missing in config/env!");
    } else {
        console.log(`Using Didit API Key starting with: ${apiKey.substring(0, 5)}...`);
    }

    const payload: any = {
        vendor_data: userId,
        callback_url: "txme://kyc-success",
        callback: "txme://kyc-success"
    };

    // Use workflowId if provided, otherwise fallback to features (for older/custom setups)
    if (config.didit.workflowId) {
        payload.workflow_id = config.didit.workflowId;
    } else {
        payload.features = ["id-verification", "face-verification"];
    }

    try {
        if (!config.didit.workflowId) {
            console.warn("DIDIT_WORKFLOW_ID is missing. This might cause a 401/400 error in V2.");
        }

        console.log("Didit Request Payload:", JSON.stringify(payload));
        const url = `${config.didit.baseUrl}/session/`;
        console.log("Didit Request URL:", url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.didit.apiKey as string
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Didit API Error Status: ${response.status}`);
            console.error(`Didit API Error Response: ${errorText}`);

            let errorMessage = 'Failed to create Didit session';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // ignore parse error, use default message
            }
            throw new Error(errorMessage);
        }

        const data: any = await response.json();

        // Save session ID to user
        await User.findByIdAndUpdate(userId, { diditSessionId: data.session_id });

        return {
            sessionId: data.session_id,
            url: data.url // The verification URL to open in mobile browser
        };
    } catch (error: any) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Didit Session Error: ${error.message}`);
    }
};

const handleDiditWebhookToDB = async (payload: any, signature: string, rawBody?: Buffer) => {
    console.log("--- Didit Webhook Received ---");
    console.log("Signature Header:", signature);
    console.log("Payload Body:", JSON.stringify(payload, null, 2));
    if (rawBody) {
        console.log("Raw Body Buffer Received (Length):", rawBody.length);
    }

    // 1. Verify Signature
    if (config.didit.webhookSecret && signature) {
        const hmac = crypto.createHmac('sha256', config.didit.webhookSecret);
        // Use rawBody if available, otherwise fallback to stringified JSON (less reliable)
        const dataToVerify = rawBody ? rawBody : JSON.stringify(payload);
        const digest = hmac.update(dataToVerify).digest('hex');

        console.log("Calculated Digest:", digest);

        if (signature !== digest) {
            console.error("Signature Mismatch!");
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Didit signature");
        }
    } else if (config.didit.webhookSecret && !signature) {
        console.warn("Signature missing but secret configured!");
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Didit signature missing");
    } else {
        console.warn("DIDIT_WEBHOOK_SECRET is missing. Skipping signature verification (Not recommended for Production).");
    }

    const eventType = payload.webhook_type || payload.event || payload.type;
    console.log("Didit Webhook Event(Detected):", eventType);

    // 2. Handle status.updated event
    if (eventType === 'status.updated') {
        // Robust extraction: Check root AND payload.data
        const session_id = payload.session_id || (payload.data && payload.data.session_id);
        const status = payload.status || (payload.data && payload.data.status);
        const userId = payload.vendor_data || (payload.data && payload.data.vendor_data);

        console.log(`Processing update for Session: ${session_id}, Status: ${status}, VendorData(UserId): ${userId}`);

        if (status && status.toString().toLowerCase() === 'approved') {
            // Recommendation: Try to update by userId first (more reliable)
            let result = null;

            // 3. Fetch extracted data from Didit Decision API
            let kycData: any = {};
            try {
                console.log(`Fetching decision data for session: ${session_id}`);
                const decisionResponse = await fetch(`${config.didit.baseUrl}/session/${session_id}/decision/`, {
                    headers: {
                        'x-api-key': config.didit.apiKey as string
                    }
                });

                if (decisionResponse.ok) {
                    const decision = await decisionResponse.json();
                    console.log("Didit Decision Raw Data Received.");

                    // 1. Accumulate data from all possible locations
                    let combinedData: any = {};

                    // Root and direct children
                    Object.assign(combinedData, decision);
                    if (decision.data) Object.assign(combinedData, decision.data);
                    if (decision.extracted_data) Object.assign(combinedData, decision.extracted_data);
                    if (decision.data && decision.data.extracted_data) Object.assign(combinedData, decision.data.extracted_data);

                    // Search through verifications array (Highest Priority for PII)
                    const verifications = decision.verifications || (decision.data && decision.data.verifications) || [];
                    if (Array.isArray(verifications)) {
                        verifications.forEach((v: any) => {
                            if (v.extracted_data) Object.assign(combinedData, v.extracted_data);
                            if (v.type?.toLowerCase().includes('document')) {
                                Object.assign(combinedData, v);
                            }
                        });
                    }

                    // Search through results array
                    const results = decision.results || (decision.data && decision.data.results) || [];
                    if (Array.isArray(results)) {
                        results.forEach((r: any) => {
                            if (r.extracted_data) Object.assign(combinedData, r.extracted_data);
                            if (r.data) Object.assign(combinedData, r.data);
                        });
                    }

                    // 2. Extract Images
                    const idDocImages: string[] = [];
                    const documents = decision.documents || (decision.data && decision.data.documents) || [];
                    if (Array.isArray(documents)) {
                        documents.forEach((doc: any) => {
                            if (doc.front_image || doc.front) idDocImages.push(doc.front_image || doc.front);
                            if (doc.back_image || doc.back) idDocImages.push(doc.back_image || doc.back);
                        });
                    }

                    // Fallback to verifications for images
                    if (idDocImages.length === 0 && Array.isArray(verifications)) {
                        verifications.forEach((v: any) => {
                            if (v.documents && Array.isArray(v.documents)) {
                                v.documents.forEach((doc: any) => {
                                    if (doc.front_image || doc.front) idDocImages.push(doc.front_image || doc.front);
                                    if (doc.back_image || doc.back) idDocImages.push(doc.back_image || doc.back);
                                });
                            }
                        });
                    }

                    // 3. Mapping Final Object
                    const idValue = combinedData.document_number || combinedData.id_number || combinedData.document_id || combinedData.value;
                    let idType: "nid" | "passport" | undefined = undefined;
                    const rawType = (combinedData.document_type || combinedData.type || "").toString().toLowerCase();
                    if (rawType.includes('passport')) idType = 'passport';
                    else if (rawType.includes('id') || rawType.includes('license') || rawType.includes('card')) idType = 'nid';

                    kycData = {
                        fullName: combinedData.full_name ||
                            (combinedData.first_name ? `${combinedData.first_name} ${combinedData.last_name || ""}`.trim() : undefined) ||
                            combinedData.name,
                        dateOfBirth: (combinedData.date_of_birth || combinedData.dob || combinedData.birth_date) ? new Date(combinedData.date_of_birth || combinedData.dob || combinedData.birth_date) : undefined,
                        gender: combinedData.gender || combinedData.sex,
                        nationality: combinedData.nationality || combinedData.country,
                        countryOfResidence: combinedData.country || combinedData.issuing_country || combinedData.country_of_residence,
                        postalAddress: combinedData.address || combinedData.residential_address,
                        ...(idValue && {
                            identification: {
                                type: idType || 'nid',
                                value: idValue
                            }
                        }),
                        ...(idDocImages.length > 0 && { idDocuments: idDocImages })
                    };

                    console.log("Final KYC Object for DB Update:", JSON.stringify(kycData, null, 2));
                } else {
                    console.warn(`Failed to fetch decision data: Status ${decisionResponse.status}`);
                }
            } catch (error) {
                console.error("Error fetching Didit decision data:", error);
            }

            const updateData = {
                isIdentityVerified: true,
                ...kycData
            };

            if (userId && userId.length === 24) {
                result = await User.findByIdAndUpdate(userId, updateData, { new: true });
                console.log(`Update result using UserId: ${result ? 'Success' : 'Failed'}`);
            }

            if (!result && session_id) {
                result = await User.findOneAndUpdate({ diditSessionId: session_id }, updateData, { new: true });
                console.log(`Update result using SessionId: ${result ? 'Success' : 'Failed'}`);
            }

            if (!result) {
                console.error(`Could not find User to update for session ${session_id}`);
            } else {
                console.log(`User ${result._id} successfully verified.`);
            }
        } else {
            console.log(`Status is not 'Approved' (received: ${status}). Skipping update.`);
        }
    }
};

export const KycService = {
    getMobileToken,
    handleWebhook,
    getKycStatus,
    createDiditSessionToDB,
    handleDiditWebhookToDB
};
