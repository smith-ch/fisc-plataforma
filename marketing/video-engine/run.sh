#!/bin/zsh
# Uso: PW=/ruta/a/playwright-core ./run.sh [specs.js|specs-comercial.js]
# Renderiza todos los videos del archivo de guiones (node render.js <n> && ./mux.sh <id>). Requiere ffmpeg y python3 con numpy.
cd ${0:a:h}
export SPECS=./${1:-specs.js}
n=$(node -e "console.log(require('$SPECS').length)")
mkdir -p ../out
for i in $(seq 1 $n); do
  id=$(node -e "const s=require('$SPECS')[$i-1];require('fs').writeFileSync('spec-'+s.id+'.json',JSON.stringify(s));console.log(s.id)")
  node render.js $i && ./mux.sh $id
done
