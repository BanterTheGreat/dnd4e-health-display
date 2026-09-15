const DISPLAY_ID = "dnd4e-token-hover-display";
const DISPLAY_TEMPLATE = "modules/dnd4e-health-display/scripts/token-hover-display.hbs";
const STYLESHEET_ID = "dnd4e-health-display-styles";
const STYLESHEET_PATH = "modules/dnd4e-health-display/styles/token-hover-display.css";
const HEALTH_SEGMENTS = 4;
const SHIFT_DESCRIPTIONS_SETTING = "shiftEffectDescriptions";

let hoveredToken = null;
let renderSequence = 0;
let showDescriptions = false;

/** Register settings used by the token hover display. */
export function registerTokenHoverDisplaySettings() {
	game.settings.register("dnd4e-health-display", SHIFT_DESCRIPTIONS_SETTING, {
		name: "Show effect descriptions while holding Shift",
		hint: "When enabled, holding Shift replaces temporary-effect names with their descriptions in the token hover display.",
		scope: "client",
		config: true,
		type: Boolean,
		default: true,
		onChange: (enabled) => {
			if (!enabled) {
				clearModifiers();
			}
		},
	});
}

/**
 * Register the token hover display and the hooks which keep it current.
 */
export function registerTokenHoverDisplay() {
	ensureStylesheet();
	ensureDisplay();

	Hooks.on("hoverToken", onHoverToken);
	Hooks.on("updateActor", refreshForActor);
	Hooks.on("updateToken", refreshForToken);
	Hooks.on("createActiveEffect", refreshForEffect);
	Hooks.on("updateActiveEffect", refreshForEffect);
	Hooks.on("deleteActiveEffect", refreshForEffect);
	Hooks.on("canvasTearDown", hideDisplay);
	window.addEventListener("keydown", onModifierChange);
	window.addEventListener("keyup", onModifierChange);
	window.addEventListener("blur", clearModifiers);
}

/**
 * Load the display styles even when Foundry has cached an older module manifest.
 */
function ensureStylesheet() {
	if (document.getElementById(STYLESHEET_ID)) {
		return;
	}

	const stylesheet = document.createElement("link");
	const version = game.modules.get("dnd4e-health-display")?.version ?? "1";
	stylesheet.id = STYLESHEET_ID;
	stylesheet.rel = "stylesheet";
	stylesheet.href = `${STYLESHEET_PATH}?v=${encodeURIComponent(version)}-${Date.now()}`;
	document.head.append(stylesheet);
}

/**
 * Create the fixed display mount point if it does not exist yet.
 *
 * @returns {HTMLElement}
 */
function ensureDisplay() {
	let display = document.getElementById(DISPLAY_ID);

	if (!display) {
		display = document.createElement("section");
		display.id = DISPLAY_ID;
		display.classList.add("dnd4e-health-display");
		display.setAttribute("aria-live", "polite");
		Object.assign(display.style, {
			position: "fixed",
			top: "3.5rem",
			left: "50%",
			right: "auto",
			bottom: "auto",
			zIndex: "90",
			width: "min(34rem, calc(100vw - 2rem))",
			margin: "0",
			transform: "translateX(-50%)",
			pointerEvents: "none",
		});
		display.hidden = true;
		document.body.append(display);
	}

	return display;
}

/**
 * Display the hovered token, or clear the display when that same token is left.
 *
 * @param {Token} token The hovered canvas token.
 * @param {boolean} hovered Whether the pointer entered or left the token.
 */
function onHoverToken(token, hovered) {
	if (hovered) {
		hoveredToken = token;
		void renderDisplay(token);
		return;
	}

	if (hoveredToken?.id === token.id) {
		hideDisplay();
	}
}

/**
 * Render the currently hovered token.
 *
 * @param {Token} token The token to render.
 */
async function renderDisplay(token) {
	const actor = token?.actor;

	if (!actor) {
		hideDisplay();
		return;
	}

	const sequence = ++renderSequence;
	const render = foundry.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
	const html = await render(DISPLAY_TEMPLATE, getDisplayData(token, actor));

	if (sequence !== renderSequence || hoveredToken?.id !== token.id) {
		return;
	}

	const display = ensureDisplay();
	display.innerHTML = html;
	display.hidden = false;
}

/**
 * Build presentation data without exposing exact hit point values.
 *
 * @param {Token} token The hovered token.
 * @param {Actor} actor The token's actor.
 * @returns {object}
 */
function getDisplayData(token, actor) {
	const hp = actor.system?.attributes?.hp ?? {};
	const value = Number(hp.value);
	const maximum = Number(hp.max);
	const role = getSpecialRole(actor);
	const segmentCount = role?.key === "minion" ? 1 : HEALTH_SEGMENTS;
	const filledSegments = getFilledSegments(value, maximum, segmentCount);
	const shownEffects = getShownEffects(actor);

	return {
		name: token.name || actor.name,
		role,
		healthLabel: role?.key === "minion" ? "Minion health" : "Health shown in quarters",
		segments: Array.from({ length: segmentCount }, (_unused, index) => ({
			filled: index < filledSegments,
		})),
		effects: getEffectDisplayData(shownEffects),
		combatStats: getEffectCombatStats(actor, shownEffects),
	};
}

/**
 * Total attack, damage, and defence changes from only the displayed effects.
 *
 * @param {Actor} actor The displayed actor.
 * @param {ActiveEffect[]} effects The effects included in the display.
 * @returns {Array<{icon: string, label: string, value: string, tone: string}>}
 */
function getEffectCombatStats(actor, effects) {
	const totals = {
		attack: 0,
		damage: 0,
		defences: 0,
		ac: 0,
		fort: 0,
		ref: 0,
		wil: 0,
	};

	for (const effect of effects) {
		for (const change of effect.system?.changes ?? effect.changes ?? []) {
			if (!isAdditiveChange(change)) {
				continue;
			}

			const value = evaluateEffectChange(change.value, actor);
			const key = change.key ?? "";

			if (key.startsWith("system.modifiers.attack.")) {
				totals.attack += value;
			} else if (key.startsWith("system.modifiers.damage.")) {
				totals.damage += value;
			} else if (key.startsWith("system.modifiers.defences.")) {
				totals.defences += value;
			} else {
				for (const defence of ["ac", "fort", "ref", "wil"]) {
					if (key.startsWith(`system.defences.${defence}.`)) {
						totals[defence] += value;
					}
				}
			}
		}
	}

	return [
		getModifierStat("fa-solid fa-crosshairs", "To Hit from shown effects", totals.attack),
		getModifierStat("fa-solid fa-burst", "Damage from shown effects", totals.damage),
		getModifierStat("fa-solid fa-shield-halved", "Armor Class from shown effects", totals.defences + totals.ac),
		getModifierStat("fa-solid fa-dumbbell", "Fortitude from shown effects", totals.defences + totals.fort),
		getModifierStat("fa-solid fa-person-running", "Reflex from shown effects", totals.defences + totals.ref),
		getModifierStat("fa-solid fa-brain", "Will from shown effects", totals.defences + totals.wil),
	].filter((stat) => stat.value !== "+0");
}

/**
 * Test whether an effect change adds to its target value.
 *
 * @param {object} change An ActiveEffect change.
 * @returns {boolean}
 */
function isAdditiveChange(change) {
	return change.type === "add"
		|| change.mode === CONST.ACTIVE_EFFECT_MODES.ADD
		|| change.mode === 2;
}

/**
 * Evaluate a numeric effect value against the affected actor's roll data.
 *
 * @param {number|string} value The effect change value.
 * @param {Actor} actor The affected actor.
 * @returns {number}
 */
function evaluateEffectChange(value, actor) {
	const number = Number(value);

	if (Number.isFinite(number)) {
		return number;
	}

	try {
		const formula = Roll.replaceFormulaData(String(value), actor.getRollData(), { missing: 0 });
		const result = Roll.safeEval(formula);
		return Number.isFinite(result) ? result : 0;
	} catch (_error) {
		return 0;
	}
}

/**
 * Format a signed global modifier for the display.
 *
 * @param {string} icon Font Awesome icon classes.
 * @param {string} label Accessible statistic label.
 * @param {number} value Prepared modifier value.
 * @returns {{icon: string, label: string, value: string, tone: string}}
 */
function getModifierStat(icon, label, value) {
	const number = Number(value) || 0;
	return {
		icon,
		label,
		value: number >= 0 ? `+${number}` : String(number),
		tone: number > 0 ? "is-positive" : number < 0 ? "is-negative" : "is-neutral",
	};
}

/**
 * Convert hit points to one of five states: empty through four filled quarters.
 *
 * @param {number} value Current hit points.
 * @param {number} maximum Maximum hit points.
 * @param {number} [segmentCount=HEALTH_SEGMENTS] Number of segments in the bar.
 * @returns {number}
 */
function getFilledSegments(value, maximum, segmentCount = HEALTH_SEGMENTS) {
	if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0 || value <= 0) {
		return 0;
	}

	return Math.min(segmentCount, Math.ceil((value / maximum) * segmentCount));
}

/**
 * Return only the special 4e monster classifications requested by the display.
 *
 * @param {Actor} actor The displayed actor.
 * @returns {{key: string, label: string, icon?: string}|null}
 */
function getSpecialRole(actor) {
	const role = actor.system?.details?.role ?? {};

	if (role.secondary === "solo" || role.primary === "solo") {
		return {
			key: "solo",
			label: "Solo",
			icon: "fa-solid fa-skull",
		};
	}

	if (role.leader) {
		return {
			key: "leader",
			label: "Leader",
			icon: "fa-solid fa-star",
		};
	}

	if (role.secondary === "elite" || role.primary === "elite") {
		return {
			key: "elite",
			label: "Elite",
			icon: "fa-solid fa-diamond",
		};
	}

	if (role.secondary === "minion" || role.primary === "minion") {
		return {
			key: "minion",
			label: "Minion",
		};
	}

	return null;
}

/**
 * Collect enabled temporary effects and conditions for display.
 *
 * @param {Actor} actor The displayed actor.
 * @returns {ActiveEffect[]}
 */
function getShownEffects(actor) {
	return Array.from(actor.effects ?? []).filter((effect) => {
		const isStatus = (effect.statuses?.size ?? 0) > 0;
		return (effect.isTemporary || isStatus) && !effect.disabled && !effect.isSuppressed;
	});
}

/**
 * Convert displayed effects to template data.
 *
 * @param {ActiveEffect[]} effects The displayed effects.
 * @returns {Array<{name: string, img: string, duration: object|null}>}
 */
function getEffectDisplayData(effects) {
	return effects.map((effect) => ({
			name: getEffectLabel(effect, showDescriptions),
			img: effect.img || effect.icon || "icons/svg/aura.svg",
			duration: getEffectDuration(effect),
		}));
}

/**
 * Use condition names and temporary-effect descriptions in the compact list.
 *
 * @param {ActiveEffect} effect The displayed effect.
 * @param {boolean} useDescription Whether descriptions should replace effect names.
 * @returns {string}
 */
function getEffectLabel(effect, useDescription) {
	if (!useDescription || (effect.statuses?.size ?? 0) > 0) {
		return effect.name;
	}

	const description = document.createElement("div");
	description.innerHTML = effect.description ?? "";
	return description.textContent?.trim() || effect.name;
}

/**
 * Build the short duration label shown beneath an effect name.
 *
 * @param {ActiveEffect} effect The displayed effect.
 * @returns {{label: string}|null}
 */
function getEffectDuration(effect) {
	const durationType = effect.system?.durationType;
	let label;

	switch (durationType) {
		case "endOfEncounter":
			label = "Encounter";
			break;
		case "saveEnd":
			label = "Save Ends";
			break;
		case "endOfTargetTurn":
			label = `EoT ${effect.parent?.name ?? "Target"}`;
			break;
		case "endOfUserTurn":
			label = `EoT ${getEffectSourceActor(effect)?.name ?? "User"}`;
			break;
		case "startOfTargetTurn":
		case "startOfUserTurn":
			label = effect.duration?.label || durationType;
			break;
		case "custom":
			label = effect.duration?.label || "Custom";
			break;
		default:
			return null;
	}

	return { label };
}

/**
 * Resolve the actor which originated an applied ActiveEffect.
 *
 * @param {ActiveEffect} effect The displayed effect.
 * @returns {Actor|null}
 */
function getEffectSourceActor(effect) {
	if (!effect.origin) {
		return null;
	}

	try {
		const origin = fromUuidSync(effect.origin);

		if (origin?.documentName === "Actor") {
			return origin;
		}

		return origin?.actor ?? null;
	} catch (_error) {
		return null;
	}
}

/**
 * Toggle description previews while Shift is held.
 *
 * @param {KeyboardEvent} event The keyboard event.
 */
function onModifierChange(event) {
	if (!game.settings.get("dnd4e-health-display", SHIFT_DESCRIPTIONS_SETTING)) {
		return;
	}

	const nextValue = event.shiftKey;

	if (nextValue === showDescriptions) {
		return;
	}

	showDescriptions = nextValue;

	if (hoveredToken) {
		void renderDisplay(hoveredToken);
	}
}

/** Clear modifier state if the browser loses focus. */
function clearModifiers() {
	if (!showDescriptions) {
		return;
	}

	showDescriptions = false;

	if (hoveredToken) {
		void renderDisplay(hoveredToken);
	}
}

/**
 * Refresh when the hovered actor changes.
 *
 * @param {Actor} actor The changed actor.
 */
function refreshForActor(actor) {
	if (hoveredToken?.actor?.id === actor.id) {
		void renderDisplay(hoveredToken);
	}
}

/**
 * Refresh when the hovered token changes.
 *
 * @param {TokenDocument} tokenDocument The changed token document.
 */
function refreshForToken(tokenDocument) {
	if (hoveredToken?.document?.id === tokenDocument.id) {
		void renderDisplay(hoveredToken);
	}
}

/**
 * Refresh when one of the hovered actor's effects changes.
 *
 * @param {ActiveEffect} effect The changed effect.
 */
function refreshForEffect(effect) {
	if (hoveredToken?.actor?.id === effect.parent?.id) {
		void renderDisplay(hoveredToken);
	}
}

/** Hide and invalidate the current hover display. */
function hideDisplay() {
	hoveredToken = null;
	renderSequence += 1;
	ensureDisplay().hidden = true;
}
