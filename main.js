export const MODULE_ID = "dnd4e-health-display";

import {
	registerTokenHoverDisplay,
	registerTokenHoverDisplaySettings,
} from "./scripts/token-hover-display.js";

Hooks.once("init", () => {
	registerTokenHoverDisplaySettings();
});

Hooks.once("ready", () => {
	registerTokenHoverDisplay();
});
