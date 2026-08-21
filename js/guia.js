/* ============================================================
   GUIA.JS — o guia das tipologias.

   Para cada sistema, a mesma anatomia:
     1 definição por gênero próximo e diferença específica
     2 como funciona (o mecanismo)
     3 de onde vem (autores, datas, linhagem)
     4 que evidências temos (incluindo as desfavoráveis)
     5 o que explica bem, e o que não explica
     6 correspondência astrológica, elemento por elemento

   Sobre a correspondência astrológica: com uma exceção declarada
   (a associação junguiana entre as quatro funções e os quatro
   elementos, corrente na literatura astro-psicológica), as
   correspondências abaixo são ANALOGIAS ESTRUTURAIS propostas por
   este app. Não constam em Jung, Myers, Ichazo, Augustinavičiūtė,
   Marston nem Socoa, e não são doutrina tradicional. Servem para
   traduzir um vocabulário no outro — nunca como prova de nada.
   ============================================================ */

const TP_GUIA={

/* ---------------------------------------------------------- MBTI */
mbti:{
  nome:'MBTI',
  sub:'tipologia das funções de consciência',
  genero:'É uma tipologia psicológica: um sistema que classifica pessoas em classes discretas a partir de disposições estáveis.',
  dif:'Distingue-se das demais por não tipificar o comportamento observável, e sim a <b>ordem de preferência entre quatro funções de consciência</b> — pensamento, sentimento, sensação e intuição —, cada uma tomada em duas atitudes, voltada ao objeto ou ao sujeito. O tipo não é uma soma de traços independentes: é uma hierarquia. O que vem primeiro governa; o que vem por último é o ponto cego.',
  mec:[
    ['A premissa','A consciência não recebe o mundo cru. Ela opera por funções: duas de percepção, que dizem <i>como a informação chega</i> — sensação (o dado presente) e intuição (o que o dado sugere) —, e duas de julgamento, que dizem <i>como se decide</i> — pensamento (por critério impessoal) e sentimento (por critério de valor). Nenhuma é melhor; são incomensuráveis entre si.'],
    ['A atitude','Cada função pode se voltar para fora, ao objeto (extravertida), ou para dentro, ao sujeito (introvertida). Quatro funções em duas atitudes dão oito funções-atitude: Ni, Ne, Si, Se, Ti, Te, Fi, Fe. São estas oito, e não as quatro letras, a unidade real do modelo.'],
    ['A pilha','Cada tipo ordena quatro delas: dominante (o que se faz sem esforço e sem perceber), auxiliar (o contrapeso, em atitude e domínio opostos), terciária (o refúgio) e inferior (a sombra da dominante — o que falha, e falha justamente sob pressão). As quatro letras são uma notação para essa pilha, não quatro medidas independentes. É aqui que quase toda leitura popular do MBTI se perde.'],
    ['A consequência','Duas pessoas do mesmo tipo discordam sobre conteúdo; pessoas de tipos opostos discordam sobre o que sequer é relevante discutir. O modelo explica desacordo antes do assunto.']],
  orig:'Jung publica <i>Tipos psicológicos</i> em 1921 e descreve <b>oito</b> tipos — uma função dominante em uma atitude —, sem grade de dezesseis e sem pilha completa. A grade vem de Katharine Cook Briggs e de sua filha Isabel Briggs Myers, que constroem o indicador a partir de 1942 e o publicam em 1962. A quarta letra (J/P) é acréscimo de Myers, um recurso de notação para localizar qual função é dominante — Jung não a tinha. A pilha de oito funções como se ensina hoje deve muito a Harold Grant (1983) e, no registro arquetípico, a John Beebe.',
  evid:[
    ['Estabilidade do resultado','Estudos clássicos de reteste registram que perto de metade dos respondentes muda pelo menos uma letra ao refazer o instrumento poucas semanas depois. A causa é técnica e conhecida: os escores se distribuem de forma contínua e unimodal, sem vale no meio; quem fica perto da linha de corte troca de tipo por ruído.'],
    ['O que a análise fatorial devolve','Dimensões, não tipos. As quatro escalas correlacionam-se de modo robusto com quatro dos Cinco Grandes: E–I com extroversão, S–N com abertura, T–F com amabilidade, J–P com conscienciosidade. Falta uma quinta: o MBTI não tem nada que corresponda ao neuroticismo — a estabilidade emocional simplesmente não é medida. É um ponto cego do instrumento, não do respondente.'],
    ['A teoria da pilha','Tem pouco apoio empírico independente. O que os dados sustentam são as escalas como medidas dimensionais grosseiras; o que os dados não sustentam é a tipologia como taxonomia de dezesseis espécies naturais.'],
    ['Uso prático','A validade preditiva para desempenho profissional é fraca, e o instrumento não é adequado para seleção — ponto em que a literatura acadêmica e os próprios manuais tendem a concordar.']],
  vered:'Como questionário dimensional, mede algo real: quatro eixos que reaparecem em modelos mais bem validados. Como teoria de dezesseis psiques distintas, é uma linguagem hermenêutica — útil para descrever, não demonstrada como estrutura.',
  alc:'Explica melhor que os outros quatro <b>o funcionamento da atenção antes do conteúdo</b>: por que duas pessoas competentes divergem sobre o que é óbvio. É uma fenomenologia da cognição. Em compensação, não modela estabilidade emocional, não prediz conduta em contexto e, por cortar um contínuo em categorias, convida à fixação identitária — «eu sou INFJ» — que a própria teoria não autoriza.',
  chave:'A tradução tem três camadas: a <b>função</b> vira elemento; a <b>atitude</b> vira hemisfério; a <b>posição na pilha</b> vira dignidade e condição.',
  chaveL:[
    ['função → elemento','Sensação e terra, intuição e fogo, pensamento e ar, sentimento e água. Esta é a única correspondência aqui que <i>não</i> é invenção do app: é corrente na literatura astro-psicológica que parte de Jung — Hamaker-Zondag, Liz Greene, Stephen Arroyo. Vale notar que ela é disputada: há autores que aproximam a intuição da água, e a discussão nunca se fechou.'],
    ['atitude → hemisfério','Introvertida: planetas abaixo do horizonte, sobretudo em casas recolhidas (12ª, 8ª, 4ª) e cadentes. Extravertida: planetas acima do horizonte e, principalmente, angulares.'],
    ['pilha → dignidade','Função dominante: planeta em domicílio ou exaltação, angular — opera sem custo. Função inferior: o planeta mais debilitado do mapa, em exílio, queda ou combusto — aquilo que só aparece sob pressão, e aparece mal.']],
  itens:[
    ['Ni — intuição introvertida','Converge muitas impressões numa <i>única</i> imagem do que vem. Configuração: um planeta de visão — Júpiter, ou Mercúrio elevado à função de vidência — em signo de fogo, mas em casa noturna e recolhida (12ª, 8ª ou 4ª), disposto ou aspectado por Saturno. Saturno é o que estreita a visão até ela virar certeza única; sem ele, a mesma intuição se espalha e vira Ne.'],
    ['Ne — intuição extravertida','A mesma função na atitude oposta: diverge em muitas possibilidades ao mesmo tempo. Júpiter ou Mercúrio em signo mutável de fogo ou ar, angular ou acima do horizonte, sem contenção saturnina. O que em Ni é uma imagem, aqui são vinte hipóteses — e nenhuma delas fecha.'],
    ['Si — sensação introvertida','O presente comparado com o arquivo do corpo. Lua em signo de terra, ou Saturno em terra na 4ª: a memória sensorial como régua — o gosto de antes decidindo sobre o agora.'],
    ['Se — sensação extravertida','O presente sem mediação nenhuma. Marte ou Vênus em terra, angular, sobretudo na 1ª ou na 10ª: o corpo respondendo ao que está diante dele, na velocidade em que está.'],
    ['Ti — pensamento introvertido','A régua é a coerência interna do sistema, não o resultado. Mercúrio em signo de ar em casa recolhida, disposto por Saturno: prefere estar certo a estar operante.'],
    ['Te — pensamento extravertido','A régua é o que funciona. Mercúrio em ar ou terra, angular, regendo ou ocupando a 10ª ou a 6ª: organiza o mundo exterior e mede o pensamento pelo efeito.'],
    ['Fi — sentimento introvertido','O valor íntimo, inegociável e mal justificável. Vênus ou Lua em água nas casas 12ª, 8ª ou 4ª: sabe o que vale sem conseguir — e sem querer — argumentar.'],
    ['Fe — sentimento extravertido','A temperatura do grupo. Vênus ou Lua em água ou ar nas casas 7ª, 10ª ou 11ª: lê o clima entre as pessoas e o regula, às vezes antes de perceber o próprio estado.']]},

/* ----------------------------------------------------- ENEAGRAMA */
enn:{
  nome:'Eneagrama',
  sub:'tipologia da motivação e da paixão',
  genero:'É uma tipologia de caráter: classifica pessoas por disposições estáveis de personalidade.',
  dif:'Distingue-se por tipificar a <b>motivação</b> e não a conduta. Cada tipo é definido por um medo nuclear, um desejo compensatório e uma paixão — o vício que sustenta a estratégia. Duas pessoas podem fazer exatamente a mesma coisa por razões opostas, e é a razão, não a coisa, que decide o tipo. Segunda diferença: é <b>dinâmico</b>. O símbolo prescreve movimentos — asas e setas —, de modo que o tipo é um lugar de onde se sai sob estresse e sob segurança, não uma caixa em que se fica.',
  mec:[
    ['Fixação da atenção','Cada tipo é um hábito de atenção: um filtro que faz certos dados do mundo saltarem aos olhos e outros desaparecerem. O tipo 6 vê o risco na sala; o 7, a saída; o 2, quem está precisando. Nenhum dos três está mentindo sobre o que viu.'],
    ['A paixão','É o motor afetivo da estratégia — e é <i>egossintônica</i>: não se sente como defeito, sente-se como bom senso. Por isso o modelo é difícil de aplicar a si mesmo e fácil de aplicar aos outros.'],
    ['A defesa e a virtude','A defesa mantém a estrutura de pé; a virtude é o que aparece quando a paixão afrouxa — não uma meta moral imposta de fora, mas o estado natural sob a fixação.'],
    ['As setas','Sob desintegração, o tipo assume os traços baixos de outro ponto; sob integração, os traços altos de um terceiro. É a parte mais atraente do modelo e, como se verá, a menos testada.']],
  orig:'O símbolo de nove pontas vem de G. I. Gurdjieff, no início do século XX, que o usava como diagrama de <i>processos</i> — a lei do três e a lei do sete — e nunca como tipologia de personalidade. A aplicação ao caráter é de Oscar Ichazo (Arica, Chile, fim dos anos 1960 e início dos 70), que ligou os nove pontos às paixões e fixações. Claudio Naranjo, psiquiatra, levou o material a Berkeley nos grupos SAT (1970-71) e o cruzou com categorias clínicas; daí saem Helen Palmer, Don Riso e Russ Hudson, e a linha cristã de Robert Ochs e Richard Rohr. As paixões, essas sim, são antigas: descem dos oito <i>logismoi</i> de Evágrio Pôntico (século IV), via Cassiano e os vícios capitais de Gregório Magno. Ou seja: vocabulário moral antiquíssimo, estrutura de nove tipos do século XX.',
  evid:[
    ['Instrumentos','Questionários como o RHETI mostram consistência interna aceitável em várias escalas, mas a análise fatorial não devolve nove fatores limpos: alguns tipos colapsam uns sobre os outros.'],
    ['Correlação com modelos validados','Existe e replica: o tipo 4 associa-se a neuroticismo alto, o 7 a extroversão, o 5 a introversão com abertura elevada. Isso indica que o eneagrama está descrevendo variação real — só que num sistema de coordenadas que não é o que os dados preferem.'],
    ['As afirmações dinâmicas','Asas, setas, níveis de desenvolvimento: praticamente sem teste controlado. É a parte mais rica clinicamente e a mais desamparada empiricamente.'],
    ['Risco de uso','Por descrever motivos ocultos, presta-se a atribuir a outrem uma intenção que ele nega — movimento que nenhuma evidência autoriza e que o próprio modelo, bem usado, desaconselha.']],
  vered:'É mais forte como fenomenologia da motivação — o tipo de observação que um bom confessor ou analista faz — e mais fraco exatamente onde reivindica mais estrutura: a geometria.',
  alc:'Explica o que nenhum dos outros quatro toca: <b>por que</b> alguém faz o que faz, inclusive o autoengano envolvido. É uma psicologia moral, e aí estão sua força e seu risco — descreve bem, mas moraliza. Não descreve cognição (o MBTI faz melhor) nem estilo observável (o DISC faz melhor).',
  chave:'A tradição medieval já ligava os sete vícios capitais aos sete planetas. Como o eneagrama tem nove paixões e a astrologia clássica sete planetas, duas — inveja e medo — não têm planeta próprio e se leem como composições.',
  chaveL:[],
  itens:[
    ['1 · ira — o reformador','A ira que não se admite como ira e se apresenta como correção. Marte sob regra saturnina: Marte em signo de Saturno, ou em aspecto duro de Saturno, com a 6ª carregada. A energia de ataque posta a serviço de um dever.'],
    ['2 · orgulho — o prestativo','A soberba de quem dá: o valor próprio medido pelo quanto se é necessário. Vênus em contato com o Sol, ou Vênus regendo a 1ª ou a 11ª — o afeto como moeda de existência.'],
    ['3 · vaidade — o realizador','A imagem substituindo o ser. Sol angular sem testemunho de Saturno; Sol na 10ª, ou o regente da 10ª dignificado e visível. Brilho eficaz, e nenhum tempo para perguntar quem brilha.'],
    ['4 · inveja — o individualista','A comparação virou órgão de percepção: falta-me o que o outro tem. Lua em queda, ou Saturno em signo de água na 12ª ou na 8ª. É uma das duas paixões sem planeta próprio: lê-se como Lua ferida por Saturno.'],
    ['5 · avareza — o investigador','Guardar-se, guardar o saber, gastar pouco de si. Saturno sobre Mercúrio, ou Mercúrio disposto por Saturno, em casa recolhida (12ª, 8ª, 3ª). O conhecimento como reserva, não como troca.'],
    ['6 · medo — o leal','A vigilância como método de vida. Saturno com Mercúrio na 12ª, ou o regente do Ascendente afligido por Saturno. Segunda paixão sem planeta próprio: é Saturno na função de sentinela, não de juiz.'],
    ['7 · gula — o entusiasta','Não a gula da mesa, mas a da próxima possibilidade: fuga para a frente. Júpiter em signo mutável, sem contenção saturnina, na 5ª, 9ª ou 11ª. Muitas portas abertas para não fechar nenhuma.'],
    ['8 · luxúria — o desafiador','Luxúria no sentido antigo: excesso, intensidade como forma de existir. Marte angular em domicílio. Prefere o confronto à ambiguidade, e a força à negociação.'],
    ['9 · preguiça — o pacificador','Acídia, não preguiça física: o adormecimento de si próprio. Vênus ou Lua em signo mutável ou na 12ª, com o regente do Ascendente cadente. Mantém a paz interna deixando de aparecer.']]},

/* ------------------------------------------------------ SOCIÔNICA */
soc:{
  nome:'Sociônica',
  sub:'tipologia do metabolismo informacional',
  genero:'É uma tipologia de raiz junguiana — a mesma matéria-prima do MBTI, num ramo que se desenvolveu separado por décadas.',
  dif:'Distingue-se por tratar o tipo como uma <b>estrutura de metabolismo informacional</b>: oito elementos de informação distribuídos por oito posições fixas (o Modelo A), cada posição com uma força e um estatuto — valorizada ou não, mental ou vital. E, sobretudo, por extrair disso uma <b>teoria das relações entre tipos</b>: dadas duas estruturas, ela prediz a qualidade do intercâmbio — dualidade, ativação, conflito, supervisão. O MBTI descreve indivíduos; a sociônica descreve pares. Nenhum outro dos cinco faz isso.',
  mec:[
    ['Metabolismo informacional','A metáfora vem de Antoni Kępiński: a psique processa informação como o organismo processa alimento. Há o que se digere sem esforço, o que se digere com trabalho e o que intoxica. Os oito elementos são os oito tipos de alimento.'],
    ['Objeto e campo','Cada um dos quatro domínios se divide em dois: o que se percebe como propriedade do objeto (extravertido, «preto») e o que se percebe como relação entre objetos (introvertido, «branco»). Força é propriedade do objeto; a distância certa entre duas pessoas é relação.'],
    ['O Modelo A','Oito posições: base, criativa, papel, dolorosa, sugestiva, ativação, observadora e demonstrativa. Não é uma lista de habilidades — é um circuito. As posições fortes fazem sem cansar; as fracas cansam e, na posição dolorosa, humilham. O anel mental é deliberado; o vital é automático.'],
    ['Relações intertípicas','Derivam do encaixe: as funções fortes e valorizadas de um caem nas posições fracas e carentes do outro. O dual não é quem se parece com você — é quem cobre exatamente o seu ponto cego sem esforço e sem cobrar por isso.']],
  orig:'Aušra Augustinavičiūtė, na Lituânia soviética dos anos 1970 e 80, combinou os tipos de Jung, o metabolismo informacional de Kępiński e vocabulário cibernético. O desenvolvimento posterior é sobretudo russófono — as escolas de Gulenko e outras acrescentaram temperamentos, clubes e critérios de tipagem. É crucial notar a separação de linhagem: MBTI e sociônica partem da mesma raiz junguiana e não tiveram contato por décadas, o que explica por que a notação difere e por que <b>os códigos de quatro letras não se traduzem um no outro</b>, apesar da semelhança aparente.',
  evid:[
    ['Validação independente','Quase inexistente fora da comunidade russófona. Não há um corpo de estudos revisados por pares que sustente a estrutura de dezesseis tipos.'],
    ['Concordância entre avaliadores','Baixa. A mesma pessoa recebe tipos diferentes de escolas diferentes — e as escolas divergem sobre os próprios critérios de tipagem, o que torna difícil sequer definir o que seria um erro.'],
    ['A afirmação central','As relações intertípicas são a parte mais testável de todo o sistema: bastaria comparar qualidade de relação declarada com a relação prevista, em amostra grande. Isso nunca foi demonstrado em estudo controlado publicado — o que é notável, dado que a hipótese é simples de testar.'],
    ['Falseabilidade na prática','A arquitetura é tão completa que absorve qualquer contraexemplo como erro de tipagem. Um sistema que explica todos os resultados possíveis não é confirmado por nenhum deles.']],
  vered:'É o mais elaborado dos cinco em arquitetura e o menos testado em evidência. Seu valor está em ser um modelo formal de complementaridade — não um instrumento validado.',
  alc:'Explica melhor que qualquer outro dos cinco por que a compatibilidade é <b>estrutural e não por semelhança</b>: por que duas pessoas parecidas se entediam e por que duas que diferem num padrão específico se aliviam mutuamente. É exatamente a pergunta que uma sinastria faz. O limite é o preço da mesma virtude: completude demais, refutabilidade de menos.',
  chave:'É a correspondência mais rica das cinco, porque os dois sistemas descrevem estrutura e não conteúdo. Duas traduções se sustentam quase sozinhas: <b>elemento de informação → planeta</b> e <b>posição no Modelo A → dignidade essencial</b>.',
  chaveL:[
    ['posição → dignidade','Base: planeta em domicílio — faz sem custo e sem perceber que faz. Criativa: exaltação — faz bem, com brilho, quando solicitado. Papel: planeta em signo alheio, sem dignidade — funciona à força e cansa. <b>Dolorosa</b>: planeta em exílio ou queda, ou combusto — quando exigido, falha e humilha. Esta é a tradução mais exata entre os dois sistemas: <i>força de função equivale a dignidade essencial</i>.'],
    ['temperamento → modalidade','Os temperamentos sociônicos correspondem a modalidade com angularidade: os racionais extravertidos ao cardinal angular; os racionais introvertidos ao fixo sucedente; os irracionais extravertidos ao cardinal-mutável angular; os irracionais introvertidos ao cadente.']],
  itens:[
    ['Se — sensação de força (objeto)','Volição, ocupação de espaço, imposição. <b>Marte</b>, sobretudo angular e em domicílio. Percebe o mundo em termos de quem cede e quem avança.'],
    ['Si — sensação de conforto (campo)','Bem-estar, temperatura, saúde, a qualidade do ambiente. <b>Vênus e Lua em signo de terra</b>. Percebe o mundo pelo que é agradável ou insalubre ao corpo.'],
    ['Ne — intuição de possibilidades (objeto)','O potencial latente das coisas e das pessoas. <b>Júpiter e Mercúrio em signo mutável</b>. Vê o que aquilo pode vir a ser.'],
    ['Ni — intuição do tempo (campo)','Aqui a correspondência é quase literal: a sociônica chama este elemento de <i>tempo</i>, e o senhor do tempo é <b>Saturno</b>. Ritmo, maturação, o momento certo, o desfecho previsto de um processo em curso.'],
    ['Te — lógica dos fatos (objeto)','Eficácia, método, produtividade, o dado verificável. <b>Mercúrio em terra</b>, ou Mercúrio disposto por Saturno com a 6ª ou a 10ª carregada.'],
    ['Ti — lógica da estrutura (campo)','Consistência, hierarquia, sistema, definição. <b>Saturno com Mercúrio em signo de ar</b>. Importa que o edifício seja coerente, antes de importar se ele rende.'],
    ['Fe — ética das emoções (objeto)','O clima afetivo de um ambiente, e a capacidade de mudá-lo. <b>Vênus e Lua em fogo ou ar</b>, em casas de convívio (7ª, 11ª, 5ª).'],
    ['Fi — ética das relações (campo)','A distância certa entre duas pessoas: quem é próximo, quem não é, o que se deve a quem. <b>Vênus em signo de água</b>, ou Vênus regendo a 7ª com testemunho da Lua.']]},

/* ----------------------------------------------------------- DISC */
disc:{
  nome:'DISC',
  sub:'tipologia da conduta observável',
  genero:'É um modelo de estilos de comportamento.',
  dif:'Distingue-se de todos os anteriores por <b>não pretender descrever a psique</b>, e sim a conduta observável num ambiente determinado — tipicamente o trabalho —, organizada em dois eixos: o ritmo (agir depressa ou ponderar) e o foco (a tarefa ou as pessoas). Por ser situacional, admite que a mesma pessoa apresente perfis diferentes em contextos diferentes — coisa que os outros quatro não admitem.',
  mec:[
    ['Os dois eixos','Ritmo cruzado com foco dá quatro quadrantes: D, rápido e voltado à tarefa; I, rápido e voltado às pessoas; S, ponderado e voltado às pessoas; C, ponderado e voltado à tarefa.'],
    ['O perfil é a forma','Ninguém é «um D». Mede-se intensidade nos quatro fatores, e o que se lê é o desenho do conjunto — inclusive a distância entre o fator mais alto e o segundo, que diz mais sobre a pessoa do que o primeiro sozinho.'],
    ['Ambiente favorável ou hostil','Na formulação original de Marston, cada resposta depende de como o ambiente é percebido — favorável ou antagônico — e de quanto poder a pessoa se atribui diante dele. É um modelo relacional desde a origem, e é por isso que o perfil muda de contexto para contexto.']],
  orig:'William Moulton Marston, em <i>Emotions of Normal People</i> (1928), descreve quatro emoções primárias — dominância, indução, submissão e complacência. Marston não construiu instrumento nenhum: o primeiro inventário é de Walter Clarke, em 1956, e as formas comerciais vêm depois. O mesmo Marston criou a Mulher-Maravilha e trabalhou no teste de pressão sistólica que antecedeu o polígrafo. A família mais ampla de esquemas de quatro tipos em dois eixos tem linhagem documentada: desce dos quatro humores de Galeno, passa por Kant, por Wundt (que os reorganiza como força da emoção e velocidade de mudança) e chega a Eysenck.',
  evid:[
    ['Como instrumento','As versões bem construídas apresentam consistência interna aceitável e alguma evidência de validade para descrever estilo de comunicação.'],
    ['Como preditor','Fraco ou ausente para desempenho no trabalho. Não é instrumento de seleção, e os próprios fornecedores em geral dizem isso — o que não impede o uso indevido.'],
    ['Os quatro tipos','São cortes num contínuo. A análise fatorial devolve dimensões, e os dois eixos do DISC correlacionam-se substancialmente com extroversão e amabilidade dos Cinco Grandes. As quatro categorias são convenção de leitura, não descoberta empírica.'],
    ['Formato ipsativo','Muitas versões usam escolha forçada, o que torna os escores comparáveis <i>dentro</i> de uma pessoa mas não <i>entre</i> pessoas — limitação técnica sistematicamente ignorada na prática.']],
  vered:'É o mais modesto dos cinco em pretensão e, por isso mesmo, o menos errado. Descreve uma superfície, e sabe que é uma superfície.',
  alc:'Explica bem o <b>atrito da convivência cotidiana</b>: por que a mesma reunião é vivida como eficiente por um e como brutalidade por outro. Nada diz sobre motivo, desenvolvimento ou vida interior — e não pretende dizer.',
  chave:'É a correspondência mais apertada das cinco, e por razão histórica, não mística: os dois eixos do DISC <b>são</b> os dois eixos humorais. Ritmo rápido e ponderado é quente e frio; foco na tarefa e nas pessoas é seco e úmido. DISC e temperamento são dois galhos da mesma árvore, o que é justamente por que este app deriva o DISC do temperamento calculado, e não de um questionário.',
  chaveL:[],
  itens:[
    ['D — dominância','Quente e seco: <b>colérico</b>. Marte e Sol, signos de fogo, planetas angulares. Decide rápido, tolera mal a demora e trata o obstáculo como coisa a remover.'],
    ['I — influência','Quente e úmido: <b>sanguíneo</b>. Júpiter e Vênus, signos de ar. Move-se depressa e pelas pessoas: convence, circula, dispersa-se.'],
    ['S — estabilidade','Frio e úmido: <b>fleumático</b>. Lua e Vênus, signos de água. Sustenta, acomoda, absorve — e adia o conflito até que ele fermente.'],
    ['C — conformidade','Frio e seco: <b>melancólico</b>. Saturno e Mercúrio, signos de terra. Verifica antes de agir; a régua é o critério, e o erro alheio dói mais do que deveria.']]},

/* ---------------------------------------------------------- SOCOA */
socoa:{
  nome:'Socoa',
  sub:'tipologia planetária',
  genero:'É uma tipologia planetária: sete tipos, um para cada planeta clássico.',
  dif:'Distingue-se de todas as anteriores por <b>não derivar o tipo de auto-relato</b>. O tipo vem da configuração do céu de nascimento — o planeta dominante — e é descrito como uma <i>economia de energia psicofísica</i>: um modo de gastar, reter e recuperar força vital, que se manifesta ao mesmo tempo no corpo, no ritmo e no caráter. É o único dos cinco em que o corpo entra na definição.',
  mec:[
    ['O dominante','Um planeta organiza o conjunto — pela dignidade, pela angularidade e pelo comando sobre o Ascendente. Ele dá o tom; o segundo planeta modula. Tipos mistos são a regra, não a exceção.'],
    ['A economia vital','Cada tipo tem uma forma característica de gastar e de recuperar: o marcial gasta em explosões e recupera em ação; o saturnino gasta devagar e recupera em retirada. Daí saem o tônus, o ritmo e o cansaço típico de cada um.'],
    ['O excesso e o defeito','Cada economia tem duas patologias simétricas — o planeta em excesso e o planeta em falta —, o que dá ao modelo uma estrutura clínica que as tipologias por questionário não têm.']],
  orig:'Michel de Socoa, <i>Typologie et caractères — bases de l’astrologie individuelle</i>, dentro da tradição astrológica francesa do século XX — o ambiente de Choisnard, de André Barbault e da discussão estatística em torno de Michel Gauquelin —, que procurava dar à astrologia uma base caracterológica em vez de divinatória. A raiz é bem mais antiga: o tipo planetário é uma das ideias mais velhas da astrologia, e já em Ptolomeu os planetas distribuem temperamentos e feitios corporais.',
  evid:[
    ['Validação psicométrica','Nenhuma. Os sete tipos nunca foram submetidos a estudo de validade de construto.'],
    ['A única linha quantitativa','É o trabalho de Michel Gauquelin sobre a frequência de planetas em setores seguintes aos ângulos entre profissionais eminentes — o chamado «efeito Marte» e os estudos de traços de caráter. Os dados do próprio Gauquelin eram internamente consistentes em amostras grandes.'],
    ['O que aconteceu depois','As tentativas de replicação independente — o Comité Para belga, o episódio Zelen nos Estados Unidos e o CFEPP francês — produziram resultados nulos ou disputados, e a controvérsia sobre viés de seleção e artefato demográfico nunca se encerrou de modo satisfatório para nenhum dos lados. É honesto dizer: foi o mais perto que a astrologia chegou de uma afirmação empírica testável, e não sobreviveu limpa à replicação.'],
    ['Estatuto','Deve ser lida como tradição simbólica e caracterológica, não como ciência validada. A coerência interna é alta; a corroboração externa, ausente.']],
  vered:'Alta coerência interna, nenhuma corroboração externa. Vale como linguagem de caráter, não como medida.',
  alc:'Explica o que os outros quatro nem tentam: <b>o corpo e o tempo</b> — que um caráter tem metabolismo, rosto, e um modo próprio de cansar. E tem a peculiaridade de ser o único dos cinco que não depende da autoimagem de quem é descrito, o que é ao mesmo tempo sua virtude metodológica (nenhum viés de auto-relato) e seu problema epistêmico (nenhuma verificação independente também).',
  chave:'Aqui não há tradução a fazer: o modelo já é astrológico. O tipo é o planeta dominante, e este app o calcula pelo Senhor da Genitura, com o regente do Ascendente como tipo secundário.',
  chaveL:[],
  itens:[
    ['Solar','Centro, calor e comando. Gasta em irradiação e precisa ser visto para se sustentar. Excesso: soberba. Falta: apagamento.'],
    ['Lunar','Ritmo, maré e adaptação. Gasta em absorção do ambiente e recupera em recolhimento doméstico. Excesso: passividade. Falta: desenraizamento.'],
    ['Mercurial','Velocidade nervosa, palavra e troca. Gasta em circulação mental e recupera em novidade. Excesso: dispersão. Falta: mutismo.'],
    ['Venusiano','Acordo, gosto e conciliação. Gasta em harmonização e recupera em prazer. Excesso: complacência. Falta: aspereza.'],
    ['Marcial','Ataque, corte e coragem. Gasta em explosão e recupera em nova ação. Excesso: violência. Falta: covardia.'],
    ['Jupiteriano','Amplitude, confiança e sentido. Gasta em expansão e recupera em reconhecimento. Excesso: inflação. Falta: descrença.'],
    ['Saturnino','Estrutura, tempo e limite. Gasta devagar e recupera em retirada. Excesso: dureza e melancolia. Falta: informe, sem coluna.']]}
};

/* ---------- panorama comparado ---------- */
const TP_PANO={
  cobre:[
    ['MBTI','<b>Cognição.</b> Como se percebe e como se decide, antes do conteúdo.'],
    ['Eneagrama','<b>Motivação.</b> Por que se faz o que se faz, inclusive o que não se admite.'],
    ['Sociônica','<b>Arquitetura e encaixe.</b> Como duas estruturas se completam ou se atritam.'],
    ['DISC','<b>Conduta situacional.</b> O que se vê de fora, num ambiente determinado.'],
    ['Socoa','<b>Economia psicofísica.</b> O corpo, o tônus e o ritmo de gasto.']],
  meta:[
    ['O que a evidência sustenta hoje','O modelo de personalidade empiricamente robusto é <b>dimensional</b>, não tipológico: cinco ou seis eixos contínuos (Cinco Grandes, HEXACO) que replicam entre culturas, mostram herdabilidade em torno de 40% a 60% e têm validade preditiva real, ainda que modesta, para desfechos de vida. Nenhuma das cinco tipologias deste app tem esse lastro — e vale saber disso antes de usá-las.'],
    ['O que uma tipologia ganha ao cortar','Todo tipo é um corte num espaço contínuo, e todo corte perde informação. O que ele compra em troca é <b>nomeabilidade</b>: uma linguagem em que uma pessoa se reconhece e consegue falar de si. Esse é um ganho hermenêutico, não empírico — e é um ganho real, desde que não seja confundido com o outro.'],
    ['Por que cinco modelos e não um','Porque medem coisas diferentes e erram em direções diferentes. O MBTI não vê motivo; o eneagrama não vê cognição; o DISC não vê vida interior; a sociônica vê estrutura mas não se deixa refutar; a Socoa vê o corpo e não se deixa medir. Sobrepostos, cobrem mais do que qualquer um deles sozinho — e as discordâncias entre eles são informação, não defeito.'],
    ['Por que a correspondência astrológica é legítima como tradução','Astrologia e tipologia são dois sistemas simbólicos que classificam o mesmo material humano com vocabulários diferentes. Quando uma estrutura aparece nos dois — força de função e dignidade essencial, eixos do DISC e eixos humorais —, a coincidência diz algo sobre o formato do material, não que um cause o outro. Traduzir não é provar, e este guia não pretende provar nada.']],
  fonte:'Com uma exceção — a associação junguiana entre as quatro funções e os quatro elementos, corrente na literatura astro-psicológica —, as correspondências deste guia são analogias estruturais propostas por este app. Não constam em Jung, Myers, Ichazo, Augustinavičiūtė, Marston nem Socoa, nem são doutrina tradicional.'
};

/* ---------- render ---------- */
let TP_G='mbti';
function guiaSec(t,html){return '<section class="gu-s"><h4>'+t+'</h4>'+html+'</section>';}
function guiaLista(a){return '<div class="gu-l">'+a.map(x=>
  '<div class="gu-i"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>').join('')+'</div>';}

function tpGuiaCorpo(id){
  if(id==='pano'){
    return '<header class="gu-h"><b>Panorama comparado</b>'
      +'<em>o que cada modelo cobre, o que a evidência sustenta e o que a tradução astrológica pode e não pode fazer</em></header>'
      +guiaSec('O que cada um cobre',guiaLista(TP_PANO.cobre))
      +guiaSec('Como se lê o conjunto',guiaLista(TP_PANO.meta))
      +'<p class="gu-nota">'+TP_PANO.fonte+'</p>';
  }
  const G=TP_GUIA[id]; if(!G)return '';
  return '<header class="gu-h"><b>'+G.nome+'</b><em>'+G.sub+'</em></header>'
    +'<div class="gu-def">'
      +'<div><span>gênero próximo</span><p>'+G.genero+'</p></div>'
      +'<div><span>diferença específica</span><p>'+G.dif+'</p></div>'
    +'</div>'
    +guiaSec('Como funciona',guiaLista(G.mec))
    +guiaSec('De onde vem','<p class="gu-p">'+G.orig+'</p>')
    +guiaSec('Que evidências temos',guiaLista(G.evid)
      +'<p class="gu-ver"><span>em resumo</span>'+G.vered+'</p>')
    +guiaSec('O que explica bem — e o que não explica','<p class="gu-p">'+G.alc+'</p>')
    +guiaSec('Correspondência astrológica',
      '<p class="gu-p gu-chave">'+G.chave+'</p>'
      +(G.chaveL.length?guiaLista(G.chaveL):'')
      +'<div class="gu-map">'+G.itens.map(x=>
        '<div class="gu-mi"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>').join('')+'</div>')
    +'<p class="gu-nota">'+TP_PANO.fonte+'</p>';
}
const TP_GB=[['mbti','MBTI'],['enn','Eneagrama'],['soc','Sociônica'],['disc','DISC'],
  ['socoa','Socoa'],['pano','Panorama comparado']];
function tpGUIA(){
  return '<div class="tpe-h" style="margin-bottom:6px"><b>Guia</b>'
    +'<em>o que é cada modelo, de onde vem, o que se sabe sobre ele — e como se traduz no mapa</em></div>'
    +'<div class="gu-nav">'+TP_GB.map(([id,lab])=>
      '<button class="gu-b'+(TP_G===id?' on':'')+'" data-tpg="'+id+'">'+lab+'</button>').join('')+'</div>'
    +'<article class="gu-art">'+tpGuiaCorpo(TP_G)+'</article>';
}
