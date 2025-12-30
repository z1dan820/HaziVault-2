#!/bin/bash
set -e

echo "🔥 Installing HaziVault"

mkdir -p storage/users storage/temp logs

if [ ! -f .env ]; then
  echo "JWT_SECRET=$(node generate-secret.js)" > .env
  echo "PORT=3000" >> .env
fi

if [ ! -f db/users.json ]; then
  echo "[]" > db/users.json
fi

if [ ! -f db/shares.json ]; then
  echo "[]" > db/shares.json
fi

echo "✅ Install complete"
