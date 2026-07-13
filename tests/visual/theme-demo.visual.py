"""Visual regression test for ThemeDemo preview cards on /themes.

Behaviour
- Launches the running dev server (localhost:8080), navigates to /themes.
- For every card with data-testid="theme-demo-card", screenshots the
  element to tests/visual/current/<theme-id>.png.
- Diffs against tests/visual/baselines/<theme-id>.png with PIL.
- If a baseline does not yet exist, the current shot is promoted to
  baseline and the theme is reported as `[new]`.
- Fails (exit 1) if any theme's pixel-diff ratio exceeds THRESHOLD.

Run with `UPDATE_BASELINES=1` to overwrite every baseline on purpose.
"""
import asyncio
import os
from pathlib import Path
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ROOT = Path(__file__).parent
BASELINES = ROOT / "baselines"
CURRENT = ROOT / "current"
DIFFS = ROOT / "diff"
for d in (BASELINES, CURRENT, DIFFS):
    d.mkdir(parents=True, exist_ok=True)

THRESHOLD = 0.01  # 1% of pixels may differ (anti-aliasing wiggle room)
UPDATE = os.environ.get("UPDATE_BASELINES") == "1"


def diff_ratio(a: Path, b: Path) -> tuple[float, Image.Image]:
    ia = Image.open(a).convert("RGB")
    ib = Image.open(b).convert("RGB")
    if ia.size != ib.size:
        # Size drift is itself a regression.
        return 1.0, ib
    d = ImageChops.difference(ia, ib)
    bbox = d.getbbox()
    if not bbox:
        return 0.0, d
    total = ia.size[0] * ia.size[1]
    changed = sum(1 for p in d.getdata() if p != (0, 0, 0))
    return changed / total, d


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        await page.goto("http://localhost:8080/themes", wait_until="networkidle")
        # Wait for at least one card to be rendered.
        await page.wait_for_selector('[data-testid="theme-demo-card"]', timeout=15000)
        cards = await page.query_selector_all('[data-testid="theme-demo-card"]')
        assert cards, "no theme cards rendered on /themes"

        failures: list[str] = []
        news: list[str] = []
        ok: list[str] = []

        for card in cards:
            theme_id = await card.get_attribute("data-theme-id")
            assert theme_id, "card missing data-theme-id"
            await card.scroll_into_view_if_needed()
            # Small settle for lazy fonts / animations.
            await page.wait_for_timeout(200)
            current_path = CURRENT / f"{theme_id}.png"
            baseline_path = BASELINES / f"{theme_id}.png"
            await card.screenshot(path=str(current_path))

            if UPDATE or not baseline_path.exists():
                current_path.replace(baseline_path)
                news.append(theme_id)
                continue

            ratio, diff_img = diff_ratio(baseline_path, current_path)
            if ratio > THRESHOLD:
                diff_img.save(DIFFS / f"{theme_id}.png")
                failures.append(f"{theme_id}: {ratio * 100:.2f}% pixels changed")
            else:
                ok.append(theme_id)

        await browser.close()

        print(f"✓ ok:   {len(ok)}")
        if news:
            print(f"⊕ new baseline: {', '.join(news)}")
        if failures:
            print("✗ regressions:")
            for f in failures:
                print(f"  - {f}")
            print(f"  diffs saved to {DIFFS}")
            return 1
        return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
