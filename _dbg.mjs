import { abrir } from './_lib.mjs';
const {b,pg}=await abrir();
const R=await pg.evaluate(()=>{
  const e=pvEventos().find(x=>x.pico>19.2&&x.pico<19.35);
  return e.C.grupo.map(g=>({
    tipo:g.tipo, mover:g.mover, alvo:g.alvo, classe:g.classe, A:g.A, cls:g.cls,
    titulo:pvTitulo(g), lun:typeof pvLunacaoSobreSol==='function'?pvLunacaoSobreSol(g):'sem fn'
  }));
});
console.log(JSON.stringify(R,null,1));
await b.close();
