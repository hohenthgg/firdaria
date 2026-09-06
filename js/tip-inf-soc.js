/* ============================================================
   TIP-INF-SOC.JS — inferência sociônica INDEPENDENTE.

   Não há aqui nenhuma conversão de letras do MBTI. O resultado
   deste módulo é produzido a partir das regras próprias da ponte
   sociônica (REGRAS_SOC), que partem das DEFINIÇÕES DA ESCOLA
   para os oito elementos, e é confrontado com as posições do
   Modelo A.

   Consequência esperada e desejada: este módulo pode chegar a um
   tipo que não “corresponde” ao candidato MBTI. Isso não é um erro
   a corrigir. Os dois sistemas definem os elementos de modos
   diferentes e os arranjam em estruturas diferentes; convergência
   forçada seria o defeito, não a divergência.

   O que a estrutura AFIRMA e o que os dados SUSTENTAM ficam
   separados: o Modelo A de um candidato descreve oito posições,
   mas os testemunhos disponíveis costumam tocar apenas duas ou
   três. A interface diz quais.
   ============================================================ */

const INF_SOC_META={
  id:'inferencia-socionica', versao:'1.0',
  escola:SOC_FONTE.escola,
  metodo:'avaliação das posições do Modelo A contra testemunhos próprios',
  semConversao:'Este resultado NÃO é derivado do resultado MBTI. Não existe '
    +'no app nenhuma tabela que converta quatro letras em sociotipo.',
  aviso:'A ordenação é interna ao modelo. Não é probabilidade nem certeza.',
  ponte:PONTE_META
};

/* ---------- as três dimensões, que o Modelo A não confunde ----------
   A versão anterior somava um único "apoio ao elemento X" em posições
   que AFIRMAM COISAS DIFERENTES. Isso é um erro de categoria: a posição
   base diz que X é forte E valorado; a ignorada diz que X é forte e NÃO
   valorado; a sugestiva diz que X é fraco e valorado, buscado no outro.
   Um mesmo número não pode sustentar as três.

   Agora cada testemunho declara a que dimensão pertence, e só influencia
   as posições cuja afirmação é dessa dimensão:

     capacidade · a faculdade opera com força
                  → apoia as posições fortes (1, 2, 7, 8)
                  → contraria as fracas    (3, 4, 5, 6)
     valoração  · o tipo orienta-se por esse aspecto
                  → apoia as posições valoradas    (1, 2, 5, 6)
                  → contraria as não valoradas     (3, 4, 7, 8)
     busca      · o tipo recebe esse aspecto do outro (5 e 6)
                  → SEM FONTE DE EVIDÊNCIA neste app. Nada no mapa
                    distingue "buscar no outro" de "valorar"; por isso o
                    app não afirma essa dimensão a partir do mapa, e as
                    posições 5 e 6 vêm do modelo depois que o Ego se fixa.

   Consequência declarada: capacidade SOZINHA não separa o Ego (forte e
   valorado) do Id (forte e não valorado). Essa separação depende de
   evidência de valoração — e, quando ela falta, o app diz que o par
   ficou indeterminado em vez de escolher. */
const INF_SOC_DIMENSOES={
  capacidade:{
    rotulo:'capacidade', peso:1.0,
    afirma:'a faculdade opera com força',
    apoia:  m=>m.forca==='forte',
    contra: m=>m.forca==='fraca'},
  valoracao:{
    rotulo:'valoração', peso:1.0,
    afirma:'o tipo orienta-se por esse aspecto',
    apoia:  m=>m.valorada,
    contra: m=>!m.valorada},
  busca:{
    rotulo:'busca', peso:0,
    afirma:'o tipo recebe esse aspecto do outro',
    semEvidencia:'Nenhum fato do mapa distingue buscar de valorar. O app não '
      +'afirma esta dimensão a partir do mapa.',
    apoia: m=>m.n===5||m.n===6,
    contra: ()=>false}
};

function inferirSocionica(F){
  const fatos=F||ponteFatos();
  const res=ponteAplicar(REGRAS_SOC, fatos);
  const A=ponteApoios(res);
  const get=p=>A[p]||{apoio:0, contra:0, testemunhos:[], contraTestemunhos:[]};

  /* apoio por (elemento × dimensão) — não por elemento apenas */
  const D={};
  const põeD=(el,dim,campo,w,t)=>{
    D[el]=D[el]||{};
    D[el][dim]=D[el][dim]||{apoio:0, contra:0, testemunhos:[], contraTestemunhos:[]};
    D[el][dim][campo]+=w;
    D[el][dim][campo==='apoio'?'testemunhos':'contraTestemunhos'].push(t);
  };
  res.testemunhos.forEach(t=>{
    const dim=t.dimensao||'capacidade';
    t.favorece.forEach(([el,w])=>{ if(SOC_ELEMENTOS[el])põeD(el,dim,'apoio',w,t); });
    t.contraria.forEach(([el,w])=>{ if(SOC_ELEMENTOS[el])põeD(el,dim,'contra',w,t); });
  });
  const dimDe=(el,dim)=>(D[el]&&D[el][dim])||{apoio:0,contra:0,testemunhos:[],contraTestemunhos:[]};
  const temDimensao=dim=>Object.values(D).some(x=>x[dim]&&(x[dim].apoio||x[dim].contra));
  const temCapacidade=temDimensao('capacidade'), temValoracao=temDimensao('valoracao');

  const racional=get('racionalidade:racional'), irracional=get('racionalidade:irracional');

  const avaliarCom=pesosDim=>SOC_TIPOS.map(tipo=>{
    const M=SOC_MODELOS[tipo];
    let apoio=0, contra=0;
    const posicoes=[], contradicoes=[], sustentadas=[];
    SOC_POSICOES.forEach((meta,i)=>{
      const el=M[i];
      let tocada=false;
      const detalhe=[];
      ['capacidade','valoracao'].forEach(dim=>{
        const ev=dimDe(el,dim); if(!ev.apoio&&!ev.contra)return;
        const w=(pesosDim[dim]!=null?pesosDim[dim]:INF_SOC_DIMENSOES[dim].peso);
        if(!w)return;
        tocada=true;
        const DEF=INF_SOC_DIMENSOES[dim];
        if(DEF.apoia(meta)){ apoio+=ev.apoio*w; contra+=ev.contra*w;
          detalhe.push(dim+' a favor'); }
        else if(DEF.contra(meta)){ contra+=ev.apoio*w; apoio+=ev.contra*w;
          detalhe.push(dim+' contra');
          if(ev.apoio>0)contradicoes.push('o modelo põe «'+el+'» na posição '+meta.nome
            +' ('+meta.forca+', '+(meta.valorada?'valorada':'não valorada')
            +'), mas há testemunho de '+DEF.rotulo+' a favor de «'+el+'»'); }
      });
      if(tocada)sustentadas.push({posicao:meta.n, nome:meta.nome, elemento:el,
        bloco:meta.bloco, forca:meta.forca, valorada:meta.valorada,
        apoio:+(dimDe(el,'capacidade').apoio+dimDe(el,'valoracao').apoio).toFixed(2),
        contra:+(dimDe(el,'capacidade').contra+dimDe(el,'valoracao').contra).toFixed(2),
        dimensoes:detalhe,
        regras:[].concat(dimDe(el,'capacidade').testemunhos, dimDe(el,'valoracao').testemunhos)
                 .map(t=>t.regra)});
      posicoes.push({posicao:meta.n, nome:meta.nome, alt:meta.alt, elemento:el,
        bloco:meta.bloco, anel:meta.anel, forca:meta.forca, valorada:meta.valorada,
        afirmadoPeloModelo:meta.o_que_o_modelo_diz,
        sustentadoPelosDados:tocada, dimensoes:detalhe});
    });
    const R=socRacionalidade(tipo);
    const ra=R.racional?racional:irracional, rc=R.racional?irracional:racional;
    apoio+=ra.apoio; contra+=rc.apoio;
    if(rc.apoio>0)contradicoes.push('o candidato é '+R.rotulo
      +' (base '+R.base+'), e há testemunho na direção oposta');
    return {tipo, nome:SOC_NOMES[tipo], modelo:M, posicoes, sustentadas,
      quadra:socQuadra(tipo), racionalidade:R,
      apoio:+apoio.toFixed(2), contra:+contra.toFixed(2),
      saldo:+(apoio-contra).toFixed(2), contradicoes};
  });

  const avaliacoes=avaliarCom({});
  avaliacoes.sort((a,b)=>b.saldo-a.saldo||b.apoio-a.apoio);
  const rank=avaliacoes.slice(0,3);
  const evidenciaTotal=res.testemunhos.length;
  const margem=rank.length>1?+(rank[0].saldo-rank[1].saldo).toFixed(2):0;
  const insuficiente = evidenciaTotal<3 || rank[0].saldo<=0
    || (rank.length>1 && margem<0.4);
  const porqueInsuficiente = evidenciaTotal<3
      ? 'poucos testemunhos aplicáveis ('+evidenciaTotal+')'
    : rank[0].saldo<=0 ? 'nenhum candidato reúne mais apoio do que contradição'
    : margem<0.4 ? 'os dois primeiros candidatos estão praticamente empatados '
        +'(diferença de '+margem.toFixed(2)+')' : null;

  return {
    meta:INF_SOC_META,
    testemunhos:res.testemunhos, indeterminadas:res.indeterminadas,
    apoios:A, cobertura:res.cobertura,
    ranking:rank, todas:avaliacoes,
    principal:insuficiente?null:rank[0],
    alternativa:insuficiente?null:(rank[1]||null),
    margem, insuficiente, porqueInsuficiente,
    /* as dimensões que a evidência efetivamente cobre, e o que falta */
    dimensoes:{
      capacidade:temCapacidade, valoracao:temValoracao,
      busca:false,
      nota: (temCapacidade&&temValoracao)
        ? 'Há evidência de capacidade e de valoração. É a de valoração que '
          +'separa o Ego (forte E valorado) do Id (forte e NÃO valorado); sem '
          +'ela esse par ficaria indeterminado.'
        : temCapacidade
        ? 'Só há evidência de CAPACIDADE. Ela indica quais aspectos a pessoa '
          +'processaria com força, mas NÃO distingue o Ego do Id: as posições '
          +'1 e 2 e as 7 e 8 são todas fortes, e o que as separa é a valoração, '
          +'que aqui não tem apoio. O par permanece indeterminado.'
        : temValoracao
        ? 'Só há evidência de VALORAÇÃO. Ela indica o que a pessoa persegue, '
          +'mas não separa as posições valoradas fortes (1 e 2) das valoradas '
          +'fracas (5 e 6) — isto é, não distingue o que se domina do que se '
          +'busca no outro.'
        : 'Não há evidência em nenhuma das dimensões.',
      buscaNota:INF_SOC_DIMENSOES.busca.semEvidencia
    },
    comparacoes:rank.length>1?compararSoc(rank[0],rank[1],A):[],
    sensibilidade:sensibilidadeSoc(avaliacoes, avaliarCom),
    avisoRelacoes:SOC_RELACOES_AVISO
  };
}

/* ---------- por que este candidato, e não o outro ---------- */
function compararSoc(a,b,A){
  if(!a||!b)return [];
  const out=[];
  for(let i=0;i<8;i++){
    const ea=a.modelo[i], eb=b.modelo[i];
    if(ea===eb)continue;
    const meta=SOC_POSICOES[i];
    const sa=A[ea]||{apoio:0,contra:0,testemunhos:[]},
          sb=A[eb]||{apoio:0,contra:0,testemunhos:[]};
    if(i>1&&!sa.apoio&&!sb.apoio)continue;    // só as posições que os dados tocam
    out.push({posicao:i+1, nome:meta.nome, a:ea, b:eb,
      texto:'na posição '+meta.nome+' ('+meta.forca+', '
        +(meta.valorada?'valorada':'não valorada')+'), '+a.tipo+' põe '+ea
        +' e '+b.tipo+' põe '+eb+'. '
        +(sa.apoio>sb.apoio?('Há testemunho a favor de '+ea+'.')
          :sb.apoio>sa.apoio?('Há testemunho a favor de '+eb+'.')
          :'Nenhum testemunho separa os dois aqui.'),
      apoioA:+(sa.apoio-sa.contra).toFixed(2), apoioB:+(sb.apoio-sb.contra).toFixed(2)});
  }
  out.distingue='Os dois candidatos diferem já na função base ('+a.modelo[0]
    +' contra '+b.modelo[0]+'). Observar qual desses dois aspectos da informação '
    +'a pessoa processa sem esforço e sem ser solicitada — e qual só sustenta '
    +'quando cobrada — separaria os candidatos melhor do que o mapa.';
  return out;
}
/* ---------- sensibilidade sociônica, perturbando as dimensões ----------
   O que se varia aqui é o peso de cada DIMENSÃO — porque é essa a
   escolha do app que mais move o resultado: quanto vale a evidência de
   capacidade contra a de valoração. */
const INF_SOC_VARIANTES=[
  {nome:'padrão',                 capacidade:1.0, valoracao:1.0},
  {nome:'capacidade dominante',   capacidade:1.5, valoracao:0.5},
  {nome:'valoração dominante',    capacidade:0.5, valoracao:1.5},
  {nome:'só capacidade',          capacidade:1.0, valoracao:0},
  {nome:'só valoração',           capacidade:0,   valoracao:1.0},
  {nome:'ambas atenuadas',        capacidade:0.6, valoracao:0.6}
];
function sensibilidadeSoc(avaliacoes, avaliarCom){
  if(avaliacoes.length<2)return {estavel:true, margem:0,
    nota:'sem candidatos suficientes para avaliar.'};
  const topo=avaliacoes[0].tipo;
  const margem=+(avaliacoes[0].saldo-avaliacoes[1].saldo).toFixed(2);
  if(typeof avaliarCom!=='function')
    return {estavel:null, margem,
      nota:'MARGEM entre o primeiro e o segundo: '+margem.toFixed(2)
        +'. A análise de sensibilidade não pôde ser executada nesta chamada.'};
  const topos={};
  INF_SOC_VARIANTES.forEach(v=>{
    const r=avaliarCom(v).sort((a,b)=>b.saldo-a.saldo||b.apoio-a.apoio);
    const t=r[0]?r[0].tipo:'—';
    (topos[t]=topos[t]||[]).push(v.nome);
  });
  const trocam=INF_SOC_VARIANTES.length-(topos[topo]?topos[topo].length:0);
  return {
    estavel:trocam===0, margem, variantes:INF_SOC_VARIANTES.length, trocam,
    topos:Object.entries(topos).map(([t,vs])=>({tipo:t, variantes:vs})),
    nota: trocam===0
      ? 'ORDENAÇÃO ESTÁVEL: os pesos de capacidade e de valoração foram '
        +'perturbados em '+INF_SOC_VARIANTES.length+' combinações — inclusive '
        +'usando cada dimensão sozinha — e '+topo+' permanece em primeiro. '
        +'Margem para o segundo: '+margem.toFixed(2)+'.'
      : 'ORDENAÇÃO INSTÁVEL: em '+trocam+' das '+INF_SOC_VARIANTES.length
        +' combinações de pesos o primeiro colocado muda ('
        +Object.keys(topos).join(', ')+'). Quanto pesar capacidade contra '
        +'valoração é escolha do app, não medida — e essa escolha decide o '
        +'resultado aqui.'
  };
}
