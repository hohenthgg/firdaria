/* ============================================================
   TIP-AUTORRELATO.JS — refinamento opcional por respostas.

   Não é teste, não é instrumento validado, e não copia nenhum
   questionário proprietário. São perguntas escritas para este app,
   sobre PROCESSOS de percepção e de decisão, em situações
   concretas, com alternativas igualmente plausíveis e sem opção
   obviamente desejável. “Depende” e “não sei” são respostas
   legítimas e ficam registradas como tais.

   Três coisas são guardadas SEPARADAS, e nunca fundidas:
     1 · a hipótese simbólica natal (do mapa);
     2 · a hipótese por respostas (deste questionário);
     3 · o tipo declarado pela própria pessoa.
   Acordos e divergências entre as três são exibidos como tais.

   Regra dura: uma resposta NÃO altera dado astronômico. O mapa é
   o que é; o autorrelato produz outra hipótese, ao lado.

   Regra de leitura: divergência entre o autorrelato e a hipótese
   natal não é resistência, não é sombra e não é falta de
   autoconhecimento. É divergência entre duas fontes fracas.
   ============================================================ */

const AUTO_META={
  id:'autorrelato', versao:'1.0',
  natureza:'questionário próprio, exploratório',
  aviso:'Não é o instrumento MBTI, não é licenciado, não é psicometricamente '
    +'validado e não reproduz item de questionário proprietário. As perguntas '
    +'foram escritas para este app.',
  regra:'Nenhuma resposta altera posição planetária, casa, dignidade ou '
    +'qualquer outro dado calculado. O autorrelato gera uma hipótese '
    +'independente, exibida ao lado da hipótese natal.'
};

/* Cada pergunta opõe DOIS PROCESSOS, em situação concreta, sem
   alternativa socialmente preferível. `distingue` diz qual dúvida
   entre candidatos a pergunta serve para separar. */
const AUTO_PERGUNTAS=[
  {id:'q.ne-ni', sistema:'mbti', distingue:['Ne','Ni'],
   situacao:'Você recebe um problema novo, sem prazo apertado, e tem a tarde livre.',
   a:{texto:'Você abre o leque: lista possibilidades, puxa analogias com coisas '
       +'sem relação aparente e evita fechar cedo demais.', processo:'Ne'},
   b:{texto:'Você deixa o material decantar até que uma leitura única do que está '
       +'em jogo se imponha, e trabalha a partir dela.', processo:'Ni'},
   nota:'As duas são maneiras de pensar bem. A pergunta é qual delas acontece '
     +'sozinha, sem você decidir usá-la.'},

  {id:'q.se-si', sistema:'mbti', distingue:['Se','Si'],
   situacao:'Você entra numa sala onde nunca esteve, para uma reunião.',
   a:{texto:'Você registra o que está acontecendo ali agora — quem está onde, '
       +'o que mudou de posição, o clima do momento.', processo:'Se'},
   b:{texto:'Você compara com salas e reuniões parecidas de antes, e percebe '
       +'primeiro o que está diferente do usual.', processo:'Si'},
   nota:'Não se trata de ter boa memória, e sim do que aparece primeiro.'},

  {id:'q.ti-te', sistema:'mbti', distingue:['Ti','Te'],
   situacao:'Alguém apresenta uma solução que está funcionando na prática, mas '
     +'cujo raciocínio tem um passo que você não consegue justificar.',
   a:{texto:'Enquanto o passo não fechar, você não assina embaixo — mesmo que '
       +'os resultados estejam aí.', processo:'Ti'},
   b:{texto:'Está funcionando e é verificável; você adota e deixa a justificativa '
       +'para depois, se for necessária.', processo:'Te'},
   nota:'Nenhuma das duas é mais inteligente que a outra. São critérios diferentes.'},

  {id:'q.fi-fe', sistema:'mbti', distingue:['Fi','Fe'],
   situacao:'Um grupo de que você faz parte chega a um acordo que você acha errado, '
     +'mas que ninguém mais contesta.',
   a:{texto:'O critério que pesa é o seu: se aquilo trai o que você considera '
       +'importante, você não acompanha, mesmo sozinho.', processo:'Fi'},
   b:{texto:'O critério que pesa é o do que sustenta o acordo comum: você trabalha '
       +'para reconstruir o consenso antes de romper com ele.', processo:'Fe'},
   nota:'Não é sobre ser firme ou ser agradável, e sim sobre onde está o critério.'},

  {id:'q.orientacao', sistema:'mbti', distingue:['orientacao:externa','orientacao:interna'],
   situacao:'Você passou o dia inteiro trabalhando bem e está cansado no fim da tarde.',
   a:{texto:'O que organiza o dia é o que você fez no mundo: as conversas, as '
       +'entregas, as reações que voltaram.', processo:'orientacao:externa'},
   b:{texto:'O que organiza o dia é o que você concluiu por dentro; o que aconteceu '
       +'fora é matéria para isso.', processo:'orientacao:interna'},
   nota:'A pergunta não é sobre gostar ou não de gente.'},

  {id:'q.trato', sistema:'mbti', distingue:['trato:julgamento','trato:percepcao'],
   situacao:'Uma decisão precisa ser tomada e ainda falta informação, mas o assunto '
     +'já pode ser resolvido de modo razoável.',
   a:{texto:'Deixar em aberto incomoda mais do que decidir com o que se tem; você fecha.',
      processo:'trato:julgamento'},
   b:{texto:'Fechar cedo incomoda mais do que a pendência; você segura enquanto der.',
      processo:'trato:percepcao'},
   nota:'Isto não mede organização nem disciplina — mede o incômodo maior.'},

  /* perguntas sociônicas, com o vocabulário da própria escola */
  {id:'q.soc.si-se', sistema:'socionica', distingue:['Si','Se'],
   situacao:'Você vai passar seis horas num lugar desconfortável.',
   a:{texto:'A primeira coisa que você faz é ajustar o ambiente — temperatura, '
       +'assento, luz — até ficar habitável.', processo:'Si'},
   b:{texto:'Você ignora o desconforto e ocupa o espaço do jeito que ele está, '
       +'concentrado no que veio fazer.', processo:'Se'},
   nota:'Na Sociônica, Si é conforto e estado físico — não memória do passado.'},

  {id:'q.soc.te-ti', sistema:'socionica', distingue:['Te','Ti'],
   situacao:'Você precisa explicar um assunto que domina a alguém que não o conhece.',
   a:{texto:'Você começa pelos procedimentos e pelos fatos: como se faz, o que '
       +'dá resultado, quanto custa.', processo:'Te'},
   b:{texto:'Você começa pelas definições e pela hierarquia das partes: o que é '
       +'cada coisa e como se relacionam.', processo:'Ti'},
   nota:'Na Sociônica, Te é o aspecto factual e procedimental; Ti é o estrutural.'},

  {id:'q.soc.fe-fi', sistema:'socionica', distingue:['Fe','Fi'],
   situacao:'Uma pessoa próxima chega visivelmente abalada.',
   a:{texto:'Você mexe no clima: muda o tom, o ritmo, o ânimo do ambiente até a '
       +'coisa se soltar.', processo:'Fe'},
   b:{texto:'Você fica na relação em si: o que vocês são um para o outro, o que '
       +'você deve àquela pessoa e o que ela pode lhe pedir.', processo:'Fi'},
   nota:'Fe é o aspecto emocional expresso; Fi é o do vínculo e da distância.'},

  {id:'q.soc.racionalidade', sistema:'socionica',
   distingue:['racionalidade:racional','racionalidade:irracional'],
   situacao:'Um plano combinado deixa de fazer sentido no meio do caminho.',
   a:{texto:'Você prefere concluir o plano e refazer depois: mudar em curso '
       +'desorganiza mais do que o plano ruim.', processo:'racionalidade:racional'},
   b:{texto:'Você prefere abandonar e reagir ao que apareceu: seguir um plano morto '
       +'custa mais do que a mudança.', processo:'racionalidade:irracional'},
   nota:'Isto é a racionalidade sociônica, definida pela função base — e não a '
     +'dicotomia J/P do MBTI.'}
];

/* Seleção: as perguntas que servem às dúvidas REAIS entre os
   candidatos ordenados — e não um questionário fixo. */
function autoSelecionar(infMbti, infSoc, limite){
  const alvos=new Set();
  const juntaMbti=(a,b)=>{
    if(!a||!b)return;
    ['dom','aux','tert','inf'].forEach(p=>{
      if(a.estrutura[p]!==b.estrutura[p]){alvos.add(a.estrutura[p]);alvos.add(b.estrutura[p]);}
    });
    if(a.tipo[3]!==b.tipo[3]){alvos.add('trato:julgamento');alvos.add('trato:percepcao');}
    if(a.estrutura.dom[1]!==b.estrutura.dom[1]){
      alvos.add('orientacao:externa');alvos.add('orientacao:interna');}
  };
  if(infMbti&&infMbti.ranking&&infMbti.ranking.length>1)
    juntaMbti(infMbti.ranking[0],infMbti.ranking[1]);
  if(infSoc&&infSoc.ranking&&infSoc.ranking.length>1){
    const [a,b]=infSoc.ranking;
    for(let i=0;i<4;i++) if(a.modelo[i]!==b.modelo[i]){alvos.add(a.modelo[i]);alvos.add(b.modelo[i]);}
    if(a.racionalidade.racional!==b.racionalidade.racional){
      alvos.add('racionalidade:racional');alvos.add('racionalidade:irracional');}
  }
  const pontua=q=>q.distingue.filter(p=>alvos.has(p)).length;
  const ord=AUTO_PERGUNTAS.map(q=>({q, s:pontua(q)}))
    .sort((a,b)=>b.s-a.s).filter(x=>x.s>0);
  const sel=(ord.length?ord:AUTO_PERGUNTAS.map(q=>({q,s:0}))).map(x=>x.q);
  return sel.slice(0, limite||6);
}

/* ---------- respostas ---------- */
const AUTO_CHAVE='agx_autorrelato';
const AUTO_OPCOES=[
  {v:'a', rotulo:'A primeira'},
  {v:'b', rotulo:'A segunda'},
  {v:'depende', rotulo:'Depende da situação'},
  {v:'naosei', rotulo:'Não sei dizer'}
];
function autoCarregar(){
  try{ return JSON.parse(localStorage.getItem(AUTO_CHAVE)||'{}'); }catch(e){ return {}; }
}
function autoGravar(o){
  try{ localStorage.setItem(AUTO_CHAVE, JSON.stringify(o)); }catch(e){}
}
function autoResponder(id,valor,contexto){
  const o=autoCarregar();
  o.respostas=o.respostas||{};
  o.respostas[id]={valor, quando:Date.now(), contexto:contexto||null};
  autoGravar(o);
  return o;
}
function autoTipoDeclarado(sistema, valor){
  const o=autoCarregar();
  o.declarado=o.declarado||{};
  if(valor)o.declarado[sistema]=valor; else delete o.declarado[sistema];
  autoGravar(o);
  return o;
}

/* ---------- hipótese pelas respostas, calculada à parte ---------- */
function autoHipotese(sistema){
  const o=autoCarregar(), R=o.respostas||{};
  const apoio={}, ignoradas=[];
  AUTO_PERGUNTAS.filter(q=>q.sistema===sistema).forEach(q=>{
    const r=R[q.id]; if(!r)return;
    if(r.valor==='depende'||r.valor==='naosei'){
      ignoradas.push({pergunta:q.id, valor:r.valor,
        porque:r.valor==='depende'
          ? 'a pessoa indicou que varia com a situação — o app não converte isso '
            +'em meio ponto para cada lado'
          : 'a pessoa indicou não saber — permanece desconhecido'});
      return;
    }
    const lado=r.valor==='a'?q.a:r.valor==='b'?q.b:null;
    if(!lado)return;
    apoio[lado.processo]=(apoio[lado.processo]||0)+1;
  });
  const respondidas=Object.values(apoio).reduce((a,b)=>a+b,0);
  if(!respondidas)return {sistema, vazio:true, ignoradas,
    nota:'Nenhuma resposta utilizável ainda. Sem respostas, não há hipótese por '
      +'autorrelato — e nenhum valor neutro é inventado no lugar dela.'};

  /* ordena as estruturas do sistema pelos processos apoiados */
  let ranking=[];
  if(sistema==='mbti'){
    ranking=MBTI_TIPOS.map(t=>{
      const E=MBTI_ESTRUTURAS[t]; let s=0;
      s+=(apoio[E.dom]||0)*1.0+(apoio[E.aux]||0)*0.7;
      s+=(apoio[E.dom[1]==='e'?'orientacao:externa':'orientacao:interna']||0);
      s+=(apoio[t[3]==='J'?'trato:julgamento':'trato:percepcao']||0);
      return {tipo:t, saldo:+s.toFixed(2)};
    }).sort((a,b)=>b.saldo-a.saldo).slice(0,3);
  } else {
    ranking=SOC_TIPOS.map(t=>{
      const M=SOC_MODELOS[t]; let s=0;
      s+=(apoio[M[0]]||0)*1.0+(apoio[M[1]]||0)*0.75;
      s-=(apoio[M[3]]||0)*0.6;                      // testemunho na vulnerável contraria
      const R2=socRacionalidade(t);
      s+=(apoio[R2.racional?'racionalidade:racional':'racionalidade:irracional']||0);
      return {tipo:t, nome:SOC_NOMES[t], saldo:+s.toFixed(2)};
    }).sort((a,b)=>b.saldo-a.saldo).slice(0,3);
  }
  const margem=ranking.length>1?+(ranking[0].saldo-ranking[1].saldo).toFixed(2):0;
  return {sistema, vazio:false, apoio, ignoradas, ranking, margem,
    respondidas,
    insuficiente: respondidas<3 || margem<0.5,
    nota:'Hipótese calculada SÓ pelas respostas, sem nenhum dado do mapa.'};
}

/* ---------- confronto entre as três fontes ---------- */
function autoConfronto(infMbti, infSoc){
  const o=autoCarregar(), decl=o.declarado||{};
  const linhas=[];
  const monta=(sistema, natal, respostas, declarado)=>{
    const n=natal||null, r=(respostas&&!respostas.vazio&&respostas.ranking[0])
      ? respostas.ranking[0].tipo : null;
    const acordos=[], divergencias=[];
    if(n&&r){ (n===r?acordos:divergencias).push('hipótese natal ('+n+') × '
      +'hipótese por respostas ('+r+')'); }
    if(n&&declarado){ (n===declarado?acordos:divergencias).push('hipótese natal ('+n
      +') × tipo declarado ('+declarado+')'); }
    if(r&&declarado){ (r===declarado?acordos:divergencias).push('hipótese por respostas ('
      +r+') × tipo declarado ('+declarado+')'); }
    linhas.push({sistema, natal:n, respostas:r, declarado:declarado||null,
      acordos, divergencias,
      leitura: divergencias.length
        ? 'As fontes divergem. Divergência não é resistência, não é sombra e não '
          +'é falta de autoconhecimento: são fontes diferentes, e a mais fraca '
          +'delas é a hipótese natal, que este app declara exploratória. O que a '
          +'pessoa relata sobre si permanece registrado como está.'
        : (acordos.length?'As fontes disponíveis concordam. Concordância entre uma '
            +'hipótese exploratória e um autorrelato não constitui validação: as '
            +'duas podem errar juntas.'
          :'Ainda não há fontes suficientes para comparar.')});
  };
  monta('mbti', infMbti&&infMbti.principal?infMbti.principal.tipo:null,
        autoHipotese('mbti'), decl.mbti);
  monta('socionica', infSoc&&infSoc.principal?infSoc.principal.tipo:null,
        autoHipotese('socionica'), decl.socionica);
  return {linhas, meta:AUTO_META};
}
