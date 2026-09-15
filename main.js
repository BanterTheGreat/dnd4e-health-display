export const MODULE_ID = "dnd4e-health-display";

import {
	registerActorDisplay,
	registerActorDisplaySettings,
} from "./scripts/actor-display/actor-display.js";
import {
	registerHealthDisplay,
	registerHealthDisplaySettings,
} from "./scripts/health-display/health-display.js";

Hooks.once("init", () => {
	registerHealthDisplaySettings();
	registerActorDisplaySettings();
});

Hooks.once("ready", () => {
	registerHealthDisplay();
	registerActorDisplay();
});
