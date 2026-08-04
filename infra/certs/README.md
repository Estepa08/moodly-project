# SSL-сертификат mymoodly.ru (НЕ ИСПОЛЬЗУЕТСЯ)

> Папка оставлена как заглушка. Ручной сертификат GlobalSign больше не используется:
> TLS на DockHost закрывает внешний reverse proxy панели (Traefik), а Caddy внутри
> контейнера слушает HTTP на `:80` (`auto_https off`). Caddyfile на серт не ссылается.

Для справки (если вернётесь к ручному TLS), нужны два PEM-файла:

- `mymoodly.ru.crt` — сертификат (можно fullchain: сертификат + промежуточные)
- `mymoodly.ru.key` — приватный ключ

и директива в Caddyfile: `tls /etc/caddy/certs/mymoodly.ru.crt /etc/caddy/certs/mymoodly.ru.key`.

Приватный ключ в `.gitignore`, в git он не попадёт.
