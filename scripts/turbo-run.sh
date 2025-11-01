#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_BASENAME="${TURBO_ENV_BASENAME:-.env.turbo}"
PRIMARY_ENV="${TURBO_ENV_FILE:-$ROOT_DIR/$ENV_BASENAME}"
LOCAL_ENV="$ROOT_DIR/${ENV_BASENAME}.local"

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$file"
    set +a
  fi
}

trim_newlines() {
  printf '%s' "$1" | tr -d '\r\n'
}

# Ensure Turbo can establish TLS in environments without access to the macOS keychain.
ensure_ssl_cert_bundle() {
  if [ -n "${SSL_CERT_FILE:-}" ] || [ -n "${SSL_CERT_DIR:-}" ]; then
    return
  fi

  local candidates=(
    "/etc/ssl/cert.pem"
    "/etc/ssl/certs/ca-certificates.crt"
    "/usr/local/etc/openssl@3/cert.pem"
    "/usr/local/etc/openssl@1.1/cert.pem"
  )

  for candidate in "${candidates[@]}"; do
    if [ -f "$candidate" ]; then
      export SSL_CERT_FILE="$candidate"
      return
    fi
  done
}

load_env_file "$PRIMARY_ENV"
load_env_file "$LOCAL_ENV"

if [ -z "${TURBO_TOKEN:-}" ] && [ -n "${TURBO_TOKEN_FILE:-}" ] && [ -f "$TURBO_TOKEN_FILE" ]; then
  TURBO_TOKEN="$(<"$TURBO_TOKEN_FILE")"
fi

if [ -z "${TURBO_TOKEN:-}" ] && [ -n "${TURBO_TOKEN_COMMAND:-}" ]; then
  TURBO_TOKEN="$(eval "$TURBO_TOKEN_COMMAND")"
fi

if [ -n "${TURBO_TOKEN:-}" ]; then
  TURBO_TOKEN="$(trim_newlines "$TURBO_TOKEN")"
  export TURBO_TOKEN
fi

if [ -n "${TURBO_TEAM:-}" ]; then
  TURBO_TEAM="$(trim_newlines "$TURBO_TEAM")"
  export TURBO_TEAM
fi

ensure_ssl_cert_bundle

if [ -z "${TURBO_TOKEN:-}" ] && [ "${TURBO_ALLOW_MISSING_TOKEN:-0}" != "1" ]; then
  cat <<'EOF' >&2
Error: TURBO_TOKEN is not configured and no macOS keychain is available.

Options:
  1. Copy .env.turbo.example to .env.turbo (or .env.turbo.local) and set TURBO_TOKEN.
  2. Export TURBO_TOKEN in your shell before running this script.
  3. Provide TURBO_TOKEN_COMMAND or TURBO_TOKEN_FILE to fetch the token dynamically.

To bypass this check (and run without remote cache), set TURBO_ALLOW_MISSING_TOKEN=1.
EOF
  exit 1
fi

exec turbo "$@"
