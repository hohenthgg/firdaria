/* util: estado vazio */
function emptyState(){return '<div class="card"><div class="kicker">sem mapa carregado</div><p>Informe o mapa natal na aba <b>Dados</b> para o sistema gerar a estrutura interpretativa.</p></div>';}
/* ============================================================
   RENDER.JS — renderização das telas. Depende de data/core/rag.
   ============================================================ */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/</g,'&lt;');
let CURSOR=new Date();            // cursor temporal global
let PINNED=null;                  // data A fixada para comparação
const EVENTS=JSON.parse(localStorage.getItem('ag_events')||'[]'); // eventos pessoais
const EVAL=JSON.parse(localStorage.getItem('ag_eval')||'{}');     // avaliações retrospectivas

const relClass=t=>t.indexOf('muito')>=0?'r3':t.indexOf('alta')>=0?'r2':t.indexOf('moderada')>=0?'r1':'r0';
function layerBlock(id,layers){
  // layers: {frase,resumo,manif,fund,fontesFn}
  const btn=(k,l)=>'<button class="lbtn" data-l="'+k+'" data-for="'+id+'">'+l+'</button>';
  return '<div class="layers" id="ly-'+id+'">'
    +'<div style="font-size:.86rem;color:var(--ivory)">'+layers.frase+'</div>'
    +'<div class="lbtns">'+btn('resumo','resumir')+btn('manif','ver manifestações')+btn('fund','ver fundamento')+btn('fontes','ver fontes')+'</div>'
    +'<div class="lbody" data-l="resumo">'+layers.resumo+'</div>'
    +'<div class="lbody" data-l="manif">'+layers.manif+'</div>'
    +'<div class="lbody" data-l="fund">'+layers.fund+'</div>'
    +'<div class="lbody" data-l="fontes" data-fontes="'+id+'"><span class="mono">carregando fontes…</span></div>'
    +'</div>';
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('.lbtn'); if(!b)return;
  const wrap=b.closest('.layers');
  wrap.querySelectorAll('.lbtn').forEach(x=>x.classList.toggle('on',x===b&&!b.classList.contains('on')));
  const l=b.dataset.l, was=b.classList.contains('on');
  wrap.querySelectorAll('.lbody').forEach(x=>x.classList.toggle('on',x.dataset.l===l&&was));
  if(l==='fontes'&&was){
    const box=wrap.querySelector('[data-fontes]');
    const key=box.dataset.fontes;
    box.innerHTML=renderSources(await sourcesFor(key));
  }
});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-loadsrc]'); if(!b)return;
  const k=b.dataset.loadsrc, box=b.closest('.isrc');
  box.innerHTML='<span class="mono">consultando corpus…</span>';
  box.innerHTML=renderSources(await sourcesFor('pl:'+k));
});
async function sourcesFor(key){
  await RAG.load();
  const k=key.split(':')[1]||key;
  if(NATAL.pts[k]){
    const r=RAG.query(RAG.unitsForPlanet(k),4);
    return r.length?r:RAG.fallbackForPlanet(k);
  }
  const r=RAG.query([[k,2,'termo pesquisado']],4);
  return r.length?r:[{fonte:'—',autor:'—',secao:'—',trecho:'Nenhum trecho recuperado para esta unidade. '+RAG.status,relevancia:0,motivo:'sem correspondência'}];
}
function renderSources(list){
  return list.map(s=>'<div class="src"><div class="s-head">'+esc(s.fonte)+' · '+esc(s.autor)+' · '+esc(s.secao)+' · relevância '+s.relevancia+'</div>'
    +'<div>'+esc(s.trecho)+'</div><div class="mono" style="margin-top:3px">motivo: '+esc(s.motivo)+'</div></div>').join('')
    +'<div class="mono" style="margin-top:4px;color:var(--dim2)">Distinção: trecho = informação da fonte; regra aplicada e inferência aparecem no fundamento; a síntese do caso é o texto principal.</div>';
}

/* ================= AGORA ================= */
function renderAgora(){
  if(!NATAL){$('agora-body').innerHTML=emptyState();$('agora-sub').textContent='';return;}
  const now=new Date(); const age=ageAt(now), f=firdAt(age), p=profAt(age), y=rsYearOf(now), rs=RS_DATA[y];
  $('agora-sub').textContent='· '+fdate(now)+' · idade '+Math.floor(age);
  const top=scoredHits(now,0).slice(0,3);
  const conv=convergence(now);
  const nw=nextRelevantWindow(now);
  const lord=NATAL.pts[p.lordKey];
  let html='';
  html+='<div class="grid2"><div>';
  html+='<div class="card"><div class="kicker">período vigente</div>'
    +'<span class="tag gold">Firdária '+f.major+' / '+f.sub+'</span>'
    +'<span class="tag">Profecção: casa '+p.houseN+' · '+p.sign+'</span>'
    +'<span class="tag">Senhor do Ano: '+PT_NAME[p.lordKey]+'</span>'
    +'<span class="tag blue">Convergência do dia: '+conv.label+' ('+conv.value+')</span>'
    +'<p style="margin-top:8px;font-size:.84rem">'+synthYear(Math.floor(age),p,f)+'</p></div>';
  html+='<div class="card"><div class="kicker">tema principal da Revolução '+y+'</div>'
    +(rs?('<p style="font-size:.84rem"><b style="color:var(--ivory)">'+rs.asc+'</b></p><p style="font-size:.82rem">'+rs.destaque.split('.').slice(0,2).join('.')+'.</p>')
        :'<p>Sem RS registrada para '+y+'.</p>')
    +'</div>';
  html+='</div><div>';
  html+='<div class="card"><div class="kicker">três ativações mais relevantes agora</div>'+ (top.length?top.map(h=>renderHit(h,now,false)).join(''):'<p>céu em silêncio sobre o natal.</p>') +'</div>';
  // ações e cautelas agregadas
  const favs=[],caus=[];
  top.forEach(h=>{const o=orient(h,now);o.fav.forEach(x=>favs.indexOf(x)<0&&favs.push(x));o.cau.forEach(x=>caus.indexOf(x)<0&&caus.push(x));});
  html+='<div class="card"><div class="kicker">ações favorecidas</div><p style="font-size:.82rem;color:var(--green)">'+(favs.slice(0,5).join(' · ')||'—')+'</p>'
      +'<div class="kicker" style="margin-top:8px">cautelas</div><p style="font-size:.82rem;color:var(--red)">'+(caus.slice(0,5).join(' · ')||'—')+'</p></div>';
  html+='<div class="card"><div class="kicker">próxima janela relevante</div>'
    +(nw?('<p style="font-size:.84rem"><b style="color:var(--ivory)">'+fdate(nw.d)+'</b> — '+nw.hit.tg+' '+nw.hit.gl+' '+nw.hit.np.g+' '+PT_NAME[nw.hit.tKey]+' '+nw.hit.verb+' '+nw.hit.np.nm+' natal, <span class="mono">'+nw.hit.orb.toFixed(1)+'°</span> · <span class="rel '+relClass(nw.hit.rel.tier)+'">'+nw.hit.rel.tier+'</span></p>')
        :'<p>nenhuma janela de alta relevância nos próximos 120 dias.</p>')+'</div>';
  html+='</div></div>';
  $('agora-body').innerHTML=html;
}
function renderHit(h,d,withOrient){
  const o=orient(h,d);
  const id='hit'+Math.random().toString(36).slice(2,8);
  let s='<div class="hit '+h.cls+'"><div class="h-top"><span class="h-title"><span class="g">'+h.tg+' '+h.gl+' '+h.np.g+'</span>'+PT_NAME[h.tKey]+' '+({conj:'conjunto a',harm:'em harmonia com',tens:'em tensão com'})[h.cls]+' '+h.np.nm+'</span>'
    +'<span><span class="mono">'+h.orb.toFixed(1)+'°</span> <span class="rel '+relClass(h.rel.tier)+'">'+h.rel.tier+' · '+h.rel.score+'</span></span></div>';
  s+='<div class="h-body">'+o.lit+'</div>';
  if(withOrient){
    s+='<div class="h-body"><b style="color:var(--green)">Favorece:</b> '+o.fav.join('; ')+'. <b style="color:var(--red)">Exige cautela:</b> '+o.cau.join('; ')+'.</div>';
    s+='<div class="h-meta">condição técnica: '+o.tech+'</div>';
    s+='<div class="h-meta">duração: início '+fdate(o.w.start)+' · pico '+fdate(o.w.peak)+' ('+o.w.minOrb.toFixed(1)+'°) · término '+fdate(o.w.end)+'</div>';
  }
  s+='<div class="h-meta"><details><summary style="cursor:pointer">fundamento da relevância</summary>'
    +h.rel.factors.map(f=>'+'+f[0]+' — '+f[1]).join('<br>')
    +'<br><span style="color:var(--dim2)">medida interna de repetição entre técnicas; não é probabilidade.</span></details></div>';
  return s+'</div>';
}

/* ================= MAPA NATAL + camadas + promessas ================= */
let ACTIVE_PROM=null;
function renderNatal(){
  if(typeof renderNatalTab==='function'){try{renderNatalTab();}catch(e){console.error('natal',e);}}
  const pel=$('natal-proms'); if(!pel)return;
  if(typeof NATAL==='undefined'||!NATAL){pel.innerHTML='';return;}
  const now=new Date();
  pel.innerHTML=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]).map(pr=>{
    const st=(typeof promiseState==='function')?promiseState(pr,now):{estado:'latente'};
    const cls={ativada:'alta','disponível':'moderada',latente:'latente'}[st.estado]||'latente';
    return '<div class="nsp"><span class="nsp-t">'+pr.t+'</span>'
      +'<span class="nsp-m">'+(PT_GLYPH[pr.pl]||'')+'︎ '+PT_NAME[pr.pl]+' · casas '+(pr.casas||[]).map(h=>h+'ª').join(', ')+'</span>'
      +'<span class="pp-lv '+cls+'">'+st.estado+'</span></div>';
  }).join('')||'<p class="note">nenhuma promessa detectada.</p>';
}
function manifestFor(k){
  const M={sun:'cargos de frente, autoria assinada, avaliação pública do próprio nome; saúde ligada a coração e vitalidade',
    moon:'produção criativa em ciclos, oscilação de ânimo atada ao desempenho, cuidado com sono e rotina',
    mercury:'escrita, ensino, negociação; discussões quando criticado; contratos como ponto sensível',
    venus:'ganho por estética, consultoria e acordos; compras e coleções; diplomacia eficaz',
    mars:'papel executivo em grupos, esporte/treino como válvula, atritos com colegas quando bloqueado',
    jupiter:'estudo longo, publicação, mentoria; expansão por irmãos/rede próxima; excesso de confiança argumentativa',
    saturn:'vínculos e sociedades formais, contratos longos, revisões de acordos; maturidade relacional tardia'};
  return M[k]||'—';
}

/* ================= SALA PLANETAS: exposição em três colunas ================= */
let SEL_PL=null;
function natalWheel(sel){
  const C=210,R1=200,R2=172,R3=140,Rp=118;
  const P=(lon,r)=>{const a=(180-(n360(lon)-NATAL.asc))*Math.PI/180;return [C+r*Math.cos(a),C-r*Math.sin(a)];};
  let s='<svg viewBox="0 0 420 420">';
  s+='<circle cx="'+C+'" cy="'+C+'" r="'+R1+'" fill="none" stroke="var(--line2)" stroke-width="1"/>';
  s+='<circle cx="'+C+'" cy="'+C+'" r="'+R2+'" fill="none" stroke="var(--line)"/>';
  s+='<circle cx="'+C+'" cy="'+C+'" r="'+R3+'" fill="none" stroke="var(--line)"/>';
  for(let i=0;i<12;i++){
    const [x1,y1]=P(i*30,R3),[x2,y2]=P(i*30,R1);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="var(--line)"/>';
    const [tx,ty]=P(i*30+15,(R1+R2)/2);
    s+='<text x="'+tx+'" y="'+(ty+3)+'" text-anchor="middle" font-size="9" font-family="IBM Plex Mono" letter-spacing="1.5" fill="var(--dim2)">'+SG[i]+'</text>';
  }
  // cúspides (finas) + Asc/MC destacados
  NATAL.cusps.forEach((c,i)=>{
    const strong=(i===0||i===9);
    const [x1,y1]=P(c,strong?26:R3-18),[x2,y2]=P(c,R3);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(strong?'var(--gold2)':'var(--line)')+'" stroke-width="'+(strong?1:0.6)+'"/>';
    const [hx,hy]=P(c+((n360(NATAL.cusps[(i+1)%12]-c))/2||15),R3-30);
    s+='<text x="'+hx+'" y="'+(hy+3)+'" text-anchor="middle" font-size="8" font-family="IBM Plex Mono" fill="var(--line2)">'+(i+1)+'</text>';
  });
  // planetas
  Object.entries(NATAL.pts).forEach(([k,p])=>{
    if(k==='spirit')return;
    const on=k===sel;
    const [x,y]=P(p.lon,Rp);
    if(on){
      const [cx2,cy2]=P(p.lon,R1);
      s+='<line x1="'+x+'" y1="'+y+'" x2="'+cx2+'" y2="'+cy2+'" stroke="var(--gold2)" stroke-width=".7" opacity=".7"/>';
      s+='<circle cx="'+x+'" cy="'+y+'" r="17" fill="rgba(246,249,255,0.093)" stroke="var(--ivory)" stroke-width="1"/>';
    }
    s+='<text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="'+(on?17:12)+'" font-family="Cormorant Garamond" fill="'+(on?'var(--ivory2)':'var(--dim)')+'">'+p.g+'</text>';
  });
  s+='</svg>';
  return s;
}
function renderPlanetas(){
  const selWrap=$('pl-sel');
  if(!NATAL){$('planetas-body').innerHTML=emptyState();selWrap.innerHTML='';return;}
  const keys=Object.keys(PT_NAME).filter(k=>NATAL.pts[k]);
  if(!SEL_PL||!NATAL.pts[SEL_PL])SEL_PL=keys[0];
  selWrap.innerHTML=keys.map(k=>{const pp=NATAL.pts[k];return '<button data-pl="'+k+'"'+(k===SEL_PL?' class="on"':'')+'><span class="pg">'+PT_GLYPH[k]+'</span><span class="pn">'+PT_NAME[k]+'</span><span class="ps">'+SG[signOf(pp.lon)]+' · casa '+pp.h+'</span></button>';}).join('');
  selWrap.onclick=e=>{const b=e.target.closest('[data-pl]');if(!b)return;SEL_PL=b.dataset.pl;renderPlanetas();};
  const k=SEL_PL,p=NATAL.pts[k],it=interpPlanet(k);
  const sg=signOf(p.lon), ru=ruledHouses(k), rec=(NATAL.meta.receptions||[]).filter(r=>r.includes(PT_GLYPH[k]));
  const sectMal=(NATAL.sect==='diurno'&&k==='mars')||(NATAL.sect==='noturno'&&k==='saturn');
  const sectBen=(NATAL.sect==='diurno'&&k==='jupiter')||(NATAL.sect==='noturno'&&k==='venus');
  const lord=Object.keys(STR).sort((a,b)=>STR[b]-STR[a])[0];
  const prom=PROMESSAS.find(pr=>pr.pl===k);
  const meta=(kk,vv)=>'<div class="m-k">'+kk+'</div><div class="m-v">'+vv+'</div>';
  const html='<div class="exh exh-in">'
    +'<div class="exh-l">'
      +'<div class="x-name">'+p.nm+'</div>'
      +'<div class="x-sub">'+SIGNS[sg]+' · casa '+p.h+(p.hBack?(' · fundo na '+p.hBack):'')+(lord===k?' · senhor da genitura':'')+'</div>'
      +'<div class="x-block x-sintese">'+it.sintese+'</div>'
      +'<div class="isec"><span class="ik">manifestações concretas</span><ul class="ilist">'+it.manif.map(m=>'<li>'+m+'</li>').join('')+'</ul></div>'
      +'<div class="isec"><span class="ik">expressão construtiva / problemática</span>'
        +'<div class="iexp alta" style="margin-bottom:8px"><span class="mono">construtiva</span><ul class="ilist">'+it.alta.map(m=>'<li>'+m+'</li>').join('')+'</ul></div>'
        +'<div class="iexp baixa"><span class="mono">problemática · sob aflição</span><ul class="ilist">'+it.baixa.map(m=>'<li>'+m+'</li>').join('')+'</ul></div></div>'
      +(prom?('<div class="x-block"><b>Promessa natal.</b> '+prom.fat+' '+prom.cond+'</div>'):'')
      +'<details><summary class="ik" style="cursor:pointer;padding:8px 0">fatores que confirmam ou moderam · fundamento técnico ▾</summary>'
        +'<ul class="ilist">'+it.confirma.map(m=>'<li>'+m+'</li>').join('')+'</ul>'
        +'<p class="mono" style="font-size:.68rem;line-height:1.7">'+it.fund+'</p>'
        +'<div class="isrc"><button class="btn" data-loadsrc="'+k+'">consultar fontes do corpus</button></div>'
      +'</details>'
    +'</div>'
    +'<div class="exh-c">'+natalWheel(k)+'<div class="x-cap">'+p.nm+' em '+SIGNS[sg]+' · roda natal</div></div>'
    +'<div class="exh-r">'
      +meta('posição',zfmt(p.lon)+(p.retro?' retrógrado':''))
      +meta('casa',p.h+(p.hBack?(' <span class="soft">(fundo: '+p.hBack+' · regra dos 5°, peso '+Math.round((p.limW||1)*100)+'%)</span>'):''))
      +meta('casas regidas',ru.length?ru.map(h=>h+'ª — '+HOUSE_SHORT[h]).join('<br>'):'—')
      +meta('dignidade',p.dig)
      +meta('seita',NATAL.sect+(sectMal?' — maléfico contrário à seita':sectBen?' — benéfico da seita':''))
      +meta('aspectos',(NATAL_ASP[k]||[]).join('<br>')||'nenhum listado')
      +meta('recepções',rec.join('<br>')||'nenhuma')
      +meta('estrelas fixas',p.star&&p.star!=='—'?p.star:'nenhuma conjunção registrada')
      +meta('força',(STR[k]||4)+' / 8'+(lord===k?' — a maior do mapa':''))
    +'</div>'
  +'</div>';
  $('planetas-body').innerHTML=html;
}

/* ================= SALA CASAS ================= */
function renderCasas(){
  if(!NATAL){$('casas-body').innerHTML=emptyState();return;}
  const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  let html='<div class="hgrid">';
  for(let h=1;h<=12;h++){
    const c=NATAL.cusps[h-1], sgc=signOf(c), rul=NATAL.rulers[h], rp=NATAL.pts[rul];
    const occ=Object.entries(NATAL.pts).filter(([k,p])=>k!=='spirit'&&PT_NAME[k]&&(p.h===h||p.hBack===h))
      .map(([k,p])=>PT_NAME[k]+(p.hBack===h?' (ao fundo — manifesta na '+p.h+'ª)':p.hBack?(' (vindo da '+p.hBack+'ª)'):''));
    html+='<div class="hcard">'
      +'<div class="h-n"><span class="rn">'+ROM[h-1]+'</span>'+HOUSE_SHORT[h]+'</div>'
      +'<div class="h-meta">cúspide '+zfmt(c)+' · '+HOUSE_SIG[h].q+'</div>'
      +'<p><b style="color:var(--ivory)">Regente:</b> '+PT_NAME[rul]+(rp?(' — em '+SIGNS[signOf(rp.lon)]+', casa '+rp.h+' ('+rp.dig+')'):'')+'</p>'
      +'<p class="occ"><b style="color:var(--ivory)">Ocupantes:</b> '+(occ.join('; ')||'nenhum planeta')+'</p>'
      +'<p>'+HOUSE_SIG[h].s+'.</p>'
      +'<p style="color:var(--dim2);font-size:.74rem">'+OLAVO_CASA[h]+'.</p>'
    +'</div>';
  }
  $('casas-body').innerHTML=html+'</div>';
}

/* ================= TEMPO: corda vertical + razão + retrospectiva ================= */
let ZOOM='vida', ANIM=null;
const ZSPAN={vida:75*365.2425,decada:3652.5,ano:365.25,mes:30.44,dia:1};
function cordRange(){
  const span=ZSPAN[ZOOM]*DAY;
  if(ZOOM==='vida') return [BIRTH,BIRTH+span];
  const c=CURSOR.getTime();
  return [c-span/2,c+span/2];
}
/* LINHA DO TEMPO — quatro faixas horizontais contínuas (Firdária, Sub-firdária,
   Profecção, Revoluções). Sóbrio: só o segmento ativo é preenchido; transições
   por pequenos traços; nomes quando há espaço; cursor único fino com a data acima.
   Detalhes por clique (data-layer / data-goto / data-rs) e tooltip (<title>). */
/* ============================================================
   ÓRBITA CONCÊNTRICA — camadas do tempo que se movem juntas.
   Anel externo: Firdária (12 setores de período) · anel 2: Subfirdária ·
   anel 3: Profecção (12 casas) · núcleo: revolução SELECIONADA.
   Só o setor vigente é destacado. Clique abre o detalhe da camada.
   ============================================================ */
function drawCord(){
  const svg=$('cord'); if(!svg)return;
  const W=Math.max(240,svg.clientWidth||460), mob=W<420;
  const H=W;                                 // quadrado: o círculo ocupa a caixa e fica centrado
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  if(typeof NATAL==='undefined'||!NATAL){svg.innerHTML='';return;}
  const CX=W/2, CY=H/2, R=W/2-(mob?14:20);
  const TAU=Math.PI*2;
  const C_INK='#eaf0fa', C_DIM='#98a5bd', C_DIM2='#6b7793', C_LINE='rgba(255,255,255,0.139)', C_SOFT='rgba(255,255,255,0.031)';
  const AU='240,207,142';
  const S=tempoState(CURSOR); if(!S){svg.innerHTML='';return;}
  const P=(ang,r)=>[CX+r*Math.sin(ang), CY-r*Math.cos(ang)];
  const u=R/320;                                          // escala tipográfica única
  const fs=(v,min)=>Math.max(min==null?6.5:min,Math.round(v*u*10)/10);
  const arcSharp=(a0,a1,r0,r1)=>{
    const [x0,y0]=P(a0,r1),[x1,y1]=P(a1,r1),[x2,y2]=P(a1,r0),[x3,y3]=P(a0,r0);
    const big=(a1-a0)>Math.PI?1:0;
    return 'M'+x0+' '+y0+' A'+r1+' '+r1+' 0 '+big+' 1 '+x1+' '+y1
         +' L'+x2+' '+y2+' A'+r0+' '+r0+' 0 '+big+' 0 '+x3+' '+y3+' Z';
  };
  // setor anelar de cantos arredondados
  const arc=(a0,a1,r0,r1,cr)=>{
    const span=a1-a0;
    let rr=Math.min(cr==null?Math.max(5,10*u):cr,(r1-r0)/2.4,span*r0/2.6);
    if(!(rr>0.8))return arcSharp(a0,a1,r0,r1);
    const d1=rr/r1, d0=rr/r0;
    if(d1*2>=span*0.92||d0*2>=span*0.92)return arcSharp(a0,a1,r0,r1);
    const [x1,y1]=P(a0+d1,r1), [x2,y2]=P(a1-d1,r1), [x3,y3]=P(a1,r1-rr), [x4,y4]=P(a1,r0+rr),
          [x5,y5]=P(a1-d0,r0), [x6,y6]=P(a0+d0,r0), [x7,y7]=P(a0,r0+rr), [x8,y8]=P(a0,r1-rr);
    const bo=(span-2*d1)>Math.PI?1:0, bi=(span-2*d0)>Math.PI?1:0;
    return 'M'+x1+' '+y1
      +'A'+r1+' '+r1+' 0 '+bo+' 1 '+x2+' '+y2
      +'A'+rr+' '+rr+' 0 0 1 '+x3+' '+y3
      +'L'+x4+' '+y4
      +'A'+rr+' '+rr+' 0 0 1 '+x5+' '+y5
      +'A'+r0+' '+r0+' 0 '+bi+' 0 '+x6+' '+y6
      +'A'+rr+' '+rr+' 0 0 1 '+x7+' '+y7
      +'L'+x8+' '+y8
      +'A'+rr+' '+rr+' 0 0 1 '+x1+' '+y1+'Z';
  };
  let s='<defs>'
    +'<radialGradient id="corefill"><stop offset="0%" stop-color="#0c1120"/><stop offset="100%" stop-color="#06090f"/></radialGradient></defs>';
  // anéis finos, com folga generosa entre camadas
  const w1=R*0.118, gap=R*0.068;
  const rF=[R, R-w1], rS=[R-w1-gap, R-2*w1-gap], rP=[R-2*w1-2*gap, R-3*w1-2*gap];
  const rCore=rP[1]-gap;
  // trilhos discretos
  [rF,rS,rP].forEach(rr=>{
    s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rr[0]+'" fill="none" stroke="'+C_LINE+'"/>';
    s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rr[1]+'" fill="none" stroke="'+C_LINE+'"/>';
  });
  // rótulo da camada: pequeno, na periferia da faixa, sobre recorte do fundo
  const label=(txt,r)=>{
    const [x,y]=P(0,r), f=fs(8,6.5), ls=Math.max(1.4,1.9*u), w=txt.length*(f*0.62+ls)+f*1.5, h=f+5*u+3;
    return '<rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="#04060d"/>'
      +'<text x="'+(x+ls/2)+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" '
      +'font-family="IBM Plex Mono" letter-spacing="'+ls+'" fill="'+C_DIM2+'">'+txt+'</text>';
  };
  // sem brilho: o ouro marca o estado ativo apenas pelo preenchimento e pelo traço
  const setor=(a0,a1,rr,ativo,attrs)=>
    '<path '+(attrs||'')+' d="'+arc(a0,a1,rr[1],rr[0])+'" fill="'+(ativo?'rgba('+AU+',.11)':C_SOFT)+'" '
    +'stroke="'+(ativo?'rgba('+AU+',.7)':C_LINE)+'" stroke-width="'+(ativo?1.2:1)+'" stroke-linejoin="round" '
    +'style="cursor:pointer"/>';
  const meioTexto=(a,r,txt,ativo,f)=>{
    const [x,y]=P(a,r), ff=f||fs(12);
    return '<text x="'+x+'" y="'+(y+ff*0.34)+'" text-anchor="middle" font-size="'+ff+'" font-family="Inter" '
      +'fill="'+(ativo?C_INK:C_DIM)+'" style="pointer-events:none">'+txt+'</text>';
  };
  const estW=(t,f)=>{let n=0;for(const ch of t){const c=ch.codePointAt(0);if(c===0xFE0E)continue;
    n+=(c>=0x2200&&c<=0x27bf)?f*.86:(ch===' ')?f*.32:f*.55;}return n;};

  /* ---------- anel 1 · FIRDÁRIA (proporcional aos anos de cada período) ---------- */
  const TOT=FIRD.reduce((a,f)=>a+f[2],0);
  let acc=0;
  FIRD.forEach(([k,nm,len])=>{
    const a0=acc/TOT*TAU, a1=(acc+len)/TOT*TAU, mid=(a0+a1)/2;
    const ativo=(S.age>=acc&&S.age<acc+len);
    s+=setor(a0,a1,rF,ativo,'data-layer="firdaria" data-goto="'+(acc+len/2)+'"');
    // nome completo só no setor ativo; nos demais, apenas o glifo
    const arcLen=(a1-a0)*((rF[0]+rF[1])/2), g=PT_GLYPH[k]||'';
    const nome=(PT_NAME[k]||nm), fA=fs(11.5,8.5), fI=fs(11,8);
    const txt=ativo?((estW(g+' '+nome,fA)+8<arcLen)?(g+' '+nome):nome):g;
    s+=meioTexto(mid,(rF[0]+rF[1])/2,txt,ativo,ativo?fA:fI);
    acc+=len;
  });
  s+=label('FIRDÁRIA',rF[0]+Math.max(7,10*u));

  /* ---------- anel 2 · SUBFIRDÁRIA (7 fases do período vigente) ---------- */
  const fNow=firdAt(S.age), base=fNow.from||0, len=fNow.len||1, part=len/7;
  const subs=FIRD.slice(0,7).map(f=>f[0]);
  let si=subs.indexOf(fNow.majorKey); if(si<0)si=0;
  for(let i=0;i<7;i++){
    const a0=i/7*TAU, a1=(i+1)/7*TAU, mid=(a0+a1)/2;
    const sk=subs[(si+i)%7];
    const ativo=(S.age>=base+i*part&&S.age<base+(i+1)*part);
    s+=setor(a0,a1,rS,ativo,'data-layer="sub" data-goto="'+(base+i*part+part/2)+'"');
    const arcLen=(a1-a0)*((rS[0]+rS[1])/2), g=PT_GLYPH[sk]||'', nome=PT_NAME[sk]||'', fA=fs(11,8), fI=fs(10.5,7.5);
    const txt=ativo?((estW(g+' '+nome,fA)+8<arcLen)?(g+' '+nome):nome):g;
    s+=meioTexto(mid,(rS[0]+rS[1])/2,txt,ativo,ativo?fA:fI);
  }
  s+=label('SUBFIRDÁRIA',(rF[1]+rS[0])/2);

  /* ---------- anel 3 · PROFECÇÃO (12 casas do ciclo anual) ---------- */
  const anoBase=Math.floor(S.age)-((Math.floor(S.age))%12);
  for(let i=0;i<12;i++){
    const a0=i/12*TAU, a1=(i+1)/12*TAU, mid=(a0+a1)/2;
    const casa=i+1, ativo=(S.profHouse===casa);
    s+=setor(a0,a1,rP,ativo,'data-layer="profeccao" data-goto="'+(anoBase+i+0.5)+'"');
    // a profecção mostra apenas as casas de 1 a 12
    s+=meioTexto(mid,(rP[0]+rP[1])/2,''+casa,ativo,ativo?fs(11.5,8.5):fs(10,7.5));
  }
  s+=label('PROFECÇÃO',(rS[1]+rP[0])/2);

  /* ---------- núcleo · idade · retorno · casa profectada · Senhor do Ano ---------- */
  const REV=S.rev;
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rCore+'" fill="url(#corefill)" stroke="rgba(255,255,255,0.124)" '
    +'data-layer="revolucao" style="cursor:pointer"/>';
  const idade=Math.floor(S.age), frac=(S.age-idade);
  const fAge=fs(30,17), fKick=fs(7,6), fM=fs(8.5,6.8);
  const CY0=CY-fM*1.8;                       // bloco do núcleo centrado verticalmente
  s+='<text x="'+(CX+1.1)+'" y="'+(CY0-fAge*0.92)+'" text-anchor="middle" font-size="'+fKick+'" font-family="IBM Plex Mono" letter-spacing="'+Math.max(1.2,2*u)+'" fill="'+C_DIM2+'" style="pointer-events:none">ANO DE VIDA</text>';
  s+='<text x="'+CX+'" y="'+(CY0-fAge*0.04)+'" text-anchor="middle" font-size="'+fAge+'" font-family="Cormorant Garamond" fill="'+C_INK+'" style="pointer-events:none">'
    +idade+','+Math.floor(frac*10)+'</text>';
  const yDiv=CY0+fAge*0.30, wDiv=rCore*0.62;
  s+='<line x1="'+(CX-wDiv/2)+'" y1="'+yDiv+'" x2="'+(CX+wDiv/2)+'" y2="'+yDiv+'" stroke="rgba(255,255,255,0.155)"/>';
  const mono=(y,txt,col)=>'<text x="'+CX+'" y="'+y+'" text-anchor="middle" font-size="'+fM+'" font-family="IBM Plex Mono" '
    +'letter-spacing="'+Math.max(.5,.9*u)+'" fill="'+col+'" style="pointer-events:none">'+txt+'</text>';
  s+=mono(yDiv+fM*1.7,(REV?(REV.sigla+' '+REV.start.getUTCFullYear()):'SEM RETORNO'),C_DIM);
  s+=mono(yDiv+fM*3.1,'CASA '+S.profHouse,'rgba('+AU+',.85)');
  s+=mono(yDiv+fM*4.5,(PT_GLYPH[S.lord]||'')+'︎ '+(PT_NAME[S.lord]||'—').toUpperCase(),C_DIM2);
  // marcador do instante, discreto
  const angNow=((S.age%12)/12)*TAU;
  const [mx0,my0]=P(angNow,rCore+2), [mx1,my1]=P(angNow,R+Math.max(3,5*u));
  s+='<line x1="'+mx0+'" y1="'+my0+'" x2="'+mx1+'" y2="'+my1+'" stroke="rgba('+AU+',.3)" stroke-width="1" stroke-dasharray="2 4" stroke-linecap="round"/>';
  s+='<circle cx="'+mx1+'" cy="'+my1+'" r="'+Math.max(1.6,2.2*u)+'" fill="rgba('+AU+',.7)"/>';
  svg.innerHTML=s;
}
/* mandala temporal única: anéis de progresso firdária · sub · profecção,
   centro com Senhor do Ano + casa profectada + Asc da Revolução. Minimalista. */
function mandalaTempo(d){
  const age=ageAt(d), f=firdAt(age), p=profAt(age), y=rsYearOf(d), rs=RS_DATA[y];
  const C=150, TAU=2*Math.PI;
  const ring=(r,sw,frac,col,track)=>{
    const circ=TAU*r, off=circ*(1-Math.max(0,Math.min(1,frac)));
    let g='<circle cx="'+C+'" cy="'+C+'" r="'+r+'" fill="none" stroke="'+track+'" stroke-width="'+sw+'"/>';
    g+='<circle cx="'+C+'" cy="'+C+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round" '
      +'stroke-dasharray="'+circ+'" stroke-dashoffset="'+off+'" transform="rotate(-90 '+C+' '+C+')" filter="url(#mglow)"/>';
    return g;
  };
  // frações de progresso
  const fFrac=(f.from!=null&&f.len)?((age-f.from)/f.len):0;
  const sFrac=(f.subStart&&f.subEnd)?((d.getTime()-f.subStart)/(f.subEnd-f.subStart)):0;
  const yFrac=age-Math.floor(age);
  const T='rgba(255,255,255,0.124)';
  let s='<svg viewBox="0 0 300 300" class="tmandala"><defs>'
    +'<filter id="mglow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#9fd6e6" flood-opacity=".5"/></filter></defs>';
  s+=ring(132,15,fFrac,'#cfd6dd',T);
  s+=ring(108,13,sFrac,'#9fd6e6',T);
  s+=ring(86,11,yFrac,'#c9b78a',T);
  // rótulos dos anéis (glifos)
  const gl=(r,txt,col)=>'<text x="'+C+'" y="'+(C-r+5)+'" text-anchor="middle" font-size="13" font-family="Cormorant Garamond" fill="'+col+'">'+txt+'</text>';
  s+=gl(132,PT_GLYPH[f.majorKey]||'','#cfd6dd');
  s+=gl(108,PT_GLYPH[f.subKey]||'','#9fd6e6');
  s+=gl(86,''+p.houseN,'#c9b78a');
  // centro: Senhor do Ano + casa + RS
  s+='<text x="'+C+'" y="'+(C-16)+'" text-anchor="middle" font-size="34" font-family="Cormorant Garamond" fill="#fff">'+PT_GLYPH[p.lordKey]+'</text>';
  s+='<text x="'+C+'" y="'+(C+6)+'" text-anchor="middle" font-size="10" font-family="IBM Plex Mono" letter-spacing="1" fill="var(--dim)">SENHOR DO ANO</text>';
  s+='<text x="'+C+'" y="'+(C+24)+'" text-anchor="middle" font-size="11" font-family="Inter" fill="#fff">Casa '+p.houseN+' · '+p.sign+'</text>';
  if(rs&&rs.raw&&rs.raw.asc!=null){const sg=signOf(rs.raw.asc);
    s+='<text x="'+C+'" y="'+(C+40)+'" text-anchor="middle" font-size="10" font-family="IBM Plex Mono" fill="var(--neon)">RS: Asc '+SIGNS[sg]+'</text>';}
  s+='</svg>';
  return s;
}
function hierarquiaHTML(){
  return '<table class="hier"><tr><th></th><th></th><th></th></tr>'+
    HIERARQUIA.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</table>';
}
/* ---- cartões executivos do momento (Firdária, Sub, Profecção, Revolução) ---- */
/* ---- cards do "caminho ativo" (coluna esquerda) ---- */
const LAYER_IC={firdaria:'☿',sub:'☉',profeccao:'♃',revolucao:'⌂'};
/* ---- coluna direita: retorno, casas ativadas, planetas ativos, síntese ---- */
function revCardHTML(d){
  const S=tempoState(d); if(!S)return '';
  const R=S.rev;
  if(!R)return '<div class="card"><div class="kicker">retorno selecionado</div>'
    +'<p>Não foi possível calcular a revolução. Importe o mapa pelo link do Aspectarian.</p></div>';
  const row=(k,v)=>'<div class="rv-r"><span class="rv-k">'+k+'</span><span class="rv-v">'+v+'</span></div>';
  // casas ativadas: a do retorno (primária) e a profectada (secundária)
  const casa=(n,tag,lbl,txt)=>'<div class="tpca"><div class="tpca-h"><b>Casa '+n+'</b><span class="tpca-b '+tag+'">'+tag+'</span></div>'
    +'<em>'+lbl+'</em><p>'+txt+'</p></div>';
  // planetas ativos: senhores do tempo
  const pls=[[S.mk,'Firdária ativa'],[S.sk,'Subfirdária ativa'],[S.lord,'Senhor do Ano'],[R.ascRuler,'Regente do retorno']]
    .filter(x=>x[0]&&PT_NAME[x[0]]);
  const seen={}; const plU=pls.filter(x=>{if(seen[x[0]])return false;seen[x[0]]=1;return true;}).slice(0,3);
  return '<div class="card tpr"><div class="tpr-h"><span class="kicker" style="margin:0">☀ Revolução '+R.label+'</span>'
      +'<a href="#" class="tpr-a" data-tpdet>Ver detalhes</a></div>'
     +'<p class="tpr-p"><b>Vigência:</b> '+fdate(R.start)+(R.end?(' — '+fdate(R.end)):'')+'</p>'
     +row('Casa ativada','Casa '+R.ascNatalHouse+' na revolução')
     +row('Senhor da casa',PT_NAME[NATAL.rulers[R.ascNatalHouse]]||'—')
     +row('Ascendente',R.ascSignNm+' · regente '+PT_NAME[R.ascRuler])
     +row('Ênfase do período',cap1(casaTag(R.ascNatalHouse)))
     +row('Foco prático',cap1(R.K.foco))
    +'</div>'
    +'<div class="card tpr"><div class="kicker">casas ativadas</div><div class="tpcas">'
      +casa(R.ascNatalHouse,'primária','Ascendente da revolução',cap1(HOUSE_THEME[R.ascNatalHouse])+'.')
      +casa(S.profHouse,'secundária','Profecção do ano',cap1(HOUSE_THEME[S.profHouse])+'.')
    +'</div></div>'
    +'<div class="card tpr"><div class="kicker">planetas ativos</div><div class="tppls">'
      +plU.map(([k,papel])=>'<div class="tppl"><span class="tppl-g">'+(PT_GLYPH[k]||'')+'︎</span>'
        +'<div><b>'+PT_NAME[k]+'</b><em>'+papel+'</em></div>'
        +'<span class="tppl-kw">'+casasTag(ruledHouses(k)).split(/[;,]/).slice(0,2).join(' · ')+'</span></div>').join('')
    +'</div></div>'
    +'<div class="card tpr tpsyn"><div class="kicker">síntese do momento</div>'
      +'<div class="tpsyn-b"><span class="tpsyn-i">✦</span><p>'+synthLiteral(d).replace(/<\/?span>/g,' ')+'</p></div></div>';
}
/* ---- faixa: camadas do tempo ativas, com progresso ---- */
function tempoLayersHTML(d){
  const S=tempoState(d); if(!S)return '';
  const t=d.getTime(), f=S.f;
  const prog=(ini,fim)=>{const a=+ini,b=+fim; return (!isFinite(a)||!isFinite(b)||b<=a)?0:Math.max(0,Math.min(100,Math.round((t-a)/(b-a)*100)));};
  const fIni=BIRTH+(f.from||0)*365.2425*DAY, fFim=fIni+(f.len||1)*365.2425*DAY;
  const anoIni=BIRTH+Math.floor(S.age)*365.2425*DAY, anoFim=anoIni+365.2425*DAY;
  const R=S.rev;
  const it=(ic,k,nome,per,p)=>'<div class="tpl-i"><span class="tpl-g">'+ic+'</span>'
    +'<div class="tpl-b"><span class="tpl-k">'+k+'</span><b>'+nome+'</b><em>'+per+'</em>'
    +'<div class="tpl-bar"><i style="width:'+p+'%"></i></div></div><span class="tpl-p">'+p+'%</span></div>';
  const arr=[];
  arr.push(it((PT_GLYPH[S.mk]||'✦')+'︎','Firdária',PT_NAME[S.mk]||f.major,
    fdate(new Date(fIni))+' — '+fdate(new Date(fFim)),prog(fIni,fFim)));
  arr.push(it((PT_GLYPH[S.sk||S.mk]||'✦')+'︎','Subfirdária',PT_NAME[S.sk]||PT_NAME[S.mk]||'—',
    f.subStart?(fdate(new Date(f.subStart))+' — '+fdate(new Date(f.subEnd))):'—',
    f.subStart?prog(f.subStart,f.subEnd):0));
  arr.push(it((PT_GLYPH[S.lord]||'✦')+'︎','Profecção','Casa '+S.profHouse+' · '+PT_NAME[S.lord],
    fdate(new Date(anoIni))+' — '+fdate(new Date(anoFim)),prog(anoIni,anoFim)));
  arr.push(it('⌂','Revolução',R?('Casa '+R.ascNatalHouse):'—',
    R?(fdate(R.start)+(R.end?(' — '+fdate(R.end)):'')):'—', R&&R.end?prog(R.start,R.end):0));
  return '<div class="tpl-k0">Camadas do tempo ativas</div><div class="tpl-row">'+arr.join('<span class="tpl-s">→</span>')+'</div>';
}
/* ---- promessas: cartão enxuto (título · administrador · casas · condição · estado) ---- */
function tempoPromsHTML(d){
  if(typeof PROMESSAS==='undefined'||!PROMESSAS.length)return '';
  const S=tempoState(d);
  const scored=PROMESSAS.map(pr=>({pr,st:promiseState(pr,d,S)})).sort((a,b)=>b.st.score-a.st.score);
  const rows=scored.slice(0,6).map(({pr,st})=>{
    const cls={ativada:'alta','disponível':'moderada',latente:'latente'}[st.estado]||'latente';
    const q=qualidade(pr.pl);
    return '<details class="tpprom"><summary>'
      +'<span class="pp-t">'+pr.t+'</span>'
      +'<span class="pp-meta">'+(PT_GLYPH[pr.pl]||'')+' '+PT_NAME[pr.pl]
        +' · casas '+(pr.casas||[]).map(h=>h+'ª').join(', ')
        +' · '+q.txt+'</span>'
      +'<span class="pp-lv '+cls+'">'+st.estado+'</span></summary>'
      +'<div class="pp-b">'
      +'<b>Administra:</b> '+casasTag(pr.ruled||[])+' · <b>executa por:</b> '+casaTag(pr.occ)+'.'
      +(st.itens.length?('<br><b>Convergência agora:</b> '+st.itens.map(x=>x[1]).join('; ')+'.'):'')
      +(typeof fundamentoHTML==='function'?fundamentoHTML(['promessa','convergencia','testemunho'],
          [pr.fat, 'Ativação: '+pr.tec]):'')
      +'</div></details>';}).join('');
  return '<h3 class="tp-h">Promessas do mapa</h3><div class="tpproms">'+rows
    +'</div><p class="note" style="margin-top:2px">A ordenação mede repetição entre técnicas — não é probabilidade de evento.</p>';
}
/* ---- painel de detalhes (ao clicar num cartão/setor) ---- */
let TP_LAYER=null;
document.addEventListener('click',e=>{
  const close=e.target.closest&&e.target.closest('[data-tpclose]');
  if(close){TP_LAYER=null;if(typeof syncTempo==='function')syncTempo();return;}
  const rv=e.target.closest&&e.target.closest('[data-rev]');
  if(rv){revSetKind(rv.dataset.rev);syncTempo();return;}
  const card=e.target.closest&&e.target.closest('#tempo-exec [data-layer]');
  if(card){TP_LAYER=(TP_LAYER===card.dataset.layer)?null:card.dataset.layer;syncTempo();
    const det=document.getElementById('tempo-detail');if(det&&TP_LAYER)det.scrollIntoView({behavior:'smooth',block:'nearest'});}
});
function tempoDetailHTML(layer,d){
  const S=tempoState(d); if(!S)return '';
  const mk=S.mk, sk=S.sk, p=S.p, R=S.rev;
  const sec=(k,v)=>'<div class="td-sec"><span class="td-k">'+k+'</span><span class="td-v">'+v+'</span></div>';
  // as três distinções, sempre separadas
  const tri=k=>{const q=qualidade(k), pp=NATAL.pts[k];
    return sec('Assuntos que administra',ruledHouses(k).map(h=>h+'ª — '+HOUSE_THEME[h]).join('<br>')||'—')
      +sec('Campo natal onde executa',pp?(pp.h+'ª — '+HOUSE_THEME[pp.h]+(pp.hBack?(' · fundo na '+pp.hBack+'ª (regra dos 5°)'):'')):'—')
      +sec('Qualidade da entrega',q.txt+' · '+({boa:'tende a entregar',condicional:'entrega conforme os apoios',travada:'exige mais esforço e tempo'}[q.nivel]||'—'));};
  let head,sub,body,tags;
  if(layer==='firdaria'&&PT_NAME[mk]){
    head=PT_NAME[mk]+' — Firdária maior'; sub='agenda ampla do ciclo'; tags=['firdaria','senhor-do-tempo'];
    body=sec('Assunto dominante',cap1(casasTag(S.rulesMk))+' — tende a permanecer em primeiro plano durante o período.')+tri(mk);
  } else if(layer==='sub'){
    if(!sk){head=(PT_NAME[mk]||S.f.major)+' — Subfirdária';sub='a fase repete o regente do ciclo';tags=['firdaria','sub'];
      body=sec('Fase','O mesmo assunto, em estado concentrado.');}
    else{head=PT_NAME[sk]+' — Subfirdária';sub='fase e assuntos secundários';tags=['firdaria','sub','aspecto'];
      const rel=relBetween(mk,sk);
      body=sec('Assunto secundário',cap1(casasTag(S.rulesSk))+' — entra em segundo plano, de modo mais imediato.')
        +sec('Relação com o regente do ciclo',rel.txt+'.')+tri(sk);}
  } else if(layer==='profeccao'){
    head='Casa '+p.houseN+' — Profecção do ano'; sub='matéria prioritária · Senhor '+PT_NAME[p.lordKey]; tags=['profeccao','senhor-do-ano'];
    body=sec('Matéria do ano',cap1(casaTag(p.houseN))+' ('+ordinal(p.houseN)+' em '+(p.sign||'')+') — '+HOUSE_THEME[p.houseN]+'.')
      +sec('Administrador do ano',PT_NAME[p.lordKey]+' rege o signo profectado e conduz esses assuntos.')
      +tri(p.lordKey);
  } else if(layer==='revolucao'){
    if(!R)return '<div class="tdcard"><button class="td-close" data-tpclose>✕</button><div class="td-h">Revolução</div>'
      +'<div class="td-sub">indisponível</div><div class="td-sec"><span class="td-v">Importe o mapa pelo link para calcular as revoluções.</span></div></div>';
    head='Revolução '+R.label; sub='ambiente atual de manifestação'; tags=['revolucao','ascendente','dois-tempos'];
    body=sec('Validade',fdate(R.start)+(R.end?(' → '+fdate(R.end)):''))
      +sec('Ambiente',cap1(casaTag(R.ascNatalHouse))+' — o Ascendente da revolução cai na '+ordinal(R.ascNatalHouse)+' natal.')
      +sec('Regente do Ascendente',PT_NAME[R.ascRuler]+(R.ascRulerRevHouse?(' · casa '+R.ascRulerRevHouse+' da revolução'):''))
      +sec('Foco do retorno',cap1(R.K.foco)+'.')
      +sec('Aspectos natais repetidos',R.repeats.slice(0,3).map(r=>PT_NAME[r.a]+' '+r.gl+' '+PT_NAME[r.b]).join(' · ')||'nenhum');
  } else return '';
  // promessas ligadas à camada
  const relK=layer==='profeccao'?p.lordKey:layer==='sub'?sk:layer==='revolucao'?(R&&R.ascRuler):mk;
  const proms=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]).filter(pr=>relK&&pr.pl===relK).slice(0,3);
  if(proms.length)body+=sec('Promessas natais relacionadas',
    proms.map(pr=>pr.t+' — '+promiseState(pr,d,S).estado).join('<br>'));
  if(typeof fundamentoHTML==='function')body+=fundamentoHTML(tags);
  return '<div class="tdcard"><button class="td-close" data-tpclose>✕</button><div class="td-h">'+head+'</div><div class="td-sub">'+sub+'</div>'+body+'</div>';
}
/* ranking de planetas acionados (%) — pelo motor de convergência */
function planetRanking(d,S){
  S=S||tempoState(d); if(!S)return [];
  const rows=Object.keys(PT_NAME).map(k=>({k,sc:testemunhos(k,null,d,S).score}));
  const max=Math.max(1,...rows.map(r=>r.sc));
  return rows.map(r=>({k:r.k,p:Math.round(r.sc/max*100)})).sort((a,b)=>b.p-a.p);
}
/* painel horizontal sob o círculo */
/* síntese de IA — hierárquica e literal, gerada pelo motor local */
function tlIaHTML(d){
  const S=tempoState(d); if(!S)return '';
  const R=S.rev, F=[];
  F.push(['1 · Agenda do ciclo (firdária)',
    PT_NAME[S.mk]?('Período de '+PT_NAME[S.mk]+': '+cap1(casasTag(S.rulesMk))+' em primeiro plano'
      +(S.occMk?(', executado por '+casaTag(S.occMk)):'')+'. '+cap1(condDelivery(S.mk))+'.')
      :'Passagem de nodo: capítulo curto, sem casa administrada.']);
  if(S.sk)F.push(['2 · Fase (subfirdária)',
    'A fase de '+PT_NAME[S.sk]+' introduz '+casasTag(S.rulesSk)+' como assunto imediato. '
    +relBetween(S.mk,S.sk).txt+'.']);
  F.push(['3 · Matéria do ano (profecção)',
    'O ano ativa a '+ordinal(S.profHouse)+' — '+casaTag(S.profHouse)+' — administrada por '
    +PT_NAME[S.lord]+(S.occLord?(', que atua por '+casaTag(S.occLord)):'')+'. '
    +crossFirdProf(S.mk,S.sk,S.p)]);
  if(R)F.push(['4 · Ambiente (Revolução '+R.label+')',
    'O Ascendente do retorno em '+R.ascSignNm+' cai na '+ordinal(R.ascNatalHouse)
    +' natal: o período tende a se manifestar por '+casaTag(R.ascNatalHouse)
    +', sob administração de '+PT_NAME[R.ascRuler]+'.'
    +(R.repeats&&R.repeats.length?(' O retorno repete o aspecto natal '+PT_NAME[R.repeats[0].a]+' '+R.repeats[0].gl+' '+PT_NAME[R.repeats[0].b]+': essa promessa tende a ficar mais visível.'):'')]);
  const ativas=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]).map(pr=>({pr,st:promiseState(pr,d,S)}))
    .filter(x=>x.st.estado==='ativada').slice(0,2);
  if(ativas.length)F.push(['5 · Promessas em convergência',
    ativas.map(x=>x.pr.t).join('; ')+'. A repetição entre técnicas as coloca em primeiro plano — não é probabilidade de evento.']);
  return '<div class="ia-out">'+F.map(([k,v])=>'<div class="ia-sec"><span>'+k+'</span><p>'+v+'</p></div>').join('')
    +'<p class="note">Síntese gerada pelo motor interpretativo local, em ordem hierárquica (firdária → fase → profecção → revolução → promessas).</p></div>';
}
function renderCompare(){
  if(!PINNED){$('tempo-compare').innerHTML='';return;}
  const A=PINNED,B=CURSOR;
  const fa=firdAt(ageAt(A)),fb=firdAt(ageAt(B)),pa=profAt(ageAt(A)),pb=profAt(ageAt(B));
  const sa=scoredHits(A,0).slice(0,5),sb=scoredHits(B,0).slice(0,5);
  const plScore=hits=>{const m={};hits.forEach(h=>m[h.tKey]=(m[h.tKey]||0)+h.rel.score);return m;};
  const ma=plScore(sa),mb=plScore(sb);
  const ups=[],downs=[];
  Object.keys(PT_NAME).forEach(k=>{const d=(mb[k]||0)-(ma[k]||0);if(d>=2)ups.push(PT_NAME[k]+' (+'+d+')');if(d<=-2)downs.push(PT_NAME[k]+' ('+d+')');});
  $('tempo-compare').innerHTML='<div class="card"><div class="kicker">comparador · A '+fdate(A)+' ⇄ B '+fdate(B)+'</div>'
    +'<table><tr><th></th><th>A</th><th>B</th></tr>'
    +'<tr><td>firdária</td><td>'+fa.major+'/'+fa.sub+'</td><td>'+fb.major+'/'+fb.sub+'</td></tr>'
    +'<tr><td>profecção</td><td>casa '+pa.houseN+' · '+pa.sign+'</td><td>casa '+pb.houseN+' · '+pb.sign+'</td></tr>'
    +'<tr><td>Senhor do Ano</td><td>'+PT_NAME[pa.lordKey]+'</td><td>'+PT_NAME[pb.lordKey]+'</td></tr>'
    +'<tr><td>convergência</td><td>'+convergence(A).label+'</td><td>'+convergence(B).label+'</td></tr></table>'
    +'<p style="font-size:.8rem"><b style="color:var(--green)">Aumentaram:</b> '+(ups.join(', ')||'—')
    +' · <b style="color:var(--red)">Diminuíram:</b> '+(downs.join(', ')||'—')+'</p>'
    +'<p style="font-size:.78rem">Mudança de clima: '+(fa.major!==fb.major?('troca de era ('+fa.major+' → '+fb.major+'). '):'mesma era. ')
    +(pa.lordKey!==pb.lordKey?('Senhor do Ano muda de '+PT_NAME[pa.lordKey]+' para '+PT_NAME[pb.lordKey]+'.'):'mesmo Senhor do Ano.')+'</p></div>';
}
/* razão anual (preservado, + destaque de promessa) */
function buildYearReport(a){
  const p=profAt(a), f=firdAt(a+0.05), y=new Date(BIRTH).getUTCFullYear()+a, rs=RS_DATA[y];
  const H=p.houseN, lord=NATAL.pts[p.lordKey];
  const sub=f.subKey&&NATAL.pts[f.subKey]?f.subKey:null;
  const at=new Date(Date.UTC(y,new Date(BIRTH).getUTCMonth(),new Date(BIRTH).getUTCDate()+30));
  // 1) resumo executivo literal primeiro
  let s='<div class="rep">'+execCardHTML(a,false);
  // 2) bloco expansível — como chegamos a essa conclusão
  const fb=firdariaText(f.majorKey), sb=subText(f.majorKey,sub), pb=profBlocks(p);
  s+='<details class="rep-det"><summary>Como chegamos a essa conclusão</summary>'
    +'<div class="rep-sec"><span class="rep-k">Firdária maior — agenda do ciclo</span>'+fb.agenda+'<br>'+fb.canal+'<br>'+fb.cond+'</div>'
    +(sb?('<div class="rep-sec"><span class="rep-k">Sub-firdária — fase atual</span>'+sb.entra+'<br>'+sb.funcao+'<br>'+sb.relacao+'</div>')
        :'<div class="rep-sec"><span class="rep-k">Sub-firdária</span>A fase repete o regente do ciclo: o tema maior em estado concentrado.</div>')
    +'<div class="rep-sec"><span class="rep-k">Profecção — demanda do ano</span>'+pb.materia+'<br>'+pb.admin+'<br>'+pb.traz+'<br>'+pb.local+'</div>'
    +'<div class="rep-sec"><span class="rep-k">Cruzamento firdária × profecção</span>'+crossFirdProf(f.majorKey,sub,p)+'</div>'
    +(rs?('<div class="rep-sec"><span class="rep-k">Revolução Solar '+y+' — cenário anual</span>'+rs.asc+'<br>'+rs.destaque+'</div>'):'')
    +'</details>';
  // 3) promessas relacionadas
  const proms=PROMESSAS.filter(pr=>pr.casas.includes(H)||pr.pl===p.lordKey||pr.pl===f.majorKey);
  if(proms.length)s+='<details class="rep-det"><summary>Potenciais natais atualmente ativados</summary>'
    +proms.map(pr=>{const act=scoreProm(pr,at);return '<div class="rep-sec"><span class="rep-k">'+pr.t+' · '+act.tier+' ('+act.score+')</span>'+pr.fat+(act.factors.length?('<br><span class="mono" style="color:var(--dim2)">'+act.factors.map(x=>'+'+x[0]+' '+x[1]).join('; ')+'</span>'):'')+'</div>';}).join('')
    +'</details>';
  // 4) condição técnica dos planetas
  s+='<details class="rep-det"><summary>Condição técnica dos planetas</summary>'
    +'<div class="rep-sec"><span class="rep-k">Senhor do Ano — '+PT_NAME[p.lordKey]+'</span>'+lord.dig+', casa '+lord.h+'; aspectos: '+((NATAL_ASP[p.lordKey]||[]).join(' · ')||'—')+(lord.star&&lord.star!=='—'?('; estrela: '+lord.star):'')+'</div>'
    +(sub?('<div class="rep-sec"><span class="rep-k">Sub-regente — '+PT_NAME[sub]+'</span>'+NATAL.pts[sub].dig+', casa '+NATAL.pts[sub].h+'</div>'):'')
    +'</details>';
  // 5) síntese simbólica (camada opcional, não na primeira leitura)
  s+='<details class="rep-det"><summary>Síntese simbólica</summary><div class="rep-sec">'+(CONSELHO[p.lordKey]||'')+'</div></details>';
  s+='</div>';
  return s;
}
function renderLedger(){
  if(!NATAL){return;}
  const nowAge=ageAt(new Date());
  let html='',ageStart=0;
  const promYears=[];
  FIRD.forEach(([k,nm,len])=>{
    const a0=ageStart,a1=ageStart+len;ageStart=a1;
    const isNow=nowAge>=a0&&nowAge<a1;
    let cards='';
    for(let a=Math.floor(a0);a<a1;a++){
      const by0=new Date(BIRTH).getUTCFullYear();const y1=by0+a,p=profAt(a),f=firdAt(a+0.05),rs=RS_DATA[y1];
      cards+='<div class="yr'+(Math.floor(nowAge)===a?' now':'')+(rs?' hasrs':'')+(promYears.includes(y1)?' promo':'')+'" data-age="'+a+'">'
        +'<div class="top"><span class="age">'+a+' anos</span><span class="span">ago '+y1+' → ago '+(y1+1)+' <span class="chev">▾</span></span></div>'
        +'<div class="row"><b>Casa '+p.houseN+' · '+p.sign+'</b> · Senhor: <b>'+PT_NAME[p.lordKey]+'</b> · '+f.major+'/'+f.sub+'</div>'
        +'<div class="row">'+synthYear(a,p,f)+'</div>'
        +'<div class="full" data-open="0"></div></div>';
    }
    const y0=new Date(BIRTH).getUTCFullYear()+Math.round(a0), y1e=new Date(BIRTH).getUTCFullYear()+Math.round(a1);
    html+='<div class="tnode'+(isNow?' now':'')+'">'
      +'<div class="tmed" style="--era-c:'+(FIRD_COLORS[nm]||'var(--gold)')+'">'+(PT_GLYPH[k]||nm[0])+'</div>'
      +'<div class="tcard">'
        +'<div class="t-title">Era de '+nm+'</div>'
        +'<span class="t-years">'+y0+' – '+y1e+' · '+len+' anos</span>'
        +(isNow?'<span class="tag gold" style="margin-left:6px">vigente</span>':'')
        +'<p class="t-intro">'+(ERA_TXT[nm]||'')+'</p>'
        +'<details><summary>ver os '+len+' anos ▾</summary><div class="yrgrid">'+cards+'</div></details>'
      +'</div></div>';
  });
  const led=$('fird-ledger'); led.innerHTML='<div class="tline">'+html+'</div>';
  led.onclick=e=>{
    const yr=e.target.closest('.yr'); if(!yr)return;
    const full=yr.querySelector('.full'); const open=full.dataset.open==='1';
    if(!open&&!full.innerHTML) full.innerHTML=buildYearReport(+yr.dataset.age);
    full.dataset.open=open?'0':'1'; yr.classList.toggle('open',!open);
  };
}
/* retrospectiva */
function renderRetro(dateStr,evtTxt){
  const d=dateStr?new Date(dateStr+'T12:00:00Z'):CURSOR;
  const a=Math.floor(ageAt(d)); if(a<0){$('retro-body').innerHTML='<div class="card">data anterior ao nascimento.</div>';return;}
  const top=scoredHits(d,0).slice(0,4);
  const key=d.toISOString().slice(0,10);
  const proms=PROMESSAS.filter(pr=>pr.casas.includes(profAt(a).houseN)||pr.pl===profAt(a).lordKey);
  $('retro-body').innerHTML='<div class="card"><div class="kicker">O que estava ativo em '+fdate(d)+(evtTxt?(' — “'+esc(evtTxt)+'”'):'')+'</div>'
    +buildYearReport(a)
    +'<div class="rep-sec"><span class="rep-k">Trânsitos do dia</span>'+(top.map(h=>h.tg+' '+h.gl+' '+h.np.g+' ('+h.orb.toFixed(1)+'°, '+h.rel.tier+')').join(' · ')||'—')+'</div>'
    +(proms.length?('<div class="rep-sec"><span class="rep-k">Promessas correspondentes</span>'+proms.map(p=>p.t).join(' · ')+'</div>'):'')
    +'<div class="toolrow"><span class="mono">o evento correspondeu?</span>'
    +'<button class="btn" data-ev="2">muito</button><button class="btn" data-ev="1">parcialmente</button><button class="btn" data-ev="0">não</button>'
    +'<span class="mono" id="retro-saved">'+(EVAL[key]!==undefined?('avaliado: '+['não','parcialmente','muito'][EVAL[key]]):'')+'</span></div></div>';
  $('retro-body').querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{
    EVAL[key]=+b.dataset.ev; localStorage.setItem('ag_eval',JSON.stringify(EVAL));
    $('retro-saved').textContent='avaliado: '+['não','parcialmente','muito'][EVAL[key]]+' (salvo localmente)';
  });
}

/* ================= REVOLUÇÃO SOLAR ================= */
/* ================= REVOLUÇÕES — roda zodiacal do retorno ================= */
let RS_KIND='solar', RS_CURSOR=null, RS_CMP=false;
function rsCursor(){return RS_CURSOR||new Date();}
function rsStep(dir){
  const K=REV_BY_ID[RS_KIND]; if(!K)return;
  const R=revolutionFor(RS_KIND,rsCursor()); if(!R)return;
  const t=dir>0?((R.end?R.end.getTime():rsCursor().getTime())+DAY):(R.start.getTime()-DAY);
  RS_CURSOR=new Date(Math.max(BIRTH+DAY,Math.min(Date.now()+K.per*3*DAY,t)));
  renderRS();
}
/* lista de retornos vizinhos (3 antes · atual · 3 depois) */
function rsNeighbors(R,n){
  const K=REV_BY_ID[RS_KIND], out=[{R,rel:'atual'}];
  let cur=R;
  for(let i=0;i<(n||3);i++){ const p=revolutionFor(RS_KIND,new Date(cur.start.getTime()-DAY));
    if(!p)break; out.unshift({R:p,rel:'passado'}); cur=p; }
  cur=R;
  for(let i=0;i<(n||3);i++){ if(!cur.end)break;
    const nx=revolutionFor(RS_KIND,new Date(cur.end.getTime()+DAY));
    if(!nx||nx.start<=cur.start)break; out.push({R:nx,rel:i===0?'próximo':'futuro'}); cur=nx; }
  return out;
}
/* casas mais ativadas do retorno: onde se concentram os planetas */
function rsHousesRank(R){
  const c={}; REV_PL.forEach(k=>{ if(!R.chart.pts[k])return;
    const h=R.houseOfRev(R.chart.pts[k].lon); c[h]=(c[h]||0)+1;});
  const tot=Object.values(c).reduce((a,b)=>a+b,0)||1;
  return Object.entries(c).map(([h,n])=>({h:+h,n,p:Math.round(n/tot*100)}))
    .sort((a,b)=>b.n-a.n).slice(0,4);
}
/* aspectos-chave do retorno com o planeta que retorna */
function rsKeyAspects(R){
  const out=[], base=R.planetKey;
  REV_PL.forEach(k=>{ if(k===base||!R.chart.pts[k]||!R.chart.pts[base])return;
    const sep=adiff(R.chart.pts[base].lon,R.chart.pts[k].lon);
    for(const [ang,gl,cls,verb,orb] of ASPECTS){
      if(Math.abs(sep-ang)<=orb){out.push({k,ang,gl,cls,orb:Math.abs(sep-ang)});break;} }});
  return out.sort((a,b)=>a.orb-b.orb).slice(0,4);
}
const ASP_TXT={conj:'fusão direta dos temas',harm:'facilidade e fluxo entre os temas',tens:'atrito que exige ajuste'};
/* ---------- roda zodiacal ---------- */
const ROMANO_RV=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function rsWheelSVG(R,S){
  const svg=$('rs-wheel'); const W=(svg&&svg.clientWidth)||620, mob=W<520;
  const H=W, CX=W/2, CY=H/2, RAD=Math.PI/180;
  const M=W/2, u=M/300;                                // escala única
  const fs=(v,min)=>Math.max(min==null?6.5:min,Math.round(v*u*10)/10);
  const rZod=M-fs(26,16), rZin=rZod-fs(24,16), rPl=rZin-fs(26,18),
        rHou=rPl-fs(26,18), rHin=Math.round(M*0.31), rCore=rHin;
  const GR='143,220,182';                              // verde do retorno
  const ang=L=>180+(L-R.ascLon);                       // ASC à esquerda
  const P=(L,r)=>{const a=ang(L)*RAD;return [CX+r*Math.cos(a), CY-r*Math.sin(a)];};
  let s='<defs><filter id="rsg" x="-50%" y="-50%" width="200%" height="200%">'
    +'<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<radialGradient id="rsc"><stop offset="0%" stop-color="#0a1310"/><stop offset="100%" stop-color="#05080b"/></radialGradient></defs>';
  const circ=(r,st,w)=>'<circle cx="'+CX+'" cy="'+CY+'" r="'+r+'" fill="none" stroke="'+st+'" stroke-width="'+(w||1)+'"/>';
  // apenas dois trilhos: a faixa zodiacal e o limite interno das casas
  s+=circ(rZod,'rgba(255,255,255,0.202)')+circ(rZin,'rgba(255,255,255,0.139)');
  // divisões dos signos (só as 12 fronteiras, sem ticks de grau)
  for(let i=0;i<12;i++){const L=i*30, [x1,y1]=P(L,rZod), [x2,y2]=P(L,rZin);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(255,255,255,0.155)"/>';}
  // glifos dos signos no meio da faixa
  for(let i=0;i<12;i++){const L=i*30+15, [x,y]=P(L,(rZod+rZin)/2), f=fs(14,10);
    s+='<text x="'+x+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" fill="rgba(226,236,232,.62)">'+(SIGN_GLYPHS[i]||'')+'︎</text>';}
  // cúspides: eixos marcados, demais apenas insinuadas
  for(let h=0;h<12;h++){
    const L=R.chart.cusps[h], ax=(h%3===0);
    const [x1,y1]=P(L,rHin), [x2,y2]=P(L,ax?rZin:rHou);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(255,255,255,'+(ax?'.42':'.14')+')" stroke-width="'+(ax?1.2:1)+'"/>';
    const Lm=R.chart.cusps[h]+adiff(R.chart.cusps[h],R.chart.cusps[(h+1)%12])/2;
    const [mx,my]=P(Lm,rHin+fs(11,8)), f=fs(10,7.5);
    s+='<text x="'+mx+'" y="'+(my+f*0.35)+'" text-anchor="middle" font-size="'+f+'" font-family="IBM Plex Mono" fill="rgba(226,236,232,.40)">'+(h+1)+'</text>';}
  // arco verde na casa mais ativada — único acento do desenho
  const rank=rsHousesRank(R);
  if(rank.length){const h=rank[0].h-1, L0=R.chart.cusps[h], L1=R.chart.cusps[(h+1)%12];
    const a0=ang(L0)*RAD, a1=ang(L0+adiff(L0,L1))*RAD, rr=rZin-fs(5,3);
    const [x0,y0]=[CX+rr*Math.cos(a0),CY-rr*Math.sin(a0)], [x1,y1]=[CX+rr*Math.cos(a1),CY-rr*Math.sin(a1)];
    s+='<path d="M'+x0+' '+y0+' A'+rr+' '+rr+' 0 0 0 '+x1+' '+y1+'" fill="none" stroke="rgba('+GR+',.8)" stroke-width="'+fs(2.4,1.6)+'" stroke-linecap="round" filter="url(#rsg)"/>';}
  // planetas: só o disco e o glifo, sem hastes
  REV_PL.forEach(k=>{ if(!R.chart.pts[k])return;
    const L=R.chart.pts[k].lon, [x,y]=P(L,rPl), on=k===R.planetKey||k===R.ascRuler;
    const rd=fs(11.5,8), f=fs(12,9);
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+rd+'" fill="#08100d" stroke="rgba('+GR+','+(on?'.7':'.2')+')"'+(on?' filter="url(#rsg)"':'')+'/>'
      +'<text x="'+x+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" fill="'+(on?'#a8e6c4':'rgba(226,236,232,.66)')+'">'+(PT_GLYPH[k]||'')+'︎</text>';});
  // ângulos: apenas os nomes, na periferia
  [['ASC',R.ascLon],['MC',R.chart.mc],['DSC',n360(R.ascLon+180)],['IC',n360(R.chart.mc+180)]].forEach(([nm,L])=>{
    const [x,y]=P(L,rZod+fs(13,9)), f=fs(8.5,6.5);
    s+='<text x="'+x+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" font-family="IBM Plex Mono" letter-spacing="'+Math.max(.8,1.4*u)+'" fill="rgba(226,236,232,.45)">'+nm+'</text>';});
  // núcleo enxuto: glifo do planeta do retorno e seu nome
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rCore+'" fill="url(#rsc)" stroke="rgba(255,255,255,0.093)"/>';
  const fG=fs(46,24), fN=fs(10.5,8);
  s+='<text x="'+CX+'" y="'+(CY+fG*0.14)+'" text-anchor="middle" font-size="'+fG+'" fill="#a8e6c4">'+(PT_GLYPH[R.planetKey]||'')+'︎</text>';
  s+='<text x="'+CX+'" y="'+(CY+fG*0.14+fN*2.1)+'" text-anchor="middle" font-size="'+fN+'" font-family="IBM Plex Mono" letter-spacing="'+Math.max(1.2,2*u)+'" fill="rgba(226,236,232,.55)">'+PT_NAME[R.planetKey].toUpperCase()+'</text>';
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  return s;
}
const RS_ANG_TXT={ASC:'como o período se apresenta',MC:'onde ele é visto e cobrado',
  DSC:'com quem ele é negociado',IC:'de onde ele se sustenta'};
function renderRS(){
  if(typeof NATAL==='undefined'||!NATAL){if($('rs-body'))$('rs-body').innerHTML=emptyState();return;}
  if($('rs-kinds'))$('rs-kinds').innerHTML=REV_KINDS.map(k=>{
    const per=k.per<40?'Mensal':k.per<400?'Anual':(Math.round(k.per/365.25)+' anos');
    return '<button class="rvty'+(k.id===RS_KIND?' on':'')+'" data-rsk="'+k.id+'">'
      +'<span class="rvty-g">'+(PT_GLYPH[k.key]||'')+'︎</span>'
      +'<span class="rvty-b"><b>'+k.label+'</b><em>'+per+'</em></span>'
      +(k.id===RS_KIND?'<span class="rvty-d"></span>':'')+'</button>';}).join('');
  const d=rsCursor(), R=revolutionFor(RS_KIND,d), S=tempoState(d), K=REV_BY_ID[RS_KIND];
  if(!R){ ['rs-cmp','rs-cards'].forEach(i2=>{if($(i2))$(i2).innerHTML='';});
    if($('rs-wheel'))$('rs-wheel').innerHTML='';
    $('rs-body').innerHTML='<div class="card"><p>Não foi possível calcular a Revolução '+K.label+'. Importe o mapa pelo link do Aspectarian.</p></div>';return;}
  const nb=rsNeighbors(R,3), sel=$('rs-year'), lab=$('rs-year-k');
  const curto=K.per<40;                                  // retorno lunar → rótulo por mês
  if(lab)lab.textContent=curto?'Mês':'Ano';
  if(sel){sel.innerHTML=nb.map(x=>{
      const d0=x.R.start;
      const txt=curto?(MESES[d0.getUTCMonth()]+' '+d0.getUTCDate()+', '+d0.getUTCFullYear())
        :(d0.getUTCFullYear()+(x.R.end&&x.R.end.getUTCFullYear()!==d0.getUTCFullYear()?(' – '+x.R.end.getUTCFullYear()):''))
          +' · '+fdate(d0);
      return '<option value="'+d0.getTime()+'"'+(x.rel==='atual'?' selected':'')+'>'+txt+'</option>';}).join('');
    sel.onchange=()=>{RS_CURSOR=new Date(+sel.value+DAY);renderRS();};}
  $('rs-wheel').innerHTML=rsWheelSVG(R,S);
  const pv=$('rs-prev'),nx=$('rs-next');
  if(pv)pv.onclick=()=>rsStep(-1); if(nx)nx.onclick=()=>rsStep(1);
  // painel comparativo: revolução × natal
  const rulerNat=NATAL.pts[R.ascRuler];
  /* cada quadradinho carrega o seu glifo: planeta, signo ou numeral da casa */
  const pg=k=>'<u class="rvq-g">'+(PT_GLYPH[k]||'')+'︎</u>';
  const sg=L=>'<u class="rvq-g">'+sgOf(L)+'</u>';
  const hg=h=>'<u class="rvq-g rvq-h">'+(ROMANO_RV[h]||h)+'</u>';
  const q=(g,k,v,wide)=>'<div class="rvq'+(wide?' rvq-w':'')+'">'+(g||'')
    +'<div class="rvq-t"><span>'+k+'</span><b>'+v+'</b></div></div>';
  const revRul=R.chart&&R.chart.rulers?R.chart.rulers[1]:R.ascRuler;
  $('rs-cmp').innerHTML=
    '<section class="rvmini"><div class="kicker">mapa da revolução</div><div class="rvqs">'
     +q(sg(R.ascLon),'Ascendente',R.ascSignNm+' <i>'+Math.floor(n360(R.ascLon)%30)+'°</i>')
     +q(pg(R.ascRuler),'Regente do Asc',PT_NAME[R.ascRuler]
        +(R.ascRulerRevHouse?(' <i>· casa '+R.ascRulerRevHouse+'</i>'):''))
     +q(pg(R.planetKey),'Planeta do retorno',PT_NAME[R.planetKey]
        +(R.planetRevHouse?(' <i>· casa '+R.planetRevHouse+' no mapa da revolução</i>'):''),true)
     +q('<u class="rvq-g">✦</u>','Vigência',fdate(R.start)+(R.end?(' – '+fdate(R.end)):''),true)
    +'</div></section>'
    +'<section class="rvmini"><div class="kicker">onde isso vai no natal</div><div class="rvqs">'
     +q(hg(R.ascNatalHouse),'Asc do retorno','casa '+R.ascNatalHouse+' natal')
     +q(pg(R.ascRuler),'Regente no natal',rulerNat?('casa '+rulerNat.h+' <i>'+(rulerNat.dig||'')+'</i>'):'—')
     +(S?q(hg(S.profHouse),'Profecção','casa '+S.profHouse):'')
     +(S?q(pg(S.lord),'Senhor do ano',PT_NAME[S.lord]):'')
     +q(hg(R.ascNatalHouse),'Matéria',cap1(HOUSE_THEME[R.ascNatalHouse]),true)
    +'</div></section>';
  // cards clicáveis: cada elemento do retorno
  const escopo=S?(' Dentro da firdária de '+(PT_NAME[S.mk]||'—')+(S.sk?(' / '+PT_NAME[S.sk]):'')
    +' e da profecção da '+ordinal(S.profHouse)+', ') : ' ';
  const temas=(hs)=>casasTag([...new Set(hs.filter(Boolean))].slice(0,3));
  const cardEl=(tit,sub,natal,rev,tem)=>'<details class="rvel"><summary><b>'+tit+'</b><em>'+sub+'</em><span>›</span></summary>'
    +'<div class="rvel-b">'
    +'<div class="rvel-s"><span>No natal</span><p>'+natal+'</p></div>'
    +'<div class="rvel-s"><span>Na revolução</span><p>'+rev+'</p></div>'
    +'<div class="rvel-s"><span>Temas ativáveis</span><p>'+tem+'</p></div>'
    +'</div></details>';
  let cards='';
  cards+=cardEl('Ascendente do retorno',sgOf(R.ascLon)+' '+R.ascSignNm+' · '+R.ascNatalHouse+'ª natal',
    'A '+ordinal(R.ascNatalHouse)+' natal trata de '+HOUSE_THEME[R.ascNatalHouse]+'.',
    'O Ascendente define como o período se apresenta: em '+R.ascSignNm+', regido por '+PT_NAME[R.ascRuler]+'.',
    escopo+'a ativação tende a passar por '+temas([R.ascNatalHouse,S&&S.profHouse])+'.');
  if(rulerNat)cards+=cardEl('Regente do Ascendente',PT_NAME[R.ascRuler]+' · casa '+rulerNat.h+' natal',
    PT_NAME[R.ascRuler]+' rege a '+(ruledHouses(R.ascRuler).map(h=>h+'ª').join(' e a ')||'—')
      +' e está na casa '+rulerNat.h+' ('+(rulerNat.dig||'—')+').',
    'Administra o retorno'+(R.ascRulerRevHouse?(' a partir da casa '+R.ascRulerRevHouse+' do próprio retorno'):'')+'.',
    escopo+'ele conduz '+temas(ruledHouses(R.ascRuler).concat([rulerNat.h]))+'.');
  const pp=NATAL.pts[R.planetKey];
  if(pp)cards+=cardEl('Planeta do retorno',PT_NAME[R.planetKey]+' · '+K.label,
    PT_NAME[R.planetKey]+' rege a '+(ruledHouses(R.planetKey).map(h=>h+'ª').join(' e a ')||'—')
      +' e está na casa '+pp.h+' natal ('+(pp.dig||'—')+').',
    'É o planeta que retorna ao grau natal'+(R.planetRevHouse?(', posicionado na casa '+R.planetRevHouse+' do retorno'):'')+'. '+cap1(K.campo)+'.',
    escopo+'o retorno reativa '+temas(ruledHouses(R.planetKey).concat([pp.h]))+'.');
  cards+=cardEl('Casa ativada','Casa '+R.ascNatalHouse+' natal',
    cap1(HOUSE_THEME[R.ascNatalHouse])+'.',
    'É o ambiente onde o período tende a se manifestar (Ascendente do retorno).',
    escopo+'esses assuntos convergem com '+temas([S&&S.profHouse,S&&S.occLord])+'.');
  $('rs-cards').innerHTML=cards;
  $('rs-body').innerHTML='';
}
function rsSynth(R,S){
  const F=[];
  F.push('Retorno de '+PT_NAME[R.planetKey]+' válido de '+fdate(R.start)+(R.end?(' a '+fdate(R.end)):'')+'.');
  F.push('Ascendente em '+R.ascSignNm+', regido por '+PT_NAME[R.ascRuler]+', cai na '+ordinal(R.ascNatalHouse)
    +' natal: o período tende a se manifestar por '+casaTag(R.ascNatalHouse)+'.');
  if(S)F.push('A matéria do ano permanece '+casaTag(S.profHouse)+', administrada por '+PT_NAME[S.lord]+'.');
  return F.join(' ');
}
document.addEventListener('click',e=>{
  if(!e.target.closest)return;
  const k=e.target.closest('[data-rsk]');
  if(k){RS_KIND=k.dataset.rsk;RS_CURSOR=null;renderRS();return;}
  const j=e.target.closest('[data-rsjump]');
  if(j){RS_CURSOR=new Date(+j.dataset.rsjump+DAY);renderRS();return;}
  const c=e.target.closest('#rs-cmp-chk-btn');
  if(c){RS_CMP=!RS_CMP;c.classList.toggle('on',RS_CMP);renderRS();return;}
});

/* ================= ELETIVA ================= */
function renderEletivaInit(){
  const sel=$('el-act');
  Object.keys(ELECT_SIG).forEach(a=>{const o=document.createElement('option');o.textContent=a;sel.appendChild(o);});
  const t=new Date();
  $('el-d0').value=t.toISOString().slice(0,10);
  $('el-d1').value=new Date(t.getTime()+10*DAY).toISOString().slice(0,10);
  $('el-run').onclick=runEletiva;
}
function runEletiva(){
  if(!NATAL){$('el-body').innerHTML=emptyState();return;}
  const act=$('el-act').value;
  const d0=new Date($('el-d0').value+'T00:00:00Z'), d1=new Date($('el-d1').value+'T00:00:00Z');
  const h0=+$('el-h0').value||9, h1=+$('el-h1').value||21;
  if(!(d1>=d0)){$('el-body').innerHTML='<div class="card">intervalo de datas inválido.</div>';return;}
  if((d1-d0)/DAY>45){$('el-body').innerHTML='<div class="card">intervalo acima de 45 dias: reduza para manter o cálculo honesto e rápido.</div>';return;}
  $('el-body').innerHTML='<div class="card mono">calculando janelas…</div>';
  setTimeout(()=>{
    const avoid=$('el-avoid').value, pri=$('el-pri').value;
    let wins=searchWindows(act,d0,d1,h0,h1,3);
    if(avoid==='retro') wins=wins.filter(w=>!w.P.some(p=>/retrógrado/.test(p)));
    if(avoid==='voc') wins=wins.filter(w=>!w.P.some(p=>/curso vazio/.test(p)));
    if(pri.indexOf('segurança')===0) wins=wins.filter(w=>!w.P.length||w.score>0).concat(wins.filter(w=>w.P.length&&w.score<=0));
    const worst=wins.slice().sort((a,b)=>a.score-b.score).slice(0,3);
    const cfg=ELECT_SIG[act];
    const label=['melhor janela','segunda melhor','janela aceitável'];
    const winB=(w,i)=>'<div class="card"><div class="kicker">'+label[i]+' · nota '+w.score+'</div>'
      +'<p style="font-size:.9rem"><b style="color:var(--ivory)">'+fdatetime(w.d)+'</b> — finalidade: '+act+' (significador '+PT_NAME[cfg.sig]+'; casas '+cfg.houses.join(', ')+')</p>'
      +'<p style="font-size:.8rem"><b style="color:var(--green)">Favorável:</b> '+(w.F.join('; ')||'—')+'</p>'
      +'<p style="font-size:.8rem"><b style="color:var(--red)">Problemático:</b> '+(w.P.join('; ')||'—')+'</p>'
      +'<p class="mono">fundamento: condição da Lua e sua próxima aplicação; estado do significador (direção, combustão); trânsitos às casas '+cfg.houses.join(', ')+' do natal; Senhor do Ano e firdária vigentes. Sem coordenadas locais o Ascendente eletivo não entra na nota.</p></div>';
    let html=wins.slice(0,3).map(winB).join('');
    html+='<div class="card"><div class="kicker">períodos a evitar</div>'+worst.map(w=>'<div class="evrow tens"><span class="d">'+fdatetime(w.d)+'</span><span class="t">nota '+w.score+' — '+(w.P.slice(0,2).join('; ')||'sem fatores positivos')+'</span></div>').join('')+'</div>';
    $('el-body').innerHTML=html||'<div class="card">nenhuma janela avaliável no intervalo.</div>';
  },30);
}

/* ================= PERFIL — 8 seções ================= */
let AXES_CACHE=null, TEMPER_CACHE=null;
function profileData(force){
  if(force||!TEMPER_CACHE){TEMPER_CACHE=temperEngine();AXES_CACHE=allAxes();}
  return {T:TEMPER_CACHE,A:AXES_CACHE};
}
function temperament(){return TEMPER_CACHE||(TEMPER_CACHE=temperEngine());}
/* 1 · painel executivo do temperamento (síntese · diagrama · qualidades) */
const QICON={quente:'🜂',frio:'🜄',seco:'🜃','úmido':'🜁'};
function temperDiagram(T,size){
  const W=size||460, C=W/2, R=W/2-76, TAU=Math.PI*2;
  const AU='240,207,142', BL='143,184,234';
  // eixos: quente(topo) · seco(direita) · frio(baixo) · úmido(esquerda)
  const v={quente:T.quente,seco:T.seco,frio:T.frio,'úmido':T.umido};
  const ordem=['quente','seco','frio','úmido'];
  const P=(i,r)=>[C+r*Math.sin(i/4*TAU), C-r*Math.cos(i/4*TAU)];
  let s='<defs><filter id="tdglow" x="-60%" y="-60%" width="220%" height="220%">'
    +'<feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<linearGradient id="tdfill" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0%" stop-color="rgba('+AU+',.55)"/><stop offset="100%" stop-color="rgba('+AU+',.20)"/></linearGradient></defs>';
  // anéis concêntricos discretos
  [1,.78,.56,.34].forEach((f,i)=>{s+='<circle cx="'+C+'" cy="'+C+'" r="'+(R*f)+'" fill="none" '
    +'stroke="rgba(255,255,255,'+(i===0?'.3':'.12')+')"'+(i===0?'':' stroke-dasharray="2 6"')+'/>';});
  // arco dourado externo (assinatura visual)
  s+='<circle cx="'+C+'" cy="'+C+'" r="'+(R+16)+'" fill="none" stroke="rgba('+AU+',.30)" stroke-width="1.2" '
    +'stroke-dasharray="'+(TAU*(R+16)*.62)+' '+(TAU*(R+16))+'" transform="rotate(-118 '+C+' '+C+')"/>';
  // cruz dos eixos
  s+='<line x1="'+C+'" y1="'+(C-R)+'" x2="'+C+'" y2="'+(C+R)+'" stroke="rgba(255,255,255,0.109)"/>'
    +'<line x1="'+(C-R)+'" y1="'+C+'" x2="'+(C+R)+'" y2="'+C+'" stroke="rgba(255,255,255,0.109)"/>';
  // polígono das quatro qualidades
  const pts=ordem.map((q,i)=>P(i,R*Math.max(.08,v[q]/100)).join(',')).join(' ');
  s+='<polygon points="'+pts+'" fill="url(#tdfill)" stroke="rgba('+AU+',.9)" stroke-width="1.4" filter="url(#tdglow)"/>';
  ordem.forEach((q,i)=>{const [x,y]=P(i,R*Math.max(.08,v[q]/100));
    s+='<circle cx="'+x+'" cy="'+y+'" r="3.6" fill="rgba('+AU+',.95)"/>';});
  // nós rotulados
  ordem.forEach((q,i)=>{
    const [x,y]=P(i,R), quente=(q==='quente'||q==='seco');
    const col=q==='quente'?'#d98a6a':q==='frio'?'#7fa8d8':q==='seco'?'#dcb877':'#7fc8d8';
    s+='<circle cx="'+x+'" cy="'+y+'" r="19" fill="#0a0f1c" stroke="rgba(255,255,255,0.248)"/>'
      +'<text x="'+x+'" y="'+(y+6)+'" text-anchor="middle" font-size="16" fill="'+col+'">'+QICON[q]+'</text>';
    const [lx,ly]=P(i,R+(i%2?52:42));
    s+='<text x="'+lx+'" y="'+(ly+4)+'" text-anchor="middle" font-size="11" font-family="Inter" '
      +'letter-spacing="2.2" fill="'+col+'">'+q.toUpperCase()+'</text>';
  });
  return '<svg class="tdiag" viewBox="0 0 '+W+' '+W+'">'+s+'</svg>';
}
function renderTemp(){
  if(typeof NATAL==='undefined'||!NATAL){$('temp-body').innerHTML=emptyState();return;}
  const {T,A}=profileData(true);
  if(!T){$('temp-body').innerHTML=emptyState();return;}
  const qcard=(q,v,cor)=>'<div class="qcd"><div class="qcd-h"><span class="qcd-i" style="color:'+cor+'">'+QICON[q]+'</span>'
    +'<span class="qcd-n">'+q.toUpperCase()+'</span></div>'
    +'<b>'+v+'%</b><div class="qcd-t"><i style="width:'+v+'%;background:'+cor+'"></i></div></div>';
  const donut=(v)=>{const r=26,c=2*Math.PI*r;
    return '<svg class="vdonut" viewBox="0 0 64 64"><circle cx="32" cy="32" r="'+r+'" fill="none" stroke="rgba(255,255,255,0.124)" stroke-width="3"/>'
      +'<circle cx="32" cy="32" r="'+r+'" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linecap="round" '
      +'stroke-dasharray="'+(c*v/100)+' '+c+'" transform="rotate(-90 32 32)"/>'
      +'<text x="32" y="36" text-anchor="middle" font-size="14" font-family="Inter" fill="var(--gold)">'+v+'%</text></svg>';};
  $('temp-body').innerHTML=
   '<div class="pfhero">'
    // coluna 1 — diagnóstico
    +'<div class="pfh-l">'
      +'<div class="pfh-mark">✦</div>'
      +'<div class="pfh-k">Predomínio</div>'
      +'<h3 class="pfh-h">'+T.humor+'</h3>'
      +'<p class="pfh-p">Seu temperamento é predominantemente <b>'+T.humor+'</b>, com ênfase nas qualidades '
        +'<b>'+T.poloH+'</b> e <b>'+T.poloD+'</b>. '+cap1(HUMOR_TXT[T.humor])+'.</p>'
      +'<div class="pfh-cf"><span>Confiança do veredito</span>'
        +'<div class="pfh-pill"><b>'+T.conf+'%</b><i>'+T.confLabel+'</i></div></div>'
      +'<div class="pfh-sec">Quadrante vizinho: <b>'+T.secundario+'</b></div>'
    +'</div>'
    // coluna 2 — diagrama
    +'<div class="pfh-c">'+temperDiagram(T)+'</div>'
    // coluna 3 — qualidades + veredito
    +'<div class="pfh-r">'
      +'<div class="qcds">'+qcard('quente',T.quente,'#d98a6a')+qcard('seco',T.seco,'#dcb877')
        +qcard('frio',T.frio,'#7fa8d8')+qcard('úmido',T.umido,'#7fc8d8')+'</div>'
      +'<div class="vcard"><div class="vc-h"><span class="pf-k" style="margin:0">veredito</span><span class="vc-s">⚖</span></div>'
        +'<div class="vc-b"><div><b>Predomínio '+T.humor+'</b>'
          +'<em>'+cap1(T.poloH)+' e '+T.poloD+' (quente '+T.quente+'% · seco '+T.seco+'%)</em></div>'
          +donut(T.conf)+'</div></div>'
    +'</div>'
   +'</div>'
   // leitura rápida (recolhida)
   +quickReadHTML(T,A);
}
function quickReadHTML(T,A){
  const fortes=A.slice().sort((a,b)=>Math.abs(b.pos-50)-Math.abs(a.pos-50)).slice(0,3);
  const rapida=[
    'Compleição '+T.humor+': '+HUMOR_TXT[T.humor]+'.',
    'Traço mais marcado: '+fortes[0].frase.replace(/^Inclina-se\s+/,'').replace(/^\w/,c=>c.toUpperCase()),
    'Em seguida vêm '+fortes[1].name.split('–')[fortes[1].pos>=50?0:1].toLowerCase()
      +' e '+fortes[2].name.split('–')[fortes[2].pos>=50?0:1].toLowerCase()+'.'];
  return '<details class="card pf-quick" open><summary><span class="kicker" style="margin:0">leitura rápida</span>'
    +'<b>três frases literais</b></summary><div class="pf-cb">'
    +rapida.map(f=>'<p>'+f+'</p>').join('')+'</div></details>';
}
/* 5 · os 48 eixos — cartões de família + trilhos ao abrir */
const FAM_ORDEM=['físico','emocional','mental','comportamental'];
const FAM_INFO={
 'físico':{t:'Físico',i:'🜂',d:'Força, energia, resistência, vitalidade e estrutura corporal.',c:'#8fbf9a'},
 'emocional':{t:'Emocional',i:'♡',d:'Sensibilidade, reatividade, equilíbrio e expressividade.',c:'#d98a8a'},
 'mental':{t:'Mental',i:'◈',d:'Raciocínio, clareza, foco, aprendizado e memória.',c:'#8fa8d8'},
 'comportamental':{t:'Comportamental',i:'✦',d:'Ações, hábitos, disciplina, adaptação e decisões.',c:'#dcb877'}};
let AX_FAM=null;
function axisCardHTML(a){
  const esq=a.pos>=50, polo=esq?a.poloA:a.poloB, v=esq?a.pos:100-a.pos;
  return '<div class="axc">'
    +'<div class="axc-h"><span class="axc-n">'+a.name+'</span>'
      +'<span class="axc-v">'+v+'%<i> '+polo.toLowerCase()+'</i></span></div>'
    +'<div class="axc-bar"><i class="axc-mid"></i><i class="axc-dot" style="left:'+a.pos+'%"></i></div>'
    +'<div class="axc-p"><span>'+a.poloA+'</span><span>'+a.poloB+'</span></div>'
    +'<p class="axc-f">'+a.frase+'</p>'
    +'<div class="axc-m">confiança '+a.conf+'% ('+a.confLabel+') · '+a.marks.length+' testemunhos</div>'
    +'<details class="fund"><summary>Fundamento técnico</summary><ul class="ilist">'
      +a.marks.slice().sort((x,y)=>Math.abs(y.dir*y.w)-Math.abs(x.dir*x.w))
        .map(m=>'<li>'+m.txt+' <i>→ '+(m.dir>=0?a.poloA:a.poloB)+', peso '+m.w+'</i></li>').join('')
      +'</ul></details>'
    +'</div>';
}
function famCardsHTML(A){
  return '<div class="famgrid">'+FAM_ORDEM.map(f=>{const I=FAM_INFO[f], n=A.filter(a=>a.fam===f).length;
    return '<button class="famc'+(AX_FAM===f?' on':'')+'" data-fam="'+f+'">'
      +'<span class="famc-i" style="color:'+I.c+'">'+I.i+'</span>'
      +'<span class="famc-b"><b>'+I.t+'</b><em>'+I.d+'</em><i style="color:'+I.c+'">'+n+' eixos</i></span>'
      +'<span class="famc-x">›</span></button>';}).join('')+'</div>';
}
function renderPers(){
  if(typeof NATAL==='undefined'||!NATAL){$('pers-body').innerHTML=emptyState();return;}
  const {T,A}=profileData();
  const q=($('ax-search')&&$('ax-search').value||'').toLowerCase();
  const sort=($('ax-sort')&&$('ax-sort').value)||'dom';
  let html='<div class="secth"><span class="secth-i">✦</span><h3>48 eixos</h3>'
    +'<span class="secth-l">'+(AX_FAM?FAM_INFO[AX_FAM].t:'quatro famílias de doze')+'</span></div>'
    +famCardsHTML(A);
  // trilhos da família aberta (ou da busca)
  let L=A.filter(a=>(!q||a.name.toLowerCase().includes(q))&&(!AX_FAM||a.fam===AX_FAM));
  if(sort==='val')L=L.slice().sort((a,b)=>Math.abs(b.pos-50)-Math.abs(a.pos-50));
  if(sort==='conf')L=L.slice().sort((a,b)=>b.conf-a.conf);
  if(sort==='tens')L=L.slice().sort((a,b)=>Math.abs(a.pos-50)-Math.abs(b.pos-50));
  if(AX_FAM||q) html+='<div class="axgrid">'+L.map(axisCardHTML).join('')+'</div>';
  else html+='<p class="note axhint">Escolha uma família acima para abrir os doze eixos, ou use a busca.</p>';
  // 6 · constituição tradicional (recolhida)
  const C=constitution(T);
  if(C)html+='<details class="card pf-const"><summary><span class="kicker" style="margin:0">constituição e suscetibilidades tradicionais</span>'
    +'<b>'+cap1(C.constituicao)+' — '+C.qualidades+'</b><em>sustentação '+C.sust+'</em></summary>'
    +'<div class="pf-cb">'
    +'<div class="pf-cr"><span>Constituição predominante</span>'+cap1(C.constituicao)+' ('+C.qualidades+'). '+C.excesso+'.</div>'
    +'<div class="pf-cr"><span>Funções tradicionalmente mais sensíveis</span><ul class="ilist">'
      +C.sens.map(x=>'<li><b>'+x.o+'</b> — '+x.v+'</li>').join('')+'</ul></div>'
    +'<div class="pf-cr"><span>Fatores de agravamento</span>'+(C.agrav.length?('<ul class="ilist">'+C.agrav.map(x=>'<li>'+x+'</li>').join('')+'</ul>'):'nenhum testemunho relevante detectado.')+'</div>'
    +'<div class="pf-cr"><span>Fatores de compensação e proteção</span><ul class="ilist">'+C.comp.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>'
    +'<div class="pf-cr"><span>Sustentação astrológica</span>'+C.sust+' — '+C.test.length+' testemunhos repetidos.</div>'
    +'<p class="pf-aviso">Esta seção descreve tendências constitucionais da tradição. Não diagnostica, não prevê enfermidades e não substitui avaliação médica. Trate como suscetibilidade tradicional que merece atenção, nunca como conclusão clínica.</p>'
    +'</div></details>';
  // 7 · correspondências tipológicas
  const Y=typology(A);
  if(Y)html+='<div class="card pf-tipo"><div class="kicker">correspondências tipológicas</div>'
    +'<p class="note" style="margin-top:0">Aproximações derivadas do padrão GLOBAL dos 48 eixos — nunca de um signo ou planeta isolado.</p>'
    +'<div class="pf-tgrid">'
     +'<button class="pf-t clic" data-tip="mbti"><span class="pf-k">MBTI</span><b>'+Y.mbti+'</b>'
      +'<em>'+((typeof MBTI_FRASE!=='undefined'&&MBTI_FRASE[Y.mbti])||'')+'</em>'
      +'<i>estimativa principal · alternativa: '+Y.mbtiAlt+'</i><u>Ver perfil →</u></button>'
     +'<button class="pf-t clic" data-tip="enn"><span class="pf-k">Eneagrama</span><b>Tipo '+Y.enn+' · '+ENN_NOME[Y.enn]+'</b>'
      +'<em>'+((typeof ENN!=='undefined'&&ENN[Y.enn])?ENN[Y.enn].frase:'')+'</em>'
      +'<i>estimativa principal · alternativa: tipo '+Y.ennAlt+'</i><u>Ver perfil →</u></button>'
     +'<button class="pf-t clic" data-tip="soc"><span class="pf-k">Sociônica</span><b>'+Y.soc+' · '+(SOC_NOME[Y.soc]||'—')+'</b>'
      +'<em>'+((typeof SOC_FRASE!=='undefined'&&SOC_FRASE[Y.soc])||'')+'</em>'
      +'<i>estimativa principal · alternativa: '+Y.socAlt+'</i><u>Ver perfil →</u></button>'
    +'</div>'
    +'<div class="pf-cr"><span>Eixos que sustentam a aproximação</span>'+(Y.sust.join(' · ')||'—')+'</div>'
    +'<div class="pf-cr"><span>Divergências que impedem certeza</span>'
      +(Y.diverg.length?Y.diverg.join('; ')+'.':'as quatro dicotomias estão suficientemente definidas, mas a correspondência segue sendo aproximação.')+'</div>'
    +'<p class="note">Dimensões agregadas: E '+Y.dims.E+'% · N '+Y.dims.N+'% · F '+Y.dims.F+'% · J '+Y.dims.J+'%.</p>'
    +'</div>';
  // 8 · fundamento técnico geral
  html+='<details class="card pf-fund"><summary><span class="kicker" style="margin:0">fundamento técnico</span><b>pesos, testemunhos e regras usados</b></summary>'
    +'<div class="pf-cb">'
    +'<div class="pf-cr"><span>Hierarquia do temperamento</span>Ascendente 3 · planeta na cúspide da casa 1 = 3 (não recontado como planeta na casa 1) · planeta dentro da casa 1 = 2 · regente do Ascendente (sobretudo seu signo) 3 · Lua 2 · fase lunar 1 · Senhor da Genitura 1. Signo, casa, dignidade e condição modulam o peso entre 0,75× e 1,25×, sem criar pontuação nova.</div>'
    +'<div class="pf-cr"><span>Normalização</span>quente × frio = 100% e seco × úmido = 100%, calculados separadamente. A confiança mede a concordância entre testemunhos, não a intensidade do resultado.</div>'
    +'<div class="pf-cr"><span>Testemunhos do temperamento</span><table class="pf-tb"><tr><th>Fonte</th><th>Detalhe</th><th>Qualidades</th><th>Peso</th></tr>'
      +T.fx.map(f=>'<tr><td>'+f.fonte+'</td><td class="m">'+f.detalhe+'</td><td class="m">'+f.qs.join(' · ')+'</td><td class="m">'+f.w+'</td></tr>').join('')+'</table></div>'
    +'<div class="pf-cr"><span>Divergências internas</span>'+(T.contra.length?T.contra.map(c=>c.fonte+' ('+c.qs.join('-')+')').join('; ')+'.':'nenhuma — compleição unívoca.')+'</div>'
    +'<div class="pf-cr"><span>Os 48 eixos</span>Cada eixo soma marcadores próprios (Ascendente, regente, Lua, planetas indicados, Senhor da Genitura, modalidades, elementos, casas e estrelas). Casas e estrelas entram como modificadores, nunca como prova isolada. A posição é a média ponderada das direções; a confiança combina concordância direcional (75%) e volume de testemunhos (25%).</div>'
    +(typeof fundamentoHTML==='function'?fundamentoHTML(['temperamento','lua','aspecto','dignidade']):'')
    +'</div></details>';
  $('pers-body').innerHTML=html;
}
document.addEventListener('click',e=>{
  const f=e.target.closest&&e.target.closest('[data-fam]');
  if(f){AX_FAM=(AX_FAM===f.dataset.fam)?null:f.dataset.fam;renderPers();}
});


/* ================= FONTES E MÉTODO ================= */

/* ================= AJUSTES — pesos manuais das tipologias ================= */
const CFG_LBL={
  tw:{asc:'Ascendente',cusp:'Planeta na cúspide da 1',h1:'Planeta na casa 1',ruler:'Regente do Ascendente',
      moon:'Lua',phase:'Fase da Lua',lord:'Senhor da Genitura'},
  cw:{promessa:'Promessa natal explícita',firdaria:'Senhor da firdária',sub:'Sub-regente',
      casaProf:'Casa da promessa = profectada',senhorAno:'Senhor do Ano',revAlta:'Reforço alto da revolução',
      revMedia:'Reforço médio da revolução',repete:'Aspecto repetido no retorno',bonus:'Bônus de convergência'}};
function renderConfig(){
  const el=$('config-body'); if(!el)return;
  const grp=(tit,sub,obj,lbls,defs)=>'<div class="card cfg"><div class="kicker">'+tit+'</div>'
    +'<p class="note" style="margin-top:0">'+sub+'</p>'
    +Object.keys(lbls).map(k=>'<div class="cfg-r"><span>'+lbls[k]+'</span>'
      +'<input type="range" min="0" max="5" step="0.5" value="'+obj[k]+'" data-cfg="'+tit+':'+k+'">'
      +'<b>'+obj[k]+'</b><i>padrão '+defs[k]+'</i></div>').join('')
    +'</div>';
  el.innerHTML=grp('tw','Pesos do temperamento — hierarquia dos testemunhos (quente/frio × seco/úmido).',CFG.tw,CFG_LBL.tw,CFG_DEF.tw)
    +grp('cw','Pesos da convergência — ordenam promessas e o ranking de planetas acionados.',CFG.cw,CFG_LBL.cw,CFG_DEF.cw)
    +'<div class="toolrow"><button class="btn" id="cfg-reset">Restaurar padrões</button>'
    +'<span class="note">As mudanças aplicam na hora e ficam salvas neste navegador.</span></div>';
  el.querySelectorAll('[data-cfg]').forEach(inp=>{
    inp.oninput=function(){
      const [g,k]=this.dataset.cfg.split(':');
      CFG[g][k]=+this.value; this.nextElementSibling.textContent=this.value;
      cfgSave(); cfgApply();
    };});
  const rb=$('cfg-reset');
  if(rb)rb.onclick=()=>{CFG=JSON.parse(JSON.stringify(CFG_DEF));cfgSave();cfgApply();renderConfig();};
}
function cfgApply(){
  if(typeof NATAL==='undefined'||!NATAL)return;
  try{
    TEMPER_CACHE=null; AXES_CACHE=null;                 // invalida os caches
    CHARTMETA.temper=temperEngine();
    profileData(true);                                   // recalcula temperamento e eixos
    renderTemp(); renderPers();
  }catch(e){console.error('cfg perfil',e);}
  try{ renderNatal(); }catch(e){console.error('cfg natal',e);}
  try{ if($('tl-info'))syncTempo(); }catch(e){console.error('cfg timeline',e);}
}
