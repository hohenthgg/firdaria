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

  const avaliacoes=MBTI_TIPOS.map(tipo=>{
    const E=MBTI_ESTRUTURAS[tipo];
    let apoio=0, contra=0;
    const porProcesso=[], contradicoes=[];
    ['dom','aux','tert','inf'].forEach(pos=>{
      const proc=E[pos], w=INF_MBTI_PESO_POSICAO[pos], a=get(proc);
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
    sensibilidade:sensibilidadeMBTI(avaliacoes)
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

/* ---------- sensibilidade a pesos ----------
   Se pequenas mudanças de peso trocam o primeiro colocado, a
   ordenação é instável e o app diz isso, em vez de exibir a
   troca como descoberta. */
function sensibilidadeMBTI(avaliacoes){
  if(avaliacoes.length<2)return {estavel:true, nota:'sem candidatos suficientes'};
  const topo=avaliacoes[0], seg=avaliacoes[1];
  const dif=topo.saldo-seg.saldo;
  const escala=Math.max(1,Math.abs(topo.saldo));
  const relativa=dif/escala;
  const estavel=relativa>=0.15;
  return {estavel, margem:+dif.toFixed(2), relativa:+relativa.toFixed(3),
    nota: estavel
      ? 'A ordenação resiste a variações pequenas de peso: o primeiro colocado '
        +'está '+(relativa*100).toFixed(0)+'% acima do segundo na escala do próprio saldo.'
      : 'ORDENAÇÃO INSTÁVEL: uma variação pequena nos pesos trocaria o primeiro '
        +'colocado ('+topo.tipo+') pelo segundo ('+seg.tipo+'). A diferença entre '
        +'eles não deve ser lida como resultado.'};
}
