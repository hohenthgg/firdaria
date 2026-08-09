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

/* ---------- o par de um planeta: o de A em cima, o de B embaixo ---------- */
let SIN_OPEN=null;
function sinParHTML(M,k){
  const pA=M.A.pts[k], pB=M.B.pts[k]; if(!pA&&!pB)return '';
  const card=C=>{
    const p=C.pts[k];
    if(!p)return '<div class="syp-card off"><em>sem '+PT_NAME[k]+' neste mapa</em></div>';
    const S=sinSignificado(C,k);
    return '<div class="syp-card"><span class="syp-g">'+(PT_GLYPH[k]||'')+'\uFE0E</span>'
      +'<span class="syp-t"><b>'+PT_NAME[k]+' de '+C.name+'</b>'
      +'<em>'+SIGNS[S.signo]+' \u00b7 casa '+S.casa
      +(S.rege.length?(' \u00b7 rege '+S.rege.map(h=>h+'\u00aa').join(' e ')):'')+'</em></span></div>';
  };
  const aberto=SIN_OPEN===k;
  let x='';
  if(aberto){
    /* a leitura conversível: o planeta de um, traduzido no mapa do outro */
    const dir=(de,para)=>{
      const p=de.pts[k]; if(!p)return '';
      const S=sinSignificado(de,k), h=houseByRule(p.lon,para.cusps);
      const reg=S.rege.length
        ?', que rege '+lista(S.rege.map(hh=>'sua '+hh+'\u00aa'))
          +' ('+lista(S.rege.map(hh=>SIN_HSUJ[hh]))+')'
          +(S.rege.includes(1)?(' \u2014 portanto '+de.name+' em pessoa \u2014'):',')
        :', sem casa administrada no pr\u00f3prio mapa,';
      return '<p><b>'+PT_NAME[k]+' de '+de.name+'</b>'+reg
        +' tende a se manifestar na casa '+h+' de '+para.name+' \u2014 '+SIN_HTAG[h]+'.</p>';
    };
    const a=(pA&&pB)?aspectBetween(pA.lon,pB.lon):null;
    x='<div class="syp-x">'+dir(M.A,M.B)+dir(M.B,M.A)
      +(a?('<p class="syp-asp">Entre si, os dois '+PT_NAME[k]+' '
        +(SIN_FORMA[a.ang]||'entram em contato')+' ('+a.gl+' '+fmtOrb(a.orb)+').</p>'):'')
      +'</div>';
  }
  return '<div class="syp'+(aberto?' open':'')+'">'
    +card(M.A)
    +'<button class="syp-arr'+(aberto?' on':'')+'" data-syp="'+k+'" aria-label="converter a leitura">\u21c5</button>'
    +card(M.B)+x+'</div>';
}
/* ---------- o quadro inteiro: s\u00f3 os pares, um em cima do outro ---------- */
function sinQuadroHTML(M){
  return '<div class="sy-sec"><b>Quadro comparativo</b>'
    +'<em>cada planeta com o seu correspondente; a seta \u21c5 converte a leitura de um mapa no outro</em></div>'
    +'<div class="sy-stack">'
    +['sun','moon','mercury','venus','mars','jupiter','saturn'].map(k=>sinParHTML(M,k)).join('')
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
