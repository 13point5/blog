# usage: qa.sh "<comma times>"  -> renders stills with 4 workers, builds labelled contact sheets in sheets/
export NODE_PATH=$(npm root -g)
FF=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
rm -rf stills sheets; mkdir -p stills sheets
python3 - "$1" <<'PY'
import sys; ts=sys.argv[1].split(',')
for w in range(4): open(f'/tmp/qa_{w}.txt','w').write(','.join(ts[w::4]))
PY
for w in 0 1 2 3; do [ -s /tmp/qa_$w.txt ] && (sleep $((w*20)); node render.js stills $(cat /tmp/qa_$w.txt) > /tmp/qalog$w.txt 2>&1) & done; wait
cat /tmp/qalog*.txt | grep -v "^$" | head -5
python3 sheet.py
