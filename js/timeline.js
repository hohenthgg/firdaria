/* ============================================================
   TIMELINE.JS — painel temporal compacto
   Duas visões: Síntese (faixas horizontais) · Órbita (mandala ≤460px)
   Três colunas: técnicas · visualização · síntese do momento
   A leitura longa (IA e detalhe técnico) vai para um drawer lateral.
   ============================================================ */
/* visão única: Síntese (a Órbita foi removida) */

/* glifo de signo como ícone de texto: o seletor de variação impede o emoji */
function sgGlyph(idx){return (SIGN_GLYPHS[idx]||'')+'\uFE0E';}
function sgOf(lon){return sgGlyph(signOf(lon));}

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
  out+=faixa('Profecção','Casa '+S.profHouse+' · '+sgGlyph(S.p.signIdx)+' '+(PT_GLYPH[S.lord]||'')+'︎ '+PT_NAME[S.lord],
    W.prof.ini.getUTCFullYear()+' – '+W.prof.fim.getUTCFullYear(), s3,
    (S.age-Math.floor(S.age/12)*12)/12*100);

  /* revolução — o retorno vigente em doze partes */
  const R=S.rev;
  if(R&&R.end){
    const sAsc=signOf(R.ascLon);
    /* os doze signos em ordem zodiacal fixa; o aceso é o signo do
       Ascendente do retorno — a agulha aponta esse mesmo signo,
       porque aqui a barra ordena signos, não tempo */
    let s4='';
    for(let i=0;i<12;i++)s4+=seg(1,sgGlyph(i),i===sAsc,null,SIGNS[i]);
    out+=faixa('Revolução',sgOf(R.ascLon)+' '+R.ascSignNm,
      fdate(R.start)+' – '+fdate(R.end), s4, (sAsc+0.5)/12*100);
  } else {
    out+=faixa('Revolução','—','retorno indisponível',seg(1,'',false,null,null),0);
  }
  return '<div class="tl-tracks">'+out+'</div>';
}

/* ---------- coluna esquerda: as quatro camadas, em trilho numerado ---------- */
function tempoExecCards(d){
  const S=tempoState(d); if(!S)return '';
  const W=tlWindows(S);
  const card=(n,cor,layer,kicker,glifo,nome,periodo,frase)=>
    '<div class="tw-row '+cor+'">'
    +'<div class="tw-num"><span>'+n+'</span></div>'
    +'<button class="tw-c'+(TP_LAYER===layer?' on':'')+'" data-layer="'+layer+'">'
      +'<span class="tw-g">'+glifo+'</span>'
      +'<span class="tw-b"><em>'+kicker+'</em><b>'+nome+'</b><p>'+frase+'</p></span>'
      +'<span class="tw-r"><i>'+periodo+'</i><span class="tw-x">›</span></span>'
    +'</button></div>';
  const out=[];
  out.push(card(1,'k1','firdaria','Firdária',(PT_GLYPH[S.mk]||'✦')+'︎',
    PT_NAME[S.mk]||S.f.major,
    W.fird.ini.getUTCFullYear()+' – '+W.fird.fim.getUTCFullYear(),
    S.rulesMk.length?('Mantém '+casasTag(S.rulesMk)+' em primeiro plano.')
      :'Capítulo curto, sem casa administrada.'));
  out.push(card(2,'k2','sub','Subfirdária',(PT_GLYPH[S.sk||S.f.majorKey]||'✦')+'︎',
    PT_NAME[S.sk||S.f.majorKey]||'—',
    W.sub.fim?('até '+fdate(W.sub.fim)):'—',
    S.sk?('Traz '+casasTag(S.rulesSk)+' como assunto imediato.')
      :'A fase repete o regente do ciclo, em estado concentrado.'));
  out.push(card(3,'k3','profeccao','Profecção',(PT_GLYPH[S.lord]||'✦')+'︎',
    'Casa '+S.profHouse+' · '+PT_NAME[S.lord],
    W.prof.ini.getUTCFullYear()+' – '+W.prof.fim.getUTCFullYear(),
    'O ano trata de '+casaTag(S.profHouse)+', sob '+PT_NAME[S.lord]+'.'));
  const R=S.rev;
  out.push(R
    ? card(4,'k4','revolucao','Revolução '+R.label,sgOf(R.ascLon),R.ascSignNm,
        fdate(R.start)+(R.end?(' – '+fdate(R.end)):''),
        'O período tende a se manifestar por '+casaTag(R.ascNatalHouse)+'.')
    : card(4,'k4','revolucao','Revolução','✦','—','—',
        'Importe o mapa pelo link para calcular os retornos.'));
  return out.join('');
}
/* ---------- coluna direita: a leitura, camada por camada ---------- */
/* a síntese junta as três frases que já existem nos cartões — não cria leitura nova */
function tlSinteseTxt(S){
  const m=[];
  const push=(tag,fonte)=>{if(!tag)return;
    const e=m.find(x=>x.tag===tag); if(e)e.f.push(fonte); else m.push({tag,f:[fonte]});};
  if(S.rulesMk&&S.rulesMk.length)push(casasTag(S.rulesMk),'a firdária');
  if(S.sk&&S.rulesSk&&S.rulesSk.length)push(casasTag(S.rulesSk),'a fase');
  push(casaTag(S.profHouse),'a profecção');
  if(S.rev)push(casaTag(S.rev.ascNatalHouse),'a revolução');
  if(!m.length)return '';
  const fr=m.map(x=>x.f.length>1
    ? lista(x.f)+' apontam '+prep('para',x.tag)
    : x.f[0]+' aponta '+prep('para',x.tag));
  return cap1(fr.join('; '))+'.'
    +(m.some(x=>x.f.length>1)?' As técnicas convergem sobre a mesma matéria.':'');
}
function tlSideHTML(d,S){
  const R=S.rev, it=[];
  it.push(['k1',(PT_GLYPH[S.mk]||'✦')+'︎',
    (PT_NAME[S.mk]||S.f.major)+' — Firdária',
    tlWindows(S).fird.ini.getUTCFullYear()+' – '+tlWindows(S).fird.fim.getUTCFullYear(),
    PT_NAME[S.mk]
      ? ('É o pano de fundo do ciclo. '+cap1(casasTag(S.rulesMk))+' em primeiro plano'
        +(S.occMk?(', com a execução passando por '+casaTag(S.occMk)):'')+'.')
      : 'Passagem de nodo: capítulo curto, sem casa administrada.']);
  it.push(['k2',(PT_GLYPH[S.sk||S.f.majorKey]||'✦')+'︎',
    (PT_NAME[S.sk||S.f.majorKey]||'—')+' — Subfirdária',
    tlWindows(S).sub.fim?('até '+fdate(tlWindows(S).sub.fim)):'—',
    S.sk
      ? ('No momento, '+casasTag(S.rulesSk)+' entra'+(/\se\s/.test(casasTag(S.rulesSk))?'m':'')
        +' como assunto imediato. '+cap1(relBetween(S.mk,S.sk).txt)+'.')
      : 'A fase repete o regente do ciclo, em estado concentrado — sem assunto secundário próprio.']);
  it.push(['k3',(PT_GLYPH[S.lord]||'✦')+'︎',
    'Casa '+S.profHouse+' · '+PT_NAME[S.lord]+' — Profecção',
    tlWindows(S).prof.ini.getUTCFullYear()+' – '+tlWindows(S).prof.fim.getUTCFullYear(),
    'O foco do ano está '+prep('em',casaTag(S.profHouse))+', administrada por '+PT_NAME[S.lord]
      +(S.occLord?(', que atua por '+casaTag(S.occLord)):'')+'.']);
  if(R)it.push(['k4',sgOf(R.ascLon),
    R.ascSignNm+' — Revolução '+R.label,
    fdate(R.start)+(R.end?(' – '+fdate(R.end)):''),
    'O cenário do período é '+casaTag(R.ascNatalHouse)+': o Ascendente do retorno em '
      +R.ascSignNm+' cai '+prep('em',ordinal(R.ascNatalHouse))+' natal, sob '+PT_NAME[R.ascRuler]+'.']);
  return '<div class="tw-h"><span class="tw-hi">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">'
    +'<path d="M3 5.5C5.5 4 8.5 4 12 5.5c3.5-1.5 6.5-1.5 9 0V19c-2.5-1.5-5.5-1.5-9 0-3.5-1.5-6.5-1.5-9 0z"/>'
    +'<path d="M12 5.5V19"/></svg></span><h3>A leitura</h3></div>'
    +'<div class="tw-div">◈</div>'
    +'<ol class="tw-list">'+it.map((x,i)=>'<li class="'+x[0]+'">'
      +'<span class="tw-bg">'+x[1]+'</span>'
      +'<div><b>'+(i+1)+'. '+x[2]+'</b> <i>('+x[3]+')</i>'
      +'<p>'+x[4]+'</p></div></li>').join('')+'</ol>'
    +'<div class="tw-sint"><span class="tw-bg">✦</span>'
      +'<div><b>Síntese</b><p>'+tlSinteseTxt(S)+'</p></div></div>'
    +'<button class="tw-ia" id="tl-ia">✦ Analisar com IA</button>'
    +'<p class="tw-note">Leitura montada pelo motor local, em ordem hierárquica: '
    +'firdária → fase → profecção → revolução.</p>';
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
  const viz=$('tl-viz');
  if(viz){try{viz.innerHTML=tlTracksHTML(d,S);}catch(e){console.error('tracks',e);viz.innerHTML='';}}
  if($('tempo-exec'))$('tempo-exec').innerHTML=tempoExecCards(d);
  if($('tl-side'))$('tl-side').innerHTML=tlSideHTML(d,S);
  try{ if(typeof renderPreditivas==='function')renderPreditivas(); }catch(e){console.error('preditivas',e);}
}
function bindTimeline(){
  const p=$('p-tempo'); if(!p)return;
  p.addEventListener('click',e=>{
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
}
