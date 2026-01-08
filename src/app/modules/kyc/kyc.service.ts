import { ComplyCube } from "@complycube/api";
import config from "../../../config";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import crypto from 'crypto';

// Initialize ComplyCube
const complycube = new ComplyCube({
    apiKey: config.complycube.apiKey as string,
});

const getMobileToken = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    let clientId = user.complyCubeClientId;

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
            await User.findByIdAndUpdate(userId, { complyCubeClientId: clientId });
        } catch (error: any) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to create ComplyCube client: ${error.message}`);
        }
    }

    try {
        const token = await complycube.token.generate(clientId, {
            referrer: "*://*/*"
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

    const checks = await complycube.check.list(user.complyCubeClientId);
    const latestCheck = checks.find((c: any) => c.type === 'document_check' && c.status === 'complete') as any;

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
                documentType: document.type,
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

const createDiditSessionToDB = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const payload: any = {
        vendor_data: userId,
        callback_url: "https://api.txme-exchange.com/didit/callback",
        redirect_url: "https://api.txme-exchange.com/didit",
        allow_redirects: true
    };

    if (config.didit.workflowId) {
        payload.workflow_id = config.didit.workflowId;
    } else {
        payload.features = ["id-verification", "face-verification"];
    }

    try {
        const response = await fetch(`${config.didit.baseUrl}/session/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.didit.apiKey as string
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Didit API Error: ${errorText}`);
        }

        const data: any = await response.json();
        await User.findByIdAndUpdate(userId, { diditSessionId: data.session_id });

        return {
            sessionId: data.session_id,
            url: data.url
        };
    } catch (error: any) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Didit Session Error: ${error.message}`);
    }
};

const handleDiditWebhookToDB = async (payload: any, signature: string, rawBody?: Buffer) => {
    console.log("--- Didit Webhook Received ---");
    console.log("Payload Body:", JSON.stringify(payload, null, 2));

    // 1. Verify Signature
    if (config.didit.webhookSecret && signature) {
        const hmac = crypto.createHmac('sha256', config.didit.webhookSecret);
        const dataToVerify = rawBody ? rawBody : JSON.stringify(payload);
        const digest = hmac.update(dataToVerify).digest('hex');
        if (signature !== digest) {
            console.error("Signature Mismatch!");
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Didit signature");
        }
    } else if (config.didit.webhookSecret && !signature) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Didit signature missing");
    }

    const eventType = payload.webhook_type || payload.event || payload.type;

    if (eventType === 'status.updated') {
        const session_id = payload.session_id || (payload.data && payload.data.session_id);
        const status = payload.status || (payload.data && payload.data.status);
        const userId = payload.vendor_data || (payload.data && payload.data.vendor_data);

        console.log(`Processing update for Session: ${session_id}, Status: ${status}, UserId: ${userId}`);

        if (status && status.toString().toLowerCase() === 'approved') {
            let result = null;
            let kycData: any = {};

            try {
                const decisionResponse = await fetch(`${config.didit.baseUrl}/session/${session_id}/decision/`, {
                    headers: { 'x-api-key': config.didit.apiKey as string }
                });

                if (decisionResponse.ok) {
                    const decision = await decisionResponse.json();

                    const getValueDeep = (obj: any, targetKeys: string[]): any => {
                        if (!obj || typeof obj !== 'object') return null;
                        for (const k of targetKeys) {
                            if (obj[k] && typeof obj[k] !== 'object' && obj[k] !== "") return obj[k];
                        }
                        for (const key in obj) {
                            if (typeof obj[key] === 'object' && obj[key] !== null) {
                                const found = getValueDeep(obj[key], targetKeys);
                                if (found) return found;
                            }
                        }
                        return null;
                    };

                    const getImagesDeep = (obj: any, collected: string[] = []) => {
                        if (!obj || typeof obj !== 'object') return;
                        if (Array.isArray(obj)) {
                            obj.forEach(item => getImagesDeep(item, collected));
                            return;
                        }
                        for (const key in obj) {
                            const val = obj[key];
                            if (typeof val === 'string' && val.startsWith('http') &&
                                (key.includes('image') || key.includes('front') || key.includes('back') || key.includes('url'))) {
                                collected.push(val);
                            } else if (typeof val === 'object') {
                                getImagesDeep(val, collected);
                            }
                        }
                    };

                    const fullName = getValueDeep(decision, ['full_name', 'fullName', 'name']);
                    const firstName = getValueDeep(decision, ['first_name', 'firstName']);
                    const lastName = getValueDeep(decision, ['last_name', 'lastName']);
                    const dob = getValueDeep(decision, ['date_of_birth', 'dob', 'birthDate', 'birth_date']);
                    const docNumber = getValueDeep(decision, ['document_number', 'document_id', 'id_number', 'value']);
                    const docType = getValueDeep(decision, ['document_type', 'type']);
                    const address = getValueDeep(decision, ['address', 'postal_address', 'formatted_address']);
                    const country = getValueDeep(decision, ['country', 'nationality', 'issuing_country']);
                    const gender = getValueDeep(decision, ['gender', 'sex']);

                    const images: string[] = [];
                    getImagesDeep(decision, images);
                    const uniqueImages = [...new Set(images)].filter(img => !img.toLowerCase().includes('liveness'));

                    let idTypeMapped: "nid" | "passport" = 'nid';
                    if (docType && docType.toString().toLowerCase().includes('passport')) idTypeMapped = 'passport';

                    kycData = {
                        fullName: fullName || (firstName ? `${firstName} ${lastName || ""}`.trim() : undefined),
                        dateOfBirth: dob ? new Date(dob) : undefined,
                        gender,
                        nationality: country,
                        countryOfResidence: country,
                        postalAddress: address,
                        ...(docNumber && {
                            identification: { type: idTypeMapped, value: docNumber }
                        }),
                        ...(uniqueImages.length > 0 && { idDocuments: uniqueImages.slice(0, 5) })
                    };

                    console.log("Final KYC Object for DB Update:", JSON.stringify(kycData, null, 2));
                }
            } catch (error) {
                console.error("Error fetching Didit decision data:", error);
            }

            const updateData = { isIdentityVerified: true, ...kycData };

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
