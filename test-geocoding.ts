
import { geocodePostCode } from "./src/util/geocoding.util";

async function test() {
    const postCodes = [
        "WC2N 5DN", // London Center (Trafalgar Square)
        "NW1 8AL",  // Camden (~3.5km)
        "SE10 9NN", // Greenwich (~8.8km)
        "E15 1BB",  // Stratford (~9.8km)
        "B1 1BB"    // Birmingham (~160km+)
    ];

    for (const pc of postCodes) {
        try {
            console.log(`\nTesting search query: ${pc}`);
            const result = await geocodePostCode(pc);
            console.log(`Result for ${pc}:`, result);
        } catch (error: any) {
            console.error(`Error for ${pc}:`, error.message);
        }
    }
}

test();
