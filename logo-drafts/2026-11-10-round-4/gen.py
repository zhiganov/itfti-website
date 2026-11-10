"""Round 4: the round-2 relief mirror (06) as a maze, with the hooked centre straightened.
Run with GEMINI_API_KEY set. If the reference image trips the safety filter, the take is retried without it."""
import json, os, base64, urllib.request, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(OUT, "..", "2026-11-10-round-2", "06-relief-mirror.jpg")
URL = ("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key="
       + os.environ["GEMINI_API_KEY"])

BASE = (
    "A square seal stamp in relief style: red lines on warm off-white paper inside a thick red square frame, "
    "pressed by hand in flat vermilion ink with a slight irregularity only at the outer edges. It is built from the "
    "letters I, t, F, t, I drawn as the walls of a maze. The two capital I's stand against the left and right sides "
    "of the frame and merge with it. The lowercase t's and the F become interior maze walls. The walls are thick "
    "straight strokes of equal weight meeting at right angles, with narrow white corridors between them, dense like "
    "the reference."
)

SAFE = (
    " The design is symmetric only as a mirror image across the vertical centre line, never by rotation. "
    "Wall corners turn toward the frame, never around the centre point. NO hooked crosses, NO swastika-like shapes, "
    "NO pinwheel or spiral arrangements, NO four arms bent around a centre. "
    "Logo, legible at 32 pixels. NO hands, NO coins, NO Chinese or Japanese characters, NO other letters, "
    "NO signature, NO date."
)

PROMPTS = {
    "a-closest": (
        "Redraw the seal in the reference image as closely as possible: same frame, same letters, same density and "
        "proportions. Change only the centre: where the reference has arms bent around the middle, straighten them "
        "into plain vertical and horizontal walls, so the centre is mirror-symmetric and nothing turns around it."
    ),
    "b-entrance-exit": (
        "Keep the look of the reference, but make it a maze with one entrance and one exit: a clear gap in the "
        "bottom of the frame where you enter, and a clear gap in the top of the frame where you leave. Between them "
        "the corridors wind around the letter walls."
    ),
    "c-solvable-path": (
        "Keep the look of the reference, but make it a real, solvable maze: a gap in the bottom of the frame is the "
        "entrance, a gap in the top of the frame is the exit, and exactly one continuous white corridor connects "
        "them, winding left and right around the letter walls. Other corridors end in dead ends."
    ),
    "d-dense-dead-ends": (
        "Keep the look of the reference, but make the maze denser: more short interior walls branching off the "
        "letters, many dead-end corridors, and one gap in the bottom of the frame as the only entrance. The letters "
        "stay visible as the main walls."
    ),
}


def call(prompt, with_ref):
    parts = []
    if with_ref:
        with open(REF, "rb") as f:
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(f.read()).decode()}})
    parts.append({"text": prompt})
    body = json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1"}},
    }).encode()
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json", "User-Agent": "img-gen/1.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        j = json.load(r)
    for c in j.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            d = p.get("inlineData") or p.get("inline_data")
            if d and d.get("data"):
                return base64.b64decode(d["data"]), None
    reason = ",".join(c.get("finishReason", "?") for c in j.get("candidates", [])) or json.dumps(j)[:200]
    return None, reason


def gen(name, specific):
    full = BASE + " " + specific + SAFE
    data, reason = call(full, True)
    used_ref = True
    if data is None:
        fresh = full.replace("like the reference", "").replace("the reference image", "a dense square maze seal")
        fresh = fresh.replace("the reference", "a dense square maze seal")
        data, reason2 = call(fresh, False)
        used_ref, full = False, fresh
        reason = f"{reason}; retry without reference: {reason2 or 'ok'}"
    with open(os.path.join(OUT, f"{name}.prompt.txt"), "w", encoding="utf-8") as f:
        f.write(("[reference: round-2/06-relief-mirror.jpg]\n" if used_ref else "[no reference]\n") + full)
    if data is None:
        return f"{name}: NO IMAGE ({reason})"
    with open(os.path.join(OUT, name + ".jpg"), "wb") as f:
        f.write(data)
    return f"{name}: ok ({'with reference' if used_ref else reason})"


if __name__ == "__main__":
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        for res in ex.map(lambda kv: gen(*kv), PROMPTS.items()):
            print(res)
