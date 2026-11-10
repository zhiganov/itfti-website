"""Round 5: refine round 4's c-solvable-path. Run with GEMINI_API_KEY set."""
import json, os, base64, urllib.request, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(OUT, "..", "2026-11-10-round-4", "c-solvable-path.jpg")
URL = ("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key="
       + os.environ["GEMINI_API_KEY"])

BASE = (
    "Redraw the maze seal in the reference image. Keep its composition: the thick red square frame, the large "
    "letters I, t, F, t, I (capital I, lowercase t, capital F, lowercase t, capital I) as the main maze walls, the "
    "two capital I's merged into the left and right sides of the frame, the entrance gap at the bottom of the frame "
    "and the exit gap at the top. Clean up the letterforms: both capital I's have the same flat top and bottom "
    "bars, the two lowercase t's are identical, and the F is clearly a Latin capital F. The white corridors all have "
    "the same width. Exactly ONE continuous white corridor connects the bottom entrance to the top exit; every "
    "other corridor ends in a dead end."
)

SAFE = (
    " Symmetric only as a mirror image, never by rotation. NO hooked crosses, NO swastika-like shapes, NO pinwheel "
    "arrangements. NO hands, NO coins, NO Chinese or Japanese characters, NO other letters, NO signature, NO date."
)

PROMPTS = {
    "1-refined": (" Walls a little thicker than the reference so it reads at 32 pixels. Vermilion ink on warm "
                  "off-white paper with a slight hand-pressed irregularity at the outer edges only."),
    "2-refined-take2": (" Walls a little thicker than the reference so it reads at 32 pixels. Vermilion ink on warm "
                        "off-white paper with a slight hand-pressed irregularity at the outer edges only."),
    "3-simplified": (" Simplify: fewer and thicker interior walls, wider corridors, so the mark stays clear as a "
                     "small icon, while the letters and the single route through stay readable. Vermilion ink on "
                     "warm off-white paper, slight hand-pressed edge only."),
    "4-crisp-digital": (" Walls a little thicker than the reference. Render it as a crisp flat digital logo: solid "
                        "vermilion on pure white, perfectly straight edges, no ink texture, no paper texture."),
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


def gen(name, extra):
    full = BASE + extra + SAFE
    with open(os.path.join(OUT, f"{name}.prompt.txt"), "w", encoding="utf-8") as f:
        f.write("[reference: round-4/c-solvable-path.jpg]\n" + full)
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
