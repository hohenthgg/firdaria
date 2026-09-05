/* ============================================================
   TIP-PONTE.JS — a ponte entre o mapa e as tipologias, em quatro
   estágios, cada elo com a sua natureza declarada.

   O ponto de partida honesto: NÃO EXISTE conversão validada de
   mapa natal para MBTI ou Sociônica. Não há instrumento aferido,
   não há amostra publicada que sustente a correspondência, e as
   tentativas conhecidas de correlacionar posições planetárias com
   escalas de personalidade não produziram efeito replicado. O que
   este módulo implementa é, por isso, um MODELO EXPLORATÓRIO DE
   CORRESPONDÊNCIA: um conjunto de regras escritas, versionadas e
   confrontáveis — não uma medida.

   Os quatro estágios, e o que cada um vale:

     1 · FATOS  — posições, casas, dignidades, aspectos.
         Natureza: CÁLCULO. Verificável contra efemérides.
     2 · LEITURA — o que a tradição astrológica diz desses fatos.
         Natureza: INTERPRETAÇÃO DE FONTE. Rastreável a um autor.
     3 · HIPÓTESE — o que isso sugeriria sobre modos de perceber e
         de julgar. Natureza: HIPÓTESE DESTE APP. Sem fonte, porque
         não há: o elo é nosso, e está assumido como nosso.
     4 · CONFRONTO — comparação com as estruturas candidatas de
         cada sistema. Feito nos módulos de inferência.

   O que este módulo se recusa a fazer:
     · adotar identidades do tipo Mercúrio = Ti, Lua = Fi,
       Saturno = Si, Urano = Ne. Nenhuma regra aqui aciona por um
       fator isolado: toda regra exige CONFIGURAÇÃO;
     · ler debilidade como função inferior, retrogradação como
       introversão, ou dignidade como mais inteligência;
     · confundir conteúdo de interesse com processo cognitivo,
       preferência com habilidade aprendida, motivação com
       comportamento observável, padrão recorrente com adaptação
       de circunstância, expressividade com critério de juízo, ou
       condição planetária com competência psicológica;
     · contar o mesmo fator várias vezes sob nomes diferentes;
     · preencher dado ausente com um neutro artificial de 50%.
       Dado que falta fica DESCONHECIDO, e assim é exibido.
   ============================================================ */

const PONTE_META={
  id:'ponte-exploratoria', versao:'1.0',
  natureza:'modelo exploratório de correspondência',
  declaracao:'Não há conversão validada entre mapa natal e tipologia. '
    +'As regras abaixo são hipóteses deste app, escritas para poderem ser '
    +'contestadas — não resultados de instrumento aferido.',
  limitacao_curta:'Correspondência exploratória: hipótese, não medida.',
  o_que_seria_evidencia:'A ponte só teria valor empírico se hipóteses '
    +'derivadas do mapa acertassem, acima do acaso, tipos determinados por '
    +'outro meio, em amostra pré-registrada. Este app não faz esse estudo e '
    +'não tem esse dado. Passar nos testes de software prova apenas que o '
    +'código faz o que diz — não que a correspondência seja verdadeira.'
};
const PONTE_ESTAGIOS=[
  {n:1, nome:'Fatos do mapa', natureza:'cálculo astronômico',
   o_que_e:'posições, casas, dignidades, aspectos e seita, computados das '
     +'efemérides e conferíveis contra qualquer outra fonte.'},
  {n:2, nome:'Leitura astrológica', natureza:'interpretação de fonte',
   o_que_e:'o que a tradição diz desses fatos, com autor identificável. '
     +'Uma fonte que descreve Mercúrio descreve MERCÚRIO — não prova '
     +'correspondência alguma com Ti ou Te.'},
  {n:3, nome:'Hipótese sobre o modo de perceber e julgar',
   natureza:'hipótese deste app',
   o_que_e:'o elo entre a leitura astrológica e o vocabulário de processos. '
     +'É a parte sem fonte, e é assumida como autoria do app.'},
  {n:4, nome:'Confronto com as estruturas candidatas',
   natureza:'comparação interna ao modelo',
   o_que_e:'compatibilidade das hipóteses com as estruturas completas de '
     +'cada sistema, avaliadas separadamente.'}
];

/* ============================================================
   ESTÁGIO 1 — os fatos
   Cada fato tem um IDENTIFICADOR estável, que é o que permite não
   contar o mesmo fator duas vezes sob redações diferentes.
   Fato que não pode ser apurado devolve {ok:false} — e não zero.
   ============================================================ */
function ponteFatos(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const P=NATAL.pts, F={};
  const põe=(id,ok,valor,desc)=>{F[id]={id,ok:!!ok,valor:ok?valor:null,desc:ok?desc:null};};
  const el=k=>P[k]?SIGN_ELEM[signOf(P[k].lon)]:null;
  const mo=k=>P[k]?SIGN_MODE[signOf(P[k].lon)]:null;
  const casa=k=>P[k]?P[k].h:null;

  ['mercury','moon','sun','venus','mars','jupiter','saturn'].forEach(k=>{
    põe('elem.'+k, !!P[k], el(k), P[k]?(PT_NAME[k]+' em signo de '+el(k)):null);
    põe('modo.'+k, !!P[k], mo(k), P[k]?(PT_NAME[k]+' em signo '+mo(k)):null);
    põe('casa.'+k, !!(P[k]&&P[k].h), casa(k), P[k]&&P[k].h?(PT_NAME[k]+' na casa '+P[k].h):null);
  });
  /* aspectos entre os sete — pelo motor único, sem tabela paralela */
  let asp=[];
  try{ asp=aspectosDe(lonsDe(P),['sun','moon','mercury','venus','mars','jupiter','saturn']); }
  catch(e){ asp=[]; }
  const temAsp=(a,b)=>asp.some(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));
  const aspEntre=(a,b)=>asp.find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a))||null;
  [['mercury','saturn'],['mercury','jupiter'],['mercury','moon'],['mercury','mars'],
   ['mercury','venus'],['moon','saturn'],['moon','venus'],['moon','mars'],
   ['sun','saturn'],['mars','saturn'],['venus','saturn'],['sun','jupiter']].forEach(([a,b])=>{
    const A=aspEntre(a,b);
    /* o valor é BOOLEANO — há ou não há aspecto. A conjunção tem ângulo
       zero, e guardar o ângulo cru faria a conjunção passar por ausência. */
    põe('asp.'+a+'-'+b, asp.length>0, !!A,
      A?(PT_NAME[a]+' '+A.gl+' '+PT_NAME[b]+' (orbe '+A.orb.toFixed(1)+'°)')
       :(PT_NAME[a]+' sem aspecto com '+PT_NAME[b]));
    if(A)F['asp.'+a+'-'+b].angulo=A.ang;
  });
  /* condição de Mercúrio e da Lua, sem transformar condição em competência */
  ['mercury','moon','saturn','jupiter','venus','mars'].forEach(k=>{
    const p=P[k];
    põe('dig.'+k, !!p, p?p.dig:null, p?(PT_NAME[k]+': '+p.dig):null);
    põe('retro.'+k, !!p, p?!!p.retro:null,
      p?(PT_NAME[k]+(p.retro?' retrógrado':' direto')):null);
  });
  /* balanço de elementos e modos — do mapa inteiro, não de um planeta */
  const somaEl=(typeof EL!=='undefined'&&EL)?EL:null;
  const somaMo=(typeof MO!=='undefined'&&MO)?MO:null;
  if(somaEl){
    const ord=Object.entries(somaEl).sort((a,b)=>b[1]-a[1]);
    põe('balanco.elemento', true, ord[0][0],
      'predomínio de '+ord[0][0]+' ('+ord.map(x=>x[0]+' '+x[1]).join(', ')+')');
    põe('balanco.elemento.margem', true, ord[0][1]-ord[1][1],
      'margem de '+(ord[0][1]-ord[1][1])+' pontos sobre o segundo elemento');
  } else { põe('balanco.elemento',false); põe('balanco.elemento.margem',false); }
  if(somaMo){
    const ord=Object.entries(somaMo).sort((a,b)=>b[1]-a[1]);
    põe('balanco.modo', true, ord[0][0],
      'predomínio '+ord[0][0]+' ('+ord.map(x=>x[0]+' '+x[1]).join(', ')+')');
  } else põe('balanco.modo',false);
  /* angularidade dos significadores principais */
  const ang=['sun','moon',NATAL.rulers?NATAL.rulers[1]:null].filter(Boolean)
    .filter(k=>P[k]&&[1,4,7,10].indexOf(P[k].h)>=0).length;
  põe('angularidade.significadores', !!(P.sun&&P.moon), ang,
    ang+' de 3 significadores (Sol, Lua, regente do Ascendente) em casa angular');
  /* casas do estudo e do discurso: quem as rege e quem as ocupa */
  [3,9,1,10].forEach(h=>{
    const r=NATAL.rulers?NATAL.rulers[h]:null;
    const ocup=Object.keys(P).filter(k=>['sun','moon','mercury','venus','mars','jupiter','saturn']
      .indexOf(k)>=0 && P[k].h===h);
    põe('casa'+h+'.regente', !!r, r, r?('casa '+h+' regida por '+PT_NAME[r]):null);
    põe('casa'+h+'.ocupantes', true, ocup,
      ocup.length?('casa '+h+' ocupada por '+ocup.map(k=>PT_NAME[k]).join(', ')
                  ):('casa '+h+' sem planeta'));
  });
  põe('seita', !!NATAL.sect, NATAL.sect, 'mapa '+NATAL.sect);
  /* dispositor de Mercúrio — quem administra o instrumento mental */
  const dispM=P.mercury?SIGN_RULER[signOf(P.mercury.lon)]:null;
  põe('dispositor.mercury', !!dispM, dispM,
    dispM?('Mercúrio disposto por '+PT_NAME[dispM]):null);
  F._aspectos=asp; F._temAsp=temAsp;
  return F;
}

/* ============================================================
   AS REGRAS — estágios 2 e 3 juntos, mas nomeados separadamente
   em cada regra.

   Formato de cada regra:
     id, versao        · identificação e versão
     sistema, escola   · a qual vocabulário a hipótese pertence
     familia           · agrupa regras que dependem do MESMO fator,
                         para que evidência correlacionada não se
                         multiplique
     exige             · ids de fatos necessários (≥2 sempre: nenhuma
                         regra dispara por fator isolado)
     quando(F)         · condição de aplicação
     leitura           · o que a tradição diz — estágio 2
     fontesNatais      · onde essa leitura se apoia
     hipotese          · o elo do app — estágio 3
     favorece/contraria· processos, com peso
     distincao         · o que este testemunho NÃO autoriza concluir
   ============================================================ */
const FONTE_TRADICAO={
  ptolomeu:{autor:'Cláudio Ptolomeu', obra:'Tetrabiblos',
    loc:'livro III — da qualidade da alma'},
  lilly:{autor:'William Lilly', obra:'Christian Astrology',
    loc:'livro I — das naturezas dos planetas e dos signos'},
  olavo:{autor:'Olavo de Carvalho', obra:'Os planetas nas casas',
    loc:'corpus incluído no app'},
  barbault:{autor:'André Barbault', obra:'De la psychanalyse à l’astrologie',
    loc:'signos e casas'}
};
/* nota devida sempre que se cita uma fonte astrológica numa regra
   tipológica — e que a interface exibe junto */
const AVISO_FONTE=
  'A fonte astrológica citada descreve o FATOR ASTROLÓGICO. Ela não afirma, '
  +'e não poderia afirmar, correspondência com um processo cognitivo do MBTI '
  +'ou com um elemento de metabolismo informacional da Sociônica: esses '
  +'vocabulários lhe são estranhos. O elo é hipótese deste app.';

/* ---------- regras para o vocabulário do MBTI ---------- */
/* Cada regra é uma CONFIGURAÇÃO: um conjunto de sinais independentes,
   dos quais um mínimo precisa ocorrer. Nunca dispara por fator
   isolado — `minimo` é sempre ≥ 2 —, e a interface mostra quais
   sinais efetivamente ocorreram, e não apenas que a regra “deu”.  */
const REGRAS_MBTI=[
  {id:'mbti.perc.divergente', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'percepcao-intuitiva', minimo:2,
   sinais:[
     {id:'merc-ar-fogo', texto:'Mercúrio em signo de ar ou de fogo',
      exige:['elem.mercury'], teste:F=>['ar','fogo'].indexOf(F['elem.mercury'].valor)>=0},
     {id:'merc-jupiter', texto:'Mercúrio em aspecto com Júpiter',
      exige:['asp.mercury-jupiter'], teste:F=>F['asp.mercury-jupiter'].valor},
     {id:'casa3-ocupada', texto:'planetas na casa do discurso próximo (3ª)',
      exige:['casa3.ocupantes'], teste:F=>(F['casa3.ocupantes'].valor||[]).length>0},
     {id:'mutavel', texto:'predomínio de signos mutáveis',
      exige:['balanco.modo'], teste:F=>F['balanco.modo'].valor==='mutável'}],
   leitura:'Mercúrio em elemento expansivo, em contato com Júpiter, ou com peso '
     +'na casa do discurso próximo, é descrito pela tradição como entendimento '
     +'que se amplia por associação e comparação, mais do que por retenção.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.ptolomeu],
   hipotese:'Se essa descrição corresponder a algo estável, o modo de perceber '
     +'tenderia a ramificar a partir do dado — abrir alternativas antes de fechar.',
   favorece:[['Ne',2]], contraria:[['Si',1]],
   distincao:'Não autoriza concluir criatividade, inteligência nem dispersão. '
     +'Descreve a via de entrada da informação, não a sua qualidade.'},

  {id:'mbti.perc.convergente', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'percepcao-intuitiva', minimo:2,
   sinais:[
     {id:'merc-agua', texto:'Mercúrio em signo de água',
      exige:['elem.mercury'], teste:F=>F['elem.mercury'].valor==='água'},
     {id:'merc-saturno', texto:'Mercúrio em aspecto com Saturno',
      exige:['asp.mercury-saturn'], teste:F=>F['asp.mercury-saturn'].valor},
     {id:'casa9-ocupada', texto:'planetas na casa da visão de conjunto (9ª)',
      exige:['casa9.ocupantes'], teste:F=>(F['casa9.ocupantes'].valor||[]).length>0},
     {id:'merc-recolhido', texto:'Mercúrio em lugar retirado (8ª, 12ª ou 4ª)',
      exige:['casa.mercury'], teste:F=>[8,12,4].indexOf(F['casa.mercury'].valor)>=0}],
   leitura:'Mercúrio em água ou sob configuração saturnina, e com peso no lugar '
     +'da visão de conjunto, é lido como entendimento que retém, aprofunda e '
     +'reduz muitos casos a um princípio.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.barbault],
   hipotese:'Corresponderia a uma percepção que converge — reduz o disperso a '
     +'uma leitura única do que está em curso.',
   favorece:[['Ni',2]], contraria:[['Ne',1]],
   distincao:'Não autoriza concluir acerto profético nem profundidade. Saturno '
     +'em contato com Mercúrio NÃO é lido aqui como Si: lentidão e referência '
     +'ao passado são coisas distintas.'},

  {id:'mbti.perc.presente', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'percepcao-sensorial', minimo:2,
   sinais:[
     {id:'significadores-angulares', texto:'dois ou mais significadores em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor>=2},
     {id:'casa1-ocupada', texto:'planetas no primeiro lugar',
      exige:['casa1.ocupantes'], teste:F=>(F['casa1.ocupantes'].valor||[]).length>0},
     {id:'marte-angular', texto:'Marte em casa angular',
      exige:['casa.mars'], teste:F=>[1,4,7,10].indexOf(F['casa.mars'].valor)>=0},
     {id:'cardinal', texto:'predomínio de signos cardinais',
      exige:['balanco.modo'], teste:F=>F['balanco.modo'].valor==='cardinal'}],
   leitura:'Significadores angulares e forte ocupação do primeiro lugar são '
     +'descritos como presença imediata no campo concreto: a pessoa está onde está.',
   fontesNatais:[FONTE_TRADICAO.ptolomeu, FONTE_TRADICAO.olavo],
   hipotese:'Sugeriria uma percepção que registra o campo concreto no momento '
     +'em que ele ocorre, sem passar por referência interna acumulada.',
   favorece:[['Se',2]], contraria:[['Ni',1]],
   distincao:'Não autoriza concluir assertividade, coragem nem gosto por ação '
     +'física — isso seria trocar percepção por comportamento.'},

  {id:'mbti.perc.acumulada', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'percepcao-sensorial', minimo:2,
   sinais:[
     {id:'fixo', texto:'predomínio de signos fixos',
      exige:['balanco.modo'], teste:F=>F['balanco.modo'].valor==='fixo'},
     {id:'lua-saturno', texto:'Lua em aspecto com Saturno',
      exige:['asp.moon-saturn'], teste:F=>F['asp.moon-saturn'].valor},
     {id:'saturno-digno', texto:'Saturno em dignidade própria',
      exige:['dig.saturn'], teste:F=>/domicílio|exaltação|triplicidade/.test(F['dig.saturn'].valor||'')},
     {id:'terra', texto:'predomínio do elemento terra',
      exige:['balanco.elemento'], teste:F=>F['balanco.elemento'].valor==='terra'}],
   leitura:'Predomínio fixo ou de terra, com Saturno em contato com a Lua ou em '
     +'dignidade própria, é lido como memória do que se provou: o presente é '
     +'medido pelo que já foi.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.barbault],
   hipotese:'Corresponderia a referenciar o presente contra um registro interno '
     +'acumulado da experiência.',
   favorece:[['Si',2]], contraria:[['Se',1]],
   distincao:'Não é boa memória — memória é capacidade cognitiva, medida por '
     +'outros meios. E a dignidade de Saturno aqui NÃO é lida como competência '
     +'psicológica; é apenas parte da configuração.'},

  {id:'mbti.julg.coerencia', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'julgamento-logico', minimo:2,
   sinais:[
     {id:'merc-saturno', texto:'Mercúrio em aspecto com Saturno',
      exige:['asp.mercury-saturn'], teste:F=>F['asp.mercury-saturn'].valor},
     {id:'merc-disposto-frio', texto:'Mercúrio disposto por Saturno ou por si mesmo',
      exige:['dispositor.mercury'],
      teste:F=>['saturn','mercury'].indexOf(F['dispositor.mercury'].valor)>=0},
     {id:'casa9-fria', texto:'casa da visão de conjunto regida por Saturno ou Mercúrio',
      exige:['casa9.regente'], teste:F=>['saturn','mercury'].indexOf(F['casa9.regente'].valor)>=0},
     {id:'merc-recolhido', texto:'Mercúrio em lugar retirado (8ª, 12ª, 4ª ou 6ª)',
      exige:['casa.mercury'], teste:F=>[8,12,4,6].indexOf(F['casa.mercury'].valor)>=0},
     {id:'merc-digno', texto:'Mercúrio em dignidade própria',
      exige:['dig.mercury'],
      teste:F=>/domicílio|exaltação|triplicidade/.test(F['dig.mercury'].valor||'')},
     {id:'merc-ar-terra', texto:'Mercúrio em signo de ar ou de terra',
      exige:['elem.mercury'], teste:F=>['ar','terra'].indexOf(F['elem.mercury'].valor)>=0}],
   leitura:'Mercúrio ligado a Saturno, administrado por ele ou por si mesmo, em '
     +'dignidade própria ou em elemento que separa e ordena, é descrito como '
     +'entendimento que exige definição antes de afirmar, e que não se contenta '
     +'com autoridade externa.',
   fontesNatais:[FONTE_TRADICAO.lilly],
   hipotese:'Sugeriria um critério de decisão interno à estrutura: define '
     +'termos, procura a contradição, adia a conclusão.',
   favorece:[['Ti',2]], contraria:[['Te',1]],
   distincao:'Não autoriza concluir rigor acadêmico, inteligência nem frieza. '
     +'Não se adota aqui a identidade Mercúrio = Ti: a regra exige configuração, '
     +'e outros arranjos de Mercúrio favorecem Te.'},

  {id:'mbti.julg.resultado', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'julgamento-logico', minimo:2,
   sinais:[
     {id:'casa10-ocupada', texto:'planetas no lugar da obra pública (10ª)',
      exige:['casa10.ocupantes'], teste:F=>(F['casa10.ocupantes'].valor||[]).length>0},
     {id:'merc-oficio', texto:'Mercúrio nos lugares do ofício e do recurso (6ª, 10ª ou 2ª)',
      exige:['casa.mercury'], teste:F=>[6,10,2].indexOf(F['casa.mercury'].valor)>=0},
     {id:'significadores-angulares', texto:'dois ou mais significadores em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor>=2},
     {id:'casa10-ativa', texto:'casa 10 regida por Marte, Saturno ou Sol',
      exige:['casa10.regente'], teste:F=>['mars','saturn','sun'].indexOf(F['casa10.regente'].valor)>=0}],
   leitura:'Peso no lugar da obra pública, com significadores angulares e o '
     +'entendimento aplicado ao ofício, é descrito como orientação para o efeito '
     +'visível do que se faz.',
   fontesNatais:[FONTE_TRADICAO.olavo, FONTE_TRADICAO.ptolomeu],
   hipotese:'Corresponderia a decidir por critério externo verificável — o que '
     +'funciona, o que a medida mostra.',
   favorece:[['Te',2]], contraria:[['Ti',1]],
   distincao:'Não autoriza concluir eficiência nem competência gerencial. '
     +'Eficiência é resultado observável; aqui trata-se de critério de decisão.'},

  {id:'mbti.julg.valor-proprio', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'julgamento-valor', minimo:2,
   sinais:[
     {id:'venus-retentiva', texto:'Vênus em elemento retentivo (terra ou água)',
      exige:['elem.venus'], teste:F=>['terra','água'].indexOf(F['elem.venus'].valor)>=0},
     {id:'venus-intima', texto:'Vênus em lugar íntimo (4ª, 8ª, 12ª ou 2ª)',
      exige:['casa.venus'], teste:F=>[4,8,12,2].indexOf(F['casa.venus'].valor)>=0},
     {id:'venus-saturno', texto:'Vênus em aspecto com Saturno',
      exige:['asp.venus-saturn'], teste:F=>F['asp.venus-saturn'].valor},
     {id:'lua-recolhida', texto:'Lua em lugar retirado (4ª, 8ª ou 12ª)',
      exige:['casa.moon'], teste:F=>[4,8,12].indexOf(F['casa.moon'].valor)>=0}],
   leitura:'Vênus em elemento retentivo, alojada nos lugares mais íntimos ou '
     +'ligada a Saturno, é lida como apreço que se forma por dentro e não se '
     +'negocia em público.',
   fontesNatais:[FONTE_TRADICAO.barbault, FONTE_TRADICAO.olavo],
   hipotese:'Sugeriria uma hierarquia interna de valor como critério de decisão, '
     +'pouco declarada e pouco sujeita a acordo.',
   favorece:[['Fi',2]], contraria:[['Fe',1]],
   distincao:'Não autoriza concluir sensibilidade, bondade nem emotividade. '
     +'Também não se adota a identidade Lua = Fi: a Lua entra apenas como parte '
     +'da configuração, e noutras regras favorece processos diferentes.'},

  {id:'mbti.julg.valor-comum', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'julgamento-valor', minimo:2,
   sinais:[
     {id:'venus-expansiva', texto:'Vênus em elemento expansivo (ar ou fogo)',
      exige:['elem.venus'], teste:F=>['ar','fogo'].indexOf(F['elem.venus'].valor)>=0},
     {id:'venus-convivio', texto:'Vênus nos lugares do trato com outros (3ª, 7ª, 10ª ou 11ª)',
      exige:['casa.venus'], teste:F=>[3,7,10,11].indexOf(F['casa.venus'].valor)>=0},
     {id:'lua-convivio', texto:'Lua nos lugares do convívio (3ª, 5ª, 7ª ou 11ª)',
      exige:['casa.moon'], teste:F=>[3,5,7,11].indexOf(F['casa.moon'].valor)>=0},
     {id:'lua-venus', texto:'Lua em aspecto com Vênus',
      exige:['asp.moon-venus'], teste:F=>F['asp.moon-venus'].valor}],
   leitura:'Vênus em elemento expansivo, nos lugares do trato com outros, é '
     +'descrita como apreço que se estabelece no acordo e circula entre as pessoas.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.barbault],
   hipotese:'Corresponderia a decidir por valor compartilhado e pelo efeito no '
     +'campo entre as pessoas.',
   favorece:[['Fe',2]], contraria:[['Fi',1]],
   distincao:'Não autoriza concluir simpatia, carisma nem dependência de '
     +'aprovação. Expressividade não é critério de juízo: pode-se ser expressivo '
     +'e decidir por Fi.'},

  {id:'mbti.orient.externa', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'orientacao-energia', minimo:2,
   sinais:[
     {id:'significadores-angulares', texto:'dois ou mais significadores em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor>=2},
     {id:'sol-exposto', texto:'Sol em lugar de exposição (1ª, 7ª, 10ª ou 11ª)',
      exige:['casa.sun'], teste:F=>[1,7,10,11].indexOf(F['casa.sun'].valor)>=0},
     {id:'lua-exposta', texto:'Lua em lugar de exposição (1ª, 7ª, 10ª ou 11ª)',
      exige:['casa.moon'], teste:F=>[1,7,10,11].indexOf(F['casa.moon'].valor)>=0},
     {id:'expansivo', texto:'predomínio de fogo ou de ar',
      exige:['balanco.elemento'], teste:F=>['fogo','ar'].indexOf(F['balanco.elemento'].valor)>=0}],
   leitura:'Significadores angulares e luminares em lugares de exposição são '
     +'lidos como vida cujo eixo se decide no mundo visível.',
   fontesNatais:[FONTE_TRADICAO.ptolomeu, FONTE_TRADICAO.olavo],
   hipotese:'Sugeriria que o processo mais desenvolvido é o voltado para fora — '
     +'o que, na convenção adotada, corresponde a dominante extrovertida.',
   favorece:[['orientacao:externa',2]], contraria:[['orientacao:interna',1]],
   distincao:'Não é sociabilidade. Uma pessoa retraída pode ter o processo '
     +'dominante voltado ao objeto, e uma pessoa muito sociável pode tê-lo '
     +'voltado ao sujeito.'},

  {id:'mbti.orient.interna', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'orientacao-energia', minimo:2,
   sinais:[
     {id:'poucos-angulares', texto:'no máximo um significador em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor<=1},
     {id:'sol-retirado', texto:'Sol em lugar retirado (4ª, 6ª, 8ª ou 12ª)',
      exige:['casa.sun'], teste:F=>[12,8,4,6].indexOf(F['casa.sun'].valor)>=0},
     {id:'lua-retirada', texto:'Lua em lugar retirado (4ª, 6ª, 8ª ou 12ª)',
      exige:['casa.moon'], teste:F=>[12,8,4,6].indexOf(F['casa.moon'].valor)>=0},
     {id:'retentivo', texto:'predomínio de terra ou de água',
      exige:['balanco.elemento'], teste:F=>['terra','água'].indexOf(F['balanco.elemento'].valor)>=0}],
   leitura:'Significadores cadentes ou retirados, com luminares nos lugares menos '
     +'expostos, são descritos como vida cujo eixo se decide por dentro.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.barbault],
   hipotese:'Sugeriria dominante voltada ao fator subjetivo, com o processo '
     +'externo em função auxiliar.',
   favorece:[['orientacao:interna',2]], contraria:[['orientacao:externa',1]],
   distincao:'Não é timidez nem isolamento, e não se lê casa 12 como introversão. '
     +'Lugar cadente descreve exposição, não preferência cognitiva.'},

  {id:'mbti.trato.fechar', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'trato-externo', minimo:2,
   sinais:[
     {id:'cardinal-ou-fixo', texto:'predomínio cardinal ou fixo',
      exige:['balanco.modo'], teste:F=>['cardinal','fixo'].indexOf(F['balanco.modo'].valor)>=0},
     {id:'casa10-ocupada', texto:'planetas no lugar da obra pública (10ª)',
      exige:['casa10.ocupantes'], teste:F=>(F['casa10.ocupantes'].valor||[]).length>0},
     {id:'saturno-digno', texto:'Saturno em domicílio ou exaltação',
      exige:['dig.saturn'], teste:F=>/domicílio|exaltação/.test(F['dig.saturn'].valor||'')},
     {id:'saturno-angular', texto:'Saturno em casa angular',
      exige:['casa.saturn'], teste:F=>[1,4,7,10].indexOf(F['casa.saturn'].valor)>=0}],
   leitura:'Predomínio cardinal ou fixo, com peso no lugar da obra e Saturno '
     +'estabelecido, é lido como disposição a iniciar e concluir no mundo externo.',
   fontesNatais:[FONTE_TRADICAO.ptolomeu],
   hipotese:'Na convenção adotada, favoreceria um processo de JULGAMENTO no '
     +'trato externo — a letra J.',
   favorece:[['trato:julgamento',2]], contraria:[['trato:percepcao',1]],
   distincao:'Não é disciplina, não é pontualidade e não é organização material. '
     +'Disciplina é comportamento aprendido, e frequentemente exigido pelo ofício.'},

  {id:'mbti.trato.abrir', versao:'2.0', sistema:'mbti', escola:MBTI_CONVENCAO.id,
   familia:'trato-externo', minimo:2,
   sinais:[
     {id:'mutavel', texto:'predomínio de signos mutáveis',
      exige:['balanco.modo'], teste:F=>F['balanco.modo'].valor==='mutável'},
     {id:'merc-jupiter', texto:'Mercúrio em aspecto com Júpiter',
      exige:['asp.mercury-jupiter'], teste:F=>F['asp.mercury-jupiter'].valor},
     {id:'casa3-ocupada', texto:'planetas na casa do discurso próximo (3ª)',
      exige:['casa3.ocupantes'], teste:F=>(F['casa3.ocupantes'].valor||[]).length>0},
     {id:'poucos-angulares', texto:'no máximo um significador em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor<=1}],
   leitura:'Predomínio mutável, com Mercúrio em contato expansivo e significadores '
     +'pouco fixados, é descrito como disposição a manter aberto e recolher mais '
     +'antes de decidir.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.barbault],
   hipotese:'Favoreceria um processo de PERCEPÇÃO no trato externo — a letra P.',
   favorece:[['trato:percepcao',2]], contraria:[['trato:julgamento',1]],
   distincao:'Não é desorganização nem indisciplina.'}
];

/* ---------- regras para o vocabulário da Sociônica ----------
   Rigorosamente independentes: partem das DEFINIÇÕES SOCIÔNICAS dos
   elementos (potencial, tempo, força, conforto, fato, estrutura,
   emoção expressa, relação pessoal) — e não das definições do MBTI,
   ainda que os símbolos coincidam. Por isso as configurações que as
   acionam são OUTRAS, e é esperado que os dois sistemas cheguem a
   resultados diferentes. */
const REGRAS_SOC=[
  {id:'soc.Ne.potencial', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-intuicao', minimo:2,
   sinais:[
     {id:'merc-jupiter', texto:'Mercúrio em aspecto com Júpiter',
      exige:['asp.mercury-jupiter'], teste:F=>F['asp.mercury-jupiter'].valor},
     {id:'jupiter-expansivo', texto:'Júpiter em signo de ar ou de fogo',
      exige:['elem.jupiter'], teste:F=>['ar','fogo'].indexOf(F['elem.jupiter'].valor)>=0},
     {id:'casa9-ocupada', texto:'planetas na casa do que se busca além do dado (9ª)',
      exige:['casa9.ocupantes'], teste:F=>(F['casa9.ocupantes'].valor||[]).length>0},
     {id:'sol-jupiter', texto:'Sol em aspecto com Júpiter',
      exige:['asp.sun-jupiter'], teste:F=>F['asp.sun-jupiter'].valor}],
   leitura:'Júpiter em contato com o entendimento e com peso na casa do que se '
     +'busca além do dado é lido como apreensão do que uma coisa pode vir a ser.',
   fontesNatais:[FONTE_TRADICAO.lilly],
   hipotese:'Na grade sociônica, isto tocaria o aspecto do POTENCIAL e das '
     +'propriedades inerentes dos objetos — Ne, que aqui NÃO é a divergência do '
     +'MBTI, mas informação sobre essência e capacidade.',
   favorece:[['Ne',2]], contraria:[['Si',1]],
   distincao:'Não autoriza concluir criatividade nem otimismo.'},

  {id:'soc.Ni.tempo', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-intuicao', minimo:2,
   sinais:[
     {id:'merc-saturno', texto:'Mercúrio em aspecto com Saturno',
      exige:['asp.mercury-saturn'], teste:F=>F['asp.mercury-saturn'].valor},
     {id:'saturno-agua', texto:'Saturno em signo de água',
      exige:['elem.saturn'], teste:F=>F['elem.saturn'].valor==='água'},
     {id:'saturno-lento', texto:'Saturno nos lugares do que amadurece devagar (4ª, 8ª, 9ª ou 12ª)',
      exige:['casa.saturn'], teste:F=>[8,12,9,4].indexOf(F['casa.saturn'].valor)>=0},
     {id:'sol-saturno', texto:'Sol em aspecto com Saturno',
      exige:['asp.sun-saturn'], teste:F=>F['asp.sun-saturn'].valor},
     {id:'lua-saturno', texto:'Lua em aspecto com Saturno',
      exige:['asp.moon-saturn'], teste:F=>F['asp.moon-saturn'].valor},
     {id:'agua', texto:'predomínio do elemento água',
      exige:['balanco.elemento'], teste:F=>F['balanco.elemento'].valor==='água'}],
   leitura:'Saturno ligado aos luminares ou ao entendimento, alojado nos lugares '
     +'do que amadurece lentamente, é descrito como percepção do prazo e da sequência.',
   fontesNatais:[FONTE_TRADICAO.ptolomeu, FONTE_TRADICAO.barbault],
   hipotese:'Corresponderia ao aspecto TEMPORAL da informação — Ni sociônico: o '
     +'desdobramento dos processos, e não visão nem introspecção.',
   favorece:[['Ni',2]], contraria:[['Se',1]],
   distincao:'Saturno não é aqui identificado a Si nem a função inferior; a sua '
     +'condição não é lida como competência.'},

  {id:'soc.Se.forca', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-sensacao', minimo:2,
   sinais:[
     {id:'marte-angular', texto:'Marte em casa angular',
      exige:['casa.mars'], teste:F=>[1,4,7,10].indexOf(F['casa.mars'].valor)>=0},
     {id:'marte-digno', texto:'Marte em dignidade própria',
      exige:['dig.mars'], teste:F=>/domicílio|exaltação|triplicidade/.test(F['dig.mars'].valor||'')},
     {id:'significadores-angulares', texto:'dois ou mais significadores em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor>=2},
     {id:'marte-fogo-terra', texto:'Marte em signo de fogo ou de terra',
      exige:['elem.mars'], teste:F=>['fogo','terra'].indexOf(F['elem.mars'].valor)>=0}],
   leitura:'Marte estabelecido e em lugar angular é lido pela tradição como '
     +'capacidade de ocupar posição e de sustentar embate.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.ptolomeu],
   hipotese:'Tocaria o aspecto sociônico da FORÇA e do território — Se: '
     +'qualidades externas mobilizáveis dos objetos.',
   favorece:[['Se',2]], contraria:[['Ni',1]],
   distincao:'Não autoriza concluir agressividade como traço de caráter. A '
     +'dignidade de Marte não é lida como competência psicológica.'},

  {id:'soc.Si.conforto', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-sensacao', minimo:2,
   sinais:[
     {id:'venus-receptiva', texto:'Vênus em elemento receptivo (terra ou água)',
      exige:['elem.venus'], teste:F=>['terra','água'].indexOf(F['elem.venus'].valor)>=0},
     {id:'lua-corpo', texto:'Lua nos lugares do corpo e do alojamento (2ª, 4ª ou 6ª)',
      exige:['casa.moon'], teste:F=>[4,6,2].indexOf(F['casa.moon'].valor)>=0},
     {id:'lua-venus', texto:'Lua em aspecto com Vênus',
      exige:['asp.moon-venus'], teste:F=>F['asp.moon-venus'].valor},
     {id:'lua-receptiva', texto:'Lua em elemento receptivo (terra ou água)',
      exige:['elem.moon'], teste:F=>['terra','água'].indexOf(F['elem.moon'].valor)>=0}],
   leitura:'Vênus e Lua em elementos receptivos, nos lugares do corpo e do '
     +'alojamento, são descritas como cuidado com o estado físico e o bem-estar.',
   fontesNatais:[FONTE_TRADICAO.olavo, FONTE_TRADICAO.barbault],
   hipotese:'Corresponderia ao Si sociônico — sensação de conforto e acomodação '
     +'entre corpo e ambiente. Note-se que este Si NÃO é memória do passado: aí '
     +'a definição sociônica se afasta claramente da do MBTI, e é por isso que '
     +'esta regra parte de fatores diferentes.',
   favorece:[['Si',2]], contraria:[['Ne',1]],
   distincao:'Não autoriza concluir preguiça, conservadorismo nem apego.'},

  {id:'soc.Ti.estrutura', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-logica', minimo:2,
   sinais:[
     {id:'merc-disposto-frio', texto:'Mercúrio disposto por Saturno ou por si mesmo',
      exige:['dispositor.mercury'],
      teste:F=>['saturn','mercury'].indexOf(F['dispositor.mercury'].valor)>=0},
     {id:'merc-saturno', texto:'Mercúrio em aspecto com Saturno',
      exige:['asp.mercury-saturn'], teste:F=>F['asp.mercury-saturn'].valor},
     {id:'casa9-fria', texto:'casa 9 regida por Saturno ou Mercúrio',
      exige:['casa9.regente'], teste:F=>['saturn','mercury'].indexOf(F['casa9.regente'].valor)>=0},
     {id:'merc-ar-terra', texto:'Mercúrio em signo de ar ou de terra',
      exige:['elem.mercury'], teste:F=>['ar','terra'].indexOf(F['elem.mercury'].valor)>=0},
     {id:'merc-digno', texto:'Mercúrio em dignidade própria',
      exige:['dig.mercury'],
      teste:F=>/domicílio|exaltação|triplicidade/.test(F['dig.mercury'].valor||'')},
     {id:'saturno-ordenador', texto:'Saturno em signo de ar ou de terra',
      exige:['elem.saturn'], teste:F=>['ar','terra'].indexOf(F['elem.saturn'].valor)>=0}],
   leitura:'Entendimento administrado por Saturno, em dignidade própria, ou em '
     +'elemento que separa e ordena, é lido como inclinação a classificar, '
     +'delimitar e hierarquizar.',
   fontesNatais:[FONTE_TRADICAO.lilly],
   hipotese:'Tocaria o Ti sociônico — relações lógicas entre objetos, '
     +'classificação e sistema; informação sobre estrutura, não capacidade analítica.',
   favorece:[['Ti',2]], contraria:[['Te',1]],
   distincao:'Não autoriza concluir inteligência analítica.'},

  {id:'soc.Te.fato', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-logica', minimo:2,
   sinais:[
     {id:'merc-oficio', texto:'Mercúrio nos lugares do ofício e do recurso (2ª, 6ª ou 10ª)',
      exige:['casa.mercury'], teste:F=>[6,10,2].indexOf(F['casa.mercury'].valor)>=0},
     {id:'saturno-oficio', texto:'Saturno nos lugares do ofício e do recurso (2ª, 6ª ou 10ª)',
      exige:['casa.saturn'], teste:F=>[6,10,2].indexOf(F['casa.saturn'].valor)>=0},
     {id:'casa10-operativa', texto:'casa 10 regida por Mercúrio, Saturno ou Marte',
      exige:['casa10.regente'],
      teste:F=>['mercury','saturn','mars'].indexOf(F['casa10.regente'].valor)>=0},
     {id:'merc-terra', texto:'Mercúrio em signo de terra',
      exige:['elem.mercury'], teste:F=>F['elem.mercury'].valor==='terra'},
     {id:'saturno-terra', texto:'Saturno em signo de terra',
      exige:['elem.saturn'], teste:F=>F['elem.saturn'].valor==='terra'},
     {id:'marte-oficio', texto:'Marte nos lugares do ofício e do recurso (2ª, 6ª ou 10ª)',
      exige:['casa.mars'], teste:F=>[6,10,2].indexOf(F['casa.mars'].valor)>=0}],
   leitura:'Mercúrio, Saturno ou Marte nos lugares do ofício e do recurso são descritos '
     +'como entendimento aplicado ao procedimento e ao rendimento.',
   fontesNatais:[FONTE_TRADICAO.olavo, FONTE_TRADICAO.lilly],
   hipotese:'Corresponderia ao Te sociônico — o funcionamento objetivo, o fato e '
     +'o método de trabalho.',
   favorece:[['Te',2]], contraria:[['Ti',1]],
   distincao:'Não autoriza concluir competência gerencial nem eficiência.'},

  {id:'soc.Fe.emocao', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-etica', minimo:2,
   sinais:[
     {id:'lua-expansiva', texto:'Lua em signo de fogo ou de ar',
      exige:['elem.moon'], teste:F=>['fogo','ar'].indexOf(F['elem.moon'].valor)>=0},
     {id:'lua-convivio', texto:'Lua nos lugares do convívio (3ª, 5ª, 7ª ou 11ª)',
      exige:['casa.moon'], teste:F=>[5,11,7,3].indexOf(F['casa.moon'].valor)>=0},
     {id:'venus-convivio', texto:'Vênus nos lugares do convívio (3ª, 5ª, 7ª ou 11ª)',
      exige:['casa.venus'], teste:F=>[5,11,7,3].indexOf(F['casa.venus'].valor)>=0},
     {id:'venus-expansiva', texto:'Vênus em signo de fogo ou de ar',
      exige:['elem.venus'], teste:F=>['fogo','ar'].indexOf(F['elem.venus'].valor)>=0}],
   leitura:'Lua e Vênus em elementos expansivos, nos lugares do convívio, são '
     +'lidas como ânimo que se comunica e contagia o ambiente.',
   fontesNatais:[FONTE_TRADICAO.barbault, FONTE_TRADICAO.lilly],
   hipotese:'Tocaria o Fe sociônico — estados emocionais como informação '
     +'transmissível e modulável.',
   favorece:[['Fe',2]], contraria:[['Fi',1]],
   distincao:'Não autoriza concluir simpatia nem afetividade da pessoa: trata-se '
     +'do aspecto emocional expresso, não do caráter.'},

  {id:'soc.Fi.relacao', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-etica', minimo:2,
   sinais:[
     {id:'venus-retentiva', texto:'Vênus em elemento retentivo (terra ou água)',
      exige:['elem.venus'], teste:F=>['terra','água'].indexOf(F['elem.venus'].valor)>=0},
     {id:'venus-vinculo', texto:'Vênus nos lugares do vínculo profundo (4ª, 7ª, 8ª ou 12ª)',
      exige:['casa.venus'], teste:F=>[8,4,12,7].indexOf(F['casa.venus'].valor)>=0},
     {id:'venus-saturno', texto:'Vênus em aspecto com Saturno',
      exige:['asp.venus-saturn'], teste:F=>F['asp.venus-saturn'].valor},
     {id:'lua-retentiva', texto:'Lua em elemento retentivo (terra ou água)',
      exige:['elem.moon'], teste:F=>['terra','água'].indexOf(F['elem.moon'].valor)>=0}],
   leitura:'Vênus em elemento retentivo, ligada a Saturno ou nos lugares do '
     +'vínculo profundo, é descrita como afeição seletiva e obrigação assumida.',
   fontesNatais:[FONTE_TRADICAO.lilly, FONTE_TRADICAO.olavo],
   hipotese:'Corresponderia ao Fi sociônico — relações subjetivas entre pessoas: '
     +'proximidade, distância e o que se deve a quem.',
   favorece:[['Fi',2]], contraria:[['Fe',1]],
   distincao:'Não autoriza concluir bondade nem sensibilidade.'},

  {id:'soc.racional', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-racionalidade', minimo:2,
   sinais:[
     {id:'cardinal-ou-fixo', texto:'predomínio cardinal ou fixo',
      exige:['balanco.modo'], teste:F=>['cardinal','fixo'].indexOf(F['balanco.modo'].valor)>=0},
     {id:'significadores-angulares', texto:'dois ou mais significadores em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor>=2},
     {id:'saturno-digno', texto:'Saturno em domicílio ou exaltação',
      exige:['dig.saturn'], teste:F=>/domicílio|exaltação/.test(F['dig.saturn'].valor||'')},
     {id:'lua-estavel', texto:'Lua em lugar sucedente ou angular',
      exige:['casa.moon'], teste:F=>[1,2,4,5,7,8,10,11].indexOf(F['casa.moon'].valor)>=0}],
   leitura:'Predomínio cardinal ou fixo, com significadores estabelecidos, é lido '
     +'como conduta que se orienta por decisão firmada.',
   fontesNatais:[FONTE_TRADICAO.ptolomeu],
   hipotese:'Favoreceria um tipo de função BASE de julgamento — na Sociônica, um '
     +'tipo racional.',
   favorece:[['racionalidade:racional',2]], contraria:[['racionalidade:irracional',1]],
   distincao:'Racionalidade sociônica NÃO é a dicotomia J/P do MBTI, e esta regra '
     +'não é a mesma que a de trato externo: parte de outra premissa e conclui '
     +'sobre outra coisa.'},

  {id:'soc.irracional', versao:'2.0', sistema:'socionica', escola:SOC_FONTE.escola,
   familia:'soc-racionalidade', minimo:2,
   sinais:[
     {id:'mutavel', texto:'predomínio de signos mutáveis',
      exige:['balanco.modo'], teste:F=>F['balanco.modo'].valor==='mutável'},
     {id:'poucos-angulares', texto:'no máximo um significador em casa angular',
      exige:['angularidade.significadores'], teste:F=>F['angularidade.significadores'].valor<=1},
     {id:'lua-cadente', texto:'Lua em lugar cadente (3ª, 6ª, 9ª ou 12ª)',
      exige:['casa.moon'], teste:F=>[3,6,9,12].indexOf(F['casa.moon'].valor)>=0},
     {id:'merc-cadente', texto:'Mercúrio em lugar cadente (3ª, 6ª, 9ª ou 12ª)',
      exige:['casa.mercury'], teste:F=>[3,6,9,12].indexOf(F['casa.mercury'].valor)>=0}],
   leitura:'Predomínio mutável com significadores cadentes é lido como conduta '
     +'que se ajusta ao que aparece.',
   fontesNatais:[FONTE_TRADICAO.ptolomeu, FONTE_TRADICAO.barbault],
   hipotese:'Favoreceria uma função BASE de percepção — um tipo irracional.',
   favorece:[['racionalidade:irracional',2]], contraria:[['racionalidade:racional',1]],
   distincao:'Irracional não significa ilógico nem desatinado.'}
];

/* ============================================================
   APLICAÇÃO DAS REGRAS
   Devolve TESTEMUNHOS, cada um com origem declarada. Uma regra só
   dispara quando um mínimo de sinais INDEPENDENTES ocorre — nunca
   por fator isolado. Evidência correlacionada é limitada por
   família: dentro de uma família, o segundo testemunho e os
   seguintes entram com peso reduzido.
   ============================================================ */
function ponteAplicar(regras, F){
  if(!F)return {testemunhos:[], indeterminadas:[], fatosUsados:[], semDados:true};
  const testemunhos=[], indeterminadas=[], usados=new Set();
  const porFamilia={};
  regras.forEach(R=>{
    /* sinais cujos fatos não puderam ser apurados ficam INDETERMINADOS —
       não contam como ausência, e não são preenchidos por neutro */
    const avaliados=R.sinais.map(S=>{
      const faltando=S.exige.filter(id=>!F[id]||!F[id].ok);
      if(faltando.length)return {sinal:S, estado:'indeterminado', faltando};
      let ok=false;
      try{ ok=!!S.teste(F); }catch(e){ ok=false; }
      return {sinal:S, estado:ok?'ocorre':'ausente',
        evidencia:S.exige.map(id=>F[id].desc).filter(Boolean)};
    });
    const ocorrem=avaliados.filter(a=>a.estado==='ocorre');
    const indets=avaliados.filter(a=>a.estado==='indeterminado');
    const disponiveis=avaliados.length-indets.length;
    if(disponiveis<R.minimo){
      indeterminadas.push({regra:R.id,
        faltando:[...new Set(indets.flatMap(a=>a.faltando))],
        porque:'faltam dados para avaliar sinais suficientes desta regra ('
          +disponiveis+' avaliáveis, '+R.minimo+' necessários). A hipótese '
          +'permanece DESCONHECIDA — não é preenchida com um valor neutro.'});
      return;
    }
    if(ocorrem.length<R.minimo)return;   // configuração não se formou
    porFamilia[R.familia]=(porFamilia[R.familia]||0)+1;
    const ordem=porFamilia[R.familia];
    /* atenuação de evidência correlacionada: a 2ª regra da mesma família
       vale metade; da 3ª em diante, um quarto */
    const atenua= ordem===1?1 : ordem===2?0.5 : 0.25;
    /* um sinal a mais do que o mínimo reforça a configuração, com
       retorno decrescente e teto — mais sinais não viram certeza */
    const excedente=Math.min(2, ocorrem.length-R.minimo);
    const reforco=1+excedente*0.25;
    const origens=[...new Set(ocorrem.flatMap(a=>a.sinal.exige))];
    origens.forEach(id=>usados.add(id));
    testemunhos.push({
      regra:R.id, versao:R.versao, sistema:R.sistema, escola:R.escola,
      familia:R.familia, ordemNaFamilia:ordem, atenuacao:atenua, reforco,
      minimo:R.minimo, sinaisOcorridos:ocorrem.map(a=>a.sinal.texto),
      sinaisAusentes:avaliados.filter(a=>a.estado==='ausente').map(a=>a.sinal.texto),
      sinaisIndeterminados:indets.map(a=>a.sinal.texto),
      origens,
      evidencia:[...new Set(ocorrem.flatMap(a=>a.evidencia||[]))],
      leitura:R.leitura, fontesNatais:R.fontesNatais, avisoFonte:AVISO_FONTE,
      hipotese:R.hipotese, distincao:R.distincao,
      favorece:R.favorece.map(([p,w])=>[p, +(w*atenua*reforco).toFixed(3)]),
      contraria:(R.contraria||[]).map(([p,w])=>[p, +(w*atenua*reforco).toFixed(3)])
    });
  });
  return {testemunhos, indeterminadas, fatosUsados:[...usados],
    cobertura:regras.length?(testemunhos.length+'/'+regras.length+' regras aplicáveis'):'—',
    semDados:false};
}

/* apoio e contradição por processo, sem produzir “certeza” alguma */
function ponteApoios(res){
  const A={};
  const põe=(p,w,t,contra)=>{
    A[p]=A[p]||{processo:p, apoio:0, contra:0, testemunhos:[], contraTestemunhos:[]};
    if(contra){A[p].contra+=w; A[p].contraTestemunhos.push(t);}
    else {A[p].apoio+=w; A[p].testemunhos.push(t);}
  };
  res.testemunhos.forEach(t=>{
    t.favorece.forEach(([p,w])=>põe(p,w,t,false));
    t.contraria.forEach(([p,w])=>põe(p,w,t,true));
  });
  Object.values(A).forEach(x=>{x.apoio=+x.apoio.toFixed(3);x.contra=+x.contra.toFixed(3);});
  return A;
}
