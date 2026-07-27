from __future__ import annotations

import importlib.util
from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
PHYSICS_PATH = ROOT / "svg-mascot-animator/scripts/physics.py"
spec = importlib.util.spec_from_file_location("mascot_physics", PHYSICS_PATH)
physics = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(physics)

MASCOT_PATH = (
    "M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949z"
    "M6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
)
LOOP = 4.8


def fmt(value: float) -> str:
    return f"{value:.3f}".rstrip("0").rstrip(".") or "0"


def keyframes(name: str, frames: list[tuple[float, str]]) -> str:
    seen: dict[float, str] = {}
    for time, body in frames:
        seen[round(time / LOOP * 100, 3)] = body
    return "@keyframes " + name + "{" + "".join(
        f"{fmt(percent)}%{{{body}}}" for percent, body in sorted(seen.items())
    ) + "}"


def transform_frames(name: str, frames: list[tuple[float, str]]) -> str:
    return keyframes(name, [(time, f"transform:{value}") for time, value in frames])


def opacity_frames(name: str, frames: list[tuple[float, float]]) -> str:
    return keyframes(name, [(time, f"opacity:{fmt(value)}") for time, value in frames])


def projectile_frames(t0: float, t1: float, apex: float, hold_end: float = LOOP) -> list[tuple[float, str]]:
    frames = [(0, "translateY(0)"), (t0, "translateY(0)")]
    frames += [(time, f"translateY({fmt(y)}px)") for time, y in physics.projectile(t0, t1, apex, 10)]
    frames += [(hold_end, "translateY(0)")]
    return frames


def shadow_from_projectile(name: str, t0: float, t1: float, apex: float) -> str:
    frames: list[tuple[float, str]] = [(0, "transform:scaleX(1);opacity:.22"), (t0, "transform:scaleX(1);opacity:.22")]
    for time, y in physics.projectile(t0, t1, apex, 10):
        ratio = min(1, abs(y) / apex)
        scale = 1 - ratio * .42
        opacity = .22 - ratio * .12
        frames.append((time, f"transform:scaleX({fmt(scale)});opacity:{fmt(opacity)}"))
    frames.append((LOOP, "transform:scaleX(1);opacity:.22"))
    return keyframes(name, frames)


def common_css(stem: str) -> str:
    return dedent(f"""
      svg{{--ink:#2b2725;--dim:#d9cfc8;--panel:#f6e8e0;--brand:#d97757;--gold:#e7b85c;--ok:#4d9a73;--blue:#6b8fb8}}
      .motion{{transform-box:fill-box}} .pivot-bottom{{transform-origin:50% 100%}} .pivot-center{{transform-origin:50% 50%}}
      @media (prefers-color-scheme:dark){{svg{{--ink:#e8e1dc;--dim:#544c47;--panel:#322b28}}}}
      @media (prefers-reduced-motion:reduce){{[data-animated]{{animation:none!important}}}}
    """).strip()


def mascot_markup(stem: str, x: int = 96, y: int = 204, scale: float = 4) -> str:
    return dedent(f"""
      <g transform="translate({x} {y})">
        <g class="{stem}-x" data-animated="true"><g class="{stem}-y" data-animated="true">
          <g class="{stem}-r motion pivot-center" data-animated="true"><g class="{stem}-s motion pivot-bottom" data-animated="true">
            <use href="#{stem}-mascot" data-mascot="true" transform="scale({scale}) translate(-12 -20)"/>
          </g></g>
        </g></g>
      </g>
    """).strip()


def body_css(stem: str, x_frames=None, y_frames=None, r_frames=None, s_frames=None, shadow=None) -> str:
    blocks = []
    defaults = {
        "x": [(0, "translateX(0)"), (LOOP, "translateX(0)")],
        "y": [(0, "translateY(0)"), (LOOP, "translateY(0)")],
        "r": [(0, "rotate(0)"), (LOOP, "rotate(0)")],
        "s": [(0, "scale(1)"), (LOOP, "scale(1)")],
    }
    tracks = {"x": x_frames, "y": y_frames, "r": r_frames, "s": s_frames}
    for part, frames in tracks.items():
        name = f"{stem}-{part}"
        blocks.append(transform_frames(name, frames or defaults[part]))
        blocks.append(f".{stem}-{part}{{animation:{name} {LOOP}s linear infinite}}")
    if shadow:
        blocks.append(shadow[0])
        blocks.append(f".{stem}-shadow{{animation:{shadow[1]} {LOOP}s linear infinite}}")
    return "".join(blocks)


def scene_svg(stem: str, title: str, desc: str, css: str, content: str, mascot: str | None = None) -> str:
    mascot = mascot if mascot is not None else mascot_markup(stem)
    return dedent(f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240" role="img" aria-labelledby="{stem}-title {stem}-desc">
      <title id="{stem}-title">{title}</title>
      <desc id="{stem}-desc">{desc}</desc>
      <defs><path id="{stem}-mascot" fill="#d97757" fill-rule="evenodd" clip-rule="evenodd" d="{MASCOT_PATH}"/></defs>
      <style>{common_css(stem)}{css}</style>
      {content}
      {mascot}
    </svg>
    """).strip() + "\n"


def ground(stem: str, cx: int = 96, cy: int = 214, rx: int = 50) -> str:
    return f'<ellipse class="{stem}-shadow motion pivot-center" data-animated="true" cx="{cx}" cy="{cy}" rx="{rx}" ry="7" fill="var(--ink)" opacity=".22"/>'


def hop_profile(stem: str, t0=.45, t1=1.25, apex=18, dx=0):
    x = [(0, "translateX(0)"), (t0, "translateX(0)"), (t1, f"translateX({dx}px)"), (LOOP, "translateX(0)")]
    y = projectile_frames(t0, t1, apex)
    s = [(0, "scale(1)"), (t0-.12, "scale(1.05,.88)"), (t0, "scale(.94,1.14)"), ((t0+t1)/2, "scale(1)"), (t1-.05, "scale(.96,1.1)"), (t1, "scale(1.08,.8)"), (t1+.12, "scale(.98,1.04)"), (t1+.28, "scale(1)"), (LOOP, "scale(1)")]
    shadow_name = f"{stem}-shadow-track"
    return body_css(stem, x_frames=x, y_frames=y, s_frames=s, shadow=(shadow_from_projectile(shadow_name,t0,t1,apex), shadow_name))


def sway_profile(stem: str, amplitude=4, rotate=3):
    x=[(0,"translateX(0)"),(1.2,f"translateX({amplitude}px)"),(2.4,"translateX(0)"),(3.6,f"translateX(-{amplitude}px)"),(LOOP,"translateX(0)")]
    r=[(0,"rotate(0)"),(1.2,f"rotate({rotate}deg)"),(2.4,"rotate(0)"),(3.6,f"rotate(-{rotate}deg)"),(LOOP,"rotate(0)")]
    y=[(0,"translateY(0)"),(1.2,"translateY(-3px)"),(2.4,"translateY(0)"),(3.6,"translateY(-2px)"),(LOOP,"translateY(0)")]
    return body_css(stem,x_frames=x,y_frames=y,r_frames=r)


def brace_profile(stem: str, recoil=-8, rotate=-5):
    x=[(0,"translateX(0)"),(.5,f"translateX({-recoil/3}px)"),(.7,f"translateX({recoil}px)"),(.82,f"translateX({-recoil*.25}px)"),(1.05,"translateX(0)"),(LOOP,"translateX(0)")]
    r=[(0,"rotate(0)"),(.5,f"rotate({-rotate/3}deg)"),(.7,f"rotate({rotate}deg)"),(.9,f"rotate({-rotate*.2}deg)"),(1.1,"rotate(0)"),(LOOP,"rotate(0)")]
    s=[(0,"scale(1)"),(.5,"scale(1.04,.9)"),(.7,"scale(.96,1.08)"),(.82,"scale(1.03,.94)"),(1.05,"scale(1)"),(LOOP,"scale(1)")]
    return body_css(stem,x_frames=x,r_frames=r,s_frames=s)


def terminal_sprint():
    stem="claude-code-terminal-sprint"
    css=hop_profile(stem,.6,1.25,10,6)
    css+=transform_frames(f"{stem}-key",[(0,"translateY(0)"),(.72,"translateY(0)"),(.78,"translateY(3px)"),(.86,"translateY(0)"),(LOOP,"translateY(0)")])
    css+=f".{stem}-key{{animation:{stem}-key .72s cubic-bezier(.11,0,.5,0) infinite}}"
    css+=opacity_frames(f"{stem}-cursor",[(0,1),(.42,1),(.43,.08),(.84,.08),(.85,1),(LOOP,1)])+f".{stem}-cursor{{animation:{stem}-cursor .9s steps(1,end) infinite}}"
    content=ground(stem)+dedent(f"""
      <rect x="184" y="42" width="146" height="112" rx="14" fill="var(--ink)"/>
      <circle cx="202" cy="60" r="4" fill="#c65a4c"/><circle cx="216" cy="60" r="4" fill="var(--gold)"/><circle cx="230" cy="60" r="4" fill="var(--ok)"/>
      <g fill="var(--ok)"><rect x="202" y="82" width="88" height="6" rx="3"/><rect x="202" y="101" width="66" height="6" rx="3"/><rect x="202" y="120" width="96" height="6" rx="3"/><rect class="{stem}-cursor" data-animated="true" x="305" y="117" width="5" height="10" rx="1"/></g>
      <g fill="var(--panel)" stroke="var(--dim)" stroke-width="2"><rect x="172" y="174" width="166" height="34" rx="8"/><rect class="{stem}-key" data-animated="true" x="190" y="183" width="32" height="16" rx="4"/><rect class="{stem}-key" data-animated="true" x="239" y="183" width="32" height="16" rx="4" style="animation-delay:.18s"/><rect class="{stem}-key" data-animated="true" x="288" y="183" width="32" height="16" rx="4" style="animation-delay:.36s"/></g>
    """)
    return stem,"Claude Code Terminal Sprint","Claude Code makes a short physically sampled hop while rapid key presses, cursor timing, landing squash, and contact shadow remain synchronized inside the frame.",css,content


def bug_hunt():
    stem="claude-code-bug-hunt"
    x=[(0,"translateX(0)"),(.55,"translateX(-4px)"),(1.55,"translateX(24px)"),(2.05,"translateX(18px)"),(3.2,"translateX(0)"),(LOOP,"translateX(0)")]
    y=[(0,"translateY(0)"),(.55,"translateY(1px)"),(1.05,"translateY(-7px)"),(1.55,"translateY(0)"),(2.05,"translateY(-5px)"),(2.55,"translateY(0)"),(LOOP,"translateY(0)")]
    r=[(0,"rotate(0)"),(.55,"rotate(-3deg)"),(1.55,"rotate(4deg)"),(2.55,"rotate(-2deg)"),(3.2,"rotate(0)"),(LOOP,"rotate(0)")]
    css=body_css(stem,x_frames=x,y_frames=y,r_frames=r)
    css+=transform_frames(f"{stem}-bug",[(0,"translateX(0) rotate(0)"),(.7,"translateX(-10px) rotate(-8deg)"),(1.4,"translateX(12px) rotate(8deg)"),(2.1,"translateX(-6px) rotate(-5deg)"),(2.8,"translateX(8px) rotate(6deg)"),(LOOP,"translateX(0) rotate(0)")])+f".{stem}-bug{{animation:{stem}-bug 2.8s cubic-bezier(.37,0,.63,1) infinite}}"
    css+=transform_frames(f"{stem}-lens",[(0,"rotate(-5deg)"),(.8,"rotate(7deg)"),(1.6,"rotate(-3deg)"),(2.4,"rotate(5deg)"),(LOOP,"rotate(-5deg)")])+f".{stem}-lens{{animation:{stem}-lens {LOOP}s cubic-bezier(.37,0,.63,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <g class="{stem}-lens motion pivot-center" data-animated="true"><circle cx="218" cy="126" r="31" fill="none" stroke="var(--blue)" stroke-width="7"/><path d="M239 149l31 31" stroke="var(--ink)" stroke-width="9" stroke-linecap="round"/></g>
      <g class="{stem}-bug motion pivot-center" data-animated="true" fill="var(--gold)" stroke="var(--ink)" stroke-width="3"><ellipse cx="286" cy="181" rx="17" ry="12"/><circle cx="273" cy="177" r="8"/><path d="M278 168l-8-9M290 169l8-9M276 187l-10 8M292 187l10 8" fill="none" stroke-linecap="round"/></g>
    """)
    return stem,"Claude Code Bug Hunt","Claude Code pursues a scuttling bug with bounded body travel, alternating hops, a damped lens swing, and no element crossing the scene edge.",css,content


def git_merge():
    stem="claude-code-git-merge"
    css=brace_profile(stem,-9,-6)
    css+=transform_frames(f"{stem}-upper",[(0,"translateY(-22px)"),(.5,"translateY(-22px)"),(1.15,"translateY(0)"),(1.35,"translateY(3px)"),(1.6,"translateY(0)"),(LOOP,"translateY(-22px)")])+f".{stem}-upper{{animation:{stem}-upper {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    css+=transform_frames(f"{stem}-lower",[(0,"translateY(22px)"),(.5,"translateY(22px)"),(1.15,"translateY(0)"),(1.35,"translateY(-3px)"),(1.6,"translateY(0)"),(LOOP,"translateY(22px)")])+f".{stem}-lower{{animation:{stem}-lower {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <path d="M140 184h58" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
      <g class="{stem}-upper motion pivot-center" data-animated="true"><path d="M198 118h42c28 0 26 38 55 38h29" fill="none" stroke="var(--blue)" stroke-width="7" stroke-linecap="round"/><circle cx="198" cy="118" r="8" fill="var(--blue)"/><circle cx="324" cy="156" r="8" fill="var(--blue)"/></g>
      <g class="{stem}-lower motion pivot-center" data-animated="true"><path d="M198 156h42c28 0 26-38 55-38h29" fill="none" stroke="var(--gold)" stroke-width="7" stroke-linecap="round"/><circle cx="198" cy="156" r="8" fill="var(--gold)"/><circle cx="324" cy="118" r="8" fill="var(--gold)"/></g>
      <circle cx="267" cy="137" r="11" fill="var(--ok)" stroke="var(--ink)" stroke-width="3"/>
    """)
    return stem,"Claude Code Git Merge","Claude Code braces and transfers force into two Git branches that converge with overshoot and settle entirely inside the safe area.",css,content


def context_juggle():
    stem="claude-code-context-juggle"
    css=sway_profile(stem,5,4)
    cards=[]
    positions=[(196,118,-28,0),(248,94,-38,.45),(300,120,-30,.9)]
    for i,(x,y,apex,delay) in enumerate(positions):
        name=f"{stem}-card-{i}"
        frames=[(0,"translate(0,0) rotate(0)"),(.45+delay,"translate(0,0) rotate(0)"),(1.05+delay,f"translate({8 if i!=1 else -6}px,{apex}px) rotate({10 if i%2==0 else -9}deg)"),(1.65+delay,"translate(0,0) rotate(0)"),(LOOP,"translate(0,0) rotate(0)")]
        css+=transform_frames(name,frames)+f".{name}{{animation:{name} {LOOP}s linear infinite}}"
        cards.append(f'<g class="{name} motion pivot-center" data-animated="true"><rect x="{x}" y="{y}" width="43" height="54" rx="8" fill="var(--panel)" stroke="var(--dim)" stroke-width="3"/><path d="M{x+10} {y+18}h23M{x+10} {y+29}h18M{x+10} {y+40}h25" stroke="var(--blue)" stroke-width="4" stroke-linecap="round"/></g>')
    content=ground(stem)+"".join(cards)
    return stem,"Claude Code Context Juggle","Claude Code shifts its weight while three context cards follow staggered bounded arcs with rotation, anticipation, and recoveries that never leave the viewBox.",css,content


def release_launch():
    stem="claude-code-release-launch"
    css=brace_profile(stem,-10,-6)
    css+=transform_frames(f"{stem}-rocket",[(0,"translateY(0)"),(.7,"translateY(0)"),(1.55,"translateY(-88px)"),(1.72,"translateY(-84px)"),(2.1,"translateY(-88px)"),(LOOP,"translateY(0)")])+f".{stem}-rocket{{animation:{stem}-rocket {LOOP}s cubic-bezier(.5,0,.75,1) infinite}}"
    css+=keyframes(f"{stem}-smoke",[(0,"transform:scale(.4);opacity:0"),(.72,"transform:scale(.4);opacity:0"),(1.05,"transform:scale(1);opacity:.55"),(1.55,"transform:scale(1.45);opacity:0"),(LOOP,"transform:scale(.4);opacity:0")])+f".{stem}-smoke{{animation:{stem}-smoke {LOOP}s linear infinite}}"
    content=ground(stem)+dedent(f"""
      <g class="{stem}-rocket motion pivot-center" data-animated="true"><path d="M269 158c0-28 13-49 26-60 13 11 26 32 26 60l-13 15h-26z" fill="var(--blue)" stroke="var(--ink)" stroke-width="3"/><circle cx="295" cy="128" r="8" fill="var(--panel)"/><path d="M282 168l-12 16M308 168l12 16" stroke="var(--gold)" stroke-width="7" stroke-linecap="round"/></g>
      <g class="{stem}-smoke motion pivot-center" data-animated="true" fill="var(--dim)"><circle cx="281" cy="202" r="13"/><circle cx="298" cy="204" r="17"/><circle cx="316" cy="201" r="12"/></g>
      <path d="M250 214h84" stroke="var(--dim)" stroke-width="5" stroke-linecap="round"/>
    """)
    return stem,"Claude Code Release Launch","Claude Code anticipates and recoils while a rocket accelerates upward to a bounded apex, followed by damped settling and smoke that expands without crossing the frame.",css,content


def review_pass():
    stem="claude-code-review-pass"
    r=[(0,"rotate(0)"),(.8,"rotate(0)"),(1.05,"rotate(6deg)"),(1.22,"rotate(-2deg)"),(1.4,"rotate(1deg)"),(1.65,"rotate(0)"),(LOOP,"rotate(0)")]
    y=[(0,"translateY(0)"),(.8,"translateY(0)"),(1.05,"translateY(3px)"),(1.22,"translateY(-3px)"),(1.5,"translateY(0)"),(LOOP,"translateY(0)")]
    css=body_css(stem,y_frames=y,r_frames=r)
    css+=transform_frames(f"{stem}-sheet",[(0,"translateX(18px)"),(.55,"translateX(18px)"),(1.05,"translateX(0)"),(1.18,"translateX(-3px)"),(1.4,"translateX(0)"),(LOOP,"translateX(18px)")])+f".{stem}-sheet{{animation:{stem}-sheet {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    css+=keyframes(f"{stem}-check",[(0,"stroke-dashoffset:34;opacity:0"),(1.05,"stroke-dashoffset:34;opacity:0"),(1.45,"stroke-dashoffset:0;opacity:1"),(LOOP,"stroke-dashoffset:0;opacity:1")])+f".{stem}-check{{stroke-dasharray:34;animation:{stem}-check {LOOP}s linear infinite}}"
    content=ground(stem)+dedent(f"""
      <g class="{stem}-sheet motion pivot-center" data-animated="true"><rect x="182" y="44" width="148" height="154" rx="14" fill="var(--panel)" stroke="var(--dim)" stroke-width="3"/><path d="M204 77h86M204 103h105M204 129h79" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/><circle cx="295" cy="161" r="22" fill="var(--ok)"/><path class="{stem}-check" data-animated="true" d="M283 161l9 9 17-20" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
    """)
    return stem,"Claude Code Review Pass","Claude Code performs a damped approval nod as a review sheet settles under friction and its check draws inside the panel.",css,content


def pair_session():
    stem="claude-code-pair-session"
    css=sway_profile(stem,4,3)
    css+=opacity_frames(f"{stem}-msg-a",[(0,0),(.5,0),(.8,1),(1.7,1),(2.0,0),(LOOP,0)])+f".{stem}-msg-a{{animation:{stem}-msg-a {LOOP}s linear infinite}}"
    css+=opacity_frames(f"{stem}-msg-b",[(0,0),(1.7,0),(2.0,1),(3.1,1),(3.4,0),(LOOP,0)])+f".{stem}-msg-b{{animation:{stem}-msg-b {LOOP}s linear infinite}}"
    content=ground(stem)+dedent(f"""
      <rect x="181" y="53" width="151" height="135" rx="14" fill="var(--ink)"/>
      <path d="M199 78h85M199 97h106M199 116h66" stroke="var(--ok)" stroke-width="6" stroke-linecap="round"/>
      <g class="{stem}-msg-a" data-animated="true"><rect x="196" y="135" width="87" height="27" rx="12" fill="var(--blue)"/><path d="M214 149h50" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>
      <g class="{stem}-msg-b" data-animated="true"><rect x="238" y="164" width="76" height="24" rx="11" fill="var(--gold)"/><path d="M252 176h47" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/></g>
    """)
    return stem,"Claude Code Pair Session","Claude Code rocks gently toward a terminal while two timed responses exchange in sequence, keeping the character and conversation inside the frame.",css,content


def refactor_pull():
    stem="claude-code-refactor-pull"
    css=brace_profile(stem,-12,-8)
    css+=transform_frames(f"{stem}-modules",[(0,"translateX(34px) scale(.86)"),(.6,"translateX(34px) scale(.86)"),(1.25,"translateX(0) scale(1.04)"),(1.45,"translateX(4px) scale(.98)"),(1.7,"translateX(0) scale(1)"),(LOOP,"translateX(34px) scale(.86)")])+f".{stem}-modules{{animation:{stem}-modules {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <path d="M139 178c34-26 42 18 79-2" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
      <path d="M218 176c25-44 49 40 98-19M218 176c31 26 52-40 101 8" fill="none" stroke="var(--dim)" stroke-width="5" stroke-linecap="round" stroke-dasharray="8 8"/>
      <g class="{stem}-modules motion pivot-center" data-animated="true" fill="var(--panel)" stroke="var(--blue)" stroke-width="3"><rect x="222" y="65" width="92" height="34" rx="8"/><rect x="222" y="113" width="92" height="34" rx="8"/><rect x="222" y="161" width="92" height="34" rx="8"/></g>
    """)
    return stem,"Claude Code Refactor Pull","Claude Code leans into a tensioned code rope and releases stored energy as three modules overshoot and settle within the safe zone.",css,content


def test_lab():
    stem="claude-code-test-lab"
    css=brace_profile(stem,-5,-3)
    cards=[]
    for i,x in enumerate((188,238,288)):
        name=f"{stem}-drop-{i}"
        start=.45+i*.28
        frames=[(0,"translateY(0) scale(1)"),(start,"translateY(0) scale(1)"),(start+.58,"translateY(112px) scale(1)"),(start+.64,"translateY(112px) scale(1.08,.82)"),(start+.78,"translateY(104px) scale(.98,1.04)"),(start+.96,"translateY(112px) scale(1)"),(LOOP,"translateY(112px) scale(1)")]
        css+=transform_frames(name,frames)+f".{name}{{animation:{name} {LOOP}s cubic-bezier(.11,0,.5,0) infinite}}"
        cards.append(f'<g class="{name} motion pivot-bottom" data-animated="true"><rect x="{x}" y="34" width="38" height="46" rx="8" fill="var(--panel)" stroke="var(--dim)" stroke-width="3"/><path d="M{x+10} 57l7 7 13-16" fill="none" stroke="var(--ok)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>')
    content=ground(stem)+"".join(cards)+ '<path d="M178 194h154" stroke="var(--dim)" stroke-width="5" stroke-linecap="round"/>'
    return stem,"Claude Code Test Lab","Claude Code braces while test cards accelerate under gravity, compress briefly on contact, rebound once, and settle without starting outside the frame.",css,content


def coffee_compile():
    stem="claude-code-coffee-compile"
    r=[(0,"rotate(0)"),(.7,"rotate(0)"),(1.15,"rotate(5deg)"),(1.7,"rotate(5deg)"),(2.1,"rotate(-1deg)"),(2.35,"rotate(0)"),(LOOP,"rotate(0)")]
    x=[(0,"translateX(0)"),(.7,"translateX(0)"),(1.15,"translateX(7px)"),(1.7,"translateX(7px)"),(2.35,"translateX(0)"),(LOOP,"translateX(0)")]
    css=body_css(stem,x_frames=x,r_frames=r)
    css+=transform_frames(f"{stem}-cup",[(0,"rotate(0)"),(.7,"rotate(0)"),(1.15,"rotate(-13deg)"),(1.7,"rotate(-13deg)"),(2.1,"rotate(3deg)"),(2.35,"rotate(0)"),(LOOP,"rotate(0)")])+f".{stem}-cup{{animation:{stem}-cup {LOOP}s cubic-bezier(.37,0,.63,1) infinite}}"
    css+=transform_frames(f"{stem}-steam",[(0,"translateY(0) scale(1)"),(1.2,"translateY(-14px) scale(1.06)"),(2.4,"translateY(-28px) scale(.92)"),(3.6,"translateY(-14px) scale(1.04)"),(LOOP,"translateY(0) scale(1)")])+f".{stem}-steam{{animation:{stem}-steam {LOOP}s cubic-bezier(.37,0,.63,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <g class="{stem}-cup motion pivot-center" data-animated="true"><path d="M184 155h64v43c0 10-9 18-20 18h-24c-11 0-20-8-20-18z" fill="var(--panel)" stroke="var(--ink)" stroke-width="4"/><path d="M248 166h12c20 0 20 28 0 28h-12" fill="none" stroke="var(--ink)" stroke-width="5"/><ellipse cx="216" cy="155" rx="30" ry="7" fill="#8a5a44"/></g>
      <g class="{stem}-steam motion pivot-center" data-animated="true" fill="none" stroke="var(--dim)" stroke-width="5" stroke-linecap="round"><path d="M202 136c-10-12 10-18 0-31"/><path d="M222 136c-10-12 10-18 0-31"/><path d="M242 136c-10-12 10-18 0-31"/></g>
      <rect x="278" y="66" width="54" height="112" rx="10" fill="var(--ink)"/><path d="M291 91h27M291 112h20M291 133h31M291 154h24" stroke="var(--ok)" stroke-width="5" stroke-linecap="round"/>
    """)
    return stem,"Claude Code Coffee Compile","Claude Code leans toward a cup with counterweighted rotation while steam rises in harmonic motion and the compile panel remains fixed inside the frame.",css,content


def focus_lock():
    stem="claude-code-focus-lock"
    s=[(0,"scale(1)"),(1.2,"scale(1.025,.975)"),(2.4,"scale(1)"),(3.6,"scale(1.025,.975)"),(LOOP,"scale(1)")]
    css=body_css(stem,s_frames=s)
    css+=transform_frames(f"{stem}-orbit",[(0,"rotate(0)"),(LOOP,"rotate(360deg)")])+f".{stem}-orbit{{animation:{stem}-orbit {LOOP}s linear infinite;transform-origin:258px 119px}}"
    css+=keyframes(f"{stem}-fade",[(0,"opacity:1;transform:scale(1)"),(2.7,"opacity:1;transform:scale(1)"),(3.5,"opacity:.15;transform:scale(.72)"),(LOOP,"opacity:1;transform:scale(1)")])+f".{stem}-fade{{animation:{stem}-fade {LOOP}s cubic-bezier(.5,1,.89,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <circle cx="258" cy="119" r="52" fill="none" stroke="var(--blue)" stroke-width="4" stroke-dasharray="8 9"/>
      <circle cx="258" cy="119" r="25" fill="var(--panel)" stroke="var(--ok)" stroke-width="5"/><circle cx="258" cy="119" r="8" fill="var(--ok)"/>
      <g class="{stem}-orbit" data-animated="true"><g class="{stem}-fade motion pivot-center" data-animated="true"><rect x="248" y="45" width="38" height="28" rx="7" fill="var(--gold)"/></g><g class="{stem}-fade motion pivot-center" data-animated="true" style="animation-delay:.35s"><rect x="306" y="105" width="36" height="28" rx="7" fill="var(--blue)"/></g><g class="{stem}-fade motion pivot-center" data-animated="true" style="animation-delay:.7s"><rect x="228" y="168" width="42" height="28" rx="7" fill="var(--dim)"/></g></g>
    """)
    return stem,"Claude Code Focus Lock","Claude Code breathes at center while bounded distraction cards orbit a focus target, shrink under damping, and return without touching the frame.",css,content


def memory_search():
    stem="claude-code-memory-search"
    css=sway_profile(stem,3,2)
    css+=transform_frames(f"{stem}-lens",[(0,"translateX(0)"),(.5,"translateX(0)"),(2.05,"translateX(94px)"),(2.25,"translateX(88px)"),(2.5,"translateX(94px)"),(4.0,"translateX(0)"),(LOOP,"translateX(0)")])+f".{stem}-lens{{animation:{stem}-lens {LOOP}s cubic-bezier(.25,.7,.35,1) infinite}}"
    css+=transform_frames(f"{stem}-card",[(0,"translateY(0)"),(1.2,"translateY(0)"),(1.55,"translateY(-8px)"),(1.9,"translateY(0)"),(LOOP,"translateY(0)")])+f".{stem}-card{{animation:{stem}-card {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    cards=''.join(f'<g class="{stem}-card motion pivot-center" data-animated="true" style="animation-delay:{i*.32}s"><rect x="{184+i*48}" y="68" width="40" height="90" rx="8" fill="var(--panel)" stroke="var(--dim)" stroke-width="3"/><path d="M{194+i*48} 91h20M{194+i*48} 110h16M{194+i*48} 129h22" stroke="var(--blue)" stroke-width="4" stroke-linecap="round"/></g>' for i in range(3))
    content=ground(stem)+cards+dedent(f"""
      <g class="{stem}-lens motion pivot-center" data-animated="true"><circle cx="202" cy="179" r="26" fill="none" stroke="var(--gold)" stroke-width="7"/><path d="M220 198l25 20" stroke="var(--ink)" stroke-width="8" stroke-linecap="round"/></g>
    """)
    return stem,"Claude Code Memory Search","Claude Code tracks a lens that scans three memory cards with damped travel; each card lifts only when the scan reaches it and all geometry stays bounded.",css,content


def package_drop():
    stem="claude-code-package-drop"
    css=brace_profile(stem,-6,-4)
    frames=[(0,"translateY(0) scale(1)"),(.45,"translateY(0) scale(1)"),(1.1,"translateY(112px) scale(1)"),(1.17,"translateY(112px) scale(1.1,.78)"),(1.32,"translateY(96px) scale(.98,1.04)"),(1.55,"translateY(112px) scale(1.03,.94)"),(1.78,"translateY(112px) scale(1)"),(LOOP,"translateY(0) scale(1)")]
    css+=transform_frames(f"{stem}-box",frames)+f".{stem}-box{{animation:{stem}-box {LOOP}s cubic-bezier(.11,0,.5,0) infinite}}"
    css+=transform_frames(f"{stem}-lid",[(0,"rotate(0)"),(1.1,"rotate(0)"),(1.22,"rotate(-8deg)"),(1.45,"rotate(3deg)"),(1.68,"rotate(0)"),(LOOP,"rotate(0)")])+f".{stem}-lid{{animation:{stem}-lid {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <g class="{stem}-box motion pivot-bottom" data-animated="true"><rect x="220" y="42" width="82" height="62" rx="9" fill="var(--gold)" stroke="var(--ink)" stroke-width="4"/><path d="M261 42v62M220 66h82" stroke="var(--ink)" stroke-width="4"/><g class="{stem}-lid motion pivot-center" data-animated="true"><path d="M216 43h90v18h-90z" fill="var(--panel)" stroke="var(--ink)" stroke-width="4"/></g></g>
      <path d="M190 216h139" stroke="var(--dim)" stroke-width="5" stroke-linecap="round"/>
    """)
    return stem,"Claude Code Package Drop","Claude Code braces as a package accelerates from an in-frame start, compresses on contact, rebounds once, and transfers energy into a damped lid rotation.",css,content


def incident_response():
    stem="claude-code-incident-response"
    x=[(0,"translateX(0)"),(.35,"translateX(-5px)"),(.95,"translateX(34px)"),(1.25,"translateX(40px)"),(2.05,"translateX(40px)"),(2.55,"translateX(0)"),(LOOP,"translateX(0)")]
    y=[(0,"translateY(0)"),(.35,"translateY(2px)"),(.65,"translateY(-8px)"),(.95,"translateY(0)"),(1.25,"translateY(-5px)"),(1.55,"translateY(0)"),(LOOP,"translateY(0)")]
    r=[(0,"rotate(0)"),(.35,"rotate(-4deg)"),(.95,"rotate(6deg)"),(1.35,"rotate(-3deg)"),(2.1,"rotate(0)"),(LOOP,"rotate(0)")]
    css=body_css(stem,x_frames=x,y_frames=y,r_frames=r)
    css+=keyframes(f"{stem}-blast",[(0,"transform:scaleX(.05);opacity:0"),(1.2,"transform:scaleX(.05);opacity:0"),(1.42,"transform:scaleX(1);opacity:.8"),(2.0,"transform:scaleX(1);opacity:.6"),(2.25,"transform:scaleX(.2);opacity:0"),(LOOP,"transform:scaleX(.05);opacity:0")])+f".{stem}-blast{{animation:{stem}-blast {LOOP}s cubic-bezier(.5,0,.75,1) infinite}}"
    css+=keyframes(f"{stem}-flame",[(0,"transform:scale(1);opacity:1"),(1.42,"transform:scale(1);opacity:1"),(2.05,"transform:scale(.45);opacity:.35"),(2.35,"transform:scale(.2);opacity:0"),(LOOP,"transform:scale(1);opacity:1")])+f".{stem}-flame{{animation:{stem}-flame {LOOP}s cubic-bezier(.5,1,.89,1) infinite}}"
    content=ground(stem,116)+dedent(f"""
      <g class="{stem}-blast motion pivot-center" data-animated="true"><path d="M154 168h112" stroke="var(--blue)" stroke-width="14" stroke-linecap="round"/><circle cx="266" cy="168" r="17" fill="var(--blue)" opacity=".55"/></g>
      <g class="{stem}-flame motion pivot-bottom" data-animated="true"><path d="M294 195c-27-20-4-39 4-58 8 14 25 22 18 42 14-8 22 6 14 16z" fill="#c65a4c" stroke="var(--ink)" stroke-width="4"/><path d="M300 194c-9-8 1-17 5-24 7 8 10 15 4 24z" fill="var(--gold)"/></g>
    """)
    return stem,"Claude Code Incident Response","Claude Code executes a bounded two-hop dash and releases an extinguishing blast that displaces and damps the flame without any off-canvas reset.",css,content


def branch_swing():
    stem="claude-code-branch-swing"
    period=round(physics.pendulum_period(94,980),3)
    duration=max(3.2,period*2.2)
    css=transform_frames(f"{stem}-swing",[(0,"rotate(-18deg)"),(LOOP/2,"rotate(18deg)"),(LOOP,"rotate(-18deg)")])+f".{stem}-swing{{animation:{stem}-swing {LOOP}s cubic-bezier(.37,0,.63,1) infinite;transform-origin:220px 30px}}"
    css+=transform_frames(f"{stem}-upright",[(0,"rotate(12deg)"),(LOOP/2,"rotate(-12deg)"),(LOOP,"rotate(12deg)")])+f".{stem}-upright{{animation:{stem}-upright {LOOP}s cubic-bezier(.37,0,.63,1) infinite}}"
    css+=transform_frames(f"{stem}-shadow-track",[(0,"translateX(-29px) scaleX(.78)"),(LOOP/4,"translateX(0) scaleX(1)"),(LOOP/2,"translateX(29px) scaleX(.78)"),(3*LOOP/4,"translateX(0) scaleX(1)"),(LOOP,"translateX(-29px) scaleX(.78)")])+f".{stem}-shadow{{animation:{stem}-shadow-track {LOOP}s cubic-bezier(.37,0,.63,1) infinite}}"
    mascot=dedent(f"""
      <g class="{stem}-swing" data-animated="true"><path d="M220 30v94" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><g transform="translate(220 174)"><g class="{stem}-upright motion pivot-center" data-animated="true"><use href="#{stem}-mascot" data-mascot="true" transform="scale(4) translate(-12 -20)"/></g></g></g>
    """)
    content=f'<path d="M42 30h276" stroke="var(--ink)" stroke-width="8" stroke-linecap="round"/><circle cx="220" cy="30" r="10" fill="var(--gold)" stroke="var(--ink)" stroke-width="3"/>'+ground(stem,220,219,52)
    desc=f"Claude Code swings from a branch with a pendulum-derived period of {duration:.2f} seconds, counter-rotation for balance, and a shadow driven by arc position."
    return stem,"Claude Code Branch Swing",desc,css,content,mascot


def token_rain():
    stem="claude-code-token-rain"
    css=brace_profile(stem,-3,-2)
    tokens=[]
    for i,(x,size) in enumerate(((196,10),(232,12),(270,9),(307,11))):
        name=f"{stem}-token-{i}"
        delay=.25+i*.42
        frames=[(0,"translateY(0) rotate(0);opacity:0"),(delay,"translateY(0) rotate(0);opacity:0"),(delay+.1,"translateY(0) rotate(0);opacity:1"),(delay+1.35,f"translateY(164px) rotate({180 if i%2==0 else -210}deg);opacity:1"),(delay+1.48,f"translateY(164px) rotate({190 if i%2==0 else -220}deg);opacity:0"),(LOOP,"translateY(0) rotate(0);opacity:0")]
        css+=keyframes(name,[(t,f"transform:{v.split(';')[0]};{';'.join(v.split(';')[1:])}" if ';' in v else f"transform:{v}") for t,v in frames])+f".{name}{{animation:{name} {LOOP}s linear infinite}}"
        tokens.append(f'<g class="{name} motion pivot-center" data-animated="true"><circle cx="{x}" cy="24" r="{size}" fill="var(--gold)" stroke="var(--ink)" stroke-width="3"/><path d="M{x-4} 24h8" stroke="var(--ink)" stroke-width="2"/></g>')
    css+=transform_frames(f"{stem}-umbrella",[(0,"translateY(0) scaleX(1)"),(1.55,"translateY(0) scaleX(1)"),(1.68,"translateY(4px) scaleX(1.05)"),(1.84,"translateY(-2px) scaleX(.99)"),(2.05,"translateY(0) scaleX(1)"),(LOOP,"translateY(0) scaleX(1)")])+f".{stem}-umbrella{{animation:{stem}-umbrella {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <g class="{stem}-umbrella motion pivot-bottom" data-animated="true"><path d="M43 126c8-49 103-49 111 0-13-8-25-8-37 0-13-8-25-8-37 0-13-8-25-8-37 0z" fill="var(--blue)" stroke="var(--ink)" stroke-width="4"/><path d="M99 126v66c0 17 23 17 23 0" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></g>
    """)+''.join(tokens)
    return stem,"Claude Code Token Rain","Claude Code compresses under a bounded umbrella while tokens fall from visible in-frame starts under constant acceleration and fade before resetting.",css,content


def prompt_fishing():
    stem="claude-code-prompt-fishing"
    css=brace_profile(stem,-7,-5)
    css+=transform_frames(f"{stem}-rod",[(0,"rotate(2deg)"),(.9,"rotate(2deg)"),(1.2,"rotate(-12deg)"),(1.48,"rotate(8deg)"),(1.72,"rotate(-3deg)"),(2.05,"rotate(2deg)"),(LOOP,"rotate(2deg)")])+f".{stem}-rod{{animation:{stem}-rod {LOOP}s cubic-bezier(.3,.85,.4,1) infinite;transform-origin:139px 165px}}"
    css+=transform_frames(f"{stem}-catch",[(0,"translateY(0) rotate(-3deg)"),(.9,"translateY(0) rotate(-3deg)"),(1.2,"translateY(8px) rotate(4deg)"),(1.48,"translateY(-48px) rotate(-8deg)"),(1.72,"translateY(-39px) rotate(4deg)"),(2.05,"translateY(-43px) rotate(0)"),(LOOP,"translateY(0) rotate(-3deg)")])+f".{stem}-catch{{animation:{stem}-catch {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    content=ground(stem)+dedent(f"""
      <path d="M174 194c46-14 111-14 160 0v22H174z" fill="var(--blue)" opacity=".45"/>
      <g class="{stem}-rod" data-animated="true"><path d="M139 165L284 91" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/><path d="M284 91v83" stroke="var(--dim)" stroke-width="3"/><circle cx="284" cy="174" r="6" fill="var(--gold)"/></g>
      <g class="{stem}-catch motion pivot-center" data-animated="true"><rect x="255" y="151" width="58" height="35" rx="8" fill="var(--panel)" stroke="var(--ink)" stroke-width="3"/><path d="M267 168h34" stroke="var(--blue)" stroke-width="4" stroke-linecap="round"/></g>
    """)
    return stem,"Claude Code Prompt Fishing","Claude Code loads the rod in anticipation, stretches the line, and lifts a prompt card with elastic overshoot while every point remains inside the scene.",css,content


def agent_conductor():
    stem="claude-code-agent-conductor"
    css=sway_profile(stem,4,5)
    css+=transform_frames(f"{stem}-baton",[(0,"rotate(-16deg)"),(.6,"rotate(18deg)"),(1.2,"rotate(-8deg)"),(1.8,"rotate(22deg)"),(2.4,"rotate(-16deg)"),(LOOP,"rotate(-16deg)")])+f".{stem}-baton{{animation:{stem}-baton 2.4s cubic-bezier(.37,0,.63,1) infinite;transform-origin:148px 157px}}"
    cards=[]
    for i,(x,y) in enumerate(((203,67),(253,111),(303,155))):
        name=f"{stem}-card-{i}"
        frames=[(0,"translateX(0)"),(.45+i*.25,"translateX(0)"),(1.0+i*.25,"translateX(12px)"),(1.25+i*.25,"translateX(8px)"),(1.55+i*.25,"translateX(12px)"),(2.2+i*.25,"translateX(0)"),(LOOP,"translateX(0)")]
        css+=transform_frames(name,frames)+f".{name}{{animation:{name} {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
        cards.append(f'<g class="{name} motion pivot-center" data-animated="true"><rect x="{x}" y="{y}" width="38" height="32" rx="7" fill="var(--panel)" stroke="var(--dim)" stroke-width="3"/><circle cx="{x+11}" cy="{y+16}" r="5" fill="var(--ok)"/><path d="M{x+21} {y+16}h9" stroke="var(--blue)" stroke-width="4" stroke-linecap="round"/></g>')
    content=ground(stem)+dedent(f"""
      <g class="{stem}-baton" data-animated="true"><path d="M148 157l48-47" stroke="var(--gold)" stroke-width="6" stroke-linecap="round"/><circle cx="196" cy="110" r="7" fill="var(--gold)"/></g>
      <path d="M190 50v150" stroke="var(--dim)" stroke-width="4" stroke-dasharray="7 9"/>
    """)+''.join(cards)
    return stem,"Claude Code Agent Conductor","Claude Code conducts three task cards through a synchronized bounded pipeline, with the body and baton sharing one rhythm and each card settling on cue.",css,content


def build_sleep():
    stem="claude-code-build-sleep"
    s=[(0,"scale(1)"),(1.2,"scale(1.035,.965)"),(2.4,"scale(1)"),(3.6,"scale(1.035,.965)"),(LOOP,"scale(1)")]
    y=[(0,"translateY(0)"),(1.2,"translateY(2px)"),(2.4,"translateY(0)"),(3.6,"translateY(2px)"),(LOOP,"translateY(0)")]
    css=body_css(stem,y_frames=y,s_frames=s)
    css+=transform_frames(f"{stem}-z",[(0,"translate(0,0) scale(.75)"),(1.2,"translate(13px,-28px) scale(1.05)"),(2.3,"translate(20px,-48px) scale(1.2)"),(LOOP,"translate(0,0) scale(.75)")])+f".{stem}-z{{animation:{stem}-z 3.2s cubic-bezier(.5,1,.89,1) infinite}}"
    css+=keyframes(f"{stem}-success",[(0,"transform:translateY(10px) scale(.75);opacity:0"),(2.5,"transform:translateY(10px) scale(.75);opacity:0"),(2.9,"transform:translateY(-3px) scale(1.08);opacity:1"),(3.18,"transform:translateY(0) scale(1);opacity:1"),(LOOP,"transform:translateY(0) scale(1);opacity:1")])+f".{stem}-success{{animation:{stem}-success {LOOP}s cubic-bezier(.3,.85,.4,1) infinite}}"
    mascot=mascot_markup(stem,99,197,4)
    content=dedent(f"""
      <rect x="35" y="178" width="135" height="38" rx="18" fill="var(--panel)"/><ellipse class="{stem}-shadow motion pivot-center" data-animated="true" cx="99" cy="211" rx="54" ry="7" fill="var(--ink)" opacity=".18"/>
      <g fill="#8a78a8" font-family="ui-monospace,monospace" font-weight="700"><text class="{stem}-z" data-animated="true" x="146" y="118" font-size="22">Z</text><text class="{stem}-z" data-animated="true" x="169" y="95" font-size="17" style="animation-delay:1s">Z</text></g>
      <rect x="216" y="62" width="111" height="126" rx="13" fill="var(--ink)"/><circle cx="237" cy="84" r="8" fill="var(--ok)"/><path d="M255 84h47M233 111h69M233 136h55M233 161h62" stroke="var(--ok)" stroke-width="5" stroke-linecap="round"/>
      <g class="{stem}-success motion pivot-center" data-animated="true"><path d="M224 25h99v40h-22l-10 11v-11h-67z" fill="var(--ok)"/><path d="M247 45l9 9 18-20" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
    """)
    return stem,"Claude Code Build Sleep","Claude Code breathes slowly while sleeping through a build; buoyant Zs and a damped success message remain fully inside the frame.",css,content,mascot


def victory_dance():
    stem="claude-code-victory-dance"
    css=hop_profile(stem,.45,1.25,32,8)
    css+=transform_frames(f"{stem}-r",[(0,"rotate(0)"),(.45,"rotate(-5deg)"),(.85,"rotate(10deg)"),(1.25,"rotate(-7deg)"),(1.55,"rotate(3deg)"),(1.85,"rotate(0)"),(LOOP,"rotate(0)")])
    css+=keyframes(f"{stem}-ring",[(0,"transform:scale(.4);opacity:0"),(1.18,"transform:scale(.4);opacity:0"),(1.25,"transform:scale(.55);opacity:.75"),(1.72,"transform:scale(1.35);opacity:0"),(LOOP,"transform:scale(.4);opacity:0")])+f".{stem}-ring{{animation:{stem}-ring {LOOP}s cubic-bezier(.5,1,.89,1) infinite}}"
    confetti=[]
    for i,(x,c) in enumerate(((190,"#c65a4c"),(218,"#e7b85c"),(248,"#6b8fb8"),(278,"#4d9a73"),(307,"#c65a4c"),(333,"#e7b85c"))):
        name=f"{stem}-confetti-{i}"
        start=.35+i*.12
        css+=keyframes(name,[(0,"transform:translateY(0) rotate(0);opacity:0"),(start,"transform:translateY(0) rotate(0);opacity:0"),(start+.1,"transform:translateY(0) rotate(0);opacity:1"),(start+1.5,f"transform:translateY(154px) rotate({210 if i%2==0 else -230}deg);opacity:1"),(start+1.65,f"transform:translateY(154px) rotate({220 if i%2==0 else -240}deg);opacity:0"),(LOOP,"transform:translateY(0) rotate(0);opacity:0")])+f".{name}{{animation:{name} {LOOP}s linear infinite}}"
        confetti.append(f'<rect class="{name} motion pivot-center" data-animated="true" x="{x}" y="28" width="8" height="14" rx="2" fill="{c}"/>')
    content=ground(stem)+f'<circle class="{stem}-ring motion pivot-center" data-animated="true" cx="96" cy="184" r="46" fill="none" stroke="var(--gold)" stroke-width="6"/>'+''.join(confetti)
    return stem,"Claude Code Victory Dance","Claude Code performs a sampled jump with velocity-linked squash, rotation, responsive shadowing, an impact ring, and confetti that falls entirely within the frame.",css,content


SCENES = [
    terminal_sprint, bug_hunt, git_merge, context_juggle, release_launch,
    review_pass, pair_session, refactor_pull, test_lab, coffee_compile,
    focus_lock, memory_search, package_drop, incident_response, branch_swing,
    token_rain, prompt_fishing, agent_conductor, build_sleep, victory_dance,
]


def update_manifest(path: Path, metadata: dict[str, tuple[str, str]]) -> None:
    import json
    manifest = json.loads(path.read_text())
    for asset in manifest["assets"]:
        if asset["id"] in metadata:
            asset["title"], asset["description"] = metadata[asset["id"]]
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")


def main() -> None:
    metadata: dict[str, tuple[str, str]] = {}
    for factory in SCENES:
        result = factory()
        stem, title, desc, css, content, *custom = result
        mascot = custom[0] if custom else None
        output = scene_svg(stem, title, desc, css, content, mascot)
        (ROOT / f"svgs/scenes/{stem}.svg").write_text(output)
        metadata[stem] = (title, "Community-created physics-driven scene using the supplied Claude Code mark. " + desc)
        print(f"wrote {stem}.svg")
    update_manifest(ROOT / "claude-code-manifest.json", metadata)
    update_manifest(ROOT / "asset-manifest.json", metadata)
    print(f"generated {len(metadata)} bounded Claude Code scenes")


if __name__ == "__main__":
    main()
