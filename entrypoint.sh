#!/bin/sh
set -e

RESOLVED_PORT="${PORT:-3100}"
CONFIG_DIR="/paperclip/instances/neural-lab"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "==> Neural Lab OS starting..."
echo "    Port: $RESOLVED_PORT"
echo "    Public URL: ${PAPERCLIP_PUBLIC_URL:-not set}"
echo "    Database: ${DATABASE_URL:+configured}${DATABASE_URL:-embedded}"

mkdir -p "$CONFIG_DIR/secrets"
mkdir -p "$CONFIG_DIR/data/storage"

# Generate master key if missing
if [ ! -f "$CONFIG_DIR/secrets/master.key" ]; then
  head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n' > "$CONFIG_DIR/secrets/master.key"
  echo "==> Master key generated"
fi

cat > "$CONFIG_FILE" << EOF
{
  "\$meta": {
    "version": 1,
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
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
    "level": "info"
  },
  "telemetry": {
    "enabled": false
  }
}
EOF

echo "==> Config written to $CONFIG_FILE"
cat "$CONFIG_FILE"

echo "==> Running paperclipai doctor..."
npx paperclipai doctor || echo "==> Doctor reported issues (non-fatal, continuing)"

echo "==> Starting Paperclip server..."
exec npx paperclipai run
