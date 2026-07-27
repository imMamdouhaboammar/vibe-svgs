// @ts-nocheck
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

type Finding = {
  asset: string;
  time: number;
  element: string;
  edge: string;
  amount: number;
};

const args = process.argv.slice(2);
const requireMascot = args.includes("--require-mascot");
const manifestPath = args.find((arg) => !arg.startsWith("--")) ?? "claude-code-manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const assets = manifest.assets.filter((asset: { animated: boolean }) => asset.animated);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 440 } });
const findings: Finding[] = [];
const mascotMotionFailures: Array<{ asset: string; motion: number }> = [];
for (const asset of assets) {
  const source = await readFile(asset.path, "utf8");
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{width:640px;height:440px;display:block}</style>${source}`);
  const result = await page.evaluate(async () => {
    const root = document.querySelector("svg")!;
    const animations = root.getAnimations({ subtree: true });
    animations.forEach((animation) => animation.pause());
    const total = Math.max(3000, ...animations.map((animation) => {
      const timing = animation.effect?.getComputedTiming();
      return Number(timing?.delay ?? 0) + Number(timing?.duration ?? 0);
    }).filter(Number.isFinite));
    const graphics = [...root.querySelectorAll<SVGGraphicsElement>("path,rect,circle,ellipse,line,polygon,polyline,text,use,image")]
      .filter((element) => !element.closest("defs,clipPath,mask,pattern"));
    const rootRect = root.getBoundingClientRect();
    const localFindings: Array<{time:number;element:string;edge:string;amount:number}> = [];
    const mascot = root.querySelector<SVGGraphicsElement>("[data-mascot]");
    const mascotRects: DOMRect[] = [];
    const isAnimated = (element: Element) => {
      let current: Element | null = element;
      while (current && current !== root) {
        if (current.getAnimations().length > 0 || current.hasAttribute("data-animated")) return true;
        current = current.parentElement;
      }
      return false;
    };
    const effectiveOpacity = (element: Element) => {
      let opacity = 1;
      let current: Element | null = element;
      while (current && current !== root) {
        const style = getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden") return 0;
        opacity *= Number(style.opacity || 1);
        current = current.parentElement;
      }
      return opacity;
    };
    for (let step = 0; step <= 96; step += 1) {
      const time = (total * step) / 96;
      for (const animation of animations) animation.currentTime = time;
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      if (mascot) mascotRects.push(mascot.getBoundingClientRect());
      for (const element of graphics) {
        if (!isAnimated(element) || effectiveOpacity(element) < 0.02) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        const checks = [
          ["left", rootRect.left - rect.left],
          ["top", rootRect.top - rect.top],
          ["right", rect.right - rootRect.right],
          ["bottom", rect.bottom - rootRect.bottom],
        ] as const;
        for (const [edge, amount] of checks) {
          if (amount > 0.5) {
            localFindings.push({ time, element: element.tagName.toLowerCase(), edge, amount });
          }
        }
      }
    }
    const mascotMotion = mascotRects.length === 0 ? 0 : Math.max(
      Math.max(...mascotRects.map((rect) => rect.x)) - Math.min(...mascotRects.map((rect) => rect.x)),
      Math.max(...mascotRects.map((rect) => rect.y)) - Math.min(...mascotRects.map((rect) => rect.y)),
      Math.max(...mascotRects.map((rect) => rect.width)) - Math.min(...mascotRects.map((rect) => rect.width)),
      Math.max(...mascotRects.map((rect) => rect.height)) - Math.min(...mascotRects.map((rect) => rect.height)),
    );
    return { findings: localFindings, mascotMotion };
  });
  const unique = new Map<string, Finding>();
  for (const finding of result.findings) {
    const key = `${finding.element}:${finding.edge}`;
    const previous = unique.get(key);
    const next = { asset: asset.path, ...finding };
    if (!previous || finding.amount > previous.amount) unique.set(key, next);
  }
  findings.push(...unique.values());
  if (requireMascot && result.mascotMotion < 2) mascotMotionFailures.push({ asset: asset.path, motion: result.mascotMotion });
  console.log(`${asset.id}: mascot motion ${result.mascotMotion.toFixed(2)}px, bounds ${unique.size === 0 ? "pass" : "fail"}`);
}

await browser.close();
if (findings.length > 0 || mascotMotionFailures.length > 0) {
  for (const finding of findings) console.error(`${finding.asset} ${finding.element} ${finding.edge} overflow ${finding.amount.toFixed(2)}px at ${finding.time.toFixed(0)}ms`);
  for (const failure of mascotMotionFailures) console.error(`${failure.asset} mascot motion ${failure.motion.toFixed(2)}px is below the 2px minimum`);
  process.exit(1);
}
console.log(`Motion bounds and mascot performance passed for ${assets.length} assets.`);
