/* util: estado vazio */
function emptyState(){return '<div class="card"><div class="kicker">sem mapa carregado</div><p>Informe o mapa natal na aba <b>Dados</b> para o sistema gerar a estrutura interpretativa.</p></div>';}
/* ============================================================
   RENDER.JS — renderização das telas.
   ============================================================ */

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/</g,'&lt;');
let CURSOR=new Date();            // cursor temporal global
const EVENTS=JSON.parse(localStorage.getItem('ag_events')||'[]'); // eventos pessoais
const EVAL=JSON.parse(localStorage.getItem('ag_eval')||'{}');     // avaliações retrospectivas


/* ================= MAPA NATAL + camadas + promessas ================= */

function renderNatal(){
  if(typeof renderNatalTab==='function'){try{renderNatalTab();}catch(e){console.error('natal',e);}}
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

document.addEventListener('click',e=>{
  if(!e.target.closest)return;
  const k=e.target.closest('[data-rsk]');
  if(k){RS_KIND=k.dataset.rsk;RS_CURSOR=null;renderRS();return;}
  const j=e.target.closest('[data-rsjump]');
  if(j){RS_CURSOR=new Date(+j.dataset.rsjump+DAY);renderRS();return;}
  const c=e.target.closest('#rs-cmp-chk-btn');
  if(c){RS_CMP=!RS_CMP;c.classList.toggle('on',RS_CMP);renderRS();return;}
});


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
  // correspondências tipológicas migraram para a aba Tipologias
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
