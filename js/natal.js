/* ============================================================
   NATAL.JS — um planeta por vez.

   Nível 1 · conclusão legível: o que este planeta administra,
             onde isso se realiza, e o que o signo modifica.
   Nível 2 · "Estrutura natal": condição, dignidades, regências,
             dispositor, recepções nomeadas, aspectos, polaridades.
   Nível 3 · a fundamentação de cada afirmação, dentro do nível 2.

   O motor não confunde posição por casa com regência: a casa
   ocupada descreve o MODO de funcionamento; as casas regidas
   dizem QUAL matéria concreta o planeta carrega (ver olavo.js).
   ============================================================ */

/* natureza universal — o que o planeta é antes de qualquer mapa */
const PL_NATUREZA={
  sun    :{n:'centro da vida',        d:'o que organiza tudo em torno de si e dá direção'},
  moon   :{n:'corpo e hábito',        d:'o que muda de estado, se afeiçoa e pede cuidado'},
  mercury:{n:'razão e intermediação', d:'o que separa, nomeia, negocia e transporta'},
  venus  :{n:'apreço e acordo',       d:'o que aproxima, harmoniza e dá valor'},
  mars   :{n:'corte e iniciativa',    d:'o que separa à força, disputa e executa'},
  jupiter:{n:'ampliação e concessão', d:'o que abre espaço, avaliza e concede'},
  saturn :{n:'limite e duração',      d:'o que restringe, adia e faz durar'}
};
/* camada secundária: estilo, não capacidade */
const PL_MODO_EL={
  fogo :'realização imediata e direta, que perde o interesse no que demora',
  terra:'realização progressiva, concreta e persistente',
  ar   :'realização discursiva, feita de articulação e troca',
  'água':'realização indireta, que retém e responde ao clima afetivo'
};
const PL_MODO_MO={cardinal:'inicia',fixo:'sustenta',mutável:'adapta'};

/* --- contrações e concordância do português --- */
const PL_CONTR={de:{a:'da',o:'do',as:'das',os:'dos'},
                por:{a:'pela',o:'pelo',as:'pelas',os:'pelos'},
                em:{a:'na',o:'no',as:'nas',os:'nos'},
                a:{a:'à',o:'ao',as:'às',os:'aos'}};
function prep(p,s){
  if(!s)return p;
  const m=s.match(/^(as|os|a|o)\s+(.*)$/i);
  if(m&&PL_CONTR[p]&&PL_CONTR[p][m[1].toLowerCase()])return PL_CONTR[p][m[1].toLowerCase()]+' '+m[2];
  return p+' '+s;
}
function lista(a){
  a=(a||[]).filter(Boolean);
  if(a.length<=1)return a[0]||'';
  if(a.some(x=>/\se\s/.test(x)))return a.join(', ');
  return a.slice(0,-1).join(', ')+' e '+a[a.length-1];
}
const plural=(arr,txt)=>(arr&&arr.length>1)||/\se\s/.test(txt||'');

/* --- o núcleo: tudo que o app sabe sobre um planeta deste mapa --- */
function natalNucleo(k){
  const p=NATAL&&NATAL.pts[k]; if(!p)return null;
  const ctx=ctxNatal(), L=p.lon, s=signOf(L), rege=ruledHouses(k), casa=p.h;
  const cond=condicaoDe(k,ctx);
  const pol=polaridades(k,ctx);
  /* recepções nomeadas com os demais planetas */
  const rec=[];
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k||!NATAL.pts[o])return;
    const mut=recepcaoMutua(k,o,ctx.pts,ctx.diurno);
    const asp=aspectBetween(L,NATAL.pts[o].lon);
    if(mut){rec.push({com:o,mutua:true,asp,
      t:'Recepção mútua com '+PT_NAME[o]+' ('+mut.a.dig+' × '+mut.b.dig+')'
        +(mut.peso==='forte'?' — das fortes: um entrega o assunto do outro sem resistência.'
                            :' — das menores: acolhimento existe, mas é fraco.')});return;}
    const rs=recepcoesEntre(k,o,ctx.pts,ctx.diurno).filter(x=>x.quem===o);
    if(rs.length){const d=rs[0];
      rec.push({com:o,mutua:false,asp,
        t:PT_NAME[o]+' acolhe '+PT_NAME[k]+' por '+d.dig+(asp?(' · '+asp.gl+' '+fmtOrb(asp.orb)):' · sem aspecto')+'.'});}
  });
  /* aspectos aos demais */
  const asps=[];
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k||!NATAL.pts[o])return;
    const a=aspectBetween(L,NATAL.pts[o].lon); if(!a)return;
    asps.push({com:o,a});
  });
  asps.sort((x,y)=>x.a.orb-y.a.orb);
  const camadas=(typeof olavoCamadas==='function')?olavoCamadas(k,casa,rege):null;
  return {k,p,L,s,rege,casa,cond,pol,rec,asps,camadas,
    nat:PL_NATUREZA[k],retro:!!p.retro,liminar:p.hBack||null};
}

/* ---------- nível 1 · as três frases do painel ---------- */
function natalRege(N){
  if(!N.rege.length)return {t:'Não rege casa alguma',d:'Atua apenas pela casa que ocupa e pelos aspectos que faz.'};
  const mat=lista(N.rege.map(h=>HOUSE_TAG[h]));
  return {t:'Rege '+lista(N.rege.map(h=>'a '+h+'ª')),
    d:cap1(lista(N.rege.map(h=>HOUSE_THEME[h].split(':').pop().trim())))+' '
      +(plural(N.rege,mat)?'tornam-se':'torna-se')+' a matéria concreta administrada por '+PT_NAME[N.k]+'.'};
}
function natalCasa(N){
  const F=(typeof OL_FUSAO!=='undefined')?OL_FUSAO[N.casa]:null;
  const mat=N.rege.length?lista(N.rege.map(h=>HOUSE_TAG[h])):null;
  let d;
  if(!mat) d='O modo de operar é o '+(N.camadas?N.camadas.psi.campo:HOUSE_TAG[N.casa])+', sem matéria própria administrada.';
  else if(F) d=cap1(mat)+' '+(plural(N.rege,mat)?F:F.replace(/^passam /,'passa '))+'.';
  else d=cap1(mat)+' se realiza '+prep('por',HOUSE_TAG[N.casa])+'.';
  return {t:'Está na '+N.casa+'ª'+(N.liminar?(' (liminar com a '+N.liminar+'ª)'):''),d};
}
function natalSigno(N){
  return {t:SIGNS[N.s],d:cap1(PL_MODO_EL[SIGN_ELEM[N.s]])+'.'};
}

/* Gargatholil: formatação do texto, usada pelos eixos e nodos */
function natalGargTxt(t){
  let out='',ul=[];
  const flush=()=>{if(ul.length){out+='<ul class="ne-l">'+ul.map(x=>'<li>'+x+'</li>').join('')+'</ul>';ul=[];}};
  t.split(/\n/).forEach(l=>{
    l=l.trim(); if(!l){flush();return;}
    if(/^##\s*/.test(l)){flush();out+='<p class="np-h">'+l.replace(/^##\s*/,'')+'</p>';}
    else if(/^—.*—$/.test(l)){flush();out+='<p class="np-h">'+l.replace(/^—\s*|\s*—$/g,'')+'</p>';}
    else if(/^-\s+/.test(l))ul.push(l.replace(/^-\s+/,''));
    else{flush();out+='<p>'+l+'</p>';}
  });
  flush(); return out;
}
/* eixos e nodos: colocações traduzidas do Depth, quando o mapa coincide */
function natalEixoHTML(){
  if(typeof LION_EIXO==='undefined'||typeof NATAL==='undefined'||!NATAL)return '';
  const items=[];
  const sAsc=signOf(NATAL.asc), sMc=signOf(NATAL.mc);
  if(LION_EIXO.ascSigno[sAsc])items.push(['Ascendente em '+SIGNS[sAsc],LION_EIXO.ascSigno[sAsc]]);
  if(LION_EIXO.mcSigno[sMc])items.push(['Meio-do-Céu em '+SIGNS[sMc],LION_EIXO.mcSigno[sMc]]);
  const nn=NATAL.pts&&NATAL.pts.nn, sn=NATAL.pts&&NATAL.pts.sn;
  if(nn&&LION_EIXO.nnCasa[nn.h])items.push(['Nodo Norte na casa '+nn.h,LION_EIXO.nnCasa[nn.h]]);
  if(sn&&LION_EIXO.snCasa[sn.h])items.push(['Nodo Sul na casa '+sn.h,LION_EIXO.snCasa[sn.h]]);
  if(!items.length)return '';
  return '<div class="npan-ps garg" style="margin-top:12px"><span>eixos e nodos segundo Gargatholil — em português</span>'
    +items.map(it=>'<details class="np-int"><summary>'+it[0]+'</summary>'
      +'<div class="np-txt">'+natalGargTxt(it[1])+'</div></details>').join('')
    +'</div>';
}

/* ============================================================
   AS FONTES, NA ÍNTEGRA
   Organizadas pelo que descrevem, não por autor: primeiro o
   planeta no signo, depois o planeta na casa. Cada autor aparece
   sempre — com o texto integral quando o corpus cobre a colocação,
   e com a ausência declarada quando não cobre.
   ============================================================ */
function foPar(t){
  return String(t).split(/\n\n+/).map(x=>{
    x=x.replace(/\n/g,' ').trim(); if(!x)return '';
    if(/^##\s*/.test(x))return '<p class="np-h">'+x.replace(/^##\s*/,'')+'</p>';
    if(/^—.*—$/.test(x))return '<p class="np-h">'+x.replace(/^—\s*|\s*—$/g,'')+'</p>';
    if(/^-\s+/m.test(x))return '<ul class="ne-l">'+x.split('\n').filter(Boolean)
      .map(l=>'<li>'+l.replace(/^-\s+/,'')+'</li>').join('')+'</ul>';
    return '<p>'+x+'</p>';
  }).join('');
}
/* uma entrada: autor, obra, e o texto — ou a declaração de ausência */
function foItem(autor,obra,txt,extra){
  if(!txt){
    /* distinguir corpus ainda não carregado de colocação sem texto */
    const carregando=(typeof CORPORA_PRONTOS!=='undefined'&&!CORPORA_PRONTOS);
    return '<div class="fo-i vazio"><b>'+autor+'</b><span>'+obra+'</span>'
      +'<em>'+(carregando?'carregando o corpus…':'sem texto para esta colocação neste corpus')+'</em></div>';
  }
  const n=String(txt).replace(/\s+/g,' ').length;
  return '<details class="fo-i"><summary><b>'+autor+'</b><span>'+obra+'</span>'
    +'<i>íntegra · '+(n>1200?(Math.round(n/1000)+' mil caracteres'):(n+' caracteres'))+'</i></summary>'
    +'<div class="np-txt">'+(extra||'')+foPar(txt)+'</div></details>';
}
function natalFontesHTML(N){
  const k=N.k, h=N.casa, sg=N.s;
  const get=(o,a,b)=>{try{return o&&o[a]&&o[a][b]?o[a][b]:null;}catch(e){return null;}};
  /* --- o planeta no signo --- */
  const bSig=(typeof BARB_SIGNO!=='undefined')?BARB_SIGNO[sg]:null;
  const bPS=(typeof BARB_PS!=='undefined')?get(BARB_PS,k,sg):null;
  const gPTs=(typeof GARG_PT_S!=='undefined')?get(GARG_PT_S,k,sg):null;
  const gENs=(typeof GARG_SIGNO!=='undefined')?get(GARG_SIGNO,k,sg):null;
  const cic=(typeof LION_CICLO!=='undefined')?LION_CICLO[sg]:null;
  const signo='<div class="fo-g"><h5>'+PT_NAME[k]+' em '+SIGNS[sg]+'<span>o planeta no signo</span></h5>'
    +(cic?('<p class="fo-cic">'+cic+'</p>'):'')
    +foItem('Barbault','Manual Prático — '+PT_NAME[k]+' em '+SIGNS[sg],bPS)
    +foItem('Barbault','Manual Prático — o capítulo de '+SIGNS[sg],bSig)
    +foItem('Gargatholil','Depth Astrology vol. 2 — em português',gPTs)
    +foItem('Gargatholil','Depth Astrology vol. 2 — original em inglês',gENs)
    +'<div class="fo-i vazio"><b>Olavo de Carvalho</b><span>Astrologia Simbólica</span>'
      +'<em>a obra trata do planeta nas casas, não do planeta nos signos</em></div>'
    +'</div>';
  /* --- o planeta na casa --- */
  const ru=(typeof RU_OLAVO!=='undefined')?get(RU_OLAVO,h,k):null;
  const olT=(typeof OL_TEXTO!=='undefined')?get(OL_TEXTO,h,k):null;
  const bPC=(typeof BARB_PC!=='undefined')?get(BARB_PC,k,h):null;
  const gPTc=(typeof GARG_PT_C!=='undefined')?get(GARG_PT_C,k,h):null;
  const gENc=(typeof GARG_CASA!=='undefined')?get(GARG_CASA,k,h):null;
  const defC=(typeof RU_CASA!=='undefined')?RU_CASA[h]:null;
  let olTxt=null, olExtra='';
  if(ru){
    olTxt=ru.t.join('\n\n')+(ru.a?('\n\n## A aporia\n\n'+ru.a):'');
    olExtra=(ru.s?('<p class="fo-sint"><span>síntese do autor</span>'+ru.s+'</p>'):'')
      +(ru.e?('<p class="fo-ex"><span>exemplos do autor</span>'+ru.e+'</p>'):'');
  } else if(olT) olTxt=olT;
  const casa='<div class="fo-g"><h5>'+PT_NAME[k]+' na casa '+h+'<span>o planeta na casa</span></h5>'
    +foItem('Olavo de Carvalho','Astrologia Simbólica — '+PT_NAME[k]+' na Casa '+h,olTxt,olExtra)
    +foItem('Olavo de Carvalho','Astrologia Simbólica — o que é a Casa '+h,defC)
    +foItem('Barbault','Manual Prático — '+PT_NAME[k]+' na casa '+h,bPC)
    +foItem('Gargatholil','Depth Astrology vol. 3 — em português',gPTc)
    +foItem('Gargatholil','Depth Astrology vol. 3 — original em inglês',gENc)
    +'</div>';
  return '<div class="npan-ps fontes"><span>as fontes, na íntegra</span>'
    +'<p class="np-sub">O que cada autor escreve sobre esta colocação, sem resumo. '
    +'Quando um corpus não cobre a colocação, a ausência fica declarada em vez de sumir.</p>'
    +signo+casa+'</div>';
}

/* ---------- render: chips + painel único ---------- */
let NX_SEL=null, NX_DET=null;
function natalChipsHTML(){
  return Object.keys(PT_NAME).map(k=>{
    const p=NATAL.pts[k]; if(!p)return '';
    const on=(NX_SEL||Object.keys(PT_NAME)[0])===k;
    return '<button class="nchip'+(on?' on':'')+'" data-nx="'+k+'">'
      +'<i>'+(PT_GLYPH[k]||'')+'︎</i><span>'+PT_NAME[k]+'</span></button>';
  }).join('');
}
/* ============================================================
   O PAINEL DE UM PLANETA
   Cadeia de causa e efeito no topo (o planeta, o que rege, onde
   está, o signo, o resultado), depois três colunas: a explicação
   simples, as camadas de profundidade e a legenda da página.
   Todo o conteúdo é o mesmo de antes — muda a forma de apresentar.
   ============================================================ */
const NL_LAYICO={
  fn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
    +'<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
  alta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
    +'<path d="M11 20C6 20 4 16 4 12 9 12 12 9 12 4c4 1 7 4 7 9 0 4-3 7-8 7z"/><path d="M8 20c1-4 3-7 6-9"/></svg>',
  baixa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
    +'<path d="M12 3.5 21.5 20h-19z"/><path d="M12 9.5v4.5M12 17h.01"/></svg>',
  ex:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">'
    +'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/></svg>',
  psi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
    +'<path d="M12 20c4.4 0 8-3.1 8-7 0-3.3-2.7-6-6-6-2.8 0-5 2-5 4.4 0 2 1.6 3.6 3.6 3.6 1.6 0 2.9-1.2 2.9-2.7"/></svg>'};
const NL_ICO={
  rege:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
    +'<path d="M3 21h18M4 21V10m4 11V10m4 11V10m4 11V10m4 11V10M2 10l10-7 10 7z"/></svg>',
  casa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
    +'<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  res:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">'
    +'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>'};
function natalCadeiaHTML(N){
  const k=N.k, R=natalRege(N), C=natalCasa(N), S=natalSigno(N);
  const fn=(typeof LION_FUNCAO!=='undefined'&&LION_FUNCAO[k])
    ? cap1(LION_FUNCAO[k])+'.' : cap1(N.nat.n)+' — '+N.nat.d+'.';
  const passo=(cor,ico,rot,txt)=>'<div class="nl-st '+cor+'">'
    +'<div class="nl-hd"><span class="nl-ic">'+ico+'</span><b>'+rot+'</b></div>'
    +'<p>'+txt+'</p></div>';
  const seta='<div class="nl-ar" aria-hidden="true">→</div>';
  const res=N.camadas?N.camadas.sintese:(cap1(R.d)+' '+C.d);
  return '<section class="nl-chain">'
    +'<div class="nl-chain-h"><h3>A lógica de '+PT_NAME[k]+' no seu mapa</h3>'
      +'<span class="nl-meta">'+SIGNS[N.s]+' · casa '+N.casa+(N.retro?' · ℞':'')
      +' · condição <i class="npan-c '+N.cond.nivel+'">'+N.cond.nivel+'</i></span></div>'
    +'<div class="nl-row">'
      +passo('c1','<i class="nl-g">'+(PT_GLYPH[k]||'')+'︎</i>',PT_NAME[k],fn)+seta
      +passo('c2',NL_ICO.rege,(N.rege.length?('rege a '+N.rege[0]+'ª'):'sem regência'),R.d)+seta
      +passo('c3',NL_ICO.casa,'está na '+N.casa+'ª',C.d)+seta
      +passo('c4','<i class="nl-g">'+sgGlyph(N.s)+'</i>','em '+SIGNS[N.s],S.d)+seta
      +passo('c5',NL_ICO.res,'resultado',res)
    +'</div></section>';
}
/* --- coluna 1: a explicação em linguagem simples --- */
function natalSimplesHTML(N){
  const k=N.k, R=natalRege(N), C=natalCasa(N), S=natalSigno(N);
  const p=[];
  if(typeof LION_FUNCAO!=='undefined'&&LION_FUNCAO[k])
    p.push(cap1(PT_NAME[k])+' é '+LION_FUNCAO[k]+'.');
  else p.push(cap1(PT_NAME[k])+' é '+N.nat.n+': '+N.nat.d+'.');
  p.push(R.d);
  p.push(C.d);
  p.push('Em '+SIGNS[N.s]+', '+(typeof LION_ESTILO_ELEM!=='undefined'&&LION_ESTILO_ELEM[SIGN_ELEM[N.s]]
    ? ('opera '+LION_ESTILO_ELEM[SIGN_ELEM[N.s]]+', '+(LION_ESTILO_MODO[SIGN_MODE[N.s]]||'')+'.')
    : S.d));
  /* o resumo fecha com a condição — o resultado já traz a síntese */
  const resumo=N.cond?(cap1(PT_NAME[k])+' está em condição <b>'+N.cond.nivel+'</b>: '+N.cond.nivelTxt+'.'):null;
  return '<div class="nl-card"><div class="nl-ch"><span class="nl-ci c1">'
    +(PT_GLYPH[k]||'')+'︎</span><h4>Explicação simples</h4></div>'
    +p.map(x=>'<p>'+x+'</p>').join('')
    +(resumo?('<p class="nl-res"><i>i</i><span>Em resumo: '+resumo+'</span></p>'):'')
    +'</div>';
}
/* --- coluna 2: as camadas, em acordeão --- */
function natalCamadasHTML(N){
  const k=N.k, li=a=>'<ul class="ne-l">'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
  const cam=[];
  if(typeof LION_TRACO!=='undefined'&&LION_TRACO[k]){
    cam.push(['c1',NL_LAYICO.fn,'função e traços',
      (typeof LION_FUNCAO!=='undefined'?LION_FUNCAO[k]:N.nat.d),
      '<p>'+cap1(LION_PRESENCA[k])+'.</p>'
      +'<p class="np-h">Tendências</p>'+li(LION_TRACO[k])]);
    cam.push(['c3',NL_LAYICO.alta,'expressão construtiva',
      'Como '+PT_NAME[k]+' rende quando está bem sustentado no mapa.',
      li(LION_ALTA[k])]);
    cam.push(['c5',NL_LAYICO.baixa,'sob aflição',
      'Desvios e excessos que enfraquecem a expressão de '+PT_NAME[k]+'.',
      li(LION_BAIXA[k])]);
  }
  const reg=(typeof LION_REG_PL!=='undefined')?LION_REG_PL[k]:null;
  const rc=(typeof LION_REG_CASA!=='undefined')?LION_REG_CASA[N.casa]:null;
  if(reg||rc)cam.push(['c4',NL_LAYICO.ex,'exemplos concretos',
    'O que '+PT_NAME[k]+' e a casa '+N.casa+' significam no mundo e na psique.',
    (reg?('<p class="np-h">'+PT_NAME[k]+' — registro objetivo</p><p>'+reg[0]+'</p>'
      +'<p class="np-h">'+PT_NAME[k]+' — registro subjetivo</p><p>'+reg[1]+'</p>'):'')
    +(rc?('<p class="np-h">Casa '+N.casa+' — registro objetivo</p><p>'+rc[0]+'</p>'
      +'<p class="np-h">Casa '+N.casa+' — registro subjetivo</p><p>'+rc[1]+'</p>'):'')]);
  if(N.camadas)cam.push(['c2',NL_LAYICO.psi,'leitura psicológica — Olavo',
    (N.camadas.psi.titulo||'A casa lida pela regência concreta do planeta.'),
    '<p>'+N.camadas.sintese+'</p><p class="np-sub">'+N.camadas.psi.texto+'</p>']);
  if(!cam.length)return '';
  return '<div class="nl-card"><h4 class="nl-h4">Camadas de profundidade</h4>'
    +cam.map(c=>'<details class="nl-lay"><summary>'
      +'<span class="nl-ci '+c[0]+'">'+c[1]+'</span>'
      +'<span class="nl-lt"><b>'+c[2]+'</b><em>'+cap1(c[3])+'</em></span>'
      +'<i class="nl-cx">⌄</i></summary><div class="nl-lb">'+c[4]+'</div></details>').join('')
    +'</div>';
}
/* --- coluna 3: como ler a página --- */
function natalLegendaHTML(N){
  const passos=[['c1','O que é o planeta'],['c2','O que ele rege'],['c3','Onde ele atua no mapa'],
    ['c4','Como o signo modifica'],['c5','Qual o resultado disso']];
  return '<div class="nl-card nl-leg" id="nl-legenda"><div class="nl-ch">'
    +'<span class="nl-ci c5">✦</span><h4>Como ler esta página</h4></div>'
    +'<p>Esta é uma leitura de causa e efeito.</p>'
    +'<ul class="nl-lg">'+passos.map(p=>'<li><i class="'+p[0]+'"></i>'+p[1]+'</li>').join('')+'</ul>'
    +'<p>Siga a sequência para entender como cada parte se conecta e forma o significado final.</p>'
    +'<p class="nl-sub">Abaixo, as camadas de profundidade e as fontes na íntegra trazem o texto '
    +'completo de cada autor; a estrutura natal mostra o cálculo que sustenta a leitura.</p></div>';
}
function natalPainelHTML(k){
  const N=natalNucleo(k); if(!N)return '<p class="note">ponto não encontrado.</p>';
  return '<article class="npan nl">'
    +natalCadeiaHTML(N)
    +'<div class="nl-grid">'+natalSimplesHTML(N)+natalCamadasHTML(N)+natalLegendaHTML(N)+'</div>'
    +natalFontesHTML(N)
    +'<button class="npan-x" data-nxdet="'+k+'">Estrutura natal <i>'+(NX_DET===k?'⌄':'›')+'</i></button>'
    +(NX_DET===k?natalEstruturaHTML(N):'')
    +'</article>';
}
/* ---------- nível 2 · a estrutura, auditável ---------- */
function natalEstruturaHTML(N){
  const cn=N.cond;
  const sec=(t,c)=>'<section class="ne"><span>'+t+'</span>'+c+'</section>';
  const li=a=>'<ul class="ne-l">'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
  let h='<div class="ne-wrap">';
  /* condição — a pergunta central */
  h+=sec('condição — capacidade de realizar o ofício',
    '<p class="ne-v"><b>'+cap1(cn.nivel)+'</b> · '+cn.nivelTxt+'.</p>'
    +'<div class="ne-f">'+cn.fatores.map(f=>
      '<div class="ne-fi '+(f.v>0?'p':f.v<0?'n':'')+'"><i>'+f.f+'</i><span>'+f.t+'</span></div>').join('')+'</div>');
  /* regência e matéria */
  h+=sec('regências',N.rege.length
    ? li(N.rege.map(x=>'<b>'+x+'ª</b> — '+HOUSE_THEME[x]))
    : '<p>Nenhuma casa sob sua regência neste mapa.</p>');
  /* dispositor */
  h+=sec('dispositor',cn.dispositor
    ? '<p>'+PT_NAME[N.k]+' está no signo de <b>'+PT_NAME[cn.dispositor.k]+'</b>, na casa '+cn.dispositor.casa+'. '
      +(cn.dispositor.recebido
        ? 'Há acolhimento: recepção por '+cn.dispositor.dig+'.'
        : 'Não há acolhimento por nenhuma dignidade — a entrega depende de quem não tem obrigação com o assunto.')+'</p>'
    : '<p>Está no próprio domicílio: dispõe de si mesmo.</p>');
  /* recepções, sempre nomeadas */
  h+=sec('recepções',N.rec.length?li(N.rec.map(r=>r.t))
    :'<p>Nenhuma recepção com os demais planetas — nem por domicílio, exaltação, triplicidade, termo ou face.</p>');
  /* aspectos — forma de interação, não juízo */
  h+=sec('aspectos',N.asps.length?li(N.asps.map(x=>{
      const forma={0:'fusão de operação',60:'transmissão fácil',120:'transmissão fácil',
        90:'fricção que exige ajuste',180:'tensão por oposição de campo'}[x.a.ang]||'contato';
      const co=condicaoDe(x.com,ctxNatal());
      return '<b>'+PT_NAME[x.com]+'</b> '+x.a.gl+' ('+fmtOrb(x.a.orb)+') — '+forma
        +'. O que se '+(x.a.cls==='tens'?'tensiona':'facilita')+' depende da condição de '+PT_NAME[x.com]
        +', que está <i>'+(co?co.nivel:'—')+'</i>'
        +(ruledHouses(x.com).length?(' e administra '+lista(ruledHouses(x.com).map(y=>y+'ª'))):'')+'.';
    })):'<p>Sem aspectos dentro do orbe.</p>');
  /* polaridades e conflitos — a distinção explícita */
  h+=sec('polaridade e conflito',N.pol.length?li(N.pol.map(p=>p.txt))
    :'<p>Não opera em signo de debilidade de nenhum outro planeta do mapa.</p>');
  /* camadas do material psicológico */
  if(N.camadas){
    h+=sec('camada psicológica · fonte',
      '<p class="ne-src"><b>Casa ocupada ('+N.casa+'ª)</b> — descreve a estrutura psíquica, não o assunto: '
      +N.camadas.psi.desc+'.</p>'
      +'<p class="ne-src">Formulação do material: “'+(N.camadas.psi.fonte||'—')+'”'
      +(N.camadas.psi.titulo?('<br>Nomenclatura da fonte: <i>'+N.camadas.psi.titulo+'</i>.'):'')+'</p>'
      +'<p class="ne-src"><b>Casas regidas</b> — dizem qual matéria concreta o planeta carrega: '
      +N.camadas.conteudo.texto+'</p>'
      +'<p class="ne-fim">'+N.camadas.sintese+'</p>');
  } else {
    h+=sec('camada psicológica · fonte',
      '<p class="ne-src">O material de referência (Olavo de Carvalho, <i>Planetas nas Casas</i>) não cobre Mercúrio. Esta camada não se aplica.</p>');
  }
  /* estilo, camada secundária */
  h+=sec('estilo (camada secundária)','<p>'+SIGNS[N.s]+' — '+SIGN_ELEM[N.s]+', '+SIGN_MODE[N.s]+'. '
    +cap1(PL_MODO_EL[SIGN_ELEM[N.s]])+'; '+PL_MODO_MO[SIGN_MODE[N.s]]+' mais do que as outras coisas. '
    +'<i>Descreve o modo, não a capacidade.</i></p>');
  return h+'</div>';
}
function renderNatalTab(){
  const chips=$('nx-chips'), pan=$('nx-panel');
  if(!chips||!pan)return;
  if(typeof NATAL==='undefined'||!NATAL){chips.innerHTML='';pan.innerHTML=emptyState();return;}
  if(!NX_SEL)NX_SEL=Object.keys(PT_NAME)[0];
  chips.innerHTML=natalChipsHTML();
  try{pan.innerHTML=natalPainelHTML(NX_SEL)+natalEixoHTML();}
  catch(e){console.error('natal painel',e);pan.innerHTML='<p class="note">não foi possível montar a leitura.</p>';}
}
function bindNatal(){
  const w=$('p-natal'); if(!w)return;
  w.addEventListener('click',e=>{
    const c=e.target.closest&&e.target.closest('[data-nx]');
    if(c){NX_SEL=c.dataset.nx;NX_DET=null;renderNatalTab();
      const p=$('nx-panel'); if(p&&document.body.classList.contains('is-mobile'))
        p.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;}
    const d=e.target.closest&&e.target.closest('[data-nxdet]');
    if(d){NX_DET=(NX_DET===d.dataset.nxdet)?null:d.dataset.nxdet;renderNatalTab();return;}
  });
}
