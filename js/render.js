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
    const st=(typeof promiseState==='function')?promiseState(pr,now):{estado:'latente',itens:[]};
    const q=(typeof qualidade==='function')?qualidade(pr.pl):{txt:pr.cond};
    return '<div class="prom" data-id="'+pr.id+'">'
    +'<div class="p-t">'+pr.t
      +' <span class="prom-cond '+pr.cond+'">'+st.estado+'</span>'
      +' <span class="mono" style="color:var(--dim2)">· '+(PT_GLYPH[pr.pl]||'')+' '+PT_NAME[pr.pl]
      +' · casas '+pr.casas.map(h=>h+'ª').join(', ')+' · '+q.txt+'</span></div>'
    +'<div class="p-b"><b>Administra:</b> '+((pr.ruled||[]).map(h=>HOUSE_TAG[h]).join(' e ')||'—')
      +' · <b>executa por:</b> '+(HOUSE_TAG[pr.occ]||'—')+'.'
    +(st.itens&&st.itens.length?('<br><b>Convergência agora:</b> '+st.itens.map(f=>f[1]).join('; ')+'.'):'')
    +(typeof fundamentoHTML==='function'?fundamentoHTML(['promessa','convergencia','testemunho'],
        [pr.fat,'Condição: '+pr.cond_manif,'Ativação: '+pr.tec]):'')
    +'</div></div>';
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
  const W=svg.clientWidth||900, mob=W<620;
  const H=mob?Math.min(W,430):Math.min(W,560);
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  if(typeof NATAL==='undefined'||!NATAL){svg.innerHTML='';return;}
  const CX=W/2, CY=H/2+ (mob?4:6), R=Math.min(W,H)/2-(mob?14:22);
  const TAU=Math.PI*2;
  const C_INK='#eaf0fa', C_DIM='#98a5bd', C_DIM2='#6b7793', C_LINE='rgba(255,255,255,.10)', C_SOFT='rgba(255,255,255,.022)';
  const AU='220,184,119';
  const S=tempoState(CURSOR); if(!S){svg.innerHTML='';return;}
  const P=(ang,r)=>[CX+r*Math.sin(ang), CY-r*Math.cos(ang)];
  const arc=(a0,a1,r0,r1)=>{                 // setor anelar
    const [x0,y0]=P(a0,r1),[x1,y1]=P(a1,r1),[x2,y2]=P(a1,r0),[x3,y3]=P(a0,r0);
    const big=(a1-a0)>Math.PI?1:0;
    return 'M'+x0+' '+y0+' A'+r1+' '+r1+' 0 '+big+' 1 '+x1+' '+y1
         +' L'+x2+' '+y2+' A'+r0+' '+r0+' 0 '+big+' 0 '+x3+' '+y3+' Z';
  };
  let s='<defs><filter id="auglow" x="-40%" y="-40%" width="180%" height="180%">'
    +'<feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<radialGradient id="corefill"><stop offset="0%" stop-color="#0d1424"/><stop offset="100%" stop-color="#06090f"/></radialGradient></defs>';
  // anéis: [nome, raio externo, raio interno]
  const w1=mob?28:40, gap=mob?11:15;
  const rF=[R, R-w1], rS=[R-w1-gap, R-2*w1-gap], rP=[R-2*w1-2*gap, R-3*w1-2*gap];
  const rCore=rP[1]-gap;
  // trilhos
  [rF,rS,rP].forEach(rr=>{
    s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rr[0]+'" fill="none" stroke="'+C_LINE+'"/>';
    s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rr[1]+'" fill="none" stroke="'+C_LINE+'"/>';
  });
  // rótulo da camada: fica na folga entre anéis, sobre um recorte branco
  const label=(txt,r)=>{
    const [x,y]=P(0,r), fs=mob?8:9.5, w=txt.length*(fs*0.78)+14, h=fs+7;
    return '<rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="#05070e"/>'
      +'<text x="'+x+'" y="'+(y+fs*0.36)+'" text-anchor="middle" font-size="'+fs+'" '
      +'font-family="IBM Plex Mono" letter-spacing="2.2" fill="'+C_DIM2+'">'+txt+'</text>';
  };
  const setor=(a0,a1,rr,ativo,attrs)=>
    '<path '+(attrs||'')+' d="'+arc(a0,a1,rr[1],rr[0])+'" fill="'+(ativo?'rgba('+AU+',.13)':C_SOFT)+'" '
    +'stroke="'+(ativo?'rgba('+AU+',.85)':C_LINE)+'" stroke-width="'+(ativo?1.5:1)+'" '
    +(ativo?'filter="url(#auglow)" ':'')+'style="cursor:pointer"/>';
  const meioTexto=(a,r,txt,ativo,fs)=>{
    const [x,y]=P(a,r);
    return '<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="'+(fs||(mob?9.5:12))+'" font-family="Inter" '
      +'fill="'+(ativo?C_INK:C_DIM)+'" style="pointer-events:none">'+txt+'</text>';
  };
  const estW=(t,fs)=>{let n=0;for(const ch of t){const c=ch.codePointAt(0);if(c===0xFE0E)continue;
    n+=(c>=0x2200&&c<=0x27bf)?fs*.86:(ch===' ')?fs*.32:fs*.55;}return n;};

  /* ---------- anel 1 · FIRDÁRIA (proporcional aos anos de cada período) ---------- */
  const TOT=FIRD.reduce((a,f)=>a+f[2],0);
  let acc=0;
  FIRD.forEach(([k,nm,len])=>{
    const a0=acc/TOT*TAU, a1=(acc+len)/TOT*TAU, mid=(a0+a1)/2;
    const ativo=(S.age>=acc&&S.age<acc+len);
    s+=setor(a0,a1,rF,ativo,'data-layer="firdaria" data-goto="'+(acc+len/2)+'"');
    const arcLen=(a1-a0)*((rF[0]+rF[1])/2), g=PT_GLYPH[k]||'';
    const nome=(PT_NAME[k]||nm);
    const txt=estW(g+' '+nome,12)+8<arcLen?(g+' '+nome):(estW(nome,12)+6<arcLen?nome:g);
    s+=meioTexto(mid,(rF[0]+rF[1])/2,txt,ativo);
    acc+=len;
  });
  s+=label('FIRDÁRIA',rF[0]+(mob?8:11));

  /* ---------- anel 2 · SUBFIRDÁRIA (7 fases do período vigente) ---------- */
  const fNow=firdAt(S.age), base=fNow.from||0, len=fNow.len||1, part=len/7;
  const subs=FIRD.slice(0,7).map(f=>f[0]);
  let si=subs.indexOf(fNow.majorKey); if(si<0)si=0;
  for(let i=0;i<7;i++){
    const a0=i/7*TAU, a1=(i+1)/7*TAU, mid=(a0+a1)/2;
    const sk=subs[(si+i)%7];
    const ativo=(S.age>=base+i*part&&S.age<base+(i+1)*part);
    s+=setor(a0,a1,rS,ativo,'data-layer="sub" data-goto="'+(base+i*part+part/2)+'"');
    const arcLen=(a1-a0)*((rS[0]+rS[1])/2), g=PT_GLYPH[sk]||'', nome=PT_NAME[sk]||'';
    const txt=estW(g+' '+nome,11)+8<arcLen?(g+' '+nome):g;
    s+=meioTexto(mid,(rS[0]+rS[1])/2,txt,ativo,mob?9:11);
  }
  s+=label('SUBFIRDÁRIA',(rF[1]+rS[0])/2);

  /* ---------- anel 3 · PROFECÇÃO (12 casas do ciclo anual) ---------- */
  const anoBase=Math.floor(S.age)-((Math.floor(S.age))%12);
  for(let i=0;i<12;i++){
    const a0=i/12*TAU, a1=(i+1)/12*TAU, mid=(a0+a1)/2;
    const casa=i+1, ativo=(S.profHouse===casa);
    s+=setor(a0,a1,rP,ativo,'data-layer="profeccao" data-goto="'+(anoBase+i+0.5)+'"');
    const lord=NATAL.rulers[casa];
    const arcLen=(a1-a0)*((rP[0]+rP[1])/2);
    const txt=estW('Casa '+casa+' '+(PT_GLYPH[lord]||''),11)+6<arcLen
      ?('Casa '+casa+' '+(PT_GLYPH[lord]||'')):(''+casa);
    s+=meioTexto(mid,(rP[0]+rP[1])/2,txt,ativo,mob?9:11);
  }
  s+=label('PROFECÇÃO',(rS[1]+rP[0])/2);

  /* ---------- núcleo · TIPOS DE REVOLUÇÃO + retorno vigente ---------- */
  const REV=S.rev, KINDS=revKinds(), rIn=rCore*0.56;
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rCore+'" fill="url(#corefill)" stroke="rgba(255,255,255,.10)"/>';
  KINDS.forEach((K,i)=>{
    const a0=(i/KINDS.length)*TAU-Math.PI/KINDS.length, a1=a0+TAU/KINDS.length, mid=(a0+a1)/2;
    const on=K.id===REV_SEL;
    s+='<path data-rev="'+K.id+'" d="'+arc(a0,a1,rIn,rCore)+'" fill="'+(on?'rgba('+AU+',.13)':'rgba(255,255,255,.016)')+'" '
      +'stroke="'+(on?'rgba('+AU+',.85)':'rgba(255,255,255,.07)')+'" stroke-width="'+(on?1.5:1)+'"'
      +(on?' filter="url(#auglow)"':'')+' style="cursor:pointer"><title>'+K.o+'</title></path>';
    const rl=(rIn+rCore)/2, [lx,ly]=P(mid,rl);
    s+='<text x="'+lx+'" y="'+(ly-3)+'" text-anchor="middle" font-size="'+(mob?11:14)+'" font-family="Inter" '
      +'fill="'+(on?'#e9eef8':C_DIM2)+'" style="pointer-events:none">'+(PT_GLYPH[K.key]||'')+'︎</text>'
      +'<text x="'+lx+'" y="'+(ly+(mob?10:13))+'" text-anchor="middle" font-size="'+(mob?8:10)+'" font-family="Inter" '
      +'fill="'+(on?'var(--gold)':C_DIM2)+'" style="pointer-events:none">'+K.label+'</text>';
  });
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rIn+'" fill="#05080f" stroke="rgba('+AU+',.35)" data-layer="revolucao" style="cursor:pointer"/>';
  const fsT=mob?12:16, fsS=mob?8.5:10.5;
  if(REV){
    s+='<text x="'+CX+'" y="'+(CY-(mob?10:14))+'" text-anchor="middle" font-size="'+fsT+'" font-family="Cormorant Garamond" fill="'+C_INK+'" style="pointer-events:none">'
      +REV.sigla+' '+REV.start.getUTCFullYear()+'</text>';
    s+='<text x="'+CX+'" y="'+(CY+(mob?4:6))+'" text-anchor="middle" font-size="'+fsS+'" font-family="Inter" fill="'+C_DIM+'" style="pointer-events:none">'
      +'Asc em '+REV.ascSignNm+'</text>';
    s+='<text x="'+CX+'" y="'+(CY+(mob?15:20))+'" text-anchor="middle" font-size="'+fsS+'" font-family="Inter" fill="'+C_DIM+'" style="pointer-events:none">'
      +(PT_NAME[REV.ascRuler]||'')+' regente</text>';
  } else {
    s+='<text x="'+CX+'" y="'+(CY+3)+'" text-anchor="middle" font-size="'+fsS+'" font-family="Inter" fill="'+C_DIM2+'" style="pointer-events:none">retorno indisponível</text>';
  }
  // marcador do instante: raio fino do núcleo à borda, no ângulo do ano vigente
  const angNow=((S.age%12)/12)*TAU;
  const [mx0,my0]=P(angNow,rCore+2), [mx1,my1]=P(angNow,R+ (mob?5:7));
  s+='<line x1="'+mx0+'" y1="'+my0+'" x2="'+mx1+'" y2="'+my1+'" stroke="rgba('+AU+',.4)" stroke-width="1" stroke-dasharray="2 4"/>';
  svg.innerHTML=s;
}
function cordDrag(){
  const svg=$('cord'); if(!svg)return;
  svg.addEventListener('pointerdown',e=>{
    const g=e.target&&e.target.closest&&e.target.closest('[data-goto]');
    const lay=e.target&&e.target.closest&&e.target.closest('[data-layer]');
    if(lay)TP_LAYER=lay.dataset.layer;
    if(g){const age=+g.dataset.goto;
      if(isFinite(age)&&age>=0&&age<75)CURSOR=new Date(BIRTH+age*365.2425*DAY);}
    if(lay||g)syncTempo();
  });
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
/* ---- cartões executivos do momento (Firdária, Sub, Profecção, Revolução) ---- */
function tempoExecCards(d){
  const S=tempoState(d); if(!S)return '';
  const byY=new Date(BIRTH).getUTCFullYear(), f=S.f;
  const card=(layer,k,title,interval,theme)=>'<div class="tpcard" data-layer="'+layer+'"><div class="tpc-k">'+k+'</div>'
    +'<div class="tpc-t">'+title+'</div><div class="tpc-i">'+interval+'</div><div class="tpc-d">'+theme+'</div></div>';
  const fFrom=byY+Math.round(f.from||0), fTo=fFrom+(f.len||0);
  // firdária: assunto dominante pelas casas REGIDAS
  const cF=card('firdaria','Firdária',PT_NAME[S.mk]||f.major,(fFrom+'–'+fTo),
    PT_NAME[S.mk]?(cap1(casasTag(S.rulesMk))+' em destaque.'):'Passagem de nodo.');
  // subfirdária: assunto secundário/imediato
  const cS=S.sk?card('sub','Subfirdária',PT_NAME[S.sk],'até '+fdate(new Date(f.subEnd)),
      cap1(casasTag(S.rulesSk))+' em segundo plano.')
    :card('sub','Subfirdária',PT_NAME[S.mk]||f.major,'fase do ciclo','A fase repete o regente do ciclo.');
  // profecção: assunto do ano
  const cP=card('profeccao','Profecção','Casa '+S.profHouse+' · Senhor '+PT_NAME[S.lord],
    'ano '+rsYearOf(d), 'Ano de '+casaTag(S.profHouse)+'.');
  // revolução SELECIONADA (substitui a camada contextual)
  const R=S.rev;
  const cR=R?card('revolucao','Revolução '+R.label,'Asc em '+R.ascSignNm+' · '+PT_NAME[R.ascRuler]+' regente',
      R.sigla+' '+fdate(R.start)+(R.end?(' → '+fdate(R.end)):''),
      'Ambiente: '+casaTag(R.ascNatalHouse)+'.')
    :card('revolucao','Revolução','—','—','Revolução indisponível: recarregue o mapa pelo link.');
  return cF+cS+cP+cR;
}
/* ---- seletor de revoluções ---- */
function revSelectorHTML(){
  return revKinds().map(k=>'<button class="rvleg'+(k.id===REV_SEL?' on':'')+'" data-rev="'+k.id+'">'
    +'<span class="rvleg-g">'+(PT_GLYPH[k.key]||'')+'︎</span>'
    +'<span class="rvleg-t"><b>'+k.label+'</b>'+(k.curto||k.o)+'</span></button>').join('');
}
/* ---- cartão da revolução selecionada (período, planeta, regente, casas, contatos) ---- */
function revCardHTML(d){
  const S=tempoState(d); if(!S)return '';
  const R=S.rev;
  if(!R)return '<div class="card"><div class="kicker">revolução selecionada</div>'
    +'<p>Não foi possível calcular a revolução '+(REV_BY_ID[REV_SEL]||{}).label+'. Importe o mapa pelo link do Aspectarian (é dele que vêm as coordenadas do lugar).</p></div>';
  const row=(k,v)=>'<div class="rv-r"><span class="rv-k">'+k+'</span><span class="rv-v">'+v+'</span></div>';
  const cont=R.contatos.slice(0,4).map(c=>PT_NAME[c.rev]+' '+c.gl+' '+c.alvoNm+' natal ('+c.orb.toFixed(1)+'°)').join(' · ')||'—';
  const rep=R.repeats.slice(0,3).map(r=>PT_NAME[r.a]+' '+r.gl+' '+PT_NAME[r.b]).join(' · ')||'nenhum';
  return '<div class="card rvcard"><div class="kicker">revolução selecionada</div>'
    +'<div class="rv-h">'+(PT_GLYPH[R.planetKey]||'')+' Revolução '+R.label+'</div>'
    +'<p class="rv-o">'+R.K.o+'</p>'
    +row('Validade',fdate(R.start)+(R.end?(' → '+fdate(R.end)):''))
    +row('Planeta que retorna',PT_NAME[R.planetKey]+(R.planetRevHouse?(' · casa '+R.planetRevHouse+' da revolução'):''))
    +row('Ascendente da revolução',R.ascSignNm+' · regido por '+PT_NAME[R.ascRuler])
    +row('Regente do Ascendente',PT_NAME[R.ascRuler]+(R.ascRulerRevHouse?(' na casa '+R.ascRulerRevHouse+' da revolução'):'')
        +(R.ascRulerNatalHouse?(' · casa '+R.ascRulerNatalHouse+' no natal'):''))
    +row('Área natal reativada','casa '+R.ascNatalHouse+' — '+casaTag(R.ascNatalHouse))
    +row('Contatos com o natal',cont)
    +row('Aspectos natais repetidos',rep)
    +'<p class="rv-f">'+cap1(R.K.foco)+'.</p>'
    +(typeof fundamentoHTML==='function'?fundamentoHTML(['revolucao','ascendente','dois-tempos'],
       ['Ambiente lido pela casa natal onde cai o Ascendente da revolução; a revolução não substitui a promessa natal.']):'')
    +'</div>';
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
  if(rv){revSetKind(rv.dataset.rev);syncTempo();if(typeof renderTrans==='function')try{renderTrans();}catch(x){}return;}
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
function syncTempo(){
  if(typeof NATAL==='undefined'||!NATAL){
    ['tempo-exec','tempo-synth','tempo-proms','tempo-detail','tempo-rev','fird-ledger'].forEach(id=>{if($(id))$(id).innerHTML='';});
    if($('tempo-synth'))$('tempo-synth').innerHTML=emptyState();return;}
  $('tempo-date').textContent=fdate(CURSOR)+' · '+Math.floor(ageAt(CURSOR))+' anos';
  $('tempo-pick').value=CURSOR.toISOString().slice(0,10);
  if($('tempo-revsel'))$('tempo-revsel').innerHTML=revSelectorHTML();
  drawCord();
  $('tempo-exec').innerHTML=tempoExecCards(CURSOR);
  if(TP_LAYER){const c=$('tempo-exec').querySelector('[data-layer="'+TP_LAYER+'"]');if(c)c.classList.add('on');}
  $('tempo-synth').innerHTML=synthLiteral(CURSOR);
  if($('tempo-rev'))$('tempo-rev').innerHTML=revCardHTML(CURSOR);
  $('tempo-proms').innerHTML=tempoPromsHTML(CURSOR);
  $('tempo-detail').innerHTML=TP_LAYER?tempoDetailHTML(TP_LAYER,CURSOR):'';
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
/* ================= REVOLUÇÕES — qualquer planeta, qualquer retorno ================= */
let RS_KIND='solar', RS_CURSOR=null, RS_CMP=false;
function rsCursor(){return RS_CURSOR||new Date();}
/* navega para o retorno anterior/seguinte do tipo vigente */
function rsStep(dir){
  const K=REV_BY_ID[RS_KIND]; if(!K)return;
  const R=revolutionFor(RS_KIND,rsCursor()); if(!R)return;
  const t=dir>0?((R.end?R.end.getTime():rsCursor().getTime())+DAY):(R.start.getTime()-DAY);
  const lim=BIRTH+DAY, max=Date.now()+K.per*2*DAY;
  RS_CURSOR=new Date(Math.max(lim,Math.min(max,t)));
  renderRS();
}
/* roda de quatro camadas: período · ascendente e regente · casas ativadas · síntese */
function rsWheelSVG(R,S){
  const svg=$('rs-wheel'); const W=(svg&&svg.clientWidth)||620, mob=W<560;
  const H=W, CX=W/2, CY=H/2, R0=W/2-(mob?12:18);
  const AU='220,184,119', BL='111,159,216', CN='127,210,230';
  const rings=[R0, R0*0.78, R0*0.57, R0*0.36];
  const k=R0/300;                                   // escala das distâncias
  let s='<defs><filter id="rsglow" x="-60%" y="-60%" width="220%" height="220%">'
    +'<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<radialGradient id="rscore"><stop offset="0%" stop-color="#0e1526"/><stop offset="100%" stop-color="#05080f"/></radialGradient></defs>';
  const ring=(r,col,w)=>'<circle cx="'+CX+'" cy="'+CY+'" r="'+r+'" fill="none" stroke="rgba('+col+',.40)" stroke-width="'+(w||1)+'"/>';
  const txt=(y,t,fs,col,fam,ls)=>'<text x="'+CX+'" y="'+y+'" text-anchor="middle" font-size="'+fs+'" font-family="'+(fam||'Inter')+'"'
    +(ls?' letter-spacing="'+ls+'"':'')+' fill="'+col+'">'+t+'</text>';
  s+=ring(rings[0],AU,1.4)+ring(rings[1],BL,1)+ring(rings[2],CN,1)+ring(rings[3],AU,1.2);
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rings[3]+'" fill="url(#rscore)"/>';
  const FS=x=>Math.max(7,x*k);
  // planetas do retorno no anel externo (antes dos textos, para ficarem por baixo)
  ['sun','moon','mercury','venus','mars','jupiter','saturn'].forEach(pk=>{ if(!R.chart.pts[pk])return;
    const ang=(R.chart.pts[pk].lon-R.ascLon)*Math.PI/180+Math.PI;
    const rr=(rings[0]+rings[1])/2, x=CX+rr*Math.sin(ang), y=CY-rr*Math.cos(ang);
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+(2.6*k)+'" fill="rgba('+CN+',.9)"/>'
      +'<text x="'+x+'" y="'+(y-9*k)+'" text-anchor="middle" font-size="'+FS(13)+'" font-family="Inter" fill="#c9d4e8">'+(PT_GLYPH[pk]||'')+'︎</text>';});
  // camada 1 — período do retorno
  let y1=CY-rings[0];
  s+=txt(y1+18*k,'ANO DA REVOLUÇÃO '+R.label.toUpperCase(),FS(9.5),'#8c7c5c','IBM Plex Mono',2.2*k);
  s+=txt(y1+46*k,String(R.start.getUTCFullYear()),FS(30),'#dcb877','Cormorant Garamond');
  s+=txt(y1+63*k,'de '+fdate(R.start)+(R.end?(' a '+fdate(R.end)):''),FS(10.5),'#9aa6bd');
  // camada 2 — ascendente e regente
  let y2=CY-rings[1];
  s+=txt(y2+18*k,'ASCENDENTE DO RETORNO',FS(9.5),'#5b7fa8','IBM Plex Mono',2*k);
  s+=txt(y2+44*k,R.ascSignNm+' <tspan font-size="'+FS(14)+'" fill="#9aa6bd">'+(zfmt(R.ascLon).match(/\d+°\d*/)||[''])[0]+'</tspan>',FS(22),'#8fc0ee','Cormorant Garamond');
  s+=txt(y2+62*k,'Regente: '+PT_NAME[R.ascRuler],FS(11.5),'#9aa6bd');
  // camada 3 — ênfases e casas ativadas
  let y3=CY-rings[2];
  s+=txt(y3+16*k,'ÊNFASES DO PERÍODO',FS(9.5),'#4f8fa0','IBM Plex Mono',2*k);
  s+=txt(y3+30*k,'Casas ativadas',FS(11),'#9aa6bd');
  const casas=S?[...new Set([R.ascNatalHouse,S.profHouse,R.ascRulerNatalHouse,(NATAL.pts[R.planetKey]||{}).h].filter(Boolean))].slice(0,4)
               :[R.ascNatalHouse].filter(Boolean);
  const cr=15*k, cyy=y3+52*k, x0=CX-((casas.length-1)*cr*2.6)/2;
  casas.forEach((h,i)=>{const x=x0+i*cr*2.6, on=S&&h===S.profHouse;
    s+='<circle cx="'+x+'" cy="'+cyy+'" r="'+cr+'" fill="'+(on?'rgba('+AU+',.14)':'rgba(255,255,255,.03)')+'" '
      +'stroke="rgba('+(on?AU+',.85':'255,255,255,.16')+')"'+(on?' filter="url(#rsglow)"':'')+'/>'
      +'<text x="'+x+'" y="'+(cyy+FS(14)*0.36)+'" text-anchor="middle" font-size="'+FS(14)+'" font-family="Inter" fill="'+(on?'#dcb877':'#9aa6bd')+'">'+h+'</text>';});
  // camada 4 — síntese e foco (dentro do núcleo)
  s+=txt(CY-52*k,'SÍNTESE DO PERÍODO',FS(9.5),'#8c7c5c','IBM Plex Mono',2*k);
  const frase=cap1(casaTag(R.ascNatalHouse))+(S?(' e '+casaTag(S.profHouse)):'');
  const pal=frase.split(' '); const linhas=[]; let cur='';
  pal.forEach(w=>{ if((cur+' '+w).trim().length>20){linhas.push(cur.trim());cur=w;} else cur+=' '+w; });
  if(cur.trim())linhas.push(cur.trim());
  linhas.slice(0,3).forEach((ln,i)=>{s+=txt(CY-26*k+i*20*k,ln,FS(16),'#e9eef8','Cormorant Garamond');});
  const byBase=CY-26*k+Math.min(3,linhas.length)*20*k;
  s+='<rect x="'+(CX-56*k)+'" y="'+(byBase+4*k)+'" width="'+(112*k)+'" height="'+(22*k)+'" rx="'+(11*k)+'" fill="rgba('+AU+',.12)" stroke="rgba('+AU+',.45)"/>';
  s+=txt(byBase+19*k,'FOCO CENTRAL',FS(8.5),'#dcb877','IBM Plex Mono',2*k);
  s+=txt(byBase+44*k,'Casa '+(S?S.profHouse:R.ascNatalHouse)+' · '+PT_NAME[R.planetKey]+' · '+PT_NAME[R.ascRuler],FS(11),'#9aa6bd');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  return s;
}
function renderRS(){
  if(typeof NATAL==='undefined'||!NATAL){if($('rs-body'))$('rs-body').innerHTML=emptyState();return;}
  // abas de tipo (inclui Jupiteriana e Saturnina)
  if($('rs-kinds'))$('rs-kinds').innerHTML=REV_KINDS.map(k=>
    '<button class="rvtab'+(k.id===RS_KIND?' on':'')+'" data-rsk="'+k.id+'">'+k.label+'</button>').join('');
  const d=rsCursor(), R=revolutionFor(RS_KIND,d), S=tempoState(d);
  const K=REV_BY_ID[RS_KIND];
  if($('rs-kicker'))$('rs-kicker').textContent='ciclos de retorno · '+K.label.toLowerCase();
  if(!R){
    ['rs-temas','rs-planetas','rs-side','rs-legend'].forEach(i=>{if($(i))$(i).innerHTML='';});
    if($('rs-wheel'))$('rs-wheel').innerHTML='';
    if($('rs-navlabel'))$('rs-navlabel').textContent='—';
    if($('rs-navsub'))$('rs-navsub').textContent='retorno indisponível';
    $('rs-body').innerHTML='<div class="card"><p>Não foi possível calcular a Revolução '+K.label+' nesta data. Importe o mapa pelo link do Aspectarian.</p></div>';
    return;
  }
  $('rs-navlabel').textContent=R.start.getUTCFullYear();
  $('rs-navsub').textContent='Revolução '+R.label+' · '+fdate(R.start);
  $('rs-wheel').innerHTML=rsWheelSVG(R,S);
  // camadas (legenda)
  $('rs-legend').innerHTML=[['Camada 1','Período do retorno','var(--gold)'],['Camada 2','Ascendente e regente','#6f9fd8'],
    ['Camada 3','Ênfases e casas','#7fd2e6'],['Camada 4','Síntese e foco','var(--gold)']]
    .map(([a,b,c])=>'<span class="rvlg"><i style="background:'+c+'"></i><b>'+a+'</b>'+b+'</span>').join('');
  // temas ativados
  const casas=[...new Set([R.ascNatalHouse,S?S.profHouse:null,R.ascRulerNatalHouse,(NATAL.pts[R.planetKey]||{}).h].filter(Boolean))];
  $('rs-temas').innerHTML='<div class="card rvbox"><div class="kicker">temas ativados</div>'
    +casas.map(h=>'<div class="rvt"><span class="rvt-n">'+cap1(HOUSE_TAG[h])+'</span><span class="rvt-c">Casa '+h+'</span></div>').join('')
    +'</div>';
  // planetas em destaque (na revolução)
  const dest=['sun','moon','mercury','venus','mars','jupiter','saturn']
    .filter(k=>R.chart.pts[k]).map(k=>({k,h:R.houseOfRev(R.chart.pts[k].lon)}))
    .filter(x=>[1,4,7,10].includes(x.h)||x.k===R.planetKey||x.k===R.ascRuler).slice(0,5);
  $('rs-planetas').innerHTML='<div class="card rvbox"><div class="kicker">planetas em destaque</div>'
    +(dest.map(x=>'<div class="rvt"><span class="rvt-n">'+(PT_GLYPH[x.k]||'')+'︎ '+PT_NAME[x.k]+'</span><span class="rvt-c">na Casa '+x.h+'</span></div>').join('')||'<p class="note">—</p>')
    +'</div>';
  // painéis à direita
  const cont=R.contatos.slice(0,4).map(c=>PT_NAME[c.rev]+' '+c.gl+' '+c.alvoNm+' ('+c.orb.toFixed(1)+'°)').join(' · ')||'—';
  $('rs-side').innerHTML=
    '<div class="card rvbox"><div class="kicker">por que este retorno importa</div>'
     +'<p class="rv-o">'+R.K.o+' '+cap1(R.K.campo)+'.</p>'
     +'<div class="rvi"><b>Ambiente</b>casa '+R.ascNatalHouse+' natal — '+casaTag(R.ascNatalHouse)+'</div>'
     +'<div class="rvi"><b>Regente do Asc</b>'+PT_NAME[R.ascRuler]+(R.ascRulerRevHouse?(' · casa '+R.ascRulerRevHouse+' do retorno'):'')+'</div>'
     +'<div class="rvi"><b>Planeta que retorna</b>'+PT_NAME[R.planetKey]+(R.planetRevHouse?(' · casa '+R.planetRevHouse):'')+'</div>'
     +'<div class="rvi"><b>Contatos com o natal</b>'+cont+'</div>'
     +'<div class="rvi"><b>Aspectos repetidos</b>'+(R.repeats.slice(0,3).map(r=>PT_NAME[r.a]+' '+r.gl+' '+PT_NAME[r.b]).join(' · ')||'nenhum')+'</div>'
    +'</div>'
    +'<div class="card rvbox"><div class="kicker">síntese literal</div><p class="rv-s">'+rsSynth(R,S)+'</p>'
     +(typeof fundamentoHTML==='function'?fundamentoHTML(['revolucao','ascendente','dois-tempos','aspecto']):'')+'</div>';
  // comparação com o retorno seguinte
  let html='';
  if(RS_CMP&&R.end){
    const R2=revolutionFor(RS_KIND,new Date(R.end.getTime()+DAY));
    if(R2)html='<div class="card"><div class="kicker">retorno seguinte · '+fdate(R2.start)+'</div>'
      +'<p style="font-size:.85rem">Ascendente passa de '+R.ascSignNm+' (regido por '+PT_NAME[R.ascRuler]+') para '
      +R2.ascSignNm+' (regido por '+PT_NAME[R2.ascRuler]+'); o ambiente natal muda da casa '+R.ascNatalHouse
      +' ('+casaTag(R.ascNatalHouse)+') para a casa '+R2.ascNatalHouse+' ('+casaTag(R2.ascNatalHouse)+').</p></div>';
  }
  $('rs-body').innerHTML=html;
}
/* síntese literal do retorno — curta, por camadas, sem frases vagas */
function rsSynth(R,S){
  const F=[];
  F.push('Retorno de '+PT_NAME[R.planetKey]+' válido de '+fdate(R.start)+(R.end?(' a '+fdate(R.end)):'')+'.');
  F.push('O Ascendente em '+R.ascSignNm+', regido por '+PT_NAME[R.ascRuler]+', cai na '+ordinal(R.ascNatalHouse)
    +' natal: o período tende a se manifestar por '+casaTag(R.ascNatalHouse)+'.');
  if(S)F.push('A matéria do ano permanece '+casaTag(S.profHouse)+', administrada por '+PT_NAME[S.lord]+'.');
  if(R.repeats.length)F.push('Um aspecto natal se repete no retorno ('+PT_NAME[R.repeats[0].a]+' '+R.repeats[0].gl+' '+PT_NAME[R.repeats[0].b]
    +'): essa promessa tende a ficar mais visível.');
  return F.join(' ');
}
document.addEventListener('click',e=>{
  if(!e.target.closest)return;
  const k=e.target.closest('[data-rsk]');
  if(k){RS_KIND=k.dataset.rsk;RS_CURSOR=null;renderRS();return;}
});

/* ================= TRÂNSITOS ================= */
let TMODE='hoje', TRX_SEL=null, TRX_FILTER=null;
const AREAS={identidade:[1],dinheiro:[2,8],estudos:[3,9],'residência':[4],criatividade:[5],'saúde e rotina':[6],relacionamentos:[7],carreira:[10],grupos:[11],'assuntos privados':[12]};
function transDate(){const v=$('trans-pick').value;return v?new Date(v+'T12:00:00Z'):new Date();}

/* --- roda de planetas: nós clicáveis com contagem de contatos --- */
function transWheelSVG(d,hits){
  const W=560,H=420,CX=W/2,CY=H/2,R=Math.min(W,H)/2-52;
  const ORDER=['sun','moon','mercury','venus','mars','jupiter','saturn'];
  const cnt={}; hits.forEach(h=>cnt[h.tKey]=(cnt[h.tKey]||0)+1);
  const sel=TRX_SEL!=null&&hits[TRX_SEL]?hits[TRX_SEL]:null;
  const pos={};
  ORDER.forEach((k,i)=>{const a=(i/ORDER.length)*Math.PI*2;pos[k]=[CX+R*Math.sin(a),CY-R*Math.cos(a)];});
  let s='<defs>'
    +'<filter id="nglow" x="-70%" y="-70%" width="240%" height="240%">'
    +'<feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<radialGradient id="halo"><stop offset="0%" stop-color="rgba(255,255,255,.30)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>'
    +'<radialGradient id="nodefill"><stop offset="0%" stop-color="#111a2c"/><stop offset="100%" stop-color="#070b14"/></radialGradient>'
    +'</defs>';
  // teia: liga cada nó ao anel central
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" fill="none" stroke="rgba(255,255,255,.06)"/>';
  ORDER.forEach(k=>{const [x,y]=pos[k];
    s+='<line x1="'+CX+'" y1="'+CY+'" x2="'+x+'" y2="'+y+'" stroke="rgba(255,255,255,'+((cnt[k]||0)?'.13':'.05')+')" stroke-width="1"/>';});
  // núcleo
  const rc=R*0.52;
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+(rc+16)+'" fill="url(#halo)"/>';
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rc+'" fill="#05080f" stroke="rgba(255,255,255,.16)"/>';
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+(rc-7)+'" fill="none" stroke="rgba(255,255,255,.06)"/>';
  s+='<text x="'+CX+'" y="'+(CY-6)+'" text-anchor="middle" font-size="11.5" font-family="IBM Plex Mono" letter-spacing="2.6" fill="#8e9bb4">'
    +(sel?'TRÂNSITO SELECIONADO':'SELECIONE UM TRÂNSITO')+'</text>';
  s+='<text x="'+CX+'" y="'+(CY+16)+'" text-anchor="middle" font-size="12" font-family="Inter" fill="'+(sel?'#e9eef8':'#6b7793')+'">'
    +(sel?(PT_NAME[sel.tKey]+' '+sel.gl+' '+sel.np.nm):'Explore as ativações')+'</text>';
  if(!sel)s+='<text x="'+CX+'" y="'+(CY+34)+'" text-anchor="middle" font-size="12" font-family="Inter" fill="#6b7793">planetárias do momento.</text>';
  // nós
  ORDER.forEach(k=>{
    const [x,y]=pos[k], n=cnt[k]||0, on=sel&&sel.tKey===k, has=n>0, r=on?30:26;
    s+='<g data-trxpl="'+k+'" style="cursor:pointer">';
    if(on) s+='<circle cx="'+x+'" cy="'+y+'" r="'+(r+13)+'" fill="url(#halo)"/>';
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="url(#nodefill)" '
      +'stroke="'+(on?'rgba(255,255,255,.92)':(has?'rgba(255,255,255,.30)':'rgba(255,255,255,.11)'))+'" '
      +'stroke-width="'+(on?1.8:1.1)+'"'+(on?' filter="url(#nglow)"':'')+'/>'
      +'<text x="'+x+'" y="'+(y+6)+'" text-anchor="middle" font-size="18" font-family="Inter" fill="'+(has?'#e9eef8':'#4a5570')+'" style="pointer-events:none">'+(PT_GLYPH[k]||'')+'︎</text>'
      +'<text x="'+x+'" y="'+(y+r+16)+'" text-anchor="middle" font-size="10.5" font-family="Inter" fill="'+(has?'#9aa6bd':'#4a5570')+'" style="pointer-events:none">'+PT_NAME[k]+'</text>';
    if(n) s+='<circle cx="'+(x+20)+'" cy="'+(y-18)+'" r="9" fill="#0d1424" stroke="rgba(220,184,119,.55)"/>'
      +'<text x="'+(x+20)+'" y="'+(y-14.5)+'" text-anchor="middle" font-size="9" font-family="IBM Plex Mono" fill="var(--gold)" style="pointer-events:none">'+n+'</text>';
    s+='</g>';
  });
  return '<svg id="trans-wheel" viewBox="0 0 '+W+' '+H+'">'+s+'</svg>';
}
/* --- cartão de detalhe curto de um trânsito --- */
function transDetailHTML(hit,d,S){
  if(!hit)return '<div class="card trx-empty"><div class="kicker">detalhe</div>'
    +'<p>Escolha um planeta na roda ou um trânsito na lista para ver o detalhe.</p></div>';
  const T=transitoTexto(hit,d,S);
  const dur=Math.max(1,Math.round((T.janela.end-T.janela.start)/DAY));
  return '<div class="card trxcard">'
    +'<div class="trx-h"><span class="trx-g">'+(PT_GLYPH[hit.tKey]||'')+'︎</span>'
      +'<div><div class="trx-t">'+T.titulo+'</div>'
      +'<div class="trx-sub">'+hit.orb.toFixed(1)+'° · '+(T.lento?'contexto (planeta lento)':'disparador (planeta rápido)')+' · casa '+hit.np.h+'</div></div>'
      +'<span class="tag '+(hit.cls==='tens'?'red':hit.cls==='harm'?'green':'')+'">'+({conj:'conjunção',harm:'harmônico',tens:'tenso'})[hit.cls]+'</span></div>'
    +'<p class="trx-ef">'+T.efeito+'</p>'
    +'<p class="trx-pq"><b>Por que importa agora:</b> '+T.porque+'</p>'
    +'<div class="trx-win">'
      +'<div><span>Início</span>'+fdate(T.janela.start)+'</div>'
      +'<div><span>Pico</span>'+fdate(T.janela.peak)+'</div>'
      +'<div><span>Término</span>'+fdate(T.janela.end)+'</div>'
      +'<div><span>Duração</span>'+dur+' dias</div></div>'
    +(typeof fundamentoHTML==='function'?fundamentoHTML(['transito','regencia','ritmo','alvo'],[T.tecnico]):'')
    +'</div>';
}
/* --- barra lateral: por planeta e por tema --- */
function transSideHTML(d,all){
  const cnt={}; all.forEach(h=>cnt[h.tKey]=(cnt[h.tKey]||0)+1);
  const pls=['sun','moon','mercury','venus','mars','jupiter','saturn'];
  let s='<button class="trx-i'+(TRX_FILTER?'':' on')+'" data-trxf="">'+'<span class="ti-g">◎</span><span class="ti-n">Todos</span>'
    +'<span class="ti-c">'+all.length+'</span></button>';
  s+='<div class="trx-lbl">por planeta</div>';
  pls.forEach(k=>{ s+='<button class="trx-i'+(TRX_FILTER==='pl:'+k?' on':'')+'" data-trxf="pl:'+k+'">'
    +'<span class="ti-g">'+(PT_GLYPH[k]||'')+'︎</span><span class="ti-n">'+PT_NAME[k]+'</span>'
    +'<span class="ti-c">'+(cnt[k]||0)+'</span></button>';});
  s+='<div class="trx-lbl">por tema</div>';
  Object.keys(AREAS).slice(0,6).forEach(a=>{
    const hs=AREAS[a], n=all.filter(h=>[h.np.h].concat(ruledHouses(h.nk)).some(x=>hs.includes(x))).length;
    s+='<button class="trx-i'+(TRX_FILTER==='ar:'+a?' on':'')+'" data-trxf="ar:'+a+'">'
      +'<span class="ti-g">·</span><span class="ti-n">'+a+'</span><span class="ti-c">'+n+'</span></button>';});
  return s;
}
/* --- vista principal (padrão): só os 3–5 trânsitos realmente relevantes --- */
function renderTransHoje(d){
  const S=tempoState(d);
  let rel=transitosRelevantes(d,5);
  const all=transitHits(d).map(h=>Object.assign(h,{pri:transitPriority(h,d,S)}));
  if(TRX_FILTER&&TRX_FILTER.startsWith('pl:')){
    const k=TRX_FILTER.slice(3);
    rel=all.filter(h=>h.tKey===k).sort((a,b)=>b.pri.score-a.pri.score||a.orb-b.orb).slice(0,5);
  } else if(TRX_FILTER&&TRX_FILTER.startsWith('ar:')){
    const hs=AREAS[TRX_FILTER.slice(3)]||[];
    rel=all.filter(h=>[h.np.h].concat(ruledHouses(h.nk)).some(x=>hs.includes(x)))
           .sort((a,b)=>b.pri.score-a.pri.score||a.orb-b.orb).slice(0,5);
  }
  if(TRX_SEL==null||!rel[TRX_SEL])TRX_SEL=rel.length?0:null;
  const sel=TRX_SEL!=null?rel[TRX_SEL]:null;
  // lista curta
  const lista=rel.map((h,i)=>{const T=transitoTexto(h,d,S);
    return '<button class="trx-row'+(i===TRX_SEL?' on':'')+'" data-trxi="'+i+'">'
      +'<span class="tr-g">'+(PT_GLYPH[h.tKey]||'')+'︎ '+h.gl+' '+(h.np.g||'')+'</span>'
      +'<span class="tr-t">'+T.titulo+'</span>'
      +'<span class="tr-m">'+h.orb.toFixed(1)+'° · '+(T.lento?'contexto':'disparador')+'</span></button>';}).join('')
    ||'<p class="note">Nenhum trânsito atinge o limiar de relevância nesta data.</p>';
  // janelas críticas (próximos 60 dias, entre os relevantes)
  const crit=rel.filter(h=>h.cls==='tens').slice(0,3).map(h=>{const T=transitoTexto(h,d,S);
    return '<div class="evrow tens"><span class="d">'+fdate(T.janela.start)+' → '+fdate(T.janela.end)+'</span>'
      +'<span class="t">'+T.titulo+'</span></div>';}).join('')||'<p class="note">sem janelas tensas relevantes.</p>';
  return '<div class="trx">'
    +'<aside class="trx-side">'+transSideHTML(d,all.filter(h=>h.pri.score>=3))+'</aside>'
    +'<div class="trx-mid">'+transWheelSVG(d,rel)+'<div class="trx-list">'+lista+'</div></div>'
    +'<div class="trx-det">'+transDetailHTML(sel,d,S)+'</div>'
    +'</div>'
    +'<div class="trx-bottom">'
      +'<div class="card"><div class="kicker">o que sustenta a leitura</div>'
        +'<p style="font-size:.85rem">'+(S?synthLiteral(d):'')+'</p></div>'
      +'<div class="card"><div class="kicker">janelas críticas</div>'+crit+'</div>'
    +'</div>';
}
function renderTrans(){
  if(typeof NATAL==='undefined'||!NATAL){$('trans-body').innerHTML=emptyState();return;}
  $('trans-eph').textContent='· efemérides: '+(usingAE?'Astronomy Engine':'longitudes médias (aprox.)');
  const d=transDate();
  let html='';
  if(TMODE==='hoje') html=renderTransHoje(d);
  if(TMODE==='30d'){
    const ev=scanEvents(d,30);
    html='<h3>Próximos 30 dias a partir de '+fdate(d)+'</h3>';
    const fav=ev.filter(e=>e.cls==='harm'),ten=ev.filter(e=>e.cls==='tens');
    html+='<div class="grid2"><div class="card"><div class="kicker">janelas favoráveis</div>'+(fav.slice(0,8).map(e=>'<div class="evrow harm"><span class="d">'+fdate(e.d)+'</span><span class="t">'+e.txt+'</span></div>').join('')||'—')+'</div>'
      +'<div class="card"><div class="kicker">períodos tensos</div>'+(ten.slice(0,8).map(e=>'<div class="evrow tens"><span class="d">'+fdate(e.d)+'</span><span class="t">'+e.txt+'</span></div>').join('')||'—')+'</div></div>';
    html+='<div class="card"><div class="kicker">cronologia: exatos, ingressos, estações, lunações, passagens</div>'
      +ev.map(e=>'<div class="evrow '+e.cls+'"><span class="d">'+fdate(e.d)+'</span><span class="t">'+e.txt+'</span></div>').join('')+'</div>';
  }
  if(TMODE==='planeta') html='<div class="toolrow"><select id="tp-sel">'+TB.map(t=>'<option value="'+t[1]+'">'+t[2]+' '+PT_NAME[t[1]]+'</option>').join('')+'</select></div><div id="tp-out"></div>';
  if(TMODE==='area')    html='<div class="toolrow"><select id="ta-sel">'+Object.keys(AREAS).map(a=>'<option>'+a+'</option>').join('')+'</select></div><div id="ta-out"></div>';
  $('trans-body').innerHTML=html;
  if(TMODE==='planeta'){$('tp-sel').onchange=()=>renderTransPlanet(d);renderTransPlanet(d);}
  if(TMODE==='area'){$('ta-sel').onchange=()=>renderTransArea(d);renderTransArea(d);}
}
/* interações da aba de trânsitos */
document.addEventListener('click',e=>{
  if(!e.target.closest)return;
  const f=e.target.closest('[data-trxf]');
  if(f){TRX_FILTER=f.dataset.trxf||null;TRX_SEL=null;renderTrans();return;}
  const row=e.target.closest('[data-trxi]');
  if(row){TRX_SEL=+row.dataset.trxi;renderTrans();return;}
  const pl=e.target.closest('[data-trxpl]');
  if(pl){TRX_FILTER='pl:'+pl.dataset.trxpl;TRX_SEL=null;renderTrans();return;}
});
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
