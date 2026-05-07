#!/bin/sh
set -e

RESOLVED_PORT="${PORT:-3100}"
CONFIG_DIR="/paperclip/instances/neural-lab"
CONFIG_FILE="$CONFIG_DIR/config.json"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

RAW_PUBLIC_URL="${PAPERCLIP_PUBLIC_URL:-http://localhost:$RESOLVED_PORT}"
case "$RAW_PUBLIC_URL" in
  http://*|https://*) PUBLIC_URL="$RAW_PUBLIC_URL" ;;
  *) PUBLIC_URL="https://$RAW_PUBLIC_URL" ;;
esac

mkdir -p "$CONFIG_DIR/secrets"
mkdir -p "$CONFIG_DIR/data/storage"

if [ ! -f "$CONFIG_DIR/secrets/master.key" ]; then
  head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n' > "$CONFIG_DIR/secrets/master.key"
fi

cat > "$CONFIG_FILE" << EOF
{
  "\$meta": {
    "version": 1,
    "source": "onboard",
    "createdAt": "$NOW",
    "updatedAt": "$NOW"
  },
  "server": {
    "deploymentMode": "authenticated",
    "exposure": "public",
    "bind": "custom",
    "customBindHost": "0.0.0.0",
    "port": $RESOLVED_PORT
  },
  "database": {
    "url": "${DATABASE_URL:-}"
  },
  "auth": {
    "baseUrlMode": "explicit",
    "publicBaseUrl": "$PUBLIC_URL",
    "disableSignUp": false
  },
  "secrets": {
    "provider": "local_encrypted",
    "localEncrypted": {
      "keyFilePath": "$CONFIG_DIR/secrets/master.key"
    }
  },
  "storage": {
    "provider": "local_disk",
    "localDisk": {
      "basePath": "$CONFIG_DIR/data/storage"
    }
  },
  "logging": {
    "level": "info",
    "mode": "file"
  },
  "telemetry": {
    "enabled": false
  }
}
EOF

export PAPERCLIP_PUBLIC_URL="$PUBLIC_URL"
export BETTER_AUTH_URL="$PUBLIC_URL"

echo "==> Config OK. Starting Paperclip on port $RESOLVED_PORT (public URL: $PUBLIC_URL)..."
exec npx paperclipai run
