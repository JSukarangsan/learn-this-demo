#!/usr/bin/env bash
# Run after you have the webhook URL. Sets the repo secret and posts a test message.
#   ./.github/setup-slack.sh 'https://hooks.slack.com/services/T.../B.../xxxx'
set -euo pipefail
URL="${1:?paste the webhook URL as the first argument}"
printf '%s' "$URL" | gh secret set SLACK_WEBHOOK_URL --repo JSukarangsan/learn-this-demo
echo "Secret set."
SLACK_WEBHOOK_URL="$URL" node "$(dirname "$0")/scripts/smoke.mjs"
