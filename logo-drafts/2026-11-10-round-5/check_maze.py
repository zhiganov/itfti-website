"""Check whether a maze seal image has a white corridor from a gap in the bottom of the frame
to a gap in the top. Usage: python check_maze.py IMAGE [IMAGE ...]
Writes <image>-path.png beside each image, with the found route drawn in blue."""
import sys
from collections import deque
from PIL import Image

N = 360  # working resolution


def check(path):
    im = Image.open(path).convert("RGB")
    g = im.getchannel("G")
    # Red ink has a low green channel; paper is high.
    ink = g.point(lambda v: 255 if v < 140 else 0)
    box = ink.getbbox()
    crop = im.crop(box).resize((N, N), Image.LANCZOS)
    G = crop.getchannel("G").load()
    side = 8  # columns at the left and right edges count as wall, so a route cannot run
    # down the strip of paper a slightly tilted frame leaves inside the crop
    white = [[G[x, y] > 165 and side <= x < N - side for x in range(N)] for y in range(N)]

    edge = 4  # rows treated as the frame's outer edge
    starts = [(x, y) for y in range(N - edge, N) for x in range(N) if white[y][x]]
    goal_rows = set(range(edge))
    prev = {s: None for s in starts}
    q = deque(starts)
    end = None
    while q:
        x, y = q.popleft()
        if y in goal_rows:
            end = (x, y)
            break
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < N and 0 <= ny < N and white[ny][nx] and (nx, ny) not in prev:
                prev[(nx, ny)] = (x, y)
                q.append((nx, ny))

    gaps_bottom = sum(1 for x in range(1, N) if white[N - 1][x] and not white[N - 1][x - 1])
    gaps_top = sum(1 for x in range(1, N) if white[0][x] and not white[0][x - 1])
    out = crop.copy()
    px = out.load()
    if end:
        p = end
        while p:
            x, y = p
            for ox in (-1, 0, 1):
                for oy in (-1, 0, 1):
                    if 0 <= x + ox < N and 0 <= y + oy < N:
                        px[x + ox, y + oy] = (30, 80, 220)
            p = prev[p]
    out.save(path.rsplit(".", 1)[0] + "-path.png")
    verdict = "SOLVABLE" if end else "NO ROUTE"
    print(f"{path}: {verdict} (openings: bottom {gaps_bottom}, top {gaps_top})")


for p in sys.argv[1:]:
    check(p)
