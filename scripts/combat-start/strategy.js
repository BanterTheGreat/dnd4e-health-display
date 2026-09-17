const MODULE_ID = "dnd4e-health-display";
const STRATEGY_FLAG = "strategy";
const TURN_POINTER_TEMPLATE = `modules/${MODULE_ID}/scripts/combat-start/strategy-turn-pointer.hbs`;
const ENVIRONMENT_TEMPLATE = `modules/${MODULE_ID}/scripts/combat-start/strategy-environment.hbs`;
const TURN_POINTER_POSITION_SETTING = "combatStartTurnPointerPosition";
const ENVIRONMENT_POSITION_SETTING = "combatStartEnvironmentPosition";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Register the client-scoped settings that remember where the GM last placed each overlay. */
export function registerStrategySettings() {
	game.settings.register(MODULE_ID, TURN_POINTER_POSITION_SETTING, {
		scope: "client",
		config: false,
		type: Object,
		default: null,
	});

	game.settings.register(MODULE_ID, ENVIRONMENT_POSITION_SETTING, {
		scope: "client",
		config: false,
		type: Object,
		default: null,
	});
}

/** @returns {{environment: string[], pointers: Array<{id: string, notes: string[], combatantIds: string[]}>}} */
export function getDefaultStrategy() {
	return { environment: [], pointers: [] };
}

/** @param {Combat|null} combat @returns {object} The encounter's saved strategy notes. */
export function getStrategy(combat) {
	return foundry.utils.mergeObject(getDefaultStrategy(), combat?.getFlag(MODULE_ID, STRATEGY_FLAG) ?? {}, { inplace: false });
}

/** @param {Combat} combat @param {object} strategy @returns {Promise} */
export function setStrategy(combat, strategy) {
	return combat.setFlag(MODULE_ID, STRATEGY_FLAG, strategy);
}

/** Register the hooks that drive the turn-pointer dialog and the environment overlay. */
export function registerStrategy() {
	Hooks.on("updateCombat", onUpdateCombat);
	Hooks.on("deleteCombat", onDeleteCombat);

	if (game.user.isGM && game.combat?.started && game.combat.active) {
		openEnvironmentPanel(game.combat);
		showTurnPointers(game.combat);
	}
}

/** @param {Combat} combat @param {object} changes */
function onUpdateCombat(combat, changes) {
	if (!game.user.isGM || !combat.active) {
		return;
	}

	if (foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.${STRATEGY_FLAG}`) && combat.started) {
		openEnvironmentPanel(combat);
	}

	if ("turn" in changes || "round" in changes) {
		if (combat.started) {
			openEnvironmentPanel(combat);
			showTurnPointers(combat);
		} else {
			closeEnvironmentPanel();
			closeTurnPointerDialog();
		}
	}
}

/** @param {Combat} combat */
function onDeleteCombat(combat) {
	if (ui.Dnd4eStrategyEnvironment?.combatId === combat.id) {
		closeEnvironmentPanel();
	}
	if (ui.Dnd4eStrategyTurnPointer?.combatId === combat.id) {
		closeTurnPointerDialog();
	}
}

/** Show, refresh, or close the turn-pointer dialog for the encounter's current combatant. */
function showTurnPointers(combat) {
	const combatant = combat.combatant;
	if (!combatant) {
		closeTurnPointerDialog();
		return;
	}

	const strategy = getStrategy(combat);
	const notes = strategy.pointers
		.filter((pointer) => pointer.combatantIds?.includes(combatant.id))
		.flatMap((pointer) => pointer.notes ?? []);
	if (!notes.length) {
		closeTurnPointerDialog();
		return;
	}

	const data = {
		combatId: combat.id,
		combatantName: combatant.name,
		combatantImg: combatant.actor?.img ?? combatant.token?.texture?.src ?? "icons/svg/mystery-man.svg",
		notes,
	};
	if (!ui.Dnd4eStrategyTurnPointer) {
		ui.Dnd4eStrategyTurnPointer = new StrategyTurnPointerDialog({}, data);
		ui.Dnd4eStrategyTurnPointer.render(true);
		return;
	}

	ui.Dnd4eStrategyTurnPointer.setData(data);
}

/** Close the turn-pointer dialog and clear its shared UI reference. */
function closeTurnPointerDialog() {
	const dialog = ui.Dnd4eStrategyTurnPointer;
	ui.Dnd4eStrategyTurnPointer = null;
	void dialog?.close({ dnd4eForce: true });
}

/** Show, refresh, or close the persistent environment overlay for the active encounter. */
function openEnvironmentPanel(combat) {
	const strategy = getStrategy(combat);
	const notes = (strategy.environment ?? []).filter((note) => note?.trim());
	if (!notes.length) {
		closeEnvironmentPanel();
		return;
	}

	const data = { combatId: combat.id, notes };
	if (!ui.Dnd4eStrategyEnvironment) {
		ui.Dnd4eStrategyEnvironment = new StrategyEnvironmentPanel({}, data);
		ui.Dnd4eStrategyEnvironment.render(true);
		return;
	}

	ui.Dnd4eStrategyEnvironment.setData(data);
}

/** Close the environment overlay and clear its shared UI reference. */
function closeEnvironmentPanel() {
	const panel = ui.Dnd4eStrategyEnvironment;
	ui.Dnd4eStrategyEnvironment = null;
	void panel?.close({ dnd4eForce: true });
}

/** @param {string} settingKey @returns {object|null} A previously saved {left, top} (and optionally size), if any. */
function getSavedPosition(settingKey) {
	const saved = game.settings.get(MODULE_ID, settingKey);
	return saved && typeof saved === "object" ? saved : null;
}

/** Persist an overlay's current position, debounced so dragging doesn't spam the client setting. */
const persistPosition = foundry.utils.debounce((settingKey, position) => {
	void game.settings.set(MODULE_ID, settingKey, {
		left: position.left,
		top: position.top,
		width: position.width,
		height: position.height,
	});
}, 400);

/**
 * Shared behaviour for the GM-only strategy overlays: they remember where the GM last placed
 * them instead of reopening centered, and only the module's own hooks (never the player, a
 * misclick, or the Escape key) may actually close them, since their visibility is driven by
 * combat state rather than user intent.
 *
 * @param {typeof ApplicationV2} Base
 * @param {string} positionSettingKey
 * @param {() => {left: number, top: number}} getDefaultPosition Evaluated lazily, since it
 * reads the current browser window size.
 */
function ManagedOverlayMixin(Base, positionSettingKey, getDefaultPosition) {
	return class extends Base {
		constructor(options, data) {
			super(foundry.utils.mergeObject({
				position: getSavedPosition(positionSettingKey) ?? getDefaultPosition(),
			}, options));
			this.data = data;
		}

		get combatId() {
			return this.data.combatId;
		}

		/** @param {object} data */
		setData(data) {
			this.data = data;
			this.render();
		}

		/** @returns {object} */
		async _prepareContext(options) {
			const context = await super._prepareContext(options);
			return foundry.utils.mergeObject(context, this.data);
		}

		/** Remember the GM's chosen position (and size, if resizable) for the next time this overlay opens. */
		setPosition(position) {
			const applied = super.setPosition(position);
			persistPosition(positionSettingKey, this.position);
			return applied;
		}

		/** This overlay is driven entirely by combat state; only the module itself may close it. */
		async close(options = {}) {
			if (!options.dnd4eForce) {
				return this;
			}
			return super.close(options);
		}
	};
}

/** GM-only dialog announcing a combatant's turn alongside the pointers prepared for it. */
class StrategyTurnPointerDialog extends ManagedOverlayMixin(
	HandlebarsApplicationMixin(ApplicationV2),
	TURN_POINTER_POSITION_SETTING,
	() => ({ left: window.innerWidth - 420, top: window.innerHeight - 300 }),
) {
	static DEFAULT_OPTIONS = {
		id: "dnd4e-strategy-turn-pointer",
		classes: ["dnd4e-strategy-turn-pointer"],
		position: { width: 380 },
		window: { title: "Turn Pointer", resizable: false, minimizable: false },
	};

	static PARTS = {
		main: { template: TURN_POINTER_TEMPLATE },
	};
}

/** GM-only overlay that keeps the encounter's environment notes visible for the whole fight. */
class StrategyEnvironmentPanel extends ManagedOverlayMixin(
	HandlebarsApplicationMixin(ApplicationV2),
	ENVIRONMENT_POSITION_SETTING,
	() => ({ left: 20, top: window.innerHeight - 300 }),
) {
	static DEFAULT_OPTIONS = {
		id: "dnd4e-strategy-environment",
		classes: ["dnd4e-strategy-environment"],
		position: { width: 320, height: "auto" },
		window: { title: "Environment", resizable: true, minimizable: false },
	};

	static PARTS = {
		main: { template: ENVIRONMENT_TEMPLATE },
	};
}
