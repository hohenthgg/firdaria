/* ============================================================
   tests-tipologia.mjs — a suíte da camada tipológica.

   O que estes testes provam, e o que NÃO provam:

     PROVAM que o código faz o que diz — que as estruturas dos
     dezesseis tipos conferem em cada sistema, que não há conversão
     automática de um sistema no outro, que dado ausente permanece
     desconhecido, que a alternativa vem de comparação e não de
     inversão de letra, e que a hipótese natal não muda quando se
     navega no tempo.

     NÃO PROVAM que a correspondência entre mapa e tipologia seja
     verdadeira. Isso é uma questão empírica, exigiria amostra
     pré-registrada e tipos determinados por outro meio, e este app
     não tem esse dado. Passar aqui é correção matemática e
     fidelidade ao modelo escolhido — nunca validade da ponte.

   Como rodar:
     python3 -m http.server 8099 &
     node tests-tipologia.mjs
   ============================================================ */
import { chromium } from 'playwright-core';

const BASE   = process.env.BASE_URL || 'http://localhost:8099/index.html';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const [VW,VH] = (process.env.VIEWPORT || '1400x1000').split('x').map(Number);
const MAPAS = process.env.MAPAS ? JSON.parse(process.env.MAPAS) : [
  { nome:'lucas · manhã · sul',
    url:'https://www.aspectarian.com/chart?date=1994-08-17T06%3A00&lat=-22.2270778&long=-45.93937160000001&name=lucas&t=America%2FSao_Paulo' },
  { nome:'norte · madrugada',
    url:'https://www.aspectarian.com/chart?date=1985-11-22T03%3A10&lat=51.5074&long=-0.1278&name=norte&t=Europe%2FLondon' }
];

let ok=0, fail=0; const falhas=[];
function t(nome, cond, detalhe){
  if(cond){ ok++; console.log('  ok  '+nome+(detalhe?('   '+detalhe):'')); }
  else { fail++; falhas.push(nome+(detalhe?('   '+detalhe):''));
         console.log('  FALHA  '+nome+(detalhe?('   '+detalhe):'')); }
}
const b = await chromium.launch({ executablePath: CHROME, args:['--no-sandbox'] });
const pg = await b.newPage({ viewport:{ width:VW, height:VH } });
const errs=[];
pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
pg.on('console', m=>{ if(m.type()==='error' && !/ERR_CONNECTION|404|Failed to load/.test(m.text()))
  errs.push('CONSOLE: '+m.text()); });
await pg.goto(BASE,{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(800);

/* ============ 1 · as estruturas dos dezesseis tipos ============ */
console.log('\n### estruturas — MBTI');
const M = await pg.evaluate(()=>{
  const casos={INTP:'Ti,Ne,Si,Fe', INTJ:'Ni,Te,Fi,Se', ENTP:'Ne,Ti,Fe,Si',
               ESTJ:'Te,Si,Ne,Fi', ESTP:'Se,Ti,Fe,Ni'};
  const erros=[];
  Object.entries(casos).forEach(([tp,esp])=>{
    const g=MBTI_ESTRUTURAS[tp].pilha.join(',');
    if(g!==esp)erros.push(tp+': esperado '+esp+', obtido '+g);
  });
  /* invariantes válidos para os dezesseis */
  const inv=[];
  MBTI_TIPOS.forEach(tp=>{
    const E=MBTI_ESTRUTURAS[tp];
    if(new Set(E.pilha).size!==4)inv.push(tp+': processo repetido');
    /* dominante e auxiliar são de classes opostas (juízo × percepção) */
    const cl=p=>MBTI_PROCESSOS[p].classe;
    if(cl(E.dom)===cl(E.aux))inv.push(tp+': dominante e auxiliar da mesma classe');
    /* inferior é a oposta da dominante, terciária a oposta da auxiliar */
    const op={N:'S',S:'N',T:'F',F:'T'};
    if(E.inf[0]!==op[E.dom[0]])inv.push(tp+': inferior não é oposta da dominante');
    if(E.tert[0]!==op[E.aux[0]])inv.push(tp+': terciária não é oposta da auxiliar');
    /* atitudes alternam, na convenção declarada */
    if(E.dom[1]===E.aux[1])inv.push(tp+': dominante e auxiliar na mesma atitude');
    if(E.tert[1]===E.aux[1])inv.push(tp+': terciária não alterna em relação à auxiliar');
  });
  return {erros, inv, n:MBTI_TIPOS.length,
    convencao:MBTI_CONVENCAO.id, declaraDivergencia:!!MBTI_CONVENCAO.divergencia,
    declaraNaoJung:!!MBTI_CONVENCAO.nao_e_jung,
    declaraNaoSoc:!!MBTI_CONVENCAO.nao_e_socionica,
    declaraNaoVerificado:!!MBTI_FONTE.naoVerificado};
});
t('as dezesseis estruturas do MBTI existem', M.n===16, M.n+' tipos');
t('os cinco casos nomeados conferem', M.erros.length===0, M.erros.join(' | '));
t('invariantes da pilha valem para os dezesseis', M.inv.length===0, M.inv.slice(0,3).join(' | '));
t('a convenção de dinâmica de tipo está nomeada', !!M.convencao, M.convencao);
t('a divergência entre convenções está declarada', M.declaraDivergencia);
t('está dito que a pilha não é Jung literal', M.declaraNaoJung);
t('está dito que os símbolos não valem para a Sociônica', M.declaraNaoSoc);
t('a fonte não verificada está declarada como tal', M.declaraNaoVerificado);

console.log('\n### estruturas — Sociônica');
const S = await pg.evaluate(()=>{
  const nomeados={LII:'Ti Ne Fi Se Fe Si Te Ni', ILI:'Ni Te Si Fe Se Fi Ne Ti',
                  ILE:'Ne Ti Se Fi Si Fe Ni Te', EIE:'Fe Ni Te Si Ti Se Fi Ne'};
  const erros=[], inv=[];
  Object.entries(nomeados).forEach(([tp,esp])=>{
    const g=SOC_MODELOS[tp].join(' ');
    if(g!==esp)erros.push(tp+': esperado '+esp+', obtido '+g);
  });
  SOC_TIPOS.forEach(tp=>{
    const m=SOC_MODELOS[tp];
    if(new Set(m).size!==8)inv.push(tp+': não usa os oito elementos');
    const d=socDual(tp);
    if(!d||socDual(d)!==tp)inv.push(tp+': dualidade não é simétrica');
    if(!SOC_TIPOS.find(x=>SOC_EGO[x][0]===m[3]&&SOC_EGO[x][1]===m[2]))
      inv.push(tp+': o Superego não é o Ego de nenhum tipo');
    if(m[6]!==SOC_INV[m[0]]||m[7]!==SOC_INV[m[1]])inv.push(tp+': o Id não é o Ego invertido');
    const val=[m[0],m[1],m[4],m[5]].sort().join(),
          q=SOC_QUADRAS[socQuadra(tp)].valorados.slice().sort().join();
    if(val!==q)inv.push(tp+': elementos valorados não batem com a quadra');
    const R=socRacionalidade(tp);
    if(R.racional!==(SOC_ELEMENTOS[m[0]].classe==='julgamento'))
      inv.push(tp+': racionalidade não vem da função base');
  });
  /* posição, força e valoração são eixos independentes */
  const P=SOC_POSICOES;
  const fortesNaoValoradas=P.filter(x=>x.forca==='forte'&&!x.valorada).map(x=>x.n);
  const fracasValoradas=P.filter(x=>x.forca==='fraca'&&x.valorada).map(x=>x.n);
  return {erros, inv, n:SOC_TIPOS.length, fortesNaoValoradas, fracasValoradas,
    blocos:Object.keys(SOC_BLOCOS),
    declaraCamadas:!!SOC_FONTE.camadas_posteriores,
    declaraNotacao:!!SOC_FONTE.notacao,
    avisoRelacoes:SOC_RELACOES_AVISO};
});
t('os dezesseis sociotipos existem', S.n===16, S.n+' tipos');
t('LII, ILI, ILE e EIE conferem contra as listas canônicas', S.erros.length===0, S.erros.join(' | '));
t('invariantes do Modelo A valem para os dezesseis', S.inv.length===0, S.inv.slice(0,3).join(' | '));
t('os quatro blocos estão nomeados',
  S.blocos.join()==='Ego,Superego,Super-Id,Id', S.blocos.join(' · '));
t('força e valoração são eixos independentes',
  S.fortesNaoValoradas.join()==='7,8' && S.fracasValoradas.join()==='5,6',
  'fortes não valoradas: '+S.fortesNaoValoradas.join(',')
  +' · fracas valoradas: '+S.fracasValoradas.join(','));
t('dimensionalidade, sinais e Modelo G ficam fora do Modelo A', S.declaraCamadas);
t('a convenção da notação de quatro letras está declarada', S.declaraNotacao);
t('as relações intertipo não prometem compatibilidade',
  /não predizem|NÃO predizem/i.test(S.avisoRelacoes));

/* ============ 2 · ausência de conversão entre sistemas ============ */
console.log('\n### independência dos dois motores');
const IND = await pg.evaluate(()=>{
  const idsM=REGRAS_MBTI.map(r=>r.id), idsS=REGRAS_SOC.map(r=>r.id);
  /* nenhuma regra é compartilhada, e nenhuma regra sociônica cita letras MBTI */
  const partilhadas=idsM.filter(i=>idsS.indexOf(i)>=0);
  const fonteToda=[REGRAS_MBTI,REGRAS_SOC].map(r=>JSON.stringify(r)).join(' ');
  /* uma tabela de conversão teria de mapear os 16 tipos MBTI em sociotipos */
  const temTabela=MBTI_TIPOS.some(tp=>{
    const g=(typeof window!=='undefined')?window:globalThis;
    return Object.keys(g).some(k=>{
      try{const v=g[k];
        return v && typeof v==='object' && !Array.isArray(v)
          && v[tp] && SOC_TIPOS.indexOf(v[tp])>=0;}catch(e){return false;}
    });});
  return {partilhadas, temTabela,
    nM:idsM.length, nS:idsS.length,
    semConversao:!!INF_SOC_META.semConversao,
    /* toda regra é configuração: mínimo ≥ 2 sinais independentes */
    minimoOk:REGRAS_MBTI.concat(REGRAS_SOC).every(r=>r.minimo>=2 && r.sinais.length>r.minimo-1),
    /* nenhum sinal isolado basta */
    sinaisPorRegra:REGRAS_MBTI.concat(REGRAS_SOC).map(r=>r.sinais.length),
    /* as definições dos mesmos símbolos diferem entre os sistemas */
    definicoesDiferem:['Si','Ne','Ni','Se','Ti','Te','Fe','Fi']
      .every(s=>MBTI_PROCESSOS[s].processo!==SOC_ELEMENTOS[s].o_que_e)};
});
t('os dois motores não partilham nenhuma regra', IND.partilhadas.length===0,
  IND.nM+' regras MBTI · '+IND.nS+' regras sociônicas, disjuntas');
t('não existe tabela que converta tipo MBTI em sociotipo', !IND.temTabela);
t('a inferência sociônica declara não derivar do MBTI', IND.semConversao);
t('nenhuma regra dispara por fator isolado — mínimo de dois sinais', IND.minimoOk,
  'sinais por regra: '+Math.min(...IND.sinaisPorRegra)+'–'+Math.max(...IND.sinaisPorRegra));
t('os mesmos símbolos têm definições diferentes nos dois sistemas', IND.definicoesDiferem);

/* ============ 3 · cada regra é alcançável, por fatos sintéticos ============
   Prova a lógica da regra sem depender de a amostra de mapas conter a
   configuração. Também prova o inverso: abaixo do mínimo, não dispara. */
console.log('\n### alcançabilidade das regras (fatos sintéticos)');
const ALC = await pg.evaluate(()=>{
  /* constrói um conjunto de fatos em que apenas os sinais pedidos ocorrem */
  function fatosPara(regra, quantos){
    const F={};
    const põe=(id,valor)=>{F[id]={id, ok:true, valor, desc:'sintético: '+id};};
    /* valores neutros para tudo que as regras consultam */
    ['mercury','moon','sun','venus','mars','jupiter','saturn'].forEach(k=>{
      põe('elem.'+k,'fogo'); põe('modo.'+k,'cardinal'); põe('casa.'+k,5);
      põe('dig.'+k,'peregrino'); põe('retro.'+k,false);});
    [['mercury','saturn'],['mercury','jupiter'],['mercury','moon'],['mercury','mars'],
     ['mercury','venus'],['moon','saturn'],['moon','venus'],['moon','mars'],
     ['sun','saturn'],['mars','saturn'],['venus','saturn'],['sun','jupiter']]
      .forEach(([a,c])=>põe('asp.'+a+'-'+c,false));
    põe('balanco.elemento','fogo'); põe('balanco.elemento.margem',1);
    põe('balanco.modo','cardinal'); põe('angularidade.significadores',0);
    [3,9,1,10].forEach(h=>{põe('casa'+h+'.regente','jupiter'); põe('casa'+h+'.ocupantes',[]);});
    põe('seita','diurno'); põe('dispositor.mercury','jupiter');
    /* significadores de orientação, base da dimensão de valoração */
    põe('orient.regenteAsc','jupiter'); põe('orient.elemRegenteAsc','fogo');
    põe('orient.casaRegenteAsc',5); põe('orient.daimon','jupiter');
    põe('orient.elemEspirito','fogo'); põe('orient.casaEspirito',5);
    põe('orient.luminarSeita','sun'); põe('orient.casaLuminarSeita',5);
    põe('orient.elemLuminarSeita','fogo');
    /* agora força os primeiros `quantos` sinais a ocorrer */
    const forcar=regra.sinais.slice(0,quantos);
    forcar.forEach(S=>{
      /* tentativas dirigidas por id de sinal, uma a uma até o teste passar */
      const tentativas=[
        ()=>põe('elem.mercury','ar'), ()=>põe('elem.mercury','terra'),
        ()=>põe('elem.mercury','água'), ()=>põe('elem.mercury','fogo'),
        ()=>põe('elem.venus','terra'), ()=>põe('elem.venus','ar'),
        ()=>põe('elem.moon','terra'), ()=>põe('elem.moon','ar'),
        ()=>põe('elem.saturn','água'), ()=>põe('elem.saturn','terra'),
        ()=>põe('elem.saturn','ar'), ()=>põe('elem.jupiter','ar'),
        ()=>põe('elem.mars','fogo'),
        ()=>põe('balanco.modo','mutável'), ()=>põe('balanco.modo','fixo'),
        ()=>põe('balanco.modo','cardinal'),
        ()=>põe('balanco.elemento','terra'), ()=>põe('balanco.elemento','água'),
        ()=>põe('balanco.elemento','ar'),
        ()=>põe('angularidade.significadores',3), ()=>põe('angularidade.significadores',0),
        ()=>põe('casa.mercury',6), ()=>põe('casa.mercury',8), ()=>põe('casa.mercury',3),
        ()=>põe('casa.moon',4), ()=>põe('casa.moon',7), ()=>põe('casa.moon',12),
        ()=>põe('casa.moon',3), ()=>põe('casa.moon',2),
        ()=>põe('casa.venus',4), ()=>põe('casa.venus',7), ()=>põe('casa.venus',11),
        ()=>põe('casa.sun',10), ()=>põe('casa.sun',12),
        ()=>põe('casa.mars',10), ()=>põe('casa.mars',6),
        ()=>põe('casa.saturn',8), ()=>põe('casa.saturn',10), ()=>põe('casa.saturn',1),
        ()=>põe('dig.saturn','domicílio'), ()=>põe('dig.mars','domicílio'),
        ()=>põe('dig.mercury','domicílio'),
        ()=>põe('dispositor.mercury','saturn'),
        ()=>põe('casa9.regente','saturn'), ()=>põe('casa10.regente','mars'),
        ()=>põe('casa3.ocupantes',['venus']), ()=>põe('casa9.ocupantes',['jupiter']),
        ()=>põe('casa1.ocupantes',['mars']), ()=>põe('casa10.ocupantes',['sun']),
        ()=>põe('orient.elemRegenteAsc','ar'), ()=>põe('orient.elemRegenteAsc','terra'),
        ()=>põe('orient.elemRegenteAsc','água'), ()=>põe('orient.elemRegenteAsc','fogo'),
        ()=>põe('orient.daimon','saturn'), ()=>põe('orient.daimon','venus'),
        ()=>põe('orient.casaEspirito',9), ()=>põe('orient.casaEspirito',3),
        ()=>põe('orient.casaEspirito',7), ()=>põe('orient.casaEspirito',11),
        ()=>põe('orient.casaLuminarSeita',10), ()=>põe('orient.casaLuminarSeita',12),
        ()=>põe('orient.elemLuminarSeita','terra'), ()=>põe('orient.elemLuminarSeita','ar'),
        ()=>põe('orient.casaRegenteAsc',2), ()=>põe('orient.casaRegenteAsc',10)
      ].concat([['mercury','saturn'],['mercury','jupiter'],['moon','saturn'],
                ['moon','venus'],['venus','saturn'],['sun','saturn'],['sun','jupiter']]
        .map(([a,c])=>()=>põe('asp.'+a+'-'+c,true)));
      for(const tent of tentativas){
        const antes=JSON.stringify(F);
        tent();
        let passou=false; try{passou=!!S.teste(F);}catch(e){passou=false;}
        if(passou)return;
        Object.assign(F, JSON.parse(antes));   // desfaz e tenta a seguinte
      }
    });
    return F;
  }
  const inalcancaveis=[], incoerentes=[];
  const TODAS=REGRAS_MBTI.concat(REGRAS_SOC);
  TODAS.forEach(R=>{
    /* com o mínimo de sinais forçados, a regra tem de disparar */
    const Fok=fatosPara(R, R.minimo);
    if(ponteAplicar([R], Fok).testemunhos.length===0)inalcancaveis.push(R.id);
  });
  /* invariante do limiar: sobre vários conjuntos de fatos, uma regra dispara
     EXATAMENTE quando o número de sinais que ocorrem atinge o seu mínimo.
     Testar assim é mais forte do que montar um cenário artificial, porque
     não depende de o cenário ser realmente neutro. */
  const cenarios=[];
  TODAS.forEach(R=>{ for(let n=0;n<=R.sinais.length;n++) cenarios.push(fatosPara(R,n)); });
  cenarios.forEach(F=>{
    TODAS.forEach(R=>{
      const ocorrem=R.sinais.filter(S=>{try{return !!S.teste(F);}catch(e){return false;}}).length;
      const disparou=ponteAplicar([R],F).testemunhos.length>0;
      if(disparou!==(ocorrem>=R.minimo))
        incoerentes.push(R.id+' (sinais '+ocorrem+', mínimo '+R.minimo
          +', disparou '+disparou+')');
    });
  });
  return {inalcancaveis, incoerentes:[...new Set(incoerentes)],
    cenarios:cenarios.length, total:TODAS.length};
});
t('toda regra dispara quando a sua configuração mínima ocorre',
  ALC.inalcancaveis.length===0, ALC.total+' regras · inalcançáveis: '
  +(ALC.inalcancaveis.join(', ')||'nenhuma'));
t('uma regra dispara exatamente quando atinge o seu mínimo de sinais',
  ALC.incoerentes.length===0,
  ALC.cenarios+' conjuntos de fatos × '+ALC.total+' regras · incoerências: '
  +(ALC.incoerentes.slice(0,3).join(' | ')||'nenhuma'));

/* ============ 4 · dado ausente, empate e contradição ============ */
console.log('\n### dado ausente, empate e evidência contrária');
const AUS = await pg.evaluate(()=>{
  /* fatos todos indisponíveis: nada pode ser inferido */
  const vazio={};
  ['elem.mercury','casa.mercury','asp.mercury-jupiter','balanco.modo',
   'balanco.elemento','angularidade.significadores','casa3.ocupantes',
   'casa9.ocupantes','casa10.ocupantes','casa1.ocupantes','dig.saturn',
   'dig.mercury','dispositor.mercury','casa9.regente','casa10.regente']
   .forEach(id=>{vazio[id]={id, ok:false, valor:null, desc:null};});
  const r=ponteAplicar(REGRAS_MBTI, vazio);
  /* nenhum apoio deve aparecer, e nenhum valor neutro deve ser inventado */
  const A=ponteApoios(r);
  const inventouNeutro=Object.values(A).some(x=>x.apoio===50||x.contra===50);
  return {testemunhos:r.testemunhos.length, indeterminadas:r.indeterminadas.length,
    apoios:Object.keys(A).length, inventouNeutro,
    dizDesconhecido:r.indeterminadas.every(i=>/DESCONHECIDA/.test(i.porque))};
});
t('sem dados, nenhuma hipótese é produzida', AUS.testemunhos===0 && AUS.apoios===0);
t('sem dados, as regras ficam registradas como indeterminadas',
  AUS.indeterminadas>0, AUS.indeterminadas+' regras');
t('dado ausente permanece DESCONHECIDO, sem neutro artificial',
  AUS.dizDesconhecido && !AUS.inventouNeutro);

/* ============ 5 · os mal-entendidos recusados ============ */
console.log('\n### recusas declaradas');
const REC = await pg.evaluate(()=>{
  const todos=JUNG_MAL_ENTENDIDOS.concat(MBTI_MAL_ENTENDIDOS,SOC_MAL_ENTENDIDOS)
    .map(m=>m.erro.toLowerCase());
  const tem=re=>todos.some(x=>re.test(x));
  /* e o que importa mais: nenhuma regra usa esses atalhos na sua hipótese */
  const hipoteses=REGRAS_MBTI.concat(REGRAS_SOC).map(r=>r.hipotese+' '+r.distincao).join(' ');
  return {
    sociabilidade:tem(/sociáve|sociabilidade/),
    emotivo:tem(/emotiv/),
    disciplina:tem(/disciplinad/),
    abstrato:tem(/abstrato/),
    assertivo:tem(/assertiv/),
    memoria:tem(/memória/),
    conversao:tem(/converter letras/),
    notacao:tem(/intj/),
    forcaValoracao:tem(/forte como posição valorada|posição forte/),
    /* as distinções aparecem nas próprias regras, não só numa lista */
    regraDizNaoAssertividade:/assertividade/i.test(hipoteses),
    regraDizNaoEficiencia:/efici/i.test(hipoteses),
    regraDizNaoMemoria:/memória/i.test(hipoteses),
    regraDizNaoDisciplina:/disciplina/i.test(hipoteses)};
});
t('“sociável ⇒ E” está recusado explicitamente', REC.sociabilidade);
t('“emotivo ⇒ F” está recusado explicitamente', REC.emotivo);
t('“disciplinado ⇒ J” está recusado explicitamente', REC.disciplina);
t('“abstrato ⇒ N” está recusado explicitamente', REC.abstrato);
t('“assertivo ⇒ Se” está recusado explicitamente', REC.assertivo);
t('“boa memória ⇒ Si” está recusado explicitamente', REC.memoria);
t('converter letras em sociotipo está recusado explicitamente', REC.conversao);
t('ler INTj como INTJ está recusado explicitamente', REC.notacao);
t('confundir força com valoração está recusado explicitamente', REC.forcaValoracao);
t('as regras repetem a distinção assertividade × percepção', REC.regraDizNaoAssertividade);
t('as regras repetem a distinção eficiência × critério', REC.regraDizNaoEficiencia);
t('as regras repetem a distinção memória × referência interna', REC.regraDizNaoMemoria);
t('as regras repetem a distinção disciplina × trato externo', REC.regraDizNaoDisciplina);

/* ============ 6 · sobre mapas reais ============ */
async function carrega(url){
  await pg.goto(BASE,{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(700);
  await pg.click('#nav button[data-p="dados"]');
  await pg.fill('#imp-url', url);
  await pg.click('#imp-run');
  await pg.waitForTimeout(12000);
  return pg.evaluate(()=>typeof NATAL!=='undefined' && !!NATAL);
}
for(const Mp of MAPAS){
  console.log('\n### '+Mp.nome);
  const carregou=await carrega(Mp.url);
  t('o mapa foi construído', carregou);
  if(!carregou)continue;

  const R = await pg.evaluate(()=>{
    const I=tipInferir(true);
    /* a alternativa vem da COMPARAÇÃO, e não de inverter uma letra */
    const p=I.mbti.ranking[0], a=I.mbti.ranking[1];
    const difLetras=p&&a?p.tipo.split('').filter((c,i)=>c!==a.tipo[i]).length:0;
    /* o que importa não é quantas LETRAS diferem, e sim quantas POSIÇÕES da
       estrutura diferem: o método antigo invertia a dicotomia mais frágil e
       devolvia sempre um vizinho de uma letra; o novo escolhe o segundo
       colocado da comparação, que difere em posições de pilha. */
    const difPosicoes=p&&a
      ? p.estrutura.pilha.filter((x,i)=>x!==a.estrutura.pilha[i]).length : 0;
    /* e a alternativa é, por construção, o segundo colocado da ordenação */
    const altEhSegundo=!I.mbti.alternativa
      || (I.mbti.ranking[1] && I.mbti.alternativa.tipo===I.mbti.ranking[1].tipo);
    /* estabilidade: a hipótese natal não pode mudar com a data consultada */
    const antes=I.mbti.ranking.map(x=>x.tipo).join()+'|'+I.soc.ranking.map(x=>x.tipo).join();
    const marcos=[];
    [1990,2005,2020,2035].forEach(y=>{
      try{ tempoState(new Date(Date.UTC(y,5,1))); }catch(e){}
      const J=tipInferir(true);
      marcos.push(J.mbti.ranking.map(x=>x.tipo).join()+'|'+J.soc.ranking.map(x=>x.tipo).join());
    });
    /* sensibilidade a pesos: perturbar os pesos das posições e ver se troca o topo */
    const orig={...INF_MBTI_PESO_POSICAO};
    const topos=new Set();
    [[1.0,0.7],[1.1,0.65],[0.9,0.75],[1.0,0.6],[1.0,0.8]].forEach(([d,x])=>{
      INF_MBTI_PESO_POSICAO.dom=d; INF_MBTI_PESO_POSICAO.aux=x;
      topos.add(inferirMBTI(I.fatos).ranking[0].tipo);
    });
    Object.assign(INF_MBTI_PESO_POSICAO, orig);
    return {
      difLetras, difPosicoes, altEhSegundo,
      principalTipo:p?p.tipo:null, altTipo:a?a.tipo:null,
      estavel:marcos.every(m=>m===antes), marcos:[...new Set(marcos)].length,
      toposSobPerturbacao:[...topos],
      instavelDeclarado:!I.mbti.sensibilidade.estavel,
      /* nenhuma porcentagem de certeza em lugar nenhum da saída */
      semPercentagem:!/\d+\s?%/.test(JSON.stringify({
        r:I.mbti.ranking, s:I.soc.ranking, sens:I.mbti.sensibilidade})),
      /* testemunhos trazem origem e versão */
      comOrigem:I.mbti.testemunhos.every(x=>x.origens&&x.origens.length&&x.versao),
      /* evidência correlacionada é atenuada dentro da mesma família */
      atenuou:I.mbti.testemunhos.concat(I.soc.testemunhos)
        .filter(x=>x.ordemNaFamilia>1).every(x=>x.atenuacao<1),
      /* a comparação entre sistemas não força concordância — e, quando falta
         um dos candidatos, diz que falta em vez de inferi-lo do outro */
      naoForca: I.pontes.indisponivel
        ? /não há o que comparar|nenhum é inferido a partir do outro/.test(I.pontes.nota||'')
        : !!I.pontes.leituraDivergencia,
      pontesIndisponivel:I.pontes.indisponivel,
      insufMbti:I.mbti.insuficiente, insufSoc:I.soc.insuficiente
    };
  });
  t('a alternativa é o segundo colocado da comparação, e não uma letra invertida',
    R.altEhSegundo && R.difPosicoes>=2,
    (R.principalTipo||'—')+' × '+(R.altTipo||'—')+' — '+R.difLetras
    +' letra(s), mas '+R.difPosicoes+' de 4 posições da pilha diferem');
  t('a hipótese natal não muda ao navegar entre 1990 e 2035', R.estavel,
    R.marcos+' resultado(s) distinto(s) em 4 datas');
  t('quando a ordenação é instável, isso é declarado',
    R.toposSobPerturbacao.length===1 || R.instavelDeclarado,
    'topo sob perturbação de pesos: '+R.toposSobPerturbacao.join(', '));
  t('nenhuma porcentagem de certeza é emitida', R.semPercentagem);
  t('todo testemunho traz origem e versão', R.comOrigem);
  t('evidência correlacionada entra atenuada', R.atenuou);
  t('a divergência entre sistemas é lida, não corrigida', R.naoForca,
    R.pontesIndisponivel?'um dos candidatos está em evidência insuficiente — declarado, não inferido':'');

  /* autorrelato: divergente, preservado, e sem tocar no mapa */
  const AU = await pg.evaluate(()=>{
    const antesSol=NATAL.pts.sun.lon, antesAsc=NATAL.asc;
    const I=tipInferir(true);
    const natal=I.mbti.ranking[0].tipo;
    /* responde de modo a favorecer uma estrutura DIFERENTE da natal */
    const oposto=natal==='INTP'?'ESFJ':'INTP';
    const E=MBTI_ESTRUTURAS[oposto];
    AUTO_PERGUNTAS.filter(q=>q.sistema==='mbti').forEach(q=>{
      const querA=E.pilha.indexOf(q.a.processo)>=0
        || (q.a.processo==='orientacao:externa'&&E.dom[1]==='e')
        || (q.a.processo==='trato:julgamento'&&oposto[3]==='J');
      autoResponder(q.id, querA?'a':'b');
    });
    /* uma resposta “depende” e uma “não sei” */
    const qs=AUTO_PERGUNTAS.filter(q=>q.sistema==='socionica');
    autoResponder(qs[0].id,'depende'); autoResponder(qs[1].id,'naosei');
    autoTipoDeclarado('mbti','ENFP');
    const H=autoHipotese('mbti'), Hs=autoHipotese('socionica');
    const C=autoConfronto(I.mbti,I.soc);
    const linha=C.linhas.find(l=>l.sistema==='mbti');
    const depois=tipInferir(true);
    const r={
      mapaIntacto: NATAL.pts.sun.lon===antesSol && NATAL.asc===antesAsc,
      natalIntacta: depois.mbti.ranking[0].tipo===natal,
      hipoteseRespostas: H.ranking?H.ranking[0].tipo:null,
      declarado: linha.declarado,
      /* os três lugares existem e são independentes. O lugar natal pode
         estar vazio quando a evidência é insuficiente — o que é o
         comportamento correto, e não uma fusão das fontes. */
      guardaAsTres: ('natal' in linha)&&('respostas' in linha)&&('declarado' in linha)
        && !!linha.respostas && !!linha.declarado
        && linha.respostas!==linha.declarado,
      registraDivergencia: linha.divergencias.length>0,
      naoCulpa: !/resist|sombra|falta de autoconhecimento/.test(linha.leitura)
                || /não é resistência/.test(linha.leitura),
      dependeIgnorado: Hs.ignoradas.some(i=>/varia com a situação/.test(i.porque)),
      naoSeiIgnorado: Hs.ignoradas.some(i=>/não saber/.test(i.porque))
    };
    try{localStorage.removeItem('agx_autorrelato');}catch(e){}
    return r;
  });
  t('nenhuma resposta altera dado astronômico', AU.mapaIntacto);
  t('a hipótese natal não é reescrita pelo autorrelato', AU.natalIntacta);
  t('as três fontes ficam guardadas em separado', AU.guardaAsTres,
    'natal · respostas '+(AU.hipoteseRespostas||'—')+' · declarado '+(AU.declarado||'—'));
  t('a divergência entre fontes é registrada', AU.registraDivergencia);
  t('divergir não é lido como resistência nem sombra', AU.naoCulpa);
  t('“depende” não vira meio ponto para cada lado', AU.dependeIgnorado);
  t('“não sei” permanece desconhecido', AU.naoSeiIgnorado);
}

/* ============ 7 · interface e compatibilidade ============ */
console.log('\n### interface, backup e responsividade');
await pg.click('#nav button[data-p="tipos"]');
await pg.waitForTimeout(900);
const SEC=['visao','funcoes','hipoteses','comparacao','refinar','fontes'];
for(const s of SEC){
  const existe=await pg.$('[data-tptab="'+s+'"]');
  if(!existe){ t('a seção '+s+' existe', false); continue; }
  await pg.click('[data-tptab="'+s+'"]'); await pg.waitForTimeout(450);
  const n=await pg.evaluate(()=>document.getElementById('tp-body').innerText.trim().length);
  t('a seção '+s+' monta com conteúdo', n>150, n+' caracteres');
}
const OUTROS=await pg.evaluate(()=>['enn','disc','socoa','guia']
  .every(id=>!!document.querySelector('[data-tptab="'+id+'"]')));
t('Eneagrama, DISC, Socoa e Guia continuam acessíveis', OUTROS);

const BK=await pg.evaluate(()=>{
  /* o autorrelato entra no backup e volta pela restauração */
  autoResponder('q.ti-te','a');
  const k=autoChave();                       // chave por mapa, não global
  const p=bkColeta();
  const tinha=!!p.dados[k];
  localStorage.removeItem(k);
  bkRestaurar(JSON.stringify(p),false);
  const voltou=(autoCarregar().respostas||{})['q.ti-te'];
  localStorage.removeItem(k);
  return {tinha, voltou:voltou&&voltou.valor==='a', chave:k};
});
t('o autorrelato entra no backup', BK.tinha, BK.chave);
t('a restauração devolve o autorrelato', BK.voltou);

for(const [w,h,nome] of [[390,844,'telemóvel'],[820,1180,'tablet'],[1440,900,'desktop']]){
  await pg.setViewportSize({width:w,height:h});
  await pg.waitForTimeout(400);
  const over=await pg.evaluate(()=>{
    const d=document.documentElement;
    return {h:d.scrollWidth-d.clientWidth,
      largura:Math.max(...[...document.querySelectorAll('#tp-body *')]
        .map(e=>e.getBoundingClientRect().right))};
  });
  t('sem rolagem horizontal em '+nome+' ('+w+'px)', over.h<=1, 'excesso '+over.h+'px');
}

console.log('\n'+ok+' asserções · '+fail+' falhas');
if(falhas.length) console.log('falhas:\n - '+falhas.join('\n - '));
console.log('ERROS DE PÁGINA: '+(errs.length?('\n'+errs.join('\n')):'(nenhum)'));
await b.close();
process.exit(fail||errs.length?1:0);
