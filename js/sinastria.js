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
/* forma de interação do aspecto — não juízo */
const SIN_FORMA={0:'operam fundidos: um não se move sem o outro',
  60:'transmitem com facilidade um para o outro',120:'transmitem com facilidade um para o outro',
  90:'exigem ajuste recíproco: pressão constante entre os dois campos',
  180:'ficam em oposição de campo: cada um puxa para o seu lado'};

/* ============================================================
   O MAPA DE CONEXÕES
   Sete nós — um por planeta — em torno de uma interseção central.
   Cada nó liga a Pessoa A (à esquerda) e a Pessoa B (à direita):
   a aresta da esquerda diz onde o planeta de A cai no mapa de B; a
   da direita, onde o de B cai no de A. O nó aceso mostra os rótulos
   e abre os detalhes ao lado.
   ============================================================ */
let SIN_OPEN=null, SIN_FILT='todas';
const SIN_PL=['sun','moon','mercury','venus','mars','jupiter','saturn'];
/* posições dos nós, em porcentagem do palco */
function sinPos(i,n){
  const th=(i*(360/n))*Math.PI/180;          // o primeiro nó no topo
  return {x:50+25*Math.sin(th), y:50-33*Math.cos(th)};
}
/* tudo o que o app sabe sobre um par de planetas homônimos */
function sinPar(M,k){
  const pA=M.A.pts[k], pB=M.B.pts[k];
  if(!pA&&!pB)return null;
  const hAB=pA?houseByRule(pA.lon,M.B.cusps):null;   // o de A cai em que casa de B
  const hBA=pB?houseByRule(pB.lon,M.A.cusps):null;
  const a=(pA&&pB)?aspectBetween(pA.lon,pB.lon):null;
  const nat=!a?'neutra':(a.cls==='tens'?'tensao':'harmonia');
  return {k,pA,pB,hAB,hBA,a,nat,orb:a?a.orb:99};
}
function sinPares(M){return SIN_PL.map(k=>sinPar(M,k)).filter(Boolean);}
function sinFiltra(P){
  if(SIN_FILT==='harmonias')return P.filter(x=>x.nat==='harmonia');
  if(SIN_FILT==='tensoes')return P.filter(x=>x.nat==='tensao');
  if(SIN_FILT==='fortes')return P.slice().sort((a,b)=>a.orb-b.orb).slice(0,3);
  return P;
}
/* ---------- o palco ---------- */
function sinPalcoHTML(M){
  const P=sinPares(M), vis=sinFiltra(P).map(x=>x.k);
  const n=P.length, AX=9, AY=50, BX=91, BY=50;
  let linhas='', nos='', rots='';
  P.forEach((x,i)=>{
    const p=sinPos(i,n), on=(SIN_OPEN===x.k), dim=!vis.includes(x.k);
    const cls=' '+x.nat+(on?' on':'')+(dim?' dim':'');
    /* arestas: A → nó e nó → B */
    const c1=(AX+p.x)/2, c2=(p.x+BX)/2;
    linhas+='<path class="syl a'+cls+'" d="M'+AX+','+AY+' C'+c1+','+AY+' '+c1+','+p.y+' '+p.x+','+p.y+'"/>';
    if(x.pB)linhas+='<path class="syl b'+cls+'" d="M'+p.x+','+p.y+' C'+c2+','+p.y+' '+c2+','+BY+' '+BX+','+BY+'"/>';
    linhas+='<path class="syl hub'+cls+'" d="M'+p.x+','+p.y+' L50,50"/>';
    nos+='<button class="syn'+cls+'" style="left:'+p.x+'%;top:'+p.y+'%" data-syp="'+x.k+'" '
      +'title="'+PT_NAME[x.k]+'"><i>'+(PT_GLYPH[x.k]||'')+'︎</i><em>'+PT_NAME[x.k]+'</em></button>';
    if(on){
      if(x.hAB)rots+='<span class="syr a" style="left:'+((AX+p.x)/2)+'%;top:'+((AY+p.y)/2)+'%">cai na '+x.hAB+'ª</span>';
      if(x.hBA)rots+='<span class="syr b" style="left:'+((p.x+BX)/2)+'%;top:'+((p.y+BY)/2)+'%">cai na '+x.hBA+'ª</span>';
    }
  });
  const nAsp=P.filter(x=>x.a).length;
  return '<div class="sy-stage">'
    +'<svg class="sy-links" viewBox="0 0 100 100" preserveAspectRatio="none">'+linhas+'</svg>'
    +'<div class="sy-pes a"><em>pessoa A</em><b>'+M.A.name+'</b>'
      +'<span class="sy-orb">'+(PT_GLYPH.sun||'')+'︎</span>'
      +'<i>Asc '+SIGNS[signOf(M.A.asc)]+'</i></div>'
    +'<div class="sy-pes b"><em>pessoa B</em><b>'+M.B.name+'</b>'
      +'<span class="sy-orb">'+(PT_GLYPH.moon||'')+'︎</span>'
      +'<i>Asc '+SIGNS[signOf(M.B.asc)]+'</i></div>'
    +'<div class="sy-hub"><b>interseção</b><em>'+nAsp+' aspecto'+(nAsp===1?'':'s')+'</em></div>'
    +nos+rots+'</div>';
}
/* ---------- a lista das conexões mais fechadas ---------- */
function sinFortesHTML(M){
  const L=sinPares(M).filter(x=>x.a).sort((a,b)=>a.orb-b.orb).slice(0,5);
  if(!L.length)return '<div class="sy-box"><h4>Conexões mais fechadas</h4>'
    +'<p class="sy-vaz">Nenhum planeta homônimo fecha aspecto dentro do orbe.</p></div>';
  return '<div class="sy-box"><h4>Conexões mais fechadas <i>orbe menor = contato mais exato</i></h4>'
    +'<ol class="sy-rank">'+L.map((x,i)=>'<li class="'+x.nat+'" data-syp="'+x.k+'">'
      +'<span class="sy-rn">'+(i+1)+'</span>'
      +'<span class="sy-rg">'+(PT_GLYPH[x.k]||'')+'︎</span>'
      +'<span class="sy-rt">'+PT_NAME[x.k]+' de '+M.A.name+' ↔ '+PT_NAME[x.k]+' de '+M.B.name+'</span>'
      +'<span class="sy-rv">'+x.a.gl+' '+fmtOrb(x.a.orb)+'</span></li>').join('')+'</ol></div>';
}
/* ---------- o painel de detalhes ---------- */
function sinDetHTML(M){
  if(!SIN_OPEN)return '<div class="sy-det vazio"><h4>Detalhes da conexão</h4>'
    +'<p class="sy-vaz">Escolha um planeta no mapa para ver como ele atravessa de um mapa ao outro.</p></div>';
  const x=sinPar(M,SIN_OPEN); if(!x)return '';
  const k=x.k;
  const via=(de,para,h,lado)=>{
    const p=de.pts[k]; if(!p||!h)return '';
    const S=sinSignificado(de,k);
    const reg=S.rege.length
      ?', que rege '+lista(S.rege.map(hh=>'sua '+hh+'ª'))
        +' ('+lista(S.rege.map(hh=>SIN_HSUJ[hh]))+')'
        +(S.rege.includes(1)?(' — portanto '+de.name+' em pessoa —'):',')
      :', sem casa administrada no próprio mapa,';
    return '<div class="sy-via '+lado+'"><span>'+de.name+' ⟶ '+para.name+'</span>'
      +'<p><b>'+PT_NAME[k]+' de '+de.name+'</b>'+reg
      +' tende a se manifestar na casa '+h+' de '+para.name+' — '+SIN_HTAG[h]+'.</p></div>';
  };
  const cx=(rot,h,onde)=>'<div class="sy-cx"><em>'+rot+'</em><span>cai na</span>'
    +'<b>'+h+'ª</b><i>casa em '+onde+'</i></div>';
  const natTxt={harmonia:'Harmonia',tensao:'Tensão',neutra:'Sem aspecto direto'}[x.nat];
  return '<div class="sy-det"><h4>Detalhes da conexão</h4>'
    +'<div class="sy-pair"><span class="sy-pg a">'+(PT_GLYPH[k]||'')+'︎</span>'
      +'<i>↔</i><span class="sy-pg b">'+(PT_GLYPH[k]||'')+'︎</span></div>'
    +'<p class="sy-pt">'+PT_NAME[k]+' de '+M.A.name+' ↔ '+PT_NAME[k]+' de '+M.B.name+'</p>'
    +'<div class="sy-cxs">'
      +(x.hAB?cx(PT_NAME[k]+' de '+M.A.name,x.hAB,M.B.name):'')
      +(x.hBA?cx(PT_NAME[k]+' de '+M.B.name,x.hBA,M.A.name):'')
    +'</div>'
    +'<div class="sy-nat"><em>natureza da conexão</em>'
      +'<span class="sy-tag '+x.nat+'">'+natTxt+'</span>'
      +(x.a?'<i>'+x.a.gl+' · orbe '+fmtOrb(x.a.orb)+'</i>':'')+'</div>'
    +'<div class="sy-int"><em>interpretação</em>'
      +via(M.A,M.B,x.hAB,'a')+via(M.B,M.A,x.hBA,'b')
      +(x.a?('<p class="sy-asp">Entre si, os dois '+PT_NAME[k]+' '
        +(SIN_FORMA[x.a.ang]||'entram em contato')+'.</p>')
        :'<p class="sy-asp">Os dois '+PT_NAME[k]+' não fecham aspecto entre si: a troca se dá só '
        +'pelo campo em que cada um aterrissa.</p>')
    +'</div></div>';
}
/* ---------- o quadro inteiro ---------- */
const SIN_FILTS=[['todas','todas'],['fortes','mais fechadas'],['tensoes','tensões'],['harmonias','harmonias']];
function sinQuadroHTML(M){
  return '<div class="sy-head">'
    +'<div class="sy-ht"><h3>Mapa de conexões</h3>'
      +'<em>como os planetas de um mapa atravessam o outro</em></div>'
    +'<div class="sy-chips">'+SIN_FILTS.map(([id,l])=>
      '<button class="sy-chip'+(SIN_FILT===id?' on':'')+'" data-syf="'+id+'">'+l+'</button>').join('')+'</div>'
    +'</div>'
    +'<div class="sy-grid">'
      +'<div class="sy-main">'+sinPalcoHTML(M)
        +'<div class="sy-leg"><span class="harmonia">harmonias</span>'
        +'<span class="tensao">tensões</span><span class="neutra">sem aspecto</span>'
        +'<i>clique num planeta para abrir a conexão</i></div>'
        +sinFortesHTML(M)+'</div>'
      +sinDetHTML(M)
    +'</div>';
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
  if(ar){try{ar.innerHTML=sinQuadroHTML({A,B:SINB});}catch(e){console.error('sin quadro',e);}}
}
function bindSinastria(){
  const w=$('p-sin'); if(!w)return;
  SINB=sinLoad();
  w.addEventListener('click',e=>{
    const f=e.target.closest&&e.target.closest('[data-syf]');
    if(f){SIN_FILT=f.dataset.syf;renderSin();return;}
    const o=e.target.closest&&e.target.closest('[data-syp]');
    if(o){SIN_OPEN=(SIN_OPEN===o.dataset.syp)?null:o.dataset.syp;renderSin();}
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
