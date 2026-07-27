import { sampleSpring } from "./bake.mjs";

const FAMILY_BY_PRESET = new Map();
for (const preset of ["celebrate", "launch", "milestone", "check", "welcome", "speed"]) FAMILY_BY_PRESET.set(preset, "jump");
for (const preset of ["rage", "critical", "repair", "build", "disconnect"]) FAMILY_BY_PRESET.set(preset, "impact");
for (const preset of ["sad", "cry", "think", "read", "globe", "leaf", "aura", "love", "bake"]) FAMILY_BY_PRESET.set(preset, "float");
for (const preset of ["error", "alert", "api", "server", "monitor", "lock", "idea", "settings", "workflow", "malware", "pressure"]) FAMILY_BY_PRESET.set(preset, "pulse");
for (const preset of ["confused", "dizzy", "data", "refresh", "track", "logic", "loop", "tree"]) FAMILY_BY_PRESET.set(preset, "orbit");
for (const preset of ["debug", "pair", "audit", "review", "code", "scroll", "sign", "lab"]) FAMILY_BY_PRESET.set(preset, "work");
for (const preset of ["grow", "mushrooms", "plant", "trend"]) FAMILY_BY_PRESET.set(preset, "growth");
for (const preset of ["failed"]) FAMILY_BY_PRESET.set(preset, "fail");
for (const preset of ["ninja"]) FAMILY_BY_PRESET.set(preset, "ninja");
FAMILY_BY_PRESET.set("lift", "lift");
FAMILY_BY_PRESET.set("sleep", "sleep");
FAMILY_BY_PRESET.set("sprite-recovery", "impact");
FAMILY_BY_PRESET.set("sprite-celebration", "jump");
FAMILY_BY_PRESET.set("sprite-deadline", "pulse");
FAMILY_BY_PRESET.set("sprite-defense", "float");
FAMILY_BY_PRESET.set("sprite-mission", "work");

const rest = Object.freeze({ x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 });
const state = (overrides = {}) => ({ ...rest, ...overrides });

function hashUnit(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function clampAmplitude(requested, margin, fraction = 0.18) {
  return Math.max(0, Math.min(requested, margin * fraction));
}

function springRecovery(states, startPct, endPct, fromState, options = {}) {
  const { samples } = sampleSpring({ stiffness: 150, damping: 19, mass: 1, ...options }, 8);
  for (const [u, progress] of samples.slice(1)) {
    const inverse = 1 - progress;
    states.push([
      startPct + (endPct - startPct) * u,
      state({
        x: fromState.x * inverse,
        y: fromState.y * inverse,
        rotate: fromState.rotate * inverse,
        scaleX: 1 + (fromState.scaleX - 1) * inverse,
        scaleY: 1 + (fromState.scaleY - 1) * inverse,
      }),
    ]);
  }
}

function jumpPlan(metrics, variation) {
  const jump = clampAmplitude(105 + variation * 30, metrics.top, 0.24);
  const down = clampAmplitude(24, metrics.bottom, 0.12);
  const direction = variation > 0.5 ? 1 : -1;
  const impact = state({ y: down * 0.45, rotate: direction * 0.7, scaleX: 1.1, scaleY: 0.8 });
  const states = [
    [0, rest], [12, rest],
    [18, state({ y: down, rotate: -direction * 1.2, scaleX: 1.055, scaleY: 0.9 })],
    [24, state({ y: -jump * 0.16, rotate: direction * 0.5, scaleX: 0.97, scaleY: 1.055 })],
    [40, state({ y: -jump, rotate: direction * 1.6 })],
    [53, state({ y: -jump * 0.38, rotate: -direction * 0.5, scaleX: 0.99, scaleY: 1.025 })],
    [59, impact],
  ];
  springRecovery(states, 59, 82, impact, { damping: 17 });
  states.push([100, rest]);
  return states;
}

function impactPlan(metrics, variation) {
  const direction = variation > 0.5 ? 1 : -1;
  const forwardMargin = direction > 0 ? metrics.right : metrics.left;
  const travel = clampAmplitude(72 + variation * 22, forwardMargin, 0.16);
  const down = clampAmplitude(18, metrics.bottom, 0.1);
  const impact = state({ x: direction * travel * 0.72, y: down * 0.45, rotate: direction * 1.4, scaleX: 1.075, scaleY: 0.85 });
  const states = [
    [0, rest], [17, rest],
    [27, state({ x: -direction * travel * 0.38, y: down * 0.35, rotate: -direction * 2.4, scaleX: 1.035, scaleY: 0.95 })],
    [36, state({ x: direction * travel, y: -down * 0.2, rotate: direction * 2.6, scaleX: 0.96, scaleY: 1.045 })],
    [43, impact],
  ];
  springRecovery(states, 43, 72, impact, { stiffness: 165, damping: 18 });
  states.push([100, rest]);
  return states;
}

function floatPlan(metrics, variation) {
  const lift = clampAmplitude(28 + variation * 20, metrics.top, 0.12);
  const direction = variation > 0.5 ? 1 : -1;
  return [
    [0, rest],
    [24, state({ x: direction * 7, y: -lift * 0.5, rotate: -direction * 1.3, scaleX: 1.008, scaleY: 0.992 })],
    [50, state({ x: 0, y: -lift, rotate: direction * 1.6, scaleX: 0.996, scaleY: 1.012 })],
    [76, state({ x: -direction * 6, y: -lift * 0.42, rotate: -direction * 0.9 })],
    [100, rest],
  ];
}

function pulsePlan(metrics, variation) {
  const lift = clampAmplitude(15 + variation * 10, metrics.top, 0.08);
  const down = clampAmplitude(10, metrics.bottom, 0.07);
  return [
    [0, rest], [18, rest],
    [29, state({ y: down, scaleX: 1.025, scaleY: 0.96 })],
    [37, state({ y: -lift, scaleX: 0.97, scaleY: 1.065 })],
    [45, state({ y: -lift * 0.45, scaleX: 1.035, scaleY: 0.975 })],
    [58, rest], [75, rest],
    [82, state({ y: -lift * 0.25, scaleX: 0.99, scaleY: 1.018 })],
    [91, rest], [100, rest],
  ];
}

function orbitPlan(metrics, variation) {
  const horizontal = Math.min(
    clampAmplitude(28 + variation * 18, metrics.left, 0.1),
    clampAmplitude(28 + variation * 18, metrics.right, 0.1),
  );
  const vertical = clampAmplitude(30 + variation * 16, metrics.top, 0.1);
  const direction = variation > 0.5 ? 1 : -1;
  return [
    [0, rest],
    [25, state({ x: direction * horizontal, y: -vertical * 0.55, rotate: direction * 1.8 })],
    [50, state({ x: 0, y: -vertical, rotate: 0 })],
    [75, state({ x: -direction * horizontal, y: -vertical * 0.55, rotate: -direction * 1.8 })],
    [100, rest],
  ];
}

function workPlan(metrics, variation) {
  const direction = variation > 0.5 ? 1 : -1;
  const horizontal = clampAmplitude(24, direction > 0 ? metrics.right : metrics.left, 0.09);
  const down = clampAmplitude(11, metrics.bottom, 0.06);
  return [
    [0, rest], [14, rest],
    [24, state({ x: direction * horizontal, y: down * 0.4, rotate: direction * 1.4, scaleX: 1.012, scaleY: 0.988 })],
    [34, state({ x: direction * horizontal * 0.35, y: -down * 0.35, rotate: -direction * 0.8 })],
    [45, rest],
    [57, state({ x: -direction * horizontal * 0.55, y: down * 0.25, rotate: -direction * 1.1 })],
    [67, state({ x: 0, y: -down * 0.45, rotate: direction * 0.6 })],
    [80, rest], [100, rest],
  ];
}

function growthPlan(metrics, variation) {
  const lift = clampAmplitude(48 + variation * 25, metrics.top, 0.15);
  const down = clampAmplitude(18, metrics.bottom, 0.08);
  const peak = state({ y: -lift, scaleX: 0.985, scaleY: 1.055 });
  const states = [
    [0, rest], [18, rest],
    [28, state({ y: down, scaleX: 1.045, scaleY: 0.93 })],
    [52, peak], [62, peak],
  ];
  springRecovery(states, 62, 88, peak, { stiffness: 120, damping: 20 });
  states.push([100, rest]);
  return states;
}

function failPlan(metrics, variation) {
  const drop = clampAmplitude(42 + variation * 18, metrics.bottom, 0.12);
  const direction = variation > 0.5 ? 1 : -1;
  const fallen = state({ y: drop, rotate: direction * 3.2, scaleX: 1.045, scaleY: 0.91 });
  const states = [[0, rest], [22, rest], [38, fallen], [54, fallen]];
  springRecovery(states, 54, 88, fallen, { stiffness: 95, damping: 22 });
  states.push([100, rest]);
  return states;
}

function ninjaPlan(metrics, variation) {
  const direction = variation > 0.5 ? 1 : -1;
  const margin = direction > 0 ? metrics.right : metrics.left;
  const dash = clampAmplitude(86, margin, 0.18);
  const lift = clampAmplitude(32, metrics.top, 0.1);
  return [
    [0, rest], [16, rest],
    [22, state({ x: -direction * dash * 0.2, y: 9, rotate: -direction * 2.5, scaleX: 1.045, scaleY: 0.92 })],
    [30, state({ x: direction * dash, y: -lift, rotate: direction * 2, scaleX: 0.95, scaleY: 1.05 })],
    [38, state({ x: direction * dash * 0.5, y: -lift * 0.2, rotate: -direction * 1 })],
    [48, state({ x: -direction * dash * 0.08, rotate: direction * 0.6 })],
    [62, rest], [100, rest],
  ];
}

function liftPlan(metrics, variation) {
  const lift = clampAmplitude(78 + variation * 25, metrics.top, 0.17);
  const down = clampAmplitude(36, metrics.bottom, 0.1);
  const impact = state({ y: down * 0.35, scaleX: 1.055, scaleY: 0.87 });
  const states = [
    [0, rest], [15, rest],
    [27, state({ y: down, scaleX: 1.045, scaleY: 0.9 })],
    [43, state({ y: -lift, scaleX: 0.975, scaleY: 1.045 })],
    [58, state({ y: -lift, rotate: variation > 0.5 ? 0.8 : -0.8 })],
    [72, impact],
  ];
  springRecovery(states, 72, 92, impact, { stiffness: 130, damping: 20 });
  states.push([100, rest]);
  return states;
}

function sleepPlan(metrics, variation) {
  const drift = clampAmplitude(12 + variation * 6, metrics.top, 0.06);
  return [
    [0, rest],
    [28, state({ y: -drift * 0.35, scaleX: 1.018, scaleY: 0.982 })],
    [52, state({ y: -drift, scaleX: 1.03, scaleY: 0.97 })],
    [76, state({ y: -drift * 0.35, scaleX: 1.012, scaleY: 0.988 })],
    [100, rest],
  ];
}

const BUILDERS = {
  jump: jumpPlan,
  impact: impactPlan,
  float: floatPlan,
  pulse: pulsePlan,
  orbit: orbitPlan,
  work: workPlan,
  growth: growthPlan,
  fail: failPlan,
  ninja: ninjaPlan,
  lift: liftPlan,
  sleep: sleepPlan,
};

export function resolveMotionFamily(preset) {
  return FAMILY_BY_PRESET.get(preset) ?? "work";
}

export function buildMotionPlan(story, classification) {
  const family = resolveMotionFamily(story.preset);
  const variation = hashUnit(`${story.id}:${story.preset}`);
  const states = BUILDERS[family](classification.safeMargins, variation)
    .sort((a, b) => a[0] - b[0]);
  return { family, variation, states };
}
