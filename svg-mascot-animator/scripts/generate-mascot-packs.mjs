import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { buildMotionPlan } from "./motion-presets.mjs";
import { classifyActorShapes, parsePixelSource } from "./pixel-source-model.mjs";
import { loadStoryRegistry } from "./story-registry.mjs";

const neutralFills = new Set([
  "", "none", "#ffffff", "#000000", "#2f2f38", "#d3d3d3", "#c6c1e0", "#c0ddd3",
]);

const xmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const fmt = (value, decimals = 3) => {
  const number = Math.abs(value) < 1e-9 ? 0 : value;
  return Number(number.toFixed(decimals)).toString();
};

function transformValue(motion) {
  return `translate(${fmt(motion.x)}px,${fmt(motion.y)}px) rotate(${fmt(motion.rotate)}deg) scale(${fmt(motion.scaleX)},${fmt(motion.scaleY)})`;
}

function keyframes(name, states, render) {
  const seen = new Set();
  const frames = [];
  for (const [percent, motion] of states) {
    const pct = fmt(percent);
    const body = render(motion);
    const key = `${pct}|${body}`;
    if (seen.has(key)) continue;
    seen.add(key);
    frames.push(`${pct}%{${body}}`);
  }
  return `@keyframes ${name}{${frames.join("")}}`;
}

function actorKeyframes(story, states) {
  return keyframes(`${story.id}-actor-motion`, states, (motion) => `transform:${transformValue(motion)}`);
}

function shadowKeyframes(story, states, actorHeight) {
  return keyframes(`${story.id}-shadow-motion`, states, (motion) => {
    const height = Math.max(0, -motion.y);
    const heightRatio = Math.min(1, height / Math.max(1, actorHeight * 0.35));
    const scale = Math.max(0.56, 1 - heightRatio * 0.42 + Math.max(0, motion.y) / Math.max(1, actorHeight) * 0.12);
    const opacity = Math.max(0.1, 0.26 - heightRatio * 0.14);
    return `transform:translateX(${fmt(motion.x * 0.68)}px) scaleX(${fmt(scale)});opacity:${fmt(opacity)}`;
  });
}

function propKeyframes(story, states) {
  const name = `${story.id}-prop-motion`;
  if (story.propMode === "pulse") {
    return `@keyframes ${name}{0%,18%,100%{opacity:1}32%{opacity:.58}44%{opacity:1}76%{opacity:.78}88%{opacity:1}}`;
  }
  if (story.propMode === "orbit") {
    return `@keyframes ${name}{0%,100%{transform:translate(0,0);opacity:.92}25%{transform:translate(9px,-7px);opacity:1}50%{transform:translate(0,-12px);opacity:.82}75%{transform:translate(-9px,-7px);opacity:1}}`;
  }
  if (story.propMode === "secondary") {
    return `@keyframes ${name}{0%,100%{transform:translateY(0);opacity:.9}35%{transform:translateY(-10px);opacity:1}68%{transform:translateY(5px);opacity:.76}}`;
  }
  if (story.propMode === "counter") {
    return keyframes(name, states, (motion) => `transform:translate(${fmt(-motion.x * 0.18)}px,${fmt(-motion.y * 0.12)}px) rotate(${fmt(-motion.rotate * 0.22)}deg)`);
  }
  return "";
}

function expanded(bounds, padding) {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

function center(bounds) {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function contains(bounds, point) {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y && point.y <= bounds.y + bounds.height;
}

function distanceToActor(shape, actorBounds) {
  const point = center(shape.bounds);
  const actor = center(actorBounds);
  return Math.hypot(point.x - actor.x, point.y - actor.y);
}

function selectMovingProps(model, classification, mode) {
  if (mode === "static" || classification.propIndexes.length === 0) return [];
  const props = classification.propIndexes.map((index) => model.shapes[index]);
  const nearby = expanded(classification.actorBounds, classification.gridStep * 5.2);
  let candidates;
  if (mode === "counter") {
    candidates = props.filter((shape) => contains(nearby, center(shape.bounds)));
  } else {
    candidates = props.filter((shape) => !neutralFills.has(shape.fill));
  }
  if (candidates.length === 0) {
    candidates = [...props].sort((a, b) => distanceToActor(a, classification.actorBounds) - distanceToActor(b, classification.actorBounds)).slice(0, 24);
  }
  const cap = mode === "counter" ? 72 : 96;
  return candidates
    .sort((a, b) => a.sourceIndex - b.sourceIndex)
    .slice(0, cap)
    .map((shape) => shape.sourceIndex);
}

function cleanSourceShape(raw) {
  return raw.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

function wrapShape(shape, attributes) {
  return `<g ${attributes}>${cleanSourceShape(shape.raw)}</g>`;
}

export function generateIndependentStory(model, classification, story) {
  const plan = buildMotionPlan(story, classification);
  const actorSet = new Set(classification.actorIndexes);
  const movingPropSet = new Set(selectMovingProps(model, classification, story.propMode));
  const actorOriginX = classification.actorBounds.x + classification.actorBounds.width / 2;
  const actorOriginY = classification.actorBounds.y + classification.actorBounds.height;
  const propOriginX = actorOriginX;
  const propOriginY = classification.actorBounds.y + classification.actorBounds.height / 2;
  const shadowY = Math.min(
    model.viewBox.y + model.viewBox.height - 24,
    classification.actorBounds.y + classification.actorBounds.height + Math.max(24, classification.gridStep * 0.55),
  );
  const shadowRx = Math.max(80, Math.min(420, classification.actorBounds.width * 0.38));
  const shadowRy = Math.max(18, Math.min(55, classification.gridStep * 0.55));
  const actorClass = `${story.id}-actor`;
  const propClass = `${story.id}-prop`;

  const shapes = model.shapes.map((shape) => {
    if (actorSet.has(shape.sourceIndex)) {
      return wrapShape(shape, `class="${actorClass}" data-actor="true" data-source-index="${shape.sourceIndex}"`);
    }
    if (movingPropSet.has(shape.sourceIndex)) {
      return wrapShape(shape, `class="${propClass}" data-prop="true" data-source-index="${shape.sourceIndex}"`);
    }
    return wrapShape(shape, `data-source-index="${shape.sourceIndex}"`);
  }).join("\n");

  const propCss = propKeyframes(story, plan.states);
  const style = [
    actorKeyframes(story, plan.states),
    shadowKeyframes(story, plan.states, classification.actorBounds.height),
    propCss,
    `.${actorClass}{animation:${story.id}-actor-motion ${story.durationMs}ms linear infinite;transform-box:view-box;transform-origin:${fmt(actorOriginX)}px ${fmt(actorOriginY)}px}`,
    propCss ? `.${propClass}{animation:${story.id}-prop-motion ${story.durationMs}ms linear infinite;transform-box:view-box;transform-origin:${fmt(propOriginX)}px ${fmt(propOriginY)}px}` : "",
    `.${story.id}-shadow{animation:${story.id}-shadow-motion ${story.durationMs}ms linear infinite;transform-box:view-box;transform-origin:${fmt(actorOriginX)}px ${fmt(shadowY)}px}`,
    `@media (prefers-reduced-motion:reduce){.${actorClass},.${propClass},.${story.id}-shadow{animation:none!important;transform:none!important}}`,
  ].filter(Boolean).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 2000 2000" shape-rendering="crispEdges" overflow="hidden" role="img" aria-labelledby="${story.id}-title ${story.id}-desc" data-pack="${story.pack}" data-motion-preset="${story.preset}" data-motion-family="${plan.family}" data-source="${xmlEscape(model.path)}" data-source-sha256="${model.sourceHash}"><title id="${story.id}-title">${xmlEscape(story.title)}</title><desc id="${story.id}-desc">${xmlEscape(story.description)}</desc><style>${style}</style><ellipse class="${story.id}-shadow" data-shadow="true" cx="${fmt(actorOriginX)}" cy="${fmt(shadowY)}" rx="${fmt(shadowRx)}" ry="${fmt(shadowRy)}" fill="#2f2f38" opacity=".26"/>${shapes}</svg>`;
}

export async function generateIndependentPacks({ pack } = {}) {
  const registry = await loadStoryRegistry();
  const stories = registry.independent.filter((story) => !pack || story.pack === pack);
  for (const story of stories) {
    const source = await readFile(story.source, "utf8");
    const model = parsePixelSource(source, story.source);
    const classification = classifyActorShapes(model);
    const output = generateIndependentStory(model, classification, story);
    await mkdir(dirname(story.output), { recursive: true });
    await writeFile(story.output, `${output}\n`, "utf8");
    console.log(`Generated ${story.output}`);
  }
  return stories.map((story) => story.output);
}


function unionBounds(boundsList) {
  const x = Math.min(...boundsList.map((bounds) => bounds.x));
  const y = Math.min(...boundsList.map((bounds) => bounds.y));
  const right = Math.max(...boundsList.map((bounds) => bounds.x + bounds.width));
  const bottom = Math.max(...boundsList.map((bounds) => bounds.y + bounds.height));
  return { x, y, width: right - x, height: bottom - y };
}

function combineFrameClassifications(frames) {
  const actorBounds = unionBounds(frames.map((frame) => frame.classification.actorBounds));
  const viewBox = frames[0].model.viewBox;
  return {
    actorBounds,
    gridStep: frames.reduce((sum, frame) => sum + frame.classification.gridStep, 0) / frames.length,
    safeMargins: {
      left: Math.max(0, actorBounds.x - viewBox.x),
      right: Math.max(0, viewBox.x + viewBox.width - actorBounds.x - actorBounds.width),
      top: Math.max(0, actorBounds.y - viewBox.y),
      bottom: Math.max(0, viewBox.y + viewBox.height - actorBounds.y - actorBounds.height),
    },
  };
}

function spriteFrameKeyframes(story) {
  return [
    `@keyframes ${story.id}-frame-0{0%,19.999%,92%,100%{opacity:1}20%,91.999%{opacity:0}}`,
    `@keyframes ${story.id}-frame-1{0%,19.999%,62%,100%{opacity:0}20%,61.999%{opacity:1}}`,
    `@keyframes ${story.id}-frame-2{0%,61.999%,92%,100%{opacity:0}62%,91.999%{opacity:1}}`,
  ].join("");
}

function renderSpriteFrame(frame, story, frameIndex) {
  const actorSet = new Set(frame.classification.actorIndexes);
  const movingPropSet = new Set(selectMovingProps(frame.model, frame.classification, story.propMode));
  const shapes = frame.model.shapes.map((shape) => {
    if (actorSet.has(shape.sourceIndex)) {
      return wrapShape(shape, `class="${story.id}-actor" data-actor="true" data-source-index="${shape.sourceIndex}"`);
    }
    if (movingPropSet.has(shape.sourceIndex)) {
      return wrapShape(shape, `class="${story.id}-prop" data-prop="true" data-source-index="${shape.sourceIndex}"`);
    }
    return wrapShape(shape, `data-source-index="${shape.sourceIndex}"`);
  }).join("\n");
  return `<g class="${story.id}-frame-${frameIndex}" data-frame="${frameIndex}" data-frame-source="${xmlEscape(frame.model.path)}" data-frame-sha256="${frame.model.sourceHash}">${shapes}</g>`;
}

export function generateSpriteStory(frames, story) {
  if (!Array.isArray(frames) || frames.length !== 3) {
    throw new Error(`Sprite story ${story.id} requires exactly three frames`);
  }
  const combined = combineFrameClassifications(frames);
  const plan = buildMotionPlan(story, combined);
  const actorOriginX = combined.actorBounds.x + combined.actorBounds.width / 2;
  const actorOriginY = combined.actorBounds.y + combined.actorBounds.height;
  const shadowY = Math.min(1976, actorOriginY + Math.max(24, combined.gridStep * 0.55));
  const shadowRx = Math.max(80, Math.min(460, combined.actorBounds.width * 0.38));
  const shadowRy = Math.max(18, Math.min(55, combined.gridStep * 0.55));
  const propCss = propKeyframes(story, plan.states);
  const style = [
    actorKeyframes(story, plan.states),
    shadowKeyframes(story, plan.states, combined.actorBounds.height),
    propCss,
    spriteFrameKeyframes(story),
    `.${story.id}-actor{animation:${story.id}-actor-motion ${story.durationMs}ms linear infinite;transform-box:view-box;transform-origin:${fmt(actorOriginX)}px ${fmt(actorOriginY)}px}`,
    propCss ? `.${story.id}-prop{animation:${story.id}-prop-motion ${story.durationMs}ms linear infinite;transform-box:view-box;transform-origin:${fmt(actorOriginX)}px ${fmt(actorOriginY)}px}` : "",
    `.${story.id}-shadow{animation:${story.id}-shadow-motion ${story.durationMs}ms linear infinite;transform-box:view-box;transform-origin:${fmt(actorOriginX)}px ${fmt(shadowY)}px}`,
    `[data-frame]{opacity:0}.` + `${story.id}-frame-0{animation:${story.id}-frame-0 ${story.durationMs}ms steps(1,end) infinite}.` + `${story.id}-frame-1{animation:${story.id}-frame-1 ${story.durationMs}ms steps(1,end) infinite}.` + `${story.id}-frame-2{animation:${story.id}-frame-2 ${story.durationMs}ms steps(1,end) infinite}`,
    `@media (prefers-reduced-motion:reduce){.${story.id}-actor,.${story.id}-prop,.${story.id}-shadow,[data-frame]{animation:none!important;transform:none!important}.${story.id}-frame-0,.${story.id}-frame-1{opacity:0!important}.${story.id}-frame-2{opacity:1!important}}`,
  ].filter(Boolean).join("");
  const frameMarkup = frames.map((frame, index) => renderSpriteFrame(frame, story, index)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 2000 2000" shape-rendering="crispEdges" overflow="hidden" role="img" aria-labelledby="${story.id}-title ${story.id}-desc" data-pack="${story.pack}" data-motion-preset="${story.preset}" data-motion-family="${plan.family}" data-sprite-story="true" data-frame-holds="20,42,30,8"><title id="${story.id}-title">${xmlEscape(story.title)}</title><desc id="${story.id}-desc">${xmlEscape(story.description)}</desc><style>${style}</style><ellipse class="${story.id}-shadow" data-shadow="true" cx="${fmt(actorOriginX)}" cy="${fmt(shadowY)}" rx="${fmt(shadowRx)}" ry="${fmt(shadowRy)}" fill="#2f2f38" opacity=".26"/>${frameMarkup}</svg>`;
}

export async function generateSpriteStories() {
  const registry = await loadStoryRegistry();
  const outputs = [];
  for (const story of registry.spriteStories) {
    const frames = await Promise.all(story.frames.map(async (path) => {
      const model = parsePixelSource(await readFile(path, "utf8"), path);
      return { model, classification: classifyActorShapes(model) };
    }));
    const output = generateSpriteStory(frames, story);
    await mkdir(dirname(story.output), { recursive: true });
    await writeFile(story.output, `${output}\n`, "utf8");
    outputs.push(story.output);
    console.log(`Generated ${story.output}`);
  }
  return outputs;
}

if (import.meta.main) {
  const packIndex = process.argv.indexOf("--pack");
  const pack = packIndex === -1 ? undefined : process.argv[packIndex + 1];
  const spriteOnly = process.argv.includes("--sprite");
  const independentOnly = process.argv.includes("--independent") || Boolean(pack);
  const outputs = [];
  if (!spriteOnly) outputs.push(...await generateIndependentPacks({ pack }));
  if (!independentOnly) outputs.push(...await generateSpriteStories());
  console.log(`Generated ${outputs.length} mascot pack assets.`);
}
