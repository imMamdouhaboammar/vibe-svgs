import { classifyActorShapes, inventoryPixelSources } from "./pixel-source-model.mjs";

const directory = process.argv[2] ?? "svgs/mascots";
const inventory = await inventoryPixelSources(directory);
let artboards = 0;
let independent = 0;
for (const model of inventory) {
  const classification = classifyActorShapes(model);
  if (model.filename.startsWith("artboard-")) artboards += 1;
  else independent += 1;
  console.log([
    model.filename,
    `shapes=${model.shapes.length}`,
    `actor=${classification.actorIndexes.length}`,
    `props=${classification.propIndexes.length}`,
    `bounds=${classification.actorBounds.x.toFixed(1)},${classification.actorBounds.y.toFixed(1)},${classification.actorBounds.width.toFixed(1)},${classification.actorBounds.height.toFixed(1)}`,
  ].join("\t"));
}
console.log(`Pixel source inventory passed: ${inventory.length} total, ${independent} independent, ${artboards} artboard frames.`);
