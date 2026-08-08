/* ============================================================
   SINASTRIA.JS — quadro comparativo entre duas natividades.
   Cada planeta é lido pelo que administra no próprio mapa e,
   só então, pelo campo em que incide no mapa do outro.
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

/* --- compleição: o clima de fundo de cada mapa --- */
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
/* --- rótulos de campo por casa --- */
/* como sujeito de oração: "os estudos de A entram…" */
const SIN_HSUJ={1:'a identidade e o corpo',2:'os recursos',3:'os estudos e a comunicação',4:'a casa e a família',
  5:'os afetos e a criação',6:'o trabalho e a rotina',7:'as parcerias e os contratos',
  8:'as partilhas e as perdas',9:'as convicções',10:'a carreira e a posição',
  11:'os projetos e as alianças',12:'os bastidores'};
/* como complemento: "manifesta-se pelos estudos…" */
const SIN_HTAG={1:'a identidade e o corpo',2:'os recursos próprios',3:'os estudos, a fala e o entorno',
  4:'a casa e a família',5:'os filhos, o prazer e a criação',6:'o trabalho diário e a saúde',
  7:'as parcerias e os contratos',8:'o que vem de terceiros e as perdas',
  9:'os estudos superiores e a fé',10:'a carreira e a posição pública',
  11:'os amigos, os grupos e os projetos',12:'os bastidores e o isolamento'};
/* efeito da incidência, com verbo que concorda com o sujeito */
const SIN_EFEITO={
  1 :['incide','incidem','diretamente sobre a pessoa de {o}: sobre o corpo, o humor e o modo de se apresentar'],
  2 :['entra','entram','no orçamento de {o}: no ganho, no gasto e na sensação de segurança material'],
  3 :['entra','entram','na conversa cotidiana de {o}: no que se fala, no que se estuda e no trânsito do dia'],
  4 :['entra','entram','na casa de {o}: no ambiente doméstico, na família e no que sustenta por baixo'],
  5 :['incide','incidem','sobre o prazer e a criação de {o}: romance, filhos, o que se faz por gosto'],
  6 :['cai','caem','na rotina de {o}: no trabalho diário, nas obrigações e no corpo em funcionamento'],
  7 :['incide','incidem','sobre o campo de parcerias, contratos e relações um-a-um de {o}'],
  8 :['toca','tocam','o que {o} não administra sozinho: dívidas, heranças, o que muda sem consentimento'],
  9 :['incide','incidem','sobre as convicções de {o}: fé, estudo longo, o sentido que dá ao conjunto'],
  10:['incide','incidem','sobre a carreira de {o}: sobre a posição, a autoridade e a imagem pública'],
  11:['chega','chegam','pelo círculo de {o}: amigos, grupos, projetos e o que ele espera do futuro'],
  12:['age','agem','em zona cega de {o}: bastidor, retiro, o que se sente sem conseguir nomear']};
function sinEfeito(h,dono,plural){
  const E=SIN_EFEITO[h]||SIN_EFEITO[1];
  return (plural?E[1]:E[0])+' '+E[2].replace(/\{o\}/g,dono);
}

/* ============================================================
   QUADRO COMPARATIVO — sem arena, sem campeão, sem batalha.

   Cada planeta é lido em três passos, nesta ordem:
     1 o que ele administra no mapa de ORIGEM (casas regidas)
     2 por onde se manifesta ali (casa ocupada)
     3 em que campo do mapa do OUTRO ele incide
   O aspecto, quando existe, entra como FORMA de interação —
   nunca como juízo de bom ou ruim.
   ============================================================ */

/* significado interno de um planeta dentro do seu próprio mapa */
function sinSignificado(C,k){
  const p=C.pts[k]; if(!p)return null;
  const rege=[]; for(let h=1;h<=12;h++) if(C.rulers[h]===k) rege.push(h);
  const nat=(typeof PL_NATUREZA!=='undefined'&&PL_NATUREZA[k])?PL_NATUREZA[k].n:'significador';
  const mat=rege.length?lista(rege.map(h=>SIN_HSUJ[h])):nat;
  return {rege,casa:p.h,signo:signOf(p.lon),nat,mat,
    plural:rege.length>1||/^(os|as)\s/i.test(mat),
    /* "6ª → 10ª" */
    rota:(rege.length?rege.map(h=>h+'ª').join('+'):'—')+' → '+p.h+'ª',
    /* frase do mapa de origem */
    origem:rege.length
      ? cap1(mat)+' '+(rege.length>1?'manifestam-se':'manifesta-se')+' principalmente '
        +prep('por',SIN_HTAG[p.h])+'.'
      : cap1(nat)+', sem casa administrada; age apenas '+prep('por',SIN_HTAG[p.h])+'.'};
}
/* condição do planeta num mapa leve — decide o que o aspecto facilita ou tensiona */
function sinCond(C,k){
  const ctx={pts:C.pts,diurno:!!C.diurno,sunLon:C.pts.sun?C.pts.sun.lon:null,cusps:C.cusps};
  try{ return condicaoDe(k,ctx); }catch(e){ return null; }
}
/* forma de interação do aspecto — não juízo */
const SIN_FORMA={0:'operam fundidos: um não se move sem o outro',
  60:'transmitem com facilidade um para o outro',120:'transmitem com facilidade um para o outro',
  90:'exigem ajuste recíproco: pressão constante entre os dois campos',
  180:'ficam em oposição de campo: cada um puxa para o seu lado'};

/* ---------- uma entrada do quadro ---------- */
function sinEntradaHTML(dono,visita,k,idx){
  const p=visita.pts[k]; if(!p)return '';
  const S=sinSignificado(visita,k); if(!S)return '';
  const hOut=houseByRule(p.lon,dono.cusps);
  const aberto=SIN_OPEN===(visita.name+':'+k);
  /* aspecto mais fechado com os pontos do dono */
  let m=null;
  Object.entries(dono.pts).forEach(([j,q])=>{
    const a=aspectBetween(p.lon,q.lon);
    if(a&&(!m||a.orb<m.a.orb))m={j,a};
  });
  let tec='';
  if(m){
    const T=sinSignificado(dono,m.j), cd=sinCond(dono,m.j), cv=sinCond(visita,k);
    tec='<p>'+PT_NAME[k]+' e '+PT_NAME[m.j]+' de '+dono.name+' '
      +(SIN_FORMA[m.a.ang]||'entram em contato')+' ('+m.a.gl+' '+fmtOrb(m.a.orb)+').</p>'
      +'<p>O que está em jogo: '+(T&&T.rege.length?lista(T.rege.map(x=>SIN_HSUJ[x]))+' de '+dono.name
        :'a natureza de '+PT_NAME[m.j])+', '
      +'com '+PT_NAME[m.j]+' '+(cd?('<i>'+cd.nivel+'</i>'):'em condição não avaliada')
      +' e '+PT_NAME[k]+' '+(cv?('<i>'+cv.nivel+'</i>'):'em condição não avaliada')+'. '
      +'A condição dos dois é que decide o que se facilita ou se tensiona — não o aspecto sozinho.</p>';
  } else tec='<p>Não fecha aspecto com nenhum ponto de '+dono.name+' dentro do orbe: a incidência é só por casa.</p>';
  return '<div class="sy-i">'
    +'<button class="sy-ih" data-syo="'+visita.name+':'+k+'">'
      +'<span class="sy-g">'+(PT_GLYPH[k]||'')+'︎</span>'
      +'<span class="sy-t"><b>'+PT_NAME[k]+' de '+visita.name+'</b>'
        +'<em>'+SIGNS[S.signo]+' · '+S.rota+'</em></span>'
      +'<span class="sy-move">→ '+hOut+'ª</span>'
    +'</button>'
    +(aberto?('<div class="sy-b">'
      +'<span class="sy-l">Na natividade de '+visita.name+'</span><p>'+S.origem+'</p>'
      +'<span class="sy-l">No mapa de '+dono.name+' · casa '+hOut+'</span>'
      +'<p class="sy-ef">'+cap1(sinCruzFrase(dono,visita,k))+'</p>'
      +'<details class="sy-tec"><summary>Ver estrutura técnica</summary>'+tec+'</details>'
      +'</div>'):'')
    +'</div>';
}
/* a frase de efeito, literal */
function sinCruzFrase(dono,visita,k){
  const p=visita.pts[k]; if(!p)return '';
  const S=sinSignificado(visita,k), hOut=houseByRule(p.lon,dono.cusps);
  return cap1(S.mat)+' de '+visita.name+' '+sinEfeito(hOut,dono.name,S.plural)+'.';
}
/* ---------- resumo legível: o que um faz com o outro ---------- */
const SIN_CAMPO={1:'identidade e corpo',2:'recursos',3:'estudos e circulação',4:'casa e origem',
  5:'afeto e criação',6:'trabalho e rotina',7:'parcerias e contratos',8:'partilhas e perdas',
  9:'convicções',10:'carreira e posição',11:'projetos e alianças',12:'bastidores'};
function sinPesos(dono,visita){
  const PES={1:3,7:3,10:2.5,4:2.5,5:2,8:2,2:1.5,6:1.5,11:1.5,3:1,9:1,12:1};
  const conta={}, itens=[];
  Object.keys(visita.pts).forEach(k=>{
    const h=houseByRule(visita.pts[k].lon,dono.cusps);
    const w=(PES[h]||1)*(['sun','moon','saturn'].includes(k)?1.4:1);
    conta[h]=(conta[h]||0)+w; itens.push({k,h,w});
  });
  const top=Object.keys(conta).map(Number).sort((a,b)=>conta[b]-conta[a]);
  return {conta,itens,top,total:Object.values(conta).reduce((s,x)=>s+x,0)};
}
function sinResumoHTML(M){
  const AB=sinPesos(M.B,M.A);      // planetas de A caindo em B
  const BA=sinPesos(M.A,M.B);      // planetas de B caindo em A
  const campo=t=>lista(t.slice(0,2).map(h=>SIN_CAMPO[h]));
  /* cooperação e fricção: pelo aspecto mais forte, lido pela condição */
  let coop=null, fric=null;
  Object.keys(M.A.pts).forEach(ka=>Object.keys(M.B.pts).forEach(kb=>{
    const a=aspectBetween(M.A.pts[ka].lon,M.B.pts[kb].lon); if(!a)return;
    const Sa=sinSignificado(M.A,ka), Sb=sinSignificado(M.B,kb);
    const peso=(3-a.orb/4)*((['sun','moon','saturn'].includes(ka)||['sun','moon','saturn'].includes(kb))?1.3:1);
    const reg={ka,kb,a,Sa,Sb,peso};
    if(a.cls==='tens'){ if(!fric||peso>fric.peso)fric=reg; }
    else { if(!coop||peso>coop.peso)coop=reg; }
  }));
  const prim=(C,k,S)=>S.rege.length?SIN_HSUJ[S.rege[0]]:(PL_NATUREZA[k]?PL_NATUREZA[k].n:PT_NAME[k]);
  const frase=(r,verbo)=>r
    ? cap1(prim(M.A,r.ka,r.Sa))+' de '+M.A.name+' e '+prim(M.B,r.kb,r.Sb)+' de '+M.B.name+' '+verbo
      +' ('+PT_NAME[r.ka]+' '+r.a.gl+' '+PT_NAME[r.kb]+', '+fmtOrb(r.a.orb)+').'
    : 'nada dentro do orbe.';
  /* assimetria: pelo peso total das incidências, sem porcentagem */
  const d=BA.total-AB.total;
  const assim=Math.abs(d)<1.5
    ? 'A interferência é recíproca, em intensidade semelhante nos dois sentidos.'
    : (d>0?M.B:M.A).name+' interfere mais intensamente na vida de '+(d>0?M.A:M.B).name
      +' — sobretudo em '+(d>0?campo(BA.top):campo(AB.top))+' — do que o inverso.';
  const q=(t,v,w)=>'<div class="sy-r'+(w?' wide':'')+'"><span>'+t+'</span><b>'+v+'</b></div>';
  return '<div class="sy-res">'
    +q('Onde '+M.B.name+' mais interfere em '+M.A.name,cap1(campo(BA.top)))
    +q('Onde '+M.A.name+' mais interfere em '+M.B.name,cap1(campo(AB.top)))
    +q('Principal cooperação',frase(coop,'funcionam juntos'),true)
    +q('Principal fricção',frase(fric,'exigem ajuste um do outro'),true)
    +q('Assimetria',assim,true)
    +'</div>';
}
/* ---------- temperamento, em uma linha ---------- */
function sinTempHTML(M){
  const tA=sinTemperamento(M.A), tB=sinTemperamento(M.B);
  const par=[tA.humor,tB.humor].sort().join('|');
  const linha=(C,t)=>'<div class="sy-r"><span>'+C.name+'</span><b>'+cap1(t.humor)+'</b>'
    +'<p>'+t.quente+'% quente · '+t.seco+'% seco — '+t.W.slice(0,2).join(' · ')+'</p></div>';
  return '<div class="sy-sec"><b>Compleição</b><em>o clima de fundo de cada um</em></div>'
    +'<div class="sy-res">'+linha(M.A,tA)+linha(M.B,tB)
    +'<div class="sy-r wide"><span>Encontro</span><p>'+(SIN_TVS[par]
      ||'Compleições distintas: o atrito depende de qual eixo cada um defende.')+'</p></div></div>';
}
/* ---------- o quadro inteiro ---------- */
let SIN_OPEN=null;
function sinQuadroHTML(M){
  const col=(dono,visita)=>'<div class="sy-col">'
    +'<div class="sy-dir"><i>'+visita.name+'</i> → '+dono.name+'</div>'
    +'<div class="sy-list">'
    +['sun','moon','mercury','venus','mars','jupiter','saturn']
      .map((k,i)=>sinEntradaHTML(dono,visita,k,i)).join('')
    +'</div></div>';
  return '<div class="sy-sec"><b>Quadro comparativo</b>'
    +'<em>cada planeta pelo que administra no próprio mapa, depois pelo campo em que incide no outro</em></div>'
    +'<div class="sy-grid">'+col(M.B,M.A)+col(M.A,M.B)+'</div>';
}
function sinArenaHTML(M){
  return sinResumoHTML(M)+sinTempHTML(M)+sinQuadroHTML(M);
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
  w.addEventListener('click',e=>{
    const o=e.target.closest&&e.target.closest('[data-syo]');
    if(o){SIN_OPEN=(SIN_OPEN===o.dataset.syo)?null:o.dataset.syo;renderSin();}
  });
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
