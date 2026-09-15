const actor = {
	name: "Beltane",
	level: 10,
	className: "Warlord",
	title: "Banner of the Last Watch",
	hp: 43,
	maxHp: 67,
	tempHp: 8,
	surges: 7,
	maxSurges: 7,
	stats: [
		{ label: "AC", value: 24, icon: "⬟" },
		{ label: "Fort", value: 23, icon: "♜" },
		{ label: "Reflex", value: 21, icon: "ϟ" },
		{ label: "Will", value: 20, icon: "●" },
		{ label: "Initiative", value: "+8", icon: "➜" },
	],
	quickActions: [
		{ label: "Use AP", detail: "1", icon: "ϟ" },
		{ label: "Saving Throw", detail: "", icon: "◉" },
		{ label: "Heal", detail: "", icon: "+" },
		{ label: "Second Wind", detail: "", icon: "⬟" },
		{ label: "Short Rest", detail: "", icon: "☾" },
		{ label: "Extended Rest", detail: "", icon: "☽" },
		{ label: "Death Save", detail: "", icon: "☠" },
		{ label: "Open Sheet", detail: "", icon: "▤" },
	],
	powers: [
		["basic-melee", "Basic Attack (Melee)", "Standard", "atwill", "⚔", "+14 vs AC · 1d8 + 7"],
		["basic-ranged", "Basic Attack (Ranged)", "Standard", "atwill", "➶", "+13 vs AC · 1d10 + 5"],
		["charge", "Charge", "Standard", "atwill", "➜", "Move and make a basic attack"],
		["commanders-strike", "Commander's Strike", "Standard", "atwill", "✦", "Ally makes a basic attack"],
		["wolf-pack", "Wolf Pack Tactics", "Standard", "atwill", "➶", "+14 vs AC · Shift an ally"],
		["furious-smash", "Furious Smash", "Standard", "atwill", "◆", "+12 vs Fortitude · Grant attack bonus"],
		["guarding-attack", "Guarding Attack", "Standard", "encounter", "◆", "+14 vs AC · Ally gains +2 AC"],
		["warlords-favor", "Warlord's Favor", "Standard", "encounter", "★", "+14 vs AC · Ally gains +5 attack"],
		["hammer-and-anvil", "Hammer and Anvil", "Standard", "encounter", "⚒", "Ally makes a melee basic attack"],
		["bastion", "Bastion of Defense", "Standard", "daily", "⬟", "Allies gain +1 defense"],
		["lead-the-attack", "Lead the Attack", "Standard", "daily", "✹", "Allies gain an attack bonus"],
		["stand-the-fallen", "Stand the Fallen", "Standard", "daily", "+", "Allies spend healing surges"],
		["knights-move", "Knight's Move", "Move", "encounter", "➜", "An ally moves half speed"],
		["tactical-shift", "Tactical Shift", "Move", "encounter", "⇢", "Shift yourself or an ally"],
		["adaptable-flanker", "Adaptable Flanker", "Move", "atwill", "◇", "Move into a flanking position"],
		["inspiring-word", "Inspiring Word", "Minor", "encounter", "+", "Ally spends a healing surge", "1 / 2"],
		["adaptive-stratagem", "Adaptive Stratagem", "Minor", "daily", "★", "Grant an ally a tactical bonus"],
		["battlefront-shift", "Battlefront Shift", "Minor", "encounter", "↗", "An ally shifts before combat"],
		["rallying-cry", "Rallying Cry", "Minor", "daily", "◈", "Nearby allies gain temporary HP"],
		["vengeance-is-mine", "Vengeance Is Mine", "Reaction", "encounter", "↯", "React when an enemy hits you"],
		["brace-for-impact", "Brace for Impact", "Interrupt", "encounter", "⬟", "Reduce damage to an ally"],
		["no-gambit-wasted", "No Gambit Wasted", "Reaction", "daily", "↻", "Turn an ally's miss into advantage"],
		["mob-mentality", "Mob Mentality", "Free", "encounter", "✣", "Gain a bonus from adjacent allies"],
		["race-the-arrow", "Race the Arrow", "Free", "encounter", "➶", "Move when an ally attacks"],
		["total-defense", "Total Defense", "Standard", "atwill", "⬢", "+2 to all defenses"],
	].map(([id, name, action, usage, icon, detail, uses]) => ({ id, name, action, usage, icon, detail, uses })),
	skills: [
		["Acrobatics", 9], ["Arcana", 7], ["Athletics", 13], ["Bluff", 12], ["Diplomacy", 17],
		["Dungeoneering", 8], ["Endurance", 14], ["Heal", 12], ["History", 11], ["Insight", 12],
		["Intimidate", 17], ["Nature", 8], ["Perception", 10], ["Religion", 7], ["Stealth", 9],
		["Streetwise", 12], ["Thievery", 9],
	],
	feats: [
		{ category: "Class", name: "Improved Inspiring Word" },
		{ category: "Class", name: "Tactical Assault" },
		{ category: "Combat", name: "Weapon Expertise" },
		{ category: "Combat", name: "Weapon Focus" },
		{ category: "Defense", name: "Improved Defenses" },
		{ category: "Defense", name: "Toughness" },
		{ category: "General", name: "Skill Training: Intimidate" },
		{ category: "Racial", name: "Elven Precision" },
	],
	items: [
		{ id: "longsword", name: "+2 Tactical Longsword", type: "Weapon", equipped: true, detail: "1d8 · Versatile" },
		{ id: "crossbow", name: "+2 Distance Crossbow", type: "Weapon", equipped: true, detail: "1d10 · Load minor" },
		{ id: "scale", name: "+2 Veteran's Scale Armor", type: "Armor", equipped: true, detail: "+9 AC · Heavy" },
		{ id: "amulet", name: "+2 Amulet of Protection", type: "Neck", equipped: true, detail: "+2 Fort, Ref, Will" },
		{ id: "boots", name: "Boots of the Fencing Master", type: "Feet", equipped: true, detail: "Shift grants +1 AC and Reflex" },
		{ id: "gauntlets", name: "Gauntlets of Blood", type: "Hands", equipped: false, detail: "+2 damage against bloodied foes" },
		{ id: "potion", name: "Potion of Healing", type: "Consumable", equipped: false, detail: "Quantity 3" },
		{ id: "rope", name: "Silk Rope", type: "Gear", equipped: false, detail: "50 feet" },
		{ id: "kit", name: "Adventurer's Kit", type: "Gear", equipped: false, detail: "Standard supplies" },
	],
};

const variants = [
	{ key: "A", name: "Threatglass" },
	{ key: "B", name: "Battleline" },
	{ key: "C", name: "Field Ledger" },
];
const sections = ["Powers", "Skills", "Feats", "Items"];
const usedPowers = new Set(["guarding-attack"]);
let activeSection = "Powers";
let activeCategory = "All";

function getVariant() {
	const requested = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
	return variants.find((variant) => variant.key === requested) ?? variants[0];
}

function setVariant(direction) {
	const index = variants.findIndex((variant) => variant.key === getVariant().key);
	const next = variants[(index + direction + variants.length) % variants.length];
	const url = new URL(window.location.href);
	url.searchParams.set("variant", next.key);
	window.history.replaceState({}, "", url);
	render();
}

function healthBar(kind = "hp") {
	const current = kind === "hp" ? actor.hp : actor.surges;
	const maximum = kind === "hp" ? actor.maxHp : actor.maxSurges;
	return `<div class="meter meter-${kind}" aria-label="${kind}: ${current} of ${maximum}"><span style="width:${Math.round((current / maximum) * 100)}%"></span></div>`;
}

function identity(compact = false) {
	return `<header class="identity${compact ? " is-compact" : ""}"><div class="portrait" aria-hidden="true"><span>B</span></div><div class="identity-copy"><h1>${actor.name}</h1><p>Level ${actor.level} ${actor.className}</p><small>${actor.title}</small></div></header>`;
}

function vital(label, value, maximum) {
	return `<div class="vital"><span>${label}</span><strong>${value}</strong>${maximum ? `<small>/ ${maximum}</small>` : ""}</div>`;
}

function stats(style = "strip") {
	return `<section class="stat-${style}" aria-label="Defenses and initiative">${actor.stats.map((stat) => `<div title="${stat.label}"><span>${stat.icon}</span><strong>${stat.value}</strong><small>${stat.label}</small></div>`).join("")}</section>`;
}

function quickActions(style = "strip") {
	return `<section class="quick-${style}" aria-label="Quick actions">${actor.quickActions.map((action) => `<button type="button" data-demo-action="${action.label}"><span>${action.icon}</span><strong>${action.label}</strong>${action.detail ? `<small>${action.detail}</small>` : ""}</button>`).join("")}</section>`;
}

function sectionNav(style = "tabs") {
	const icons = { Powers: "⚔", Skills: "◆", Feats: "▤", Items: "▣" };
	return `<nav class="section-${style}">${sections.map((section) => `<button type="button" data-section="${section}" class="${activeSection === section ? "is-active" : ""}"><span>${icons[section]}</span>${section}</button>`).join("")}</nav>`;
}

function powerButton(power, detailed = false) {
	const used = usedPowers.has(power.id);
	return `<button class="power power-${power.usage}${used ? " is-used" : ""}" data-power-id="${power.id}" type="button"><span class="power-icon" aria-hidden="true">${power.icon}</span><span class="power-copy"><strong>${power.name}</strong>${detailed ? `<small>${power.detail}</small>` : ""}</span>${power.uses ? `<em>${power.uses}</em>` : ""}${used ? `<span class="used-mark">Spent</span>` : ""}</button>`;
}

function powersContent(layout) {
	const categories = ["Standard", "Move", "Minor", "Reaction", "Interrupt", "Free"];
	if (layout === "grid") {
		const filters = ["All", ...categories];
		const visible = activeCategory === "All" ? actor.powers : actor.powers.filter((power) => power.action === activeCategory);
		return `<nav class="category-rail">${filters.map((category) => `<button class="${category === activeCategory ? "is-active" : ""}" data-category="${category}">${category}</button>`).join("")}</nav><div class="power-grid">${visible.map((power) => powerButton(power, true)).join("")}</div>`;
	}

	return `<div class="power-groups">${categories.map((category) => {
		const powers = actor.powers.filter((power) => power.action === category);
		return powers.length ? `<section class="power-group"><h2>${category}<span>${powers.length}</span></h2>${powers.map((power) => powerButton(power, layout === "detailed")).join("")}</section>` : "";
	}).join("")}</div>`;
}

function skillsContent() {
	return `<div class="skill-list">${actor.skills.map(([name, modifier]) => `<button type="button" data-demo-action="Roll ${name}"><span>${name}</span><strong>${modifier >= 0 ? "+" : ""}${modifier}</strong><small>Roll</small></button>`).join("")}</div>`;
}

function featsContent() {
	const categories = [...new Set(actor.feats.map((feat) => feat.category))];
	return `<div class="feat-list">${categories.map((category) => `<section><h2>${category}</h2>${actor.feats.filter((feat) => feat.category === category).map((feat) => `<button type="button" data-demo-action="Open ${feat.name}"><strong>${feat.name}</strong></button>`).join("")}</section>`).join("")}</div>`;
}

function itemsContent() {
	return `<div class="item-list">${actor.items.map((item) => `<div class="item-row"><span class="item-glyph">${item.equipped ? "◆" : "◇"}</span><button type="button" class="item-name" data-demo-action="Open ${item.name}"><strong>${item.name}</strong><small>${item.type} · ${item.detail}</small></button><button type="button" class="equip-toggle${item.equipped ? " is-equipped" : ""}" data-item-id="${item.id}">${item.equipped ? "Equipped" : "Equip"}</button></div>`).join("")}</div>`;
}

function sectionContent(powerLayout) {
	return {
		Powers: () => powersContent(powerLayout),
		Skills: skillsContent,
		Feats: featsContent,
		Items: itemsContent,
	}[activeSection]();
}

function vitals() {
	return `<section class="vitals-band"><div class="hp-block"><div class="vitals-row">${vital("HP", actor.hp, actor.maxHp)}${vital("Temp", actor.tempHp)}</div>${healthBar("hp")}</div><div class="surge-block">${vital("Surges", actor.surges, actor.maxSurges)}${healthBar("surges")}</div></section>`;
}

function threatglassVitals() {
	const filledHealth = Math.ceil((actor.hp / actor.maxHp) * 6);
	const healthSegments = Array.from({ length: 6 }, (_unused, index) => `<i class="${index < filledHealth ? "is-filled" : ""}"></i>`).join("");
	const surgeMarks = Array.from({ length: actor.maxSurges }, (_unused, index) => `<i class="${index < actor.surges ? "is-filled" : ""}"></i>`).join("");

	return `<section class="threatglass-vitals">
		<div class="health-readout"><span>Hit Points</span><strong>${actor.hp}</strong><small>of ${actor.maxHp}</small></div>
		<div class="health-segments" aria-label="Hit points: ${actor.hp} of ${actor.maxHp}">${healthSegments}</div>
		<div class="temp-readout"><span>Temp HP</span><strong>+${actor.tempHp}</strong></div>
		<div class="surge-readout"><span>Healing Surges</span><div class="surge-marks" style="--surge-count: ${actor.maxSurges}" role="img" aria-label="Healing surges: ${actor.surges} of ${actor.maxSurges}">${surgeMarks}</div><strong>${actor.surges}<small> / ${actor.maxSurges}</small></strong></div>
	</section>`;
}

function variantA() {
	return `<article class="hud hud-a">${identity()}${threatglassVitals()}${stats("strip")}${sectionNav("tabs")}<div class="hud-workspace">${sectionContent("compact")}</div>${quickActions("footer")}</article>`;
}

function variantB() {
	return `<article class="hud hud-b"><div class="battleline-top">${identity(true)}<div>${vitals()}</div></div><div class="battleline-body"><aside>${stats("rail")}${quickActions("rail")}</aside><section class="battleline-main">${sectionNav("pills")}<div class="hud-workspace">${sectionContent("grid")}</div></section></div></article>`;
}

function variantC() {
	return `<article class="hud hud-c"><div class="ledger-rule"></div>${identity(true)}<section class="ledger-vitals"><div class="health-seal"><span>HP</span><strong>${actor.hp}</strong><small>of ${actor.maxHp}</small></div><div class="ledger-bars"><label>Vitality ${healthBar("hp")}</label><label>Surges ${healthBar("surges")}</label></div><div class="temp-seal"><span>Temp</span><strong>+${actor.tempHp}</strong></div></section>${stats("ledger")}${sectionNav("ledger")}<div class="hud-workspace ledger-workspace">${sectionContent("detailed")}</div>${quickActions("drawer")}</article>`;
}

function showToast(message) {
	const toast = document.querySelector("#action-toast");
	toast.textContent = `${message} · prototype only`;
	toast.classList.add("is-visible");
	window.setTimeout(() => toast.classList.remove("is-visible"), 1500);
}

function render() {
	const variant = getVariant();
	document.querySelector("#prototype-root").innerHTML = { A: variantA, B: variantB, C: variantC }[variant.key]();
	document.querySelector("#variant-label").textContent = `${variant.key} · ${variant.name} · ${activeSection}`;
}

document.querySelector(".prototype-switcher").addEventListener("click", (event) => {
	const button = event.target.closest("button[data-direction]");
	if (button) {
		setVariant(Number(button.dataset.direction));
	}
});

document.addEventListener("keydown", (event) => {
	if (!event.target.matches("input, textarea, [contenteditable]") && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
		setVariant(event.key === "ArrowLeft" ? -1 : 1);
	}
});

document.querySelector("#prototype-root").addEventListener("click", (event) => {
	const section = event.target.closest("[data-section]");
	if (section) {
		activeSection = section.dataset.section;
		render();
		return;
	}

	const category = event.target.closest("[data-category]");
	if (category) {
		activeCategory = category.dataset.category;
		render();
		return;
	}

	const equip = event.target.closest("[data-item-id]");
	if (equip) {
		const item = actor.items.find((candidate) => candidate.id === equip.dataset.itemId);
		item.equipped = !item.equipped;
		showToast(`${item.name} ${item.equipped ? "equipped" : "unequipped"}`);
		render();
		return;
	}

	const power = event.target.closest("[data-power-id]");
	if (power) {
		const item = actor.powers.find((candidate) => candidate.id === power.dataset.powerId);
		if (item.usage !== "atwill") {
			usedPowers.has(item.id) ? usedPowers.delete(item.id) : usedPowers.add(item.id);
		}
		showToast(`${item.name} selected`);
		render();
		return;
	}

	const demoAction = event.target.closest("[data-demo-action]");
	if (demoAction) {
		showToast(demoAction.dataset.demoAction);
	}
});

window.addEventListener("popstate", render);
render();
