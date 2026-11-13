# Capricorn front edge visibility

User screenshot shows the Woka hidden by Capricorn’s front wall. Hosted keyboard reproduction reaches x2200,y832 against the collision mask; collision stops correctly, but the lowest sprite row renders above the avatar and hides its head. This is map drawing order, not networking or an unblocked wall.

Scope: use the existing upperCells partition to draw only Capricorn’s lowest 32-pixel sprite row below avatars. Keep all upper rows above avatars, every collision cell, doorway/return control, artwork, sponsor/manual WAM area and board unchanged. Other buildings stay outside this fix.

Acceptance: red native/generated depth tests first; then both exports match the partition and reject regressions. Exact hashes preserve collision, all other map layers, envelope and unrelated catalog data. Independently review before commit. Hosted keyboard approach must still stop at y832 while the whole Woka stays visible, lateral movement must work, and walking through the real doorway and returning must work. Guard deployment against fresh editor drift and verify the complete world after upload. Local tests and screenshots alone are not production acceptance.
