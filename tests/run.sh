#!/usr/bin/env bash
# Serve the app, run every test, stop the server. Exit non-zero if any fail.
#   tests/run.sh              all of them
#   tests/run.sh nav joke     just those
set -u
cd "$(dirname "$0")/.."
PORT="${PORT:-8885}"; export PORT

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for i in $(seq 1 50); do
  curl -fs -o /dev/null "http://127.0.0.1:$PORT/index.html" && break; sleep 0.1
done

if [ $# -gt 0 ]; then files=(); for n in "$@"; do files+=("tests/$n.test.mjs"); done
else files=(tests/*.test.mjs); fi

failed=0
for f in "${files[@]}"; do
  name=$(basename "$f" .test.mjs)
  if out=$(node "$f" 2>&1); then
    printf '  PASS  %s  (%s checks)\n' "$name" "$(grep -c '^  ok  ' <<<"$out")"
  else
    printf '  FAIL  %s\n' "$name"; grep -E '^FAIL|Error' <<<"$out" | sed 's/^/        /' | head -20
    failed=1
  fi
done
exit $failed
