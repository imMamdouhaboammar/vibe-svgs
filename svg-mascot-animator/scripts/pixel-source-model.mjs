import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { readFile } from "node:fs/promises";

const ACTOR_FILL = "#d97757";
const SHAPE_PATTERN = /<(rect|polygon)\b[^>]*\/?>(?:\s*<\/\1>)?/gi;
const ATTRIBUTE_PATTERN = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function normalizeFill(value = "") {
  const fill = value.trim().toLowerCase();
  if (fill === "#fff") return "#ffffff";
  if (fill === "#000") return "#000000";
  return fill;
}

function parseAttributes(raw) {
  const attributes = {};
  for (const match of raw.matchAll(ATTRIBUTE_PATTERN)) {
    attributes[match[1]] = match[2] ?? match[3] ?? "";
  }
  return attributes;
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return number;
}

function rectBounds(attributes) {
  return {
    x: finiteNumber(attributes.x ?? 0, "rect x"),
    y: finiteNumber(attributes.y ?? 0, "rect y"),
    width: finiteNumber(attributes.width, "rect width"),
    height: finiteNumber(attributes.height, "rect height"),
  };
}

function polygonBounds(attributes) {
  const coordinates = (attributes.points ?? "")
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (coordinates.length < 6 || coordinates.length % 2 !== 0 || coordinates.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid polygon points: ${attributes.points ?? ""}`);
  }
  const xs = coordinates.filter((_, index) => index % 2 === 0);
  const ys = coordinates.filter((_, index) => index % 2 === 1);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(...xs) - x,
    height: Math.max(...ys) - y,
  };
}

function unionBounds(bounds) {
  if (bounds.length === 0) {
    throw new Error("Cannot union an empty bounds list");
  }
  const x = Math.min(...bounds.map((entry) => entry.x));
  const y = Math.min(...bounds.map((entry) => entry.y));
  const right = Math.max(...bounds.map((entry) => entry.x + entry.width));
  const bottom = Math.max(...bounds.map((entry) => entry.y + entry.height));
  return { x, y, width: right - x, height: bottom - y };
}

function center(bounds) {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

function boundsGap(a, b) {
  const horizontal = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const vertical = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));
  return Math.hypot(horizontal, vertical);
}

function connectedComponents(indexes, shapes, threshold) {
  const remaining = new Set(indexes);
  const components = [];
  while (remaining.size > 0) {
    const seed = remaining.values().next().value;
    remaining.delete(seed);
    const component = [seed];
    const queue = [seed];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const candidate of [...remaining]) {
        if (boundsGap(shapes[current].bounds, shapes[candidate].bounds) <= threshold) {
          remaining.delete(candidate);
          component.push(candidate);
          queue.push(candidate);
        }
      }
    }
    components.push(component);
  }
  return components;
}

function containsPoint(bounds, point, padding = 0) {
  return point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding;
}

export function parsePixelSource(source, path = "pixel-source.svg") {
  const root = source.match(/<svg\b([^>]*)>/i);
  if (!root) throw new Error(`Missing SVG root in ${path}`);
  const rootAttributes = parseAttributes(root[0]);
  const viewBoxValues = (rootAttributes.viewBox ?? "").trim().split(/\s+/).map(Number);
  if (viewBoxValues.length !== 4 || viewBoxValues.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid viewBox in ${path}`);
  }

  const matches = [...source.matchAll(SHAPE_PATTERN)];
  if (matches.length === 0) throw new Error(`No pixel shapes found in ${path}`);
  const shapes = matches.map((match, sourceIndex) => {
    const type = match[1].toLowerCase();
    const raw = match[0];
    const attributes = parseAttributes(raw);
    const bounds = type === "rect" ? rectBounds(attributes) : polygonBounds(attributes);
    return {
      type,
      raw,
      attributes,
      fill: normalizeFill(attributes.fill),
      bounds,
      sourceIndex,
      start: match.index,
      end: match.index + raw.length,
    };
  });

  return {
    path,
    filename: basename(path),
    source,
    sourceHash: createHash("sha256").update(source).digest("hex"),
    rootAttributes,
    viewBox: {
      x: viewBoxValues[0],
      y: viewBoxValues[1],
      width: viewBoxValues[2],
      height: viewBoxValues[3],
    },
    prefix: source.slice(0, matches[0].index),
    suffix: source.slice(matches.at(-1).index + matches.at(-1)[0].length),
    shapes,
  };
}

export function classifyActorShapes(model) {
  const terracotta = model.shapes
    .filter((shape) => shape.fill === ACTOR_FILL)
    .map((shape) => shape.sourceIndex);
  if (terracotta.length === 0) {
    throw new Error(`No ${ACTOR_FILL} actor shapes found in ${model.filename}`);
  }

  const rectWidths = model.shapes
    .filter((shape) => shape.type === "rect")
    .map((shape) => Math.max(shape.bounds.width, shape.bounds.height))
    .sort((a, b) => a - b);
  const gridStep = rectWidths[Math.floor(rectWidths.length / 2)] || 43.55;
  const components = connectedComponents(terracotta, model.shapes, gridStep * 1.12)
    .sort((a, b) => b.length - a.length);
  const primary = new Set(components[0]);

  let changed = true;
  while (changed) {
    changed = false;
    const currentBounds = unionBounds([...primary].map((index) => model.shapes[index].bounds));
    for (const index of terracotta) {
      if (primary.has(index)) continue;
      const shape = model.shapes[index];
      if (containsPoint(currentBounds, center(shape.bounds), gridStep * 2.4) ||
          [...primary].some((actorIndex) => boundsGap(model.shapes[actorIndex].bounds, shape.bounds) <= gridStep * 2.2)) {
        primary.add(index);
        changed = true;
      }
    }
  }

  const orangeBounds = unionBounds([...primary].map((index) => model.shapes[index].bounds));
  const detailPadding = gridStep * 0.9;
  const detailFills = new Set([
    "#2f2f38", "#ffffff", "#000000", "#ea9983", "#f7b58e", "#ffb052",
    "#ffd2b7", "#21150f", "#71311d", "#e25f38",
  ]);
  const actorIndexes = new Set(primary);
  for (const shape of model.shapes) {
    if (actorIndexes.has(shape.sourceIndex)) continue;
    if (detailFills.has(shape.fill) && containsPoint(orangeBounds, center(shape.bounds), detailPadding)) {
      actorIndexes.add(shape.sourceIndex);
    }
  }

  const actorList = [...actorIndexes].sort((a, b) => a - b);
  const actorBounds = unionBounds(actorList.map((index) => model.shapes[index].bounds));
  const allIndexes = model.shapes.map((shape) => shape.sourceIndex);
  const propIndexes = allIndexes.filter((index) => !actorIndexes.has(index));
  const { viewBox } = model;
  return {
    actorIndexes: actorList,
    propIndexes,
    actorBounds,
    gridStep,
    safeMargins: {
      left: Math.max(0, actorBounds.x - viewBox.x),
      right: Math.max(0, viewBox.x + viewBox.width - actorBounds.x - actorBounds.width),
      top: Math.max(0, actorBounds.y - viewBox.y),
      bottom: Math.max(0, viewBox.y + viewBox.height - actorBounds.y - actorBounds.height),
    },
  };
}

export async function inventoryPixelSources(directory = "svgs/mascots") {
  const models = [];
  const glob = new Bun.Glob("*.svg");
  for await (const filename of glob.scan({ cwd: directory, onlyFiles: true })) {
    const path = join(directory, filename);
    const source = await readFile(path, "utf8");
    if (!/viewBox=["']0 0 2000 2000["']/.test(source)) continue;
    models.push(parsePixelSource(source, path));
  }
  return models.sort((a, b) => a.filename.localeCompare(b.filename));
}
