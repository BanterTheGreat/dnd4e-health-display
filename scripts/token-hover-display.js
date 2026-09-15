const DISPLAY_ID = "dnd4e-token-hover-display";
const DISPLAY_TEMPLATE = "modules/dnd4e-health-display/scripts/token-hover-display.hbs";
const STYLESHEET_ID = "dnd4e-health-display-styles";
const STYLESHEET_PATH = "modules/dnd4e-health-display/styles/token-hover-display.css";
const HEALTH_SEGMENTS = 4;

let hoveredToken = null;
let renderSequence = 0;

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
	stylesheet.href = `${STYLESHEET_PATH}?v=${encodeURIComponent(version)}`;
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
	const filledSegments = getFilledSegments(value, maximum);

	return {
		name: token.name || actor.name,
		role: getSpecialRole(actor),
		segments: Array.from({ length: HEALTH_SEGMENTS }, (_unused, index) => ({
			filled: index < filledSegments,
		})),
		effects: getTemporaryEffects(actor),
	};
}

/**
 * Convert hit points to one of five states: empty through four filled quarters.
 *
 * @param {number} value Current hit points.
 * @param {number} maximum Maximum hit points.
 * @returns {number}
 */
function getFilledSegments(value, maximum) {
	if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0 || value <= 0) {
		return 0;
	}

	return Math.min(HEALTH_SEGMENTS, Math.ceil((value / maximum) * HEALTH_SEGMENTS));
}

/**
 * Return only the special 4e monster classifications requested by the display.
 *
 * @param {Actor} actor The displayed actor.
 * @returns {string}
 */
function getSpecialRole(actor) {
	const role = actor.system?.details?.role ?? {};

	if (role.leader) {
		return "Leader";
	}

	if (role.secondary === "minion" || role.primary === "minion") {
		return "Minion";
	}

	if (role.secondary === "solo" || role.primary === "solo") {
		return "Solo";
	}

	return "";
}

/**
 * Collect enabled temporary effects and conditions for display.
 *
 * @param {Actor} actor The displayed actor.
 * @returns {Array<{name: string, img: string}>}
 */
function getTemporaryEffects(actor) {
	return Array.from(actor.effects ?? [])
		.filter((effect) => {
			const isStatus = (effect.statuses?.size ?? 0) > 0;
			return (effect.isTemporary || isStatus) && !effect.disabled && !effect.isSuppressed;
		})
		.map((effect) => ({
			name: effect.name,
			img: effect.img || effect.icon || "icons/svg/aura.svg",
		}));
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
