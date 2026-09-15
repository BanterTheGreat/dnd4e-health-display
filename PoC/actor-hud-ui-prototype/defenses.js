// Three compact defense rails on the Vitals Variant B actor-HUD baseline, switchable with ?variant=A, B, or C.
const defenses = [
	{ key: "A", name: "Reference Rail" },
	{ key: "B", name: "AC Anchor" },
	{ key: "C", name: "Inline Label Rail" },
];

const stats = [
	{ key: "ac", label: "Armor Class", short: "AC", value: 24, icon: "⬟" },
	{ key: "fort", label: "Fortitude", short: "Fort", value: 23, icon: "♜" },
	{ key: "ref", label: "Reflex", short: "Ref", value: 21, icon: "◈" },
	{ key: "will", label: "Will", short: "Will", value: 20, icon: "◉" },
	{ key: "init", label: "Initiative", short: "Init", value: "+8", icon: "♟" },
];

function referenceRail() {
	return `<section class="defenses reference-rail" aria-label="Defenses and initiative">
		${stats.map((stat) => `<div class="rail-stat ${stat.key}" title="${stat.label}"><i>${stat.icon}</i><strong>${stat.value}</strong><span>${stat.short}</span></div>`).join("")}
	</section>`;
}

function acAnchor() {
	const [ac, ...otherStats] = stats;
	return `<section class="defenses ac-anchor" aria-label="Defenses and initiative">
		<div class="anchor-stat ${ac.key}" title="${ac.label}"><i>${ac.icon}</i><div><span>${ac.label}</span><strong>${ac.value}</strong></div></div>
		<div class="anchor-others">${otherStats.map((stat) => `<div class="rail-stat ${stat.key}" title="${stat.label}"><i>${stat.icon}</i><strong>${stat.value}</strong><span>${stat.short}</span></div>`).join("")}</div>
	</section>`;
}

function twoTierRail() {
	return `<section class="defenses two-tier-rail" aria-label="Defenses and initiative">
		${stats.map((stat) => `<div class="wide-stat ${stat.key}" title="${stat.label}"><i>${stat.icon}</i><span>${stat.short}</span><strong>${stat.value}</strong></div>`).join("")}
	</section>`;
}

function currentVariant() {
	const key = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
	return defenses.find((variant) => variant.key === key) ?? defenses[0];
}

function render() {
	const variant = currentVariant();
	document.querySelector("#defenses-root").innerHTML = { A: referenceRail, B: acAnchor, C: twoTierRail }[variant.key]();
	document.querySelector("#variant-label").textContent = `${variant.key} · ${variant.name}`;
}

function changeVariant(direction) {
	const index = defenses.findIndex((variant) => variant.key === currentVariant().key);
	const next = defenses[(index + direction + defenses.length) % defenses.length];
	const url = new URL(window.location.href);
	url.searchParams.set("variant", next.key);
	window.history.replaceState({}, "", url);
	render();
}

document.querySelector(".prototype-switcher").addEventListener("click", (event) => {
	const button = event.target.closest("[data-direction]");
	if (button) {
		changeVariant(Number(button.dataset.direction));
	}
});

window.addEventListener("keydown", (event) => {
	if (["INPUT", "TEXTAREA"].includes(event.target.tagName) || event.target.isContentEditable) {
		return;
	}
	if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
		changeVariant(event.key === "ArrowLeft" ? -1 : 1);
	}
});

render();
