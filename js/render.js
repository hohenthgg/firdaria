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
  html+='<h3>Síntese literal por planeta — cinco camadas</h3>';
  Object.keys(PT_NAME).forEach(k=>{
    const p=NATAL.pts[k]; if(!p)return;
    const ru=listRuled(k)||'—';
    html+='<div class="card">'
      +'<div class="kicker">'+p.g+' '+p.nm+' · '+zfmt(p.lon)+' · casa '+p.h+'</div>'
      +layerBlock('pl:'+k,{
        frase:'<b>'+p.nm+'</b>: '+ (OLAVO_PL[k]||'').split(':')[1].split('—')[0].trim()+'.',
        resumo:OLAVO_PL[k]+' No natal: '+p.dig+'. Rege a '+ru+'.',
        manif:'Manifestações concretas prováveis: '+manifestFor(k)+'.',
        fund:'Fundamento: posição '+zfmt(p.lon)+', casa '+p.h+' ('+HOUSE_SIG[p.h].q+'). Dignidades: '+p.dig+'. Aspectos: '+(NATAL_ASP[k]||[]).join(' · ')+'. '+(p.star&&p.star!=='—'?('Estrela: '+p.star):'')+' Regras: significação da casa (Lilly/Bonatti), regência interna, recepções (Abu Mashar), corpus Planetas nas Casas (peso máximo).',
      })
      +'</div>';
  });
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

/* ================= TEMPO: corda + mandala + razão + retrospectiva ================= */
let ZOOM='vida', ANIM=null;
const ZSPAN={vida:75*365.2425,decada:3652.5,ano:365.25,mes:30.44,dia:1};
function cordRange(){
  const span=ZSPAN[ZOOM]*DAY;
  if(ZOOM==='vida') return [BIRTH,BIRTH+span];
  const c=CURSOR.getTime();
  return [c-span/2,c+span/2];
}
function drawCord(){
  const svg=$('cord'); const W=svg.clientWidth||1000,H=240;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  const [t0,t1]=cordRange(); const X=t=>((t-t0)/(t1-t0))*W;
  const bands=[
    {y:8,h:22,label:'firdária'},{y:34,h:16,label:'sub'},{y:54,h:16,label:'profecção'},
    {y:74,h:14,label:'senhor'},{y:92,h:12,label:'revoluções'},{y:108,h:26,label:'trânsitos lentos'},
    {y:138,h:26,label:'ativações'},{y:168,h:18,label:'eventos'}];
  let s='';
  bands.forEach(b=>{s+='<text x="4" y="'+(b.y+b.h/2+3)+'" font-size="8" font-family="IBM Plex Mono" fill="#66707c">'+b.label.toUpperCase()+'</text>';});
  const L=90; // margem esquerda
  const XX=t=>L+((t-t0)/(t1-t0))*(W-L-8);
  // 1-2: firdária maior e sub
  let age0=0;
  FIRD.forEach(([k,nm,len])=>{
    const a=BIRTH+age0*365.2425*DAY,b=BIRTH+(age0+len)*365.2425*DAY;age0+=len;
    if(b<t0||a>t1)return;
    s+='<rect x="'+XX(Math.max(a,t0))+'" y="8" width="'+Math.max(1,XX(Math.min(b,t1))-XX(Math.max(a,t0)))+'" height="22" fill="'+(FIRD_COLORS[nm]||'#555')+'" opacity=".82"/>';
    if(XX(Math.min(b,t1))-XX(Math.max(a,t0))>34) s+='<text x="'+(XX(Math.max(a,t0))+4)+'" y="23" font-size="9" fill="#0a0e14" font-family="Inter">'+nm+'</text>';
  });
  // subfirdária: amostrar limites (avanço garantido: em bordas exatas de sub-período
  // firdAt() pode devolver o sub que TERMINA em `a`, o que travava o laço e estourava a string)
  for(let a=0;a<75;){
    const f=firdAt(a); const st=f.subStart,en=f.subEnd;
    if(!st){a+=0.02;continue;}
    const enAge=(en-BIRTH)/DAY/365.2425;
    if(!(en<t0||st>t1))
      s+='<rect x="'+XX(Math.max(st,t0))+'" y="34" width="'+Math.max(1,XX(Math.min(en,t1))-XX(Math.max(st,t0)))+'" height="16" fill="'+(FIRD_COLORS[f.sub]||'#555')+'" opacity=".55" stroke="#0a0e14" stroke-width=".5"/>';
    a=enAge>a+1e-4?enAge:a+0.02; // nunca retrocede
  }
  // 3-4-5: profecção / senhor / RS
  for(let yr=0;yr<75;yr++){
    const a=BIRTH+yr*365.2425*DAY,b=BIRTH+(yr+1)*365.2425*DAY;
    if(b<t0||a>t1)continue;
    const p=profAt(yr);
    const mal=[6,8,12].includes(p.houseN);
    s+='<rect x="'+XX(Math.max(a,t0))+'" y="54" width="'+Math.max(1,XX(Math.min(b,t1))-XX(Math.max(a,t0)))+'" height="16" fill="'+(mal?'#b0564a':'#33415a')+'" opacity="'+(mal?'.5':'.4')+'" stroke="#0a0e14" stroke-width=".5"/>';
    if(XX(b)-XX(a)>26)s+='<text x="'+(XX(Math.max(a,t0))+3)+'" y="65" font-size="8" font-family="IBM Plex Mono" fill="#9aa3ad">'+p.houseN+'</text>';
    s+='<rect x="'+XX(Math.max(a,t0))+'" y="74" width="'+Math.max(1,XX(Math.min(b,t1))-XX(Math.max(a,t0)))+'" height="14" fill="'+(FIRD_COLORS[PT_NAME[p.lordKey]]||'#555')+'" opacity=".6" stroke="#0a0e14" stroke-width=".5"/>';
    const y1=new Date(BIRTH).getUTCFullYear()+yr;
    if(RS_DATA[y1]) s+='<circle cx="'+XX(a)+'" cy="98" r="3.4" fill="'+(ACTIVE_PROM&&PROMESSAS.find(p2=>p2.id===ACTIVE_PROM).anos.includes(y1)?'#5f9e7f':'#6b93b8')+'"/>';
    if(ACTIVE_PROM&&PROMESSAS.find(p2=>p2.id===ACTIVE_PROM).anos.includes(y1))
      s+='<rect x="'+XX(Math.max(a,t0))+'" y="4" width="'+Math.max(1,XX(Math.min(b,t1))-XX(Math.max(a,t0)))+'" height="182" fill="none" stroke="#5f9e7f" stroke-width="1" opacity=".7"/>';
  }
  // 6: trânsitos lentos (Júp/Sat por signo) — amostragem adaptada
  if(ZOOM!=='dia'){
    const stepD=ZOOM==='vida'?120:ZOOM==='decada'?30:ZOOM==='ano'?7:1;
    [['Jupiter','#c9a86a',110],['Saturn','#9aa3ad',122]].forEach(([bn,col,yy])=>{
      let prevSign=null,segStart=t0;
      for(let t=t0;t<=t1;t+=stepD*DAY){
        const sg=Math.floor(tlon(bn,new Date(t))/30);
        if(prevSign===null){prevSign=sg;segStart=t;}
        else if(sg!==prevSign||t+stepD*DAY>t1){
          s+='<rect x="'+XX(segStart)+'" y="'+yy+'" width="'+Math.max(1,XX(t)-XX(segStart))+'" height="10" fill="'+col+'" opacity=".35" stroke="#0a0e14" stroke-width=".5"/>';
          if(XX(t)-XX(segStart)>24)s+='<text x="'+(XX(segStart)+2)+'" y="'+(yy+8)+'" font-size="7.5" font-family="IBM Plex Mono" fill="#e8e4d8" opacity=".7">'+SG[prevSign]+'</text>';
          prevSign=sg;segStart=t;
        }
      }
    });
  }
  // 7: ativações rápidas (só nos zooms ano/mês/dia)
  if(ZOOM==='ano'||ZOOM==='mes'||ZOOM==='dia'){
    const step=ZOOM==='ano'?7:1;
    for(let t=t0;t<=t1;t+=step*DAY){
      const top=scoredHits(new Date(t),5);
      if(top.length){const h=top[0];
        s+='<circle cx="'+XX(t)+'" cy="150" r="'+Math.min(6,2+h.rel.score/3)+'" fill="'+(h.cls==='tens'?'#b0564a':h.cls==='harm'?'#5f9e7f':'#c9a86a')+'" opacity=".8"><title>'+fdate(new Date(t))+': '+h.tg+' '+h.gl+' '+h.np.g+' ('+h.rel.tier+')</title></circle>';}
    }
  }
  // 8: eventos pessoais
  EVENTS.forEach(ev=>{
    const t=new Date(ev.d).getTime(); if(t<t0||t>t1)return;
    s+='<circle cx="'+XX(t)+'" cy="177" r="4" fill="#8878a8"><title>'+esc(ev.txt)+' ('+ev.d+')</title></circle>';
  });
  // cursor + pino A
  s+='<line x1="'+XX(CURSOR.getTime())+'" y1="2" x2="'+XX(CURSOR.getTime())+'" y2="190" stroke="#e8e4d8" stroke-width="1.4"/>';
  if(PINNED) s+='<line x1="'+XX(PINNED.getTime())+'" y1="2" x2="'+XX(PINNED.getTime())+'" y2="190" stroke="#c9a86a" stroke-width="1.2" stroke-dasharray="4 3"/>';
  // régua
  const years=(t1-t0)/DAY/365.25;
  const tick=years>30?10:years>8?2:years>1.5?0.5:years>0.1?1/12:1/365;
  for(let yy=Math.ceil((t0-BIRTH)/DAY/365.2425/tick)*tick;;yy+=tick){
    const t=BIRTH+yy*365.2425*DAY;if(t>t1)break;
    s+='<line x1="'+XX(t)+'" y1="192" x2="'+XX(t)+'" y2="198" stroke="#33415a"/>';
    const d=new Date(t);
    const lbl=tick>=1?String(d.getUTCFullYear()):tick>=1/12?MESES[d.getUTCMonth()]:String(d.getUTCDate());
    s+='<text x="'+XX(t)+'" y="210" font-size="8" text-anchor="middle" font-family="IBM Plex Mono" fill="#66707c">'+lbl+'</text>';
  }
  s+='<text x="'+(W-6)+'" y="232" font-size="8" text-anchor="end" font-family="IBM Plex Mono" fill="#66707c">arraste para mover o cursor · zoom: '+ZOOM+'</text>';
  svg.innerHTML=s;
}
function cordDrag(){
  const svg=$('cord'); let dragging=false;
  const pick=e=>{
    const r=svg.getBoundingClientRect();
    const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
    const W=r.width,L=90*(W/(svg.viewBox.baseVal.width||W));
    const [t0,t1]=cordRange();
    const t=t0+((x-L)/(W-L-8))*(t1-t0);
    if(isFinite(t)){CURSOR=new Date(Math.max(BIRTH,Math.min(BIRTH+75*365.2425*DAY,t)));syncTempo();}
  };
  svg.addEventListener('pointerdown',e=>{dragging=true;pick(e);});
  window.addEventListener('pointermove',e=>{if(dragging)pick(e);});
  window.addEventListener('pointerup',()=>dragging=false);
}
function mandala(d){
  const svg=$('mandala'); const C=230,R1=222,R2=190,R3=156,R4=106;
  const age=ageAt(d);
  const rot=(Math.floor(Math.max(0,age))%12)*30;
  const P=(lon,r)=>{const a=(180-(n360(lon)-NATAL.asc)-rot)*Math.PI/180;return [C+r*Math.cos(a),C-r*Math.sin(a)];};
  let s='<circle cx="'+C+'" cy="'+C+'" r="'+R1+'" fill="none" stroke="#33415a"/>'
    +'<circle cx="'+C+'" cy="'+C+'" r="'+R2+'" fill="none" stroke="#232e3f"/>'
    +'<circle cx="'+C+'" cy="'+C+'" r="'+R3+'" fill="none" stroke="#232e3f"/>';
  for(let i=0;i<12;i++){const [x1,y1]=P(i*30,R3),[x2,y2]=P(i*30,R1);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#232e3f"/>';
    const [tx,ty]=P(i*30+15,(R1+R2)/2);
    s+='<text x="'+tx+'" y="'+(ty+3)+'" text-anchor="middle" font-size="8.5" font-family="IBM Plex Mono" letter-spacing="1" fill="#a88b52">'+SG[i]+'</text>';}
  Object.entries(NATAL.pts).forEach(([k,p])=>{if(k==='spirit')return;const [x,y]=P(p.lon,(R2+R3)/2-5);
    s+='<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" font-size="13" font-family="Cormorant Garamond" fill="#c9a86a">'+p.g+'</text>';});
  const hits=transitHits(d), TPOS={};
  TB.forEach(([bn,key])=>{TPOS[key]=tlon(bn,d);});
  hits.slice(0,10).forEach(h=>{if(h.nk==='asc'||h.nk==='mc')return;
    const [x1,y1]=P(TPOS[h.tKey],R4),[x2,y2]=P(h.np.lon,(R2+R3)/2-12);
    const col=h.cls==='harm'?'#5f9e7f':h.cls==='tens'?'#b0564a':'#c9a86a';
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width=".9" opacity="'+(0.75-h.orb*0.07)+'"/>';});
  Object.entries(TPOS).forEach(([key,Lg])=>{const [x,y]=P(Lg,R4);const g=TB.find(t=>t[1]===key)[2];
    s+='<circle cx="'+x+'" cy="'+y+'" r="1.8" fill="#e8e4d8"/><text x="'+x+'" y="'+(y-6)+'" text-anchor="middle" font-size="11" fill="#e8e4d8">'+g+'</text>';});
  s+='<text x="6" y="'+(C+3)+'" font-size="8" font-family="IBM Plex Mono" fill="#66707c">ASC·PROF</text>';
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
    html+='<details class="era"'+(isNow?' open':'')+'><summary><span class="dotc" style="background:'+(FIRD_COLORS[nm]||'#888')+'"></span>Era de '+nm+' <span style="color:var(--dim2);font-weight:400">· '+len+' anos</span><span class="yrs">'+(new Date(BIRTH).getUTCFullYear()+Math.round(a0))+'–'+(new Date(BIRTH).getUTCFullYear()+Math.round(a1))+'</span></summary>'
      +'<div class="era-intro">'+(ERA_TXT[nm]||'')+'</div><div class="yrgrid">'+cards+'</div></details>';
  });
  const led=$('fird-ledger'); led.innerHTML=html;
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
  if(!sel.options.length){
    Object.keys(RS_DATA).sort().forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent='RS '+y+' · '+(+y-1994)+' anos';sel.appendChild(o);});
    sel.value=Object.keys(RS_DATA).includes(String(rsYearOf(new Date())))?String(rsYearOf(new Date())):(Object.keys(RS_DATA).sort().slice(-1)[0]||'');
    sel.onchange=renderRS;
    $('rs-cmp').onclick=()=>{renderRS(true);};
  }
  const y=+sel.value, rs=RS_DATA[y], a=y-new Date(BIRTH).getUTCFullYear(), p=profAt(a), f=firdAt(a+0.05);
  const block=(yy,rr,aa)=>{
    const pp=profAt(aa),ff=firdAt(aa+0.05);
    return '<div class="card"><div class="kicker">Revolução Solar '+yy+' · '+aa+' anos · '+ff.major+'/'+ff.sub+' · profecção casa '+pp.houseN+' ('+pp.sign+') · Senhor '+PT_NAME[pp.lordKey]+'</div>'
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
