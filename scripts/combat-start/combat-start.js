const MODULE_ID = "dnd4e-health-display";
const PRESETS_SETTING = "combatStartPresets";
const ACTIVE_SETTING = "activeCombatStart";
const SETUP_TEMPLATE = `modules/${MODULE_ID}/scripts/combat-start/combat-start-setup.hbs`;
const DISPLAY_TEMPLATE = `modules/${MODULE_ID}/scripts/combat-start/combat-start-display.hbs`;

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Register the world state used by the independent combat-start submodule. */
export function registerCombatStartSettings() {
	game.settings.register(MODULE_ID, PRESETS_SETTING, {
		name: "Combat Start presets",
		scope: "world",
		config: false,
		type: Object,
		default: { items: [] },
	});

	game.settings.register(MODULE_ID, ACTIVE_SETTING, {
		name: "Active Combat Start presentation",
		scope: "world",
		config: false,
		type: Object,
		default: {},
		onChange: synchronizeCombatStartDisplay,
	});
}

/** Register combat-tracker controls and the shared presentation lifecycle. */
export function registerCombatStart() {
	Hooks.on("renderCombatTracker", addCombatStartButton);
	Hooks.on("createCombatant", refreshCombatStartDisplay);
	Hooks.on("updateCombatant", refreshCombatStartDisplay);
	Hooks.on("deleteCombatant", refreshCombatStartDisplay);
	Hooks.on("deleteCombat", closeDeletedCombatDisplay);

	synchronizeCombatStartDisplay(game.settings.get(MODULE_ID, ACTIVE_SETTING));
	ui.combat?.render();
}

/** Add the GM-only Combat Start button to the combat tracker. */
function addCombatStartButton(app, element) {
	if (!game.user.isGM || element.querySelector("[data-dnd4e-combat-start]")) {
		return;
	}

	const header = element.querySelector(".combat-tracker-header")
		?? element.querySelector(".directory-header")
		?? element.querySelector("header");
	if (!header) {
		return;
	}

	const button = document.createElement("button");
	button.type = "button";
	button.className = "dnd4e-combat-start__tracker-button";
	button.dataset.dnd4eCombatStart = "";
	button.title = "Prepare a Combat Start presentation";
	button.innerHTML = '<i class="fa-solid fa-swords" aria-hidden="true"></i><span>Combat Start</span>';
	button.addEventListener("click", () => void openCombatStartSetup(app.viewed ?? game.combat));
	header.append(button);
}

/** Open the GM setup window for the currently viewed encounter. */
async function openCombatStartSetup(combat) {
	if (!combat) {
		if (!canvas.scene) {
			ui.notifications.warn("Activate a scene before preparing its Combat Start screen.");
			return;
		}

		try {
			combat = await Combat.create({
				scene: canvas.scene.id,
				active: true,
			});
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to create a combat encounter.`, error);
			ui.notifications.error("A combat encounter could not be created. Check the console for details.");
			return;
		}
	}

	if (!combat) {
		ui.notifications.error("A combat encounter could not be created.");
		return;
	}

	if (!ui.Dnd4eCombatStartSetup) {
		ui.Dnd4eCombatStartSetup = new CombatStartSetup({}, combat);
	}

	ui.Dnd4eCombatStartSetup.setCombat(combat);
	ui.Dnd4eCombatStartSetup.render(true);
}

/** Open, refresh, or close the presentation to match synchronized world state. */
function synchronizeCombatStartDisplay(presentation) {
	if (!presentation?.id) {
		closeCombatStartDisplay();
		return;
	}

	if (!ui.Dnd4eCombatStartDisplay) {
		ui.Dnd4eCombatStartDisplay = new CombatStartDisplay({}, presentation);
		ui.Dnd4eCombatStartDisplay.render(true);
		return;
	}

	ui.Dnd4eCombatStartDisplay.setPresentation(presentation);
}

/** Refresh the live display when its encounter membership changes. */
function refreshCombatStartDisplay(combatant) {
	if (ui.Dnd4eCombatStartDisplay?.combatId === combatant.parent?.id) {
		ui.Dnd4eCombatStartDisplay.render();
	}
}

/** Clear a presentation whose encounter was deleted. */
function closeDeletedCombatDisplay(combat) {
	if (ui.Dnd4eCombatStartDisplay?.combatId !== combat.id) {
		return;
	}

	if (game.user.isGM) {
		void game.settings.set(MODULE_ID, ACTIVE_SETTING, {});
	} else {
		closeCombatStartDisplay();
	}
}

/** Close the synchronized presentation and clear its UI reference. */
function closeCombatStartDisplay() {
	const display = ui.Dnd4eCombatStartDisplay;
	ui.Dnd4eCombatStartDisplay = null;
	void display?.close();
}

class CombatStartSetup extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options, combat) {
		super(options);
		this.combat = combat;
		this.selectedPresetId = "";
		this.commanderCombatantId = "";
		this.draft = getDefaultPresentation();
	}

	static DEFAULT_OPTIONS = {
		id: "dnd4e-combat-start-setup",
		classes: ["dnd4e-combat-start-setup"],
		position: { width: 940, height: 650 },
		window: { title: "Prepare Combat Start", resizable: true },
		actions: {
			show: CombatStartSetup.prototype.onShow,
			savePreset: CombatStartSetup.prototype.onSavePreset,
			loadPreset: CombatStartSetup.prototype.onLoadPreset,
			deletePreset: CombatStartSetup.prototype.onDeletePreset,
			addFriendlyTokens: CombatStartSetup.prototype.onAddFriendlyTokens,
			addNeutralTokens: CombatStartSetup.prototype.onAddNeutralTokens,
			addHostileTokens: CombatStartSetup.prototype.onAddHostileTokens,
			setCommander: CombatStartSetup.prototype.onSetCommander,
		},
	};

	static PARTS = {
		main: { template: SETUP_TEMPLATE },
	};

	/** @param {Combat} combat The encounter being prepared. */
	setCombat(combat) {
		if (this.combat?.id === combat.id) {
			return;
		}

		this.combat = combat;
		this.selectedPresetId = "";
		this.commanderCombatantId = "";
		this.draft = getDefaultPresentation();
	}

	/** @returns {object} */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const presets = getPresets();
		const hostileCombatants = Array.from(this.combat?.combatants ?? [])
			.filter((combatant) => combatant.token?.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE);
		if (!hostileCombatants.some((combatant) => combatant.id === this.commanderCombatantId)) {
			this.commanderCombatantId = getDefaultCommanderId(hostileCombatants);
		}
		const commanderCombatant = hostileCombatants.find((combatant) => combatant.id === this.commanderCombatantId);
		const combatants = Array.from(this.combat?.combatants ?? []).map((combatant) => ({
			...getCombatantData(combatant),
			disposition: getDispositionLabel(combatant.token?.disposition),
			dispositionClass: getDispositionClass(combatant.token?.disposition),
			canBeCommander: combatant.token?.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE,
			isCommander: combatant.id === this.commanderCombatantId,
		}));
		const availableFriendlyTokens = getAvailableSceneTokens(this.combat, CONST.TOKEN_DISPOSITIONS.FRIENDLY);
		const availableNeutralTokens = getAvailableSceneTokens(this.combat, CONST.TOKEN_DISPOSITIONS.NEUTRAL);
		const availableHostileTokens = getAvailableSceneTokens(this.combat, CONST.TOKEN_DISPOSITIONS.HOSTILE);
		return foundry.utils.mergeObject(context, {
			combatName: this.combat?.name ?? "Encounter",
			draft: this.draft,
			combatants,
			commanderPreview: commanderCombatant ? getCombatantData(commanderCombatant) : null,
			commanderPreviewScale: Number(this.draft.commanderZoom ?? 100) / 100,
			hasCombatants: combatants.length > 0,
			availableFriendlyCount: availableFriendlyTokens.length,
			availableNeutralCount: availableNeutralTokens.length,
			availableHostileCount: availableHostileTokens.length,
			hasAvailableFriendlyTokens: availableFriendlyTokens.length > 0,
			hasAvailableNeutralTokens: availableNeutralTokens.length > 0,
			hasAvailableHostileTokens: availableHostileTokens.length > 0,
			presets: presets.map((preset) => ({
				...preset,
				selected: preset.id === this.selectedPresetId,
			})),
			hasPresets: presets.length > 0,
			hasSelectedPreset: Boolean(this.selectedPresetId),
		});
	}

	/** Keep the commander artwork preview synchronized with its focus and zoom sliders. */
	_onRender(context, options) {
		super._onRender(context, options);
		const preview = this.element.querySelector(".dnd4e-combat-start-setup__art-preview img");
		const horizontal = this.element.querySelector('[name="commanderPositionX"]');
		const vertical = this.element.querySelector('[name="commanderPositionY"]');
		const zoom = this.element.querySelector('[name="commanderZoom"]');
		if (!preview || !horizontal || !vertical || !zoom) {
			return;
		}

		const updatePreview = () => {
			preview.style.objectPosition = `${horizontal.value}% ${vertical.value}%`;
			preview.style.transformOrigin = `${horizontal.value}% ${vertical.value}%`;
			preview.style.transform = `scale(${Number(zoom.value) / 100})`;
		};
		horizontal.addEventListener("input", updatePreview);
		vertical.addEventListener("input", updatePreview);
		zoom.addEventListener("input", updatePreview);
	}

	/** Keep the in-progress field values before performing an action. */
	readDraft() {
		if (!this.element) {
			return this.draft;
		}

		this.draft = {
			name: this.element.querySelector('[name="presetName"]')?.value.trim() ?? "",
			title: this.element.querySelector('[name="title"]')?.value.trim() ?? "",
			description: this.element.querySelector('[name="description"]')?.value.trim() ?? "",
			commanderSubtitle: this.element.querySelector('[name="commanderSubtitle"]')?.value.trim() ?? "",
			commanderPositionX: Number(this.element.querySelector('[name="commanderPositionX"]')?.value ?? 50),
			commanderPositionY: Number(this.element.querySelector('[name="commanderPositionY"]')?.value ?? 50),
			commanderZoom: Number(this.element.querySelector('[name="commanderZoom"]')?.value ?? 100),
		};
		this.selectedPresetId = this.element.querySelector('[name="preset"]')?.value ?? "";
		return this.draft;
	}

	/** Save the current copy as a reusable world preset. */
	async onSavePreset() {
		const draft = this.readDraft();
		if (!draft.name) {
			ui.notifications.warn("Give this Combat Start preset a name first.");
			return;
		}

		const presets = getPresets();
		const existing = presets.find((preset) => preset.id === this.selectedPresetId);
		const saved = {
			id: existing?.id ?? foundry.utils.randomID(),
			...draft,
		};
		const nextPresets = existing
			? presets.map((preset) => preset.id === saved.id ? saved : preset)
			: [...presets, saved];

		await game.settings.set(MODULE_ID, PRESETS_SETTING, { items: nextPresets });
		this.selectedPresetId = saved.id;
		ui.notifications.info(`Saved Combat Start preset “${saved.name}”.`);
		this.render();
	}

	/** Load the selected preset into the editable fields. */
	onLoadPreset() {
		this.readDraft();
		const preset = getPresets().find((candidate) => candidate.id === this.selectedPresetId);
		if (!preset) {
			return;
		}

		this.draft = {
			name: preset.name,
			title: preset.title,
			description: preset.description,
			commanderSubtitle: preset.commanderSubtitle ?? "",
			commanderPositionX: preset.commanderPositionX ?? 50,
			commanderPositionY: preset.commanderPositionY ?? 50,
			commanderZoom: preset.commanderZoom ?? 100,
		};
		this.render();
	}

	/** Delete the selected reusable preset. */
	async onDeletePreset() {
		this.readDraft();
		if (!this.selectedPresetId) {
			return;
		}

		const presets = getPresets().filter((preset) => preset.id !== this.selectedPresetId);
		await game.settings.set(MODULE_ID, PRESETS_SETTING, { items: presets });
		this.selectedPresetId = "";
		this.draft = getDefaultPresentation();
		this.render();
	}

	/** Add every missing friendly token from the encounter scene. */
	async onAddFriendlyTokens(event, target) {
		await this.addSceneTokens(CONST.TOKEN_DISPOSITIONS.FRIENDLY, "friendly", target);
	}

	/** Add every missing neutral token from the encounter scene. */
	async onAddNeutralTokens(event, target) {
		await this.addSceneTokens(CONST.TOKEN_DISPOSITIONS.NEUTRAL, "neutral", target);
	}

	/** Add every missing hostile token from the encounter scene. */
	async onAddHostileTokens(event, target) {
		await this.addSceneTokens(CONST.TOKEN_DISPOSITIONS.HOSTILE, "hostile", target);
	}

	/** Select one hostile combatant as the presentation's enemy commander. */
	onSetCommander(event, target) {
		this.readDraft();
		this.commanderCombatantId = target.dataset.combatantId;
		this.render();
	}

	/**
	 * Add all scene tokens of one disposition which are not already combatants.
	 *
	 * @param {number} disposition
	 * @param {string} label
	 * @param {HTMLButtonElement} target
	 */
	async addSceneTokens(disposition, label, target) {
		this.readDraft();
		const tokens = getAvailableSceneTokens(this.combat, disposition);
		if (!tokens.length) {
			ui.notifications.info(`There are no new ${label} tokens to add to this encounter.`);
			return;
		}

		target.disabled = true;
		try {
			await this.combat.createEmbeddedDocuments("Combatant", tokens.map((token) => ({
				actorId: token.actorId,
				sceneId: token.parent.id,
				tokenId: token.id,
				hidden: token.hidden,
			})));
			ui.notifications.info(`Added ${tokens.length} ${label} token${tokens.length === 1 ? "" : "s"} to the encounter.`);
			this.render();
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to add ${label} tokens to combat.`, error);
			ui.notifications.error(`The ${label} tokens could not be added. Check the console for details.`);
			target.disabled = false;
		}
	}

	/** Synchronize the presentation to every connected user. */
	async onShow() {
		const draft = this.readDraft();
		if (!draft.title) {
			ui.notifications.warn("A title is required.");
			return;
		}

		await game.settings.set(MODULE_ID, ACTIVE_SETTING, {
			id: foundry.utils.randomID(),
			combatId: this.combat.id,
			commanderCombatantId: this.commanderCombatantId,
			title: draft.title,
			description: draft.description,
			commanderSubtitle: draft.commanderSubtitle,
			commanderPositionX: draft.commanderPositionX,
			commanderPositionY: draft.commanderPositionY,
			commanderZoom: draft.commanderZoom,
		});
		await this.close();
	}

	/** Clear the shared UI reference when this setup window closes. */
	_onClose(options) {
		ui.Dnd4eCombatStartSetup = null;
		super._onClose(options);
	}
}

class CombatStartDisplay extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options, presentation) {
		super(options);
		this.presentation = presentation;
		this.activeTab = "briefing";
	}

	static DEFAULT_OPTIONS = {
		id: "dnd4e-combat-start-display",
		classes: ["dnd4e-combat-start-display"],
		position: { width: 1040, height: 720 },
		window: { title: "Combat Start", resizable: true },
		actions: {
			showTab: CombatStartDisplay.prototype.onShowTab,
			startCombat: CombatStartDisplay.prototype.onStartCombat,
			rollInitiative: CombatStartDisplay.prototype.onRollInitiative,
			hidePresentation: CombatStartDisplay.prototype.onHidePresentation,
		},
	};

	static PARTS = {
		main: { template: DISPLAY_TEMPLATE },
	};

	get combatId() {
		return this.presentation.combatId;
	}

	/** @param {object} presentation The new synchronized presentation data. */
	setPresentation(presentation) {
		this.presentation = presentation;
		this.render();
	}

	/** @returns {object} */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const combat = game.combats.get(this.combatId);
		const roster = getCombatStartRoster(combat, this.presentation.commanderCombatantId);
		const canRollPlayerInitiative = !game.user.isGM && combat?.combatants.some((combatant) => combatant.actor?.hasPlayerOwner
			&& combatant.isOwner
			&& combatant.initiative == null);
		return foundry.utils.mergeObject(context, {
			...this.presentation,
			...roster,
			commanderScale: Number(this.presentation.commanderZoom ?? 100) / 100,
			isGM: game.user.isGM,
			canRollPlayerInitiative,
			showBriefing: this.activeTab === "briefing",
			showStrategy: game.user.isGM && this.activeTab === "strategy",
		});
	}

	/** Initialize enlarged portrait previews after each render. */
	_onRender(context, options) {
		super._onRender(context, options);
		removePortraitPreview();
		initializePortraitPreviews(this.element);
	}

	/** Switch the visible presentation tab. */
	onShowTab(event, target) {
		const tab = target.dataset.tab;
		if (!game.user.isGM && tab !== "briefing") {
			return;
		}

		this.activeTab = tab;
		this.render();
	}

	/** Roll every NPC, start the encounter, and dismiss the screen for everyone. */
	async onStartCombat(event, target) {
		if (!game.user.isGM) {
			return;
		}

		target.disabled = true;
		const combat = game.combats.get(this.combatId);
		if (!combat) {
			ui.notifications.error("The prepared encounter no longer exists.");
			target.disabled = false;
			return;
		}

		try {
			const npcIds = combat.combatants
				.filter((combatant) => combatant.actor && !combatant.actor.hasPlayerOwner)
				.map((combatant) => combatant.id);
			if (npcIds.length) {
				await combat.rollInitiative(npcIds);
			}
			if (!combat.started) {
				await combat.startCombat();
			}
			await game.settings.set(MODULE_ID, ACTIVE_SETTING, {});
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to start prepared encounter.`, error);
			ui.notifications.error("The encounter could not be started. Check the console for details.");
			target.disabled = false;
		}
	}

	/** Roll initiative for every player combatant owned by the current user. */
	async onRollInitiative(event, target) {
		if (game.user.isGM) {
			return;
		}

		const combat = game.combats.get(this.combatId);
		const ownedPlayerIds = combat?.combatants
			.filter((combatant) => combatant.actor?.hasPlayerOwner
				&& combatant.isOwner
				&& combatant.initiative == null)
			.map((combatant) => combatant.id) ?? [];
		if (!ownedPlayerIds.length) {
			ui.notifications.info("Your initiative has already been rolled.");
			return;
		}

		target.disabled = true;
		try {
			await combat.rollInitiative(ownedPlayerIds);
			this.render();
		} catch (error) {
			console.error(`${MODULE_ID} | Failed to roll player initiative.`, error);
			ui.notifications.error("Initiative could not be rolled. Check the console for details.");
		} finally {
			target.disabled = false;
		}
	}

	/** Hide the current presentation without starting its encounter. */
	async onHidePresentation() {
		if (game.user.isGM) {
			await game.settings.set(MODULE_ID, ACTIVE_SETTING, {});
		}
	}

	/** Turn GM dismissal into a synchronized hide while players close normally. */
	async close(options = {}) {
		if (game.user.isGM && game.settings.get(MODULE_ID, ACTIVE_SETTING)?.id) {
			await game.settings.set(MODULE_ID, ACTIVE_SETTING, {});
			return this;
		}

		removePortraitPreview();
		return super.close(options);
	}
}

/** @returns {object} */
function getDefaultPresentation() {
	return {
		name: "",
		title: "No Road Back",
		description: "Your enemies stand between you and the only way out.",
		commanderSubtitle: "",
		commanderPositionX: 50,
		commanderPositionY: 50,
		commanderZoom: 100,
	};
}

/** Attach hover and keyboard-focus previews to non-commander portraits. */
function initializePortraitPreviews(element) {
	for (const portrait of element.querySelectorAll("[data-combat-start-portrait]")) {
		portrait.addEventListener("mouseenter", () => showPortraitPreview(portrait));
		portrait.addEventListener("mouseleave", removePortraitPreview);
		portrait.addEventListener("focus", () => showPortraitPreview(portrait));
		portrait.addEventListener("blur", removePortraitPreview);
	}
}

/** @param {HTMLImageElement} portrait */
function showPortraitPreview(portrait) {
	removePortraitPreview();
	const preview = document.createElement("aside");
	preview.className = "dnd4e-combat-start-portrait-preview";
	const image = document.createElement("img");
	image.src = portrait.src;
	image.alt = "";
	const name = document.createElement("strong");
	name.textContent = portrait.dataset.portraitName ?? "";
	preview.append(image, name);
	document.body.appendChild(preview);

	const portraitRect = portrait.getBoundingClientRect();
	const previewRect = preview.getBoundingClientRect();
	const gap = 12;
	const left = portraitRect.right + gap + previewRect.width <= window.innerWidth
		? portraitRect.right + gap
		: portraitRect.left - previewRect.width - gap;
	const top = Math.min(Math.max(gap, portraitRect.top + portraitRect.height / 2 - previewRect.height / 2), window.innerHeight - previewRect.height - gap);
	preview.style.left = `${left}px`;
	preview.style.top = `${top}px`;
}

/** Remove the currently visible enlarged portrait preview. */
function removePortraitPreview() {
	document.querySelector(".dnd4e-combat-start-portrait-preview")?.remove();
}

/** @returns {Array<object>} */
function getPresets() {
	return game.settings.get(MODULE_ID, PRESETS_SETTING)?.items ?? [];
}

/**
 * Find scene tokens of the requested disposition which are not yet in the encounter.
 *
 * @param {Combat} combat
 * @param {number} disposition
 * @returns {TokenDocument[]}
 */
function getAvailableSceneTokens(combat, disposition) {
	const combatScene = combat?.scene;
	const scene = combatScene?.tokens
		? combatScene
		: game.scenes.get(combat?.sceneId ?? combatScene) ?? canvas.scene;
	if (!scene) {
		return [];
	}

	const existingTokenIds = new Set(Array.from(combat?.combatants ?? [])
		.filter((combatant) => combatant.sceneId === scene.id)
		.map((combatant) => combatant.tokenId));
	return Array.from(scene.tokens).filter((token) => token.actorId
		&& token.disposition === disposition
		&& !existingTokenIds.has(token.id));
}

/** @param {number} disposition @returns {string} */
function getDispositionLabel(disposition) {
	if (disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
		return "Friendly";
	}
	if (disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE) {
		return "Hostile";
	}

	return "Neutral";
}

/** @param {number} disposition @returns {string} */
function getDispositionClass(disposition) {
	if (disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
		return "is-friendly";
	}
	if (disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE) {
		return "is-hostile";
	}

	return "is-neutral";
}

/**
 * Build display-ready party, commander, and grouped hostile data.
 *
 * @param {Combat|null} combat
 * @returns {object}
 */
function getCombatStartRoster(combat, commanderCombatantId = "") {
	const combatants = combat ? Array.from(combat.combatants) : [];
	const party = combatants
		.filter((combatant) => combatant.actor?.hasPlayerOwner)
		.map(getCombatantData);
	const enemies = combatants
		.filter((combatant) => combatant.actor && !combatant.actor.hasPlayerOwner)
		.sort((left, right) => getActorLevel(right.actor) - getActorLevel(left.actor));
	const preferredCommanderIndex = enemies.findIndex((combatant) => combatant.id === commanderCombatantId);
	const [commander] = enemies.splice(preferredCommanderIndex >= 0 ? preferredCommanderIndex : 0, 1);
	const enemyGroups = [];

	for (const combatant of enemies) {
		const key = combatant.actorId ?? combatant.name;
		const existing = enemyGroups.find((group) => group.key === key);
		if (existing) {
			existing.count += 1;
			continue;
		}

		enemyGroups.push({
			...getCombatantData(combatant),
			key,
			count: 1,
		});
	}

	return {
		combatName: combat?.name ?? "Encounter",
		party,
		partyCount: party.length,
		enemyCount: enemies.length + (commander ? 1 : 0),
		commander: commander ? getCombatantData(commander) : null,
		enemyGroups,
	};
}

/** @param {Combatant} combatant @returns {object} */
function getCombatantData(combatant) {
	return {
		id: combatant.id,
		name: combatant.name,
		img: combatant.actor?.img ?? combatant.img ?? combatant.token?.texture?.src ?? "icons/svg/mystery-man.svg",
		role: getActorRole(combatant.actor),
		publicRole: getPublicEnemyRole(combatant.actor),
		level: getActorLevel(combatant.actor),
		initiative: combatant.initiative == null ? "—" : Math.round(combatant.initiative),
	};
}

/** @param {Combatant[]} hostileCombatants @returns {string} */
function getDefaultCommanderId(hostileCombatants) {
	return hostileCombatants
		.slice()
		.sort((left, right) => getActorLevel(right.actor) - getActorLevel(left.actor))[0]?.id ?? "";
}

/** @param {Actor} actor @returns {number} */
function getActorLevel(actor) {
	return Number(actor?.system?.details?.level?.value ?? actor?.system?.details?.level ?? actor?.system?.level ?? 0);
}

/** @param {Actor} actor @returns {string} */
function getActorRole(actor) {
	const primaryRole = actor?.system?.details?.role?.primary;
	const secondaryRole = actor?.system?.details?.role?.secondary;
	if (primaryRole || secondaryRole) {
		const primaryLabel = CONFIG.DND4E?.creatureRole?.[primaryRole]?.label ?? primaryRole;
		const secondaryLabel = CONFIG.DND4E?.creatureRoleSecond?.[secondaryRole]?.label ?? secondaryRole;
		return [secondaryLabel, primaryLabel].filter(Boolean).join(" ");
	}

	return actor?.system?.details?.class ?? actor?.type ?? "Combatant";
}

/**
 * Return only enemy classifications useful to players before combat.
 *
 * @param {Actor} actor
 * @returns {string}
 */
function getPublicEnemyRole(actor) {
	const role = actor?.system?.details?.role;
	const labels = [];
	if (["elite", "minion", "solo"].includes(role?.secondary)) {
		labels.push(CONFIG.DND4E?.creatureRoleSecond?.[role.secondary]?.label ?? role.secondary);
	}
	if (role?.leader || role?.primary === "leader") {
		labels.push(game.i18n.localize("DND4E.Role.Leader"));
	}

	return labels.join(" · ");
}
