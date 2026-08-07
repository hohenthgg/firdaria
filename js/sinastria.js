/* ============================================================
   SINASTRIA.JS — dois mapas, uma leitura sintética.
   Ordem do motor: quem A é nos relacionamentos → quem B é →
   como os significadores se encontram → como a relação tende
   a funcionar. Aspecto isolado nunca vira conclusão.
   ============================================================ */
let SINB=null;                       // mapa da Pessoa B (leve, não mexe nos globais)
let SIN_FILTRO='principais';         // filtro de linhas da roda
let SIN_ABERTO=null;                 // bloco com "por quê" aberto

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

/* ---------------- padrão relacional individual ---------------- */
const SIN_ELEM=['fogo','terra','ar','água'];
const sinElemOf=L=>SIN_ELEM[signOf(L)%4];
function sinAspNat(C,a,b){
  if(!C.pts[a]||!C.pts[b])return null;
  return aspectBetween(C.pts[a].lon,C.pts[b].lon);
}
/* quem esta pessoa É nos relacionamentos — antes de olhar o outro mapa */
function sinPerfil(C){
  const W=[];                                            // testemunhos
  const moon=C.pts.moon, ven=C.pts.venus, mar=C.pts.mars, sat=C.pts.saturn;
  const r7=C.rulers[7], p7=C.pts[r7];
  // estilo de afeto: elementos de Lua e Vênus
  const els=[moon&&sinElemOf(moon.lon),ven&&sinElemOf(ven.lon)].filter(Boolean);
  const conta=e=>els.filter(x=>x===e).length;
  let afeto='misto';
  if(conta('terra')>=1&&conta('água')>=1)afeto='constante e ligado';
  else if(conta('terra')>=1)afeto='constante, mostrado em atos mais do que em palavras';
  else if(conta('água')>=2)afeto='fusional, com forte necessidade de proximidade';
  else if(conta('água')>=1)afeto='sensível, com apego que cresce devagar';
  else if(conta('fogo')>=1&&conta('ar')>=1)afeto='expansivo e declarado, mas que precisa de movimento';
  else if(conta('fogo')>=2)afeto='caloroso e demonstrativo';
  else afeto='mais mental do que corporal, mostrado em conversa e presença';
  W.push('Lua em '+(moon?SIGNS[signOf(moon.lon)]:'—')+' · Vênus em '+(ven?SIGNS[signOf(ven.lon)]:'—'));
  // necessidade de espaço: Saturno tocando Lua ou Vênus
  const satLua=sat&&moon?aspectBetween(sat.lon,moon.lon):null;
  const satVen=sat&&ven?aspectBetween(sat.lon,ven.lon):null;
  const espaco=!!(satLua||satVen||(moon&&[11,12].includes(moon.h)));
  if(satLua)W.push('Saturno '+satLua.gl+' Lua ('+fmtOrb(satLua.orb)+')');
  if(satVen)W.push('Saturno '+satVen.gl+' Vênus ('+fmtOrb(satVen.orb)+')');
  // iniciativa e desejo: Marte
  const marEl=mar?sinElemOf(mar.lon):null;
  const iniciativa=marEl==='fogo'?'alta e direta':marEl==='ar'?'rápida, começada pela conversa'
    :marEl==='terra'?'lenta e persistente':'indireta, movida pelo clima emocional';
  if(mar)W.push('Marte em '+SIGNS[signOf(mar.lon)]+' (casa '+mar.h+')');
  // compromisso: regente da 7ª e Saturno
  let compromisso='condicional', compTxt='depende de segurança construída aos poucos';
  const digP7=(p7&&p7.dig)||'';
  if(/domicílio|exaltação/.test(digP7)){compromisso='alto';compTxt='procura vínculo estável e sustenta o que assume';}
  else if(/exílio|queda/.test(digP7)){compromisso='difícil';compTxt='tende a hesitar entre querer o vínculo e temer o custo dele';}
  if(p7)W.push('regente da 7ª ('+PT_NAME[r7]+') na casa '+p7.h+' · '+(p7.dig||'—'));
  // promessa afetiva natal (Pessoa A usa as PROMESSAS reais)
  let promessa=null;
  if(C===undefined){}
  return {afeto,espaco,iniciativa,compromisso,compTxt,r7,W,
    frase:'Nos vínculos, o afeto tende a ser '+afeto
      +(espaco?'; precisa de espaço próprio para não se sentir engolido':'')
      +'. A iniciativa é '+iniciativa+' e o compromisso '
      +(compromisso==='alto'?'vem com facilidade':compromisso==='difícil'?'custa a fechar':'se firma por etapas')+'.'};
}

/* ---------------- o encontro dos dois mapas ---------------- */
const SIN_DIMS={
  atracao:{lab:'Atração',pares:[['venus','mars',3],['mars','venus',3],['sun','mars',1.5],
    ['mars','sun',1.5],['moon','mars',1.5],['mars','moon',1.5],['venus','sun',1.5],['sun','venus',1.5]]},
  afeto:{lab:'Vínculo emocional',pares:[['moon','venus',3],['venus','moon',3],['moon','moon',2.5],
    ['venus','venus',2],['moon','jupiter',2],['jupiter','moon',2],['venus','jupiter',1.5],['jupiter','venus',1.5]]},
  comunicacao:{lab:'Comunicação',pares:[['mercury','mercury',3],['mercury','moon',2],['moon','mercury',2],
    ['mercury','jupiter',1.5],['jupiter','mercury',1.5],['mercury','sun',1.5],['sun','mercury',1.5]]},
  estabilidade:{lab:'Estabilidade',pares:[['sun','moon',3],['moon','sun',3],['saturn','venus',2.5],
    ['venus','saturn',2.5],['saturn','moon',2.5],['moon','saturn',2.5],['saturn','sun',2],['sun','saturn',2]]},
  sexualidade:{lab:'Sexualidade',pares:[['mars','venus',3],['venus','mars',3],['mars','mars',2],
    ['moon','mars',1.5],['mars','moon',1.5]]}
};
/* aspectos entre os dois mapas, já classificados e pesados */
function sinHits(A,B){
  const hits=[];
  const push=(kA,kB,asp,w,dim)=>hits.push({kA,kB,asp,w,dim,
    tens:asp.cls==='tens',lonA:A.pts[kA]?A.pts[kA].lon:null,lonB:B.pts[kB]?B.pts[kB].lon:null});
  Object.entries(SIN_DIMS).forEach(([dim,D])=>{
    D.pares.forEach(([a,b,w])=>{
      if(!A.pts[a]||!B.pts[b])return;
      const asp=aspectBetween(A.pts[a].lon,B.pts[b].lon);
      if(asp)push(a,b,asp,w*(1-asp.orb/16),dim);
    });
  });
  // regentes das 7ªs conversando entre si — compromisso estrutural
  const rA=A.rulers[7], rB=B.rulers[7];
  if(A.pts[rA]&&B.pts[rB]){
    const asp=aspectBetween(A.pts[rA].lon,B.pts[rB].lon);
    if(asp)hits.push({kA:rA,kB:rB,asp,w:3*(1-asp.orb/16),dim:'estabilidade',reg7:true,
      tens:asp.cls==='tens',lonA:A.pts[rA].lon,lonB:B.pts[rB].lon});
  }
  // aspectos ao Ascendente do outro
  [['asc',A.asc,'A'],['asc',B.asc,'B']].forEach(([_,lonAsc,lado])=>{
    ['venus','mars','sun','moon'].forEach(k=>{
      const outro=lado==='A'?B:A;
      if(!outro.pts[k])return;
      const asp=aspectBetween(outro.pts[k].lon,lonAsc);
      if(asp&&(asp.ang===0||asp.ang===180))
        hits.push({kA:lado==='A'?'asc':k,kB:lado==='A'?k:'asc',asp,w:2*(1-asp.orb/16),
          dim:k==='mars'?'atracao':'afeto',tens:asp.cls==='tens',
          lonA:lado==='A'?lonAsc:outro.pts[k].lon,lonB:lado==='A'?outro.pts[k].lon:lonAsc});
    });
  });
  return hits;
}
/* sobreposições de casa: onde os planetas de um caem no mapa do outro */
function sinOverlays(A,B){
  const out=[];
  const olha=(dono,visita,rot)=>{
    Object.entries(visita.pts).forEach(([k,p])=>{
      const h=houseByRule(p.lon,dono.cusps);
      if([1,5,7,8].includes(h))out.push({quem:rot,k,h,
        dim:h===7?'estabilidade':h===5?'afeto':h===8?'sexualidade':'atracao',
        w:h===7?2:1.5});
    });
  };
  olha(A,B,'B em A'); olha(B,A,'A em B');
  return out;
}
function sinNivel(sc){return sc>=6.5?'muito alta':sc>=3.5?'alta':sc>=1.6?'moderada':'baixa';}
function sinNivelConf(sc){return sc>=5?'alto':sc>=2.2?'moderado':'baixo';}
/* o motor inteiro: perfis → hits → dimensões → frases literais */
function sinMotor(){
  const A=sinA(); if(!A||!SINB)return null;
  const B=SINB;
  const pA=sinPerfil(A), pB=sinPerfil(B);
  const hits=sinHits(A,B), ovl=sinOverlays(A,B);
  const dims={atracao:0,afeto:0,comunicacao:0,estabilidade:0,sexualidade:0}, conflito=[];
  const porDim={atracao:[],afeto:[],comunicacao:[],estabilidade:[],sexualidade:[],conflito:[]};
  hits.forEach(h=>{
    if(h.tens){
      // tensão de Marte/Saturno vira conflito; a tensão entre pessoais só reduz
      if(['mars','saturn'].includes(h.kA)||['mars','saturn'].includes(h.kB)){
        conflito.push(h); porDim.conflito.push(h);
        if(h.dim==='sexualidade'){dims.sexualidade+=h.w*0.5;porDim.sexualidade.push(h);} // fricção também acende
      } else {dims[h.dim]-=h.w*0.4; porDim[h.dim].push(h);}
    } else {dims[h.dim]+=h.w; porDim[h.dim].push(h);}
  });
  ovl.forEach(o=>{dims[o.dim]+=o.w; porDim[o.dim].push(o);});
  const confSc=conflito.reduce((s,h)=>s+h.w,0);
  // assimetria: de quem são os planetas pessoais mais tocados
  let recebeA=0,recebeB=0;
  hits.filter(h=>!h.tens&&(h.dim==='afeto'||h.dim==='atracao')).forEach(h=>{
    if(['moon','venus'].includes(h.kA))recebeA+=h.w;
    if(['moon','venus'].includes(h.kB))recebeB+=h.w;
  });
  // conflito dominante: do par tenso mais forte
  const topTen=conflito.slice().sort((a,b)=>b.w-a.w)[0];
  const parK=topTen?[topTen.kA,topTen.kB].sort().join('-'):null;
  const temaConf=!topTen?'nenhum ponto de desgaste estrutural detectado'
    :/mars-mars/.test(parK)?'disputa de iniciativa e de comando — os dois querem dirigir'
    :/saturn/.test(parK)&&/moon|venus/.test(parK)?'controle e cobrança: um tende a sentir o outro como frio ou fiscalizador'
    :/saturn/.test(parK)&&/sun/.test(parK)?'autoridade e reconhecimento: um tende a se sentir diminuído pelo outro'
    :/mars/.test(parK)&&/moon/.test(parK)?'reações rápidas ferindo o humor do outro — irritação que escala'
    :/mars/.test(parK)&&/venus/.test(parK)?'desejo e atrito misturados: paixão que vira briga e volta'
    :/mercury/.test(parK)?'discussões que escalam pela palavra — ironia e crítica'
    :'atrito pontual, sem padrão repetido';
  // compatibilidade geral: média ponderada menos o conflito
  const geral=(dims.afeto*1.2+dims.estabilidade*1.2+dims.atracao+dims.comunicacao+dims.sexualidade*0.8)/5.2
    - confSc*0.35;
  return {A,B,pA,pB,hits,ovl,dims,porDim,confSc,conflito,temaConf,
    recebeA,recebeB,geral,
    niveis:{
      geral:sinNivel(Math.max(0,geral)+1),
      atracao:sinNivel(dims.atracao),afeto:sinNivel(dims.afeto),
      comunicacao:sinNivel(dims.comunicacao),estabilidade:sinNivel(dims.estabilidade),
      sexualidade:sinNivel(dims.sexualidade),conflito:sinNivelConf(confSc)}};
}
/* frases literais por dimensão e nível */
function sinFrase(dim,nv,M){
  const a=M.A.name, b=M.B.name;
  const T={
    atracao:{['muito alta']:'Atração física forte e imediata, com iniciativa rápida dos dois lados.',
      alta:'Atração clara; a aproximação tende a acontecer sem grande esforço.',
      moderada:'Atração existe, mas cresce com a convivência mais do que no primeiro contato.',
      baixa:'A ligação tende a nascer de afinidade e rotina, não de impacto físico imediato.'},
    afeto:{['muito alta']:'Facilidade real de acolhimento e carinho: os dois tendem a se sentir em casa juntos.',
      alta:'Existe base sólida de afeto; criar intimidade tende a ser natural.',
      moderada:'O afeto existe, mas os dois demonstram de formas diferentes — exige tradução.',
      baixa:'O vínculo emocional precisa ser construído deliberadamente; não vem por gravidade.'},
    comunicacao:{['muito alta']:'A conversa flui em qualquer registro — do prático ao íntimo.',
      alta:'A conversa funciona bem no cotidiano; entendem-se sem muito ruído.',
      moderada:'Comunicação funcional, mas com zonas de mal-entendido que se repetem.',
      baixa:'Os estilos de pensar são diferentes o bastante para exigir paciência de tradução.'},
    estabilidade:{['muito alta']:'Há indicadores suficientes para relação estável e duradoura — não apenas atração temporária.',
      alta:'Boa capacidade de construir estrutura comum: rotina, casa e planos.',
      moderada:'A estabilidade é possível, mas depende de acordos explícitos e revisões.',
      baixa:'O vínculo tende a funcionar melhor livre de moldura formal — formalizar cedo pesa.'},
    sexualidade:{['muito alta']:'Compatibilidade sexual alta, com desejo sustentado dos dois lados.',
      alta:'Boa química física; a fricção, quando existe, tende a alimentar em vez de afastar.',
      moderada:'A química é razoável, mas ritmos e linguagens de desejo diferem.',
      baixa:'O desejo tende a depender do clima emocional mais do que do impulso.'}};
  return (T[dim]&&T[dim][nv])||'';
}
function sinAssimetria(M){
  const d=M.recebeA-M.recebeB;
  if(Math.abs(d)<1.2)return 'O investimento emocional tende a ser simétrico — nenhum dos dois fica esperando o outro.';
  const mais=d>0?M.A.name:M.B.name, menos=d>0?M.B.name:M.A.name;
  return mais+' tende a ser mais tocado e a investir mais cedo; '+menos+' preserva mais independência no início.';
}
function sinPotencial(M){
  if(M.dims.estabilidade>=3.5&&M.dims.afeto>=3)return 'Mais favorável a relação estável e construída do que a vínculo casual.';
  if(M.dims.atracao>=3.5&&M.dims.estabilidade<1.6)return 'Mais favorável a vínculo intenso e curto do que a estrutura longa — a não ser que os dois construam deliberadamente.';
  if(M.dims.comunicacao>=3.5&&M.dims.atracao<1.6)return 'Mais favorável a parceria e amizade sólida; o romance exige cultivo.';
  return 'O potencial depende de qual dimensão os dois decidirem alimentar: nenhuma domina sozinha.';
}

/* ---------------- render ---------------- */
function sinHitTxt(h){
  if(h.quem)return PT_NAME[h.k]+' de '+(h.quem==='B em A'?'B na casa '+h.h+' de A':'A na casa '+h.h+' de B');
  const nA=h.kA==='asc'?'Asc':PT_NAME[h.kA], nB=h.kB==='asc'?'Asc':PT_NAME[h.kB];
  return nA+' de A '+h.asp.gl+' '+nB+' de B ('+fmtOrb(h.asp.orb)+')'+(h.reg7?' · regentes das 7ªs':'');
}
function sinBloco(M,dim,rotulo,frase){
  const aberto=SIN_ABERTO===dim;
  const ind=(M.porDim[dim]||[]);
  let h='<div class="snb'+(aberto?' open':'')+'">'
    +'<div class="snb-h"><b>'+rotulo+'</b><em>'+(dim==='conflito'?M.niveis.conflito:M.niveis[dim])+'</em></div>'
    +'<p class="snb-p">'+frase+'</p>'
    +(ind.length?('<button class="pv-exp" data-snq="'+dim+'">'+ind.length+' indicador'+(ind.length>1?'es':'')+(aberto?' ↑':' ↓')+'</button>'):'');
  if(aberto&&ind.length){
    h+='<div class="snb-x">'
      +'<div class="snb-s"><span>base natal de '+M.A.name+'</span><p>'+M.pA.W.join(' · ')+'</p></div>'
      +'<div class="snb-s"><span>base natal de '+M.B.name+'</span><p>'+M.pB.W.join(' · ')+'</p></div>'
      +'<div class="snb-s"><span>interação</span><p>'+ind.map(sinHitTxt).join('<br>')+'</p></div>'
      +'<div class="snb-s"><span>síntese</span><p>'+frase+'</p></div>'
      +'</div>';
  }
  return h+'</div>';
}
/* roda: A dentro, B fora, linhas só do que sustenta a síntese */
function sinWheelSVG(M){
  const svg=$('sin-wheel'); const W=Math.max(260,(svg&&svg.clientWidth)||400), H=W;
  const CX=W/2, CY=H/2, RAD=Math.PI/180, Mm=W/2, u=Mm/250;
  const fs=(v,min)=>Math.max(min||6.5,Math.round(v*u*10)/10);
  const rOut=Mm*0.94, rB=Mm*0.82, rA=Mm*0.60;
  const ang=L=>180+(L-M.A.asc);
  const P=(L,r)=>{const a=ang(L)*RAD;return [CX+r*Math.cos(a),CY-r*Math.sin(a)];};
  let s='<circle cx="'+CX+'" cy="'+CY+'" r="'+rOut+'" fill="none" stroke="rgba(255,255,255,.10)"/>';
  for(let i=0;i<12;i++){const [x1,y1]=P(i*30,rOut),[x2,y2]=P(i*30,rOut-fs(6,4));
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(255,255,255,.14)"/>';}
  const FILTROS={principais:null,afetivos:['afeto'],sexuais:['sexualidade','atracao'],
    comunicacao:['comunicacao'],conflito:['conflito'],compromisso:['estabilidade'],todos:'todos'};
  const querDims=FILTROS[SIN_FILTRO];
  const linhas=M.hits.filter(h=>h.lonA!=null&&h.lonB!=null).filter(h=>{
    const cat=h.tens&&(['mars','saturn'].includes(h.kA)||['mars','saturn'].includes(h.kB))?'conflito':h.dim;
    if(querDims==='todos')return true;
    if(querDims===null)return h.w>=1.6;
    return querDims.includes(cat);
  });
  const cor={harm:'111,159,216',conj:'220,184,119',tens:'201,120,120'};
  linhas.forEach(h=>{
    const [x1,y1]=P(h.lonA,rA),[x2,y2]=P(h.lonB,rB);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba('+cor[h.asp.cls]+','
      +(0.28+Math.min(0.5,h.w/6))+')" stroke-width="'+(h.w>=2.2?1.4:1)+'"/>';
  });
  const marca=(pts,r,col)=>{
    const its=Object.entries(pts).map(([k,p])=>({k,lon:p.lon}));
    its.sort((a,b)=>a.lon-b.lon);
    for(let i=1;i<its.length;i++){if(its[i].lon-its[i-1].lon<fs(11,9))its[i].lon=its[i-1].lon+fs(11,9);}
    its.forEach(it=>{const [x,y]=P(it.lon,r), rd=fs(9.5,7.5), f=fs(10.5,8.5);
      s+='<circle cx="'+x+'" cy="'+y+'" r="'+rd+'" fill="#070b14" stroke="rgba('+col+',.42)"/>'
        +'<text x="'+x+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" fill="rgba('+col+',.9)">'+(PT_GLYPH[it.k]||'')+'︎</text>';});
  };
  marca(M.A.pts,rA,'233,238,248');
  marca(M.B.pts,rB,'220,184,119');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  return s;
}
function renderSin(){
  const el=$('sin-body'); if(!el)return;
  if(typeof NATAL==='undefined'||!NATAL){el.innerHTML=emptyState();return;}
  if(!SINB){
    el.innerHTML='<p class="pv-int">Carregue a Pessoa B — pelo link do Aspectarian ou colando o mapa no mesmo formato da aba Dados. A Pessoa A é o mapa principal do app.</p>';
    if($('sin-main'))$('sin-main').hidden=true;
    return;
  }
  const M=sinMotor(); if(!M){el.innerHTML='';return;}
  if($('sin-main'))$('sin-main').hidden=false;
  el.innerHTML='';
  /* cabeçalho A × B */
  $('sin-head').innerHTML=
    '<div class="snp"><b>'+M.A.name+'</b><em>'+(M.A.birth||'')+' · Asc '+SIGNS[signOf(M.A.asc)]+'</em>'
      +'<p>'+M.pA.frase+'</p></div>'
    +'<span class="snx">×</span>'
    +'<div class="snp b"><b>'+M.B.name+'</b><em>'+(M.B.birth?M.B.birth.slice(0,10):'')+' · Asc '+SIGNS[signOf(M.B.asc)]+'</em>'
      +'<p>'+M.pB.frase+'</p></div>';
  /* visão geral */
  const linha=(k,v)=>'<div class="snv"><span>'+k+'</span><b>'+v+'</b></div>';
  $('sin-visao').innerHTML=
    linha('Compatibilidade geral',M.niveis.geral)
    +linha('Atração',M.niveis.atracao)
    +linha('Vínculo emocional',M.niveis.afeto)
    +linha('Comunicação',M.niveis.comunicacao)
    +linha('Estabilidade',M.niveis.estabilidade)
    +linha('Conflito',M.niveis.conflito);
  /* como a relação funciona */
  $('sin-blocos').innerHTML=
    sinBloco(M,'atracao','Atração',sinFrase('atracao',M.niveis.atracao,M))
    +sinBloco(M,'afeto','Afeto',sinFrase('afeto',M.niveis.afeto,M))
    +sinBloco(M,'comunicacao','Comunicação',sinFrase('comunicacao',M.niveis.comunicacao,M))
    +sinBloco(M,'estabilidade','Compromisso',sinFrase('estabilidade',M.niveis.estabilidade,M))
    +sinBloco(M,'sexualidade','Sexualidade',sinFrase('sexualidade',M.niveis.sexualidade,M))
    +sinBloco(M,'conflito','Principal dificuldade',cap1(M.temaConf)+'.')
    +'<div class="snb"><div class="snb-h"><b>Assimetria</b></div><p class="snb-p">'+sinAssimetria(M)+'</p></div>'
    +'<div class="snb"><div class="snb-h"><b>Potencial</b></div><p class="snb-p">'+sinPotencial(M)+'</p></div>';
  /* roda + filtros */
  const det=$('sin-roda');
  if(det&&det.open){try{$('sin-wheel').innerHTML=sinWheelSVG(M);}catch(e){console.error('sin wheel',e);}}
  document.querySelectorAll('#sin-filtros [data-snf]').forEach(b=>b.classList.toggle('on',b.dataset.snf===SIN_FILTRO));
}
function bindSinastria(){
  const w=$('p-sin'); if(!w)return;
  SINB=sinLoad();
  const det=$('sin-roda');
  if(det)det.addEventListener('toggle',()=>{if(det.open)renderSin();});
  w.addEventListener('click',e=>{
    const q=e.target.closest&&e.target.closest('[data-snq]');
    if(q){SIN_ABERTO=SIN_ABERTO===q.dataset.snq?null:q.dataset.snq;renderSin();return;}
    const f=e.target.closest&&e.target.closest('[data-snf]');
    if(f){SIN_FILTRO=f.dataset.snf;renderSin();return;}
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
  window.addEventListener('resize',()=>{try{if($('p-sin').classList.contains('on'))renderSin();}catch(e){}});
}
