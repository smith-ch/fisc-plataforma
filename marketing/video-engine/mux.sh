#!/bin/zsh
# mux.sh <id> : synth audio, loudness-normalize to -14 LUFS, mux with the rendered video
set -e
cd ${0:a:h}
id=$1; out=../out/$id
python3 audio.py spec-$id.json $out/work/audio.wav
ffmpeg -y -loglevel error -i $out/work/video.mp4 -i $out/work/audio.wav \
  -af "loudnorm=I=-14:TP=-1.5:LRA=7" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart $out/brag.mp4
echo "muxed $out/brag.mp4"
