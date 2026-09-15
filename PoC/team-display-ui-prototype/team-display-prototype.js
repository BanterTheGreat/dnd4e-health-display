/*
 * Throwaway prototype: team-display layouts, including three resource treatments for the compact roster.
 * It answers “which compact team view works beside the current actor HUD?”
 */

const party = [
	{ name: "Beltane", role: "Warlord", initials: "B", hp: 43, maxHp: 67, surges: 7, maxSurges: 7, portrait: "portrait--beltane" },
	{ name: "Kethra", role: "Ranger", initials: "K", hp: 22, maxHp: 54, surges: 4, maxSurges: 8, portrait: "portrait--kethra" },
	{ name: "Garrick", role: "Wizard", initials: "G", hp: 31, maxHp: 42, surges: 5, maxSurges: 6, portrait: "portrait--garrick" },
	{ name: "Nim", role: "Rogue", initials: "N", hp: 9, maxHp: 45, surges: 1, maxSurges: 7, portrait: "portrait--nim" },
];

const variants = [
	{ key: "A", name: "Banner Cards" },
	{ key: "B", name: "Roster · Token & Pips" },
	{ key: "C", name: "Party Ledger" },
	{ key: "D", name: "Roster · Resource Ribbons" },
	{ key: "E", name: "Roster · Vitality Seals" },
];

function variant() {
	const requested = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
	return variants.find((item) => item.key === requested) ?? variants[0];
}

function percentage(value, maximum) {
	return Math.max(0, Math.min(100, Math.round((value / maximum) * 100)));
}

function meter(label, value, maximum, type) {
	return `<div class="meter meter--${type}" aria-label="${label}: ${value} of ${maximum}">
		<div class="meter__label"><span>${label}</span><strong>${value}<small> / ${maximum}</small></strong></div>
		<div class="meter__track"><i style="width: ${percentage(value, maximum)}%"></i></div>
	</div>`;
}

function portrait(member, size = "") {
	return `<div class="portrait ${member.portrait} ${size}" aria-label="${member.name}"><span>${member.initials}</span></div>`;
}

function bannerCard(member) {
	return `<article class="banner-card ${percentage(member.hp, member.maxHp) <= 25 ? "is-critical" : ""}">
		${portrait(member)}
		<div class="banner-card__body"><header><div><h2>${member.name}</h2><small>${member.role}</small></div><span class="member-state">${percentage(member.hp, member.maxHp)}%</span></header>
		${meter("HP", member.hp, member.maxHp, "hp")}${meter("Surges", member.surges, member.maxSurges, "surges")}</div>
	</article>`;
}

function marchingVitals(member) {
	const surgePips = Array.from({ length: member.maxSurges }, (_unused, index) =>
		`<i class="${index < member.surges ? "is-filled" : ""}"></i>`,
	).join("");

	return `<div class="marching-vitals">
		<div class="marching-health" style="--health: ${percentage(member.hp, member.maxHp)}%" aria-label="Hit points: ${member.hp} of ${member.maxHp}">
			<strong>${member.hp}</strong><small>/${member.maxHp}</small>
		</div>
		<div class="marching-surges" aria-label="Healing surges: ${member.surges} of ${member.maxSurges}">
			<span>Surges</span><div class="marching-surge-pips">${surgePips}</div><strong>${member.surges}<small>/${member.maxSurges}</small></strong>
		</div>
	</div>`;
}

function marchingRow(member) {
	return `<article class="marching-row ${percentage(member.hp, member.maxHp) <= 25 ? "is-critical" : ""}">
		${portrait(member, "portrait--small")}
		<div class="marching-row__name"><h2>${member.name}</h2><small>${member.role}</small></div>
		${marchingVitals(member)}
	</article>`;
}

function ribbonVitals(member) {
	return `<div class="ribbon-vitals">
		<div class="resource-ribbon resource-ribbon--hp" style="--resource: ${percentage(member.hp, member.maxHp)}%" aria-label="Hit points: ${member.hp} of ${member.maxHp}">
			<span>HP</span><strong>${member.hp}<small>/${member.maxHp}</small></strong><i></i>
		</div>
		<div class="resource-ribbon resource-ribbon--surges" style="--resource: ${percentage(member.surges, member.maxSurges)}%" aria-label="Healing surges: ${member.surges} of ${member.maxSurges}">
			<span>SRG</span><strong>${member.surges}<small>/${member.maxSurges}</small></strong><i></i>
		</div>
	</div>`;
}

function ribbonRow(member) {
	return `<article class="marching-row marching-row--ribbons ${percentage(member.hp, member.maxHp) <= 25 ? "is-critical" : ""}">
		${portrait(member, "portrait--small")}
		<div class="marching-row__name"><h2>${member.name}</h2><small>${member.role}</small></div>
		${ribbonVitals(member)}
	</article>`;
}

function sealVitals(member) {
	return `<div class="seal-vitals">
		<div class="vitality-seal vitality-seal--hp" style="--resource: ${percentage(member.hp, member.maxHp)}%" aria-label="Hit points: ${member.hp} of ${member.maxHp}"><span>HP</span><strong>${member.hp}</strong><small>/${member.maxHp}</small></div>
		<div class="vitality-seal vitality-seal--surges" style="--resource: ${percentage(member.surges, member.maxSurges)}%" aria-label="Healing surges: ${member.surges} of ${member.maxSurges}"><span>SRG</span><strong>${member.surges}</strong><small>/${member.maxSurges}</small></div>
	</div>`;
}

function sealRow(member) {
	return `<article class="marching-row marching-row--seals ${percentage(member.hp, member.maxHp) <= 25 ? "is-critical" : ""}">
		${portrait(member, "portrait--small")}
		<div class="marching-row__name"><h2>${member.name}</h2><small>${member.role}</small></div>
		${sealVitals(member)}
	</article>`;
}

function ledgerRow(member) {
	return `<article class="ledger-row ${percentage(member.hp, member.maxHp) <= 25 ? "is-critical" : ""}">
		${portrait(member, "portrait--small")}<div class="ledger-row__name"><h2>${member.name}</h2><small>${member.role}</small></div>
		<div class="ledger-row__health"><strong>${member.hp}</strong><small>of ${member.maxHp} HP</small><div class="ledger-row__track"><i style="width:${percentage(member.hp, member.maxHp)}%"></i></div></div>
		<div class="ledger-row__surges"><span>Surges</span><strong>${member.surges}<small> / ${member.maxSurges}</small></strong></div>
	</article>`;
}

function render() {
	const current = variant();
	const content = {
		A: `<section class="team-panel team-panel--cards"><header class="team-panel__header"><span>Adventuring Company</span><small>Cards favour portraits and fast visual scanning</small></header><div class="banner-grid">${party.map(bannerCard).join("")}</div></section>`,
		B: `<section class="team-panel team-panel--marching"><header class="team-panel__header"><span>Adventuring Company</span><small>HP token plus a visible surge inventory</small></header><div class="marching-list">${party.map(marchingRow).join("")}</div></section>`,
		C: `<section class="team-panel team-panel--ledger"><header class="team-panel__header"><span>Adventuring Company</span><small>Table-like readout makes health the dominant signal</small></header><div class="ledger-head"><span>Hero</span><span>Hit points</span><span>Healing</span></div><div class="ledger-list">${party.map(ledgerRow).join("")}</div></section>`,
		D: `<section class="team-panel team-panel--marching team-panel--ribbons"><header class="team-panel__header"><span>Adventuring Company</span><small>Parallel resource ribbons: compare both values line by line</small></header><div class="marching-list">${party.map(ribbonRow).join("")}</div></section>`,
		E: `<section class="team-panel team-panel--marching team-panel--seals"><header class="team-panel__header"><span>Adventuring Company</span><small>Two equal resource seals: values first, proportion at the edge</small></header><div class="marching-list">${party.map(sealRow).join("")}</div></section>`,
	}[current.key];

	document.querySelector("#prototype-root").innerHTML = content;
	document.querySelector("#variant-label").textContent = `${current.key} · ${current.name}`;
}

function changeVariant(direction) {
	const currentIndex = variants.findIndex((item) => item.key === variant().key);
	const next = variants[(currentIndex + direction + variants.length) % variants.length];
	const url = new URL(window.location.href);
	url.searchParams.set("variant", next.key);
	window.history.replaceState({}, "", url);
	render();
}

document.querySelector(".prototype-switcher").addEventListener("click", (event) => {
	const button = event.target.closest("button[data-direction]");
	if (button) {
		changeVariant(Number(button.dataset.direction));
	}
});

document.addEventListener("keydown", (event) => {
	if (!event.target.matches("input, textarea, [contenteditable]") && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
		changeVariant(event.key === "ArrowLeft" ? -1 : 1);
	}
});

window.addEventListener("popstate", render);
render();
