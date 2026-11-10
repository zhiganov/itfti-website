"""Round 6: the chosen seal (round 5, 2-refined-take2) with a long route that winds between the letters.
Run with GEMINI_API_KEY set."""
import json, os, base64, urllib.request, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(OUT, "..", "2026-11-10-round-5", "2-refined-take2.jpg")
URL = ("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key="
       + os.environ["GEMINI_API_KEY"])

BASE = (
    "Redraw the maze seal in the reference image with the same look: thick red square frame, red walls on warm "
    "off-white paper, vermilion ink with a slight hand-pressed irregularity at the outer edges, and the large "
    "letters I, t, F, t, I (capital I, lowercase t, capital F, lowercase t, capital I) as the main maze walls. "
    "Change the maze itself: the two capital I's now touch the left and right sides of the frame along their whole "
    "height, so there is NO corridor running up the left or right edge. The entrance is a gap in the middle of the "
    "bottom of the frame and the exit is a gap in the middle of the top of the frame. "
)

SAFE = (
    " Exactly one continuous white corridor connects the entrance to the exit; every other corridor ends in a dead "
    "end. All corridors have the same width. Symmetric only as a mirror image, never by rotation. NO hooked crosses, "
    "NO swastika-like shapes, NO pinwheel arrangements. NO hands, NO coins, NO Chinese or Japanese characters, "
    "NO other letters, NO signature, NO date."
)

PROMPTS = {
    "1-serpentine": (
        "The route winds like a snake: from the entrance it goes up between the first I and the first t, crosses "
        "over the top of the t, comes down between the t and the F, passes under the F, goes up between the F and "
        "the second t, and finally climbs between the second t and the last I to reach the exit."
    ),
    "2-serpentine-take2": (
        "The route winds like a snake: from the entrance it goes up between the first I and the first t, crosses "
        "over the top of the t, comes down between the t and the F, passes under the F, goes up between the F and "
        "the second t, and finally climbs between the second t and the last I to reach the exit."
    ),
    "3-through-every-gap": (
        "The route is long and visits every gap between neighbouring letters at least once, going up and down "
        "several times before it reaches the exit. Short walls branching off the letters block the obvious "
        "straight paths and create dead ends."
    ),
    "4-loop-around-F": (
        "The route makes a long detour: from the entrance it goes left under the first t, up between the first I "
        "and the first t, across the top of the whole seal to the right, down between the second t and the last I, "
        "back left under the second t and the F, and finally up between the F and a t to the exit."
    ),
}


def call(prompt):
    with open(REF, "rb") as f:
        ref = base64.b64encode(f.read()).decode()
    body = json.dumps({
        "contents": [{"parts": [{"inline_data": {"mime_type": "image/jpeg", "data": ref}}, {"text": prompt}]}],
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
    return None, ",".join(c.get("finishReason", "?") for c in j.get("candidates", [])) or json.dumps(j)[:200]


def gen(name, route):
    full = BASE + route + SAFE
    with open(os.path.join(OUT, f"{name}.prompt.txt"), "w", encoding="utf-8") as f:
        f.write("[reference: round-5/2-refined-take2.jpg]\n" + full)
    data, reason = call(full)
    if data is None:
        return f"{name}: NO IMAGE ({reason})"
    with open(os.path.join(OUT, name + ".jpg"), "wb") as f:
        f.write(data)
    return f"{name}: ok"


if __name__ == "__main__":
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        for res in ex.map(lambda kv: gen(*kv), PROMPTS.items()):
            print(res)
