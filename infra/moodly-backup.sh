#!/usr/bin/env bash
#
# Бэкап PostgreSQL на Docker Host (DockHost).
# Запускать по cron от root, например:
#   30 3 * * * /usr/local/bin/moodly-backup.sh >> /var/log/moodly-backup.log 2>&1
#
# Скрипт не оставляет пустых дампов: пишет во временный файл, проверяет
# размер, только потом кладёт на место. Хранит последние $KEEP бэкапов.
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-mood_diary}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/moodly}"
KEEP="${KEEP:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="$BACKUP_DIR/.moodly-$STAMP.tmp"
OUT="$BACKUP_DIR/moodly-$STAMP.sql"

if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" --no-owner > "$TMP" 2>"$TMP.log"; then
  if [ -s "$TMP" ]; then
    mv "$TMP" "$OUT"
    rm -f "$TMP.log"
    echo "OK $(date -Is): $OUT ($(wc -c < "$OUT") bytes)"
  else
    echo "ERROR $(date -Is): empty dump, previous backups kept" >&2
    rm -f "$TMP" "$TMP.log"
    exit 1
  fi
else
  echo "ERROR $(date -Is): pg_dump failed" >&2
  cat "$TMP.log" >&2 || true
  rm -f "$TMP" "$TMP.log"
  exit 1
fi

# Ротация: оставляем только последние $KEEP
ls -1t "$BACKUP_DIR"/moodly-*.sql 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
