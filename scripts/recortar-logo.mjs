// Recorta las 4 piezas del logo (public/brand/piece-*-{black,white}.webp) desde el símbolo completo (symbol-*.webp) con un reparto limpio:
// cada píxel pertenece a una sola pieza (más 1 px de solape en el núcleo opaco), así que en reposo las piezas componen exactamente el símbolo
// y los cortes no tienen costura ni restos. Las etiquetas iniciales salen de las piezas actuales (pieza con más alfa en cada píxel), se limpian
// (filtro de mayoría, islas pequeñas, corte S superior / S inferior) y se extienden a los píxeles de sombra por vecino más cercano.
//
//   node scripts/recortar-logo.mjs [carpeta-con-las-piezas-actuales] [carpeta-de-salida]   (por defecto frontend/public/brand, in situ)
import { createRequire } from 'node:module';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const sharp = require('sharp');
sharp.cache(false);
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const DIR = fileURLToPath(new URL('../frontend/public/brand/', import.meta.url));
const input = process.argv[2] || DIR;
const output = process.argv[3] || DIR;
mkdirSync(output, { recursive: true });

const ids=['f','s-top','s-mid','s-bottom'];
const W=422,H=511,N=W*H;
const out=output;
(async()=>{
  const raw=async(file)=>(await sharp(file).ensureAlpha().raw().toBuffer());
  const sym={black:await raw(DIR+'symbol-black.webp'),white:await raw(DIR+'symbol-white.webp')};
  const alpha=sym.black; // mismo canal alfa en las dos versiones (se comprueba abajo)
  let alphaDiff=0;for(let p=0;p<N;p++)alphaDiff=Math.max(alphaDiff,Math.abs(sym.black[p*4+3]-sym.white[p*4+3]));
  console.log('diferencia máxima de alfa black/white:',alphaDiff);
  // 1) etiqueta inicial: pieza con más alfa (usa las piezas actuales de black)
  const cur=[];for(const id of ids)cur.push(await raw(join(input,`piece-${id}-black.webp`)));
  const L=new Int8Array(N).fill(-1);
  const CORE=96;
  for(let p=0;p<N;p++){ if(alpha[p*4+3]<=CORE)continue; let best=-1,ba=8;for(let k=0;k<4;k++){const a=cur[k][p*4+3];if(a>ba){ba=a;best=k}} L[p]=best; }
  // 2) limpieza: componentes pequeños de una etiqueta -> etiqueta vecina mayoritaria; varias pasadas de filtro de mayoría
  const idx=(x,y)=>y*W+x;
  const majority=(src,r)=>{const dst=new Int8Array(src);for(let y=r;y<H-r;y++)for(let x=r;x<W-r;x++){const p=idx(x,y);if(src[p]<0)continue;const c=[0,0,0,0];let tot=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const q=src[idx(x+dx,y+dy)];if(q>=0){c[q]++;tot++}}let b=src[p];for(let k=0;k<4;k++)if(c[k]>c[b])b=k;dst[p]=b}return dst};
  let Lc=L;for(let i=0;i<3;i++)Lc=majority(Lc,3);
  // corte S superior / S inferior: filtro de mayoría ancho solo donde se tocan, para que el borde sea una línea limpia y no una escalera
  const limitado=(src,r)=>{const dst=new Int8Array(src);for(let y=r;y<H-r;y++)for(let x=r;x<W-r;x++){const p=idx(x,y);if(src[p]!==1&&src[p]!==3)continue;let c1=0,c3=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const q=src[idx(x+dx,y+dy)];if(q===1)c1++;else if(q===3)c3++}if(c1&&c3)dst[p]=c3>c1?3:1}return dst};
  for(let i=0;i<3;i++)Lc=limitado(Lc,7);
  // islas: componentes conexos por etiqueta
  const seen=new Uint8Array(N);let reassigned=0;
  for(let p0=0;p0<N;p0++){ if(Lc[p0]<0||seen[p0])continue; const lab=Lc[p0];const stack=[p0];seen[p0]=1;const comp=[];while(stack.length){const p=stack.pop();comp.push(p);const x=p%W,y=(p/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const q=idx(nx,ny);if(!seen[q]&&Lc[q]===lab){seen[q]=1;stack.push(q)}}}
    if(comp.length<400){const c=[0,0,0,0];for(const p of comp){const x=p%W,y=(p/W)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const q=Lc[idx(nx,ny)];if(q>=0&&q!==lab)c[q]++}}let b=-1,bc=0;for(let k=0;k<4;k++)if(c[k]>bc){bc=c[k];b=k}if(b>=0){for(const p of comp)Lc[p]=b;reassigned+=comp.length}}
  }
  console.log('píxeles reasignados por islas:',reassigned);
  // 3) extender etiquetas a los píxeles semitransparentes (sombra/bordes) por vecino más cercano (BFS multi-fuente)
  const lab=new Int8Array(Lc);const q=[];for(let p=0;p<N;p++)if(lab[p]>=0)q.push(p);
  for(let h=0;h<q.length;h++){const p=q[h];const x=p%W,y=(p/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const r=idx(nx,ny);if(lab[r]<0&&alpha[r*4+3]>0){lab[r]=lab[p];q.push(r)}}}
  // mapa de etiquetas para inspección
  const cols=[[230,70,70],[70,160,230],[90,200,110],[240,190,50]];const vis=Buffer.alloc(N*3,235);
  for(let p=0;p<N;p++){if(lab[p]>=0){const c=cols[lab[p]];const a=alpha[p*4+3]/255;for(let k=0;k<3;k++)vis[p*3+k]=Math.round(235*(1-a)+c[k]*a)}}
  
  // 4) piezas nuevas: alfa = alfa del símbolo × máscara de la pieza dilatada 1 px y suavizada (solapan 1 px: sin costura en reposo)
  const mask=(k)=>{const m=new Float32Array(N);for(let p=0;p<N;p++)m[p]=lab[p]===k?1:0;
    // dilatación 1 px (8 vecinos)
    const d=new Float32Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0;for(let dy=-1;dy<=1&&!v;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;if(m[idx(nx,ny)]){v=1;break}}d[idx(x,y)]=v}
    return d};
  const blur=async(f32)=>{const b=Buffer.alloc(N);for(let p=0;p<N;p++)b[p]=Math.round(f32[p]*255);const o=await sharp(b,{raw:{width:W,height:H,channels:1}}).blur(0.6).extractChannel(0).raw().toBuffer();return o};
  for(let k=0;k<4;k++){const soft=await blur(mask(k));
    for(const th of ['black','white']){const src=sym[th];const buf=Buffer.alloc(N*4);
      for(let p=0;p<N;p++){buf[p*4]=src[p*4];buf[p*4+1]=src[p*4+1];buf[p*4+2]=src[p*4+2];
        // los píxeles propios de la pieza conservan el alfa completo del símbolo; el margen de 1 px lo toma de la máscara suavizada
        buf[p*4+3]=lab[p]===k?src[p*4+3]:(soft[p]>0&&src[p*4+3]>=240?src[p*4+3]:0);}
      writeFileSync(join(out,`piece-${ids[k]}-${th}.webp`),await sharp(buf,{raw:{width:W,height:H,channels:4}}).webp({quality:92,alphaQuality:100,effort:6}).toBuffer());}
  }
  console.log('listo');
})();
