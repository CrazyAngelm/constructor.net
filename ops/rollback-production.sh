#!/bin/bash
set -euo pipefail
# Restore only routing/application. Never replace the shared database with an old dump.
config=/etc/nginx/conf.d/labstudio-ssl.conf
backup=/srv/labstudio-preview/backups/production-20261001
test -f "$backup/original.sql"
test -f /var/www/constructor.net/frontend/.next/BUILD_ID
test "$(cat /var/www/constructor.net/frontend/.next/BUILD_ID)" = "$(cat "$backup/original-app/frontend/.next/BUILD_ID")"
cp -p "$config" "$backup/nginx-before-rollback-$(date -u +%Y%m%dT%H%M%SZ).conf"
/usr/local/bin/pm2 start labstudio-frontend
python3 <<'PY'
import json,subprocess,urllib.error,urllib.request
while True:
    try:
        with urllib.request.urlopen('http://127.0.0.1:3000/') as response:
            if response.status!=200: raise RuntimeError('Old site not ready')
        break
    except urllib.error.HTTPError:
        raise
    except urllib.error.URLError:
        processes=json.loads(subprocess.check_output(['/usr/local/bin/pm2','jlist']))
        if not any(p['name']=='labstudio-frontend' and p['pm2_env']['status']=='online' for p in processes):
            raise RuntimeError('Old site process failed; routing has not been changed')
PY
python3 - "$config" <<'PY'
import pathlib,sys
path=pathlib.Path(sys.argv[1]); text=path.read_text()
new='proxy_pass http://127.0.0.1:18082;'; old='proxy_pass http://127.0.0.1:3000;'
if text.count(new)!=1: raise RuntimeError('Unexpected nginx upstream; inspect before rollback')
path.write_text(text.replace(new,old))
PY
nginx -t
systemctl reload nginx
/usr/local/bin/pm2 save
echo 'Old website restored. Shared database, new accounts, payments and web lesson copies retained.'
