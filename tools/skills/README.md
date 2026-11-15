# Claude Code skills for this project

Backup copies. The live copy of each skill is in `~/.claude/skills/<name>/` (personal skills), so it can
be used from any Claude Code session. To restore one on a new machine:

```bash
cp -R tools/skills/cellar-clean-photos ~/.claude/skills/
```

- **cellar-clean-photos**: gives every bottle a clean product photo as its first photo, in the standard
  1080x1080 white-square format. Searches with Claude Code's own agents (never the app's API key) and
  writes through the Firebase CLI login. See its `SKILL.md`.
