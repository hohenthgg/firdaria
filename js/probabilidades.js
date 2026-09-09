/* ============================================================
   PROBABILIDADES.JS — motor diário de ATIVAÇÃO SIMBÓLICA.

   Funções puras, sem DOM. A renderização vive em prob-ui.js.

   O nome da aba é “Probabilidades”, mas o que se calcula NÃO é chance
   estatística de acontecimento. São três grandezas distintas, que a
   interface nunca funde:

     índice de ativação  0–100 · quanta convergência simbólica há
     qualidade           facilitada · mista · pressionada
     confiança           baixa · moderada · alta · muito alta,
                         pelo número de técnicas INDEPENDENTES

   O que este módulo se recusa a fazer:
     · confundir intensidade com benefício;
     · ler aspecto harmônico como acontecimento bom, ou tenso como
       fracasso;
     · ler planeta forte como tema desejável;
     · contar repetição textual como confirmação independente — é para
       isso que existe originId;
     · trocar regência por ocupação;
     · deixar o termo pesar mais que domicílio, exaltação ou um senhor
       do tempo.

   Nenhum cálculo próprio de técnica: firdária, profecção, revolução,
   dignidade, condição, contato e janela vêm das funções que já
   existem — firdAt, profAt, tempoState, revolutionFor, dignityOf,
   condicaoDe, ruledHouses, hitsDeLongitudes e transitoJanela.
   ============================================================ */

const PROB_AVISO=
  'Índices simbólicos de ativação, não probabilidades estatísticas nem '
  +'garantia de acontecimentos.';

/* ---------- os pesos, documentados ----------
   A hierarquia é a das camadas: as lentas dão CONTEXTO, o trânsito é o
   GATILHO. Uma camada lenta não produz pico sozinha — ela só amplia um
   trânsito que toque o mesmo planeta, casa ou assunto. */
const PROB_PESOS={
  promessaNatal:      3.0,   // promessa natal repetida pelo contato
  firdariaMaior:      3.0,   // senhor da firdária envolvido
  subfirdaria:        2.0,
  senhorDoAno:        3.0,   // profecção: senhor do ano ou casa profectada
  casaProfectada:     2.0,
  revolucaoSolar:     2.0,   // angularidade ou eco de aspecto na RS
  revolucaoOutra:     1.0,   // retorno adicional, quando ligado pelo utilizador
  contatoVital:       2.0,   // Sol, Lua, Ascendente ou MC
  contatoComum:       1.0,
  exatoNoDia:         3.0,   // o aspecto perfaz dentro do dia local
  orbeApertado:       2.0,   // ≤1°
  orbeProximo:        1.0,   // ≤3°
  termoAdministrador: 1.0,   // CONFIRMAÇÃO MENOR — nunca acima das demais
  documentacao:
    'Cada testemunho entra uma única vez, identificado por originId. As '
    +'camadas lentas (firdária, subfirdária, profecção) só somam quando o '
    +'trânsito do dia toca o mesmo planeta ou a mesma casa — não geram pico '
    +'por si, porque permanecem ativas durante meses ou anos. O peso do termo '
    +'é o menor de todos, por construção: é dignidade menor e confirmação '
    +'menor.'
};
/* invariante conferido em teste: o termo nunca pesa mais que as demais */
const PROB_TETO_TERMO=Math.min(
  PROB_PESOS.senhorDoAno, PROB_PESOS.firdariaMaior,
  PROB_PESOS.revolucaoSolar, PROB_PESOS.exatoNoDia, PROB_PESOS.promessaNatal);

/* ---------- os doze temas ----------
   A fonte primária continua sendo as doze casas natais. Os rótulos são
   agrupamentos de leitura; a casa de origem nunca é apagada. */
const PROB_TEMAS=[
  {casa:1,  rotulo:'Identidade e corpo'},
  {casa:2,  rotulo:'Dinheiro e recursos'},
  {casa:3,  rotulo:'Comunicação e estudos'},
  {casa:4,  rotulo:'Casa e família'},
  {casa:5,  rotulo:'Criatividade e prazer'},
  {casa:6,  rotulo:'Saúde e rotina'},
  {casa:7,  rotulo:'Relacionamentos'},
  {casa:8,  rotulo:'Crises e recursos compartilhados'},
  {casa:9,  rotulo:'Estudos superiores e doutrina'},
  {casa:10, rotulo:'Carreira e reputação'},
  {casa:11, rotulo:'Amizades e projetos'},
  {casa:12, rotulo:'Recolhimento e bastidores'}
];
const probTema=h=>PROB_TEMAS.find(t=>t.casa===h)||null;

/* ---------- cadência de amostragem ----------
   Passos por corpo: a Lua precisa de resolução fina para que um aspecto
   exato às 03h não desapareça numa amostragem de meio-dia. */
const PROB_PASSO_MIN={Moon:10, Mercury:60, Venus:90, Sun:90,
                      Mars:180, Jupiter:360, Saturn:360};
const PROB_PASSO_PANORAMA={Moon:30, Mercury:180, Venus:240, Sun:240,
                           Mars:360, Jupiter:720, Saturn:720};

/* ---------- cache por dia, mapa e configuração ---------- */
let _probCache={};
function probChaveConfig(opts){
  const o=opts||{};
  const mapa=(typeof NATAL!=='undefined'&&NATAL&&typeof BIRTH==='number')
    ? BIRTH+'@'+Math.round(n360(NATAL.asc)*100) : 'sem-mapa';
  return [mapa,
    (typeof termosSistemaAtual==='function')?termosSistemaAtual():'—',
    (typeof fusoDoMapa==='function')?(fusoDoMapa()||'sem-fuso'):'—',
    (o.retornos||[]).slice().sort().join('+')||'so-solar',
    o.panorama?'panorama':'detalhe'].join('|');
}
function probInvalidar(){ _probCache={}; }

/* ============================================================
   1 · EVENTOS DE TRÂNSITO DO DIA
   Varre o dia local inteiro, de 00h00 a 23h59, e não apenas o
   meio-dia. Devolve, por contato: menor orbe do dia e o seu horário,
   se aplica ou separa, exatidões dentro do dia, e ingresso em novo
   termo. Múltiplas passagens por retrogradação são preservadas.
   ============================================================ */
function dailyTransitEvents(localDate, timezone, opts){
  if(typeof NATAL==='undefined'||!NATAL)return [];
  const o=opts||{};
  const tz=timezone||((typeof fusoDoMapa==='function')?fusoDoMapa():null);
  const {ini,fim}=limitesDoDiaLocal(localDate, tz);
  const passos=o.panorama?PROB_PASSO_PANORAMA:PROB_PASSO_MIN;
  if(typeof refreshNPTS==='function'&&(!NPTS||!NPTS.length))refreshNPTS();

  /* amostragem por corpo: cada um com o seu passo */
  const serie={};
  TB.forEach(([bn,key])=>{
    const passo=(passos[bn]||120)*60000;
    const pts=[];
    for(let t=ini; t<=fim; t+=passo) pts.push({t, lon:tlon(bn,new Date(t))});
    if(pts[pts.length-1].t<fim)pts.push({t:fim, lon:tlon(bn,new Date(fim))});
    serie[key]={bn, passo, pts};
  });

  /* para cada instante amostrado, os contatos vêm da MESMA regra que
     transitHits usa — hitsDeLongitudes, em core.js */
  const porContato={};
  const instantes=[...new Set(Object.values(serie).flatMap(s=>s.pts.map(p=>p.t)))]
    .sort((a,b)=>a-b);
  instantes.forEach(t=>{
    const lons={};
    Object.entries(serie).forEach(([key,s])=>{
      /* longitude do corpo nesse instante: a amostra exata quando existe,
         senão calculada — nunca interpolada, para não inventar posição */
      const achou=s.pts.find(p=>p.t===t);
      lons[key]=achou?achou.lon:tlon(s.bn,new Date(t));
    });
    hitsDeLongitudes(lons).forEach(h=>{
      const id=h.tKey+'|'+h.nk+'|'+h.ang;
      const reg=porContato[id]||(porContato[id]={hit:h, minOrb:Infinity, minT:t,
        primeiro:t, ultimo:t, orbIni:h.orb, orbFim:h.orb});
      if(h.orb<reg.minOrb){reg.minOrb=h.orb; reg.minT=t; reg.hit=h;}
      reg.ultimo=t; reg.orbFim=h.orb;
    });
  });

  /* enriquecimento de cada contato */
  return Object.entries(porContato).map(([id,reg])=>{
    const h=reg.hit;
    const bn=h.tn;
    /* aplicando ou separando: comparação do desvio pouco antes e pouco
       depois do menor orbe do dia */
    const dv=t=>Math.abs(adiff(tlon(bn,new Date(t)), h.np.lon)-h.ang);
    const passo=(passos[bn]||120)*60000;
    const antes=dv(reg.minT-passo), depois=dv(reg.minT+passo);
    const applying = depois<antes;
    /* exatidões dentro do dia — vêm de transitoJanela, o mesmo motor que
       a tela Hoje usa. Nada de uma segunda busca de exatidão. */
    let janela=null, exatosNoDia=[];
    try{
      janela=transitoJanela(bn, h.np.lon, h.ang, h.orbMax||orbeDe(h.ang),
                            new Date(reg.minT), 400);
      if(janela)exatosNoDia=janela.exatos.filter(t=>t>=ini&&t<fim);
    }catch(e){ janela=null; }
    /* ingresso em novo termo dentro do dia */
    const termoIni=(typeof termSegment==='function')?termSegment(tlon(bn,new Date(ini))):null;
    const termoFim=(typeof termSegment==='function')?termSegment(tlon(bn,new Date(fim-1))):null;
    const trocouTermo=!!(termoIni&&termoFim&&
      (termoIni.lord!==termoFim.lord||termoIni.sign!==termoFim.sign));
    return {
      id, originId:id,
      source:'transito',
      transitant:h.tKey, transitantNome:PT_NAME[h.tKey], tn:bn,
      target:h.nk, targetNome:h.np.nm, targetHouse:h.np.h,
      aspect:h.ang, aspectGl:h.gl, aspectCls:h.cls,
      orb:+reg.minOrb.toFixed(3), orbMax:h.orbMax||orbeDe(h.ang),
      applying,
      peakAt:reg.minT,
      exactAt:exatosNoDia.length?exatosNoDia[0]:null,
      exatosNoDia,
      perfaz:exatosNoDia.length>0,
      janela: janela?{entrada:janela.entrada, saida:janela.saida,
        exatos:janela.exatos, repetido:janela.repetido,
        nota:janela.nota, duracaoDias:janela.duracaoDias}:null,
      termoIni, termoFim, trocouTermo,
      dia:localDate
    };
  }).sort((a,b)=>a.orb-b.orb);
}

/* ============================================================
   2 · ADMINISTRAÇÃO PELO TERMO
   O senhor do termo está sempre ligado ao PLANETA e ao GRAU. Não existe
   “regente universal do dia”.
   ============================================================ */
function termAdministration(event, temporalState){
  if(!event||!event.termoIni)return null;
  const seg=event.termoIni;
  const adm=seg.lord;
  const S=temporalState;
  const coincide=[];
  if(S){
    if(S.mk===adm)coincide.push({tipo:'firdária', texto:'é também o senhor da firdária maior'});
    if(S.sk===adm)coincide.push({tipo:'subfirdária', texto:'é também o senhor da subfirdária'});
    if(S.lord===adm)coincide.push({tipo:'senhor do ano', texto:'é também o Senhor do Ano'});
  }
  const p=(typeof NATAL!=='undefined'&&NATAL)?NATAL.pts[adm]:null;
  let cond=null;
  try{ if(typeof condicaoDe==='function'&&typeof ctxNatal==='function')
    cond=condicaoDe(adm, ctxNatal()); }catch(e){ cond=null; }
  let angularRS=false;
  try{
    const y=rsYearOf(new Date(event.peakAt||Date.now()));
    angularRS=(RSMETA.angular[y]||[]).includes(adm);
  }catch(e){}
  return {
    administrador:adm, nome:PT_NAME[adm],
    sistema:seg.system,
    sistemaNome:(typeof TERM_SYSTEMS!=='undefined'&&TERM_SYSTEMS[seg.system])
      ?TERM_SYSTEMS[seg.system].nome:seg.system,
    signo:seg.nome, inicio:seg.start, fim:seg.end,
    grau:+seg.degreeWithinSign.toFixed(2),
    condicaoNatal:p?p.dig:null,
    condicao:cond?(cond.resumo||cond.texto||null):null,
    casasAdministradas:(typeof ruledHouses==='function')?ruledHouses(adm):[],
    casaNatal:p?p.h:null,
    angularNaRS:angularRS,
    coincidencias:coincide,
    ingresso:event.trocouTermo?{de:event.termoIni.lord, para:event.termoFim.lord,
      nota:'mudança de administração, e não acontecimento garantido'}:null,
    frase:PT_NAME[event.transitant]+' transita o termo de '+PT_NAME[adm]
      +' em '+(seg.nome||'—'),
    nota:(typeof TERMO_NOTA_MENOR!=='undefined')?TERMO_NOTA_MENOR:null
  };
}

/* ============================================================
   3 · TESTEMUNHOS DE UM EVENTO
   Cada testemunho traz originId. O mesmo fato não pode entrar duas
   vezes só porque aparece em scoreHit, em revReinforces e numa frase.
   ============================================================ */
function themeEvidence(event, temporalState, opts){
  const S=temporalState;
  const o=opts||{};
  const ev=[];
  const alvo=event.target, trans=event.transitant;
  const vital=['sun','moon','asc','mc'].indexOf(alvo)>=0;
  const cls=event.aspectCls;
  const polaridade = cls==='harm'?'facilitada' : cls==='tens'?'pressionada' : 'mista';

  /* casas envolvidas, com a ORIGEM de cada uma — regência e ocupação
     nunca se trocam */
  const casas=[];
  const põeCasa=(h,origem,detalhe)=>{ if(h>=1&&h<=12)casas.push({casa:h,origem,detalhe}); };
  if(event.targetHouse)põeCasa(event.targetHouse,'ocupação',
    PT_NAME[alvo]||event.targetNome+' ocupa esta casa no natal');
  if(typeof ruledHouses==='function'&&PT_NAME[alvo])
    ruledHouses(alvo).forEach(h=>põeCasa(h,'regência do alvo',
      PT_NAME[alvo]+' administra esta casa'));
  if(typeof ruledHouses==='function'&&PT_NAME[trans])
    ruledHouses(trans).forEach(h=>põeCasa(h,'regência do transitante',
      PT_NAME[trans]+' administra esta casa e traz o seu assunto ao contato'));

  const add=(id,peso,texto,extra)=>{
    ev.push(Object.assign({
      id, originId:id, source:extra&&extra.source||'transito',
      transitant:trans, target:alvo, aspect:event.aspect,
      orb:event.orb, orbMax:event.orbMax, applying:event.applying,
      exactAt:event.exactAt, houses:casas.map(c=>c.casa),
      termAdministrator:null,
      weight:peso, polarity:polaridade, explanation:texto
    }, extra||{}));
  };

  /* — o contato em si — */
  add('contato:'+event.originId,
    vital?PROB_PESOS.contatoVital:PROB_PESOS.contatoComum,
    PT_NAME[trans]+' '+event.aspectGl+' '+event.targetNome
    +(vital?' — ponto vital do mapa':''),
    {source:'transito'});

  /* — proximidade e exatidão — */
  if(event.perfaz)
    add('exato:'+event.originId, PROB_PESOS.exatoNoDia,
      'o aspecto fica exato dentro do dia', {source:'transito'});
  else if(event.orb<=1)
    add('orbe1:'+event.originId, PROB_PESOS.orbeApertado,
      'orbe abaixo de 1° ('+event.orb.toFixed(2)+'°)', {source:'transito'});
  else if(event.orb<=3)
    add('orbe3:'+event.originId, PROB_PESOS.orbeProximo,
      'orbe apertado ('+event.orb.toFixed(2)+'°)', {source:'transito'});

  /* — camadas lentas: só somam se TOCAREM este contato — */
  if(S){
    if(S.mk&&(trans===S.mk||alvo===S.mk))
      add('fird:'+S.mk+':'+event.originId, PROB_PESOS.firdariaMaior,
        'envolve o senhor da firdária maior ('+PT_NAME[S.mk]+')',
        {source:'firdaria'});
    if(S.sk&&(trans===S.sk||alvo===S.sk))
      add('sub:'+S.sk+':'+event.originId, PROB_PESOS.subfirdaria,
        'envolve o senhor da subfirdária ('+PT_NAME[S.sk]+')',
        {source:'subfirdaria'});
    if(S.lord&&(trans===S.lord||alvo===S.lord))
      add('ano:'+S.lord+':'+event.originId, PROB_PESOS.senhorDoAno,
        'envolve o Senhor do Ano ('+PT_NAME[S.lord]+')', {source:'profeccao'});
    if(S.profHouse&&casas.some(c=>c.casa===S.profHouse))
      add('casaprof:'+S.profHouse+':'+event.originId, PROB_PESOS.casaProfectada,
        'toca a casa profectada do ano ('+S.profHouse+'ª)', {source:'profeccao'});
    /* Revolução Solar vigente */
    try{
      const y=rsYearOf(new Date(event.peakAt||Date.now()));
      if((RSMETA.angular[y]||[]).includes(trans))
        add('rsang:'+trans+':'+y+':'+event.originId, PROB_PESOS.revolucaoSolar,
          PT_NAME[trans]+' está angular na Revolução Solar de '+y, {source:'revolucao-solar'});
      if((RSMETA.echo[y]||[]).some(([a,b,ang])=>
          ((trans===a&&alvo===b)||(trans===b&&alvo===a))&&event.aspect===ang))
        add('rseco:'+y+':'+event.originId, PROB_PESOS.revolucaoSolar,
          'o mesmo aspecto consta da Revolução Solar de '+y, {source:'revolucao-solar'});
    }catch(e){}
  }
  /* — promessa natal repetida — */
  try{
    if(typeof PROMESSAS!=='undefined'&&PROMESSAS.length){
      const pr=PROMESSAS.filter(x=>x.pl===alvo||x.pl===trans);
      if(pr.length)
        add('promessa:'+(pr[0].pl)+':'+event.originId, PROB_PESOS.promessaNatal,
          'repete uma promessa natal de '+PT_NAME[pr[0].pl],
          {source:'promessa-natal'});
    }
  }catch(e){}
  /* — administração pelo termo: confirmação MENOR — */
  const adm=termAdministration(event,S);
  if(adm){
    let peso=PROB_PESOS.termoAdministrador;
    if(peso>PROB_TETO_TERMO)peso=PROB_TETO_TERMO;   // invariante
    add('termo:'+adm.administrador+':'+event.originId, peso,
      adm.frase+(adm.coincidencias.length
        ? ' — e '+adm.coincidencias.map(c=>c.texto).join(', ')+' (confirmação menor)'
        : ''),
      {source:'termo', termAdministrator:adm.administrador});
    ev.forEach(x=>{ if(x.termAdministrator==null)x.termAdministrator=adm.administrador; });
  }
  /* — retornos adicionais, quando o utilizador os liga — */
  (o.retornos||[]).forEach(kind=>{
    if(kind==='solar')return;               // a RS já é a camada padrão
    try{
      const R=revolutionFor(kind, new Date(event.peakAt||Date.now()));
      if(!R)return;
      const ang=R.chart&&R.chart.pts[trans]?R.houseOfRev(R.chart.pts[trans].lon):null;
      if(ang&&[1,4,7,10].indexOf(ang)>=0)
        add('rev:'+kind+':'+trans+':'+event.originId, PROB_PESOS.revolucaoOutra,
          PT_NAME[trans]+' está angular na Revolução '+(R.label||kind),
          {source:'revolucao-'+kind});
    }catch(e){}
  });
  return {evidencias:ev, casas, adm, polaridade};
}

/* ============================================================
   4 · AGREGAÇÃO POR TEMA
   ============================================================ */
function aggregateThemes(pacotes){
  const temas={};
  const vistos=new Set();
  PROB_TEMAS.forEach(t=>{temas[t.casa]={casa:t.casa, rotulo:t.rotulo,
    bruto:0, pesos:[], facilita:0, pressiona:0, mista:0,
    testemunhos:[], fontes:new Set(), eventos:new Set()};});
  pacotes.forEach(P=>{
    const casasUnicas=[...new Set(P.casas.map(c=>c.casa))];
    P.evidencias.forEach(t=>{
      /* DEDUPLICAÇÃO: um originId conta uma única vez em todo o dia */
      if(vistos.has(t.originId))return;
      vistos.add(t.originId);
      casasUnicas.forEach(h=>{
        const T=temas[h]; if(!T)return;
        T.pesos.push(t.weight);
        if(t.polarity==='facilitada')T.facilita+=t.weight;
        else if(t.polarity==='pressionada')T.pressiona+=t.weight;
        else T.mista+=t.weight;
        T.testemunhos.push(Object.assign({},t,{
          casaOrigem:(P.casas.find(c=>c.casa===h)||{}).origem||null}));
        T.fontes.add(t.source);
        T.eventos.add(t.originId.split(':').pop());
      });
    });
  });
  return Object.values(temas).map(T=>Object.assign(T,{
    fontes:[...T.fontes], eventos:[...T.eventos],
    bruto:+probSomaDecrescente(T.pesos).toFixed(3),
    brutoIngenuo:+T.pesos.reduce((a,b)=>a+b,0).toFixed(2),
    indice:activationIndex(probSomaDecrescente(T.pesos)),
    qualidade:qualityBalance(T.testemunhos),
    confianca:confidenceTier(T.testemunhos)
  })).sort((a,b)=>b.bruto-a.bruto);
}

/* ============================================================
   5 · ÍNDICE, QUALIDADE E CONFIANÇA — três grandezas distintas
   ============================================================ */
/* Função FIXA e monotônica: o mesmo bruto dá o mesmo índice, quer o
   utilizador esteja a ver 1 dia, 7 ou 90. Nada é normalizado contra o
   máximo do intervalo, justamente para o número não mudar de sentido
   quando se troca o período. */
const PROB_ESCALA=9;
/* ---------- soma com retorno decrescente ----------
   Somar todos os testemunhos em pé de igualdade premia a DISPERSÃO: um
   tema tocado por muitos contatos fracos empatava com um tema de
   convergência real, e o índice saturava em 100 para quase tudo. Os
   testemunhos entram por ordem de peso, com fatores decrescentes: o
   primeiro conta inteiro, o segundo 70%, o terceiro 50%, e daí em
   diante cada vez menos. Assim o índice mede CONCENTRAÇÃO de apoio, e
   não quantidade de linhas. */
const PROB_DECAI=[1, 0.7, 0.5, 0.35, 0.25, 0.18];
const PROB_DECAI_CAUDA=0.12;
function probSomaDecrescente(pesos){
  return (pesos||[]).slice().sort((a,b)=>b-a)
    .reduce((acc,w,i)=>acc + w*(PROB_DECAI[i]!=null?PROB_DECAI[i]:PROB_DECAI_CAUDA), 0);
}
function activationIndex(rawScore){
  const r=Math.max(0, +rawScore||0);
  return Math.round(100*(1-Math.exp(-r/PROB_ESCALA)));
}
activationIndex.formula='bruto = soma dos testemunhos com retorno decrescente '
  +'(1 · 0,7 · 0,5 · 0,35 · 0,25 · 0,18 · 0,12…) · índice = 100 · (1 − e^(−bruto/'
  +PROB_ESCALA+'))';
activationIndex.nota='Saturante e monotônica, com constantes fixas: o mesmo bruto '
  +'dá o mesmo índice quer se veja 1 dia, 7 ou 90. Nada é normalizado contra o '
  +'máximo da amostra, justamente para o número não mudar de sentido ao trocar o '
  +'período.';

function qualityBalance(testemunhos){
  let fac=0, pre=0, mis=0;
  (testemunhos||[]).forEach(t=>{
    if(t.polarity==='facilitada')fac+=t.weight;
    else if(t.polarity==='pressionada')pre+=t.weight;
    else mis+=t.weight;
  });
  const tot=fac+pre+mis;
  if(!tot)return {rotulo:'sem dados', facilita:0, pressiona:0, mista:0,
    nota:'Nenhum testemunho para qualificar.'};
  const df=fac/tot, dp=pre/tot;
  /* domina quando reúne pelo menos 60% do peso E o dobro do lado oposto.
     O limiar anterior (oposto ≤20%) classificava 3:1 como “mista”, o que
     apagava uma diferença que existe. */
  let rotulo='mista';
  if(df>=0.6&&df>=2*dp)rotulo='facilitada';
  else if(dp>=0.6&&dp>=2*df)rotulo='pressionada';
  return {rotulo,
    facilita:+(df*100).toFixed(0), pressiona:+(dp*100).toFixed(0),
    mista:+((mis/tot)*100).toFixed(0),
    nota:'Qualidade é a FORMA da manifestação, não o seu valor: facilitada não '
      +'significa boa, nem pressionada significa fracasso. Intensidade e '
      +'benefício são coisas diferentes.'};
}

/* Confiança = número de técnicas realmente INDEPENDENTES que convergem.
   Repetir o mesmo testemunho com outra redação não aumenta nada: as
   fontes são contadas por família, não por linha de texto. */
const PROB_FAMILIAS={
  'transito':'trânsito', 'firdaria':'firdária', 'subfirdaria':'subfirdária',
  'profeccao':'profecção', 'revolucao-solar':'revolução solar',
  'promessa-natal':'promessa natal', 'termo':'termo'
};
function confidenceTier(testemunhos){
  const fam=new Set();
  (testemunhos||[]).forEach(t=>{
    const f=t.source&&t.source.indexOf('revolucao-')===0&&t.source!=='revolucao-solar'
      ? 'revolucao-outra' : t.source;
    if(f)fam.add(f);
  });
  /* o termo é confirmação MENOR: não conta como técnica independente
     para efeito de confiança */
  fam.delete('termo');
  const n=fam.size;
  const rotulo = n>=4?'muito alta' : n===3?'alta' : n===2?'moderada' : 'baixa';
  return {rotulo, tecnicas:n, familias:[...fam].map(f=>PROB_FAMILIAS[f]||f),
    nota: n<=1
      ? 'Apenas o trânsito sustenta esta leitura.'
      : n===2 ? 'Trânsito e mais uma camada temporal.'
      : n===3 ? 'Três camadas coerentes e independentes.'
      : 'Convergência rara entre natal, camadas temporais e trânsito.',
    aviso:'O termo não conta como técnica independente: é confirmação menor.'};
}

/* ============================================================
   6 · O DIA COMPLETO
   ============================================================ */
function dailyActivation(localDate, options){
  const o=options||{};
  const chave=localDate+'#'+probChaveConfig(o);
  if(_probCache[chave]&&!o.recalcular)return _probCache[chave];
  const tz=(typeof fusoDoMapa==='function')?fusoDoMapa():null;
  const vazio={data:localDate, semMapa:true, aviso:PROB_AVISO,
    temas:[], eventos:[], termos:[], indice:0,
    qualidade:qualityBalance([]), confianca:confidenceTier([])};
  if(typeof NATAL==='undefined'||!NATAL)return (_probCache[chave]=vazio);

  const meio=limitesDoDiaLocal(localDate,tz);
  const instanteRef=new Date(meio.ini+(meio.fim-meio.ini)/2);
  const S=(typeof tempoState==='function')?tempoState(instanteRef):null;
  const eventos=dailyTransitEvents(localDate, tz, o);
  const pacotes=eventos.map(e=>Object.assign({evento:e}, themeEvidence(e,S,o)));
  const temas=aggregateThemes(pacotes);

  /* índice do dia: o do tema mais ativado, não a soma de tudo — somar
     todos os temas faria um dia disperso parecer mais intenso que um
     dia concentrado */
  const topo=temas[0]||null;
  const todosTestemunhos=[];
  const vistos=new Set();
  pacotes.forEach(P=>P.evidencias.forEach(t=>{
    if(vistos.has(t.originId))return; vistos.add(t.originId);
    todosTestemunhos.push(t);
  }));

  /* administrador de termo mais reiterado — com os seus eventos à vista */
  const porAdm={};
  pacotes.forEach(P=>{ if(P.adm){
    (porAdm[P.adm.administrador]=porAdm[P.adm.administrador]||{
      administrador:P.adm.administrador, nome:P.adm.nome, adm:P.adm, eventos:[]})
      .eventos.push(P.evento);
  }});
  const admins=Object.values(porAdm).sort((a,b)=>b.eventos.length-a.eventos.length);

  /* pico: o horário da exatidão mais relevante, ou o menor orbe do dia */
  const comExato=eventos.filter(e=>e.perfaz);
  const pico=comExato.length
    ? comExato.sort((a,b)=>a.orb-b.orb)[0]
    : (eventos[0]||null);

  const R={
    data:localDate, tz, aviso:PROB_AVISO, semMapa:false,
    janelaUTC:meio,
    estado:S,
    temas, eventos, pacotes,
    indice: topo?topo.indice:0,
    bruto: topo?+topo.bruto.toFixed(2):0,
    qualidade: qualityBalance(todosTestemunhos),
    confianca: confidenceTier(todosTestemunhos),
    temaDominante: topo||null,
    temaSegundo: temas[1]||null,
    administradores: admins,
    administradorReiterado: admins[0]||null,
    pico: pico?{evento:pico,
      quando: pico.exactAt||pico.peakAt,
      exato: !!pico.perfaz,
      hora: horaLocal(pico.exactAt||pico.peakAt, tz)}:null,
    formulaIndice: activationIndex.formula,
    notaIndice: activationIndex.nota,
    pesos: PROB_PESOS,
    sistemaTermos:(typeof termosEstado==='function')?termosEstado():null,
    fuso:(typeof fusoEstado==='function')?fusoEstado():null
  };
  _probCache[chave]=R;
  return R;
}

/* ---------- série de vários dias, para gráfico e mapa de calor ---------- */
function probSerie(dataInicial, nDias, options){
  const o=Object.assign({panorama:nDias>7}, options||{});
  const out=[];
  for(let i=0;i<nDias;i++){
    const d=somaDias(dataInicial,i);
    out.push(dailyActivation(d,o));
  }
  return out;
}
/* ---------- faixa de termos: onde cada transitante está agora ---------- */
function probLinhaDosTermos(localDate, options){
  const tz=(typeof fusoDoMapa==='function')?fusoDoMapa():null;
  const {ini,fim}=limitesDoDiaLocal(localDate,tz);
  const S=(typeof tempoState==='function')?tempoState(new Date(ini)):null;
  return TB.map(([bn,key])=>{
    const L=tlon(bn,new Date(ini));
    const seg=(typeof termSegment==='function')?termSegment(L):null;
    if(!seg)return null;
    /* quando muda de administração: procura o instante em que a longitude
       cruza o fim do termo, dentro dos próximos 120 dias */
    let troca=null;
    try{
      const alvoLon=n360(seg.sign*30+seg.end);
      const passo=(PROB_PASSO_PANORAMA[bn]||240)*60000;
      let ant=L, antT=ini;
      for(let t=ini+passo; t<ini+120*DAY; t+=passo){
        const cur=tlon(bn,new Date(t));
        const cruzou=wrap180(cur-alvoLon)>=0 && wrap180(ant-alvoLon)<0;
        if(cruzou){
          let a=antT,b=t;
          for(let i=0;i<40;i++){const m=(a+b)/2;
            if(wrap180(tlon(bn,new Date(m))-alvoLon)<0)a=m; else b=m;}
          troca=(a+b)/2; break;
        }
        ant=cur; antT=t;
      }
    }catch(e){}
    const coincide=[];
    if(S){
      if(S.mk===seg.lord)coincide.push('firdária');
      if(S.sk===seg.lord)coincide.push('subfirdária');
      if(S.lord===seg.lord)coincide.push('Senhor do Ano');
    }
    return {planeta:key, nome:PT_NAME[key], glifo:PT_GLYPH[key],
      lon:L, signo:seg.nome, inicio:seg.start, fim:seg.end,
      senhor:seg.lord, senhorNome:PT_NAME[seg.lord],
      sistema:seg.system, grau:+seg.degreeWithinSign.toFixed(2),
      proximaTroca:troca, proximaTrocaHora:troca?horaLocal(troca,tz):null,
      coincidencias:coincide};
  }).filter(Boolean);
}
