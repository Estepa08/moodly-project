#!/usr/bin/env bash
# Проверяет, что фронтенд-сборка (frontend/dist) реально готова к индексации:
# каждый URL из sitemap.xml пререндерен и содержит title/description/canonical,
# а robots.txt и sitemap.xml попали в сборку. Запускать после `make build-frontend`.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT_DIR/frontend/dist"
SITEMAP="$DIST/sitemap.xml"

if [ ! -f "$SITEMAP" ]; then
  echo "check-seo: $SITEMAP не найден — сначала выполните 'make build-frontend'" >&2
  exit 1
fi

fail=0

check_route() {
  local route="$1"
  local file="$DIST${route}/index.html"
  if [ "$route" = "" ]; then
    file="$DIST/index.html"
  fi

  if [ ! -f "$file" ]; then
    echo "FAIL  $route — не пререндерен ($file отсутствует)"
    fail=1
    return
  fi

  local missing=""
  grep -q "<title>[^<]\+</title>" "$file" || missing="$missing title"
  grep -q 'meta[^>]*name="description"[^>]*content="[^"]\+"' "$file" || missing="$missing description"
  grep -q 'link[^>]*rel="canonical"' "$file" || missing="$missing canonical"

  if [ -n "$missing" ]; then
    echo "FAIL  $route — отсутствует:$missing"
    fail=1
  else
    echo "OK    $route"
  fi
}

while IFS= read -r loc; do
  route="${loc#https://mymoodly.ru}"
  check_route "$route"
done < <(grep -o '<loc>[^<]*</loc>' "$SITEMAP" | sed -e 's#<loc>##' -e 's#</loc>##')

if [ ! -f "$DIST/robots.txt" ]; then
  echo "FAIL  /robots.txt отсутствует в dist"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "check-seo: все проверки пройдены"
else
  echo "check-seo: есть проблемы, см. FAIL выше" >&2
fi

exit "$fail"
