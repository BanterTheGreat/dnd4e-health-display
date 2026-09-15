# Actor HUD UI prototype

Throwaway visual prototype answering: **What should a compact controlled-token HUD look like when it shares the health display's visual language?**

Layout A is the selected direction and is receiving further refinement. The earlier variants remain available for comparison through the bottom switcher, the left/right arrow keys, or the URL:

- `?variant=A` — Threatglass: compact vertical command panel
- `?variant=B` — Battleline: wide bottom action dock
- `?variant=C` — Field Ledger: narrow tactical character sheet

Run from the module root:

```sh
python3 -m http.server 4173 --directory PoC/actor-hud-ui-prototype
```

Then open <http://localhost:4173/?variant=A>.

This prototype uses realistically dense sample data and does not mutate Foundry documents. It includes:

- 25 powers grouped by action type, with at-will, encounter, and daily treatments
- Skills with roll modifiers
- Feats grouped by category
- Items with interactive equip toggles
- AC, Fortitude, Reflex, Will, and Initiative
- HP, temporary HP, healing surges, and quick-access actions

Power buttons preview used/depleted states; skills, feats, and quick actions report their intended action. It is deliberately isolated from `module.json` and production module code.
# Actor HUD UI prototypes

Open `index.html` for the complete HUD explorations. Open `vitals.html` for three throwaway alternatives focused only on Hit Points, Temporary Hit Points, and Healing Surges. Use the on-screen arrows or the keyboard arrow keys to switch variants; the selected variant is stored in the `?variant=` URL parameter.
