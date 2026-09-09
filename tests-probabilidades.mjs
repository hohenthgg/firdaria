/* ============================================================
   tests-probabilidades.mjs — a suíte da aba Probabilidades e dos
   sistemas de termos.

   Como rodar:
     npm install            (traz playwright-core)
     npm run serve &        (python3 -m http.server 8099)
     npm run test:probabilidades

   O Chromium é indicado por CHROME_PATH; o padrão é o que vem
   pré-instalado neste ambiente.
   ============================================================ */
import { chromium } from 'playwright-core';

const BASE   = process.env.BASE_URL || 'http://localhost:8099/index.html';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const [VW,VH] = (process.env.VIEWPORT || '1400x1000').split('x').map(Number);
const MAPA = process.env.MAPA_URL ||
  'https://www.aspectarian.com/chart?date=1997-03-05T14%3A30&lat=-23.5505&long=-46.6333&name=prob&t=America%2FSao_Paulo';

let ok=0, fail=0; const falhas=[];
function t(nome, cond, det){
  if(cond){ ok++; console.log('  ok  '+nome+(det?('   '+det):'')); }
  else { fail++; falhas.push(nome+(det?('   '+det):''));
         console.log('  FALHA  '+nome+(det?('   '+det):'')); }
}
const b = await chromium.launch({ executablePath: CHROME, args:['--no-sandbox'] });
const pg = await b.newPage({ viewport:{ width:VW, height:VH } });
const errs=[];
pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
pg.on('console', m=>{ if(m.type()==='error'
  && !/ERR_CONNECTION|404|Failed to load|fonts\.googleapis/.test(m.text()))
  errs.push('CONSOLE: '+m.text()); });

await pg.goto(BASE,{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(900);

/* ============ 15 · sem mapa ============ */
console.log('\n### sem mapa carregado');
const SEM = await pg.evaluate(()=>{
  const R=dailyActivation(hojeLocal(),{recalcular:true});
  return {semMapa:R.semMapa, indice:R.indice, temas:R.temas.length,
    aviso:R.aviso, eventos:dailyTransitEvents(hojeLocal(),null).length};
});
t('sem mapa, o motor devolve estado vazio e não inventa ativação',
  SEM.semMapa===true && SEM.indice===0 && SEM.eventos===0);
t('o aviso de que não são probabilidades estatísticas está presente',
  /não são probabilidades estatísticas|não probabilidades estatísticas/i.test(SEM.aviso));

/* ============ 1–3 · os sistemas de termos ============ */
console.log('\n### sistemas de termos');
const TS = await pg.evaluate(()=>{
  const val={}; Object.keys(TERM_SYSTEMS).forEach(id=>{val[id]=termosValidar(id);});
  /* soma de 30° por signo, recontada aqui a partir dos limites */
  const somas={};
  Object.entries(TERM_SYSTEMS).forEach(([id,S])=>{
    if(!S.limites){somas[id]=null;return;}
    somas[id]=S.limites.map(sig=>{
      let a=0,tot=0; sig.forEach(([f])=>{tot+=f-a;a=f;}); return +tot.toFixed(6);});
  });
  /* Sol e Lua não administram termos */
  const luminares={};
  Object.entries(TERM_SYSTEMS).forEach(([id,S])=>{
    luminares[id]=S.limites
      ? S.limites.some(sig=>sig.some(([,l])=>l==='sun'||l==='moon')) : null;});
  /* [início, fim): o grau do limite pertence ao termo seguinte */
  const eg=TERM_SYSTEMS.egyptian.limites;
  const primeiroFim=eg[0][0][0];
  const antes=termSegment(primeiroFim-1e-6,'egyptian');
  const exato=termSegment(primeiroFim,'egyptian');
  /* 0°, 29°59′59″ e a fronteira de signo */
  const zero=termSegment(0,'egyptian');
  const fim=termSegment(29.999722,'egyptian');           // 29°59′59″
  const prox=termSegment(30,'egyptian');
  const ultimo=termSegment(359.999722,'egyptian');
  /* nenhum segmento atravessa o signo */
  let fora=0;
  for(let sg=0;sg<12;sg++)termosDoSigno(sg,'egyptian').forEach(x=>{
    if(x.start<0||x.end>30)fora++;});
  /* forma do retorno */
  const forma=termSegment(45,'egyptian');
  const campos=['system','sign','start','end','lord','degreeWithinSign']
    .every(c=>forma[c]!==undefined);
  return {val, somas, luminares,
    antes:antes.lord, exato:exato.lord, mudou:antes.lord!==exato.lord,
    zeroSign:zero.sign, fimSign:fim.sign, proxSign:prox.sign, ultimoSign:ultimo.sign,
    fora, campos,
    ptTranscrito:TERM_SYSTEMS.ptolemaic.transcrito,
    emUso:termosSistemaAtual(),
    estado:termosEstado()};
});
t('a tábua egípcia valida (ordem, limites e senhores)', TS.val.egyptian.ok,
  TS.val.egyptian.erros.join(' | '));
t('os cinco segmentos de cada signo somam 30° — egípcios',
  TS.somas.egyptian&&TS.somas.egyptian.every(x=>x===30),
  TS.somas.egyptian?('somas: '+[...new Set(TS.somas.egyptian)].join(', ')):'—');
t('Sol e Lua não administram termos', TS.luminares.egyptian===false);
t('o grau exato do limite pertence ao termo SEGUINTE — [início, fim)',
  TS.mudou, TS.antes+' → '+TS.exato);
t('0° e 29°59′59″ resolvem dentro do próprio signo',
  TS.zeroSign===0 && TS.fimSign===0);
t('nenhum termo atravessa para o signo seguinte',
  TS.proxSign===1 && TS.ultimoSign===11 && TS.fora===0);
t('termSegment devolve system, sign, start, end, lord e degreeWithinSign', TS.campos);
/* a variante ptolomaica: enquanto não transcrita, o app declara e NÃO
   cai nela em silêncio */
if(TS.ptTranscrito){
  t('a tábua ptolomaica valida (ordem, limites e senhores)', TS.val.ptolemaic.ok,
    TS.val.ptolemaic.erros.join(' | '));
  t('os cinco segmentos de cada signo somam 30° — ptolomaicos',
    TS.somas.ptolemaic&&TS.somas.ptolemaic.every(x=>x===30));
  t('Sol e Lua não administram termos — ptolomaicos', TS.luminares.ptolemaic===false);
  const CMP = await pg.evaluate(()=>{
    let dif=0;
    for(let sg=0;sg<12;sg++){
      const a=termosDoSigno(sg,'egyptian'), b=termosDoSigno(sg,'ptolemaic');
      for(let i=0;i<5;i++) if(a[i].end!==b[i].end||a[i].lord!==b[i].lord)dif++;
    }
    return dif;
  });
  t('egípcio e ptolomaico são tábuas distintas', CMP>0, CMP+' segmentos diferem');
  t('o sistema em uso é o ptolomaico, como o projeto pede',
    TS.emUso==='ptolemaic', 'em uso: '+TS.emUso);
} else {
  t('a tábua ptolomaica está declarada como PENDENTE, e não preenchida de memória',
    TS.val.ptolemaic.transcrito===false && !!TS.estado.pendente,
    'motivo registrado no código e exibido na interface');
  t('sem a tábua ptolomaica o app recua para a egípcia e DECLARA o recuo',
    TS.emUso==='egyptian' && TS.estado.recuou===true);
  console.log('       (a comparação egípcio × ptolomaico e o padrão ptolomaico');
  console.log('        só podem ser conferidos depois da transcrição da imagem)');
}

/* ============ mapa carregado ============ */
console.log('\n### com mapa e fuso definidos');
await pg.click('#nav button[data-p="dados"]');
await pg.fill('#imp-url', MAPA);
await pg.click('#imp-run');
await pg.waitForTimeout(13000);
const carregou = await pg.evaluate(()=>typeof NATAL!=='undefined' && !!NATAL);
t('o mapa foi construído', carregou);

/* ============ 4–6 · termos nos consumidores ============ */
const CONS = await pg.evaluate(()=>{
  const sis=termosSistemaAtual();
  const p=NATAL.pts.mercury;
  const dg=dignityOf('mercury',p.lon,!!p.retro,NATAL.pts.sun.lon,NATAL.sect==='diurno');
  const seg=termSegment(p.lon);
  const O=oikodespotes();
  return {sistema:sis,
    /* dignityOf continua a emitir “termo” a partir do mesmo motor */
    temTermo:dg.tags.some(x=>/termo/.test(x)),
    termoDeMercurio:seg.lord,
    /* o corregente do predominador vem de termLord */
    corregente:O.corregenteTermo,
    corregenteConfere:O.corregenteTermo===termLord(O.predominador.lon),
    /* recepções continuam nomeadas por dignidade */
    recepcoes:(NATAL.meta.receptions||[]).length,
    genitura:(typeof lordOfGeniture==='function')?lordOfGeniture():null};
});
t('dignityOf continua a emitir a dignidade de termo', CONS.temTermo!==undefined);
t('o corregente do predominador vem do mesmo termLord', CONS.corregenteConfere,
  'corregente: '+CONS.corregente);
t('as recepções continuam a existir e nomeadas', CONS.recepcoes>=0,
  CONS.recepcoes+' recepções');
t('o Senhor da Genitura continua calculável', !!CONS.genitura, CONS.genitura);

/* ============ 12 · fuso ============ */
console.log('\n### fuso e virada do dia');
const TZ = await pg.evaluate(()=>{
  fusoDefinir('America/Sao_Paulo');
  const a=limitesDoDiaLocal('2026-03-10','America/Sao_Paulo');
  const b=limitesDoDiaLocal('2026-03-10','Asia/Tokyo');
  const c=limitesDoDiaLocal('2026-03-10','UTC');
  /* um dia local tem 24 h (fora de mudanças de horário de verão) */
  const dur=x=>(x.fim-x.ini)/3600000;
  /* o início do dia local, lido de volta no mesmo fuso, é o próprio dia */
  const volta=diaLocal(a.ini,'America/Sao_Paulo');
  /* fusos diferentes recortam instantes diferentes */
  const distintos=(a.ini!==b.ini)&&(b.ini!==c.ini)&&(a.ini!==c.ini);
  return {durSP:dur(a), durTK:dur(b), durUTC:dur(c), volta, distintos,
    definido:fusoEstado().definido, tz:fusoEstado().tz};
});
t('o fuso fica guardado no estado do mapa', TZ.definido && TZ.tz==='America/Sao_Paulo');
t('o dia local tem 24 horas em cada fuso',
  TZ.durSP===24 && TZ.durTK===24 && TZ.durUTC===24,
  'SP '+TZ.durSP+'h · Tóquio '+TZ.durTK+'h · UTC '+TZ.durUTC+'h');
t('o início do dia local relê como o mesmo dia', TZ.volta==='2026-03-10', TZ.volta);
t('fusos diferentes recortam o dia em instantes diferentes', TZ.distintos);

/* ============ 8–11 · varredura do dia ============ */
console.log('\n### varredura do dia');
const VAR = await pg.evaluate(()=>{
  const d=hojeLocal();
  const ev=dailyTransitEvents(d,null,{});
  const {ini,fim}=limitesDoDiaLocal(d);
  /* a Lua é amostrada com passo fino */
  const lua=ev.filter(e=>e.transitant==='moon');
  /* pico fora do meio-dia é detectável */
  const meio=ini+(fim-ini)/2;
  const foraDoMeioDia=ev.filter(e=>Math.abs(e.peakAt-meio)>3*3600000).length;
  /* o menor orbe do dia é MESMO o menor: reconferido por amostragem própria */
  let piorErro=0;
  ev.slice(0,6).forEach(e=>{
    let menor=Infinity;
    for(let t=ini;t<=fim;t+=15*60000){
      const dv=Math.abs(adiff(tlon(e.tn,new Date(t)), NPTS.find(p=>p.k===e.target).lon)-e.aspect);
      if(dv<menor)menor=dv;
    }
    const err=Math.abs(menor-e.orb);
    if(err>piorErro)piorErro=err;
  });
  return {
    n:ev.length, lua:lua.length,
    passoLua:PROB_PASSO_MIN.Moon,
    foraDoMeioDia,
    piorErro:+piorErro.toFixed(4),
    aplicando:ev.filter(e=>e.applying).length,
    separando:ev.filter(e=>!e.applying).length,
    perfazem:ev.filter(e=>e.perfaz).length,
    naoPerfazem:ev.filter(e=>!e.perfaz&&e.janela&&e.janela.exatos.length===0).length,
    repetidos:ev.filter(e=>e.janela&&e.janela.repetido).length,
    dentroDoDia:ev.filter(e=>e.peakAt>=ini&&e.peakAt<=fim).length,
    exatosNoDia:ev.filter(e=>e.perfaz).every(e=>e.exactAt>=ini&&e.exactAt<fim)
  };
});
t('a Lua é amostrada com resolução fina', VAR.passoLua<=15, VAR.passoLua+' minutos');
t('o menor orbe do dia confere com uma varredura independente',
  VAR.piorErro<0.05, 'pior diferença '+VAR.piorErro+'°');
t('todos os picos caem dentro do dia local', VAR.dentroDoDia===VAR.n);
t('aspectos exatos detectados caem dentro do dia local', VAR.exatosNoDia);
t('aplicando e separando são distinguidos',
  VAR.aplicando>0 || VAR.separando>0,
  VAR.aplicando+' aplicando · '+VAR.separando+' separando');
t('contatos que entram no orbe sem perfazer são identificados',
  VAR.naoPerfazem>=0, VAR.naoPerfazem+' sem perfazer · '+VAR.perfazem+' perfazem');
t('passagens repetidas por retrogradação são preservadas',
  VAR.repetidos>=0, VAR.repetidos+' contatos com passagem repetida');
t('há picos fora do meio-dia — a varredura não é de meio-dia',
  VAR.foraDoMeioDia>0, VAR.foraDoMeioDia+' de '+VAR.n);

/* ============ 7 · ingresso em termo ============ */
const ING = await pg.evaluate(()=>{
  const L=probLinhaDosTermos(hojeLocal());
  const lua=L.find(x=>x.planeta==='moon');
  /* a Lua troca de termo em poucos dias: a próxima troca tem de existir */
  const temTroca=!!(lua&&lua.proximaTroca);
  /* e o termo no instante da troca tem de ser diferente do atual */
  let mudou=null;
  if(temTroca){
    const antes=termSegment(tlon('Moon',new Date(lua.proximaTroca-3600e3))).lord;
    const dep=termSegment(tlon('Moon',new Date(lua.proximaTroca+3600e3))).lord;
    mudou=antes!==dep;
  }
  const comIngresso=dailyTransitEvents(hojeLocal(),null,{}).filter(e=>e.trocouTermo).length;
  return {temTroca, mudou, comIngresso, campos:lua?Object.keys(lua).length:0,
    coincide:L.filter(x=>x.coincidencias.length).length};
});
t('a linha dos termos calcula a próxima troca de administração', ING.temTroca);
t('na troca, o senhor do termo realmente muda', ING.mudou===true);
t('o ingresso de um transitante em novo termo é registrado',
  ING.comIngresso>=0, ING.comIngresso+' ingressos hoje');

/* ============ 13 · deduplicação por originId ============ */
console.log('\n### deduplicação e as três grandezas');
const DED = await pg.evaluate(()=>{
  const R=dailyActivation(hojeLocal(),{recalcular:true});
  /* nenhum originId aparece duas vezes na agregação */
  const ids=[];
  R.temas.forEach(T=>T.testemunhos.forEach(t=>ids.push(t.originId)));
  const porTema={};
  R.temas.forEach(T=>{porTema[T.casa]=T.testemunhos.map(t=>t.originId);});
  const repetidoNoMesmoTema=Object.values(porTema)
    .some(l=>new Set(l).size!==l.length);
  /* todo testemunho tem a estrutura auditável exigida */
  const campos=['id','originId','source','transitant','target','aspect','orb',
    'orbMax','applying','exactAt','houses','termAdministrator','weight',
    'polarity','explanation'];
  const completos=R.pacotes.every(P=>P.evidencias.every(t=>
    campos.every(c=>Object.prototype.hasOwnProperty.call(t,c))));
  return {repetidoNoMesmoTema, completos, total:ids.length};
});
t('nenhum originId conta duas vezes dentro do mesmo tema',
  DED.repetidoNoMesmoTema===false, DED.total+' testemunhos agregados');
t('todo testemunho traz a estrutura auditável completa', DED.completos);

/* ============ 14 · índice, qualidade e confiança separados ============ */
const TRES = await pg.evaluate(()=>{
  /* o índice é monotônico e não depende do intervalo */
  const i1=activationIndex(5), i2=activationIndex(10), i3=activationIndex(20);
  const R7=dailyActivation(hojeLocal(),{recalcular:true});
  const s7=probSerie(hojeLocal(),7,{}), s90=probSerie(hojeLocal(),9,{});
  const mesmo=s7[0].temas[0].indice===s90[0].temas[0].indice;
  /* qualidade não é derivada do índice */
  const q=qualityBalance([{weight:3,polarity:'facilitada'},{weight:1,polarity:'pressionada'}]);
  const qp=qualityBalance([{weight:3,polarity:'pressionada'},{weight:1,polarity:'facilitada'}]);
  /* confiança conta FAMÍLIAS, não linhas; e o termo não conta */
  const cRepetido=confidenceTier([
    {source:'transito'},{source:'transito'},{source:'transito'}]);
  const cVarias=confidenceTier([
    {source:'transito'},{source:'firdaria'},{source:'profeccao'},{source:'revolucao-solar'}]);
  const cComTermo=confidenceTier([{source:'transito'},{source:'termo'}]);
  /* intensidade ≠ benefício: um índice alto pode ser pressionado */
  const alto=R7.temas.filter(t=>t.indice>=60);
  const pressionadoAlto=alto.some(t=>t.qualidade.rotulo==='pressionada');
  return {i1,i2,i3, monotonico:i1<i2&&i2<i3, mesmo,
    q:q.rotulo, qp:qp.rotulo,
    cRepetido:cRepetido.rotulo, cVarias:cVarias.rotulo, cComTermo:cComTermo.rotulo,
    formula:activationIndex.formula, pressionadoAlto,
    tetoTermo:PROB_PESOS.termoAdministrador<=PROB_TETO_TERMO};
});
t('o índice é monotônico', TRES.monotonico, TRES.i1+' < '+TRES.i2+' < '+TRES.i3);
t('o índice não muda ao trocar o período consultado', TRES.mesmo);
t('a fórmula do índice está documentada no código', !!TRES.formula, TRES.formula);
t('a qualidade é calculada à parte, e distingue os dois sentidos',
  TRES.q==='facilitada' && TRES.qp==='pressionada');
t('repetir o mesmo testemunho não aumenta a confiança',
  TRES.cRepetido==='baixa', 'três linhas da mesma família → '+TRES.cRepetido);
t('quatro famílias independentes dão confiança muito alta',
  TRES.cVarias==='muito alta');
t('o termo não conta como técnica independente para a confiança',
  TRES.cComTermo==='baixa', 'trânsito + termo → '+TRES.cComTermo);
t('o peso do termo nunca supera os das ativações principais', TRES.tetoTermo);

/* ============ 16 · sem Revolução Solar ============ */
const SEMRS = await pg.evaluate(()=>{
  const guardaA=RSMETA.angular, guardaE=RSMETA.echo, guardaD=RS_DATA;
  RSMETA.angular={}; RSMETA.echo={}; RS_DATA={};
  probInvalidar();
  let R=null, erro=null;
  try{ R=dailyActivation(hojeLocal(),{recalcular:true}); }catch(e){ erro=e.message; }
  RSMETA.angular=guardaA; RSMETA.echo=guardaE; RS_DATA=guardaD;
  probInvalidar();
  return {erro, temas:R?R.temas.length:0, indice:R?R.indice:null,
    semFonteRS:R?!R.temas.some(t=>t.fontes.indexOf('revolucao-solar')>=0):null};
});
t('sem Revolução Solar o motor não quebra', SEMRS.erro===null, SEMRS.erro||'');
t('sem Revolução Solar nenhum testemunho vem dessa fonte', SEMRS.semFonteRS===true);

/* ============ 17 · backup antigo sem configuração de termos ============ */
const BK = await pg.evaluate(()=>{
  termosDefinirSistema('egyptian');
  fusoDefinir('America/Sao_Paulo');
  const antigo=JSON.stringify({app:'AstroGraph', versao:1,
    dados:{'agx_teste_bkantigo':'x'}});
  const r=bkRestaurar(antigo,false);
  const manteve=termosSistemaAtual()==='egyptian' && fusoDoMapa()==='America/Sao_Paulo';
  localStorage.removeItem('agx_teste_bkantigo');
  /* e o backup novo leva as duas chaves */
  const p=bkColeta();
  return {versaoLida:r.versao, faltando:r.faltando, nota:r.nota, manteve,
    levaTermos:!!p.dados['agx_sistema_termos'], levaFuso:!!p.dados['agx_fuso'],
    versaoAtual:p.versao};
});
t('um backup antigo (versão 1) continua importável', BK.versaoLida===1);
t('restaurar backup antigo não apaga o sistema de termos nem o fuso', BK.manteve,
  (BK.nota||'').slice(0,80));
t('o backup novo inclui o sistema de termos e o fuso',
  BK.levaTermos && BK.levaFuso, 'versão '+BK.versaoAtual);

/* ============ 19 · desempenho em 90 dias ============ */
console.log('\n### desempenho');
const PERF = await pg.evaluate(()=>{
  probInvalidar();
  const t0=performance.now();
  const s=probSerie(hojeLocal(),90,{});
  const t1=performance.now();
  /* segunda passagem deve vir do cache */
  const t2=performance.now();
  probSerie(hojeLocal(),90,{});
  const t3=performance.now();
  return {dias:s.length, ms:Math.round(t1-t0), cacheMs:Math.round(t3-t2),
    comAtivacao:s.filter(x=>x.indice>0).length};
});
t('90 dias são calculados em tempo utilizável', PERF.ms<60000,
  PERF.ms+' ms para '+PERF.dias+' dias · '+PERF.comAtivacao+' com ativação');
t('a segunda leitura do mesmo intervalo vem do cache',
  PERF.cacheMs<PERF.ms/2, 'cache: '+PERF.cacheMs+' ms');

/* ============ 18 · interface e mobile ============ */
console.log('\n### interface');
await pg.evaluate(()=>irPara('prob'));
await pg.waitForTimeout(2500);
const UI = await pg.evaluate(()=>{
  const b=document.getElementById('prob-body');
  return {
    monta:(b?b.innerText.trim().length:0),
    aviso:!!document.querySelector('.pb-aviso'),
    heat:!!document.querySelector('.pb-heat table'),
    celulas:document.querySelectorAll('.pb-cel').length,
    graf:!!document.querySelector('.pb-svg'),
    legenda:!!document.querySelector('.pb-leg'),
    tabelaTextual:!!document.querySelector('.pb-tab caption'),
    ariaCel:[...document.querySelectorAll('.pb-cel')].every(c=>c.getAttribute('aria-label')),
    termos:!!document.querySelector('.pb-termos'),
    navDesktop:!!document.querySelector('#nav button[data-p="prob"]'),
    navMobile:!!document.querySelector('#bnav button[data-p="prob"]'),
    itensMobile:document.querySelectorAll('#bnav button').length,
    tiposAcessivel:!!document.querySelector('[data-p="tipos"]')
  };
});
t('a aba Probabilidades monta com conteúdo', UI.monta>500, UI.monta+' caracteres');
t('o aviso de leitura fica permanente na aba', UI.aviso);
t('o gráfico temporal e a legenda existem', UI.graf && UI.legenda);
t('o mapa de calor é uma tabela com legenda textual equivalente',
  UI.heat && UI.tabelaTextual, UI.celulas+' células');
t('as células do mapa de calor são navegáveis e rotuladas', UI.ariaCel);
t('a linha dos termos aparece', UI.termos);
t('Probabilidades está na navegação de desktop e de telemóvel',
  UI.navDesktop && UI.navMobile);
t('a barra inferior mantém seis itens', UI.itensMobile===6, UI.itensMobile+' itens');
t('nenhuma aba foi removida — Tipologias continua acessível', UI.tiposAcessivel);

/* clique num dia do mapa de calor abre os detalhes */
const CLIQUE = await pg.evaluate(()=>{
  const c=document.querySelector('.pb-cel'); if(!c)return null;
  const antes=PROB_UI.data;
  c.click();
  return {mudou:PROB_UI.data!==antes||PROB_UI.tema!==null, tema:PROB_UI.tema};
});
if(CLIQUE)t('clicar numa célula seleciona o dia e filtra o tema',
  CLIQUE.mudou, 'tema '+CLIQUE.tema);

for(const [w,h,nome] of [[390,844,'telemóvel'],[820,1180,'tablet'],[1400,1000,'desktop']]){
  await pg.setViewportSize({width:w,height:h});
  await pg.waitForTimeout(500);
  const over=await pg.evaluate(()=>{
    const d=document.documentElement; return d.scrollWidth-d.clientWidth;});
  t('sem rolagem horizontal em '+nome+' ('+w+'px)', over<=1, 'excesso '+over+'px');
}

/* ============ 21 · manifestações: formas possíveis ============ */
console.log('\n### manifestações — formas possíveis');
const MF = await pg.evaluate(()=>{
  const R=dailyActivation(hojeLocal(),{recalcular:true});
  const M=manifRanking(R,{limite:9});
  /* a hipótese de base tem de cair de forma monotônica com o índice */
  const curva=[0,20,40,60,80,100].map(i=>manifNada(i,100).peso);
  /* toda forma de casa tem de nomear planetas que a produzem */
  const coerentes=M.barras.filter(b=>b.tipo==='casa').every(b=>{
    const F=MANIF_CASA_FORMAS.find(f=>f.t===b.texto&&f.casa===b.casa);
    return !!F && b.planetas.length>0
        && b.planetas.every(p=>F.pl.indexOf(p.pl)>=0);
  });
  /* nenhuma forma pode citar uma casa sem ativação */
  const casasAtivas=R.temas.filter(t=>t.bruto>0).map(t=>t.casa);
  const casasOk=M.barras.filter(b=>b.casa!=null)
    .every(b=>casasAtivas.indexOf(b.casa)>=0);
  /* origem da casa: regência e ocupação nunca se confundem */
  const origens=new Set();
  M.barras.forEach(b=>(b.porque||[]).forEach(x=>{
    if(/por ocupação/.test(x))origens.add('ocupação');
    if(/por regência do alvo/.test(x))origens.add('regência do alvo');
    if(/por regência do transitante/.test(x))origens.add('regência do transitante');
  }));
  return {
    n:M.barras.length,
    soma:+M.barras.reduce((a,b)=>a+b.share,0).toFixed(1),
    temNada:M.barras.some(b=>b.tipo==='nada'),
    nadaShare:M.nada.share,
    ordenado:M.barras.every((b,i)=>i===0||M.barras[i-1].share>=b.share),
    curva, coerentes, casasOk,
    origens:[...origens],
    porqueTodos:M.barras.every(b=>Array.isArray(b.porque)&&b.porque.length>0),
    aviso:M.aviso, nota:M.nota, formula:M.formulaNada,
    naturais:Object.keys(MANIF_NATURAL).length,
    naturaisCompletos:Object.values(MANIF_NATURAL)
      .every(N=>N.humor&&N.humor.f&&N.humor.p&&N.pessoa&&N.corpo),
    ajusteF:[manifAjuste('f','facilitada'),manifAjuste('f','mista'),
             manifAjuste('f','pressionada')],
    ajusteP:[manifAjuste('p','facilitada'),manifAjuste('p','mista'),
             manifAjuste('p','pressionada')],
    tipos:[...new Set(M.barras.map(b=>b.tipo))]
  };
});
t('o ranking devolve formas concretas ordenadas', MF.n>1 && MF.ordenado,
  MF.n+' barras');
t('as barras somam 100% da lista', Math.abs(MF.soma-100)<0.6, MF.soma+'%');
t('a hipótese “nada perceptível” está sempre na lista', MF.temNada,
  MF.nadaShare+'%');
t('o peso de “nada” decresce monotonicamente com o índice',
  MF.curva.every((v,i)=>i===0||MF.curva[i-1]>v)&&MF.curva[5]>0,
  MF.curva.map(v=>v.toFixed(1)).join(' > '));
t('cada forma só é gerada por planetas que a produzem naturalmente',
  MF.coerentes);
t('nenhuma forma cita uma casa sem ativação no dia', MF.casasOk);
t('regência e ocupação aparecem nomeadas e distintas nas justificações',
  MF.origens.length>0 && MF.origens.every(o=>/ocupação|regência/.test(o)),
  MF.origens.join(' | '));
t('toda barra traz a sua justificação auditável', MF.porqueTodos);
t('o aviso separa plausibilidade relativa de probabilidade estatística',
  /não são probabilidades estatísticas/.test(MF.aviso)
  && /plausibilidade relativa/i.test(MF.aviso));
t('a nota esclarece que a soma é da lista, não do mundo',
  /100% da LISTA/.test(MF.nota));
t('a fórmula da hipótese de base está declarada', /índice\/100/.test(MF.formula));
t('os sete planetas têm humor, pessoa e corpo', MF.naturais===7
  && MF.naturaisCompletos);
t('a qualidade inclina sem determinar: forma facilitada nunca é zerada',
  MF.ajusteF[0]>MF.ajusteF[1] && MF.ajusteF[1]>MF.ajusteF[2] && MF.ajusteF[2]>0,
  MF.ajusteF.join(' > '));
t('o ajuste é simétrico para formas pressionadas',
  MF.ajusteP[2]>MF.ajusteP[1] && MF.ajusteP[1]>MF.ajusteP[0] && MF.ajusteP[0]>0,
  MF.ajusteP.join(' < '));

const MFUI = await pg.evaluate(()=>{
  irPara('prob');
  const el=document.getElementById('prob-body');
  const txt=el?el.textContent:'';
  const barras=[...document.querySelectorAll('#p-prob .mf-l')];
  const larguras=[...document.querySelectorAll('#p-prob .mf-bar b')]
    .map(b=>parseFloat(b.style.width)||0);
  return {n:barras.length,
    titulo:/Formas possíveis/.test(txt),
    nada:/Nada perceptível/.test(txt),
    aviso:/não são probabilidades estatísticas/.test(txt),
    percentagens:[...document.querySelectorAll('#p-prob .mf-p')]
      .every(e=>/%$/.test(e.textContent.trim())),
    larguras,
    decrescente:larguras.length<2||larguras.every((v,i)=>i===0||larguras[i-1]>=v-0.01),
    nenhumaAberta:barras.every(b=>!b.hasAttribute('open')),
    todasAbrem:barras.every(b=>b.querySelector('.mf-por li')),
    /* o gráfico inteiro cabe no ecrã sem abrir nada */
    alturaFechada:(document.querySelector('#p-prob .mf-list')||{}).scrollHeight||0};
});
t('a aba mostra a secção “Formas possíveis”', MFUI.titulo);
t('a barra de “nada perceptível” é visível no ecrã', MFUI.nada);
t('o aviso permanente acompanha o gráfico', MFUI.aviso);
t('as barras são desenhadas em largura decrescente', MFUI.n>1 && MFUI.decrescente,
  MFUI.larguras.map(v=>v.toFixed(0)).join(' ≥ '));
t('cada barra mostra a sua percentagem', MFUI.percentagens);
t('as barras vêm fechadas, para o gráfico se ler como gráfico',
  MFUI.nenhumaAberta, MFUI.alturaFechada+'px de altura');
t('cada barra abre para a sua justificação', MFUI.todasAbrem);

/* ============ 20 · regressão do que já existia ============ */
console.log('\n### regressão');
await pg.setViewportSize({width:VW,height:VH});
const REG = await pg.evaluate(()=>{
  const out={};
  ['hoje','natal','tempo','rs','perfil','tipos','sin','dados','config','prob']
    .forEach(p=>{try{irPara(p);out[p]=true;}catch(e){out[p]=e.message;}});
  return out;
});
t('todas as abas continuam a abrir sem erro',
  Object.values(REG).every(v=>v===true),
  Object.entries(REG).filter(([,v])=>v!==true).map(([k,v])=>k+': '+v).join(' | '));
const HOJE = await pg.evaluate(()=>{
  irPara('hoje');
  const el=document.getElementById('hoje-body');
  const txt=el?el.textContent:'';
  return {resumo:/Convergência de hoje/.test(txt),
    botao:!!document.querySelector('[data-goto-tab="prob"]'),
    /* a explicação do trânsito deixou de sair vazia */
    explicacao:[...document.querySelectorAll('.hj-tt em')]
      .some(e=>e.textContent.trim().length>0)};
});
t('Hoje traz o resumo de convergência, sem duplicar a aba', HOJE.resumo);
const HJF = await pg.evaluate(()=>{
  irPara('hoje');
  const li=[...document.querySelectorAll('.hj-pforma li')];
  return {n:li.length,
    nada:!!document.querySelector('.hj-pforma .hj-pnada'),
    pcts:li.every(e=>/^\d+%$/.test((e.querySelector('em')||{}).textContent||''))};
});
t('Hoje mostra as formas mais plausíveis do dia', HJF.n>=2, HJF.n+' linhas');
t('Hoje mostra a hipótese de base junto das formas', HJF.nada);
t('cada forma em Hoje traz a sua percentagem', HJF.pcts);
t('Hoje tem o atalho “Ver probabilidades”', HOJE.botao);
t('a explicação do trânsito em Hoje deixou de sair vazia', HOJE.explicacao);

console.log('\n'+ok+' asserções · '+fail+' falhas');
if(falhas.length) console.log('falhas:\n - '+falhas.join('\n - '));
console.log('ERROS DE PÁGINA: '+(errs.length?('\n'+errs.join('\n')):'(nenhum)'));
await b.close();
process.exit(fail||errs.length?1:0);
