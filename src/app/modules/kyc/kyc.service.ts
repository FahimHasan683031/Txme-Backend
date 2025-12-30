import { ComplyCube } from "@complycube/api";
import config from "../../../config";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

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

export const KycService = {
    getMobileToken,
    handleWebhook,
    getKycStatus
};
