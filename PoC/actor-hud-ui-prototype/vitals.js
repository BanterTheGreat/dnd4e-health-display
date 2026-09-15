// Three actor-HUD vitals variants, switchable with ?variant=A, B, or C.
const actor = { hp: 43, maxHp: 67, tempHp: 8, surges: 7, maxSurges: 12 };
const variants = [
	{ key: "A", name: "Vital Ledger" },
	{ key: "B", name: "Life Dial" },
	{ key: "C", name: "Battle Track" },
];

function surgeMarks(className = "") {
	return Array.from({ length: actor.maxSurges }, (_unused, index) =>
		`<i class="${index < actor.surges ? "is-filled" : ""} ${className}"></i>`).join("");
}

function variantA() {
	return `<section class="vitals ledger-vitals">
		<div class="ledger-hp"><span>Hit Points</span><strong>${actor.hp}</strong><small>/ ${actor.maxHp}</small></div>
		<div class="wound-track"><i style="width:${actor.hp / actor.maxHp * 100}%"></i><b>Bloodied at ${Math.floor(actor.maxHp / 2)}</b></div>
		<div class="temp-shield"><span>Temporary</span><strong>+${actor.tempHp}</strong></div>
		<div class="surge-coins"><span>Healing Surges</span><div>${surgeMarks("coin")}</div><strong>${actor.surges}<small> / ${actor.maxSurges}</small></strong></div>
	</section>`;
}

function variantB() {
	const hpAngle = Math.round(actor.hp / actor.maxHp * 360);
	return `<section class="vitals dial-vitals">
		<div class="life-dial" style="--hp-angle:${hpAngle}deg"><div><span>HP</span><strong>${actor.hp}</strong><small>of ${actor.maxHp}</small></div></div>
		<div class="dial-counters">
			<div class="counter temp-counter"><i>⬟</i><span>Temp HP</span><strong>+${actor.tempHp}</strong></div>
			<div class="counter surge-counter"><i>✦</i><span>Surges</span><strong>${actor.surges}<small> / ${actor.maxSurges}</small></strong></div>
			<div class="mini-surges">${surgeMarks()}</div>
		</div>
	</section>`;
}

function variantC() {
	return `<section class="vitals track-vitals">
		<div class="track-labels"><span>Protection</span><span>Health</span></div>
		<div class="battle-track" aria-label="${actor.tempHp} temporary and ${actor.hp} current hit points">
			<div class="temp-track" style="flex:${actor.tempHp}"><b>+${actor.tempHp}</b></div>
			<div class="hp-track" style="flex:${actor.hp}"><b>${actor.hp}</b></div>
			<div class="lost-track" style="flex:${actor.maxHp - actor.hp}"><b>−${actor.maxHp - actor.hp}</b></div>
		</div>
		<div class="track-scale"><span>Temp</span><span>${actor.hp} / ${actor.maxHp} HP</span><span>Lost</span></div>
		<div class="surge-charges"><span>Healing Surges</span><div>${surgeMarks("charge")}</div><strong>${actor.surges} left</strong></div>
	</section>`;
}

function currentVariant() {
	const key = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
	return variants.find((variant) => variant.key === key) ?? variants[0];
}

function render() {
	const variant = currentVariant();
	document.querySelector("#vitals-root").innerHTML = { A: variantA, B: variantB, C: variantC }[variant.key]();
	document.querySelector("#variant-label").textContent = `${variant.key} · ${variant.name}`;
}

function changeVariant(direction) {
	const index = variants.findIndex((variant) => variant.key === currentVariant().key);
	const next = variants[(index + direction + variants.length) % variants.length];
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
