# Too Much Too Track

Foundry VTT v14 module for the DnD4e system that provides a compact actor HUD and a party health bar. It targets the DnD4e system's [`0.9.3` source](https://github.com/EndlesNights/dnd4eBeta/tree/0.9.3); confirm system APIs against that tag before relying on current upstream behavior.

## Layout

- `main.js` registers Foundry hooks

## Architecture

## Working conventions

- We don't need to make Markdown research documents.
- Use ES modules, Foundry hooks, and the DnD4e system API; preserve v12 compatibility unless intentionally upgrading it.
- Use braced, multiline `if` blocks. Document methods with JSDoc, using multiline JSDoc blocks whenever practical.
- Prefer Foundry APIs (`foundry.utils`, document flags, embedded documents) and keep asynchronous document changes awaited.
- Keep UI markup in Handlebars parts and presentation rules in the dialog stylesheet.
- Match the existing simple JavaScript style: direct Foundry globals, small focused helpers, pragmatic comments, and short guard clauses. Document reusable module methods with JSDoc when it clarifies their contract.
- Changes that affect initial hooks or the manifest should be tested by reloading Foundry and checking the browser console. There is no automated test or build setup.
- Changelog entries are release summaries, not per-change notes. Since the previous version, record new features and changed behavior in concise prose suitable for future regression review.
