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
import {
	registerMarkDisplay,
	registerMarkDisplaySettings,
} from "./scripts/mark-display/mark-display.js";

Hooks.once("init", () => {
	registerHealthDisplaySettings();
	registerActorDisplaySettings();
	registerTeamDisplaySettings();
	registerMarkDisplaySettings();
});

Hooks.once("ready", () => {
	registerHealthDisplay();
	registerActorDisplay();
	registerTeamDisplay();
	registerMarkDisplay();
});
