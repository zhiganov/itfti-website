import json, os, sys, base64, urllib.request, concurrent.futures as cf

OUT = os.path.dirname(os.path.abspath(__file__))
KEY = os.environ["GEMINI_API_KEY"]
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key={KEY}"

COMMON = (
    " It is a logo mark for ItFtI, a small open project that helps people turn their work into real-world impact "
    "and helps support flow back to people doing that work: impact leads to funding, funding leads to impact. "
    "Centered on a plain flat background, generous empty space around the mark, full-bleed, no frame, no border, no margin lines. "
    "Flat vector-like logo, crisp edges, no gradients, no shadows, no 3D, no photo, no mockup. "
    "It must read clearly at 32 pixels. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS anywhere."
)

PROMPTS = {
    "01-glyph-seed-hand": (
        "A single pictographic sign, as if it were one character from an ancient carved writing system, but invented and original. "
        "It combines an open cupped hand underneath and a small sprouting seed above it, joined by one curved line that returns from the sprout back down to the hand, forming a loop. "
        "Drawn with even, monoline strokes like a carved stone sign. Warm black on a cream background. "
        "NO Egyptian cartouche, NO Eye of Horus, NO ankh, NO pyramids, NO papyrus, NO hieroglyph rows: one sign only."
    ),
    "02-mirror-glyph": (
        "A single symmetrical glyph, mirrored exactly around a vertical axis, like one sign from an invented ancient script. "
        "The left half is a stroke rising upward and the right half the same stroke descending, the two meeting at the top and bottom so the sign reads the same from both sides, "
        "suggesting an exchange that flows both ways. Built from three to five bold strokes only. Deep indigo on an off-white background. "
        "NO Egyptian imagery, NO cartouche, NO Chinese or Japanese characters, NO runes copied from a real alphabet."
    ),
    "03-petroglyph-guild": (
        "A rock-art style pictogram, like a petroglyph pecked into stone: three simple stick figures standing in a ring, holding hands, "
        "and together holding up a small circle (a shared seed or sun) in the middle. Each figure is slightly different in posture. "
        "Rust red mark on a pale sandstone-coloured flat background, the mark itself flat and solid. "
        "NO cave texture photo, NO animals, NO hunting scene, NO handprints, NO spirals beyond the one circle."
    ),
    "04-continuous-loop": (
        "A modern geometric mark drawn as ONE continuous line with no start and no end: two linked loops of different size that pass through each other, "
        "like a figure eight that has been turned into two interlocking rings, one small and one large, so energy visibly travels from one into the other and back. "
        "Uniform stroke weight, rounded ends hidden because the line is closed. Dark green on white. "
        "NO infinity symbol in its plain textbook form, NO Olympic rings, NO chain links, NO arrows."
    ),
    "05-irrigation-glyph": (
        "A pictographic sign showing a channel of water running from a small source down into a square field divided into four plots, "
        "with one plot showing a sprout, and a short line rising from the sprout back toward the source like returning rain. "
        "Drawn as an ancient-looking but original sign with flat bold strokes, like a stamp or seal impression. "
        "Ochre and dark brown on cream. NO rice-field landscape, NO Chinese character for field, NO map, NO tree."
    ),
    "06-seal-stamp": (
        "A square seal stamp impression, like an ink seal pressed onto paper: a red square with rounded corners, and inside it, cut out in negative space, "
        "a simple invented sign of two hands, one above and one below, each passing a small circle to the other. "
        "The red ink is flat and even, with only a very slight hand-pressed irregularity at the edges. Vermilion on white. "
        "NO Chinese or Japanese characters, NO calligraphy, NO kanji, NO dragon, NO border pattern."
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
                path = os.path.join(OUT, name + ext)
                open(path, "wb").write(base64.b64decode(d["data"]))
                return f"{name}: {path}"
    return f"{name}: NO IMAGE {json.dumps(j)[:300]}"

with cf.ThreadPoolExecutor(max_workers=6) as ex:
    for res in ex.map(lambda kv: gen(*kv), PROMPTS.items()):
        print(res)
