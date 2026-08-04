# SSL-сертификат mymoodly.ru

Положите в эту папку два файла (PEM) с именами:

- `mymoodly.ru.crt` — сертификат (можно fullchain: сертификат + промежуточные)
- `mymoodly.ru.key` — приватный ключ

Caddyfile уже ссылается на них: `tls /etc/caddy/certs/mymoodly.ru.crt /etc/caddy/certs/mymoodly.ru.key`.

Приватный ключ в `.gitignore`, в git он не попадёт.
