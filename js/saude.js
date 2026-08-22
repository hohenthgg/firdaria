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
/* ============================================================
   PROPENSÃO POR ÁREA DO CORPO
   Soma dos testemunhos tradicionais que apontam para cada área da
   melotesia. O resultado é o PESO RELATIVO desses testemunhos —
   não uma probabilidade clínica, que a astrologia não calcula.
   ============================================================ */
const SAUDE_AREA=[
  'cabeça, olhos e face','garganta, pescoço e tireoide','pulmões, brônquios, braços e nervos',
  'estômago, seios e digestão','coração, circulação e coluna dorsal','intestinos e absorção',
  'rins, bexiga e região lombar','órgãos genitais e vias de eliminação','quadris, fígado e ciático',
  'joelhos, ossos, articulações e pele','tornozelos, circulação e espasmos','pés, linfa e imunidade'];
function saudePropensao(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const P={}, EV={};
  const add=(sg,w,txt)=>{if(sg==null||!isFinite(sg))return;
    P[sg]=(P[sg]||0)+w; (EV[sg]=EV[sg]||[]).push(txt+' <i>+'+w.toFixed(1)+'</i>');};
  const sgP=k=>NATAL.pts[k]?signOf(NATAL.pts[k].lon):null;
  const r1=NATAL.rulers[1], r6=NATAL.rulers[6];
  /* 1 · o panorama: a cúspide da 6ª */
  const s6=signOf(NATAL.cusps[5]);
  add(s6,3,'Cúspide da 6ª em '+SIGNS[s6]+' — o panorama das doenças possíveis');
  /* 2 · o afunilamento: o signo do regente da 6ª */
  const p6=NATAL.pts[r6];
  if(p6)add(signOf(p6.lon),2.5,'Regente da 6ª ('+PT_NAME[r6]+') em '+SIGNS[signOf(p6.lon)]+' — afunila o panorama');
  /* 3 · o corpo: Ascendente e seu regente */
  const sA=signOf(NATAL.asc);
  add(sA,2,'Ascendente em '+SIGNS[sA]+' — a compleição e o corpo');
  const p1=NATAL.pts[r1];
  if(p1)add(signOf(p1.lon),1.5,'Regente do Ascendente ('+PT_NAME[r1]+') em '+SIGNS[signOf(p1.lon)]);
  /* 4 · a Lua: ritmo, líquidos e sono */
  if(NATAL.pts.moon)add(sgP('moon'),1,'Lua em '+SIGNS[sgP('moon')]+' — ritmo, líquidos e sono');
  /* 5 · os maléficos, pelo signo que ocupam e pela casa */
  ['mars','saturn'].forEach(k=>{
    const p=NATAL.pts[k]; if(!p)return;
    const sg=signOf(p.lon);
    add(sg,1.5,PT_NAME[k]+' em '+SIGNS[sg]+' — maléfico incidindo sobre a região');
    if(p.h===1)add(sg,1,PT_NAME[k]+' na 1ª — pesa sobre o corpo e a vitalidade');
    if(p.h===6)add(sg,1,PT_NAME[k]+' na 6ª — pesa sobre a saúde cotidiana');
    const d2=(p.dig||'').match(/exílio|queda|combusto/);
    if(d2)add(sg,.5,PT_NAME[k]+' debilitado ('+d2[0]+')');
  });
  /* 6 · qualquer planeta debilitado marca a sua região */
  Object.keys(PT_NAME).forEach(k=>{
    const p=NATAL.pts[k]; if(!p||['mars','saturn'].includes(k))return;
    const deb=(p.dig||'').match(/exílio|queda/);
    if(deb)add(signOf(p.lon),.5,PT_NAME[k]+' em '+deb[0]+' — a região responde com menos recurso');
  });
  const max=Math.max(1,...Object.values(P));
  const lista=Object.keys(P).map(Number).sort((a,b)=>P[b]-P[a]).map(sg=>({
    sg, area:SAUDE_AREA[sg], bruto:P[sg], pct:Math.round(P[sg]/max*100),
    nivel:P[sg]/max>=.66?'alta':P[sg]/max>=.33?'moderada':'leve',
    ev:EV[sg], detalhe:SAUDE_SIGNO[sg]}));
  return {lista,total:Object.values(P).reduce((a,b)=>a+b,0)};
}
function saudePropHTML(){
  const R=saudePropensao(); if(!R||!R.lista.length)return '';
  const barra=x=>'<details class="pr-i"><summary>'
    +'<span class="pr-n">'+cap1(x.area)+'</span>'
    +'<span class="pr-t"><i class="'+x.nivel+'" style="width:'+x.pct+'%"></i></span>'
    +'<span class="pr-v">'+x.nivel+'</span></summary>'
    +'<div class="pr-b"><p><b>'+SIGNS[x.sg]+'</b> — '+x.detalhe+'.</p>'
    +'<span>testemunhos que pesaram aqui</span><ul class="ne-l">'
    +x.ev.map(e=>'<li>'+e+'</li>').join('')+'</ul></div></details>';
  return '<div class="card sd"><div class="kicker">propensão por área do corpo — peso relativo dos testemunhos</div>'
    +'<p class="pr-cab">As barras comparam <b>o peso dos testemunhos tradicionais</b> que apontam para cada '
    +'região, sempre em relação à região mais apontada deste mapa. Não são probabilidades clínicas: '
    +'a astrologia não calcula risco de doença, e nenhuma barra aqui significa que algo vá acontecer.</p>'
    +R.lista.map(barra).join('')
    +'<p class="pf-aviso">Suscetibilidade tradicional, não diagnóstico. Não substitui avaliação médica.</p>'
    +'</div>';
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
    +'</details></div>'
    +saudePropHTML()+saudeConstHTML();
}
/* constituição e suscetibilidades — migrada da aba dos eixos */
function saudeConstHTML(){
  if(typeof constitution!=='function')return '';
  let C=null; try{C=constitution(profileData().T);}catch(e){return '';}
  if(!C)return '';
  return '<details class="card pf-const"><summary><span class="kicker" style="margin:0">constituição e suscetibilidades tradicionais</span>'
    +'<b>'+cap1(C.constituicao)+' — '+C.qualidades+'</b><em>sustentação '+C.sust+'</em></summary>'
    +'<div class="pf-cb">'
    +'<div class="pf-cr"><span>Constituição predominante</span>'+cap1(C.constituicao)+' ('+C.qualidades+'). '+C.excesso+'.</div>'
    +'<div class="pf-cr"><span>Funções tradicionalmente mais sensíveis</span><ul class="ilist">'
      +C.sens.map(x=>'<li><b>'+x.o+'</b> — '+x.v+'</li>').join('')+'</ul></div>'
    +'<div class="pf-cr"><span>Fatores de agravamento</span>'+(C.agrav.length?('<ul class="ilist">'+C.agrav.map(x=>'<li>'+x+'</li>').join('')+'</ul>'):'nenhum testemunho relevante detectado.')+'</div>'
    +'<div class="pf-cr"><span>Fatores de compensação e proteção</span><ul class="ilist">'+C.comp.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>'
    +'<div class="pf-cr"><span>Sustentação astrológica</span>'+C.sust+' — '+C.test.length+' testemunhos repetidos.</div>'
    +'<p class="pf-aviso">Esta seção descreve tendências constitucionais da tradição. Não diagnostica, não prevê enfermidades e não substitui avaliação médica.</p>'
    +'</div></details>';
}
