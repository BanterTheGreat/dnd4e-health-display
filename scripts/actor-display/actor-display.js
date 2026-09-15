import { getActorDisplayData } from "./actor-display-data.js";

const MODULE_ID = "dnd4e-health-display";
const SHOW_SETTING = "showActorDisplay";
const POSITION_SETTING = "actorDisplayPosition";
const TEMPLATE_PATH = `modules/${MODULE_ID}/scripts/actor-display/actor-display.hbs`;

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

let selectionRenderTimer = null;

/** Register client settings owned by the actor display. */
export function registerActorDisplaySettings() {
	game.settings.register(MODULE_ID, SHOW_SETTING, {
		name: "Show actor display",
		hint: "Show a compact action and inventory display for the currently controlled token.",
		scope: "client",
		config: true,
		type: Boolean,
		default: true,
		onChange: (enabled) => {
			if (enabled) {
				renderSelectedActor();
			} else {
				closeActorDisplay();
			}
		},
	});

	game.settings.register(MODULE_ID, POSITION_SETTING, {
		name: "Actor display position",
		hint: "Saved screen position of the actor display.",
		scope: "client",
		config: false,
		type: Object,
		default: { top: null, left: null },
	});
}

/** Register hooks which create and refresh the actor display. */
export function registerActorDisplay() {
	Hooks.on("canvasReady", renderSelectedActor);
	Hooks.on("controlToken", scheduleSelectedActorRender);
	Hooks.on("createToken", scheduleSelectedActorRender);
	Hooks.on("deleteToken", scheduleSelectedActorRender);
	Hooks.on("updateActor", refreshForActor);
	Hooks.on("createItem", refreshForItem);
	Hooks.on("updateItem", refreshForItem);
	Hooks.on("deleteItem", refreshForItem);
	Hooks.on("createActiveEffect", refreshForEffect);
	Hooks.on("updateActiveEffect", refreshForEffect);
	Hooks.on("deleteActiveEffect", refreshForEffect);
	Hooks.on("canvasTearDown", closeActorDisplay);

	renderSelectedActor();
}

/** Render after Foundry has finished changing the controlled-token collection. */
function scheduleSelectedActorRender() {
	window.clearTimeout(selectionRenderTimer);
	selectionRenderTimer = window.setTimeout(renderSelectedActor, 0);
}

/** Select the best token for the current user and display it. */
function renderSelectedActor() {
	if (!game.settings.get(MODULE_ID, SHOW_SETTING) || !canvas?.ready) {
		return;
	}

	const token = getTokenToDisplay();
	if (!token) {
		closeActorDisplay();
		return;
	}

	if (!ui.Dnd4eActorDisplay) {
		ui.Dnd4eActorDisplay = new ActorDisplay({}, token);
		ui.Dnd4eActorDisplay.render(true);
		return;
	}

	ui.Dnd4eActorDisplay.setToken(token);
}

/**
 * Resolve the controlled token, with an owned-character fallback for players.
 *
 * @returns {Token|null}
 */
function getTokenToDisplay() {
	if (canvas.tokens?.controlled?.length === 1) {
		return canvas.tokens.controlled[0];
	}

	if (game.user.isGM) {
		return null;
	}

	if (game.user.character) {
		const assigned = canvas.tokens.placeables.find((token) => token.actor?.id === game.user.character.id);
		if (assigned) {
			return assigned;
		}
	}

	return canvas.tokens.placeables.find((token) => token.actor?.type === "Player Character"
		&& token.document.testUserPermission(game.user, "OWNER")) ?? null;
}

/** @param {Actor} actor The updated actor. */
function refreshForActor(actor) {
	if (ui.Dnd4eActorDisplay?.actor?.id === actor.id) {
		ui.Dnd4eActorDisplay.render();
	}
}

/** @param {Item} item The changed embedded item. */
function refreshForItem(item) {
	refreshForActor(item.parent);
}

/** @param {ActiveEffect} effect The changed active effect. */
function refreshForEffect(effect) {
	refreshForActor(effect.parent);
}

/** Close the actor display when its canvas is removed. */
function closeActorDisplay() {
	window.clearTimeout(selectionRenderTimer);
	selectionRenderTimer = null;
	const display = ui.Dnd4eActorDisplay;
	ui.Dnd4eActorDisplay = null;
	void display?.close();
}

class ActorDisplay extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options, token) {
		super(options);
		this.token = token;
		this.activeTab = "powers";
		this.savedScrollTop = 0;
	}

	static DEFAULT_OPTIONS = {
		id: "dnd4e-info-actor-display",
		tag: "aside",
		classes: ["dnd4e-info-actor-display"],
		position: {
			top: 16,
			left: 16,
			width: 368,
			height: "auto",
		},
		dragResizable: false,
		window: { frame: false },
		actions: {
			showSection: ActorDisplay.prototype.onShowSection,
			power: { handler: ActorDisplay.prototype.onPower, buttons: [0, 2] },
			refreshPower: ActorDisplay.prototype.onRefreshPower,
			skill: ActorDisplay.prototype.onSkill,
			feature: { handler: ActorDisplay.prototype.onFeature, buttons: [0, 2] },
			item: { handler: ActorDisplay.prototype.onItem, buttons: [0, 2] },
			toggleEquip: ActorDisplay.prototype.onToggleEquip,
			quick: ActorDisplay.prototype.onQuickAction,
		},
	};

	static PARTS = {
		main: { template: TEMPLATE_PATH },
	};

	get actor() {
		return this.token?.actor;
	}

	/** @param {Token} token The new displayed token. */
	setToken(token) {
		const actorChanged = this.actor?.id !== token.actor?.id;
		this.token = token;
		if (actorChanged) {
			this.activeTab = "powers";
			this.savedScrollTop = 0;
		}
		this.render();
	}

	/** @returns {object} */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		return foundry.utils.mergeObject(context, getActorDisplayData(this.token, this.activeTab));
	}

	/** Place the frameless display directly in the document body. */
	_insertElement(element) {
		document.body.appendChild(element);
	}

	/** Initialize DOM behavior after each render. */
	_onRender(context, options) {
		super._onRender(context, options);
		this.element.querySelector(".dnd4e-info-actor-display__workspace")?.scrollTo(0, this.savedScrollTop);
		this.initializeResourceInputs();
		this.initializeDrag();
		this.restorePosition();
	}

	/** Preserve the inventory scroll position across document refreshes. */
	render(options = {}) {
		this.savedScrollTop = this.element?.querySelector(".dnd4e-info-actor-display__workspace")?.scrollTop ?? this.savedScrollTop;
		return super.render(options);
	}

	/** Bind editable resource inputs. */
	initializeResourceInputs() {
		for (const input of this.element.querySelectorAll("[data-resource-path]")) {
			input.addEventListener("keydown", async (event) => {
				if (event.key !== "Enter") {
					return;
				}

				const value = Number(input.value);
				if (!Number.isFinite(value)) {
					return;
				}

				await this.actor.update({ [input.dataset.resourcePath]: value });
				input.blur();
			});
		}
	}

	/** Make the display draggable from its identity header. */
	initializeDrag() {
		const handle = this.element.querySelector(".dnd4e-info-actor-display__identity");
		if (!handle) {
			return;
		}

		handle.addEventListener("pointerdown", (event) => {
			if (event.button !== 0 || event.target.closest("input, button, [data-action]")) {
				return;
			}

			const startX = event.clientX;
			const startY = event.clientY;
			const startLeft = this.position.left;
			const startTop = this.position.top;
			const move = (moveEvent) => this.setPosition({
				left: startLeft + moveEvent.clientX - startX,
				top: startTop + moveEvent.clientY - startY,
			});
			const release = async () => {
				document.removeEventListener("pointermove", move);
				document.removeEventListener("pointerup", release);
				await game.settings.set(MODULE_ID, POSITION_SETTING, {
					left: this.position.left,
					top: this.position.top,
				});
			};

			event.preventDefault();
			document.addEventListener("pointermove", move);
			document.addEventListener("pointerup", release);
		});
	}

	/** Restore the user's last saved display position. */
	restorePosition() {
		const position = game.settings.get(MODULE_ID, POSITION_SETTING);
		if (position?.left != null && position?.top != null) {
			this.setPosition(position);
		}
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	onShowSection(event, target) {
		this.activeTab = target.dataset.displayTab;
		this.savedScrollTop = 0;
		this.render();
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	async onPower(event, target) {
		const power = this.actor.items.get(target.dataset.itemId);
		if (event.button === 2) {
			power?.sheet.render(true);
			return;
		}
		if (power) {
			await this.actor.usePower(power);
		}
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	async onRefreshPower(event, target) {
		const power = this.actor.items.get(target.dataset.itemId);
		if (power) {
			await power.update({ "system.uses.value": power.system?.uses?.max });
		}
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	onSkill(event, target) {
		return this.actor.rollSkill(target.dataset.skill, { fastForward: true });
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	onFeature(event, target) {
		const feature = this.actor.items.get(target.dataset.itemId);
		if (event.button === 2) {
			return feature?.sheet.render(true);
		}
		return feature?.roll();
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	onItem(event, target) {
		const item = this.actor.items.get(target.dataset.itemId);
		if (event.button === 2) {
			return item?.sheet.render(true);
		}
		return item?.roll();
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	async onToggleEquip(event, target) {
		const item = this.actor.items.get(target.dataset.itemId);
		if (item) {
			await item.update({ "system.equipped": !item.system?.equipped });
		}
	}

	/** @param {PointerEvent} event The action event. @param {HTMLElement} target The action target. */
	onQuickAction(event, target) {
		const hooks = dnd4e.compatibility.tah.TokenBarHooks;
		switch (target.dataset.command) {
			case "actionPoint": return hooks.actionPoint(this.actor, event);
			case "savingThrow": return hooks.saveDialog(this.actor, event);
			case "initiative": return this.actor.rollInitiative({ createCombatants: true }, { event });
			case "healing": return hooks.healDialog(this.actor, event);
			case "secondWind": return hooks.secondWind(this.actor, event);
			case "shortRest": return new dnd4e.applications.apps.ShortRestDialog({ document: this.actor }).render(true);
			case "extendedRest": return new dnd4e.applications.apps.LongRestDialog({ document: this.actor }).render(true);
			case "deathSave": return hooks.deathSave(this.actor, event);
			case "openSheet": return this.actor.sheet.render(true);
			default: return undefined;
		}
	}
}
