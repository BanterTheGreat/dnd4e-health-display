# Team display UI prototype

Throwaway visual prototype for the Actor Display team menu. It deliberately contains only portrait, character name, hit points, and healing surges; conditions are out of scope.

## Run it

From this directory, start a local server:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). Use the floating arrows (or left/right arrow keys) to switch variants; their URLs are shareable as `?variant=A`, `?variant=B`, `?variant=C`, `?variant=D`, and `?variant=E`.

Stop the server with `Ctrl+C` when finished. Opening `index.html` directly in a browser also works, but the local server is the recommended route.

- **A — Banner Cards:** portrait-forward two-column layout.
- **B — Roster, Token & Pips:** HP token plus a visible surge inventory.
- **C — Party Ledger:** table-like health-first view.
- **D — Roster, Resource Ribbons:** compact, parallel HP and surge bars.
- **E — Roster, Vitality Seals:** paired circular counters with percentage rings.

This is not production code. Once a direction is selected, recreate the winner within the Actor Display’s template, data module, and stylesheet, then move this prototype to a throwaway branch.
