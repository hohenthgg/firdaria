/* ============================================================
   HOJE.JS — a tela inicial.

   Resume, numa página só, o que está vigente agora: os quatro ciclos,
   os trânsitos que o motor considera mais relevantes hoje e o que vem
   a seguir (viradas de ciclo, retornos e eventos marcados).
   Não calcula nada por conta própria: lê o mesmo estado que as
   outras abas usam.
   ============================================================ */

function hojeCiclosHTML(S){
  if(!S)return '';
  const W=(typeof tlWindows==='function')?tlWindows(S):null;
  const per=(a,b)=>a?(fdate(a)+(b?(' – '+fdate(b)):'')):'—';
  const it=[
    ['k1','Firdária',(PT_GLYPH[S.mk]||'✦')+'︎',PT_NAME[S.mk]||S.f.major,
      W?per(W.fird.ini,W.fird.fim):'—',
      S.rulesMk.length?('Mantém '+casasTag(S.rulesMk)+' em primeiro plano.'):'Capítulo curto, sem casa administrada.'],
    ['k2','Subfirdária',(PT_GLYPH[S.sk||S.f.majorKey]||'✦')+'︎',PT_NAME[S.sk||S.f.majorKey]||'—',
      W&&W.sub.fim?('até '+fdate(W.sub.fim)):'—',
      S.sk?('Traz '+casasTag(S.rulesSk)+' como assunto imediato.'):'A fase repete o regente do ciclo.'],
    /* o SIGNO ativado vem escrito no rótulo: é ele que define o Senhor do
       Ano, e sem nomeá-lo a casa 12 parece contradizer a cúspide natal */
    ['k3','Profecção',(PT_GLYPH[S.lord]||'✦')+'︎',
      'Casa '+S.profHouse+' · '+(S.p&&S.p.sign?S.p.sign:'')+' · '+PT_NAME[S.lord],
      W?per(W.prof.ini,W.prof.fim):'—',
      'O ano trata de '+casaTag(S.profHouse)+', sob '+PT_NAME[S.lord]+'.'
      +(S.p&&S.p.divergeCuspide
        ? ('<span class="hj-alt">Contado por signos inteiros, o '+S.profHouse
           +'º lugar a partir do Ascendente é <b>'+S.p.sign+'</b> — por isso o '
           +'Senhor do Ano é '+PT_NAME[S.p.lordKey]+'. A cúspide Placidus dessa '
           +'casa cai em '+S.p.cuspSignNm+', que daria '+PT_NAME[S.p.lordCuspide]
           +': critério alternativo, mostrado ao lado e nunca somado nem '
           +'substituído a este.</span>')
        : '')],
    S.rev
      ? ['k4','Revolução '+S.rev.label,sgOf(S.rev.ascLon),S.rev.ascSignNm,
         per(S.rev.start,S.rev.end),
         'O período tende a se manifestar por '+casaTag(S.rev.ascNatalHouse)+'.']
      : ['k4','Revolução','✦','—','—','Importe o mapa pelo link para calcular os retornos.']
  ];
  return '<div class="hj-ciclos">'+it.map(x=>
    '<article class="hj-c '+x[0]+'"><em>'+x[1]+'</em>'
    +'<div class="hj-ct"><span class="hj-cg">'+x[2]+'</span><b>'+x[3]+'</b></div>'
    +'<i>'+x[4]+'</i><p>'+x[5]+'</p></article>').join('')+'</div>';
}

/* trânsitos: os mesmos que o motor de relevância já pontua */
function hojeTransitosHTML(d){
  let L=[];
  try{ L=(typeof scoredHits==='function')?scoredHits(d,0).slice(0,5):[]; }catch(e){ L=[]; }
  if(!L.length)return '<p class="hj-vaz">Nenhum trânsito dentro do orbe sobre pontos natais sensíveis hoje.</p>';
  /* cada trânsito é mostrado como INTERVALO: entrada no orbe, exatidão e
     saída — e não como um instante nem como um acontecimento */
  const janela=h=>{
    let J=null;
    try{ J=(typeof transitoJanela==='function')
      ? transitoJanela(h.tn, h.np.lon, h.ang, h.orbMax||orbeDe(h.ang), d) : null; }
    catch(e){ J=null; }
    if(!J)return '';
    const dt=t=>t==null?'—':fdate(new Date(t));
    const ex=J.exatos.length
      ? J.exatos.map(t=>dt(t)).join(' · ')
      : 'não chega a perfazer';
    return '<span class="hj-jan">'
      +'<i>entra</i> '+dt(J.entrada)+' <i>exato</i> '+ex+' <i>sai</i> '+dt(J.saida)
      +(J.duracaoDias?(' <i>·</i> '+Math.round(J.duracaoDias)+' dias no orbe'):'')
      +(J.nota?('<em>'+J.nota+'</em>'):'')+'</span>';
  };
  return '<ul class="hj-tr">'+L.map(h=>
    '<li class="'+(h.cls||'')+'">'
    +'<span class="hj-tg">'+(PT_GLYPH[h.tKey]||'')+'︎</span>'
    +'<span class="hj-tt"><b>'+PT_NAME[h.tKey]+' '+h.gl+' '+(h.np?h.np.nm:'')+'</b>'
    +'<em>'+(h.rel&&h.rel.txt?h.rel.txt:'')+'</em>'
    +janela(h)+'</span>'
    +'<span class="hj-to">'+h.orb.toFixed(1)+'°</span></li>').join('')+'</ul>';
}

/* próximos acontecimentos: viradas de ciclo, retornos e eventos marcados */
function hojeProximosHTML(d,S){
  const hoje=d.getTime(), out=[];
  const add=(t,rot,txt)=>{
    if(!t||t<=hoje)return;
    const dia=Math.round(+t/86400000);
    if(out.some(x=>x.rot===rot&&Math.round(x.t/86400000)===dia))return;   // sem repetir a mesma virada
    out.push({t:+t,rot,txt});};
  if(S){
    const W=(typeof tlWindows==='function')?tlWindows(S):null;
    if(W){
      add(W.prof.fim,'Profecção','o Ascendente avança um signo e muda o Senhor do Ano');
      add(W.sub.fim,'Subfirdária','a fase do ciclo troca de regente');
      add(W.fird.fim,'Firdária','o período maior se encerra');
    }
    if(S.rev&&S.rev.end)add(S.rev.end,'Revolução '+S.rev.label,'novo retorno ao grau natal');
  }
  /* retornos dos outros tipos, quando calculáveis */
  if(typeof revKinds==='function'&&typeof revolutionFor==='function'){
    revKinds().forEach(K=>{
      try{const R=revolutionFor(K.id,d); if(R&&R.end)add(R.end,'Revolução '+K.label,'próximo retorno');}catch(e){}
    });
  }
  /* eventos que a pessoa marcou */
  try{(typeof EVENTS!=='undefined'?EVENTS:[]).forEach(e=>{
    const t=new Date(e.d).getTime(); add(t,'Evento marcado',e.txt);});}catch(e){}
  out.sort((a,b)=>a.t-b.t);
  const L=out.slice(0,6);
  if(!L.length)return '<p class="hj-vaz">Nada agendado adiante a partir dos dados atuais.</p>';
  const dias=t=>{const n=Math.round((t-hoje)/DAY);
    return n<=0?'hoje':n===1?'amanhã':n<31?('em '+n+' dias'):n<365?('em '+Math.round(n/30)+' meses'):('em '+(n/365.25).toFixed(1)+' anos');};
  return '<ul class="hj-px">'+L.map(x=>'<li><span class="hj-pd">'+fdate(new Date(x.t))+'</span>'
    +'<span class="hj-pt"><b>'+x.rot+'</b><em>'+x.txt+'</em></span>'
    +'<span class="hj-pq">'+dias(x.t)+'</span></li>').join('')+'</ul>';
}

function renderHoje(){
  const el=$('hoje-body'); if(!el)return;
  if(typeof NATAL==='undefined'||!NATAL){el.innerHTML=emptyState();return;}
  const d=new Date(), S=(typeof tempoState==='function')?tempoState(d):null;
  /* idade CIVIL — a mesma que decide a profecção. Com anos médios, o
     cabeçalho podia dizer 22 enquanto o card mostrava a casa dos 23. */
  const idade=(typeof idadeCivil==='function')?idadeCivil(d)
            : (typeof ageAt==='function'?Math.floor(ageAt(d)):null);
  el.innerHTML=
     '<div class="hj-top"><div><span class="hj-k">hoje</span>'
      +'<h3>'+fdate(d)+'</h3>'
      +'<em>'+((NATAL.meta&&NATAL.meta.name)?NATAL.meta.name+' · ':'')
      +(idade!=null?idade+' anos · ':'')+'mapa '+NATAL.sect+'</em></div>'
      +'<div class="hj-atalhos">'
        +'<button class="hj-a" data-goto-tab="tempo">Linha do tempo</button>'
        +'<button class="hj-a" data-goto-tab="natal">Mapa natal</button>'
        +'<button class="hj-a" data-goto-tab="rs">Revoluções</button>'
      +'</div></div>'
    +'<section class="hj-s"><h4>Quem conduz o seu mapa '
      +'<i>senhores natais — não mudam com a data</i></h4>'
      +((typeof senhoresHTML==='function')?senhoresHTML(d):'')+'</section>'
    +'<section class="hj-s"><h4>Ciclos vigentes</h4>'+hojeCiclosHTML(S)+'</section>'
    +'<div class="hj-2">'
      +'<section class="hj-s"><h4>Principais trânsitos de hoje '
        +'<i>ordenados pela repetição entre técnicas, não por probabilidade</i></h4>'
        +hojeTransitosHTML(d)+'</section>'
      +'<section class="hj-s"><h4>Próximos acontecimentos</h4>'+hojeProximosHTML(d,S)+'</section>'
    +'</div>';
}
