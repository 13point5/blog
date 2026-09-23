#!/bin/sh
# Rebuilds the full-quality masters from their parts (a byte-for-byte join, no re-encoding) and checks them.
cd "$(dirname "$0")"
for v in opus-5.5-clay-master.mp4 opus-5.5-stop-motion-master.mp4; do
  cat "$v".part* > "$v" && echo "rebuilt $v"
done
if command -v sha256sum >/dev/null; then sha256sum -c SHA256SUMS; else shasum -a 256 -c SHA256SUMS; fi
