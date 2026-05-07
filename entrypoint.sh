#!/bin/sh
set -e

RESOLVED_PORT="${PORT:-3100}"
CONFIG_DIR="/paperclip/instances/neural-lab"
CONFIG_FILE="$CONFIG_DIR/config.json"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

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
    "bind": "lan",
    "port": $RESOLVED_PORT,
    "publicUrl": "${PAPERCLIP_PUBLIC_URL:-http://localhost:$RESOLVED_PORT}"
  },
  "database": {
    "url": "${DATABASE_URL:-}"
  },
  "auth": {
    "secret": "${BETTER_AUTH_SECRET:-neural-lab-default-secret}"
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

echo "==> Config OK. Starting Paperclip on port $RESOLVED_PORT..."
exec npx paperclipai run
