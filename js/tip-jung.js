/* ============================================================
   TIP-JUNG.JS — as definições junguianas, isoladas.

   Este arquivo guarda SÓ o que Jung propôs, na sua própria
   linguagem e nos seus próprios limites. Não contém MBTI, não
   contém Sociônica, e não contém nenhuma correspondência
   astrológica. Os outros módulos citam este; nenhum o reescreve.

   Por que separar: MBTI e Sociônica nasceram depois, com
   objetivos diferentes, e mudaram o sentido dos termos. Chamar
   qualquer um dos dois de “Jung” é o erro que este módulo existe
   para impedir.

   Fonte: C. G. Jung, «Tipos Psicológicos» (Psychologische Typen,
   1921), sobretudo o capítulo X — descrição geral dos tipos — e o
   capítulo XI, de definições. As paráfrases abaixo são do app; o
   que é citação está marcado como tal. Não há citação atribuída a
   página que eu não possa sustentar.
   ============================================================ */

const JUNG_FONTE={
  id:'jung-1921', versao:'1.0',
  obra:'C. G. Jung, «Tipos Psicológicos» (1921)',
  loc:'cap. X (descrição geral dos tipos) e cap. XI (definições)',
  natureza:'texto-fonte',
  limite:'Jung descreve funções e atitudes como tendências de orientação da '
    +'consciência, observadas clinicamente. Não propôs teste, não propôs '
    +'ordenação em pilha de quatro posições, e não propôs dezesseis tipos '
    +'nomeados por sigla. Tudo isso é posterior e pertence a outros módulos.'
};

/* as quatro funções, antes de qualquer atitude */
const JUNG_FUNCOES={
  pensamento:{
    nome:'Pensamento', classe:'racional',
    o_que_e:'a função que estabelece relações conceituais e chega a uma '
      +'conclusão por juízo — diz o que a coisa É, ligando-a a outras.',
    nao_e:'não é inteligência, não é ausência de afeto, e não é competência '
      +'técnica. Uma pessoa de função pensamento pode ser afetiva e pouco hábil.'},
  sentimento:{
    nome:'Sentimento', classe:'racional',
    o_que_e:'também uma função de juízo, mas que avalia por valor: aceita ou '
      +'rejeita, atribui importância. Decide quanto a coisa VALE.',
    nao_e:'não é emoção, não é sentimentalismo e não é sensibilidade. Jung '
      +'distingue expressamente sentimento (função de juízo) de afeto '
      +'(estado do corpo e da psique). Uma pessoa muito emotiva pode ter o '
      +'sentimento como função inferior — e é justamente aí que a emoção '
      +'costuma transbordar sem crivo.'},
  sensacao:{
    nome:'Sensação', classe:'irracional',
    o_que_e:'a percepção pelos sentidos: registra que algo É, sem interpretar. '
      +'Dá o dado bruto.',
    nao_e:'não é superficialidade, não é materialismo e não é falta de '
      +'profundidade. É um modo de perceber, não um nível de qualidade.'},
  intuicao:{
    nome:'Intuição', classe:'irracional',
    o_que_e:'a percepção pelo inconsciente: apreende possibilidades, origens e '
      +'desdobramentos que não estão dados aos sentidos.',
    nao_e:'não é criatividade, não é inteligência e não é acerto. Intuição '
      +'pode errar sistematicamente; é um canal de percepção, não uma virtude.'}
};

/* as duas atitudes */
const JUNG_ATITUDES={
  introvertida:{
    nome:'Introvertida (i)',
    o_que_e:'a função se orienta pelo fator subjetivo: o critério de referência '
      +'está dentro, na disposição do sujeito diante do objeto.',
    nao_e:'não é timidez, não é isolamento e não é pouca conversa. '
      +'Um introvertido, no sentido de Jung, pode ser socialmente '
      +'desenvolto — a questão é de ONDE vem o critério, não de quanto '
      +'contato há.'},
  extrovertida:{
    nome:'Extrovertida (e)',
    o_que_e:'a função se orienta pelo objeto: o critério de referência está '
      +'nas condições dadas de fora.',
    nao_e:'não é sociabilidade, não é entusiasmo e não é falar muito. '
      +'A confusão entre extroversão e sociabilidade é o mal-entendido '
      +'mais comum do vocabulário todo.'}
};

/* a divisão racional/irracional — de Jung, e frequentemente confundida
   com o par J/P do MBTI, que é outra coisa (ver tip-mbti.js) */
const JUNG_RACIONALIDADE={
  racional:{funcoes:['pensamento','sentimento'],
    o_que_e:'funções de JUÍZO: chegam a uma conclusão, seja por conceito '
      +'(pensamento), seja por valor (sentimento).'},
  irracional:{funcoes:['sensacao','intuicao'],
    o_que_e:'funções de PERCEPÇÃO: recebem, sem julgar. “Irracional” aqui '
      +'não significa ilógico nem desatinado — significa que não procede '
      +'por juízo.'}
};

/* as oito combinações — o alcance efetivo do que Jung nomeou */
const JUNG_OITO=[
  ['pensamento','introvertida','Pensamento introvertido'],
  ['pensamento','extrovertida','Pensamento extrovertido'],
  ['sentimento','introvertida','Sentimento introvertido'],
  ['sentimento','extrovertida','Sentimento extrovertido'],
  ['sensacao','introvertida','Sensação introvertida'],
  ['sensacao','extrovertida','Sensação extrovertida'],
  ['intuicao','introvertida','Intuição introvertida'],
  ['intuicao','extrovertida','Intuição extrovertida']
];

/* o que Jung diz sobre função dominante e inferior — sem pilha de quatro */
const JUNG_DOMINANCIA={
  o_que_e:'Jung fala de uma função principal, que dá o feitio da consciência, '
    +'e de uma função inferior, a sua oposta, que permanece pouco '
    +'diferenciada e irrompe de forma tosca. Fala também de funções '
    +'auxiliares, que não podem ser da mesma classe da principal — '
    +'uma função de juízo é auxiliada por uma de percepção, e vice-versa.',
  o_que_nao_diz:'Jung NÃO estabeleceu uma sequência fixa de quatro funções '
    +'com atitudes alternadas, nem uma terceira função com atitude '
    +'determinada. A “pilha” de quatro posições é uma construção posterior, '
    +'de convenções específicas do meio MBTI, e está declarada como tal '
    +'em tip-mbti.js. Modelos de oito funções são posteriores ainda.',
  fonte:JUNG_FONTE
};

/* mal-entendidos que este app se recusa a cometer — a lista é usada
   na interface e nos testes */
const JUNG_MAL_ENTENDIDOS=[
  {erro:'extroversão = sociabilidade',
   porque:'a atitude diz de onde vem o critério (objeto ou sujeito), não '
     +'quanto contato social a pessoa tem ou procura.'},
  {erro:'sentimento = emotividade',
   porque:'o sentimento é função de JUÍZO por valor. A emotividade é afeto. '
     +'Jung separa os dois explicitamente.'},
  {erro:'pensamento = ausência de afeto',
   porque:'a função de juízo predominante nada diz sobre a intensidade '
     +'afetiva de quem a usa.'},
  {erro:'intuição = inteligência ou criatividade',
   porque:'intuição é um canal de percepção, e pode ser sistematicamente '
     +'imprecisa.'},
  {erro:'sensação = superficialidade',
   porque:'perceber pelos sentidos é um modo de acesso ao real, não um '
     +'grau de profundidade.'},
  {erro:'racional/irracional de Jung = J/P do MBTI',
   porque:'a divisão de Jung classifica FUNÇÕES (juízo × percepção). O par '
     +'J/P do MBTI é uma dicotomia de preferência declarada, e na convenção '
     +'MBTI serve também para localizar qual função é extrovertida. São '
     +'camadas diferentes, e a Sociônica tem ainda uma terceira '
     +'(racionalidade pela função base).'}
];
