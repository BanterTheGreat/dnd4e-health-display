export const MODULE_ID = "dnd4e-health-display";

import { registerTokenHoverDisplay } from "./scripts/token-hover-display.js";

Hooks.once("ready", () => {
	registerTokenHoverDisplay();
});
