#!/bin/bash
# Apply Electro Store branding to the Medusa admin dashboard.
# Run this after `medusa develop` or `medusa build` regenerates .medusa/client/.
#
# Usage: bash src/admin/branding/apply.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

mkdir -p "$ROOT_DIR/static"
cp "$SCRIPT_DIR/index.html" "$ROOT_DIR/.medusa/client/index.html"
cp "$SCRIPT_DIR/logo.svg" "$ROOT_DIR/static/logo.svg"

echo "Branding applied: index.html → .medusa/client/, logo.svg → static/"
