import https from "https";
import config from "../config";
import ApiError from "../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

export const geocodePostCode = async (postCode: string): Promise<{ latitude: number; longitude: number; address: string }> => {
    const apiKey = (config as any).googleMapsApiKey;
    if (!apiKey) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Google Maps API key is not configured");
    }

    // If the postCode is a simple number like "1212", it helps to append the country for Google Maps
    const searchQuery = postCode.length <= 5 ? `${postCode}, Bangladesh` : postCode;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`[Geocoding] API Response Status: ${response.status}`);
                    if (response.status !== "OK") {
                        console.log(`[Geocoding] Failed response:`, JSON.stringify(response, null, 2));
                        const message = response.status === "ZERO_RESULTS"
                            ? `Invalid post code: ${postCode}. Please provide a valid post code.`
                            : `Geocoding failed: ${response.status}`;
                        return reject(new ApiError(StatusCodes.BAD_REQUEST, message));
                    }
                    const { lat, lng } = response.results[0].geometry.location;
                    const address = response.results[0].formatted_address;
                    const types = response.results[0].types as string[];
                    console.log(`[Geocoding] Found: ${lat}, ${lng}, Address: ${address}, Types: ${types.join(", ")}`);

                    // ✅ Reject broad results like just "country"
                    if (types.includes("country") && !types.includes("postal_code") && !types.includes("locality")) {
                        console.log(`[Geocoding] Result too broad for postCode: ${postCode}`);
                        return reject(new ApiError(StatusCodes.BAD_REQUEST, `Could not find a specific location for post code: ${postCode}`));
                    }

                    resolve({ latitude: lat, longitude: lng, address });
                } catch (error: any) {
                    reject(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to parse geocoding response: ${error.message}`));
                }
            });
        }).on("error", (error) => {
            reject(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch coordinates: ${error.message}`));
        });
    });
};
