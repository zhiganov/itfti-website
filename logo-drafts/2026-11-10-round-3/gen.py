"""Round 3: refine round 2's 02 (horizon line) and 06 (relief mirror). Run with GEMINI_API_KEY set."""
import json, os, base64, urllib.request, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
R2 = os.path.join(OUT, "..", "2026-11-10-round-2")
URL = ("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key="
       + os.environ["GEMINI_API_KEY"])

LETTERS = ("exactly five Latin letters, in this order from left to right: capital I, lowercase t, capital F, "
           "lowercase t, capital I. Exactly one F. No other letters.")

COMMON = (
    " Style: a square seal stamp impression in flat vermilion red ink on warm off-white paper, like a carved stone "
    "seal pressed once by hand. Even, solid ink with only a slight hand-pressed irregularity at the outer edges. "
    "Centred with generous empty paper around it. Geometric, blocky strokes of equal weight with square ends, "
    "meeting at right angles. It is a logo and must stay legible at 32 pixels. "
    "NO hands, NO coins, NO Chinese or Japanese characters, NO decorative border pattern, NO signature, NO date."
)

NO_HOOKS = (
    " IMPORTANT: the design is symmetric ONLY as a mirror image across the vertical centre line. It has NO rotational "
    "symmetry. NO hooked crosses, NO swastika-like shapes, NO pinwheel or spiral arrangements, NO arms bent at right "
    "angles around a centre point."
)

PROMPTS = {
    # Horizon line
    "01-horizon-fixed": ("ref:02-horizon-line.jpg",
        "Redraw the seal in the reference image, keeping its double square frame, its proportions and its carved white "
        "letters, but fix the lettering: it must be " + LETTERS + " The crossbar of the first t, the top arm of the F "
        "and the crossbar of the second t form ONE unbroken white horizontal line at the same height, running from the "
        "first I to the last I and touching both."),
    "02-horizon-to-frame": ("",
        "A square red seal with a thin white inner frame line. Inside, carved in white, " + LETTERS + " The letters are "
        "tall and narrow and evenly spaced. One continuous white horizontal line crosses the whole seal at about one "
        "third from the top: it is the crossbar of both t's and the top arm of the F, and it extends past the two I's "
        "to join the inner frame on the left and the right, like a horizon dividing the seal into sky and ground."),
    "03-horizon-low": ("",
        "A square red seal. Inside, carved in white, " + LETTERS + " The letters stand on a shared white baseline that "
        "runs the full width, and a second continuous white line crosses all five letters at mid-height, made from the "
        "two t crossbars and the F's middle arm. The two lines read as a horizon and the ground, with the letters as "
        "upright posts between them."),
    # Relief mirror
    "04-relief-fixed": ("ref:06-relief-mirror.jpg",
        "Redraw the seal in the reference image, keeping its relief style (red letters on white inside a thick red "
        "frame), the two capital I's merged into the left and right sides of the frame, and the overall maze-like "
        "density. Replace the centre completely: the two lowercase t's are identical upright crosses, and the F in the "
        "middle gets a mirrored second set of arms pointing left, so the centre is a symmetric shape like a candelabra "
        "or a tree with branches on both sides." + NO_HOOKS),
    "05-relief-tree": ("",
        "A square seal in relief style: red letters on the white paper, inside a thick red square frame. The letters "
        "are I, t, F, t, I. The two capital I's stand flush against the left and right sides of the frame and merge "
        "with it. The two lowercase t's are identical upright crosses just inside them. In the centre, the F and its "
        "mirror image share one vertical stem, so the centre is a symmetric double-armed shape like a candelabra. All "
        "five shapes join the frame at top and bottom, making a dense, balanced, architectural grid." + NO_HOOKS),
    "06-relief-horizon": ("",
        "A square seal in relief style: red letters on the white paper, inside a thick red square frame. " + LETTERS +
        " The two I's merge with the left and right sides of the frame. The crossbars of both t's and the top arm of "
        "the F join into one continuous red horizontal line from frame side to frame side, so the seal combines a "
        "horizon line with the letters. The F's arm also extends to the left as a mirrored arm, keeping the seal "
        "mirror-symmetric." + NO_HOOKS),
}


def gen(name, spec):
    ref, prompt = spec
    full = prompt + COMMON
    with open(os.path.join(OUT, f"{name}.prompt.txt"), "w", encoding="utf-8") as f:
        f.write((f"[reference: round-2/{ref[4:]}]\n" if ref else "") + full)
    parts = []
    if ref:
        with open(os.path.join(R2, ref[4:]), "rb") as f:
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(f.read()).decode()}})
    parts.append({"text": full})
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
                ext = ".png" if "png" in d.get("mimeType", "") else ".jpg"
                with open(os.path.join(OUT, name + ext), "wb") as f:
                    f.write(base64.b64decode(d["data"]))
                return f"{name}: ok"
    return f"{name}: NO IMAGE {json.dumps(j)[:300]}"


if __name__ == "__main__":
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        for res in ex.map(lambda kv: gen(*kv), PROMPTS.items()):
            print(res)
