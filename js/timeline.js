/* ============================================================
   TIMELINE.JS — painel temporal compacto
   Duas visões: Síntese (faixas horizontais) · Órbita (mandala ≤460px)
   Três colunas: técnicas · visualização · síntese do momento
   A leitura longa (IA e detalhe técnico) vai para um drawer lateral.
   ============================================================ */
let TL_MODE=(function(){try{return localStorage.getItem('agx_tlmode')||'sintese';}catch(e){return 'sintese';}})();
function tlSetMode(m){TL_MODE=m;try{localStorage.setItem('agx_tlmode',m);}catch(e){}syncTempo();}

/* ---------- janelas de cada técnica (só datas, sem recalcular nada) ---------- */
function tlWindows(S){
  const f=S.f, aIni=Math.floor(S.age);
  const yr=a=>new Date(BIRTH+a*365.2425*DAY);
  return {
    fird:{ini:yr(f.from||0), fim:yr((f.from||0)+(f.len||0))},
    sub:{ini:f.subStart?new Date(f.subStart):null, fim:f.subEnd?new Date(f.subEnd):null},
    prof:{ini:yr(aIni), fim:yr(aIni+1)},
    rev:S.rev?{ini:S.rev.start, fim:S.rev.end}:null
  };
}

/* ---------- VISÃO SÍNTESE: quatro faixas horizontais ---------- */
function tlTracksHTML(d,S){
  const W=tlWindows(S), TAU=FIRD.reduce((a,f)=>a+f[2],0);
  const faixa=(kicker,titulo,periodo,segs,pos)=>
    '<div class="tk"><div class="tk-h"><span>'+kicker+'</span><b>'+titulo+'</b><em>'+periodo+'</em></div>'
    +'<div class="tk-bar">'+segs
    +'<span class="tk-now" style="left:'+Math.max(0,Math.min(100,pos)).toFixed(2)+'%"></span></div></div>';
  const seg=(peso,rot,on,goto,tit)=>'<i class="tk-s'+(on?' on':'')+'" style="flex:'+peso+'"'
    +(goto!=null?(' data-goto="'+goto+'"'):'')+(tit?(' title="'+tit+'"'):'')+'>'+(rot||'')+'</i>';
  let out='';

  /* firdária — a vida inteira, proporcional */
  let acc=0, s1='';
  FIRD.forEach(([k,nm,len])=>{
    const on=(S.age>=acc&&S.age<acc+len);
    s1+=seg(len,on?((PT_GLYPH[k]||'')+'︎ '+(PT_NAME[k]||nm)):((PT_GLYPH[k]||'')+'︎'),on,acc+len/2,(PT_NAME[k]||nm)+' · '+len+' anos');
    acc+=len;});
  out+=faixa('Firdária',(PT_GLYPH[S.mk]||'')+'︎ '+(PT_NAME[S.mk]||S.f.major),
    W.fird.ini.getUTCFullYear()+' – '+W.fird.fim.getUTCFullYear(), s1, S.age/TAU*100);

  /* subfirdária — sete fases do período vigente */
  const base=S.f.from||0, len=S.f.len||1, part=len/7;
  const subs=FIRD.slice(0,7).map(f=>f[0]); let si=subs.indexOf(S.f.majorKey); if(si<0)si=0;
  let s2='';
  for(let i=0;i<7;i++){const sk=subs[(si+i)%7], on=(S.age>=base+i*part&&S.age<base+(i+1)*part);
    s2+=seg(1,on?((PT_GLYPH[sk]||'')+'︎ '+PT_NAME[sk]):((PT_GLYPH[sk]||'')+'︎'),on,base+i*part+part/2,PT_NAME[sk]);}
  out+=faixa('Subfirdária',(PT_GLYPH[S.sk||S.f.majorKey]||'')+'︎ '+(PT_NAME[S.sk||S.f.majorKey]||'—'),
    W.sub.fim?('até '+fdate(W.sub.fim)):'—', s2, (S.age-base)/len*100);

  /* profecção — doze casas do ciclo, só os números */
  const anoBase=Math.floor(S.age)-(Math.floor(S.age)%12);
  let s3='';
  for(let i=0;i<12;i++){const casa=i+1, on=(S.profHouse===casa);
    s3+=seg(1,''+casa,on,anoBase+i+0.5,'Casa '+casa+' — '+casaTag(casa));}
  out+=faixa('Profecção','Casa '+S.profHouse+' · '+(PT_GLYPH[S.lord]||'')+'︎ '+PT_NAME[S.lord],
    W.prof.ini.getUTCFullYear()+' – '+W.prof.fim.getUTCFullYear(), s3,
    (S.age-Math.floor(S.age/12)*12)/12*100);

  /* revolução — o retorno vigente em doze partes */
  const R=S.rev;
  if(R&&R.end){
    const dur=R.end-R.start, pos=(d.getTime()-R.start.getTime())/dur*100, at=Math.floor(pos/100*12);
    let s4='';
    for(let i=0;i<12;i++)s4+=seg(1,'',i===at,null,null);
    out+=faixa('Revolução',R.label+' · Asc em '+R.ascSignNm,
      fdate(R.start)+' – '+fdate(R.end), s4, pos);
  } else {
    out+=faixa('Revolução','—','retorno indisponível',seg(1,'',false,null,null),0);
  }
  return '<div class="tl-tracks">'+out+'</div>';
}

/* ---------- coluna esquerda: quatro cards compactos ---------- */
function tempoExecCards(d){
  const S=tempoState(d); if(!S)return '';
  const W=tlWindows(S);
  const card=(layer,tec,glyph,ativo,periodo,frase)=>
    '<button class="tpc2'+(TP_LAYER===layer?' on':'')+'" data-layer="'+layer+'">'
    +'<span class="tpc2-k">'+tec+'</span>'
    +'<span class="tpc2-t"><i>'+glyph+'</i>'+ativo+'</span>'
    +'<span class="tpc2-p">'+periodo+'</span>'
    +'<span class="tpc2-d">'+frase+'</span></button>';
  const out=[];
  out.push(card('firdaria','Firdária',(PT_GLYPH[S.mk]||'✦')+'︎',PT_NAME[S.mk]||S.f.major,
    W.fird.ini.getUTCFullYear()+' – '+W.fird.fim.getUTCFullYear(),
    S.rulesMk.length?('Mantém '+casasTag(S.rulesMk)+' em primeiro plano.')
      :'Capítulo curto, sem casa administrada.'));
  out.push(card('sub','Subfirdária',(PT_GLYPH[S.sk||S.f.majorKey]||'✦')+'︎',PT_NAME[S.sk||S.f.majorKey]||'—',
    W.sub.fim?('até '+fdate(W.sub.fim)):'—',
    S.sk?('Traz '+casasTag(S.rulesSk)+' como assunto imediato.')
      :'A fase repete o regente do ciclo, em estado concentrado.'));
  out.push(card('profeccao','Profecção',(PT_GLYPH[S.lord]||'✦')+'︎','Casa '+S.profHouse+' · '+PT_NAME[S.lord],
    W.prof.ini.getUTCFullYear()+' – '+W.prof.fim.getUTCFullYear(),
    'O ano trata de '+casaTag(S.profHouse)+', sob '+PT_NAME[S.lord]+'.'));
  const R=S.rev;
  out.push(R?card('revolucao','Revolução '+R.label,'⌂',R.ascSignNm,
      fdate(R.start)+(R.end?(' – '+fdate(R.end)):''),
      'O período tende a se manifestar por '+casaTag(R.ascNatalHouse)+'.')
    :card('revolucao','Revolução','⌂','—','—','Importe o mapa pelo link para calcular os retornos.'));
  return out.join('');
}

/* ---------- coluna direita: síntese curta do momento ---------- */
function tlTema(S){
  return cap1(casaTag(S.profHouse))+(PT_NAME[S.mk]?(' · agenda de '+PT_NAME[S.mk]):'');
}
function tlAparece(S){
  const R=S.rev;
  if(R)return cap1(casaTag(R.ascNatalHouse))+' ('+ordinal(R.ascNatalHouse)+' natal)';
  return S.occLord?(cap1(casaTag(S.occLord))+' ('+ordinal(S.occLord)+' natal)'):'—';
}
function tlPromessasAtivas(d,S){
  return (typeof PROMESSAS!=='undefined'?PROMESSAS:[])
    .map(pr=>({pr,st:promiseState(pr,d,S)}))
    .filter(x=>x.st.estado==='ativada').slice(0,2).map(x=>x.pr.t);
}
function tlCondicao(S){
  const q=qualidade(S.lord);
  const v={boa:'tende a entregar',condicional:'entrega conforme os apoios',travada:'exige mais esforço e tempo'}[q.nivel]||'condição não avaliável';
  return cap1(PT_NAME[S.lord]||'—')+' '+v;
}
/* casas realmente acionadas no período, com o motivo de cada uma */
function tlCasasAtivadas(d,S){
  const m={};
  const add=(h,motivo)=>{if(!h)return;(m[h]=m[h]||[]).push(motivo);};
  add(S.profHouse,'casa do ano');
  S.rulesMk.forEach(h=>add(h,'firdária'));
  S.rulesSk.forEach(h=>add(h,'subfirdária'));
  S.rulesLord.forEach(h=>add(h,'Senhor do Ano'));
  if(S.rev)add(S.rev.ascNatalHouse,'ambiente do retorno');
  return Object.keys(m).map(Number).sort((a,b)=>m[b].length-m[a].length||a-b)
    .map(h=>({h,motivos:[...new Set(m[h])]}));
}
function tlSideHTML(d,S){
  const linha=(k,v)=>'<div class="tls-r"><span>'+k+'</span><b>'+v+'</b></div>';
  const proms=tlPromessasAtivas(d,S);
  let out='<section class="tls"><div class="kicker">síntese do momento</div>'
    +linha('Tema dominante',tlTema(S))
    +linha('Como tende a aparecer',tlAparece(S))
    +linha('Promessas mais ativadas',proms.length?proms.join(' · '):'nenhuma em convergência agora')
    +linha('Condição do período',tlCondicao(S))
    +'</section>';
  const casas=tlCasasAtivadas(d,S);
  const rank=planetRanking(d,S).slice(0,4);
  out+='<section class="tls"><div class="kicker">casas ativadas</div><div class="tlch">'
    +casas.map(c=>'<span class="tlc'+(c.h===S.profHouse?' on':'')+'" title="'+c.motivos.join(' · ')+'">'
      +'<b>'+c.h+'ª</b>'+casaTag(c.h)+'</span>').join('')
    +'</div>'
    +'<div class="tls-sep"></div><div class="kicker">convergências principais</div>'
    +rank.map(r=>'<div class="tlb"><span>'+(PT_GLYPH[r.k]||'')+'︎ '+PT_NAME[r.k]+'</span>'
      +'<i><em style="width:'+r.p+'%"></em></i><u>'+r.p+'%</u></div>').join('')
    +'<p class="tls-n">Convergência interna entre técnicas: ordena o que olhar primeiro, não é probabilidade de evento.</p>'
    +'</section>'
    +'<button class="ia-btn sm" id="tl-ia">✦ Analisar com IA</button>';
  return out;
}

/* ---------- drawer lateral: leitura longa fora do fluxo da página ---------- */
function tlDrawer(titulo,html){
  const d=$('tl-drawer'); if(!d)return;
  $('drw-t').textContent=titulo;
  $('drw-body').innerHTML=html;
  $('drw-body').scrollTop=0;
  d.hidden=false; document.body.classList.add('drw-open');
}
function tlDrawerClose(){
  const d=$('tl-drawer'); if(!d)return;
  d.hidden=true; document.body.classList.remove('drw-open');
  TP_LAYER=null;
  const ex=$('tempo-exec'); if(ex)ex.querySelectorAll('.tpc2.on').forEach(b=>b.classList.remove('on'));
}

/* ---------- orquestração ---------- */
function syncTempo(){
  if(typeof NATAL==='undefined'||!NATAL){
    ['tempo-exec','tl-side','fird-ledger'].forEach(id=>{if($(id))$(id).innerHTML='';});
    if($('tl-viz'))$('tl-viz').innerHTML=emptyState();
    return;}
  const d=CURSOR, S=tempoState(d); if(!S)return;
  if($('tempo-date'))$('tempo-date').textContent=fdate(d);
  if($('tempo-age'))$('tempo-age').textContent=Math.floor(S.age)+' anos';
  if($('tempo-pick'))$('tempo-pick').value=d.toISOString().slice(0,10);
  const sel=$('tempo-revsel2');
  if(sel){ if(sel.dataset.built!=='1'){
      sel.innerHTML=revKinds().map(k=>'<option value="'+k.id+'">'+k.label+'</option>').join('');
      sel.dataset.built='1'; sel.onchange=()=>{revSetKind(sel.value);syncTempo();}; }
    sel.value=REV_SEL; }
  document.querySelectorAll('#tl-mode [data-tlm]').forEach(b=>b.classList.toggle('on',b.dataset.tlm===TL_MODE));
  const viz=$('tl-viz');
  if(viz){
    if(TL_MODE==='orbita'){
      viz.innerHTML='<div class="tl-orbit"><svg id="cord"></svg></div>';
      try{drawCord();}catch(e){console.error('cord',e);}
    } else {
      try{viz.innerHTML=tlTracksHTML(d,S);}catch(e){console.error('tracks',e);viz.innerHTML='';}
    }
  }
  if($('tempo-exec'))$('tempo-exec').innerHTML=tempoExecCards(d);
  if($('tl-side'))$('tl-side').innerHTML=tlSideHTML(d,S);
}
function bindTimeline(){
  const p=$('p-tempo'); if(!p)return;
  p.addEventListener('click',e=>{
    const m=e.target.closest&&e.target.closest('[data-tlm]');
    if(m){tlSetMode(m.dataset.tlm);return;}
    const g=e.target.closest&&e.target.closest('[data-goto]');
    const lay=e.target.closest&&e.target.closest('[data-layer]');
    // setores da mandala e segmentos das faixas navegam no tempo
    if(g){const age=+g.dataset.goto;
      if(isFinite(age)&&age>=0&&age<75)CURSOR=new Date(BIRTH+age*365.2425*DAY);}
    if(lay)TP_LAYER=lay.dataset.layer;
    if(g||lay)syncTempo();
    if(lay){try{tlDrawer('Detalhe técnico',tempoDetailHTML(TP_LAYER,CURSOR));}catch(x){console.error(x);}}
    if(g||lay)return;
    if(e.target.closest&&e.target.closest('#tl-ia')){
      try{tlDrawer('Síntese do período',tlIaHTML(CURSOR));}catch(x){console.error(x);}
    }
  });
  const dr=$('tl-drawer');
  if(dr)dr.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-drwclose]'))tlDrawerClose();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')tlDrawerClose();});
  window.addEventListener('resize',()=>{try{if(TL_MODE==='orbita'&&$('p-tempo').classList.contains('on'))drawCord();}catch(e){}});
}
