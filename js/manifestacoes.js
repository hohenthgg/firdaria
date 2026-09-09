/* ============================================================
   MANIFESTAÇÕES — formas possíveis, ordenadas por plausibilidade relativa
   ============================================================

   O motor de Probabilidades (js/probabilidades.js) responde a uma
   pergunta: QUE ASSUNTO está ativado hoje, com que qualidade e com
   quanta convergência. Responde ao nível do TEMA — as doze casas.

   Este módulo responde à pergunta seguinte, que é outra: SOB QUE FORMA
   esse assunto pode aparecer. Traduz

        simbolismo natural do planeta
      × casas que ele administra (regência)
      × casa que ele ocupa (ocupação)
      × natureza do contato (facilitada / pressionada / mista)

   em formas concretas nomeadas, e ordena-as por plausibilidade
   RELATIVA — quanto uma forma é mais esperável do que as outras da
   mesma lista. Não é probabilidade estatística: não há frequência
   observada, não há amostra, não há garantia de acontecimento.

   Três disciplinas herdadas do motor, que aqui continuam a valer:

   1. Regência nunca é trocada por ocupação. Cada forma diz por que
      casa entrou e a que título.
   2. Intensidade não é benefício. Uma forma pressionada não é um
      fracasso, e uma facilitada não é um bem.
   3. A hipótese “nada perceptível” é uma barra como as outras, e
      normalmente a maior. Um dia ativado é um dia em que o assunto
      fica DISPONÍVEL, não um dia em que algo tem de acontecer.
   ============================================================ */

const MANIF_AVISO='Formas possíveis ordenadas por plausibilidade relativa entre '
  +'si — não são probabilidades estatísticas nem previsão de acontecimentos. '
  +'A hipótese “nada perceptível” entra na mesma lista, e costuma ser a maior.';

const MANIF_NADA_TXT='Nada perceptível — o dia apenas “pesa” mais, sem facto exterior';

/* ------------------------------------------------------------
   1 · SIMBOLISMO NATURAL DOS PLANETAS
   Formas que dependem só do planeta, sem passar por casa nenhuma:
   o humor que ele imprime, a pessoa que ele traz, o corpo que ele
   mexe. É a camada que a leitura por casas sozinha não alcança.
   ------------------------------------------------------------ */
const MANIF_NATURAL={
  sun:{
    humor:{f:'Ânimo firme: vontade de aparecer, de decidir, de ser reconhecido',
           p:'Orgulho ferido, teimosia, esforço para ser visto sem o ser'},
    pessoa:'Aparece pessoa-Sol: chefe, pai, autoridade, alguém que decide',
    corpo:'Corpo: vitalidade, calor, coração e olhos, cansaço por exposição'
  },
  moon:{
    humor:{f:'Humor receptivo: leitura fina do ambiente, vontade de acolher',
           p:'Oscilação de humor, sensibilidade a ruído, cansaço sem causa clara'},
    pessoa:'Aparece pessoa-Lua: mãe, mulher da família, público, quem cuida',
    corpo:'Corpo: sono, apetite, estômago e líquidos, ritmo alterado'
  },
  mercury:{
    humor:{f:'Cabeça rápida: vontade de escrever, combinar, resolver pendência',
           p:'Pensamento acelerado sem pouso, mal-entendido, dispersão'},
    pessoa:'Aparece pessoa-Mercúrio: irmão, colega, intermediário, quem traz recado',
    corpo:'Corpo: mãos, respiração, nervos, tensão de fala ou de leitura'
  },
  venus:{
    humor:{f:'Humor ameno: vontade de agradar, de gastar bem, de estar com alguém',
           p:'Preguiça de conflito, adiamento, gasto por consolo'},
    pessoa:'Aparece pessoa-Vênus: namorada, amiga, sócia, quem media e agrada',
    corpo:'Corpo: aparência, pele e cabelo, apetite por doce, sensação de bem-estar'
  },
  mars:{
    humor:{f:'Ímpeto útil: vontade de cortar, decidir, executar sem rodeio',
           p:'Irritação de pavio curto, pressa, atrito por palavra dura'},
    pessoa:'Aparece pessoa-Marte: rival, militar, cirurgião, quem confronta',
    corpo:'Corpo: febre, corte, esforço físico, dor aguda ou acidente pequeno'
  },
  jupiter:{
    humor:{f:'Humor expansivo: confiança, generosidade, vontade de prometer',
           p:'Exagero em promessa ou gasto, otimismo que ignora a conta'},
    pessoa:'Aparece pessoa-Júpiter: mentor, professor, alguém mais velho ou de fora',
    corpo:'Corpo: apetite, peso, sensação de inchaço ou de vigor amplo'
  },
  saturn:{
    humor:{f:'Humor sóbrio: paciência, vontade de organizar e de durar',
           p:'Peso, desânimo, sensação de estar atrasado ou sozinho'},
    pessoa:'Aparece pessoa-Saturno: pai, superior, credor, quem cobra ou limita',
    corpo:'Corpo: ossos, dentes, pele seca, rigidez, frio e cansaço acumulado'
  }
};

/* ------------------------------------------------------------
   2 · FORMAS POR CASA, FILTRADAS PELO PLANETA QUE AS TRAZ
   Cada registo diz: em que casa o assunto cai, que planetas
   naturalmente produzem aquela forma, e sob que qualidade de contato
   ela é esperável ('f' facilitada, 'p' pressionada, '*' qualquer).
   Um planeta que não consta de `pl` não gera aquela forma: é assim
   que o simbolismo natural entra, em vez de o assunto da casa ser
   despejado igual para todos.
   ------------------------------------------------------------ */
const MANIF_CASA_FORMAS=[
  /* 1 — corpo, vida, identidade */
  {casa:1,q:'f',pl:['sun','jupiter','venus'],t:'Sentir-se bem visto: elogio, foto, boa impressão em quem importa'},
  {casa:1,q:'*',pl:['moon','venus','jupiter'],t:'Aparência e corpo: cabelo, roupa, peso, sentir-se radiante ou inchado'},
  {casa:1,q:'p',pl:['mars','saturn'],t:'Corpo cobra: dor, machucado pequeno, cansaço que obriga a parar'},
  {casa:1,q:'*',pl:['sun','mars'],t:'Decisão pessoal: assumir uma posição em nome próprio'},

  /* 2 — dinheiro e recursos próprios */
  {casa:2,q:'f',pl:['jupiter','venus','sun'],t:'Entrada de dinheiro: pagamento, venda, bico, valor recebido'},
  {casa:2,q:'p',pl:['saturn','mars'],t:'Saída inesperada: conserto, multa, despesa que não estava na conta'},
  {casa:2,q:'*',pl:['venus','moon','mercury'],t:'Compra: gasto por gosto, item adiado que enfim se compra'},
  {casa:2,q:'*',pl:['mercury','saturn'],t:'Contas à vista: revisão de orçamento, renegociação, corte'},

  /* 3 — palavra, irmãos, trajeto curto */
  {casa:3,q:'*',pl:['mercury','moon'],t:'Notícia, mensagem ou telefonema que muda o dia'},
  {casa:3,q:'f',pl:['mercury','jupiter','venus'],t:'Conversa que resolve: acordo verbal, esclarecimento, pendência fechada'},
  {casa:3,q:'p',pl:['mars','mercury','saturn'],t:'Mal-entendido, discussão por escrito, recado que sai torto'},
  {casa:3,q:'*',pl:['moon','mercury','venus'],t:'Irmão, vizinho ou colega próximo aparece com um assunto'},
  {casa:3,q:'*',pl:['mercury','mars'],t:'Deslocamento curto, trânsito, contratempo de percurso'},

  /* 4 — casa, família, raiz */
  {casa:4,q:'*',pl:['moon','venus','jupiter'],t:'Assunto de casa: visita, mudança, arrumação, reunião de família'},
  {casa:4,q:'p',pl:['saturn','mars'],t:'Casa dá trabalho: obra, vazamento, conta do imóvel, atrito doméstico'},
  {casa:4,q:'*',pl:['sun','saturn','moon'],t:'Pai, mãe ou pessoa mais velha da família entra no dia'},
  {casa:4,q:'f',pl:['moon','venus'],t:'Vontade de recolher em casa, conforto doméstico, sensação de raiz'},

  /* 5 — filhos, prazeres, criação */
  {casa:5,q:'f',pl:['venus','jupiter','sun'],t:'Convite, festa, flerte ou encontro romântico'},
  {casa:5,q:'f',pl:['sun','venus','mercury','jupiter'],t:'Impulso criativo: começar, mostrar ou publicar algo próprio'},
  {casa:5,q:'*',pl:['moon','venus','jupiter'],t:'Notícia envolvendo criança ou gravidez, própria ou de alguém próximo'},
  {casa:5,q:'p',pl:['mars','saturn'],t:'Prazer que cobra depois: excesso, jogo, gasto de diversão, frustração com filho'},
  {casa:5,q:'*',pl:['sun','jupiter'],t:'Aparecer em público por gosto, não por dever'},

  /* 6 — saúde, rotina, trabalho subordinado */
  {casa:6,q:'p',pl:['mars','saturn','moon'],t:'Sintoma, exame ou indisposição que pede atenção'},
  {casa:6,q:'f',pl:['mercury','venus','jupiter','saturn'],t:'Rotina destrava: método novo, tarefa acumulada que enfim sai'},
  {casa:6,q:'p',pl:['mars','mercury','saturn'],t:'Sobrecarga de trabalho, prazo apertado, atrito com quem executa'},
  {casa:6,q:'*',pl:['moon','venus','mercury'],t:'Assunto de animal, empregado ou de quem presta serviço'},

  /* 7 — cônjuge, sócios, contendas */
  {casa:7,q:'f',pl:['venus','jupiter','moon'],t:'Aproximação: convite, reconciliação, sociedade proposta'},
  {casa:7,q:'p',pl:['mars','saturn'],t:'Atrito aberto com parceiro, sócio ou adversário declarado'},
  {casa:7,q:'*',pl:['mercury','venus','jupiter','saturn'],t:'Contrato, acordo ou negociação a dois entra em pauta'},
  {casa:7,q:'*',pl:['moon','venus','sun'],t:'O outro toma a iniciativa: procura, cobra ou responde'},

  /* 8 — recursos de terceiros, dívidas, fim de ciclo */
  {casa:8,q:'f',pl:['jupiter','venus'],t:'Dinheiro de terceiros: recebimento, crédito, dívida quitada, presente'},
  {casa:8,q:'p',pl:['saturn','mars'],t:'Cobrança, imposto, dívida, corte de um recurso que vinha de fora'},
  {casa:8,q:'*',pl:['mars','saturn','moon'],t:'Assunto de fim: perda, luto, herança, encerramento de um ciclo'},
  {casa:8,q:'*',pl:['mars','venus','moon'],t:'Intimidade e intensidade: aproximação forte ou medo antigo à tona'},

  /* 9 — doutrina, estrangeiro, viagem longa */
  {casa:9,q:'f',pl:['jupiter','mercury','sun'],t:'Estudo destrava: curso, leitura, tese, aula que enfim rende'},
  {casa:9,q:'*',pl:['jupiter','mercury','venus'],t:'Assunto de estrangeiro: viagem, língua, documento, pessoa de fora'},
  {casa:9,q:'*',pl:['jupiter','sun','saturn'],t:'Questão de fé, princípio ou orientação — o que se tem por verdadeiro'},
  {casa:9,q:'p',pl:['mars','saturn','mercury'],t:'Discórdia doutrinária, atrito com professor, plano de viagem que trava'},

  /* 10 — ofício, honras, reputação */
  {casa:10,q:'f',pl:['sun','jupiter','venus'],t:'Reconhecimento no ofício: convite, promoção, elogio de quem manda'},
  {casa:10,q:'p',pl:['saturn','mars'],t:'Cobrança de cima: prazo, avaliação, exposição indesejada'},
  {casa:10,q:'*',pl:['sun','saturn','mercury'],t:'Chefe, cliente ou autoridade entra no dia com uma decisão'},
  {casa:10,q:'*',pl:['sun','mercury','jupiter'],t:'Movimento de carreira: candidatura, proposta, mudança de posição'},

  /* 11 — amigos, grupos, apoios */
  {casa:11,q:'f',pl:['jupiter','venus','sun'],t:'Apoio chega por gente: indicação, favor, porta aberta por amigo'},
  {casa:11,q:'*',pl:['mercury','venus','moon'],t:'Grupo, rede ou coletivo movimenta-se: convite, reunião, projeto comum'},
  {casa:11,q:'p',pl:['saturn','mars'],t:'Apoio que falha: promessa não cumprida, afastamento de um grupo'},
  {casa:11,q:'*',pl:['jupiter','sun'],t:'Um plano de futuro ganha ou perde consistência'},

  /* 12 — bastidor, isolamento, inimigo oculto */
  {casa:12,q:'*',pl:['saturn','moon','mercury'],t:'Vontade de sumir: recolhimento, silêncio, dia de bastidor'},
  {casa:12,q:'p',pl:['mars','saturn'],t:'Algo age por trás: boato, sabotagem, custo escondido que aparece'},
  {casa:12,q:'*',pl:['moon','saturn','jupiter'],t:'Sono, sonho ou material antigo volta sem ser chamado'},
  {casa:12,q:'f',pl:['jupiter','venus','moon'],t:'Ajuda discreta: alguém resolve algo sem alarde, alívio sem plateia'}
];

/* ------------------------------------------------------------
   3 · AJUSTE POR QUALIDADE
   Uma forma facilitada não desaparece num dia pressionado — fica
   menos esperável. Nada é zerado, porque a qualidade do contato
   inclina, não determina.
   ------------------------------------------------------------ */
const MANIF_AJUSTE={
  f:{facilitada:1.00, mista:0.60, pressionada:0.25, 'sem dados':0.55},
  p:{facilitada:0.25, mista:0.60, pressionada:1.00, 'sem dados':0.55},
  '*':{facilitada:0.85, mista:0.85, pressionada:0.85, 'sem dados':0.85}
};
const manifAjuste=(q,rotulo)=>((MANIF_AJUSTE[q]||MANIF_AJUSTE['*'])[rotulo]!=null
  ? MANIF_AJUSTE[q][rotulo] : 0.6);

/* Peso relativo das três camadas naturais face às formas de casa.
   As formas de casa são o corpo da leitura; humor, pessoa e corpo
   são acompanhamentos — aparecem, mas não devem encabeçar a lista
   quando há assunto de casa realmente ativado. */
const MANIF_PESO_NATURAL={humor:0.78, pessoa:0.62, corpo:0.52};

/* Só os temas que realmente se destacam produzem formas. Sem esta
   faixa, uma casa com ativação residual entrava com as suas quatro
   formas e afogava o assunto dominante numa lista indistinta. */
/* 0,80 e não 0,60: num dia de trânsito normal (≈30 contatos) TODAS as
   doze casas recebem alguma coisa, e o bruto vai apenas de ~21 a ~11.
   Uma faixa larga deixava passar onze temas dos doze e a lista voltava
   a ser indistinta. A 0,80 sobram os dois ou três assuntos que
   realmente se destacam do resto do dia. */
const MANIF_FAIXA_TEMA=0.80;   /* fração do tema mais ativado */
const MANIF_FORMAS_POR_TEMA=3; /* no máximo, as três mais apoiadas de cada tema */

/* ------------------------------------------------------------
   4 · PARTICIPAÇÃO DOS PLANETAS EM CADA TEMA
   Extrai, dos testemunhos já produzidos pelo motor, quais planetas
   trouxeram cada casa e a que título. Não recalcula astronomia
   nenhuma: lê o que aggregateThemes deixou.
   ------------------------------------------------------------ */
function manifParticipacao(tema){
  const por={};
  (tema&&tema.testemunhos||[]).forEach(t=>{
    [[t.transitant,'transitante'],[t.target,'alvo']].forEach(([pl,papel])=>{
      if(!pl||!MANIF_NATURAL[pl])return;
      const P=por[pl]||(por[pl]={pl, nome:(typeof PT_NAME!=='undefined'?PT_NAME[pl]:pl),
        peso:0, papeis:new Set(), origens:new Set(), motivos:[]});
      P.peso+=t.weight||0;
      P.papeis.add(papel);
      if(t.casaOrigem)P.origens.add(t.casaOrigem);
      if(t.explanation&&P.motivos.indexOf(t.explanation)<0&&P.motivos.length<4)
        P.motivos.push(t.explanation);
    });
  });
  return Object.values(por)
    .map(P=>Object.assign(P,{papeis:[...P.papeis], origens:[...P.origens]}))
    .sort((a,b)=>b.peso-a.peso);
}

/* Participação natural de cada planeta no dia inteiro, somando todos
   os temas — base das formas que não passam por casa. */
function manifParticipacaoGlobal(temas){
  const por={};
  (temas||[]).forEach(T=>manifParticipacao(T).forEach(P=>{
    const G=por[P.pl]||(por[P.pl]={pl:P.pl, nome:P.nome, peso:0, casas:new Set(),
      motivos:[]});
    G.peso=Math.max(G.peso,P.peso);          /* máximo, não soma: o mesmo
                                                contato aparece em várias
                                                casas e não deve contar N vezes */
    G.casas.add(T.casa);
    P.motivos.forEach(m=>{ if(G.motivos.indexOf(m)<0&&G.motivos.length<4)G.motivos.push(m); });
  }));
  return Object.values(por)
    .map(G=>Object.assign(G,{casas:[...G.casas].sort((a,b)=>a-b)}))
    .sort((a,b)=>b.peso-a.peso);
}

/* ------------------------------------------------------------
   5 · CANDIDATAS
   Uma forma entra na lista quando (a) a sua casa tem ativação e
   (b) pelo menos um dos planetas que a produzem participa dessa
   ativação. O peso é o produto: força do tema × participação do
   planeta × ajuste de qualidade.
   ------------------------------------------------------------ */
function manifCandidatas(dia, opts){
  const o=opts||{};
  const ativos=(dia&&dia.temas||[]).filter(T=>T.bruto>0);
  if(!ativos.length)return [];
  const brutoMax=Math.max.apply(null,ativos.map(T=>T.bruto));
  const temas=ativos.filter(T=>T.bruto>=MANIF_FAIXA_TEMA*brutoMax);
  const out=[];

  /* — formas de casa — */
  temas.forEach(T=>{
    const doTema=[];
    const parts=manifParticipacao(T);
    if(!parts.length)return;
    /* Força RELATIVA do melhor planeta capaz de produzir esta forma,
       medida contra o planeta mais forte do próprio tema. É uma razão,
       não uma fatia: não encolhe quando mais planetas tocam a casa.
       (Dividir pela soma de todos os participantes fazia o contrário —
       quanto mais movimentada a casa, menor cada forma — e anulava
       exatamente a força do tema, deixando todas as barras iguais.)
       Concordância entre planetas dá um acréscimo modesto, limitado,
       para não premiar simplesmente listas `pl` mais longas. */
    const pesoMax=Math.max.apply(null,parts.map(p=>p.peso))||1;
    const rot=(T.qualidade&&T.qualidade.rotulo)||'sem dados';
    MANIF_CASA_FORMAS.filter(F=>F.casa===T.casa).forEach(F=>{
      const envolvidos=parts.filter(p=>F.pl.indexOf(p.pl)>=0);
      if(!envolvidos.length)return;
      const melhor=Math.max.apply(null,envolvidos.map(p=>p.peso));
      const concordancia=Math.min(1.30, 1+0.15*(envolvidos.length-1));
      const share=Math.min(1,(melhor/pesoMax)*concordancia);
      const peso=T.bruto*share*manifAjuste(F.q,rot);
      if(peso<=0)return;
      doTema.push({
        tipo:'casa', texto:F.t, casa:T.casa, tema:T.rotulo,
        qualidade:rot, qualidadeForma:F.q,
        confianca:T.confianca&&T.confianca.rotulo||null,
        indiceTema:T.indice, peso:+peso.toFixed(4),
        apoio:+(100*share).toFixed(0),
        planetas:envolvidos.map(p=>({pl:p.pl, nome:p.nome, origens:p.origens})),
        porque:manifPorque(F,T,envolvidos,share)
      });
    });
    doTema.sort((a,b)=>b.peso-a.peso)
      .slice(0,MANIF_FORMAS_POR_TEMA).forEach(x=>out.push(x));
  });

  /* — formas naturais: humor, pessoa, corpo — */
  const globais=manifParticipacaoGlobal(temas);
  const gMax=globais.length?Math.max.apply(null,globais.map(g=>g.peso)):1;
  const rotDia=(dia.qualidade&&dia.qualidade.rotulo)||'sem dados';
  /* Humor e corpo saem só do planeta mais reiterado do dia; a
     personificação sai dos dois primeiros. Gerar as três camadas para
     três planetas enchia metade da lista de formas sem casa e empurrava
     para fora do gráfico o assunto realmente ativado. */
  globais.slice(0,2).forEach((G,gi)=>{
    const N=MANIF_NATURAL[G.pl]; if(!N)return;
    const base=brutoMax*Math.min(1,(G.peso/(gMax||1)));
    const casasTxt=G.casas.length
      ? ' — pelas casas '+G.casas.join(', ')+' do dia' : '';
    const põe=(tipo,texto,q,tema,porque)=>out.push({
      tipo, texto, planetaBase:G.pl, qualidade:rotDia, qualidadeForma:q,
      casa:null, tema, peso:+(base*MANIF_PESO_NATURAL[tipo]).toFixed(4),
      planetas:[{pl:G.pl,nome:G.nome,origens:[]}],
      porque:porque.concat(G.motivos)});
    if(gi===0){
      const humorQ = rotDia==='pressionada' ? 'p' : 'f';
      põe('humor', N.humor[humorQ], humorQ, 'Humor do dia',
        [G.nome+' é o planeta mais reiterado do dia'+casasTxt,
         'A qualidade do dia é '+rotDia+', o que inclina o humor para esse lado']);
      põe('corpo', N.corpo, '*', 'Corpo',
        ['Significação corporal natural de '+G.nome]);
    }
    põe('pessoa', N.pessoa, '*', 'Quem aparece',
      ['O assunto pode chegar personificado: '+G.nome+' participa do dia'+casasTxt]);
  });

  const limite=o.limite||12;
  return out.sort((a,b)=>b.peso-a.peso).slice(0,limite);
}

function manifPorque(forma,tema,envolvidos,share){
  const linhas=[];
  envolvidos.forEach(p=>{
    const org=p.origens.length?p.origens.join(' e '):'contato do dia';
    linhas.push(p.nome+' entra na '+tema.casa+'ª por '+org);
  });
  if(share!=null)
    linhas.push('Força relativa destes planetas dentro da '+tema.casa+'ª: '
      +Math.round(100*share)+'% do apoio do planeta mais forte do tema');
  linhas.push('Tema “'+tema.rotulo+'” com índice '+tema.indice
    +', qualidade '+((tema.qualidade&&tema.qualidade.rotulo)||'—')
    +', confiança '+((tema.confianca&&tema.confianca.rotulo)||'—'));
  linhas.push(forma.q==='f'?'Forma esperável sob contato facilitado'
            :forma.q==='p'?'Forma esperável sob contato pressionado'
            :'Forma esperável sob qualquer qualidade de contato');
  return linhas;
}

/* ------------------------------------------------------------
   6 · A HIPÓTESE “NADA PERCEPTÍVEL”
   Não é decoração. É a hipótese de base: mesmo com convergência
   forte, o mais frequente é o dia passar sem facto exterior
   registável. O seu peso cai à medida que o índice sobe, mas nunca
   desaparece — e num dia calmo domina a lista inteira.
   ------------------------------------------------------------ */
const MANIF_NADA_PISO=0.40;    /* fração do total que sobra mesmo num dia máximo */
const MANIF_NADA_FAIXA=1.70;   /* quanto acresce quando o índice é zero */
function manifNada(indiceDia, totalCandidatas){
  const i=Math.min(100,Math.max(0,+indiceDia||0));
  const fator=MANIF_NADA_PISO+MANIF_NADA_FAIXA*(1-i/100);
  return {
    tipo:'nada', texto:MANIF_NADA_TXT, casa:null, tema:'Hipótese de base',
    qualidade:'—', qualidadeForma:'*', planetas:[],
    peso:+((totalCandidatas||0)*fator).toFixed(4),
    fator:+fator.toFixed(3),
    porque:['Hipótese de base: um dia ativado torna um assunto DISPONÍVEL, '
      +'não obrigatório.',
      'O peso desta hipótese cai de forma contínua à medida que o índice sobe '
      +'('+MANIF_NADA_PISO+' + '+MANIF_NADA_FAIXA+' × (1 − índice/100)), e nunca '
      +'chega a zero.',
      'Índice do dia: '+Math.round(i)+' → fator '+fator.toFixed(2)]
  };
}
manifNada.formula='peso(nada) = total das formas × ('+MANIF_NADA_PISO+' + '
  +MANIF_NADA_FAIXA+' × (1 − índice/100))';

/* ------------------------------------------------------------
   7 · RANKING FINAL
   ------------------------------------------------------------ */
function manifRanking(dia, opts){
  const o=opts||{};
  const cand=manifCandidatas(dia,o);
  const total=cand.reduce((a,c)=>a+c.peso,0);
  const nada=manifNada(dia&&dia.indice||0,total);
  const todas=cand.concat([nada]);
  const soma=todas.reduce((a,c)=>a+c.peso,0)||1;
  const barras=todas.map(c=>Object.assign({},c,{
    share:+(100*c.peso/soma).toFixed(1)
  })).sort((a,b)=>b.share-a.share);
  return {
    data:dia&&dia.data||null,
    aviso:MANIF_AVISO,
    indiceDia:dia&&dia.indice||0,
    qualidadeDia:(dia&&dia.qualidade&&dia.qualidade.rotulo)||'sem dados',
    confiancaDia:(dia&&dia.confianca&&dia.confianca.rotulo)||'sem dados',
    barras,
    nada:barras.find(b=>b.tipo==='nada')||nada,
    formulaNada:manifNada.formula,
    nota:'A soma das barras é 100% da LISTA, não do mundo: são as formas '
      +'consideradas por este motor, mais a hipótese de nada acontecer. '
      +'Outras formas não listadas continuam possíveis.'
  };
}

/* Ranking a partir de uma data local, para quem não tem o dia em mão. */
function manifDoDia(dataLocal, opts){
  if(typeof dailyActivation!=='function')return null;
  return manifRanking(dailyActivation(dataLocal,opts||{}), opts||{});
}
