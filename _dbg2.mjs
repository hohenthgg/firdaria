import { abrir } from './_lib.mjs';
const {b,pg}=await abrir();
const R=await pg.evaluate(()=>{
  const e=pvEventos().find(x=>x.pico>19.2&&x.pico<19.35);
  return e.votacao.linhas.filter(l=>l.casa===4||l.casa===5)
    .map(l=>l.casa+'  +'+l.peso+'  ['+l.origem+']  '+l.porque);
});
R.forEach(x=>console.log(x));
await b.close();
