# Visual regression: ThemeDemo cards on /themes

Run against the running dev server (localhost:8080):

```bash
python3 tests/visual/theme-demo.visual.py
```

- Screenshots each `[data-testid="theme-demo-card"]` on `/themes`.
- Compares against `baselines/<theme-id>.png` (versioned).
- Fails if any theme's pixel-diff ratio > 1%.
- Diffs land in `diff/`, current shots in `current/` (both git-ignored).
- Missing baseline is auto-promoted from the current shot.
- Set `UPDATE_BASELINES=1` to re-baseline every theme intentionally.
