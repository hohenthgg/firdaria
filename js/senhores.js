/* ============================================================
   SENHORES.JS — os senhores do mapa, cada um com método declarado.

   Três coisas distintas, que o app nunca mistura:

     1 · OIKODESPOTES — o Mestre da Natividade. Determinado em dois
         tempos: primeiro o PREDOMINADOR (o lugar que rege a vida),
         depois o REGENTE DOMICILIAR desse lugar.
     2 · DAIMON — o regente domiciliar do Lote do Espírito. É o eixo da
         iniciativa e da intenção. O lote é um PONTO; o daimon é um
         PLANETA. Nunca se confundem aqui.
     3 · SENHOR DA GENITURA — a função que já existia no app, por soma
         de força essencial e acidental. É um almuten de força, coisa
         diferente das duas acima. Fica preservada e nomeada como tal.

   Sobre as fontes: a página do The Astrology Podcast indicada como
   ponto de partida NÃO pôde ser consultada deste ambiente (o proxy de
   rede bloqueia o domínio), de modo que a sua formulação específica não
   foi verificada. O que está implementado abaixo é o procedimento
   ptolomaico-porfiriano tal como as fontes primárias o expõem —
   Ptolomeu, Tetrabiblos III.13 (“Do Senhor da Natividade”) e Porfírio,
   Introdução ao Tetrabiblos, cap. 30 —, com cada regra escrita por
   extenso em REGRAS_OIKO para poder ser conferida e corrigida.
   Nenhuma página ou citação é inventada.
   ============================================================ */

const OIKO_FONTE={
  id:'ptolomeu-porfirio',
  metodo:'predominador → regente domiciliar',
  obras:[
    {autor:'Cláudio Ptolomeu', obra:'Tetrabiblos', loc:'livro III, cap. 13 — Do Senhor da Natividade'},
    {autor:'Porfírio de Tiro', obra:'Introdução ao Tetrabiblos', loc:'cap. 30 — do predominador e do oikodespotes'}
  ],
  naoVerificado:'A página do The Astrology Podcast indicada como referência inicial não '
    +'pôde ser aberta deste ambiente (bloqueio do proxy de rede). A sua formulação '
    +'específica não foi conferida; o que está implementado segue as fontes primárias '
    +'acima, com as regras declaradas uma a uma.',
  casas:'lugares por signos inteiros a partir do Ascendente — não Placidus. '
    +'A elegibilidade aphética é de tradição helenística e conta lugares, não cúspides de quadrante.',
  termos:'tábua egípcia de termos (TERMS, em tables.js)'
};
const REGRAS_OIKO=[
  'O predominador é escolhido entre três candidatos, nesta ordem de precedência: '
    +'de dia o Sol, depois a Lua, depois o Ascendente; de noite a Lua, depois o Sol, depois o Ascendente.',
  'Um luminar só é elegível se estiver em lugar aphético — os lugares 1, 7, 9, 10 e 11 '
    +'contados por signos inteiros a partir do Ascendente. Não sendo elegível, passa-se ao candidato seguinte.',
  'O Ascendente é sempre elegível e serve de último recurso, por ser ele próprio um lugar aphético.',
  'O Oikodespotes é o REGENTE DOMICILIAR do signo em que cai o predominador.',
  'O regente do termo do grau do predominador é registrado como corregente, pela tábua egípcia.',
  'A condição do Oikodespotes é relatada, não usada para trocá-lo: aversão ao predominador, '
    +'combustão e cadência são declaradas como ressalvas explícitas.'
];
/* lugares aphéticos, por signos inteiros a partir do Ascendente */
const LUGARES_APHETICOS=[1,7,9,10,11];

function lugarInteiro(lon){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  return ((signOf(lon)-signOf(NATAL.asc)+12)%12)+1;
}
/* ---------- 1 · predominador ---------- */
function predominador(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const diurno=NATAL.sect==='diurno';
  const cand=diurno
    ? [['sun','Sol'],['moon','Lua'],['asc','Ascendente']]
    : [['moon','Lua'],['sun','Sol'],['asc','Ascendente']];
  const exame=[];
  for(const [k,nm] of cand){
    if(k==='asc'){
      exame.push({k,nome:nm,lon:NATAL.asc,lugar:1,elegivel:true,
        porque:'o Ascendente é ele próprio lugar aphético'});
      return {escolhido:{k,nome:nm,lon:NATAL.asc,lugar:1}, exame, seita:NATAL.sect};
    }
    const p=NATAL.pts[k];
    if(!p){exame.push({k,nome:nm,elegivel:false,porque:'não consta no mapa'});continue;}
    const lug=lugarInteiro(p.lon);
    const eleg=LUGARES_APHETICOS.indexOf(lug)>=0;
    exame.push({k,nome:nm,lon:p.lon,lugar:lug,elegivel:eleg,
      porque:eleg?('está no lugar '+lug+', aphético')
                 :('está no lugar '+lug+', que não é aphético')});
    if(eleg)return {escolhido:{k,nome:nm,lon:p.lon,lugar:lug}, exame, seita:NATAL.sect};
  }
  return {escolhido:null, exame, seita:NATAL.sect};
}
/* ---------- 2 · oikodespotes ---------- */
function oikodespotes(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const P=predominador();
  if(!P||!P.escolhido)return {erro:'não foi possível determinar o predominador', fonte:OIKO_FONTE, regras:REGRAS_OIKO, exame:P?P.exame:[]};
  const lon=P.escolhido.lon, sg=signOf(lon);
  const k=SIGN_RULER[sg];
  const termo=(typeof termLord==='function')?termLord(lon):null;
  const p=NATAL.pts[k];
  /* ressalvas — declaradas, nunca usadas para trocar o planeta em silêncio */
  const ress=[];
  if(!p)ress.push('o regente não consta entre os pontos calculados');
  else{
    /* aversão: signos que não se aspectam — distância de 1, 5, 7 ou 11
       signos. As distâncias 0, 2, 3, 4, 6, 8, 9 e 10 formam aspecto. */
    const dSig=((signOf(p.lon)-signOf(P.escolhido.lon))+12)%12;
    if([1,5,7,11].indexOf(dSig)>=0)
      ress.push('em aversão ao signo do predominador (distância de '+dSig+' signo'+(dSig===1?'':'s')+', sem aspecto)');
    const lugRegente=lugarInteiro(p.lon);
    if([6,8,12].indexOf(lugRegente)>=0)ress.push('em lugar aflito (lugar '+lugRegente+')');
    const luz=(typeof luzDe==='function')?luzDe(k,p.lon,NATAL.pts.sun?NATAL.pts.sun.lon:null):null;
    if(luz&&luz.tipo!=='cazimi')ress.push(luz.tipo);
  }
  const cond=(typeof condicaoDe==='function'&&typeof ctxNatal==='function')
    ? (()=>{try{return condicaoDe(k,ctxNatal());}catch(e){return null;}})() : null;
  return {
    tipo:'oikodespotes', planeta:k, nome:PT_NAME[k],
    predominador:P.escolhido, exame:P.exame, seita:P.seita,
    signo:sg, signoNm:SIGNS[sg], grau:n360(lon)%30,
    corregenteTermo:termo, corregenteTermoNm:termo?PT_NAME[termo]:null,
    posicao:p?{signo:signOf(p.lon),signoNm:SIGNS[signOf(p.lon)],casa:p.h,dig:p.dig}:null,
    rege:(typeof ruledHouses==='function')?ruledHouses(k):[],
    condicao:cond, ressalvas:ress,
    fonte:OIKO_FONTE, regras:REGRAS_OIKO
  };
}

/* ---------- 3 · Lote do Espírito e o seu regente (Daimon) ---------- */
const ESPIRITO_FONTE={
  metodo:'Lote do Espírito por seita',
  formula:'de dia: Ascendente + Sol − Lua · de noite: Ascendente + Lua − Sol',
  obras:[{autor:'Vétio Valente / tradição helenística', obra:'Antologias',
          loc:'o lote do Espírito e o seu par com a Fortuna'}],
  nota:'“Daimon” é aqui a linguagem do produto para este eixo. O que se calcula '
    +'é o regente domiciliar do Lote do Espírito — identificação que não esgota '
    +'os usos históricos do termo daimon.'
};
function loteEspirito(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const so=NATAL.pts.sun, lu=NATAL.pts.moon;
  if(!so||!lu)return {erro:'faltam Sol ou Lua para calcular o lote'};
  const diurno=NATAL.sect==='diurno';
  const lon=n360(diurno ? (NATAL.asc+so.lon-lu.lon) : (NATAL.asc+lu.lon-so.lon));
  const sg=signOf(lon);
  return {
    lon, signo:sg, signoNm:SIGNS[sg], grau:n360(lon)%30,
    casa:(typeof houseByRule==='function')?houseByRule(lon,NATAL.cusps):null,
    lugarInteiro:lugarInteiro(lon),
    seita:NATAL.sect, seitaOrigem:(NATAL.meta&&NATAL.meta.sectMode&&NATAL.meta.sectMode!=='auto')
      ?'escolha manual':'posição geométrica do Sol em relação ao horizonte',
    regente:SIGN_RULER[sg], fonte:ESPIRITO_FONTE
  };
}
function loteFortuna(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const so=NATAL.pts.sun, lu=NATAL.pts.moon;
  if(!so||!lu)return null;
  const diurno=NATAL.sect==='diurno';
  const lon=n360(diurno ? (NATAL.asc+lu.lon-so.lon) : (NATAL.asc+so.lon-lu.lon));
  const sg=signOf(lon);
  return {lon, signo:sg, signoNm:SIGNS[sg], grau:n360(lon)%30,
    casa:(typeof houseByRule==='function')?houseByRule(lon,NATAL.cusps):null,
    regente:SIGN_RULER[sg]};
}
function daimon(){
  const L=loteEspirito();
  if(!L||L.erro)return {erro:(L&&L.erro)||'lote indisponível', fonte:ESPIRITO_FONTE};
  const k=L.regente, p=NATAL.pts[k];
  const cond=(typeof condicaoDe==='function'&&typeof ctxNatal==='function')
    ? (()=>{try{return condicaoDe(k,ctxNatal());}catch(e){return null;}})() : null;
  const luz=(typeof luzDe==='function'&&p)?luzDe(k,p.lon,NATAL.pts.sun?NATAL.pts.sun.lon:null):null;
  return {
    tipo:'daimon', planeta:k, nome:PT_NAME[k], lote:L, fortuna:loteFortuna(),
    posicao:p?{signo:signOf(p.lon),signoNm:SIGNS[signOf(p.lon)],casa:p.h,
               dig:p.dig,retro:!!p.retro}:null,
    rege:(typeof ruledHouses==='function')?ruledHouses(k):[],
    condicao:cond, luz, fonte:ESPIRITO_FONTE
  };
}

/* ---------- o quadro dos senhores, natais e do tempo ---------- */
function senhoresDoMapa(d){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const O=oikodespotes(), D=daimon();
  const ascRul=NATAL.rulers?NATAL.rulers[1]:null;
  const S=(typeof tempoState==='function')?tempoState(d||new Date()):null;
  const natais=[
    O&&O.planeta?{papel:'oikodespotes', rotulo:'Oikodespotes', sub:'Mestre da Natividade', k:O.planeta, dados:O}:null,
    D&&D.planeta?{papel:'daimon', rotulo:'Daimon', sub:'regente do Lote do Espírito', k:D.planeta, dados:D}:null,
    ascRul?{papel:'ascendente', rotulo:'Regente do Ascendente', sub:'informação complementar', k:ascRul}:null
  ].filter(Boolean);
  const temporais=S?[
    S.mk?{papel:'firdaria', rotulo:'Firdária', sub:'senhor do período', k:S.mk}:null,
    S.sk?{papel:'subfirdaria', rotulo:'Subfirdária', sub:'senhor da fase', k:S.sk}:null,
    S.lord?{papel:'ano', rotulo:'Senhor do Ano', sub:'profecção por signos inteiros', k:S.lord}:null
  ].filter(Boolean):[];
  /* acúmulo de funções: uma identidade repetida NÃO é confirmação independente */
  const cont={};
  natais.concat(temporais).forEach(x=>{(cont[x.k]=cont[x.k]||[]).push(x.rotulo);});
  const acumulos=Object.entries(cont).filter(([,v])=>v.length>1)
    .map(([k,v])=>({k, nome:PT_NAME[k], funcoes:v,
      natais:v.filter(r=>['Oikodespotes','Daimon','Regente do Ascendente'].indexOf(r)>=0),
      temporais:v.filter(r=>['Firdária','Subfirdária','Senhor do Ano'].indexOf(r)>=0)}));
  return {natais, temporais, acumulos, revolucao:S?S.rev:null, estado:S};
}

/* ============================================================
   QUEM CONDUZ O SEU MAPA — apresentação.

   Dois planos, visualmente separados porque são de naturezas
   diferentes: os senhores NATAIS não mudam quando se navega no
   tempo; os senhores DO TEMPO mudam por definição. A faixa
   temporal fica subordinada aos cards natais, e nunca os
   substitui.
   ============================================================ */
const SENHOR_EXPLICA={
  oikodespotes:'Determinado em dois tempos: acha-se primeiro o predominador '
    +'(de dia o Sol, de noite a Lua, e o Ascendente em último recurso, exigindo-se '
    +'lugar aphético dos luminares), e toma-se depois o regente domiciliar do signo '
    +'em que ele cai. Não é o planeta mais forte do mapa nem o regente do Ascendente.',
  daimon:'É o regente domiciliar do Lote do Espírito — não o lote em si. '
    +'O lote é um ponto calculado pela seita; o daimon é o planeta que governa o '
    +'signo desse ponto.',
  ascendente:'O regente do signo que ascende. Entra aqui como informação '
    +'complementar, e não como equivalente do Oikodespotes.',
  genitura:'Almuten de força: soma de dignidade essencial e condição acidental. '
    +'Responde a “qual planeta está mais forte”, pergunta diferente de “qual planeta '
    +'rege a vida”. Fica preservado e nomeado como tal.'
};
function senhorCardHTML(x){
  const g=(typeof PT_GLYPH!=='undefined'&&PT_GLYPH[x.k])?PT_GLYPH[x.k]:'✦';
  const d=x.dados||{};
  const pos=d.posicao
    ? (d.posicao.signoNm+(d.posicao.casa?(' · casa '+d.posicao.casa):'')
       +(d.posicao.dig?(' · '+d.posicao.dig):''))
    : (typeof NATAL!=='undefined'&&NATAL&&NATAL.pts[x.k]
        ? (SIGNS[signOf(NATAL.pts[x.k].lon)]+' · casa '+NATAL.pts[x.k].h) : '—');
  const rege=(d.rege&&d.rege.length)?d.rege
    :((typeof ruledHouses==='function')?ruledHouses(x.k):[]);
  const linhas=[];
  if(x.papel==='oikodespotes'&&d.predominador){
    linhas.push(['Predominador', d.predominador.nome+' — lugar '+d.predominador.lugar
      +(d.signoNm?(', em '+d.signoNm):'')]);
    linhas.push(['Por que este planeta','regente domiciliar de '+d.signoNm
      +', o signo do predominador']);
    if(d.corregenteTermoNm)
      linhas.push(['Corregente por termo', d.corregenteTermoNm+' — tábua egípcia']);
    if(d.ressalvas&&d.ressalvas.length)
      linhas.push(['Ressalvas', d.ressalvas.join(' · ')+' — declaradas, não usadas para trocar o senhor']);
  }
  if(x.papel==='daimon'&&d.lote){
    linhas.push(['Lote do Espírito', d.lote.signoNm+' '+Math.floor(d.lote.grau)+'°'
      +(d.lote.casa?(' · casa '+d.lote.casa):'')]);
    linhas.push(['Fórmula', d.lote.seita==='diurno'
      ? 'mapa diurno: Ascendente + Sol − Lua' : 'mapa noturno: Ascendente + Lua − Sol']);
    linhas.push(['Seita', d.lote.seita+' — por '+d.lote.seitaOrigem]);
    if(d.fortuna)linhas.push(['Par com a Fortuna','Fortuna em '+d.fortuna.signoNm
      +(d.fortuna.casa?(' · casa '+d.fortuna.casa):'')+' — os dois lotes são espelhos em torno do Ascendente']);
  }
  if(rege.length)linhas.push(['Casas que administra', rege.map(h=>h+'ª').join(' · ')]);
  return '<article class="sn-c sn-'+x.papel+'">'
    +'<header><em>'+x.rotulo+'</em><i>'+x.sub+'</i></header>'
    +'<div class="sn-id"><span class="sn-g">'+g+'︎</span>'
      +'<b>'+(PT_NAME[x.k]||'—')+'</b><span class="sn-pos">'+pos+'</span></div>'
    +(linhas.length?('<dl class="sn-d">'+linhas.map(l=>
        '<div><dt>'+l[0]+'</dt><dd>'+l[1]+'</dd></div>').join('')+'</dl>'):'')
    +'<p class="sn-x">'+(SENHOR_EXPLICA[x.papel]||'')+'</p>'
    +'</article>';
}
function senhoresHTML(d){
  const S=senhoresDoMapa(d||new Date());
  if(!S)return '';
  const gen=(typeof lordOfGeniture==='function')?lordOfGeniture():null;
  const cards=S.natais.filter(x=>x.papel!=='ascendente').map(senhorCardHTML).join('');
  const compl=S.natais.filter(x=>x.papel==='ascendente')
    .concat(gen?[{papel:'genitura', rotulo:'Senhor da Genitura', sub:'almuten de força', k:gen}]:[]);
  const complHTML=compl.length
    ? '<ul class="sn-compl">'+compl.map(x=>
        '<li><span class="sn-cg">'+((typeof PT_GLYPH!=='undefined'&&PT_GLYPH[x.k])||'✦')+'︎</span>'
        +'<span><b>'+x.rotulo+'</b> · '+(PT_NAME[x.k]||'—')
        +'<em>'+(SENHOR_EXPLICA[x.papel]||'')+'</em></span></li>').join('')+'</ul>'
    : '';
  const faixa=S.temporais.length
    ? '<div class="sn-tempo"><span class="sn-tk">senhores do tempo · mudam com a data</span>'
      +'<ul>'+S.temporais.map(x=>
        '<li><i>'+((typeof PT_GLYPH!=='undefined'&&PT_GLYPH[x.k])||'✦')+'︎</i>'
        +'<b>'+x.rotulo+'</b><em>'+(PT_NAME[x.k]||'—')+'</em></li>').join('')+'</ul>'
      +'<p>Estes três dependem da data consultada. Os cards acima não: navegar no '
      +'tempo não troca o Oikodespotes nem o Daimon.</p></div>'
    : '';
  /* acúmulo: dizer que se repete, sem contar a repetição como prova nova */
  const ac=S.acumulos.length
    ? '<p class="sn-ac">'+S.acumulos.map(a=>
        '<b>'+a.nome+'</b> acumula '+a.funcoes.join(', ')
        +(a.natais.length&&a.temporais.length
          ? ' — coincidência entre um senhor natal e um senhor do tempo: o mesmo planeta em duas funções, e não duas confirmações independentes.'
          : ' — o mesmo planeta em mais de uma função; conta uma vez.')
      ).join(' ')+'</p>'
    : '<p class="sn-ac">Cada função recai sobre um planeta diferente — nenhum acúmulo a declarar.</p>';
  return '<div class="sn-wrap"><div class="sn-cards">'+cards+'</div>'
    +complHTML+ac+faixa+'</div>';
}
