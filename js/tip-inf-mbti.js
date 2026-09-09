/* ============================================================
   TIP-INF-MBTI.JS — inferência MBTI por comparação de ESTRUTURAS.

   O que mudou em relação ao que havia antes: o app não gera mais
   quatro letras a partir de médias e depois lhes cola uma pilha.
   Agora avalia cada uma das dezesseis ESTRUTURAS COMPLETAS contra
   os testemunhos disponíveis, e ordena. A alternativa não é a
   inversão da letra mais frágil: é o segundo colocado da própria
   comparação, que pode diferir do primeiro em duas ou três letras.

   Também existe um estado legítimo de EVIDÊNCIA INSUFICIENTE. Se
   os testemunhos não separam os candidatos, é isso que se diz.

   O que a interface precisa poder responder, e que este módulo
   calcula explicitamente:
     · por que INTP antes de INTJ;
     · o que favorece Ti em vez de Te;
     · o que favorece Ne em vez de Ni;
     · que evidência contraria o candidato principal;
     · que observação distinguiria os dois primeiros.
   ============================================================ */

const INF_MBTI_META={
  id:'inferencia-mbti', versao:'1.0',
  metodo:'comparação de estruturas completas · ordenação interna',
  aviso:'A ordenação é INTERNA ao modelo: serve para dizer qual estrutura o '
    +'conjunto de testemunhos acomoda melhor. Não é probabilidade, não é '
    +'porcentagem de certeza e não é resultado de instrumento validado.',
  ponte:PONTE_META
};

/* peso de cada posição da pilha: o que a estrutura afirma sobre o
   tipo é mais forte nas duas primeiras posições. As inferiores
   entram com sinal pequeno, e a inferior NÃO é usada para
   transformar “falta de evidência” em prova. */
const INF_MBTI_PESO_POSICAO={dom:1.0, aux:0.7, tert:0.15, inf:0.1};

function inferirMBTI(F){
  const fatos=F||ponteFatos();
  const res=ponteAplicar(REGRAS_MBTI, fatos);
  const A=ponteApoios(res);
  const get=p=>A[p]||{apoio:0, contra:0, testemunhos:[], contraTestemunhos:[]};

  /* orientação e trato externo entram como testemunhos sobre a
     ESTRUTURA, e não como letras decididas de antemão */
  const orientExt=get('orientacao:externa'), orientInt=get('orientacao:interna');
  const tratoJ=get('trato:julgamento'), tratoP=get('trato:percepcao');

  /* a avaliação recebe os PESOS como parâmetro, para que a análise de
     sensibilidade possa recalculá-la com outros valores — antes os pesos
     eram lidos de uma constante e nada podia ser perturbado */
  const avaliarCom=pesos=>MBTI_TIPOS.map(tipo=>{
    const E=MBTI_ESTRUTURAS[tipo];
    let apoio=0, contra=0;
    const porProcesso=[], contradicoes=[];
    ['dom','aux','tert','inf'].forEach(pos=>{
      const proc=E[pos], w=pesos[pos], a=get(proc);
      if(a.apoio||a.contra){
        /* testemunho a favor do processo apoia a estrutura na medida
           em que a estrutura o coloca em posição desenvolvida */
        const ganho=a.apoio*w, perda=a.contra*w;
        apoio+=ganho; contra+=perda;
        porProcesso.push({posicao:pos, processo:proc, peso:w,
          apoio:+ganho.toFixed(2), contra:+perda.toFixed(2),
          testemunhos:a.testemunhos.map(t=>t.regra),
          contraTestemunhos:a.contraTestemunhos.map(t=>t.regra)});
        if(perda>0&&(pos==='dom'||pos==='aux'))
          contradicoes.push('a estrutura põe '+proc+' em posição '
            +MBTI_POSICOES[pos].rotulo+', mas há testemunho contrário a '+proc
            +' ('+a.contraTestemunhos.map(t=>t.regra).join(', ')+')');
      }
    });
    /* orientação: a estrutura afirma dominante extrovertida ou introvertida */
    const domExt=E.dom[1]==='e';
    const oa=domExt?orientExt:orientInt, oc=domExt?orientInt:orientExt;
    apoio+=oa.apoio; contra+=oc.apoio;
    if(oc.apoio>0)contradicoes.push('a estrutura tem dominante '
      +(domExt?'extrovertida':'introvertida')+', e há testemunho na direção oposta');
    /* trato externo: J ou P */
    const ehJ=tipo[3]==='J';
    const ta=ehJ?tratoJ:tratoP, tc=ehJ?tratoP:tratoJ;
    apoio+=ta.apoio; contra+=tc.apoio;
    if(tc.apoio>0)contradicoes.push('a estrutura é '+(ehJ?'J':'P')
      +' no trato externo, e há testemunho na direção oposta');
    return {tipo, estrutura:E, apoio:+apoio.toFixed(2), contra:+contra.toFixed(2),
      saldo:+(apoio-contra).toFixed(2), porProcesso, contradicoes};
  });

  const avaliacoes=avaliarCom(INF_MBTI_PESO_POSICAO);
  avaliacoes.sort((a,b)=>b.saldo-a.saldo||b.apoio-a.apoio);
  const rank=avaliacoes.slice(0,3);
  const evidenciaTotal=res.testemunhos.length;
  const margem=rank.length>1?+(rank[0].saldo-rank[1].saldo).toFixed(2):0;

  /* estado de evidência insuficiente — declarado, e não disfarçado */
  const insuficiente = evidenciaTotal<3 || rank[0].saldo<=0
    || (rank.length>1 && margem<0.5);
  const porqueInsuficiente = evidenciaTotal<3
      ? 'poucos testemunhos aplicáveis ('+evidenciaTotal+')'
    : rank[0].saldo<=0 ? 'nenhuma estrutura reúne mais apoio do que contradição'
    : margem<0.5 ? 'os dois primeiros candidatos estão praticamente empatados '
        +'(diferença de '+margem.toFixed(2)+')'
    : null;

  return {
    meta:INF_MBTI_META,
    testemunhos:res.testemunhos, indeterminadas:res.indeterminadas,
    apoios:A, cobertura:res.cobertura,
    ranking:rank, todas:avaliacoes,
    principal:insuficiente?null:rank[0],
    alternativa:insuficiente?null:(rank[1]||null),
    terceira:rank[2]||null,
    margem, insuficiente, porqueInsuficiente,
    comparacoes:rank.length>1?compararMBTI(rank[0],rank[1],A):[],
    sensibilidade:sensibilidadeMBTI(avaliacoes, avaliarCom)
  };
}

/* ---------- por que o primeiro, e não o segundo ---------- */
function compararMBTI(a,b,A){
  if(!a||!b)return [];
  const out=[];
  const posOrd=['dom','aux','tert','inf'];
  posOrd.forEach(pos=>{
    const pa=a.estrutura[pos], pb=b.estrutura[pos];
    if(pa===pb)return;
    const ea=A[pa]||{apoio:0,contra:0,testemunhos:[]},
          eb=A[pb]||{apoio:0,contra:0,testemunhos:[]};
    if(!ea.apoio&&!eb.apoio&&!ea.contra&&!eb.contra){
      out.push({posicao:pos, a:pa, b:pb, veredito:'indeciso',
        texto:'na posição '+MBTI_POSICOES[pos].rotulo+' os dois diferem ('+pa
          +' contra '+pb+'), e não há testemunho que separe um do outro.'});
      return;
    }
    const favorA=ea.apoio-ea.contra, favorB=eb.apoio-eb.contra;
    out.push({posicao:pos, a:pa, b:pb,
      veredito: favorA>favorB?'favorece '+a.tipo:favorB>favorA?'favorece '+b.tipo:'empate',
      texto:'na posição '+MBTI_POSICOES[pos].rotulo+', '+a.tipo+' propõe '+pa
        +' e '+b.tipo+' propõe '+pb+'. '
        +(favorA>favorB
          ? 'O que sustenta '+pa+': '+(ea.testemunhos.map(t=>t.hipotese).join(' ')||'—')
          : favorB>favorA
          ? 'O que sustentaria '+pb+': '+(eb.testemunhos.map(t=>t.hipotese).join(' ')||'—')
          : 'os testemunhos se equilibram.'),
      apoioA:+favorA.toFixed(2), apoioB:+favorB.toFixed(2)});
  });
  /* que observação distinguiria os dois — pergunta, não afirmação */
  const dif=posOrd.filter(p=>a.estrutura[p]!==b.estrutura[p]);
  const chave=dif.length?dif[0]:null;
  out.distingue = chave
    ? 'A diferença decisiva está na posição '+MBTI_POSICOES[chave].rotulo+': '
      +a.tipo+' a preenche com '+a.estrutura[chave]+', '+b.tipo+' com '
      +b.estrutura[chave]+'. Observar em qual desses dois modos a pessoa opera '
      +'quando não está sob pressão nem cumprindo exigência de ofício separaria '
      +'os dois candidatos melhor do que qualquer testemunho do mapa.'
    : 'As duas estruturas coincidem nas quatro posições.';
  return out;
}

/* ---------- sensibilidade a pesos, de verdade ----------
   A versão anterior comparava a distância entre o primeiro e o segundo
   colocados e chamava isso de estabilidade. Isso é MARGEM: mede uma
   folga na ordenação atual, não o efeito de mudar os pesos. Agora os
   pesos são efetivamente perturbados e a ordenação é RECALCULADA em
   cada variante; o que se relata é quantas variantes trocam o primeiro
   colocado, e quais. As duas medidas são exibidas com nomes distintos. */
const INF_MBTI_VARIANTES=[
  {nome:'padrão',                dom:1.0, aux:0.7,  tert:0.15, inf:0.1},
  {nome:'auxiliar mais pesada',  dom:1.0, aux:0.9,  tert:0.15, inf:0.1},
  {nome:'auxiliar mais leve',    dom:1.0, aux:0.5,  tert:0.15, inf:0.1},
  {nome:'dominante mais pesada', dom:1.3, aux:0.7,  tert:0.15, inf:0.1},
  {nome:'dominante mais leve',   dom:0.8, aux:0.7,  tert:0.15, inf:0.1},
  {nome:'inferiores ignoradas',  dom:1.0, aux:0.7,  tert:0,    inf:0},
  {nome:'inferiores dobradas',   dom:1.0, aux:0.7,  tert:0.30, inf:0.2},
  {nome:'pilha achatada',        dom:1.0, aux:1.0,  tert:0.5,  inf:0.5}
];
function sensibilidadeMBTI(avaliacoes, avaliarCom){
  if(avaliacoes.length<2)return {estavel:true, margem:0,
    nota:'sem candidatos suficientes para avaliar.'};
  const topo=avaliacoes[0].tipo;
  const margem=+(avaliacoes[0].saldo-avaliacoes[1].saldo).toFixed(2);
  if(typeof avaliarCom!=='function')
    return {estavel:null, margem, variantes:0,
      nota:'MARGEM entre o primeiro e o segundo: '+margem.toFixed(2)
        +'. A análise de sensibilidade não pôde ser executada nesta chamada.'};
  const topos={};
  INF_MBTI_VARIANTES.forEach(v=>{
    const r=avaliarCom(v).sort((a,b)=>b.saldo-a.saldo||b.apoio-a.apoio);
    const t=r[0]?r[0].tipo:'—';
    (topos[t]=topos[t]||[]).push(v.nome);
  });
  const distintos=Object.keys(topos);
  const trocam=INF_MBTI_VARIANTES.length-(topos[topo]?topos[topo].length:0);
  const estavel=trocam===0;
  return {
    estavel, margem, variantes:INF_MBTI_VARIANTES.length, trocam,
    topos: Object.entries(topos).map(([t,vs])=>({tipo:t, variantes:vs})),
    nota: estavel
      ? 'ORDENAÇÃO ESTÁVEL: os pesos das quatro posições foram perturbados em '
        +INF_MBTI_VARIANTES.length+' combinações (dominante e auxiliar mais pesadas '
        +'e mais leves, posições inferiores zeradas, dobradas e achatadas) e '
        +topo+' permanece em primeiro em todas. A margem para o segundo colocado '
        +'é de '+margem.toFixed(2)+'.'
      : 'ORDENAÇÃO INSTÁVEL: em '+trocam+' das '+INF_MBTI_VARIANTES.length
        +' combinações de pesos o primeiro colocado muda ('
        +distintos.join(', ')+'). A diferença entre esses candidatos não deve ser '
        +'lida como resultado — depende de quanto se decide pesar cada posição, e '
        +'esse peso é escolha do app, não medida.'
  };
}
