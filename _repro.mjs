import { abrir } from './_lib.mjs';
const {b,pg,errs}=await abrir();
const R=await pg.evaluate(()=>{
  const out={asc:SIGNS[signOf(NATAL.asc)]+' '+(n360(NATAL.asc)%30).toFixed(2), seita:NATAL.sect, rulers:{}, pts:{}};
  for(let h=1;h<=12;h++)out.rulers[h]=PT_NAME[NATAL.rulers[h]]||NATAL.rulers[h];
  Object.keys(PT_NAME).forEach(k=>{const p=NATAL.pts[k];
    out.pts[PT_NAME[k]]={signo:SIGNS[signOf(p.lon)], grau:+(n360(p.lon)%30).toFixed(2), casa:p.h, rege:ruledHouses(k)};});
  return out;
});
console.log('Asc:',R.asc,'| seita:',R.seita);
console.log('regentes:',JSON.stringify(R.rulers));
Object.entries(R.pts).forEach(([n,p])=>console.log('  '+n.padEnd(10),p.signo.padEnd(10),String(p.grau).padStart(5),'casa',p.casa,'| rege',p.rege.join(',')||'—'));
const EV=await pg.evaluate(()=>{
  return pvEventos().filter(e=>e.pico>=18.7&&e.pico<=21.5).map(e=>({
    idade:+e.pico.toFixed(2),
    data:new Date(e.dPico).toISOString().slice(0,7),
    campo:e.campo, cls:e.cls, tier:e.tier,
    titulo:e.titulo, desc:e.desc,
    principal:pvTitulo(e.C.principal),
    pls:e.C.principal.env.pls,
    casasSig:e.C.principal.env.casasSig,
    casasProm:e.C.principal.env.casasProm,
    itens:e.C.grupo.map(i=>pvTitulo(i)).slice(0,5),
    votos:e.votacao.ordem.slice(0,4).map(o=>o.casa+':'+o.peso).join(' '),
    amb:e.votacao.ambiguo?('AMBÍGUO '+e.votacao.campo+'/'+e.votacao.alternativa+' r='+e.votacao.razao):''
  }));
});
console.log('\n=== eventos (antes) ===');
EV.forEach(e=>{
  console.log('\n'+e.data+'  idade '+e.idade+'  CAMPO '+e.campo+'  ['+e.tier+'/'+e.cls+']  → "'+e.titulo+'"');
  console.log('   '+e.desc);
  console.log('   principal: '+e.principal);
  console.log('   pls: '+e.pls.join(',')+' | casasSig: '+e.casasSig.join(',')+' | casasProm: '+e.casasProm.join(','));
  console.log('   votos: '+e.votos+'  '+e.amb);
  console.log('   itens: '+e.itens.join(' | '));
});
console.log('\nERROS:', errs.length?errs:'(nenhum)');
await b.close();
