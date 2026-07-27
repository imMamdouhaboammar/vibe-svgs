# Mascot Motion References

This directory records the supplied source files used to build the mascot animation packs. The source SVGs remain unchanged under `svgs/mascots/`. Their SHA-256 digests are stored in `source-inventory.json`.

## Source split

- 61 independent pixel-art scene sources
- 15 artboard frame sources arranged as five triplets
- 2 MP4 motion references

All 76 static SVG sources use a `0 0 2000 2000` viewBox and rectangle-only pixel artwork. Every source includes the terracotta actor colour `#d97757`.

## MP4 reference observations

`1775512169485-Claued-Code-Mascot-animated.mp4` is a 6.042 second, 800 by 800 reference containing nine small looping stories. It demonstrates magnifier search, code review, leaf movement, lifting, confetti, server interaction, status confirmation, impact, and tool work.

`copy_9B2864B4-A459-46F6-8830-E1F16648191B.mp4` is a 20.827 second, 1920 by 772 reference with four concurrent stories. It demonstrates continuous jumps, discrete pose changes, attached flag motion, effort holds, and independent confetti timing.

## Preservation rule

Generators may read and wrap the supplied SVGs, but must not rewrite them. Tests compare every source file against the stored SHA-256 digest before pack generation.
