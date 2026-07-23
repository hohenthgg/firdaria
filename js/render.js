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
  if(!NATAL){$('natal-body').innerHTML=emptyState();$('prom-body').innerHTML='';return;}
  const P=NATAL.pts;
  let rows=Object.entries(P).map(([k,p])=>'<tr><td class="g">'+p.g+' '+p.nm+'</td><td class="m">'+zfmt(p.lon)+' · casa '+p.h+'</td><td>'+p.dig+'</td><td>'+(p.star||'—')+'</td></tr>').join('');
  const stars=NATAL.angStars.map(([a,s])=>'<tr><td class="g">'+a+'</td><td colspan="3">'+s+'</td></tr>').join('');
  const M=NATAL.meta;
  let html='<p class="lede">Mapa '+NATAL.sect+' — '+M.name+'. Regente do Ascendente: '+PT_NAME[M.ascRuler]+' ('+NATAL.pts[M.ascRuler].dig+', casa '+NATAL.pts[M.ascRuler].h+').'
    +(M.receptions.length?(' Recepções detectadas: '+M.receptions.join('; ')+'.'):' Sem recepções detectadas entre os aspectos informados.')
    +(M.finals.length?(' Dispositor(es) final(is): '+M.finals.map(f=>PT_NAME[f]).join(', ')+'.'):'')
    +(M.loops.length?(' Anel fechado de dispositores: '+M.loops[0].map(k=>PT_GLYPH[k]).join('→')+'→'+PT_GLYPH[M.loops[0][0]]+'.'):'')+'</p>';
  html+=archetypeCards();
  html+='<h3>Posições, dignidades, termos e estrelas</h3><table><tr><th>Ponto</th><th>Posição</th><th>Estado</th><th>Estrela (conjunções ≤ 1°)</th></tr>'+rows+stars+'</table>';
  html+='<div class="card"><div class="kicker">Lote do Espírito — o daimon</div><p style="font-size:.86rem">'+CONTEUDO.daimon+'</p></div>';
  html+='<div class="card"><div class="kicker">Sol e Lua — o eixo</div><p style="font-size:.86rem">'+CONTEUDO.solLua+'</p></div>';
  $('natal-body').innerHTML=html;
  // promessas — potenciais natais por múltiplos testemunhos
  const now=new Date();
  $('prom-body').innerHTML=(PROMESSAS.length?PROMESSAS:[]).map(pr=>{
    const act=(typeof scoreProm==='function')?scoreProm(pr,now):{score:0,tier:'—',factors:[]};
    return '<div class="prom" data-id="'+pr.id+'">'
    +'<div class="p-t">'+pr.t+' <span class="prom-cond '+pr.cond+'">'+pr.cond+'</span> <span class="mono" style="color:var(--dim2)">· '+PT_NAME[pr.pl]+' · casas '+pr.casas.join(', ')+'</span></div>'
    +'<div class="p-b"><b>Potencial natal:</b> '+pr.fat
    +'<br><b>Condições de manifestação:</b> '+pr.cond_manif
    +'<br><b>Facilitadores:</b> '+pr.facilit+'<br><b>Pontos de atenção:</b> '+pr.atencao
    +'<br><b>Testemunhos que a sustentam ('+pr.testemunhos.length+'):</b> '+pr.testemunhos.join('; ')
    +'<br><b>'+pr.tec+'</b>'
    +'<br><b>Ativação hoje:</b> <span class="mono">'+act.tier+' ('+act.score+')</span>'+(act.factors.length?(' — '+act.factors.map(f=>'+'+f[0]+' '+f[1]).join('; ')):'')
    +'<br><b>Anos de maior ativação:</b> '+(pr.anos.join(', ')||'—')
    +'<br><span class="mono" style="color:var(--dim2)">clique de novo para desmarcar na linha do tempo</span></div></div>';
  }).join('')||'<p class="mono">Nenhuma promessa com dois ou mais testemunhos convergentes foi detectada.</p>';
  $('prom-body').onclick=e=>{
    const el=e.target.closest('.prom'); if(!el)return;
    const id=el.dataset.id;
    document.querySelectorAll('.prom').forEach(x=>x.classList.toggle('on',x===el&&ACTIVE_PROM!==id));
    ACTIVE_PROM=ACTIVE_PROM===id?null:id;
    renderLedger(); drawCord();
  };
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
      s+='<circle cx="'+x+'" cy="'+y+'" r="17" fill="rgba(233,236,240,.06)" stroke="var(--ivory)" stroke-width="1"/>';
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
/* corda HORIZONTAL — GRÁFICO DE BARRAS (Gantt) sobre o calendário.
   FIRDÁRIA: barras contíguas por período (planeta).
   SUB-FIRDÁRIA: barra INTERNA aninhada na base de cada barra de firdária.
   PROFECÇÃO: barra por ano (casa). REVOLUÇÕES: barra por ano (Asc·Senhor).
   Cursor com data; chips de profecção e revolução no cursor. */
function drawCord(){
  const svg=$('cord'); const W=svg.clientWidth||1240,H=326;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  const [t0,t1]=cordRange();
  const L=140, R=26;
  const XX=t=>L+((t-t0)/(t1-t0))*(W-L-R);
  const IVO='#f2f3f6', DIM='#aeb2ba', DIM2='#7b8089', LINE='rgba(255,255,255,.12)';
  let s='<defs>'
    +'<filter id="soft" x="-30%" y="-60%" width="160%" height="220%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity=".6"/></filter>'
    +'<filter id="glow" x="-40%" y="-80%" width="180%" height="260%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#9fd6e6" flood-opacity=".6"/></filter>'
    +'</defs>';
  const rowLbl=(y,txt)=>{s+='<text x="10" y="'+y+'" font-size="10" font-family="IBM Plex Mono" letter-spacing="2.4" fill="'+DIM2+'">'+txt+'</text>';};
  const clampX=x=>Math.max(L,Math.min(W-R,x));
  const byY=new Date(BIRTH).getUTCFullYear();
  const cursAge=ageAt(CURSOR);
  const years=(t1-t0)/DAY/365.25;
  const selY=rsYearOf(CURSOR);

  // banda de fundo (trilha) de uma faixa
  const track=(y,h)=>{s+='<rect x="'+L+'" y="'+y+'" width="'+(W-L-R)+'" height="'+h+'" rx="7" fill="rgba(255,255,255,.02)" stroke="'+LINE+'" stroke-width=".7"/>';};

  // ===== FIRDÁRIA (barras) + SUB-FIRDÁRIA (barra interna) =====
  rowLbl(40,'FIRDÁRIA');
  const FY=28, FH=110, SUBY=FY+FH-34, SUBH=30; // bloco firdária + faixa interna da sub
  track(FY,FH);
  s+='<line x1="'+L+'" y1="'+SUBY+'" x2="'+(W-R)+'" y2="'+SUBY+'" stroke="'+LINE+'"/>';
  let age0=0;
  FIRD.forEach(([k,nm,len])=>{
    const a=BIRTH+age0*365.2425*DAY,b=BIRTH+(age0+len)*365.2425*DAY;const yA=byY+Math.round(age0);const now=cursAge>=age0&&cursAge<age0+len;age0+=len;
    if(b<t0||a>t1)return;
    const x=clampX(XX(a)), x2=clampX(XX(b)), w=x2-x;
    const col=FIRD_COLORS[nm]||'#8a8f98';
    // barra da firdária: preenchimento tênue + faixa de acento no topo
    s+='<rect x="'+x+'" y="'+FY+'" width="'+w+'" height="'+FH+'" rx="8" fill="'+col+'" fill-opacity=".1" stroke="'+col+'" stroke-opacity=".4" stroke-width="1"/>';
    s+='<rect x="'+x+'" y="'+FY+'" width="'+w+'" height="5" rx="2.5" fill="'+col+'"/>';
    if(now)s+='<rect x="'+x+'" y="'+FY+'" width="'+w+'" height="'+FH+'" rx="8" fill="none" stroke="#9fd6e6" stroke-width="1.8" filter="url(#glow)"/>';
    if(w>66){
      s+='<text x="'+(x+12)+'" y="'+(FY+30)+'" font-size="18" font-family="Cormorant Garamond" fill="'+IVO+'">'+(PT_GLYPH[k]||'')+'</text>';
      s+='<text x="'+(x+34)+'" y="'+(FY+30)+'" font-size="13" font-family="Inter" font-weight="600" fill="'+IVO+'">'+nm+'</text>';
      s+='<text x="'+(x+12)+'" y="'+(FY+46)+'" font-size="9.5" font-family="IBM Plex Mono" fill="'+DIM2+'">'+yA+'–'+(yA+len)+' · '+len+' anos</text>';
    } else if(w>16){
      s+='<text x="'+(x+w/2)+'" y="'+(FY+28)+'" text-anchor="middle" font-size="15" font-family="Cormorant Garamond" fill="'+DIM+'">'+(PT_GLYPH[k]||nm[0])+'</text>';
    }
  });
  // barra interna: SUB-FIRDÁRIA (segmentos aninhados na base da firdária)
  s+='<text x="10" y="'+(SUBY+19)+'" font-size="8" font-family="IBM Plex Mono" letter-spacing="1.5" fill="'+DIM2+'">sub</text>';
  for(let a=0;a<75;){
    const f=firdAt(a); const st=f.subStart,en=f.subEnd;
    if(!st){a+=0.02;continue;}
    const enAge=(en-BIRTH)/DAY/365.2425;
    if(!(en<t0||st>t1)){
      const x=clampX(XX(st)), x2=clampX(XX(en)), w=x2-x;
      const now=cursAge>=(st-BIRTH)/DAY/365.2425&&cursAge<enAge;
      const col=FIRD_COLORS[PT_NAME[f.subKey]]||'#8a8f98';
      s+='<rect x="'+(x+.5)+'" y="'+(SUBY+3)+'" width="'+Math.max(1,w-1)+'" height="'+(SUBH-6)+'" rx="4" fill="'+col+'" fill-opacity="'+(now?'.4':'.16')+'" stroke="'+col+'" stroke-opacity=".4" stroke-width=".6"/>';
      if(w>15)s+='<text x="'+(x+w/2)+'" y="'+(SUBY+19)+'" text-anchor="middle" font-size="11" font-family="Cormorant Garamond" fill="'+(now?IVO:DIM)+'">'+(PT_GLYPH[f.subKey]||'')+'</text>';
    }
    a=enAge>a+1e-4?enAge:a+0.02;
  }

  // ===== PROFECÇÃO (barra por ano) =====
  rowLbl(160,'PROFECÇÃO');
  const PY=150, PH=40;
  track(PY,PH);
  for(let yr=0;yr<75;yr++){
    const a=BIRTH+yr*365.2425*DAY,b=BIRTH+(yr+1)*365.2425*DAY;
    if(b<t0||a>t1)continue;
    const p=profAt(yr), now=Math.floor(cursAge)===yr, mal=[6,8,12].includes(p.houseN);
    const x=clampX(XX(a)), x2=clampX(XX(b)), w=x2-x;
    if(w<1.5)continue;
    const col=mal?'#b06a61':'#8fa3bb';
    s+='<rect x="'+(x+.6)+'" y="'+(PY+3)+'" width="'+Math.max(1,w-1.2)+'" height="'+(PH-6)+'" rx="4" fill="'+col+'" fill-opacity="'+(now?'.34':'.12')+'" stroke="'+col+'" stroke-opacity="'+(now?'.7':'.3')+'" stroke-width="'+(now?1.2:.6)+'"/>';
    if(w>58)s+='<text x="'+(x+w/2)+'" y="'+(PY+25)+'" text-anchor="middle" font-size="11" font-family="Inter" fill="'+IVO+'">casa '+p.houseN+' · '+SG[p.signIdx]+'</text>';
    else if(w>14)s+='<text x="'+(x+w/2)+'" y="'+(PY+26)+'" text-anchor="middle" font-size="13" font-family="Cormorant Garamond" fill="'+(now?IVO:DIM)+'">'+p.houseN+'</text>';
  }

  // ===== REVOLUÇÕES (barra por ano) =====
  rowLbl(232,'REVOLUÇÕES');
  const RY=222, RH=40;
  track(RY,RH);
  Object.keys(RS_DATA).forEach(y=>{
    const a=Date.UTC(+y,new Date(BIRTH).getUTCMonth(),new Date(BIRTH).getUTCDate());
    const b=a+365.2425*DAY;
    if(b<t0||a>t1)return;
    const on=+y===selY;
    const x=clampX(XX(a)), x2=clampX(XX(b)), w=x2-x;
    if(w<1.5)return;
    const rs=RS_DATA[y]; let sg=null; if(rs&&rs.raw&&rs.raw.asc!=null)sg=signOf(rs.raw.asc);
    const col=sg!=null?'#c9b78a':'#8a8f98';
    s+='<rect data-rs="'+y+'" x="'+(x+.6)+'" y="'+(RY+3)+'" width="'+Math.max(1,w-1.2)+'" height="'+(RH-6)+'" rx="4" fill="'+col+'" fill-opacity="'+(on?'.34':'.12')+'" stroke="'+col+'" stroke-opacity="'+(on?'.7':'.3')+'" stroke-width="'+(on?1.2:.6)+'" style="cursor:pointer"><title>Revolução '+y+'</title></rect>';
    if(w>78&&sg!=null)s+='<text data-rs="'+y+'" x="'+(x+w/2)+'" y="'+(RY+25)+'" text-anchor="middle" font-size="10.5" font-family="IBM Plex Mono" fill="'+IVO+'" style="cursor:pointer">'+y+' · '+SG[sg]+' '+PT_GLYPH[SIGN_RULER[sg]]+'</text>';
    else if(w>46)s+='<text data-rs="'+y+'" x="'+(x+w/2)+'" y="'+(RY+25)+'" text-anchor="middle" font-size="9.5" font-family="IBM Plex Mono" fill="'+(on?IVO:DIM)+'" style="cursor:pointer">'+(''+y).slice(2)+(sg!=null?(' '+SG[sg]):'')+'</text>';
    else if(w>22)s+='<text data-rs="'+y+'" x="'+(x+w/2)+'" y="'+(RY+25)+'" text-anchor="middle" font-size="9.5" font-family="IBM Plex Mono" fill="'+(on?IVO:DIM)+'" style="cursor:pointer">'+(''+y).slice(2)+'</text>';
    else if(on&&sg!=null)s+='<text x="'+(x+w/2)+'" y="'+(RY+25)+'" text-anchor="middle" font-size="11" font-family="Cormorant Garamond" fill="'+IVO+'">'+SG[sg]+'</text>';
  });
  EVENTS.forEach(ev=>{const t=new Date(ev.d).getTime(); if(t<t0||t>t1)return;
    s+='<path d="M '+clampX(XX(t))+' '+(RY+RH+2)+' l 5 5 l -5 5 l -5 -5 z" fill="#c7bce0"><title>'+esc(ev.txt)+' ('+ev.d+')</title></path>';});

  // ===== régua (calendário) =====
  const tick=years>30?10:years>8?2:years>1.5?0.5:years>0.1?1/12:1/365;
  for(let yy=Math.ceil((t0-BIRTH)/DAY/365.2425/tick)*tick;;yy+=tick){
    const t=BIRTH+yy*365.2425*DAY;if(t>t1)break;
    const x=XX(t), d=new Date(t);
    s+='<line x1="'+x+'" y1="292" x2="'+x+'" y2="297" stroke="'+LINE+'"/>';
    const lbl=tick>=1?String(d.getUTCFullYear()):tick>=1/12?MESES[d.getUTCMonth()]:String(d.getUTCDate());
    s+='<text x="'+x+'" y="308" text-anchor="middle" font-size="9" font-family="IBM Plex Mono" fill="'+DIM2+'">'+lbl+'</text>';
  }

  // ===== pino A + cursor + chips =====
  if(PINNED){const px=clampX(XX(PINNED.getTime()));s+='<line x1="'+px+'" y1="'+FY+'" x2="'+px+'" y2="290" stroke="'+DIM+'" stroke-width="1" stroke-dasharray="3 4"/>';}
  const cx=clampX(XX(CURSOR.getTime()));
  s+='<line x1="'+cx+'" y1="'+(FY-10)+'" x2="'+cx+'" y2="290" stroke="'+IVO+'" stroke-width="1.4"/>'
    +'<path d="M '+cx+' '+(FY-18)+' l 6 8 l -6 8 l -6 -8 z" fill="'+IVO+'"/>';
  const chip=(cxp,y,txt)=>{const pw=txt.length*6.1+18, px=Math.max(L,Math.min(W-R-pw,cxp-pw/2));
    s+='<rect x="'+px+'" y="'+y+'" width="'+pw+'" height="20" rx="10" fill="#14151b" stroke="#fff" stroke-opacity=".28" filter="url(#soft)"/>'
      +'<text x="'+(px+pw/2)+'" y="'+(y+13.5)+'" text-anchor="middle" font-size="10.5" font-family="Inter" font-weight="600" fill="'+IVO+'">'+txt+'</text>';};
  chip(cx,0,fdate(CURSOR));
  const pc=profAt(cursAge);
  chip(cx,PY+PH+3,'Profecção · casa '+pc.houseN+' · '+SIGNS[pc.signIdx]+' · Senhor '+PT_NAME[pc.lordKey]);
  const ry=rsYearOf(CURSOR), rr=RS_DATA[ry];
  if(rr&&rr.raw&&rr.raw.asc!=null){const sg=signOf(rr.raw.asc);
    chip(cx,RY+RH+6,'Revolução '+ry+' · Asc '+SIGNS[sg]+' · Senhor '+PT_NAME[SIGN_RULER[sg]]);}
  svg.innerHTML=s;
}
function cordDrag(){
  const svg=$('cord'); let dragging=false;
  const pick=e=>{
    const r=svg.getBoundingClientRect();
    const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
    const W=r.width, L=140*(W/(svg.viewBox.baseVal.width||W)), R=26*(W/(svg.viewBox.baseVal.width||W));
    const [t0,t1]=cordRange();
    const t=t0+((x-L)/(W-L-R))*(t1-t0);
    if(isFinite(t)){CURSOR=new Date(Math.max(BIRTH,Math.min(BIRTH+75*365.2425*DAY,t)));syncTempo();}
  };
  svg.addEventListener('pointerdown',e=>{
    const rs=e.target&&e.target.closest&&e.target.closest('[data-rs]');
    if(rs){const y=rs.dataset.rs;const b=new Date(BIRTH);CURSOR=new Date(Date.UTC(+y,b.getUTCMonth(),b.getUTCDate(),b.getUTCHours()));syncTempo();return;}
    dragging=true;pick(e);});
  window.addEventListener('pointermove',e=>{if(dragging)pick(e);});
  window.addEventListener('pointerup',()=>dragging=false);
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
  const T='rgba(255,255,255,.08)';
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
function syncTempo(){
  if(!NATAL){$('tempo-info').innerHTML=emptyState();$('fird-ledger').innerHTML='';return;}
  $('tempo-date').textContent=fdate(CURSOR)+' · '+Math.floor(ageAt(CURSOR))+' anos';
  $('tempo-pick').value=CURSOR.toISOString().slice(0,10);
  drawCord();
  const age=ageAt(CURSOR), f=firdAt(age), p=profAt(age), y=rsYearOf(CURSOR), rs=RS_DATA[y];
  const conv=convergence(CURSOR);
  let html='<div class="card mandala-card"><div class="kicker">diagrama temporal — onde você está</div>'
    +'<div class="mandala-row">'+mandalaTempo(CURSOR)+'<div class="mandala-side">'+execCardHTML(Math.floor(Math.max(0,age)),false)+'</div></div>'
    +'<details class="rep-det"><summary>hierarquia das camadas — o que cada técnica responde</summary>'+hierarquiaHTML()+'</details></div>';
  html+='<div class="card"><div class="kicker">Revolução '+y+'</div>'+(rs?('<p style="font-size:.8rem"><b style="color:var(--ivory)">'+rs.asc+'</b></p><p style="font-size:.78rem">'+rs.destaque+'</p>'):'<p>sem RS registrada.</p>')+'</div>';
  const top=scoredHits(CURSOR,0).slice(0,3);
  html+='<div class="card"><div class="kicker">ativações no cursor</div>'+(top.map(h=>renderHit(h,CURSOR,false)).join('')||'<p>—</p>')+'</div>';
  // oportunidades e cautelas do período apontado
  const favs=[],caus=[];
  top.forEach(h=>{const o=orient(h,CURSOR);o.fav.forEach(x=>favs.indexOf(x)<0&&favs.push(x));o.cau.forEach(x=>caus.indexOf(x)<0&&caus.push(x));});
  if(favs.length||caus.length)
    html+='<div class="card"><div class="kicker">oportunidades</div><p style="font-size:.8rem;color:var(--green)">'+(favs.slice(0,5).join(' · ')||'—')+'</p>'
      +'<div class="kicker" style="margin-top:8px">cautelas</div><p style="font-size:.8rem;color:var(--red)">'+(caus.slice(0,5).join(' · ')||'—')+'</p></div>';
  $('tempo-info').innerHTML=html;
  renderCompare();
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
  const promYears=ACTIVE_PROM?PROMESSAS.find(p=>p.id===ACTIVE_PROM).anos:[];
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
  const proms=PROMESSAS.filter(pr=>pr.anos.includes(rsYearOf(d)));
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
function renderRS(){
  if(!NATAL||!Object.keys(RS_DATA).length){$('rs-body').innerHTML=emptyState();return;}
  const sel=$('rs-year');
  const by=new Date(BIRTH).getUTCFullYear();
  const years=Object.keys(RS_DATA).sort();
  const want=years.join(',');
  if(sel.dataset.built!==want){ // reconstrói ao trocar o conjunto de anos (novo mapa/RS) — idade pela data real de nascimento
    const prev=sel.value;
    sel.innerHTML='';
    years.forEach(y=>{const o=document.createElement('option');const a=+y-by;o.value=y;o.textContent='RS '+y+' · '+a+(a===1?' ano':' anos');sel.appendChild(o);});
    sel.value=years.includes(prev)?prev:(years.includes(String(rsYearOf(new Date())))?String(rsYearOf(new Date())):(years.slice(-1)[0]||''));
    sel.dataset.built=want;
    sel.onchange=renderRS;
    $('rs-cmp').onclick=()=>{renderRS(true);};
  }
  const kick=$('rs-kicker'); if(kick)kick.textContent='retornos solares · '+by+'–'+(new Date().getUTCFullYear()+1);
  const y=+sel.value, rs=RS_DATA[y], a=y-by, p=profAt(a), f=firdAt(a+0.05);
  const block=(yy,rr,aa)=>{
    const pp=profAt(aa),ff=firdAt(aa+0.05);
    return '<div class="card"><div class="kicker">Revolução Solar '+yy+' · '+aa+' anos · firdária de '+ff.major+' (sub-período de '+ff.sub+') · profecção: casa '+pp.houseN+' em '+pp.sign+' · Senhor do Ano: '+PT_NAME[pp.lordKey]+'</div>'
      +(rr?('<p class="lede" style="font-size:1rem">'+rr.asc+'</p><p style="font-size:.85rem">'+rr.destaque+'</p><p style="font-size:.8rem;color:var(--gold)">'+rr.estrelas+'</p>')
          :'<p>Sem RS registrada para '+yy+'. Adicione em RS_DATA['+yy+'] (js/data.js).</p>')
      +'<div class="mono" style="margin-top:6px">'+synthYear(aa,pp,ff)+'</div>'
      +(rr&&rr.raw?('<details style="margin-top:8px"><summary class="mono" style="cursor:pointer">posições informadas</summary><table><tr><th>Ponto</th><th>Posição</th><th>Casa RS</th></tr>'+Object.entries(rr.raw.pts).map(([k,pp2])=>'<tr><td class="g">'+(PT_GLYPH[k]||k)+' '+(PT_FULL[k]||k)+'</td><td class="m">'+zfmt(pp2.lon)+(pp2.retro?' ℞':'')+'</td><td class="m">'+(pp2.h||'—')+'</td></tr>').join('')+'</table></details>'):'')+'</div>';
  };
  let html=block(y,rs,a);
  if(arguments[0]===true&&RS_DATA[y+1]!==undefined){
    html+='<h3>Ano seguinte</h3>'+block(y+1,RS_DATA[y+1],a+1);
    const pa=profAt(a),pb=profAt(a+1),fa=firdAt(a+0.05),fb=firdAt(a+1.05);
    html+='<div class="card"><div class="kicker">diferença de clima</div><p style="font-size:.82rem">'
      +(fa.major!==fb.major?('Troca de era: '+fa.major+' → '+fb.major+'. '):(fa.sub!==fb.sub?('Sub-firdária muda: '+fa.sub+' → '+fb.sub+'. '):'Mesma firdária. '))
      +'Profecção passa da casa '+pa.houseN+' ('+HOUSE_SHORT[pa.houseN]+') para a casa '+pb.houseN+' ('+HOUSE_SHORT[pb.houseN]+'); Senhor do Ano '
      +(pa.lordKey===pb.lordKey?('permanece '+PT_NAME[pa.lordKey]):('muda de '+PT_NAME[pa.lordKey]+' para '+PT_NAME[pb.lordKey]))+'.</p></div>';
  }
  $('rs-body').innerHTML=html;
}

/* ================= TRÂNSITOS (4 modos) ================= */
let TMODE='hoje';
const AREAS={identidade:[1],dinheiro:[2,8],estudos:[3,9],'residência':[4],criatividade:[5],'saúde e rotina':[6],relacionamentos:[7],carreira:[10],grupos:[11],'assuntos privados':[12]};
function transDate(){const v=$('trans-pick').value;return v?new Date(v+'T12:00:00Z'):new Date();}
function renderTrans(){
  if(!NATAL){$('trans-body').innerHTML=emptyState();return;}
  $('trans-eph').textContent='· efemérides: '+(usingAE?'Astronomy Engine':'longitudes médias (aprox.)');
  const d=transDate();
  let html='';
  if(TMODE==='hoje'){
    const top=scoredHits(d,0).slice(0,3);
    html='<h3>Três ativações principais — '+fdate(d)+'</h3>'+(top.map(h=>renderHit(h,d,true)).join('')||'<div class="card">céu em silêncio.</div>');
  }
  if(TMODE==='30d'){
    const ev=scanEvents(d,30);
    html='<h3>Próximos 30 dias a partir de '+fdate(d)+'</h3>';
    const fav=ev.filter(e=>e.cls==='harm'),ten=ev.filter(e=>e.cls==='tens');
    html+='<div class="grid2"><div class="card"><div class="kicker">janelas favoráveis</div>'+(fav.slice(0,8).map(e=>'<div class="evrow harm"><span class="d">'+fdate(e.d)+'</span><span class="t">'+e.txt+'</span></div>').join('')||'—')+'</div>'
      +'<div class="card"><div class="kicker">períodos tensos</div>'+(ten.slice(0,8).map(e=>'<div class="evrow tens"><span class="d">'+fdate(e.d)+'</span><span class="t">'+e.txt+'</span></div>').join('')||'—')+'</div></div>';
    html+='<div class="card"><div class="kicker">cronologia completa: exatos, ingressos, estações, lunações, passagens</div>'
      +ev.map(e=>'<div class="evrow '+e.cls+'"><span class="d">'+fdate(e.d)+'</span><span class="t">'+e.txt+'</span></div>').join('')+'</div>';
  }
  if(TMODE==='planeta'){
    html='<div class="toolrow"><select id="tp-sel">'+TB.map(t=>'<option value="'+t[1]+'">'+t[2]+' '+PT_NAME[t[1]]+'</option>').join('')+'</select></div><div id="tp-out"></div>';
  }
  if(TMODE==='area'){
    html='<div class="toolrow"><select id="ta-sel">'+Object.keys(AREAS).map(a=>'<option>'+a+'</option>').join('')+'</select></div><div id="ta-out"></div>';
  }
  $('trans-body').innerHTML=html;
  if(TMODE==='planeta'){$('tp-sel').onchange=()=>renderTransPlanet(d);renderTransPlanet(d);}
  if(TMODE==='area'){$('ta-sel').onchange=()=>renderTransArea(d);renderTransArea(d);}
}
function renderTransPlanet(d){
  const key=$('tp-sel').value, bn=TB.find(t=>t[1]===key)[0], g=TB.find(t=>t[1]===key)[2];
  const L=tlon(bn,d), house=houseOfLon(L), spd=speedOf(bn,d);
  const hits=scoredHits(d,0).filter(h=>h.tKey===key);
  const age=ageAt(d), f=firdAt(age), p=profAt(age);
  const roles=[];
  if(key===f.majorKey)roles.push('senhor da firdária maior');
  if(key===f.subKey)roles.push('senhor da sub-firdária');
  if(key===p.lordKey)roles.push('Senhor do Ano');
  if(ruledHouses(key).includes(p.houseN))roles.push('rege a casa profectada');
  // próximas ativações 90d
  const nexts=[];
  for(let i=1;i<=90&&nexts.length<5;i++){
    const dd=new Date(d.getTime()+i*DAY);
    transitHits(dd).filter(h=>h.tKey===key&&h.orb<0.3).forEach(h=>{
      const k2=h.gl+h.np.nm; if(!nexts.find(n=>n.k===k2)) nexts.push({k:k2,d:dd,h});
    });
  }
  $('tp-out').innerHTML='<div class="card"><div class="kicker">'+g+' '+PT_NAME[key]+' em '+fdate(d)+'</div>'
    +'<p style="font-size:.85rem"><b style="color:var(--ivory)">'+zfmt(L)+'</b> · transita a <b>casa natal '+house+'</b> ('+HOUSE_SIG[house].s+') · '+(spd<0?'retrógrado':'direto')
    +(roles.length?(' · <span class="tag gold">'+roles.join(' · ')+'</span>'):'')+'</p>'
    +'<h4>Aspectos ao natal agora</h4>'+(hits.map(h=>renderHit(h,d,false)).join('')||'<p>nenhum em orbe.</p>')
    +'<h4>Próximas ativações exatas (90 dias)</h4>'+(nexts.map(n=>'<div class="evrow info"><span class="d">'+fdate(n.d)+'</span><span class="t">'+g+' '+n.h.gl+' '+n.h.np.g+' '+n.h.np.nm+' natal — toca também as casas '+(ruledHouses(n.h.nk).join(', ')||'—')+'</span></div>').join('')||'<p>—</p>')
    +'</div>';
}
function renderTransArea(d){
  const area=$('ta-sel').value, houses=AREAS[area];
  const hits=scoredHits(d,0).filter(h=>{
    const touched=[h.np.h].concat(ruledHouses(h.nk));
    return houses.some(x=>touched.includes(x));
  }).slice(0,6);
  $('ta-out').innerHTML='<div class="card"><div class="kicker">'+area+' · casas '+houses.join(', ')+' · '+fdate(d)+'</div>'
    +'<p style="font-size:.8rem">'+houses.map(h=>'casa '+h+': '+HOUSE_SIG[h].s).join(' · ')+'</p>'
    +(hits.map(h=>renderHit(h,d,true)).join('')||'<p>nenhuma ativação relevante nesta área hoje.</p>')+'</div>';
}

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

/* ================= PERFIL: temperamento + 48 eixos ================= */
function temperament(){return CHARTMETA.temper;}
function renderTemp(){
  if(!NATAL){$('temp-body').innerHTML=emptyState();return;}
  const t=temperament();
  const x=50+(t.dry/Math.max(1,t.Q.seco+t.Q['úmido']))*44;
  const y=50-(t.hot/Math.max(1,t.Q.quente+t.Q.frio))*44;
  const pair=t.humor==='colérico'?'quente e seco':t.humor==='sanguíneo'?'quente e úmido':t.humor==='melancólico'?'frio e seco':'frio e úmido';
  $('temp-body').innerHTML=
    '<p class="lede">Temperamento: <b style="color:var(--gold)">'+t.humor+'</b> — '+pair+' (quente '+t.Q.quente+' × frio '+t.Q.frio+' · seco '+t.Q.seco+' × úmido '+t.Q['úmido']+'). Confiança do veredicto: <b>'+t.conf+'%</b>.</p>'
    +'<div class="qmap"><div class="ax axh"></div><div class="ax axv"></div><div class="lb q2">quente · úmido</div><div class="lb q1">quente · seco</div><div class="lb q4">frio · úmido</div><div class="lb q3">frio · seco</div><div class="marker" style="left:'+x+'%;top:'+y+'%"></div></div>'
    +'<h3>Fatores e pesos</h3><table><tr><th>Testemunho</th><th>Qualidades</th><th>Peso</th></tr>'+t.fx.map(f=>'<tr><td>'+f[0]+'</td><td class="m">'+f[1]+'</td><td class="m">'+f[2]+'</td></tr>').join('')+'</table>'
    +'<div class="card"><div class="kicker">contradições internas</div><p style="font-size:.82rem">'+(t.contra.length?t.contra.map(c=>c[0]+' ('+c[1]+')').join('; ')+'.':'nenhuma — compleição unívoca.')+'</p></div>'
    +'<div class="note">Pesos: Asc + regente do Asc + planetas na I + Lua e fase (3) → estação do Sol (2, hemisfério norte) → senhor da genitura (1). Predisposição simbólica tradicional; não é diagnóstico.</div>';
}
function literalAxis(r,name,poles,dom){
  const pole=poles[r.poleIdx].toLowerCase();
  const SIT={'Energia e ação':'sob prazo, competição ou obstáculo físico','Afetividade e relações':'em vínculos próximos e negociações pessoais','Cognição':'ao estudar, argumentar e decidir','Organização e adaptação':'em rotina, planejamento e imprevistos','Valores e orientação':'em escolhas de rumo e dilemas morais','Identidade e conflito':'quando contrariado, avaliado ou exposto'};
  let q='';
  if(r.quality==='integrada') q='traço estável e disponível';
  else if(r.quality==='em disputa') q='traço em disputa: os dois polos aparecem alternadamente conforme o contexto';
  else q='traço difuso: aparece de forma irregular';
  return 'Comportamento: tende a <b>'+pole+'</b> '+(SIT[dom]||'')+' — '+q+'.'+(r.tension>0.65?' Sob estresse, o polo oposto irrompe.':'');
}
let AXCACHE=null;
function computeAllAxes(){
  if(AXCACHE)return AXCACHE;
  AXCACHE=[];
  AXES_CONFIG.forEach(([dom,sig,axes])=>{
    axes.forEach(([name,tests])=>{
      const r=computeAxis(name,tests.map(evalT),sig);
      AXCACHE.push({dom,sig,name,r,poles:name.split('–')});
    });
  });
  return AXCACHE;
}
function renderPers(){
  if(!NATAL){$('pers-body').innerHTML=emptyState();return;}
  const all=computeAllAxes();
  const domSel=$('ax-dom');
  if(domSel.options.length<=1) AXES_CONFIG.forEach(([d])=>{const o=document.createElement('option');o.textContent=d;domSel.appendChild(o);});
  const q=($('ax-search').value||'').toLowerCase(), df=domSel.value, sort=$('ax-sort').value;
  let list=all.filter(a=>(!df||a.dom===df)&&(!q||a.name.toLowerCase().includes(q)));
  if(sort==='val')list=list.slice().sort((a,b)=>b.r.inten-a.r.inten);
  if(sort==='conf')list=list.slice().sort((a,b)=>b.r.conf-a.r.conf);
  if(sort==='tens')list=list.slice().sort((a,b)=>b.r.tension-a.r.tension);
  let html='',lastDom='';
  list.forEach(a=>{
    if(sort==='dom'&&a.dom!==lastDom){html+='<div class="domtitle">'+a.dom+' · significador '+PT_NAME[a.sig]+'</div>';lastDom=a.dom;}
    const [pA,pB]=a.poles, r=a.r, pct=((r.val-1)/3)*100;
    html+='<div class="axrow"><div class="head"><span class="nm">'+a.name+'</span>'
      +'<span class="meta">'+r.val.toFixed(2)+' · '+(r.poleIdx===0?pA:pB)+' · int '+(r.inten*100|0)+'% · conf '+(r.conf*100|0)+'% · tensão '+(r.tension*100|0)+'% · '+r.quality+'</span></div>'
      +'<div class="axbar"><div class="mid"></div><div class="dot'+(r.conf<0.5?' weak':'')+(r.tension>0.65?' tense':'')+'" style="left:'+(100-pct)+'%"></div></div>'
      +'<div class="poles"><span>'+pA+' (1)</span><span>'+pB+' (4)</span></div>'
      +'<div class="lit">'+literalAxis(r,a.name,a.poles,a.dom)+'</div>'
      +'<div class="facts"><b style="color:var(--green)">a favor do polo dominante:</b> '+(r.facts.slice(0,4).join(' · ')||'—')
      +(r.tension>0.4?('<br><b style="color:var(--red)">contraditórios:</b> testemunhos do polo oposto somam '+(r.tension*100|0)+'% da força dominante'):'')+'</div></div>';
  });
  $('pers-body').innerHTML=html||'<p>nenhum eixo corresponde ao filtro.</p>';
}

/* ================= FONTES E MÉTODO ================= */
