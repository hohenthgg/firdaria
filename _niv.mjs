import { abrir } from './_lib.mjs';
const {b,pg,errs}=await abrir();
const R=await pg.evaluate(async()=>{
  modoTecnicoDefinir(false);
  irPara('tempo'); renderPreditivas();
  await new Promise(r=>setTimeout(r,600));
  const el=document.getElementById('pv-body');
  const txt=el?el.textContent:'';
  // abre todos os cartões e recolhe outra vez
  const ids=[...document.querySelectorAll('[data-pvev]')].map(x=>x.dataset.pvev);
  let abertos='';
  for(const id of ids.slice(0,8)){
    PV_OPEN=id; renderPreditivas();
    await new Promise(r=>setTimeout(r,60));
    abertos+=(document.getElementById('pv-body')||{}).textContent||'';
  }
  const tudo=txt+abertos;
  return {
    achados:nivelContemTecnico(tudo),
    achadosAmplo:nivelContemTecnico(tudo,NIVEL_TERMOS_MINIMOS.concat(['combusto','cazimi','significador'])),
    nEventos:ids.length,
    amostra:txt.replace(/\s+/g,' ').slice(0,600)
  };
});
console.log('eventos:',R.nEventos);
console.log('palavras técnicas (lista mínima):',R.achados.length?R.achados:'(nenhuma)');
console.log('lista ampla:',R.achadosAmplo.length?R.achadosAmplo:'(nenhuma)');
console.log('\namostra:\n'+R.amostra);
console.log('\nERROS:',errs.length?errs:'(nenhum)');
await b.close();
