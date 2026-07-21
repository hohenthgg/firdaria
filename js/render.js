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
  html+='<h3>Posições, dignidades, termos e estrelas</h3><table><tr><th>Ponto</th><th>Posição</th><th>Estado</th><th>Estrela (conjunções ≤ 1°)</th></tr>'+rows+stars+'</table>';
  html+='<div class="card flat" style="border-style:dashed"><p style="margin:0;font-size:.85rem">A leitura planeta a planeta — interpretação, diagrama e ficha curatorial — está na sala <b>Planetas</b>.</p></div>';
  html+='<div class="card"><div class="kicker">Lote do Espírito — o daimon</div><p style="font-size:.86rem">'+CONTEUDO.daimon+'</p></div>';
  html+='<div class="card"><div class="kicker">Sol e Lua — o eixo</div><p style="font-size:.86rem">'+CONTEUDO.solLua+'</p></div>';
  $('natal-body').innerHTML=html;
  // promessas
  $('prom-body').innerHTML=PROMESSAS.map(pr=>'<div class="prom" data-id="'+pr.id+'">'
    +'<div class="p-t">'+pr.t+' <span class="mono" style="color:var(--dim2)">· '+PT_NAME[pr.pl]+' · casas '+pr.casas.join(', ')+'</span></div>'
    +'<div class="p-b"><b>Fatores natais:</b> '+pr.fat+'<br><b>Condição de realização:</b> '+pr.cond
    +'<br><b>Ajudam:</b> '+pr.ajuda+'<br><b>Impedem:</b> '+pr.impede
    +'<br><b>Técnicas que a ativam:</b> '+pr.tec
    +'<br><b>Anos de maior ativação:</b> '+pr.anos.join(', ')
    +'<br><span class="mono" style="color:var(--dim2)">clique de novo para desmarcar na corda do tempo</span></div></div>').join('');
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
  selWrap.innerHTML=keys.map(k=>'<button data-pl="'+k+'"'+(k===SEL_PL?' class="on"':'')+'><span class="g">'+PT_GLYPH[k]+'</span>'+PT_NAME[k]+'</button>').join('');
  selWrap.onclick=e=>{const b=e.target.closest('[data-pl]');if(!b)return;SEL_PL=b.dataset.pl;renderPlanetas();};
  const k=SEL_PL,p=NATAL.pts[k],it=interpPlanet(k);
  const sg=signOf(p.lon), ru=ruledHouses(k), rec=(NATAL.meta.receptions||[]).filter(r=>r.includes(PT_GLYPH[k]));
  const sectMal=(NATAL.sect==='diurno'&&k==='mars')||(NATAL.sect==='noturno'&&k==='saturn');
  const sectBen=(NATAL.sect==='diurno'&&k==='jupiter')||(NATAL.sect==='noturno'&&k==='venus');
  const lord=Object.keys(STR).sort((a,b)=>STR[b]-STR[a])[0];
  const prom=PROMESSAS.find(pr=>pr.pl===k);
  const meta=(kk,vv)=>'<div class="m-k">'+kk+'</div><div class="m-v">'+vv+'</div>';
  const html='<div class="exh">'
    +'<div class="exh-l">'
      +'<div class="x-name">'+p.nm+'</div>'
      +'<div class="x-sub">'+SIGNS[sg]+' · casa '+p.h+(p.hBack?(' · fundo na '+p.hBack):'')+(lord===k?' · senhor da genitura':'')+'</div>'
      +'<div class="x-frase">'+interpFrase(k)+'</div>'
      +'<div class="x-block"><b>Interpretação.</b> '+it.efe+'</div>'
      +'<div class="x-block"><b>Função.</b> '+it.fun+'</div>'
      +(prom?('<div class="x-block"><b>Promessa natal.</b> '+prom.fat+' '+prom.cond+'</div>'):'')
      +'<details><summary class="ik" style="cursor:pointer;padding:8px 0">aprofundar — as seis partes auditáveis ▾</summary>'
        +'<div class="isec"><span class="ik">1 · fator técnico</span><p>'+it.tec+'</p></div>'
        +'<div class="isec"><span class="ik">4 · manifestações possíveis</span><ul class="ilist">'+it.manif.map(m=>'<li>'+m+'</li>').join('')+'</ul></div>'
        +'<div class="isec"><span class="ik">5 · expressão construtiva / problemática</span>'
          +'<div class="iexp alta" style="margin-bottom:8px"><span class="mono">construtiva</span><ul class="ilist">'+it.alta.map(m=>'<li>'+m+'</li>').join('')+'</ul></div>'
          +'<div class="iexp baixa"><span class="mono">problemática · sob aflição</span><ul class="ilist">'+it.baixa.map(m=>'<li>'+m+'</li>').join('')+'</ul></div></div>'
        +'<div class="isec"><span class="ik">6 · fundamento visível</span><p class="mono" style="font-size:.68rem;line-height:1.7">'+it.fund+'</p>'
          +'<div class="isrc"><button class="btn" data-loadsrc="'+k+'">consultar fontes do corpus</button></div></div>'
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

/* ================= TEMPO: corda + mandala + razão + retrospectiva ================= */
let ZOOM='vida', ANIM=null;
const ZSPAN={vida:75*365.2425,decada:3652.5,ano:365.25,mes:30.44,dia:1};
function cordRange(){
  const span=ZSPAN[ZOOM]*DAY;
  if(ZOOM==='vida') return [BIRTH,BIRTH+span];
  const c=CURSOR.getTime();
  return [c-span/2,c+span/2];
}
/* corda curatorial: linha fina, capítulos translúcidos com folga (lego),
   profecções como marcações anuais, RS como pontos selecionáveis,
   eventos como inscrições, cursor com data. */
function drawCord(){
  const svg=$('cord'); const W=svg.clientWidth||1000,H=232;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  const [t0,t1]=cordRange();
  const L=112, R=14;
  const XX=t=>L+((t-t0)/(t1-t0))*(W-L-R);
  let s='';
  const lbl=(y,txt)=>{s+='<text x="6" y="'+y+'" font-size="7.5" font-family="IBM Plex Mono" letter-spacing="2.2" fill="#646b76">'+txt+'</text>';};
  const IVO='#e8eaed', DIM='#9aa1ab', DIM2='#646b76', LINE='#22262d', LINE2='#31363f';
  // bloco "lego": recuo lateral, canto arredondado, preenchimento translúcido + fio da mesma cor
  const block=(xa,xb,y,h,col,op)=>{
    const x=Math.max(XX(Math.max(xa,t0)),L), x2=Math.min(XX(Math.min(xb,t1)),W-R);
    const w=Math.max(1.5,x2-x-3);
    s+='<rect x="'+(x+1.5)+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+Math.min(6,h/2.6)+'" fill="'+col+'" fill-opacity="'+op+'" stroke="'+col+'" stroke-opacity=".5" stroke-width=".7"/>';
    return {x:x+1.5,w};
  };
  // 1 — FIRDÁRIA: capítulos
  lbl(36,'FIRDÁRIA');
  let age0=0;
  const byY=new Date(BIRTH).getUTCFullYear();
  FIRD.forEach(([k,nm,len])=>{
    const a=BIRTH+age0*365.2425*DAY,b=BIRTH+(age0+len)*365.2425*DAY;const yA=byY+Math.round(age0);age0+=len;
    if(b<t0||a>t1)return;
    const r=block(a,b,16,34,FIRD_COLORS[nm]||'#888',.14);
    if(r.w>72){
      s+='<text x="'+(r.x+9)+'" y="'+31+'" font-size="12" font-family="Cormorant Garamond" fill="'+IVO+'">'+(PT_GLYPH[k]||'')+'</text>';
      s+='<text x="'+(r.x+22)+'" y="'+31+'" font-size="9.5" font-family="Inter" fill="'+IVO+'">'+nm+'</text>';
      s+='<text x="'+(r.x+9)+'" y="'+43+'" font-size="7" font-family="IBM Plex Mono" fill="'+DIM2+'">'+yA+'–'+(yA+len)+'</text>';
    } else if(r.w>16){
      s+='<text x="'+(r.x+r.w/2)+'" y="'+36+'" text-anchor="middle" font-size="12" font-family="Cormorant Garamond" fill="'+DIM+'">'+(PT_GLYPH[k]||nm[0])+'</text>';
    }
  });
  // 2 — SUB: subdivisões finas
  lbl(65,'SUB');
  for(let a=0;a<75;){
    const f=firdAt(a); const st=f.subStart,en=f.subEnd;
    if(!st){a+=0.02;continue;}
    const enAge=(en-BIRTH)/DAY/365.2425;
    if(!(en<t0||st>t1)){
      const r=block(st,en,58,11,FIRD_COLORS[f.sub]||'#888',.22);
      if(r.w>20)s+='<text x="'+(r.x+r.w/2)+'" y="'+66.5+'" text-anchor="middle" font-size="8.5" font-family="Cormorant Garamond" fill="'+DIM+'">'+(PT_GLYPH[f.subKey]||'')+'</text>';
    }
    a=enAge>a+1e-4?enAge:a+0.02;
  }
  // 3 — PROFECÇÃO: marcações anuais discretas (casa do ano)
  lbl(89,'PROFECÇÃO');
  for(let yr=0;yr<75;yr++){
    const a=BIRTH+yr*365.2425*DAY,b=BIRTH+(yr+1)*365.2425*DAY;
    if(b<t0||a>t1)continue;
    const p=profAt(yr), mal=[6,8,12].includes(p.houseN);
    const xa=XX(Math.max(a,t0)), xb=XX(Math.min(b,t1));
    s+='<line x1="'+xa+'" y1="80" x2="'+xa+'" y2="92" stroke="'+LINE2+'" stroke-width=".7"/>';
    if(mal) s+='<rect x="'+xa+'" y="80" width="'+Math.max(1,xb-xa)+'" height="12" fill="#b06a61" fill-opacity=".12"/>';
    if(xb-xa>=17) s+='<text x="'+((xa+xb)/2)+'" y="'+89.5+'" text-anchor="middle" font-size="8" font-family="IBM Plex Mono" fill="'+(mal?'#b06a61':DIM)+'">'+p.houseN+'</text>';
    const y1=byY+yr;
    if(ACTIVE_PROM&&PROMESSAS.find(p2=>p2.id===ACTIVE_PROM)&&PROMESSAS.find(p2=>p2.id===ACTIVE_PROM).anos.includes(y1))
      s+='<rect x="'+xa+'" y="12" width="'+Math.max(1,xb-xa)+'" height="160" fill="none" stroke="#7da28d" stroke-width=".9" opacity=".65" rx="4"/>';
  }
  // 4 — REVOLUÇÕES: pontos selecionáveis sobre uma linha fina
  lbl(112,'REVOLUÇÕES');
  s+='<line x1="'+L+'" y1="108" x2="'+(W-R)+'" y2="108" stroke="'+LINE+'"/>';
  const selY=rsYearOf(CURSOR);
  Object.keys(RS_DATA).forEach(y=>{
    const t=Date.UTC(+y,new Date(BIRTH).getUTCMonth(),new Date(BIRTH).getUTCDate());
    if(t<t0||t>t1)return;
    const on=+y===selY;
    s+='<circle data-rs="'+y+'" cx="'+XX(t)+'" cy="108" r="'+(on?5.2:3.6)+'" fill="'+(on?IVO:'#0e1013')+'" stroke="'+(on?IVO:DIM2)+'" stroke-width="1" style="cursor:pointer"><title>Revolução Solar '+y+' — clique para levar o cursor</title></circle>';
  });
  // 5 — TRÂNSITOS LENTOS: faixas quase transparentes com o signo
  if(ZOOM!=='dia'){
    lbl(133,'JÚPITER'); lbl(149,'SATURNO');
    const stepD=ZOOM==='vida'?120:ZOOM==='decada'?30:ZOOM==='ano'?7:1;
    [['Jupiter',126],['Saturn',142]].forEach(([bn,yy])=>{
      let prevSign=null,segStart=t0;
      for(let t=t0;t<=t1;t+=stepD*DAY){
        const sg=Math.floor(tlon(bn,new Date(t))/30);
        if(prevSign===null){prevSign=sg;segStart=t;}
        else if(sg!==prevSign||t+stepD*DAY>t1){
          const xa=XX(segStart), xb=XX(Math.min(t,t1));
          s+='<rect x="'+(xa+1)+'" y="'+yy+'" width="'+Math.max(1,xb-xa-2)+'" height="9" rx="3" fill="rgba(233,236,240,.05)" stroke="'+LINE2+'" stroke-width=".5"/>';
          if(xb-xa>26)s+='<text x="'+((xa+xb)/2)+'" y="'+(yy+7)+'" text-anchor="middle" font-size="7" font-family="IBM Plex Mono" letter-spacing="1" fill="'+DIM+'">'+SG[prevSign]+'</text>';
          prevSign=sg;segStart=t;
        }
      }
    });
  }
  // 6 — ATIVAÇÕES (zoom ano/mês/dia)
  if(ZOOM==='ano'||ZOOM==='mes'||ZOOM==='dia'){
    lbl(168,'ATIVAÇÕES');
    const step=ZOOM==='ano'?7:1;
    for(let t=t0;t<=t1;t+=step*DAY){
      const top=scoredHits(new Date(t),5);
      if(top.length){const h=top[0];
        s+='<circle cx="'+XX(t)+'" cy="164" r="'+Math.min(5.5,2+h.rel.score/3)+'" fill="'+(h.cls==='tens'?'#b06a61':h.cls==='harm'?'#7da28d':'#b9c1cd')+'" opacity=".85"><title>'+fdate(new Date(t))+': '+h.tg+' '+h.gl+' '+h.np.g+' ('+h.rel.tier+')</title></circle>';}
    }
  }
  // 7 — EVENTOS: pequenas inscrições
  if(EVENTS.length){
    lbl(184,'EVENTOS');
    EVENTS.forEach(ev=>{
      const t=new Date(ev.d).getTime(); if(t<t0||t>t1)return;
      const x=XX(t);
      s+='<path d="M '+x+' 176 l 3.4 3.6 l -3.4 3.6 l -3.4 -3.6 z" fill="#948dab"><title>'+esc(ev.txt)+' ('+ev.d+')</title></path>';
      if((t1-t0)<12*365*DAY) s+='<text x="'+(x+7)+'" y="'+183+'" font-size="7.5" font-family="IBM Plex Mono" fill="'+DIM2+'">'+esc(ev.txt.slice(0,22))+'</text>';
    });
  }
  // linha-base + régua
  s+='<line x1="'+L+'" y1="196" x2="'+(W-R)+'" y2="196" stroke="'+LINE2+'"/>';
  const years=(t1-t0)/DAY/365.25;
  const tick=years>30?10:years>8?2:years>1.5?0.5:years>0.1?1/12:1/365;
  for(let yy=Math.ceil((t0-BIRTH)/DAY/365.2425/tick)*tick;;yy+=tick){
    const t=BIRTH+yy*365.2425*DAY;if(t>t1)break;
    s+='<line x1="'+XX(t)+'" y1="196" x2="'+XX(t)+'" y2="201" stroke="'+LINE2+'"/>';
    const d=new Date(t);
    const tl=tick>=1?String(d.getUTCFullYear()):tick>=1/12?MESES[d.getUTCMonth()]:String(d.getUTCDate());
    s+='<text x="'+XX(t)+'" y="212" font-size="8" text-anchor="middle" font-family="IBM Plex Mono" fill="'+DIM2+'">'+tl+'</text>';
  }
  // pino A + cursor com data
  if(PINNED) s+='<line x1="'+XX(PINNED.getTime())+'" y1="10" x2="'+XX(PINNED.getTime())+'" y2="196" stroke="'+DIM+'" stroke-width="1" stroke-dasharray="3 4"/>';
  const cx=XX(CURSOR.getTime());
  s+='<line x1="'+cx+'" y1="10" x2="'+cx+'" y2="196" stroke="'+IVO+'" stroke-width="1"/>'
    +'<circle cx="'+cx+'" cy="196" r="3" fill="'+IVO+'"/>';
  const dtxt=fdate(CURSOR);
  const pw=dtxt.length*5.4+14, px=Math.max(L,Math.min(W-R-pw,cx-pw/2));
  s+='<rect x="'+px+'" y="0" width="'+pw+'" height="13" rx="6.5" fill="#171a20" stroke="'+LINE2+'" stroke-width=".7"/>'
    +'<text x="'+(px+pw/2)+'" y="9.5" text-anchor="middle" font-size="8" font-family="IBM Plex Mono" fill="'+IVO+'">'+dtxt+'</text>';
  s+='<text x="'+(W-6)+'" y="'+(H-6)+'" font-size="7.5" text-anchor="end" font-family="IBM Plex Mono" fill="'+DIM2+'">arraste · clique numa revolução · zoom: '+ZOOM+'</text>';
  svg.innerHTML=s;
}
function cordDrag(){
  const svg=$('cord'); let dragging=false;
  const pick=e=>{
    const r=svg.getBoundingClientRect();
    const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
    const W=r.width,L=112*(W/(svg.viewBox.baseVal.width||W));
    const [t0,t1]=cordRange();
    const t=t0+((x-L)/(W-L-14))*(t1-t0);
    if(isFinite(t)){CURSOR=new Date(Math.max(BIRTH,Math.min(BIRTH+75*365.2425*DAY,t)));syncTempo();}
  };
  svg.addEventListener('pointerdown',e=>{
    // ponto de Revolução: leva o cursor exatamente ao aniversário daquele ano
    const rs=e.target&&e.target.dataset&&e.target.dataset.rs;
    if(rs){const b=new Date(BIRTH);CURSOR=new Date(Date.UTC(+rs,b.getUTCMonth(),b.getUTCDate(),b.getUTCHours()));syncTempo();return;}
    dragging=true;pick(e);});
  window.addEventListener('pointermove',e=>{if(dragging)pick(e);});
  window.addEventListener('pointerup',()=>dragging=false);
}
function mandala(d){
  const svg=$('mandala'); const C=230,R1=222,R2=190,R3=156,R4=106;
  const age=ageAt(d);
  const rot=(Math.floor(Math.max(0,age))%12)*30;
  const P=(lon,r)=>{const a=(180-(n360(lon)-NATAL.asc)-rot)*Math.PI/180;return [C+r*Math.cos(a),C-r*Math.sin(a)];};
  let s='<circle cx="'+C+'" cy="'+C+'" r="'+R1+'" fill="none" stroke="#31363f"/>'
    +'<circle cx="'+C+'" cy="'+C+'" r="'+R2+'" fill="none" stroke="#22262d"/>'
    +'<circle cx="'+C+'" cy="'+C+'" r="'+R3+'" fill="none" stroke="#22262d"/>';
  for(let i=0;i<12;i++){const [x1,y1]=P(i*30,R3),[x2,y2]=P(i*30,R1);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#22262d"/>';
    const [tx,ty]=P(i*30+15,(R1+R2)/2);
    s+='<text x="'+tx+'" y="'+(ty+3)+'" text-anchor="middle" font-size="8.5" font-family="IBM Plex Mono" letter-spacing="1" fill="#8b93a1">'+SG[i]+'</text>';}
  Object.entries(NATAL.pts).forEach(([k,p])=>{if(k==='spirit')return;const [x,y]=P(p.lon,(R2+R3)/2-5);
    s+='<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="13" font-family="Cormorant Garamond" fill="#b9c1cd">'+p.g+'</text>';});
  const hits=transitHits(d), TPOS={};
  TB.forEach(([bn,key])=>{TPOS[key]=tlon(bn,d);});
  hits.slice(0,10).forEach(h=>{if(h.nk==='asc'||h.nk==='mc')return;
    const [x1,y1]=P(TPOS[h.tKey],R4),[x2,y2]=P(h.np.lon,(R2+R3)/2-12);
    const col=h.cls==='harm'?'#6f9e83':h.cls==='tens'?'#b0564a':'#b9c1cd';
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width=".9" opacity="'+(0.75-h.orb*0.07)+'"/>';});
  Object.entries(TPOS).forEach(([key,Lg])=>{const [x,y]=P(Lg,R4);const g=TB.find(t=>t[1]===key)[2];
    s+='<circle cx="'+x+'" cy="'+y+'" r="1.8" fill="#e8eaed"/><text x="'+x+'" y="'+(y-6)+'" text-anchor="middle" font-size="11" fill="#e8eaed">'+g+'</text>';});
  s+='<text x="6" y="'+(C+3)+'" font-size="8" font-family="IBM Plex Mono" fill="#646b76">ASC·PROF</text>';
  svg.innerHTML=s;
}
function syncTempo(){
  if(!NATAL){$('tempo-info').innerHTML=emptyState();$('fird-ledger').innerHTML='';return;}
  $('tempo-date').textContent=fdate(CURSOR)+' · '+Math.floor(ageAt(CURSOR))+' anos';
  $('tempo-pick').value=CURSOR.toISOString().slice(0,10);
  drawCord(); mandala(CURSOR);
  const age=ageAt(CURSOR), f=firdAt(age), p=profAt(age), y=rsYearOf(CURSOR), rs=RS_DATA[y];
  const conv=convergence(CURSOR);
  let html='<div class="card"><div class="kicker">no cursor</div>'
    +'<span class="tag gold">'+f.major+' / '+f.sub+'</span><span class="tag">casa '+p.houseN+' · '+p.sign+'</span>'
    +'<span class="tag">Senhor: '+PT_NAME[p.lordKey]+'</span><span class="tag blue">convergência: '+conv.label+'</span>'
    +'<p style="font-size:.82rem;margin-top:8px">'+synthYear(Math.floor(Math.max(0,age)),p,f)+'</p></div>';
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
  const H=p.houseN, hs=HOUSE_SIG[H], lord=NATAL.pts[p.lordKey];
  const sub=f.subKey&&NATAL.pts[f.subKey]?f.subKey:null;
  const loop=NATAL.loop.includes(p.lordKey)?' Integra o anel ☾→♄→♃→♂: os efeitos encadeiam pelas quatro casas do anel.':'';
  let s='<div class="rep">';
  s+='<div class="rep-sec"><span class="rep-k">Casa profectada — a matéria do ano</span>Casa '+H+' ('+hs.q+'): <b>'+hs.s+'</b>. No registro do corpus: '+OLAVO_CASA[H]+'.</div>';
  s+='<div class="rep-sec"><span class="rep-k">Senhor do Ano — quem cumpre</span><b>'+PT_NAME[p.lordKey]+'</b>, no natal: '+lord.dig+', casa '+lord.h+' ('+NATAL.houseTheme[lord.h]+'); rege a '+listRuled(p.lordKey)+' — traz esses assuntos consigo.'+loop+'<br><i>'+OLAVO_PL[p.lordKey]+'</i><br>Aspectos natais: '+(NATAL_ASP[p.lordKey]||[]).join(' · ')+'.'+(lord.star&&lord.star!=='—'?(' Estrela: '+lord.star):'')+'</div>';
  if(sub&&sub!==p.lordKey) s+='<div class="rep-sec"><span class="rep-k">Sub-firdária</span><b>'+f.major+'/'+f.sub+'</b>: '+PT_NAME[sub]+(ruledHouses(sub).length?(' rege a '+listRuled(sub)):'')+' — estes temas entram no jogo da casa '+H+'.</div>';
  else s+='<div class="rep-sec"><span class="rep-k">Sub-firdária</span><b>'+f.major+'/'+f.sub+'</b>: o senhor maior duplicado — o tema da era em estado puro.</div>';
  s+='<div class="rep-sec"><span class="rep-k">Era maior</span>'+f.major+': '+(ERA_TXT[f.major]||'')+'</div>';
  s+=rs?('<div class="rep-sec"><span class="rep-k">Revolução Solar '+y+'</span><b>Asc: '+rs.asc+'</b><br>'+rs.destaque+'<br><i>'+rs.estrelas+'</i></div>')
       :('<div class="rep-sec"><span class="rep-k">Revolução Solar '+y+'</span>Sem RS registrada — adicione em RS_DATA['+y+'].</div>');
  const proms=PROMESSAS.filter(pr=>pr.anos.includes(y));
  if(proms.length) s+='<div class="rep-sec"><span class="rep-k">Promessas em ativação</span>'+proms.map(pr=>pr.t).join(' · ')+'</div>';
  s+='<div class="rep-sec"><span class="rep-k">Conselho</span>'+CONSELHO[p.lordKey]+'</div></div>';
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
function renderFontes(){
  $('fontes-body').innerHTML=CONTEUDO.explic.map(([t,d])=>'<div class="card"><b style="color:var(--gold);font-family:var(--serif);font-size:1rem">'+t+'</b><p style="font-size:.84rem;margin:5px 0 0">'+d+'</p></div>').join('')
   +'<div class="card"><b style="color:var(--gold);font-family:var(--serif);font-size:1rem">Motor de relevância</b><p style="font-size:.84rem;margin:5px 0 0">Cada trânsito recebe pontos por: senhor da firdária (+3), da sub-firdária (+2), Senhor do Ano (+3), regência da casa profectada (+2), angularidade na Revolução (+2), toque em Asc/Sol/Lua/MC (+2), toque no Senhor do Ano natal (+2), repetição de aspecto da Revolução (+2), orbe &lt;1° (+2). Faixas: ≥8 convergência muito alta; ≥5 alta; ≥3 moderada. É medida interna de repetição entre técnicas — não é probabilidade científica.</p></div>';
  RAG.load().then(()=>{$('rag-status').textContent=RAG.status;});
  $('rag-run').onclick=async()=>{
    await RAG.load();
    const q=$('rag-q').value.trim(); if(!q)return;
    const units=q.split(/\s+/).map(w=>[w,1,'termo: '+w]);
    const r=RAG.query(units,5);
    $('rag-out').innerHTML=r.length?renderSources(r):'<div class="card">Nenhum trecho recuperado. '+esc(RAG.status)+'</div>';
  };
}
