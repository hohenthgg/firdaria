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
/* --- bloco 3 · manifestação cruzada: significado interno → campo do outro ---
   A regra: o planeta não é "a vontade" nem "o afeto". Ele é o que administra
   no próprio mapa. Só depois de dizer isso é que se diz onde ele incide. */

/* rótulo curto do campo de cada casa, para compor frases literais */
const SIN_HTAG={1:'a identidade e o corpo',2:'os recursos próprios',3:'os estudos, a fala e o entorno',
  4:'a casa e a família',5:'os filhos, o prazer e a criação',6:'o trabalho diário e a saúde',
  7:'as parcerias e os contratos',8:'o que vem de terceiros e as perdas',9:'os estudos superiores e a fé',
  10:'a carreira e a posição pública',11:'os amigos, os grupos e os projetos',12:'os bastidores e o isolamento'};
/* forma sem artigo, para caber depois de "significador de" */
const SIN_HNU={1:'corpo e identidade',2:'dinheiro',3:'estudos e comunicação',4:'casa e família',
  5:'afetos e criação',6:'ofício cotidiano',7:'parcerias',8:'dívidas e bens de terceiros',
  9:'convicções',10:'carreira',11:'projetos e alianças',12:'bastidores'};
/* o mesmo campo como sujeito de oração ("os estudos de A entram…") */
const SIN_HSUJ={1:'a própria pessoa',2:'o dinheiro',3:'os estudos e a comunicação',4:'a casa e a família',
  5:'os afetos e a criação',6:'o ofício cotidiano',7:'as parcerias',8:'as dívidas e os bens de terceiros',
  9:'as convicções',10:'a carreira',11:'os projetos e as alianças',12:'o que fica nos bastidores'};
/* o que a incidência produz, por casa recebedora.
   Verbo separado do resto para concordar com sujeito singular ou plural. */
const SIN_EFEITO={
  1 :['incide','incidem','diretamente sobre a pessoa de {o}: sobre o corpo, o humor e o modo de se apresentar'],
  2 :['entra','entram','no orçamento de {o}: no ganho, no gasto e na sensação de segurança material'],
  3 :['entra','entram','na conversa cotidiana de {o}: no que se fala, no que se estuda e no trânsito do dia'],
  4 :['entra','entram','na casa de {o}: no ambiente doméstico, na família e no que sustenta por baixo'],
  5 :['incide','incidem','sobre o prazer e a criação de {o}: romance, filhos, o que se faz por gosto'],
  6 :['cai','caem','na rotina de {o}: no trabalho diário, nas obrigações e no corpo em funcionamento'],
  7 :['ocupa','ocupam','o lugar de parceiro no mapa de {o}: é com quem se negocia, se pactua ou se disputa'],
  8 :['toca','tocam','o que {o} não administra sozinho: dívidas, heranças, o que muda sem consentimento'],
  9 :['incide','incidem','sobre as convicções de {o}: fé, estudo longo, o sentido que dá ao conjunto'],
  10:['incide','incidem','sobre a carreira de {o}: sobre a posição, a autoridade e a imagem pública'],
  11:['chega','chegam','pelo círculo de {o}: amigos, grupos, projetos e o que ele espera do futuro'],
  12:['age','agem','em zona cega de {o}: bastidor, retiro, o que se sente sem conseguir nomear']};
function sinEfeito(h,dono,plural){
  const E=SIN_EFEITO[h]||SIN_EFEITO[1];
  return (plural?E[1]:E[0])+' '+E[2].replace(/\{o\}/g,dono);
}

/* o que este planeta significa DENTRO do mapa de origem.
   Primeiro o que administra; só depois por onde se manifesta. */
function sinSignificado(C,k){
  const p=C.pts[k]; if(!p)return null;
  const rege=[]; for(let h=1;h<=12;h++) if(C.rulers[h]===k) rege.push(h);
  const nat=(typeof PL_NATUREZA!=='undefined'&&PL_NATUREZA[k])?PL_NATUREZA[k].n:'significador';
  const suj=rege.length?lista(rege.map(h=>SIN_HSUJ[h])):nat;
  return {rege,casa:p.h,signo:signOf(p.lon),nat,suj,plural:rege.length>1||/^(os|as)\s/i.test(suj),
    papel:rege.length?('significador de '+lista(rege.map(h=>SIN_HNU[h]))):(nat+', sem casa administrada'),
    manif:(rege.includes(p.h)?'no próprio campo que administra, ':'')
      +prep('por',SIN_HTAG[p.h])};
}

function sinManifCol(dono,visita,lado){
  let h='<div class="cb-col"><div class="cb-colh'+(lado==='b'?' b':'')+'">'+visita.name+' no mapa de '+dono.name+'</div>';
  ['sun','moon','mercury','venus','mars','jupiter','saturn'].forEach(k=>{
    const p=visita.pts[k]; if(!p)return;
    const S=sinSignificado(visita,k); if(!S)return;
    const hOut=houseByRule(p.lon,dono.cusps);
    /* aspecto mais fechado com os pontos do dono, para o desdobramento */
    let melhor=null;
    Object.entries(dono.pts).forEach(([j,q])=>{
      const a=aspectBetween(p.lon,q.lon);
      if(a&&(!melhor||a.orb<melhor.a.orb))melhor={j,a};
    });
    let extra='';
    if(melhor){
      const T=sinSignificado(dono,melhor.j);
      extra='<span class="cb-x">'+melhor.a.gl+' '+PT_NAME[melhor.j]+' de '+dono.name
        +(T&&T.rege.length?(' — '+lista(T.rege.map(x=>SIN_HNU[x]))+' de '+dono.name):'')
        +' ('+fmtOrb(melhor.a.orb)+', '+({conj:'fusão',harm:'apoio',tens:'atrito'})[melhor.a.cls]+')</span>';
    }
    h+='<div class="cb-mini'+(lado==='b'?' b':'')+'"><span class="g">'+(PT_GLYPH[k]||'')+'</span>'
      +'<div><b>'+PT_NAME[k]+' · '+SIGNS[S.signo]+' · casa '+p.h+' → casa '+hOut+' de '+dono.name+'</b>'
      +'<p><i>Em '+visita.name+':</i> '+cap1(S.papel)+', que se manifesta '+S.manif+'.<br>'
      +'<i>Em '+dono.name+':</i> '+cap1(sinEfeito(hOut,dono.name,S.plural))+'.</p>'
      +extra+'</div></div>';
  });
  return h+'</div>';
}
/* a frase-síntese: o campo de A que entra no campo de B */
function sinCruzFrase(dono,visita,k){
  const p=visita.pts[k]; if(!p)return '';
  const S=sinSignificado(visita,k), hOut=houseByRule(p.lon,dono.cusps);
  const sujeito=cap1(S.suj)+' de '+visita.name;
  return sujeito+' — que ali '+(S.plural?'se manifestam ':'se manifesta ')+S.manif+' — '
    +sinEfeito(hOut,dono.name,S.plural)+'.';
}
/* as três incidências mais pesadas, para abrir o bloco */
function sinCruzResumoHTML(M){
  const PES={1:3,7:3,10:2.5,4:2.5,5:2,8:2,2:1.5,6:1.5,11:1.5,3:1,9:1,12:1};
  const itens=[];
  const varre=(dono,visita)=>{
    Object.keys(visita.pts).forEach(k=>{
      const hOut=houseByRule(visita.pts[k].lon,dono.cusps);
      itens.push({dono,visita,k,hOut,w:(PES[hOut]||1)*(['sun','moon','saturn'].includes(k)?1.4:1)});
    });
  };
  varre(M.A,M.B); varre(M.B,M.A);
  itens.sort((a,b)=>b.w-a.w);
  return '<div class="cb-top">'+itens.slice(0,3).map(it=>
    '<p class="cb-topi"><span>'+(PT_GLYPH[it.k]||'')+'︎</span>'+sinCruzFrase(it.dono,it.visita,it.k)+'</p>').join('')+'</div>';
}
function sinArenaHTML(M){
  return sinTempHTML(M)+sinRegHTML(M)
    +'<div class="cb-sec"><span>✦</span> onde cada planeta se manifesta no outro <span>✦</span></div>'
    +sinCruzResumoHTML(M)
    +'<div class="cb-grid">'+sinManifCol(M.B,M.A,'a')+sinManifCol(M.A,M.B,'b')+'</div>'
    +'<p class="trnote" style="margin-top:10px;text-align:center">cada planeta é lido primeiro pelo que administra no próprio mapa; só então pelo campo em que incide no outro (casa pela regra dos 5°).</p>';
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
