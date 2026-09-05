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

/* Peso por posição: as posições do Ego são o que o tipo É; as do
   Super-Id são o que ele PROCURA. Um testemunho a favor de um
   elemento apoia um candidato sobretudo quando o candidato o põe
   no Ego — e, em medida menor e de outro sentido, quando o põe no
   Super-Id, porque ali o elemento é valorado mas fraco. Nas
   posições 3, 4, 7 e 8 o elemento não é valorado: testemunho forte
   a favor dele conta POUCO, e no caso da vulnerável conta CONTRA. */
const INF_SOC_PESO=[
  {n:1, peso:1.0,  sentido:'apoia'},
  {n:2, peso:0.75, sentido:'apoia'},
  {n:3, peso:0.1,  sentido:'apoia'},
  {n:4, peso:0.6,  sentido:'contraria'},
  {n:5, peso:0.2,  sentido:'apoia'},
  {n:6, peso:0.15, sentido:'apoia'},
  {n:7, peso:0.05, sentido:'apoia'},
  {n:8, peso:0.05, sentido:'apoia'}
];

function inferirSocionica(F){
  const fatos=F||ponteFatos();
  const res=ponteAplicar(REGRAS_SOC, fatos);
  const A=ponteApoios(res);
  const get=p=>A[p]||{apoio:0, contra:0, testemunhos:[], contraTestemunhos:[]};

  const racional=get('racionalidade:racional'), irracional=get('racionalidade:irracional');

  const avaliacoes=SOC_TIPOS.map(tipo=>{
    const M=SOC_MODELOS[tipo];
    let apoio=0, contra=0;
    const posicoes=[], contradicoes=[], sustentadas=[];
    INF_SOC_PESO.forEach(P=>{
      const el=M[P.n-1], a=get(el), meta=SOC_POSICOES[P.n-1];
      const temDado=a.apoio>0||a.contra>0;
      if(temDado){
        if(P.sentido==='apoia'){ apoio+=a.apoio*P.peso; contra+=a.contra*P.peso; }
        else {
          /* elemento na posição vulnerável: testemunho A FAVOR dele
             contraria o candidato, porque o modelo afirma justamente
             baixa capacidade de processar esse aspecto */
          contra+=a.apoio*P.peso; apoio+=a.contra*P.peso;
          if(a.apoio>0)contradicoes.push('o modelo põe '+el+' na posição '
            +meta.nome+' (fraca e não valorada), mas há testemunho a favor de '+el);
        }
        sustentadas.push({posicao:P.n, nome:meta.nome, elemento:el,
          bloco:meta.bloco, forca:meta.forca, valorada:meta.valorada,
          apoio:+(a.apoio).toFixed(2), contra:+(a.contra).toFixed(2),
          regras:a.testemunhos.map(t=>t.regra)});
      }
      posicoes.push({posicao:P.n, nome:meta.nome, alt:meta.alt, elemento:el,
        bloco:meta.bloco, anel:meta.anel, forca:meta.forca, valorada:meta.valorada,
        afirmadoPeloModelo:meta.o_que_o_modelo_diz,
        sustentadoPelosDados:temDado});
    });
    /* racionalidade: propriedade da função base do candidato */
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
    comparacoes:rank.length>1?compararSoc(rank[0],rank[1],A):[],
    sensibilidade:sensibilidadeSoc(avaliacoes),
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
function sensibilidadeSoc(avaliacoes){
  if(avaliacoes.length<2)return {estavel:true, nota:'sem candidatos suficientes'};
  const dif=avaliacoes[0].saldo-avaliacoes[1].saldo;
  const escala=Math.max(1,Math.abs(avaliacoes[0].saldo));
  const relativa=dif/escala, estavel=relativa>=0.15;
  return {estavel, margem:+dif.toFixed(2), relativa:+relativa.toFixed(3),
    nota: estavel
      ? 'A ordenação resiste a variações pequenas de peso.'
      : 'ORDENAÇÃO INSTÁVEL: variação pequena nos pesos trocaria '
        +avaliacoes[0].tipo+' por '+avaliacoes[1].tipo+'.'};
}
