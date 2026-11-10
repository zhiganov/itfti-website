"""Round 2: seal stamps built from the letters I-t-F-t-I. Run with GEMINI_API_KEY set."""
import json, os, base64, urllib.request, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
URL = ("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key="
       + os.environ["GEMINI_API_KEY"])

COMMON = (
    " Style: a square seal stamp impression in flat vermilion red ink on warm off-white paper, like a carved stone seal "
    "pressed once by hand. Even, solid ink with only a slight hand-pressed irregularity at the outer edges. "
    "The seal is centred with generous empty paper around it. Letterforms are geometric and blocky, built from thick "
    "straight strokes with square ends, as if cut with a knife into stone; strokes have equal weight. "
    "It is a logo, so it must stay legible at 32 pixels. "
    "NO hands, NO coins, NO Chinese or Japanese characters, NO dragons, NO decorative border pattern, NO signature, "
    "NO date, NO other letters or words besides the ones described."
)

PROMPTS = {
    "01-word-band": (
        "Inside the red square seal, the five Latin letters I, t, F, t, I in that exact order from left to right, "
        "capital I, lowercase t, capital F, lowercase t, capital I, carved out as white negative space. "
        "The letters are tall and narrow and fill the seal from top edge to bottom edge, so the word reads as a rhythm "
        "of vertical bars crossed by short horizontal bars. The crossbars of both t's and the top arm of the F sit at "
        "exactly the same height."
    ),
    "02-horizon-line": (
        "Inside the red square seal, the letters I t F t I (capital I, lowercase t, capital F, lowercase t, capital I) "
        "carved in white. The crossbar of the first t, the top arm of the F and the crossbar of the second t are joined "
        "into ONE continuous horizontal white line that runs across the whole word from the first I to the last I, "
        "like a horizon that ties all five letters together. Everything else about the letters stays simple and upright."
    ),
    "03-shared-stem-tree": (
        "Inside the red square seal, a single white vertical stem rises up the centre. The letters I, t, F, t, I are "
        "fused onto that one stem as a ligature, stacked from bottom to top: a capital I gives the stem its flat foot "
        "at the bottom, the first lowercase t adds a short crossbar, the capital F adds two arms that reach to the right, "
        "the second lowercase t adds another short crossbar higher up, and a capital I gives the flat cap at the top. "
        "The whole mark reads as a stylised young tree or ladder growing upward, and on a second look as the letters."
    ),
    "04-cross-arrangement": (
        "Inside the red square seal, five white letters arranged in a plus-sign formation: a capital F in the exact "
        "centre, a lowercase t directly above it and another lowercase t directly below it, a capital I to its left and "
        "another capital I to its right. The letters are close enough that their strokes almost touch, so together they "
        "form one compact symmetric cross-shaped emblem, like a compass rose made of letters."
    ),
    "05-tall-column": (
        "A tall vertical rectangular red seal, about twice as tall as it is wide, like a traditional name seal. Inside "
        "it, the letters stacked in one column from top to bottom: capital I, lowercase t, capital F, lowercase t, "
        "capital I, each letter as wide as the column, carved in white, with very little space between them so they "
        "lock together into a single totem-like pillar."
    ),
    "06-relief-mirror": (
        "A square seal in relief style: red letters on the white paper inside a thick red square frame. The letters "
        "I t F t I (capital I, lowercase t, capital F, lowercase t, capital I) are arranged symmetrically: the two "
        "capital I's stand against the left and right sides of the frame and merge with it, the two lowercase t's are "
        "identical crosses just inside them, and the F in the centre has a second, mirrored set of arms pointing left, "
        "so the centre becomes a symmetric double-armed shape and the whole seal is mirror-symmetric."
    ),
}


def gen(name, prompt):
    full = prompt + COMMON
    with open(os.path.join(OUT, f"{name}.prompt.txt"), "w", encoding="utf-8") as f:
        f.write(full)
    body = json.dumps({
        "contents": [{"parts": [{"text": full}]}],
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
