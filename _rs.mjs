import { abrir } from './_lib.mjs';
const {b,pg,errs}=await abrir();
const R=await pg.evaluate(()=>{
  const r=revolutionFor('solar',new Date(Date.UTC(2019,9,1)));
  return {ano:r.start.toISOString().slice(0,10),
    ascSigno:r.ascSignNm, ascNatalHouse:r.ascNatalHouse,
    ascRuler:PT_NAME[r.ascRuler],
    natal:r.ascRulerNatalHouse, revNatal:r.ascRulerRevNatalHouse,
    divergente:r.ascRulerDivergente,
    lon:r.ascRulerRevLon!=null?(SIGNS[signOf(r.ascRulerRevLon)]+' '+(n360(r.ascRulerRevLon)%30).toFixed(2)):null,
    venusNatal:(n360(NATAL.pts.venus.lon)%30).toFixed(2),
    contatos:(r.contatos||[]).slice(0,4).map(c=>PT_NAME[c.rev]+' '+c.gl+' '+c.alvoNm
      +' | cai na '+c.revNatalHouse+'ª natal | alvo rege '+(c.alvoRege.join(',')||'—'))};
});
console.log(JSON.stringify(R,null,1));
const UI=await pg.evaluate(()=>{
  const ok=rsGoto(2019);
  const el=document.getElementById('rs-cards');
  return {rsGoto:ok, txt:el?el.textContent.replace(/\s+/g,' ').slice(0,700):'—'};
});
console.log('\nrsGoto:',UI.rsGoto);
console.log(UI.txt);
console.log('\nERROS:',errs.length?errs:'(nenhum)');
await b.close();
