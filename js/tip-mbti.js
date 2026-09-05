/* ============================================================
   TIP-MBTI.JS — as definições do MBTI, isoladas, com a convenção
   de dinâmica de tipo NOMEADA.

   O MBTI mede quatro preferências declaradas. A “pilha” de quatro
   funções não é uma medida: é uma construção teórica que o meio
   MBTI adotou para explicar as preferências. Há mais de uma
   convenção em circulação, e elas discordam justamente na terceira
   posição. Este módulo declara qual adota e por quê.

   O que este arquivo NÃO faz:
     · não trata os símbolos Ti/Te/Fi/Fe/Ni/Ne/Si/Se como se
       valessem também para a Sociônica — lá são outros conceitos,
       definidos em tip-socionica.js;
     · não apresenta a pilha como se fosse Jung literal;
     · não converte tipo MBTI em sociotipo.

   Fonte não verificada: a página de «type dynamics» do site oficial
   myersbriggs.org, indicada como referência, NÃO pôde ser aberta
   deste ambiente (bloqueio do proxy de rede). A sua formulação
   específica não foi conferida, e nada dela é citado. O que segue
   é a convenção descrita por extenso, para poder ser corrigida.
   ============================================================ */

const MBTI_FONTE={
  id:'mbti-dicotomias', versao:'1.0',
  natureza:'convenção declarada',
  o_que_mede:'quatro preferências declaradas pela própria pessoa: E–I, S–N, '
    +'T–F e J–P. O instrumento original é um questionário de autorrelato.',
  naoVerificado:'A página https://www.myersbriggs.org/unique-features-of-'
    +'myers-briggs/type-dynamics-overview/ , indicada como referência, não '
    +'pôde ser aberta deste ambiente (bloqueio do proxy de rede). Nenhuma '
    +'frase dela é citada aqui. A convenção adotada está escrita por extenso '
    +'abaixo para que possa ser conferida e corrigida.',
  aviso:'Este app não aplica o instrumento MBTI, não é licenciado por '
    +'ninguém e não produz resultado psicometricamente validado. O que '
    +'produz são hipóteses exploratórias.'
};

/* ---------- as quatro dicotomias, com o que NÃO são ---------- */
const MBTI_DICOTOMIAS={
  EI:{par:['E','I'], nome:'Energia — Extroversão / Introversão',
    o_que_e:'para onde a atenção se dirige preferencialmente: para o mundo '
      +'exterior de pessoas e coisas, ou para o mundo interior de ideias e '
      +'impressões.',
    nao_e:'não é sociabilidade, não é quantidade de amigos, não é timidez e '
      +'não é gosto por festa. Pessoas de preferência I podem ser hábeis e '
      +'ativas socialmente; pessoas de preferência E podem ser reservadas.'},
  SN:{par:['S','N'], nome:'Percepção — Sensação / iNtuição',
    o_que_e:'por qual via a informação é preferencialmente captada: pelo '
      +'dado concreto e verificável, ou pelo padrão, pela relação e pelo '
      +'que está implícito.',
    nao_e:'não é inteligência, não é grau de escolaridade, não é gosto por '
      +'assuntos abstratos e não é criatividade. Um pesquisador pode ser S; '
      +'um artista pode ser S.'},
  TF:{par:['T','F'], nome:'Decisão — Pensamento / Sentimento',
    o_que_e:'por qual critério a decisão é preferencialmente tomada: por '
      +'coerência lógica e consequência impessoal, ou por valor e efeito '
      +'sobre as pessoas envolvidas.',
    nao_e:'não é emotividade contra frieza. Ambos são critérios de decisão. '
      +'Uma pessoa T pode ser intensamente emotiva; uma pessoa F pode ser '
      +'rigorosa e pouco expressiva.'},
  JP:{par:['J','P'], nome:'Trato com o mundo externo — Julgamento / Percepção',
    o_que_e:'se a pessoa prefere lidar com o mundo externo por um processo de '
      +'decisão (fechar, resolver) ou por um processo de percepção (manter '
      +'aberto, colher mais). Na convenção de dinâmica de tipo, é também o '
      +'que localiza QUAL processo é o extrovertido.',
    nao_e:'não é disciplina contra desorganização, não é pontualidade e não '
      +'é limpeza. Uma pessoa P pode ser extremamente disciplinada dentro do '
      +'seu campo; uma pessoa J pode viver no caos material.'}
};

/* ---------- a convenção de dinâmica de tipo adotada ---------- */
const MBTI_CONVENCAO={
  id:'atitudes-alternadas', versao:'1.0',
  nome:'pilha de quatro posições com atitudes alternadas',
  regra:[
    'A dicotomia J/P indica qual dos dois processos — o de percepção (S/N) '
      +'ou o de julgamento (T/F) — é usado no mundo externo: J indica o de '
      +'julgamento; P, o de percepção.',
    'A dicotomia E/I indica se o processo dominante é o que a pessoa usa por '
      +'fora ou o outro: em E, o dominante é o processo externo; em I, o '
      +'dominante é o interno, e o processo externo passa a auxiliar.',
    'A terceira função é a oposta da auxiliar; a quarta (inferior) é a oposta '
      +'da dominante.',
    'Nesta convenção, terceira e quarta recebem atitudes ALTERNADAS em relação '
      +'às duas primeiras — daí INTP sair Ti–Ne–Si–Fe.'
  ],
  divergencia:'A atitude da terceira função é o ponto em que as convenções '
    +'discordam. Isabel Myers não a fixou de modo inequívoco; a alternância '
    +'aqui adotada é a que se popularizou no meio MBTI a partir de autores '
    +'como Harold Grant. Outra convenção corrente dá à terceira função a '
    +'mesma atitude da dominante (INTP como Ti–Ne–Se–Fe). O app adota a '
    +'alternância, e a declara: não é consenso, é escolha.',
  nao_e_jung:'Esta pilha não está em Jung. Jung fala de função principal, '
    +'auxiliar de outra classe, e inferior oposta — sem sequência fixa de '
    +'quatro com atitudes determinadas. Ver tip-jung.js.',
  nao_e_socionica:'Os símbolos Ti, Te, Fi, Fe, Ni, Ne, Si e Se aqui '
    +'pertencem a este vocabulário. A Sociônica usa os mesmos símbolos para '
    +'conceitos próprios, com outra definição e outra estrutura. Coincidência '
    +'gráfica não é identidade conceitual.',
  fonte:MBTI_FONTE
};

/* ---------- as dezesseis estruturas ----------
   Derivadas pela regra acima, e não digitadas à mão, para que a
   estrutura e a regra não possam divergir em silêncio. */
function mbtiEstrutura(tipo){
  const [ei,sn,tf,jp]=tipo.split('');
  const perc=sn, julg=tf;
  const externoEhPercepcao=(jp==='P');
  const domEhPercepcao=(ei==='E')===externoEhPercepcao;
  const at=externo=>externo?'e':'i';
  /* o processo externo leva 'e'; o outro leva 'i' */
  const dom = domEhPercepcao ? perc+at(ei==='E') : julg+at(ei==='E');
  const aux = domEhPercepcao ? julg+at(ei!=='E') : perc+at(ei!=='E');
  const op={N:'S',S:'N',T:'F',F:'T'};
  const alterna=x=>x==='e'?'i':'e';
  const tert=op[aux[0]]+alterna(aux[1]);
  const inf =op[dom[0]]+alterna(dom[1]);
  return {tipo, dom, aux, tert, inf, pilha:[dom,aux,tert,inf],
    processoExterno: domEhPercepcao===(ei==='E') ? dom : aux,
    convencao:MBTI_CONVENCAO.id};
}
const MBTI_TIPOS=['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISTP','ESTJ','ESTP','ISFJ','ISFP','ESFJ','ESFP'];
const MBTI_ESTRUTURAS=(()=>{const o={};MBTI_TIPOS.forEach(t=>o[t]=mbtiEstrutura(t));return o;})();

/* ---------- os oito processos, na definição MBTI ----------
   Descrições de PROCESSO — o que a função faz —, não de traço de
   personalidade nem de habilidade. */
const MBTI_PROCESSOS={
  Ni:{nome:'iNtuição introvertida', classe:'percepção', atitude:'i',
    processo:'converge impressões numa única leitura interna do que está em '
      +'curso: o que isto vai dar, o que se repete por baixo dos casos.',
    nao_e:'não é acerto profético, não é introspecção e não é inteligência.'},
  Ne:{nome:'iNtuição extrovertida', classe:'percepção', atitude:'e',
    processo:'diverge a partir do que está dado: cada fato abre ramificações, '
      +'analogias e alternativas ainda não escolhidas.',
    nao_e:'não é criatividade artística e não é dispersão.'},
  Si:{nome:'Sensação introvertida', classe:'percepção', atitude:'i',
    processo:'compara o dado presente com o registro interno acumulado da '
      +'experiência: como foi antes, o que difere agora.',
    nao_e:'não é boa memória — memória é capacidade; isto é um modo de '
      +'referenciar o presente. E não é apego a rotina.'},
  Se:{nome:'Sensação extrovertida', classe:'percepção', atitude:'e',
    processo:'registra o campo concreto no momento em que ele ocorre, sem '
      +'passar por referência interna.',
    nao_e:'não é assertividade, não é coragem e não é gosto por esporte. '
      +'Assertividade é comportamento; isto é percepção.'},
  Ti:{nome:'Pensamento introvertido', classe:'julgamento', atitude:'i',
    processo:'decide por coerência interna do sistema: define termos, procura '
      +'a contradição, recusa concluir enquanto a estrutura não fecha.',
    nao_e:'não é rigor acadêmico e não é frieza.'},
  Te:{nome:'Pensamento extrovertido', classe:'julgamento', atitude:'e',
    processo:'decide por critério externo verificável: o que funciona, o que '
      +'a medida mostra, o que produz o resultado combinado.',
    nao_e:'não é eficiência como virtude nem competência gerencial — '
      +'eficiência é resultado, isto é critério de decisão.'},
  Fi:{nome:'Sentimento introvertido', classe:'julgamento', atitude:'i',
    processo:'decide por hierarquia interna de valor: isto me é aceitável, '
      +'isto trai o que considero importante.',
    nao_e:'não é sensibilidade emocional e não é bondade.'},
  Fe:{nome:'Sentimento extrovertido', classe:'julgamento', atitude:'e',
    processo:'decide por valor compartilhado e efeito no campo entre as '
      +'pessoas: o que sustenta o acordo, o que preserva o vínculo do grupo.',
    nao_e:'não é simpatia, não é carisma e não é dependência de aprovação.'}
};

/* ---------- o que cada posição da pilha significa ----------
   Isto é o que o MODELO afirma sobre um tipo — não uma medida
   feita no mapa de ninguém. A distinção é dita na interface. */
const MBTI_POSICOES={
  dom:{rotulo:'dominante', o_que_o_modelo_diz:'o processo que dá o feitio da '
    +'consciência: opera continuamente e é o mais confiável.'},
  aux:{rotulo:'auxiliar', o_que_o_modelo_diz:'processo da outra classe, que '
    +'equilibra o dominante e abre a via oposta (interna ou externa).'},
  tert:{rotulo:'terciária', o_que_o_modelo_diz:'processo de apoio, menos '
    +'diferenciado; a sua atitude é o ponto em que as convenções divergem.'},
  inf:{rotulo:'inferior', o_que_o_modelo_diz:'processo oposto ao dominante, '
    +'pouco diferenciado; segundo o modelo, aparece de forma tosca sob '
    +'pressão. É afirmação do modelo, e não observação feita aqui.'}
};

/* ---------- mal-entendidos recusados, usados na UI e nos testes ---------- */
const MBTI_MAL_ENTENDIDOS=[
  {erro:'sociável ⇒ E', porque:'E–I é direção da atenção, não quantidade de '
    +'contato. Sociabilidade tem causas várias — inclusive Fe auxiliar num tipo I.'},
  {erro:'emotivo ⇒ F', porque:'F é critério de decisão por valor. Emoção é '
    +'afeto. O modelo prevê inclusive emoção pouco regulada quando a função '
    +'de sentimento é INFERIOR.'},
  {erro:'analítico ⇒ T', porque:'análise é uma operação, praticada por '
    +'qualquer tipo. T diz por qual critério se DECIDE.'},
  {erro:'disciplinado ⇒ J', porque:'J–P descreve o trato com o mundo externo; '
    +'disciplina é comportamento aprendido e exigido pelo ofício.'},
  {erro:'abstrato ⇒ N', porque:'o conteúdo dos interesses (filosofia, arte, '
    +'engenharia) não é o processo cognitivo. S e N descrevem por qual via '
    +'a informação entra.'},
  {erro:'assertivo ⇒ Se', porque:'Se é percepção do campo concreto presente. '
    +'Assertividade é conduta, e pode vir de Te, de Fe ou de treino.'},
  {erro:'eficiente ⇒ Te', porque:'eficiência é resultado observável; Te é '
    +'critério de decisão. Pode-se ser eficiente por Si ou por hábito.'},
  {erro:'boa memória ⇒ Si', porque:'memória é capacidade cognitiva geral, '
    +'medida por outros meios.'},
  {erro:'introspectivo ⇒ Ni', porque:'introspecção é atividade, não processo '
    +'perceptivo convergente. Fi e Ti também introspeccionam, de outros modos.'}
];

/* frase curta por tipo — do próprio app, para leitura, não definição */
const MBTI_FRASE_CURTA={
 INTJ:'Compreensão estrutural, planejamento independente e execução por modelo interno.',
 INTP:'Desmontar sistemas até a coerência interna fechar, antes de afirmar.',
 ENTJ:'Comando por objetivo: enxerga a estrutura e mobiliza para o resultado.',
 ENTP:'Abrir possibilidades e testá-las pelo choque, sem apego ao estabelecido.',
 INFJ:'Ler o subtexto humano e trabalhar, em silêncio, por uma leitura de longo prazo.',
 INFP:'Fidelidade a um núcleo próprio de valor, mais em obra e escolha do que em discurso.',
 ENFJ:'Conduzir pessoas: percebe potencial e organiza o ambiente para ele.',
 ENFP:'Possibilidades humanas em aberto, com exigência de autenticidade.',
 ISTJ:'Responsabilidade metódica: o combinado se cumpre, pelo modo já provado.',
 ISFJ:'Cuidado concreto e constância: protege pessoas e arranjos que funcionam.',
 ESTJ:'Organizar o mundo visível: critério claro, execução firme, resultado medido.',
 ESFJ:'Manter o tecido comum funcionando: presença, acolhimento e ordem afetiva.',
 ISTP:'Entender o mecanismo pelas mãos: análise aplicada ao concreto, na hora certa.',
 ISFP:'Valor pessoal e forma vividos no presente, sem alarde e sem submissão.',
 ESTP:'Ação no tempo exato: lê a cena, age, corrige em movimento.',
 ESFP:'Presença viva: transforma o momento em experiência compartilhada.'};
