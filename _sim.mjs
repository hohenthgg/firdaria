import { abrir } from './_lib.mjs';
const {b,pg,errs}=await abrir();
const R=await pg.evaluate(()=>{
  modoTecnicoDefinir(false);
  const ev=pvEventos().filter(e=>e.pico>=18.9&&e.pico<=19.6);
  return ev.map(e=>({
    data:new Date(e.dPico).toISOString().slice(0,7),
    campo:e.campo, alt:e.campoAlt, amb:e.ambiguo, tier:e.tier, fase:e.fase,
    simples:pvSimples(e)
  }));
});
R.forEach(e=>{
  console.log('\n'+e.data+'  campo '+e.campo+(e.amb?(' (alt '+e.alt+')'):'')+'  ['+e.tier+'/'+e.fase+']');
  console.log('  1 '+e.simples.acontecimento);
  console.log('  2 '+e.simples.porque);
  console.log('  3 '+e.simples.quem);
});
const tem=R.some(e=>/filho/i.test(e.simples.acontecimento+e.simples.porque+e.simples.quem));
console.log('\ncontém "filho":',tem);
console.log('ERROS:',errs.length?errs:'(nenhum)');
await b.close();
