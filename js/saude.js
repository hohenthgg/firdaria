/* ============================================================
   SAUDE.JS — o jogo simples da saúde tradicional.

   1 · regente da 1ª debilitado → vitalidade geral baixa
   2 · signo da CÚSPIDE da 6ª → panorama das doenças possíveis
   3 · signo do REGENTE da 6ª → afunila esse panorama;
       a casa em que ele está diz onde isso aparece
   4 · maléficos na 1ª pesam sobre a vitalidade; na 6ª, sobre a saúde
   5 · Saturno na 6ª → problemas crônicos de saúde
   6 · Saturno na cúspide da 1ª → baixa vitalidade crônica, e os
       assuntos que ele carrega por regência viram queixa crônica
   ============================================================ */

/* melotesia: o corpo de cada signo */
const SAUDE_SIGNO={
  0:'cabeça e rosto: enxaquecas, febres, inflamações agudas, traumatismos cranianos',
  1:'garganta e pescoço: tireoide, amígdalas, cordas vocais, tendência a acumular',
  2:'pulmões, brônquios, braços e nervos: quadros respiratórios e esgotamento nervoso',
  3:'estômago e seios: digestão, retenção de líquidos, somatização emocional',
  4:'coração, circulação e coluna dorsal: pressão, palpitação, desgaste cardíaco',
  5:'intestinos e absorção: cólons, dietas, somatizações digestivas e obsessão higiênica',
  6:'rins e região lombar: equilíbrio de líquidos, vias urinárias, lombalgias',
  7:'órgãos genitais e vias de eliminação: bexiga, reto, sistema reprodutor',
  8:'quadris, fígado e ciático: excessos hepáticos, problemas de locomoção',
  9:'joelhos, ossos, articulações e pele: reumatismo, rigidez, quadros de depósito',
  10:'tornozelos e circulação: varizes, câimbras, distúrbios circulatórios e espasmos',
  11:'pés e sistema linfático: imunidade, edemas, sensibilidade a intoxicações'};
/* a queixa crônica que Saturno carrega, pela casa que rege */
const SAUDE_CRON={
  1:'baixa vitalidade e do próprio corpo',2:'insegurança material que soma no corpo',
  3:'tensão mental, fala e nervos',4:'peso familiar e de origem',
  5:'bloqueio do prazer e da criação',6:'doença de rotina e trabalho',
  7:'desgaste nos vínculos e contratos',8:'ansiedade e medo (TAG)',
  9:'crise de sentido e de fé',10:'cobrança de desempenho e posição',
  11:'isolamento dentro dos próprios grupos',12:'reclusão, insônia e autossabotagem'};

function saudeEngine(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const ctx=ctxNatal();
  const r1=NATAL.rulers[1], r6=NATAL.rulers[6];
  const c1=condicaoDe(r1,ctx);
  const s6=signOf(NATAL.cusps[5]);                      // signo da cúspide da 6ª
  const p6=NATAL.pts[r6];
  const s6r=p6?signOf(p6.lon):null;                     // signo do regente da 6ª
  const MAL=['mars','saturn'];
  const mal1=MAL.filter(k=>NATAL.pts[k]&&NATAL.pts[k].h===1);
  const mal6=MAL.filter(k=>NATAL.pts[k]&&NATAL.pts[k].h===6);
  const sat=NATAL.pts.saturn;
  const satCuspide1=!!(sat&&adiff(sat.lon,NATAL.asc)<=5);
  const sat6=!!(sat&&sat.h===6);
  const satRege=ruledHouses('saturn');

  /* ---- barras (0–100, qualitativas) ---- */
  let vit=55+(c1?c1.soma*6:0);
  mal1.forEach(()=>vit-=14);
  if(satCuspide1)vit-=18;
  vit=Math.max(6,Math.min(96,vit));
  let carga6=25+mal6.length*22+(sat6?14:0);
  const c6=p6?condicaoDe(r6,ctx):null;
  if(c6&&c6.soma<0)carga6+=12;
  carga6=Math.max(6,Math.min(96,carga6));
  let cron=10+(sat6?38:0)+(satCuspide1?34:0)+((c1&&c1.soma<=-2)?14:0);
  cron=Math.max(4,Math.min(96,cron));
  const nv=v=>v>=64?'alta':v>=38?'moderada':'baixa';

  /* ---- as evidências, na ordem das regras ---- */
  const ev=[];
  ev.push('Regente da 1ª ('+PT_NAME[r1]+'): '+(c1?c1.nivel+' — '+c1.nivelTxt:'—')+'.');
  ev.push('Panorama pela cúspide da 6ª em '+SIGNS[s6]+': '+SAUDE_SIGNO[s6]+'.');
  if(p6)ev.push('O regente da 6ª ('+PT_NAME[r6]+') está em '+SIGNS[s6r]+', o que afunila para '
    +SAUDE_SIGNO[s6r]+' — e aparece pela casa '+p6.h+' ('+HOUSE_TAG[p6.h]+').');
  if(mal1.length)ev.push('Maléfico'+(mal1.length>1?'s':'')+' na 1ª ('+mal1.map(k=>PT_NAME[k]).join(' e ')
    +'): pesa'+(mal1.length>1?'m':'')+' diretamente sobre o corpo e a vitalidade.');
  if(mal6.length)ev.push('Maléfico'+(mal6.length>1?'s':'')+' na 6ª ('+mal6.map(k=>PT_NAME[k]).join(' e ')
    +'): pesa'+(mal6.length>1?'m':'')+' sobre a saúde cotidiana.');
  if(sat6)ev.push('Saturno na 6ª: problemas crônicos de saúde — o que adoece, demora.');
  if(satCuspide1)ev.push('Saturno na cúspide da 1ª: baixa vitalidade crônica'
    +(satRege.length?('; e, como rege '+satRege.map(h=>'a '+h+'ª').join(' e ')
      +', vira queixa crônica de '+satRege.map(h=>SAUDE_CRON[h]).join(' e de ')):'')+'.');
  return {vit,carga6,cron,nv,ev,r1,c1,s6,s6r,p6,r6,mal1,mal6,sat6,satCuspide1};
}
function renderSaude(){
  const el=$('saude-body'); if(!el)return;
  const S=saudeEngine(); if(!S){el.innerHTML='';return;}
  const bar=(rot,v,inv)=>{
    const lb=S.nv(v), tom=inv?(v>=64?'mal':v>=38?'':'ok'):(v>=64?'ok':v>=38?'':'mal');
    return '<div class="sd-b"><span>'+rot+'</span>'
      +'<div class="sd-t"><i class="'+tom+'" style="width:'+v+'%"></i></div><b>'+lb+'</b></div>';};
  el.innerHTML='<div class="card sd">'
    +'<div class="kicker">saúde e vitalidade — leitura tradicional</div>'
    +bar('Vitalidade geral',S.vit,false)
    +bar('Pressão sobre a saúde cotidiana (6ª)',S.carga6,true)
    +bar('Risco de cronicidade',S.cron,true)
    +'<details class="np-int"><summary>Como foi avaliado</summary>'
    +'<ul class="ne-l">'+S.ev.map(x=>'<li>'+x+'</li>').join('')+'</ul>'
    +'<p class="pf-aviso">Suscetibilidade tradicional, não diagnóstico. Não substitui avaliação médica.</p>'
    +'</details></div>';
}
