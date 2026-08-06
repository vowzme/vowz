import { loadFont as loadDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";

export const display = loadDisplay("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
export const body = loadBody("normal", { weights: ["300", "400", "600"], subsets: ["latin"] }).fontFamily;

export const NAVY = "#001F3F";
export const NAVY_DEEP = "#00142A";
export const GOLD = "#D4AF37";
export const GOLD_LIGHT = "#F0D98A";
export const IVORY = "#F5F5DC";

export const bgGradient = `radial-gradient(120% 80% at 50% 0%, #06305C 0%, ${NAVY} 45%, ${NAVY_DEEP} 100%)`;