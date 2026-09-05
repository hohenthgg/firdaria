/* ============================================================
   TIP-SOCIONICA.JS — a Sociônica pela sua própria estrutura.

   Sistema independente, criado por Aušra Augustinavičiūtė na
   Lituânia a partir dos anos 1970, com vocabulário próprio. Usa os
   mesmos símbolos gráficos do MBTI — Ti, Te, Fi, Fe, Ni, Ne, Si,
   Se —, e isso é uma armadilha: aqui eles nomeiam ASPECTOS DE
   INFORMAÇÃO definidos por outra grade conceitual, e ocupam
   posições de outra estrutura. Coincidência de símbolo não
   autoriza reaproveitar a definição do MBTI.

   Por isso este módulo:
     · define os oito elementos pela grade da própria Sociônica
       (estático/dinâmico × interno/externo × objetos/campos);
     · monta o Modelo A pelas suas relações de posição;
     · nomeia os tipos pelos códigos de três letras (LII, ILI,
       ILE, EIE …), que é a identificação primária;
     · declara a convenção quando exibe notação de quatro letras,
       porque INTj sociônico NÃO é INTJ do MBTI;
     · mantém dimensionalidade, sinais de função e Modelo G fora
       do Modelo A original — são camadas posteriores, de escolas
       distintas, e não se somam a ele em silêncio.
   ============================================================ */

const SOC_FONTE={
  id:'socionica-modelo-a', versao:'1.0',
  escola:'Modelo A, na formulação de Aušra Augustinavičiūtė',
  natureza:'definições da escola',
  obras:[{autor:'Aušra Augustinavičiūtė', obra:'Socionics / «A Dual Nature of Man»',
          loc:'a tipologia dos dezesseis tipos de metabolismo informacional'}],
  camadas_posteriores:'Dimensionalidade das funções (A. Bukalov), sinais de '
    +'função e o Modelo G (V. Gulenko) são desenvolvimentos POSTERIORES, de '
    +'escolas distintas. Não estão implementados aqui, e não devem ser '
    +'apresentados como parte do Modelo A original.',
  notacao:'A identificação primária é o código de três letras (LII, ILI, ILE, '
    +'EIE). A notação de quatro letras usada na Sociônica — INTj, INTp — segue '
    +'a convenção sociônica, em que a última letra indica racionalidade (j) ou '
    +'irracionalidade (p) pela FUNÇÃO BASE, e não a dicotomia J/P do MBTI. '
    +'Escrever INTj e ler INTJ é erro de leitura, não uma equivalência.',
  limite:'A Sociônica não é uma tradução do MBTI nem um seu refinamento. '
    +'Divergência entre os dois sistemas é esperada, e não um defeito a corrigir.'
};

/* ---------- os oito elementos, pela grade da Sociônica ----------
   Cada elemento é a interseção de três dicotomias da escola:
     estático × dinâmico · interno × externo · objetos × campos */
const SOC_ELEMENTOS={
  Ne:{nome:'Intuição das possibilidades', codigo:'Ne', simbolo:'⚫',
    grade:{estatica:'estático', plano:'interno', foco:'objetos'},
    o_que_e:'as propriedades potenciais e inerentes das coisas: o que algo É '
      +'por dentro, do que é capaz, em que pode se tornar. Informação sobre '
      +'potencial e essência.',
    classe:'percepção',
    nao_confundir:'na Sociônica este elemento trata do POTENCIAL do objeto; '
      +'no MBTI, Ne é a divergência a partir do dado. Aparentam-se, mas as '
      +'definições não coincidem.'},
  Ni:{nome:'Intuição do tempo', codigo:'Ni', simbolo:'⚪',
    grade:{estatica:'dinâmico', plano:'interno', foco:'campos'},
    o_que_e:'o desdobramento dos processos no tempo: sequência, ritmo, '
      +'momento oportuno, o que decorre do que. Informação sobre curso e prazo.',
    classe:'percepção',
    nao_confundir:'não é premonição nem introspecção; é o aspecto temporal '
      +'da informação.'},
  Se:{nome:'Sensação de força', codigo:'Se', simbolo:'■',
    grade:{estatica:'estático', plano:'externo', foco:'objetos'},
    o_que_e:'as qualidades externas e mobilizáveis dos objetos: forma, '
      +'presença, ocupação de espaço, capacidade de impor e resistir. '
      +'Informação sobre força e território.',
    classe:'percepção',
    nao_confundir:'não é agressividade como traço de caráter, nem gosto por '
      +'ação física.'},
  Si:{nome:'Sensação de conforto', codigo:'Si', simbolo:'□',
    grade:{estatica:'dinâmico', plano:'externo', foco:'campos'},
    o_que_e:'as relações sensoriais entre corpo e ambiente: estado físico, '
      +'harmonia, ritmo agradável, saúde e bem-estar. Informação sobre '
      +'sensação e acomodação.',
    classe:'percepção',
    nao_confundir:'não é memória do passado — este é um ponto em que a '
      +'definição sociônica se afasta claramente do Si do MBTI.'},
  Te:{nome:'Lógica dos negócios', codigo:'Te', simbolo:'▲',
    grade:{estatica:'dinâmico', plano:'externo', foco:'objetos'},
    o_que_e:'o funcionamento objetivo das coisas: fatos, procedimentos, '
      +'métodos de trabalho, custo e rendimento. Informação sobre ação eficaz '
      +'e sobre o que é factualmente o caso.',
    classe:'julgamento',
    nao_confundir:'não é competência gerencial; é o aspecto factual e '
      +'procedimental da informação.'},
  Ti:{nome:'Lógica estrutural', codigo:'Ti', simbolo:'△',
    grade:{estatica:'estático', plano:'interno', foco:'campos'},
    o_que_e:'as relações lógicas entre objetos: classificação, hierarquia, '
      +'regra, distância, sistema. Informação sobre estrutura e coerência '
      +'das relações.',
    classe:'julgamento',
    nao_confundir:'não é inteligência analítica.'},
  Fe:{nome:'Ética das emoções', codigo:'Fe', simbolo:'◆',
    grade:{estatica:'dinâmico', plano:'interno', foco:'objetos'},
    o_que_e:'os estados emocionais como informação transmissível: excitação, '
      +'humor, ânimo, o clima que se contagia e se modula.',
    classe:'julgamento',
    nao_confundir:'não é simpatia nem afetividade da pessoa; é o aspecto '
      +'emocional expresso da informação.'},
  Fi:{nome:'Ética das relações', codigo:'Fi', simbolo:'◇',
    grade:{estatica:'estático', plano:'externo', foco:'campos'},
    o_que_e:'as relações subjetivas entre pessoas: proximidade e distância, '
      +'simpatia e antipatia, obrigação moral, o que se deve a quem.',
    classe:'julgamento',
    nao_confundir:'não é bondade nem sensibilidade.'}
};

/* ---------- Modelo A ----------
   Gerado por relação de posição a partir do par Ego, para que
   estrutura e regra não possam divergir. Conferido contra as
   listas canônicas dos dezesseis tipos nos testes. */
const SOC_EGO={ILE:['Ne','Ti'],SEI:['Si','Fe'],ESE:['Fe','Si'],LII:['Ti','Ne'],
  EIE:['Fe','Ni'],LSI:['Ti','Se'],SLE:['Se','Ti'],IEI:['Ni','Fe'],
  SEE:['Se','Fi'],ILI:['Ni','Te'],LIE:['Te','Ni'],ESI:['Fi','Se'],
  LSE:['Te','Si'],EII:['Fi','Ne'],IEE:['Ne','Fi'],SLI:['Si','Te']};
/* par dual: o elemento complementar (troca classe e atitude) */
const SOC_DUAL={Ti:'Fe',Fe:'Ti',Te:'Fi',Fi:'Te',Ni:'Se',Se:'Ni',Ne:'Si',Si:'Ne'};
/* par invertido: o mesmo aspecto na atitude oposta */
const SOC_INV={Ti:'Te',Te:'Ti',Fi:'Fe',Fe:'Fi',Ni:'Ne',Ne:'Ni',Si:'Se',Se:'Si'};

const SOC_TIPOS=Object.keys(SOC_EGO);
function socModeloA(tipo){
  const bc=SOC_EGO[tipo]; if(!bc)return null;
  const [B,C]=bc;
  return [B, C,
    SOC_INV[SOC_DUAL[B]], SOC_INV[SOC_DUAL[C]],
    SOC_DUAL[B], SOC_DUAL[C],
    SOC_INV[B], SOC_INV[C]];
}
const SOC_MODELOS=(()=>{const o={};SOC_TIPOS.forEach(t=>o[t]=socModeloA(t));return o;})();

/* ---------- as oito posições ----------
   POSIÇÃO, FORÇA e VALORAÇÃO são três atributos diferentes, e o
   app nunca os funde. Um elemento pode ser forte e não valorado
   (posições 7 e 8), ou fraco e valorado (5 e 6). */
const SOC_POSICOES=[
  {n:1, nome:'base', alt:'programa', bloco:'Ego', anel:'mental',
   forca:'forte', valorada:true,
   o_que_o_modelo_diz:'opera continuamente e sem esforço; é o critério pelo '
     +'qual o tipo organiza a informação.'},
  {n:2, nome:'criativa', alt:'realizadora', bloco:'Ego', anel:'mental',
   forca:'forte', valorada:true,
   o_que_o_modelo_diz:'ferramenta manejada com liberdade, a serviço da base; '
     +'é onde o tipo age sobre o mundo.'},
  {n:3, nome:'papel', alt:'de norma', bloco:'Superego', anel:'mental',
   forca:'fraca', valorada:false,
   o_que_o_modelo_diz:'sustentada por esforço consciente em público; funciona '
     +'por períodos curtos e cansa.'},
  {n:4, nome:'vulnerável', alt:'ponto de menor resistência', bloco:'Superego',
   anel:'mental', forca:'fraca', valorada:false,
   o_que_o_modelo_diz:'o ponto em que a exigência fere; o tipo evita o '
     +'assunto e reage mal à cobrança nele.'},
  {n:5, nome:'sugestiva', alt:'de sugestão', bloco:'Super-Id', anel:'vital',
   forca:'fraca', valorada:true,
   o_que_o_modelo_diz:'fraca e desejada: recebida do outro com gratidão, '
     +'sem crítica.'},
  {n:6, nome:'mobilizadora', alt:'de ativação', bloco:'Super-Id', anel:'vital',
   forca:'fraca', valorada:true,
   o_que_o_modelo_diz:'desperta com incentivo externo, mas desregula quando '
     +'a pessoa fica só com ela.'},
  {n:7, nome:'ignorada', alt:'restritiva', bloco:'Id', anel:'vital',
   forca:'forte', valorada:false,
   o_que_o_modelo_diz:'competente, porém julgada desnecessária: o tipo sabe '
     +'operar e escolhe não fazer disso um critério.'},
  {n:8, nome:'demonstrativa', alt:'de fundo', bloco:'Id', anel:'vital',
   forca:'forte', valorada:false,
   o_que_o_modelo_diz:'forte e automática, usada em segundo plano ou em '
     +'defesa da vulnerável, sem que o tipo lhe dê valor.'}
];
const SOC_BLOCOS={
  Ego:{posicoes:[1,2], o_que_e:'forte e valorado, consciente: o que o tipo é '
    +'e faz por conta própria.'},
  Superego:{posicoes:[3,4], o_que_e:'fraco e não valorado, consciente: o que '
    +'o ambiente exige e o tipo sustenta a custo.'},
  'Super-Id':{posicoes:[5,6], o_que_e:'fraco e valorado, inconsciente: o que '
    +'o tipo procura no outro — é aqui que se define a dualidade.'},
  Id:{posicoes:[7,8], o_que_e:'forte e não valorado, inconsciente: capacidade '
    +'real sem investimento subjetivo.'}
};

/* ---------- racionalidade: pela função base, e só por ela ---------- */
function socRacionalidade(tipo){
  const B=SOC_EGO[tipo]&&SOC_EGO[tipo][0]; if(!B)return null;
  const cl=SOC_ELEMENTOS[B].classe;
  return {
    base:B, classe:cl,
    racional: cl==='julgamento',
    rotulo: cl==='julgamento'?'racional':'irracional',
    porque:'a função base é '+B+', um elemento de '+cl+'; na Sociônica a '
      +'racionalidade do tipo é definida pela classe da função BASE.',
    nao_e:'isto não é a dicotomia J/P do MBTI. Um tipo sociônico racional não '
      +'é por isso um tipo J, e a coincidência frequente entre os dois rótulos '
      +'é um artefato de notação, não uma equivalência demonstrada.'
  };
}

/* ---------- quadras ---------- */
const SOC_QUADRAS={
  Alfa:{tipos:['ILE','SEI','ESE','LII'], valorados:['Ne','Si','Fe','Ti'],
    o_que_e:'quadra que valoriza possibilidade aberta, conforto partilhado, '
      +'clima ameno e sistema claro.'},
  Beta:{tipos:['SLE','IEI','EIE','LSI'], valorados:['Se','Ni','Fe','Ti'],
    o_que_e:'quadra que valoriza força, prognóstico, mobilização emocional e '
      +'hierarquia definida.'},
  Gama:{tipos:['SEE','ILI','LIE','ESI'], valorados:['Se','Ni','Te','Fi'],
    o_que_e:'quadra que valoriza iniciativa própria, prognóstico, resultado '
      +'factual e vínculo pessoal escolhido.'},
  Delta:{tipos:['IEE','SLI','LSE','EII'], valorados:['Ne','Si','Te','Fi'],
    o_que_e:'quadra que valoriza potencial das pessoas, bem-estar, método que '
      +'funciona e lealdade pessoal.'}
};
function socQuadra(tipo){
  return Object.keys(SOC_QUADRAS).find(q=>SOC_QUADRAS[q].tipos.indexOf(tipo)>=0)||null;
}

/* ---------- nomes e frases ---------- */
const SOC_NOMES={ILE:'Inventor',SEI:'Mediador',ESE:'Entusiasta',LII:'Analista',
  EIE:'Mentor',LSI:'Inspetor',SLE:'Comandante',IEI:'Lírico',
  SEE:'Político',ILI:'Crítico',LIE:'Empreendedor',ESI:'Guardião',
  LSE:'Administrador',EII:'Humanista',IEE:'Conselheiro',SLI:'Artesão'};
/* notação de quatro letras DA SOCIÔNICA — não do MBTI */
const SOC_QUATRO={ILE:'ENTp',SEI:'ISFp',ESE:'ESFj',LII:'INTj',
  EIE:'ENFj',LSI:'ISTj',SLE:'ESTp',IEI:'INFp',
  SEE:'ESFp',ILI:'INTp',LIE:'ENTj',ESI:'ISFj',
  LSE:'ESTj',EII:'INFj',IEE:'ENFp',SLI:'ISTp'};
const SOC_FRASE={
  ILE:'Inventor: toda coisa é o protótipo de outra que ainda não existe.',
  SEI:'Mediador: ajusta o ambiente até ficar habitável para todos.',
  ESE:'Entusiasta: move o grupo pelo clima que cria.',
  LII:'Analista: a estrutura primeiro; a aplicação vem depois.',
  EIE:'Mentor: dramatiza o presente para apontar o rumo.',
  LSI:'Inspetor: sistema aplicado com disciplina e alcance definido.',
  SLE:'Comandante: lê a correlação de forças e avança sobre ela.',
  IEI:'Lírico: acompanha para onde a maré está indo.',
  SEE:'Político: influência direta sobre pessoas e território.',
  ILI:'Crítico: prevê o desdobramento e corta o desperdício.',
  LIE:'Empreendedor: converte previsão em operação.',
  ESI:'Guardião: lealdade escolhida e julgamento moral firme.',
  LSE:'Administrador: processo confiável e bem-estar garantido.',
  EII:'Humanista: escuta o núcleo ético de cada um.',
  IEE:'Conselheiro: enxerga o talento que a pessoa ainda não usou.',
  SLI:'Artesão: conforto e técnica, sem desperdício.'};

/* ---------- relações intertipo ----------
   Nomeadas pela estrutura, e sem promessa de resultado. */
const SOC_RELACOES_AVISO=
  'As relações intertipo descrevem como os blocos de dois modelos se '
  +'encaixam no plano da informação. NÃO predizem compatibilidade amorosa, '
  +'sucesso profissional nem qualidade de convivência: dualidade não garante '
  +'bom relacionamento, e conflito não impede amizade duradoura ou parceria '
  +'produtiva. Pessoas concretas decidem isso, e não a estrutura.';
function socDual(tipo){
  const m=SOC_MODELOS[tipo]; if(!m)return null;
  /* o dual é o tipo cujo Ego é o Super-Id deste — base 5, criativa 6 */
  return SOC_TIPOS.find(t=>SOC_EGO[t][0]===m[4]&&SOC_EGO[t][1]===m[5])||null;
}
const SOC_RELACOES={
  identidade:'mesmo tipo: mesma estrutura, portanto os mesmos pontos cegos.',
  dualidade:'o Ego de um preenche o Super-Id do outro. É a relação de '
    +'complementaridade informacional do modelo — não uma promessa de afinidade.',
  ativacao:'estimulam-se mutuamente, com desgaste em contato longo.',
  espelho:'mesmas funções valoradas, base e criativa trocadas: acordo no '
    +'assunto, discordância no método.',
  conflito:'a base de um cai sobre a vulnerável do outro. Descreve atrito '
    +'informacional, e não incompatibilidade humana.',
  supervisao:'a base do supervisor cai sobre a de papel do supervisionado, '
    +'relação assimétrica de pressão involuntária.',
  beneficio:'assimétrica e unidirecional, com um lado achando o outro mais '
    +'interessante do que o inverso.'
};

/* ---------- mal-entendidos recusados ---------- */
const SOC_MAL_ENTENDIDOS=[
  {erro:'converter letras do MBTI em sociotipo',
   porque:'os sistemas definem os elementos de modo diferente e os arranjam '
     +'em estruturas diferentes. Uma tabela de conversão só reproduz o '
     +'resultado do primeiro sistema com outro nome — e é exatamente isso que '
     +'este app deixou de fazer.'},
  {erro:'ler INTj como INTJ',
   porque:'na notação sociônica a última letra indica racionalidade pela '
     +'função base. LII (INTj) tem base Ti; INTJ do MBTI tem dominante Ni. '
     +'São afirmações diferentes.'},
  {erro:'tratar posição forte como posição valorada',
   porque:'as posições 7 e 8 são FORTES e NÃO valoradas; as posições 5 e 6 '
     +'são FRACAS e valoradas. Força e valoração são eixos independentes.'},
  {erro:'ler a função vulnerável como trauma ou defeito de caráter',
   porque:'é uma posição no modelo, que descreve baixa capacidade de '
     +'processar aquele aspecto da informação sob exigência.'},
  {erro:'somar dimensionalidade, sinais ou Modelo G ao Modelo A',
   porque:'são camadas posteriores, de escolas distintas, com pressupostos '
     +'próprios. Misturá-las produz um híbrido que nenhuma escola sustenta.'}
];
