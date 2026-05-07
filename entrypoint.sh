#!/bin/sh
set -e

# Resolve port — Railway injects $PORT dynamically
RESOLVED_PORT="${PORT:-3100}"

# Config paths
CONFIG_DIR="/paperclip/instances/neural-lab"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "==> Neural Lab OS starting..."
echo "    Port: $RESOLVED_PORT"
echo "    Public URL: ${PAPERCLIP_PUBLIC_URL:-not set}"
echo "    Database: ${DATABASE_URL:+configured}${DATABASE_URL:-embedded (PGLite)}"

# Create required directories
mkdir -p "$CONFIG_DIR/secrets"
mkdir -p "$CONFIG_DIR/data/storage"

# Generate config.json if it doesn't exist
# (on Railway with a volume, it persists; otherwise regenerates every start)
cat > "$CONFIG_FILE" << EOF
{
  "server": {
    "bind": "lan",
    "port": $RESOLVED_PORT,
    "publicUrl": "${PAPERCLIP_PUBLIC_URL:-http://localhost:$RESOLVED_PORT}"
  },
  "telemetry": {
    "enabled": false
  }
}
EOF

echo "==> Config written to $CONFIG_FILE"

# Start Paperclip
exec npx paperclipai run
