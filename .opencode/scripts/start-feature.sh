#!/usr/bin/env bash
set -euo pipefail

NAME="${1:-feat/$(date +%Y%m%d-%H%M%S)}"
BASE="${2:-main}"

echo "=== Starting feature: $NAME ==="

git checkout "$BASE"
git pull origin "$BASE"
git checkout -b "$NAME"
git push -u origin "$NAME"

git commit --allow-empty -m "feat: start $NAME"
git push

gh pr create --draft --base "$BASE" --title "$NAME" --body "Automated draft PR for \`$NAME\`."

echo ""
echo "✅ Branch:  $NAME"
echo "📎 PR:      $(gh pr view --json url --jq .url 2>/dev/null || echo 'see above')"
echo ""
echo "Next: work on the branch, commit & push freely."
echo "When ready: gh pr ready && merge on GitHub"
