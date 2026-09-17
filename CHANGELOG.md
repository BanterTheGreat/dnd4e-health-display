# Changelog

## Unreleased

Added an independent Battle Briefing submodule with a GM combat-tracker control, reusable world presets for encounter titles, descriptions, commander subtitles, and commander-art alignment and zoom, synchronized player briefings built from the active combat roster and actor artwork, and a GM-only Strategy placeholder tab. The tracker control creates an encounter for the active scene when needed. Its preparation window shows the current encounter roster in a dedicated side column, can bulk-add all friendly, neutral, or hostile scene tokens, lets the GM toggle combatant visibility, and lets the GM choose which visible hostile appears as the enemy commander. Hidden tokens are omitted from the briefing. Supporting-enemy and player portraits provide enlarged artwork previews on hover or keyboard focus. The player briefing shows current initiative values and lets each player roll initiative for their owned combatant, while the GM action rolls initiative for every NPC, begins the encounter, and dismisses the briefing for all connected users.

NPC attacking powers and feature abilities now open the DnD4e attack-roll dialog from the Actor display instead of posting their item cards directly to chat, consuming limited power uses as normal. NPC powers now also provide separate controls to send their cards to chat or roll their damage, while player-character powers can expand individually to show the same complete rules details used for NPC powers.

Added a live, case-insensitive search field to player-character Powers tabs, filtering cards and their empty categories by power name as the user types.

Added a client-persisted Powers-tab control for player characters which hides or restores their short power flavour text.

Added an independent mark-display overlay that uses DnD4e's mark ownership data to draw directional marker-to-marked token connections, including plain and numbered mark statuses, with a client setting to show or hide them.

Refined mark connectors with a subtle dark under-stroke for map contrast, rounded slimmer gold lines, outlined barbed spearheads that remain clear of marked token artwork, and small offsets between a marker's concurrent connections. Visible arrowheads now animate with a subtle pulse.

Mark connections now appear only while either linked token is hovered or controlled.

## 2.0

Streamlined the actor display typography to Signika for interface and supporting text, reserving Modesto Condensed for character identity and headline resource values while retaining italic flavour copy.

Added a client-persisted status-only mode for the actor display. Collapse it from the new control at the bottom of the display to hide tabs, detail content, and quick actions while retaining the identity, hit points, player-character healing surges, defenses, and initiative; use the compact control to restore the full display. NPCs omit the unused healing-surge counter and meter. Refreshing an expended power now privately notifies every online GM with the character and ability involved.

Added an NPC Features tab to the actor display, grouping trait and racial-feat feature items with their descriptions above the NPC's categorized power list, with consistent feat roll, sheet, and tooltip interactions. NPC power entries now show enriched attack and rules details inline, using the compact generated power-card format with the DnD4e system card as a fallback for custom-authored powers; expended powers omit flavour text, while PC entries show their short flavour text below the title. Added an independent Team display that follows the legacy player-token selection policy and presents party portraits and names with segmented hit-point and healing-surge vitality seals; the seals show their enlarged resource labels without numeric values. Refined the compact defense and initiative rail with consistent inline labels, reworked the editable health resources into an actor-appropriate, quantized segmented dial with compact temporary-HP and surge counters that save on Enter or focus loss, and improved item-power and inventory-row treatments. Offset the Actor and Team resource circles slightly so their segment and progress boundaries fall more naturally. Added a close button to the actor display that keeps it hidden until a token is selected again.

## 1.1.0

Rebranded the module as DnD4e Info Displays and separated the health-display and actor-display implementations. Added a controlled-token actor display with editable health resources, defenses and initiative, power usage, skill rolls, categorized feats and inventory, equipment toggles, rest and recovery actions, direct character-sheet access, and lazily rendered rules tooltips for powers, feats, and items. Expanded the hover health display with actor classifications, effect summaries, NPC traits, combat modifiers, and richer health states.
