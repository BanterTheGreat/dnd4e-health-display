# Changelog

## Unreleased

Added an NPC Traits tab to the actor display, listing trait and racial-feat feature items with consistent feat roll, sheet, and tooltip interactions. NPC power entries now show enriched attack and rules details inline, using the compact generated power-card format with the DnD4e system card as a fallback for custom-authored powers; expended powers omit flavour text, while PC entries show their short flavour text below the title. Added an independent Team display that follows the legacy player-token selection policy and presents party portraits, names, hit points, and healing surges as tight vitality seals. Refined the compact defense and initiative rail with consistent inline labels, reworked the editable health resources into an actor-appropriate, quantized segmented dial with compact temporary-HP and surge counters that save on Enter or focus loss, and improved item-power and inventory-row treatments. Added a close button to the actor display that keeps it hidden until a token is selected again.

## 1.1.0

Rebranded the module as DnD4e Info Displays and separated the health-display and actor-display implementations. Added a controlled-token actor display with editable health resources, defenses and initiative, power usage, skill rolls, categorized feats and inventory, equipment toggles, rest and recovery actions, direct character-sheet access, and lazily rendered rules tooltips for powers, feats, and items. Expanded the hover health display with actor classifications, effect summaries, NPC traits, combat modifiers, and richer health states.
