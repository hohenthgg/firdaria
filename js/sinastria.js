/* ============================================================
   SINASTRIA.JS — a arena dos dois mapas.
   Temperamentos em choque, batalha dos regentes do Ascendente
   e manifestação cruzada: onde cada planeta de um cai no mapa
   do outro, nas duas direções.
   ============================================================ */
let SINB=null;                       // mapa da Pessoa B (leve, não mexe nos globais)

/* ---------------- construção do mapa B ---------------- */
function sinBuild(parsed,birthISO,name,place){
  const faltam=[]; parsed.cusps.forEach((c,i)=>{if(c==null)faltam.push(i+1);});
  if(parsed.asc==null)faltam.push(1);
  if(faltam.length)throw new Error('cúspides ausentes no mapa B (casas '+[...new Set(faltam)].join(', ')+')');
  const cusps=parsed.cusps.slice(), asc=parsed.asc, mc=parsed.mc!=null?parsed.mc:cusps[9];
  const rulers={}; for(let h=1;h<=12;h++)rulers[h]=SIGN_RULER[signOf(cusps[h-1])];
  const sunL=parsed.pts.sun?parsed.pts.sun.lon:0;
  const pts={};
  ['sun','moon','mercury','venus','mars','jupiter','saturn'].forEach(k=>{
    const p=parsed.pts[k]; if(!p)return;
    const d=dignityOf(k,p.lon,!!p.retro,sunL);
    pts[k]={lon:p.lon,retro:!!p.retro,h:houseByRule(p.lon,cusps),dig:d.tags.join(' · '),pontos:d.pts};
  });
  return {name:name||'Pessoa B',birth:birthISO||null,place:place||null,asc,mc,cusps,pts,rulers};
}
function sinSave(st){try{localStorage.setItem('agx_sinB',JSON.stringify(st));}catch(e){}}
function sinLoad(){
  try{
    const st=JSON.parse(localStorage.getItem('agx_sinB')||'null'); if(!st)return null;
    const parsed=parseChartText(st.text); if(!parsed.ok)return null;
    return sinBuild(parsed,st.birth,st.name,st.place);
  }catch(e){console.error('sinastria B',e);return null;}
}
/* o mapa A é o NATAL vigente, adaptado à mesma interface leve */
function sinA(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const pts={};
  ['sun','moon','mercury','venus','mars','jupiter','saturn'].forEach(k=>{
    const p=NATAL.pts[k]; if(p)pts[k]={lon:p.lon,retro:!!p.retro,h:p.h,dig:p.dig||''};});
  return {name:(NATAL.meta&&NATAL.meta.name)||'Pessoa A',
    birth:new Date(BIRTH).toISOString().slice(0,10),
    asc:NATAL.asc,mc:NATAL.mc,cusps:NATAL.cusps,pts,rulers:NATAL.rulers};
}

const SIN_ELEM=['fogo','terra','ar','água'];
const sinElemOf=L=>SIN_ELEM[signOf(L)%4];

/* ============================================================
   ARENA — temperamentos em conflito, batalha de regentes e
   manifestação cruzada dos planetas. Cada carta diz onde o
   ponto está no próprio mapa e onde ele cai no mapa do outro.
   ============================================================ */
const SIN_ELEMQ={fogo:['quente','seco'],terra:['frio','seco'],ar:['quente','úmido'],'água':['frio','úmido']};
const SIN_PQUAL={sun:['quente','seco'],moon:['frio','úmido'],mercury:['frio','seco'],
  venus:['quente','úmido'],mars:['quente','seco'],jupiter:['quente','úmido'],saturn:['frio','seco']};
/* temperamento simétrico: os mesmos testemunhos para A e B (mapa leve) */
function sinTemperamento(C){
  const Q={quente:0,frio:0,seco:0,'úmido':0}, W=[];
  const add=(qs,w,fonte)=>{if(!qs)return;qs.forEach(q=>Q[q]+=w);W.push(fonte);};
  add(SIN_ELEMQ[sinElemOf(C.asc)],3,'Asc em '+SIGNS[signOf(C.asc)]);
  const ru=C.rulers[1], rp=C.pts[ru];
  if(rp)add(SIN_ELEMQ[sinElemOf(rp.lon)],3,'regente do Asc ('+PT_NAME[ru]+') em '+SIGNS[signOf(rp.lon)]);
  if(C.pts.moon)add(SIN_ELEMQ[sinElemOf(C.pts.moon.lon)],2,'Lua em '+SIGNS[signOf(C.pts.moon.lon)]);
  Object.entries(C.pts).forEach(([k,p])=>{if(p.h===1&&k!==ru)add(SIN_PQUAL[k],2,PT_NAME[k]+' na casa 1');});
  if(C.pts.moon&&C.pts.sun){
    const el=n360(C.pts.moon.lon-C.pts.sun.lon);
    add(el<90?['quente','úmido']:el<180?['quente','seco']:el<270?['frio','seco']:['frio','úmido'],1,'fase da Lua');
  }
  const hc=Q.quente+Q.frio||1, dm=Q.seco+Q['úmido']||1;
  const quente=Math.round(Q.quente/hc*100), seco=Math.round(Q.seco/dm*100);
  const humor=quente>=50?(seco>=50?'colérico':'sanguíneo'):(seco>=50?'melancólico':'fleumático');
  return {quente,seco,humor,W};
}
const SIN_HGL={'colérico':'🜂','sanguíneo':'🜁','melancólico':'🜃','fleumático':'🜄'};
const SIN_TVS={
  'colérico|colérico':'Fogo contra fogo. Os dois reagem rápido, decidem cedo e detestam ceder. A faísca é imediata — a briga também. Funciona enquanto houver inimigo comum; sem ele, o adversário vira o outro.',
  'colérico|sanguíneo':'O fogo comanda e o ar espalha. Muita energia junta e pouca paciência com o que demora. O risco não é a briga: é os dois acelerarem sem ninguém segurar o freio.',
  'colérico|melancólico':'Ímpeto contra cautela. Um decide no calor, o outro rumina no frio — e cada um lê o ritmo do outro como defeito. A secura em comum ajuda: os dois são teimosos demais para fingir.',
  'colérico|fleumático':'Opostos completos. Um esquenta, o outro apaga; um ataca, o outro absorve. Ou o colérico entende que calma não é lentidão, ou o fleumático vira parede — e parede cansa quem bate.',
  'sanguíneo|sanguíneo':'Ar com ar: leveza, conversa e movimento em dobro. O encontro é fácil; difícil é criar raiz. Sem um lastro externo, a relação circula muito e assenta pouco.',
  'sanguíneo|melancólico':'Opostos completos. Um vive para fora, o outro para dentro; um espalha, o outro guarda. A troca enriquece — quando cada um para de exigir que o outro funcione no seu clima.',
  'sanguíneo|fleumático':'A umidade em comum dá liga: os dois sabem conviver. Mas o ar quer novidade e a água quer permanência — um puxa para a rua, o outro para o sofá.',
  'melancólico|melancólico':'Terra com terra: profundidade, memória e lealdade — e o dobro de silêncio. Ninguém aqui esquece nada. A relação dura; o desafio é não endurecer junto.',
  'melancólico|fleumático':'Frio com frio: ritmo lento, vínculo que cresce por camadas. Estável quase por definição. O risco é a inércia — ninguém provoca, ninguém muda, e o tempo passa.',
  'fleumático|fleumático':'Água parada com água parada: paz, acolhimento e zero pressa. O conflito quase não aparece — e esse é o problema: o que não se diz afunda, e afundado fermenta.'
};
/* força de um planeta num mapa leve (dignidades essenciais + acidentes) */
function sinForca(C,k){
  const p=C.pts[k]; if(!p)return {pts:0,tags:'—'};
  const d=dignityOf(k,p.lon,!!p.retro,C.pts.sun?C.pts.sun.lon:0);
  return {pts:d.pts,tags:d.tags.join(' · ')||'peregrino'};
}
const SIN_CASA={1:'bate direto na identidade e no corpo de {n}',2:'mexe com os recursos e a segurança material de {n}',
  3:'ativa a fala, o cotidiano e o entorno de {n}',4:'entra na casa, na família e na base de {n}',
  5:'acende o prazer, o romance e a criação de {n}',6:'entra na rotina, no trabalho e na saúde de {n}',
  7:'ocupa o lugar de parceiro no mapa de {n}',8:'toca o que {n} não mostra: medos, partilhas e intimidade profunda',
  9:'amplia a fé, os estudos e os horizontes de {n}',10:'toca a carreira e a imagem pública de {n}',
  11:'chega como aliado, entre os amigos e projetos de {n}',12:'age em zona cega: {n} sente sem conseguir nomear'};
const sinCasaTxt=(h,n)=>(SIN_CASA[h]||'').replace(/\{n\}/g,n);
const SIN_PAPEL={sun:'a vontade',moon:'a necessidade de cuidado',mercury:'a palavra',
  venus:'o afeto',mars:'o desejo',jupiter:'a generosidade',saturn:'a cobrança'};

/* --- bloco 1 · temperamentos em conflito (claymorphism) --- */
function sinTempHTML(M){
  const tA=sinTemperamento(M.A), tB=sinTemperamento(M.B);
  const carta=(C,t,lado)=>{
    const barra=(rot1,rot2,v)=>'<div class="clay-bar"><span>'+rot1+'</span>'
      +'<div class="clay-track"><div class="clay-fill'+(lado==='b'?' b':'')+'" style="width:'+v+'%"></div></div>'
      +'<span>'+rot2+'</span></div>';
    return '<div class="clay-card'+(lado==='b'?' b':'')+'">'
      +'<div class="clay-gl">'+SIN_HGL[t.humor]+'</div>'
      +'<b class="clay-nome">'+C.name+'</b>'
      +'<em class="clay-humor">'+t.humor+'</em>'
      +barra('quente','frio',t.quente)+barra('seco','úmido',t.seco)
      +'<p class="clay-w">'+t.W.join(' · ')+'</p></div>';
  };
  const par=[tA.humor,tB.humor].sort().join('|');
  return '<div class="cb-sec"><span>✦</span> temperamentos em campo <span>✦</span></div>'
    +'<div class="clay-duel">'+carta(M.A,tA,'a')
    +'<div class="clay-vs">⚔</div>'+carta(M.B,tB,'b')+'</div>'
    +'<div class="clay-verdict"><p>'+(SIN_TVS[par]||'Compleições distintas: o atrito depende de qual eixo cada um defende.')+'</p></div>';
}
/* --- bloco 2 · batalha dos regentes do Ascendente --- */
function sinRegCard(C,outro,lado){
  const k=C.rulers[1], p=C.pts[k]; if(!p)return '';
  const f=sinForca(C,k), hOut=houseByRule(p.lon,outro.cusps);
  const contatos=[];
  Object.entries(outro.pts).forEach(([j,q])=>{
    const asp=aspectBetween(p.lon,q.lon);
    if(asp)contatos.push({j,asp});
  });
  contatos.sort((a,b)=>a.asp.orb-b.asp.orb);
  const top=contatos.slice(0,2).map(c=>c.asp.gl+' '+PT_NAME[c.j]+' ('+fmtOrb(c.asp.orb)+')').join(' · ');
  return '<div class="cb-card'+(lado==='b'?' b':'')+'">'
    +'<div class="cb-crest"><span class="cb-glyph">'+(PT_GLYPH[k]||'')+'</span>'
    +'<div class="cb-tit"><b>'+PT_NAME[k]+'</b><em>campeão de '+C.name+'</em></div>'
    +'<span class="cb-force" title="dignidades e acidentes">⚔ '+(f.pts>0?'+':'')+f.pts+'</span></div>'
    +'<div class="cb-row"><span>no próprio reino</span><p>em '+SIGNS[signOf(p.lon)]+', casa '+p.h
      +(p.retro?' · retrógrado':'')+' — '+f.tags+'</p></div>'
    +'<div class="cb-row alt"><span>no reino de '+outro.name+'</span><p>'
      +cap1(sinCasaTxt(hOut,outro.name))+' (casa '+hOut+')'+(top?'; toca '+top:'; não fecha aspecto com os pontos do outro')+'.</p></div>'
    +'</div>';
}
function sinRegHTML(M){
  const kA=M.A.rulers[1], kB=M.B.rulers[1];
  const fA=sinForca(M.A,kA).pts, fB=sinForca(M.B,kB).pts, dif=fA-fB;
  let verd=Math.abs(dif)<=1
    ?'Empate técnico: nenhum regente domina o campo — a liderança da relação tende a alternar.'
    :(dif>0?M.A:M.B).name+' entra em campo com o regente mais forte ('+(dif>0?fA:fB)+' contra '+(dif>0?fB:fA)+'): em disputa aberta, tende a impor o próprio modo.';
  const pa=M.A.pts[kA], pb=M.B.pts[kB];
  if(pa&&pb){
    const asp=aspectBetween(pa.lon,pb.lon);
    if(!asp)verd+=' Os dois comandantes nem se veem: campos separados, cada um manda no seu.';
    else if(asp.cls==='tens')verd+=' E os comandantes se batem — '+PT_NAME[kA]+' '+asp.gl+' '+PT_NAME[kB]+' ('+fmtOrb(asp.orb)+'): a disputa de estilo é estrutural.';
    else if(asp.cls==='conj')verd+=' E os comandantes marcham juntos — '+PT_NAME[kA]+' conjunto a '+PT_NAME[kB]+' ('+fmtOrb(asp.orb)+'): os estilos se fundem, para o bem e para o vício.';
    else verd+=' E os comandantes se entendem — '+PT_NAME[kA]+' '+asp.gl+' '+PT_NAME[kB]+' ('+fmtOrb(asp.orb)+'): a disputa vira aliança.';
  }
  return '<div class="cb-sec"><span>✦</span> batalha dos regentes <span>✦</span></div>'
    +'<div class="cb-duel">'+sinRegCard(M.A,M.B,'a')
    +'<div class="cb-vs">vs</div>'+sinRegCard(M.B,M.A,'b')+'</div>'
    +'<div class="cb-verdict"><p>'+verd+'</p></div>';
}
/* --- bloco 3 · manifestação cruzada de todos os planetas --- */
function sinManifCol(dono,visita,lado){
  let h='<div class="cb-col"><div class="cb-colh'+(lado==='b'?' b':'')+'">'+visita.name+' no mapa de '+dono.name+'</div>';
  ['sun','moon','mercury','venus','mars','jupiter','saturn'].forEach(k=>{
    const p=visita.pts[k]; if(!p)return;
    const hOut=houseByRule(p.lon,dono.cusps);
    h+='<div class="cb-mini'+(lado==='b'?' b':'')+'"><span class="g">'+(PT_GLYPH[k]||'')+'</span>'
      +'<div><b>'+PT_NAME[k]+' · '+SIGNS[signOf(p.lon)]+' · casa '+p.h+' → casa '+hOut+' de '+dono.name+'</b>'
      +'<p>'+cap1(SIN_PAPEL[k]+' de '+visita.name+' '+sinCasaTxt(hOut,dono.name))+'.</p></div></div>';
  });
  return h+'</div>';
}
function sinArenaHTML(M){
  return sinTempHTML(M)+sinRegHTML(M)
    +'<div class="cb-sec"><span>✦</span> onde cada planeta se manifesta no outro <span>✦</span></div>'
    +'<div class="cb-grid">'+sinManifCol(M.B,M.A,'a')+sinManifCol(M.A,M.B,'b')+'</div>'
    +'<p class="trnote" style="margin-top:10px;text-align:center">signo e casa próprios primeiro; a seta mostra em que casa do outro mapa o planeta cai (regra dos 5°).</p>';
}

/* ---------------- render ---------------- */
function renderSin(){
  const el=$('sin-body'); if(!el)return;
  if(typeof NATAL==='undefined'||!NATAL){el.innerHTML=emptyState();return;}
  if(!SINB){
    el.innerHTML='<p class="pv-int">Carregue a Pessoa B — pelo link do Aspectarian ou colando o mapa no mesmo formato da aba Dados. A Pessoa A é o mapa principal do app.</p>';
    if($('sin-main'))$('sin-main').hidden=true;
    return;
  }
  const A=sinA(); if(!A){el.innerHTML='';return;}
  el.innerHTML='';
  if($('sin-main'))$('sin-main').hidden=false;
  const ar=$('sin-arena');
  if(ar){try{ar.innerHTML=sinArenaHTML({A,B:SINB});}catch(e){console.error('sin arena',e);}}
}
function bindSinastria(){
  const w=$('p-sin'); if(!w)return;
  SINB=sinLoad();
  const st=$('sin-status');
  const okB=(text,birth,name,place)=>{
    try{
      const parsed=parseChartText(text);
      if(!parsed.ok)throw new Error(parsed.problems.join('; '));
      SINB=sinBuild(parsed,birth,name,place);
      sinSave({text,birth,name,place});
      if(st)st.textContent='Pessoa B carregada: '+SINB.name+' · Asc '+SIGNS[signOf(SINB.asc)]+'.';
      renderSin();
    }catch(err){if(st)st.textContent='erro: '+err.message;}
  };
  const imp=$('sin-imp-run');
  if(imp)imp.onclick=()=>{
    const url=($('sin-imp-url')||{}).value||'';
    const P=parseAspectarianURL(url);
    if(!P.ok){if(st)st.textContent=P.err;return;}
    if(typeof Astronomy==='undefined'){if(st)st.textContent='motor astronômico não carregou.';return;}
    if(st)st.textContent='computando o mapa B…';
    setTimeout(()=>{
      try{
        const utc=localToUTC(P.date,P.tz);
        const ch=computeChart(utc,P.lat,P.lon);
        okB(chartToText(ch),utc.toISOString(),P.name,{lat:P.lat,lon:P.lon});
      }catch(err){if(st)st.textContent='erro: '+err.message;}
    },30);
  };
  const man=$('sin-man-run');
  if(man)man.onclick=()=>{
    const text=($('sin-man-txt')||{}).value||'', birth=($('sin-man-birth')||{}).value||'';
    const name=($('sin-man-name')||{}).value||'Pessoa B';
    if(!text.trim()){if(st)st.textContent='cole o mapa da Pessoa B.';return;}
    okB(text,birth?birth+':00Z':null,name,null);
  };
  const rm=$('sin-clear');
  if(rm)rm.onclick=()=>{SINB=null;try{localStorage.removeItem('agx_sinB');}catch(e){}
    if(st)st.textContent='Pessoa B removida.';renderSin();};
}
