/* ============================================================
   TIP-PONTES.JS — pontes e diferenças entre os sistemas.

   Compara candidatos que foram produzidos SEPARADAMENTE, por
   motores que não se consultam. Não converte, não harmoniza e não
   “corrige” um resultado pelo outro. Quando MBTI e Sociônica
   apontam para estruturas que não se correspondem, isso é exibido
   como o que é: dois modelos diferentes aplicados aos mesmos
   testemunhos frágeis.

   O que a comparação mostra:
     · onde o vocabulário se parece;
     · onde as definições divergem, apesar do mesmo símbolo;
     · quais funções/elementos ficam em posições distintas;
     · que testemunhos sustentam cada lado, em cada sistema;
     · o que impede a equivalência direta.
   ============================================================ */

const PONTES_META={
  id:'pontes-e-diferencas', versao:'1.0',
  regra:'Resultados divergentes entre sistemas NÃO são acertados para '
    +'concordar. Cada motor produz o seu candidato a partir das suas próprias '
    +'regras, e a comparação é feita depois, sem retroalimentação.',
  porque_nao_converte:'MBTI e Sociônica usam os mesmos oito símbolos para '
    +'conceitos definidos por grades diferentes, e os arranjam em estruturas '
    +'diferentes (pilha de quatro posições × Modelo A de oito). Uma tabela de '
    +'conversão não traduziria nada: apenas renomearia o resultado do primeiro '
    +'sistema, apagando o segundo.'
};

/* Diferenças de definição para o mesmo símbolo — o núcleo do problema */
const PONTES_SIMBOLOS=[
  {simbolo:'Si',
   mbti:MBTI_PROCESSOS.Si.processo,
   socionica:SOC_ELEMENTOS.Si.o_que_e,
   diferenca:'A divergência é grande. No MBTI, Si referencia o presente contra '
     +'a experiência acumulada. Na Sociônica, Si é sensação de conforto e '
     +'estado físico, sem componente de memória. Chamar os dois de “Si” esconde '
     +'duas definições que quase não se tocam.'},
  {simbolo:'Ne',
   mbti:MBTI_PROCESSOS.Ne.processo,
   socionica:SOC_ELEMENTOS.Ne.o_que_e,
   diferenca:'Aparentam-se, mas não coincidem: no MBTI, Ne é o movimento de '
     +'divergir a partir do dado; na Sociônica, é informação sobre o potencial '
     +'e as propriedades inerentes do objeto.'},
  {simbolo:'Ni',
   mbti:MBTI_PROCESSOS.Ni.processo,
   socionica:SOC_ELEMENTOS.Ni.o_que_e,
   diferenca:'No MBTI, Ni converge impressões numa leitura interna. Na '
     +'Sociônica, Ni é especificamente o aspecto TEMPORAL da informação — '
     +'sequência, prazo, desdobramento.'},
  {simbolo:'Se',
   mbti:MBTI_PROCESSOS.Se.processo,
   socionica:SOC_ELEMENTOS.Se.o_que_e,
   diferenca:'No MBTI, Se é percepção do campo concreto presente. Na '
     +'Sociônica, Se carrega força e território — a capacidade de ocupar '
     +'posição —, componente que a definição MBTI não tem.'},
  {simbolo:'Ti',
   mbti:MBTI_PROCESSOS.Ti.processo,
   socionica:SOC_ELEMENTOS.Ti.o_que_e,
   diferenca:'Próximos, e ainda assim distintos: o Ti sociônico trata das '
     +'relações lógicas ENTRE OBJETOS (classificação, hierarquia, distância), '
     +'enquanto o Ti do MBTI descreve o critério de coerência interna de quem decide.'},
  {simbolo:'Te',
   mbti:MBTI_PROCESSOS.Te.processo,
   socionica:SOC_ELEMENTOS.Te.o_que_e,
   diferenca:'O Te sociônico é o aspecto factual e procedimental da informação; '
     +'o Te do MBTI é um critério de decisão por medida externa. Um descreve '
     +'informação, o outro descreve o modo de julgar.'},
  {simbolo:'Fe',
   mbti:MBTI_PROCESSOS.Fe.processo,
   socionica:SOC_ELEMENTOS.Fe.o_que_e,
   diferenca:'Na Sociônica, Fe é o estado emocional como informação '
     +'transmissível; no MBTI, é um critério de decisão por valor '
     +'compartilhado. Não é a mesma afirmação sobre a pessoa.'},
  {simbolo:'Fi',
   mbti:MBTI_PROCESSOS.Fi.processo,
   socionica:SOC_ELEMENTOS.Fi.o_que_e,
   diferenca:'O Fi sociônico trata da distância entre pessoas e do que se deve '
     +'a quem; o Fi do MBTI, de uma hierarquia interna de valor. Sobrepõem-se '
     +'em parte, e apenas em parte.'}
];

/* Pares que costumam ser tratados como equivalentes, e não são.
   Servem de exemplo na interface. */
const PONTES_EXEMPLOS=[
  {par:['INTP','LII'], sistemas:['mbti','socionica'],
   parecido:'ambos põem Ti na posição de maior desenvolvimento e um elemento '
     +'intuitivo ao lado dele (Ne).',
   diferente:'INTP descreve Ti–Ne–Si–Fe em quatro posições, com Fe inferior. '
     +'LII descreve oito posições, com Fe SUGESTIVA — fraca, porém valorada e '
     +'buscada no outro, que é afirmação diferente de “função inferior”. '
     +'A comparação estrutural é legítima; a identidade não.',
   impede:'“Função inferior” (MBTI) e “função sugestiva” (Sociônica) não são '
     +'o mesmo conceito. E LII tem ainda ignorada (Te) e demonstrativa (Ni), '
     +'posições que a pilha de quatro não possui.'},
  {par:['INTJ','ILI'], sistemas:['mbti','socionica'],
   parecido:'ambos põem um elemento intuitivo introvertido na primeira posição '
     +'e um lógico extrovertido na segunda.',
   diferente:'a notação de quatro letras da Sociônica escreve ILI como INTp — '
     +'com “p” minúsculo, indicando irracionalidade pela função base. Ler isso '
     +'como INTP do MBTI é erro de leitura; e ler ILI como INTJ tampouco se '
     +'sustenta, porque a letra final responde a perguntas diferentes.',
   impede:'as convenções de notação divergem justamente na última letra.'},
  {par:['EIE','ENFJ'], sistemas:['socionica','mbti'],
   parecido:'ambos põem Fe em primeiro lugar e Ni em segundo.',
   diferente:'a coincidência de ordem não estende a identidade ao resto: o '
     +'Modelo A de EIE afirma Ti sugestivo e Se mobilizador, e o app não tem '
     +'como derivar isso da pilha ENFJ, que descreve Se terciária e Ti inferior. '
     +'“Terciária/inferior” e “sugestiva/mobilizadora” não são traduções '
     +'uma da outra.',
   impede:'as duas primeiras posições coincidirem não autoriza igualar o resto '
     +'da estrutura, nem afirmar que a pessoa é “a mesma coisa” nos dois sistemas.'},
  {par:['INTP','INTJ'], sistemas:['mbti','mbti'],
   parecido:'três letras iguais, e por isso são confundidos com frequência.',
   diferente:'as estruturas não têm NENHUM processo na mesma posição: '
     +'INTP é Ti–Ne–Si–Fe; INTJ é Ni–Te–Fi–Se. Uma letra de diferença muda a '
     +'estrutura inteira — razão pela qual este app deixou de gerar a '
     +'alternativa invertendo a letra mais frágil.',
   impede:'proximidade de sigla não é proximidade de estrutura.'},
  {par:['LII','ILI'], sistemas:['socionica','socionica'],
   parecido:'as mesmas três primeiras letras na notação sociônica — INTj e '
     +'INTp —, o que faz os dois passarem por variantes um do outro.',
   diferente:'LII tem base Ti e é racional; ILI tem base Ni e é irracional. '
     +'Os elementos valorados diferem (Alfa: Ne Si Fe Ti; Gama: Se Ni Te Fi), e '
     +'portanto os dois quase não compartilham o que buscam.',
   impede:'a semelhança de sigla esconde quadras diferentes.'}
];

/* comparação efetiva entre os dois resultados desta sessão */
function pontesComparar(infMbti, infSoc){
  const M=infMbti&&infMbti.principal, S=infSoc&&infSoc.principal;
  const out={meta:PONTES_META, mbti:M?M.tipo:null, soc:S?S.tipo:null,
    indisponivel:(!M||!S), linhas:[], simbolos:[], testemunhos:{}, exemplos:PONTES_EXEMPLOS};
  if(!M||!S){
    out.nota='Falta pelo menos um dos dois candidatos '
      +((!M?'(MBTI: evidência insuficiente) ':'')+(!S?'(Sociônica: evidência insuficiente)':''))
      +'. Sem os dois, não há o que comparar — e nenhum é inferido a partir do outro.';
    return out;
  }
  const pilha=M.estrutura.pilha, modelo=S.modelo;
  /* onde o mesmo símbolo aparece nos dois, e em que posição */
  const posMbti={}; ['dom','aux','tert','inf'].forEach(p=>{posMbti[M.estrutura[p]]=MBTI_POSICOES[p].rotulo;});
  const posSoc={}; modelo.forEach((el,i)=>{posSoc[el]=SOC_POSICOES[i].nome;});
  const comuns=pilha.filter(x=>modelo.indexOf(x)>=0);
  comuns.forEach(el=>{
    const pm=posMbti[el], ps=posSoc[el];
    const meta=SOC_POSICOES.find(p=>p.nome===ps);
    out.linhas.push({elemento:el, mbti:pm, socionica:ps,
      mesmoLugar: (pm==='dominante'&&ps==='base')||(pm==='auxiliar'&&ps==='criativa'),
      texto:'«'+el+'» aparece nos dois candidatos: em '+M.tipo+' como função '
        +pm+', em '+S.tipo+' como função '+ps
        +(meta?(' ('+meta.forca+', '+(meta.valorada?'valorada':'não valorada')+')'):'')
        +'. As posições descrevem coisas diferentes, e o símbolo comum não as iguala.'});
  });
  /* símbolos presentes num sistema e ausentes no outro */
  pilha.filter(x=>modelo.indexOf(x)<0).forEach(el=>{
    out.linhas.push({elemento:el, mbti:posMbti[el], socionica:null,
      texto:'«'+el+'» está na estrutura de '+M.tipo+' ('+posMbti[el]+') e não '
        +'aparece no Modelo A de '+S.tipo+' — a estrutura sociônica usa os oito '
        +'elementos, e este ocupa ali outra posição no candidato correspondente.'});
  });
  /* diferenças de definição para os símbolos efetivamente em jogo */
  const emJogo=new Set(pilha.concat(modelo.slice(0,4)));
  out.simbolos=PONTES_SIMBOLOS.filter(s=>emJogo.has(s.simbolo));
  /* testemunhos que sustentam cada lado, por sistema */
  out.testemunhos={
    mbti:(infMbti.testemunhos||[]).map(t=>({regra:t.regra, hipotese:t.hipotese,
      favorece:t.favorece.map(x=>x[0]).join(', ')})),
    socionica:(infSoc.testemunhos||[]).map(t=>({regra:t.regra, hipotese:t.hipotese,
      favorece:t.favorece.map(x=>x[0]).join(', ')}))
  };
  out.impedimento='O que impede a equivalência direta: as definições dos '
    +'elementos divergem (ver acima), as estruturas têm tamanhos diferentes '
    +'(quatro posições contra oito), e os conceitos de posição não se traduzem '
    +'— “inferior” não é “sugestiva”, “terciária” não é “mobilizadora”, e '
    +'força não é valoração. Além disso, os dois candidatos foram produzidos '
    +'por conjuntos de regras distintos, aplicados a fatores distintos do mapa.';
  out.divergem = comuns.length===0 || !out.linhas.some(l=>l.mesmoLugar);
  out.leituraDivergencia = out.divergem
    ? 'Os dois sistemas apontaram para estruturas que não se correspondem. '
      +'Isso NÃO é um erro a corrigir: é o resultado esperado de aplicar dois '
      +'modelos diferentes a evidência exploratória. Nenhum dos dois foi '
      +'ajustado para concordar com o outro.'
    : 'Os dois sistemas apontaram para estruturas que se assemelham nas '
      +'primeiras posições. Convergência entre dois modelos alimentados pelos '
      +'mesmos fatores do mesmo mapa não é confirmação independente: as regras '
      +'diferem, mas o mapa é um só.';
  return out;
}
