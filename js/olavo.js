/* ============================================================
   OLAVO.JS — camada psicológica das casas (Olavo de Carvalho,
   "Planetas nas Casas"), decomposta em duas peças:

     MODO   — como cada planeta opera psiquicamente (fixo por planeta)
     CAMPO  — sobre o que ele opera (fixo por casa)

   A síntese do material é sempre MODO + CAMPO. Guardá-las separadas
   permite o que o material impresso não faz: trocar o CAMPO pela
   regência concreta do planeta no mapa. Sol na 11 não vira "apoteose"
   genérica — vira apoteose *daquilo que o Sol rege naquele mapa*.

   Mercúrio não consta do material; a camada simplesmente não se aplica
   a ele, e o app diz isso em vez de inventar.
   ============================================================ */

/* como o planeta opera — o verbo psíquico */
const OL_MODO={
  sun    :{v:'intui e toma como modelo de toda a percepção da realidade',   n:'inteligência intuitiva'},
  moon   :{v:'sente como fonte principal de motivação ou desmotivação',      n:'termômetro do ânimo'},
  venus  :{v:'imagina poder moldar sempre em sentido proveitoso',            n:'expectativa de gratificação'},
  mars   :{v:'reage de modo pronto, exteriorizado e fugaz a tudo que afete', n:'reflexo de defesa'},
  jupiter:{v:'age como se tivesse o poder de amoldar a seus propósitos',     n:'sentimento de poder'},
  saturn :{v:'é levado a integrar nos esquemas já consolidados — ou a refazê-los diante de', n:'estrutura consolidada'}
};
/* sobre o que ele opera — o campo psicológico de cada casa */
const OL_CAMPO={
  1 :{c:'a própria auto-imagem',                        d:'a imagem imediata de si: gestos, rosto, o que o indivíduo entende sobre si sem intermediários'},
  2 :{c:'o equilíbrio sensorial e o mundo das coisas',  d:'o confronto com o real físico — peso, forma, densidade, o corpo como matéria e não como imagem'},
  3 :{c:'o curso momentâneo do próprio raciocínio',     d:'o pensamento em ato: associação, fala, escrita, o entorno imediato e quem cresceu junto'},
  4 :{c:'a gratificação e a frustração dos desejos',    d:'o fundo íntimo: o que se quer sem precisar justificar, a origem e a casa'},
  5 :{c:'a medida do próprio poder de ação',            d:'o que se sabe poder ou não poder fazer agora — domínio, risco, jogo, criação'},
  6 :{c:'o encaixe nas exigências imediatas',           d:'o ajuste ao sistema de obrigações que cerca o dia: serviço, rotina, corpo em funcionamento'},
  7 :{c:'toda expectativa bilateral',                   d:'o que se espera do outro e o que o outro espera — o acordo, o contrato, o adversário declarado'},
  8 :{c:'o anúncio de mudança iminente do estado de coisas', d:'o que se altera sem consentimento: perdas, heranças, o que vem de terceiros, o fim de um regime'},
  9 :{c:'as próprias crenças estabelecidas',            d:'o quadro geral em que tudo se encaixa: doutrina, viagem longa, o sentido atribuído ao conjunto'},
  10:{c:'o próprio lugar na hierarquia de poder',       d:'a posição visível: autoridade, reputação, o papel que os outros reconhecem'},
  11:{c:'a perspectiva de futuro',                      d:'os projetos e o personagem que se quer ser — aliança, grupo, culminação'},
  12:{c:'tudo que pareça vir de fora do espaço vital',  d:'o que age sem ser visto: bastidor, retiro, inimigo oculto, o que escapa ao controle'}
};
/* a síntese literal do material, para quem quiser a formulação original */
const OL_SINTESE={
  1 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade sua auto-imagem.',
      moon:'Sente como fonte principal de motivação ou desmotivação tudo que afete sua auto-imagem.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante sua auto-imagem.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete sua auto-imagem.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos sua imagem, ou personalidade exterior.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — qualquer informação que afete sua auto-imagem.'},
  2 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade o mundo dos objetos sensíveis.',
      moon:'Sente como fonte principal de motivação ou desmotivação qualquer mudança no seu equilíbrio sensorial.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o mundo material que o cerca.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer alteração no seu equilíbrio sensorial.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos o mundo físico e os recursos.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — qualquer alteração do mundo sensível.'},
  3 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade o curso momentâneo do seu raciocínio.',
      moon:'Sente como fonte principal de motivação ou desmotivação tudo que afete o curso momentâneo do seu raciocínio.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o curso do próprio pensamento.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete o curso momentâneo do seu raciocínio.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos o próprio raciocínio e o que o cerca.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — o curso do próprio raciocínio.'},
  4 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade a gratificação e a frustração dos seus desejos.',
      moon:'Sente como fonte principal de motivação ou desmotivação a gratificação e frustração dos desejos.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o fundo dos próprios desejos.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete o fundo dos seus desejos.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos a origem e o ambiente íntimo.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — o que toque a raiz dos seus desejos.'},
  5 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade a medida do seu poder de ação.',
      moon:'Sente como fonte principal de motivação ou desmotivação qualquer fato que interprete como desafio à sua capacidade.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o alcance do próprio poder.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer desafio à sua capacidade de ação.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos o campo do que lhe é possível fazer.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — a medida real do seu poder.'},
  6 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade o seu encaixe no sistema das exigências circundantes.',
      moon:'Sente como fonte principal de motivação ou desmotivação qualquer situação que afete seu encaixe nas exigências imediatas.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante as exigências do próprio dia.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete seu encaixe no sistema das exigências circundantes imediatas.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos as obrigações que o cercam.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — as exigências imediatas do serviço.'},
  7 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade a expectativa bilateral.',
      moon:'Sente como fonte principal de motivação ou desmotivação qualquer expectativa bilateral.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o acordo com o outro.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete uma expectativa bilateral.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos o pacto com o outro.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — o que se espera de parte a parte.'},
  8 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade o anúncio de mudança iminente.',
      moon:'Sente como fonte principal de motivação ou desmotivação qualquer informação que anuncie mudança iminente do estado de coisas.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante aquilo que se altera sem seu consentimento.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer anúncio de mudança do estado de coisas.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos o que vem de terceiros e o que termina.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — toda mudança iminente do estado de coisas.'},
  9 :{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade suas crenças estabelecidas.',
      moon:'Sente como fonte principal de motivação ou desmotivação tudo que afete suas crenças estabelecidas.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o próprio quadro de crenças.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete suas crenças estabelecidas.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos a doutrina e o sentido geral das coisas.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — o que contrarie suas crenças.'},
  10:{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade o seu lugar na hierarquia de poder.',
      moon:'Sente como fonte principal de motivação ou desmotivação seu lugar na hierarquia de poder.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante a própria posição pública.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete o seu lugar na hierarquia de poder.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos a autoridade e a reputação.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — o que altere sua posição na hierarquia.'},
  11:{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade as forças que, no presente, moldam um futuro conforme sua visão.',
      moon:'Sente como fonte principal de motivação ou desmotivação tudo o que anuncie ou desminta uma perspectiva futura.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o mundo futuro.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a qualquer informação que afete sua visão de futuro.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos tudo o que determine seu futuro e sua fama.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — qualquer informação que afete sua visão de futuro.'},
  12:{sun:'Intui primordialmente e toma como modelo de toda percepção da realidade o que vem de fora do seu espaço vital.',
      moon:'Sente como fonte principal de motivação ou desmotivação tudo que pareça provir de fora do seu espaço vital.',
      venus:'Imagina poder moldar sempre em sentido proveitoso ou gratificante o que age fora do seu alcance.',
      mars:'Reage de maneira pronta, exteriorizada e fugaz a tudo que pareça vir de fora do seu espaço vital.',
      jupiter:'Age como se tivesse o poder de amoldar a seus propósitos o que se passa nos bastidores.',
      saturn:'É impelido a integrar nos seus esquemas consolidados — ou a amoldá-los a — o que vem de fora do seu espaço vital.'}
};
/* Nomenclatura do próprio material. Só o Sol recebe nome explícito
   ("Inteligência Intuitiva X"); para os demais o app não inventa
   rótulo nem atribui invenção ao autor. */
const OL_INTEL={1:'Autônoma',2:'Realista',3:'Associativa',4:'Afetiva',5:'Operativa',6:'Funcional',
  7:'Dialógica',8:'Crítica',9:'Doutrinal',10:'Hierárquica',11:'Estratégica',12:'Oblíqua'};
/* os rótulos que constam literalmente do material impresso */
const OL_INTEL_FONTE={1:'Inteligência Intuitiva Autônoma',2:'Inteligência Intuitiva Realista',
  11:'Inteligência Intuitiva Estratégica'};

/* o material só cobre estes seis */
const olavoTem=k=>!!OL_MODO[k];

/* ============================================================
   DUAS CAMADAS — e não uma substituição.

   camada A (psicológica) : a casa OCUPADA descreve a estrutura
                            psíquica, o modo de funcionamento.
   camada B (conteúdo)    : as casas REGIDAS dizem qual matéria
                            concreta esse planeta carrega.
   síntese                : o conteúdo de B passa a operar dentro
                            do modo de A. Nunca "os estudos viram
                            apoteose" — e sim "os estudos passam a
                            ser conduzidos por uma lógica de
                            projeto e de imagem futura".
   ============================================================ */
function olavoCamadas(k,hOcup,regidas){
  if(!olavoTem(k))return null;
  const M=OL_MODO[k], C=OL_CAMPO[hOcup];
  if(!M||!C)return null;
  const psi={
    titulo:OL_INTEL_FONTE[hOcup]&&k==='sun'?OL_INTEL_FONTE[hOcup]:null,
    campo:C.c, desc:C.d,
    texto:cap1(M.v)+' '+C.c+'.',
    fonte:OL_SINTESE[hOcup]?OL_SINTESE[hOcup][k]:null
  };
  const conteudo=regidas&&regidas.length?{
    casas:regidas,
    texto:cap1(lista(regidas.map(h=>HOUSE_TAG[h])))+' '+(regidas.length>1?'são':'é')
      +' a matéria concreta que '+PT_NAME[k]+' administra neste mapa.'
  }:{casas:[],texto:PT_NAME[k]+' não administra casa alguma neste mapa: age só pelo modo, sem matéria própria.'};
  return {psi,conteudo,sintese:olavoSintese(k,hOcup,regidas)};
}
/* a fusão — o conteúdo entra no modo, sem virar profecia */
const OL_FUSAO={
  1 :'passam a ser tratados como extensão da própria imagem: o nativo se reconhece por eles',
  2 :'passam a ser avaliados pelo que rendem de concreto e palpável',
  3 :'passam a circular como assunto de conversa, estudo e troca imediata',
  4 :'passam a se enraizar no fundo íntimo, ligados à origem e ao que não se justifica',
  5 :'passam a ser exercidos como demonstração de capacidade e como criação própria',
  6 :'passam a ser administrados como obrigação diária, sob a lógica do serviço e do ajuste',
  7 :'passam a ser negociados com outro: dependem de acordo, contrato ou confronto',
  8 :'passam a depender do que não se controla — de terceiros, de partilhas e de mudanças de regime',
  9 :'passam a ser organizados por uma doutrina: entram no quadro geral de sentido',
  10:'passam a ser expostos publicamente e medidos pela posição que conferem',
  11:'passam a ser incorporados a um projeto de longo prazo e à imagem futura que o nativo pretende construir',
  12:'passam a operar fora de vista, em bastidor, sem reconhecimento imediato'};
function olavoSintese(k,hOcup,regidas){
  const F=OL_FUSAO[hOcup];
  if(!regidas||!regidas.length)
    return cap1(OL_MODO[k].v)+' '+OL_CAMPO[hOcup].c+' — sem matéria administrada, isso fica no modo de operar, não em um assunto definido.';
  const mat=lista(regidas.map(h=>HOUSE_TAG[h]));
  const pl=regidas.length>1||/\se\s/.test(mat);
  return cap1(mat)+' — matéria que '+PT_NAME[k]+' administra — '
    +(pl?F:F.replace(/^passam /,'passa '))+'.';
}
/* compatibilidade: a leitura crua do material, sem modulação */
function olavoBruto(k,h){
  if(!olavoTem(k)||!OL_SINTESE[h])return null;
  return OL_SINTESE[h][k]||null;
}
