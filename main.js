export const MODULE_ID = "dnd4e-health-display";

import {
	registerActorDisplay,
	registerActorDisplaySettings,
} from "./scripts/actor-display/actor-display.js";
import {
	registerHealthDisplay,
	registerHealthDisplaySettings,
} from "./scripts/health-display/health-display.js";
import {
	registerTeamDisplay,
	registerTeamDisplaySettings,
} from "./scripts/team-display/team-display.js";

Hooks.once("init", () => {
	registerHealthDisplaySettings();
	registerActorDisplaySettings();
	registerTeamDisplaySettings();
});

Hooks.once("ready", () => {
	registerHealthDisplay();
	registerActorDisplay();
	registerTeamDisplay();
});
