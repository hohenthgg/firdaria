/* ============================================================
   INTERP.JS — motor interpretativo auditável.
   Cada texto nasce da combinação real dos fatores do mapa:
   planeta + signo + casa funcional (regra dos 5°) + casas regidas
   + dignidade + seita + termos + aspectos + recepções + estrelas.
   Formato fixo de seis partes:
   1. dado técnico  2. função  3. efeito estrutural
   4. manifestações literais  5. forma elevada / problemática
   6. fundamento visível.
   Linguagem: consequências observáveis; nada de frase vaga.
   ============================================================ */

/* ---------- função essencial de cada planeta ---------- */
const IN_FUNC={
  sun:'a identidade consciente, a autoridade pessoal e a direção da vida — onde a pessoa decide em nome próprio e busca reconhecimento',
  moon:'o humor, os hábitos, o corpo enquanto ritmo — como a pessoa absorve o cotidiano e de que precisa para se sentir segura',
  mercury:'a razão prática, a palavra, os documentos e os deslocamentos — como a pessoa entende, argumenta e negocia',
  venus:'os vínculos, os acordos, o gosto e o prazer — como a pessoa atrai, concilia e escolhe o que considera belo ou justo',
  mars:'a capacidade de agir, cortar, competir e defender-se — onde a pessoa aplica força e como reage a obstáculos',
  jupiter:'a expansão, a confiança, o ensino e os apoios — onde a pessoa cresce, a quem recorre e o que considera promissor',
  saturn:'o limite, a estrutura, o tempo longo e a responsabilidade — o que a pessoa teme perder e o que aceita sustentar por anos'};

/* ---------- tendências comportamentais neutras (por planeta) ---------- */
const IN_TRAIT={
  sun:['necessidade de ser visto pelo que faz','decisões tomadas em nome próprio','desconforto em papéis subordinados'],
  moon:['humor atado ao ambiente imediato','necessidade de rotina que proteja','memória longa para cuidados e descuidos'],
  mercury:['tendência a verbalizar e registrar tudo','decisão precedida de comparação e cálculo','inquietação quando não há informação nova'],
  venus:['preferência por resolver pelo acordo, não pelo confronto','peso alto da estética nas escolhas','dificuldade de permanecer onde não há prazer ou afinidade'],
  mars:['reação rápida a provocação','preferência por resolver fazendo, não esperando','impaciência com processos lentos'],
  jupiter:['confiança de que haverá saída ou apoio','tendência a ensinar e aconselhar','apetite por ampliar antes de consolidar'],
  saturn:['cautela antes de agir','necessidade de controle sobre o próprio campo','tolerância alta a processos longos e repetitivos']};

/* ---------- expressão construtiva e problemática (por planeta) ---------- */
const IN_HIGH={
  sun:['liderança assumida com custo pessoal','constância de propósito','capacidade de dar rosto e nome ao trabalho'],
  moon:['cuidado prático com pessoas e ambientes','leitura fina do clima coletivo','adaptação sem perda do próprio ritmo'],
  mercury:['precisão verbal e documental','aprendizado contínuo','negociação que preserva as duas partes'],
  venus:['diplomacia eficaz','fidelidade a acordos firmados','produção de beleza com utilidade'],
  mars:['coragem aplicada a problemas concretos','execução rápida e limpa','defesa dos mais próximos'],
  jupiter:['generosidade com método','visão longa que orienta decisões pequenas','mentoria real, não retórica'],
  saturn:['disciplina, constância, maturidade','resistência a crises longas','planejamento e palavra mantida']};
const IN_LOW={
  sun:['orgulho que impede pedir ajuda','conflito com chefias e figuras de autoridade','necessidade de plateia para agir'],
  moon:['reatividade emocional; decidir no pico do humor','apego a hábitos que já não servem','oscilação que os outros leem como inconstância'],
  mercury:['discussão pelo detalhe; ironia que fere','dispersão entre muitos começos','uso da palavra para adiar a ação'],
  venus:['concessão excessiva para evitar conflito','gasto por agrado ou aparência','dependência da aprovação alheia'],
  mars:['pressa que produz acidente e retrabalho','palavras cortantes; rompimentos precipitados','competição onde caberia cooperação'],
  jupiter:['promessa maior que a entrega','excesso de confiança em cenários otimistas','crescimento sem lastro que cobra depois'],
  saturn:['dureza consigo e com os outros','isolamento defensivo; dificuldade de pedir ajuda','expectativa de punição ou rejeição; pessimismo antecipado']};

/* ---------- campo concreto de cada casa (onde a coisa aparece) ---------- */
const IN_CAMPO={
  1:'no corpo, na postura, na aparência e no modo imediato de reagir',
  2:'no dinheiro próprio, nos ganhos, nas posses e no uso dos recursos',
  3:'na fala e na escrita, nos estudos básicos, nos irmãos e nos trajetos curtos',
  4:'na casa, na família de origem, no pai e na relação com raízes e imóveis',
  5:'nos filhos, nos prazeres, na criação autoral e nos riscos assumidos por gosto',
  6:'na saúde, na rotina de trabalho, nos subordinados e nas obrigações diárias',
  7:'no casamento e nas sociedades, nos contratos bilaterais e nos adversários declarados',
  8:'nas dívidas, heranças e recursos de terceiros, nos medos e nas perdas',
  9:'nos estudos longos, na religião e na filosofia, no estrangeiro e na publicação',
  10:'na profissão, na reputação pública, nas chefias e nas honras',
  11:'nos amigos, nos grupos, nos apoios recebidos e nos projetos de futuro',
  12:'no que se vive longe dos olhos: isolamento, bastidores, inimigos ocultos, autossabotagem'};

/* ---------- fundo típico de cada casa (quando é casa de origem na regra dos 5°) ---------- */
const IN_FUNDO={
  1:'a iniciativa pessoal como pano de fundo',
  2:'a questão material como pano de fundo',
  3:'o ambiente de estudo e comunicação como origem',
  4:'a família e a origem como contexto oculto',
  5:'o prazer e a criação como motor discreto',
  6:'o trabalho cotidiano e a saúde como contexto',
  7:'o outro — sócio, cônjuge, adversário — como origem da questão',
  8:'perdas, medos e dependências como fundo não visível',
  9:'convicções e doutrina como pano de fundo',
  10:'a carreira e a imagem pública como contexto',
  11:'a rede de apoios como origem discreta',
  12:'isolamento, ruminação e o que se esconde do público como fundo'};

/* ---------- estilo por elemento e modo do signo ---------- */
const IN_ELEM_STYLE={fogo:'de forma direta, visível e rápida',terra:'de forma prática, lenta e cumulativa',ar:'pela palavra, pela troca e pela comparação',
  'água':'pelo humor, pela memória e pelos vínculos'};
const IN_MODE_STYLE={cardinal:'iniciando frentes novas',fixo:'sustentando o que já existe, com resistência a mudar',
  'mutável':'ajustando, revisando e alternando abordagens'};

/* ---------- palavras-núcleo para frases de aspecto ---------- */
const IN_NOUN={sun:'a identidade',moon:'o sentir',mercury:'a palavra',venus:'o acordo',mars:'o impulso',jupiter:'a expansão',saturn:'o limite'};

/* ---------- pesos da regra dos 5° em rótulo ---------- */
function limLabel(p){
  if(!p.hBack)return null;
  const pct=Math.round((p.limW||1)*100);
  const d=p.limDist;
  const faixa=d<1?'quase integralmente na casa seguinte':d<3?'influência muito forte da casa seguinte':'influência compartilhada, predominando a casa seguinte';
  return {pct,faixa,d};
}

/* ---------- frases de aspecto (geradas dos fatores, não canned) ---------- */
function aspectPhrases(k){
  const out=[];
  const listed=NATAL_ASP[k]||[];
  // reconstruir pares reais a partir de HAS
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k)return;
    ['harm','tens','conj'].forEach(cls=>{
      if(HAS[k+'_'+o+'_'+cls]){
        const a=IN_NOUN[k],b=IN_NOUN[o];
        if(cls==='harm')out.push(a.charAt(0).toUpperCase()+a.slice(1)+' e '+b+' cooperam ('+PT_NAME[o]+' em aspecto harmônico): um abre caminho para o outro sem esforço deliberado');
        if(cls==='tens')out.push(a.charAt(0).toUpperCase()+a.slice(1)+' e '+b+' operam em atrito ('+PT_NAME[o]+' em aspecto tenso): aumenta a tendência a alternar entre os dois em vez de integrá-los');
        if(cls==='conj')out.push(a.charAt(0).toUpperCase()+a.slice(1)+' e '+b+' agem juntos ('+PT_NAME[o]+' em conjunção): um não aparece sem o outro');
      }
    });
  });
  return out;
}

/* ---------- recepções que envolvem o planeta ---------- */
function receptionsOf(k){
  return (NATAL.meta.receptions||[]).filter(r=>r.includes(PT_GLYPH[k]));
}

/* ---------- condição essencial: leitura medida, sem determinismo ---------- */
function digReading(k,p){
  const d=p.dig||'';
  if(d.includes('domicílio'))return {q:'forte',t:'com dignidade essencial (domicílio): tende a cumprir o que promete por meios próprios, sem depender de apoio externo'};
  if(d.includes('exaltação'))return {q:'forte',t:'exaltado: opera acima do usual, com risco de superestimar o próprio papel'};
  if(d.includes('exílio'))return {q:'fraca',t:'em exílio: rende com desconto e depende de apoio externo; a tendência é compensar por excesso ou por omissão'};
  if(d.includes('queda'))return {q:'fraca',t:'em queda: entrega abaixo do que a casa promete; os resultados costumam exigir repetição e prazo maior'};
  return {q:'média',t:'peregrino (sem dignidade essencial): o alcance depende dos apoios — recepções, aspectos e regente do termo'};
}

/* ---------- manifestação da presença de um planeta na 1ª/apresentação ---------- */
const IN_PRESENT={
  sun:'presença que busca visibilidade e decide em nome próprio',
  moon:'presença sensível ao ambiente, de humor visível e ritmo mutável',
  mercury:'presença falante, analítica e inquieta',
  venus:'presença conciliadora, agradável e atenta à própria imagem',
  mars:'presença pronta ao embate, de reação rápida',
  jupiter:'presença expansiva, confiante e cordial',
  saturn:'postura reservada, autocontrole, seriedade e dificuldade de agir espontaneamente'};
/* fundo típico (casa de origem na regra dos 5°), medido */
const IN_ORIGIN={
  1:'a própria iniciativa',2:'a questão material',3:'estudo e comunicação',4:'família e origem',
  5:'prazer e criação',6:'trabalho e saúde',7:'o outro (sócio, cônjuge, adversário)',
  8:'perdas, medos e dependências',9:'convicções e doutrina',10:'carreira e imagem pública',
  11:'a rede de apoios',12:'isolamento, ruminação e medo de exposição'};

/* ============================================================
   interpPlanet(k) — leitura INTEGRADA (não concatena palavras-chave):
   determina quem DOMINA, quem MODIFICA, quem CONTRADIZ, como as casas
   regidas entram, e daí extrai manifestações concretas.
   Saída (6 blocos): sintese · manif · alta · baixa · confirma · fund.
   Linguagem literal, não determinista.
   ============================================================ */
function interpPlanet(k){
  const p=NATAL.pts[k]; if(!p)return null;
  const sg=signOf(p.lon), ru=ruledHouses(k), lim=limLabel(p);
  const dr=digReading(k,p);
  const sectMal=(NATAL.sect==='diurno'&&k==='mars')||(NATAL.sect==='noturno'&&k==='saturn');
  const sectBen=(NATAL.sect==='diurno'&&k==='jupiter')||(NATAL.sect==='noturno'&&k==='venus');
  const combust=(p.dig||'').includes('combusto'), cazimi=(p.dig||'').includes('cazimi');
  const asp=aspectPhrases(k), rec=receptionsOf(k);
  const dAsc=adiff(p.lon,NATAL.asc), onAsc=dAsc<=5;
  const ruTemas=ru.map(h=>HOUSE_THEME[h]);

  /* ---------- SÍNTESE INTEGRADA (domina → modifica → contradiz → regências) ---------- */
  let sin='';
  // DOMINA: colocação (com regra dos 5° tratada como estrutura, não rótulo)
  if(onAsc && p.hBack){
    // planeta antes do Ascendente vindo da 12ª/casa anterior: fundo + manifestação
    sin='<b>'+PT_NAME[k]+' domina parcialmente a apresentação pessoal.</b> A origem na '+p.hBack+'ª ('+IN_ORIGIN[p.hBack]+') forma o fundo da identidade; a proximidade ao Ascendente ('+fmtOrb(dAsc)+') torna isso visível como '+IN_PRESENT[k]+'.';
  } else if(p.h===1){
    sin='<b>'+PT_NAME[k]+' marca diretamente a identidade e o corpo:</b> '+IN_PRESENT[k]+'.';
  } else {
    sin='<b>'+PT_NAME[k]+'</b> atua sobretudo '+IN_CAMPO[p.h]+'.';
  }
  // MODIFICA: signo
  sin+=' Em '+SIGNS[sg]+' ('+SIGN_ELEM[sg]+', '+SIGN_MODE[sg]+'), a expressão tende a ser '+IN_ELEM_STYLE[SIGN_ELEM[sg]]+', '+IN_MODE_STYLE[SIGN_MODE[sg]]+'.';
  // CONTRADIZ / MODERA: dignidade, seita, combustão, retrogradação
  const contra=[];
  if(dr.q==='fraca')contra.push('a condição essencial '+dr.t+', o que reduz o alcance');
  else if(dr.q==='forte')contra.push('a condição essencial '+dr.t);
  if(sectMal)contra.push('por ser o maléfico contrário à seita, é o ponto de atrito mais recorrente do mapa');
  if(sectBen)contra.push('por ser o benéfico da seita, tende a socorrer quando acionado');
  if(combust)contra.push('combusto pelo Sol, o traço costuma ser percebido pelos outros antes do próprio nativo');
  if(p.retro)contra.push('retrógrado, inclina a revisar decisões e a concluir em segunda tentativa');
  if(contra.length)sin+=' Contam a favor ou contra: '+contra.join('; ')+'.';
  // REGÊNCIAS entram na situação
  if(ru.length)sin+=' Como rege a '+ru.map(h=>h+'ª').join(' e a ')+', ligam-se a isso '+ruTemas.join('; ')+' — esses assuntos tendem a atravessar '+(p.h===1||p.hBack===1?'a identidade':'a área acima')+'.';

  /* ---------- MANIFESTAÇÕES CONCRETAS (da combinação) ---------- */
  const manif=[];
  if(onAsc&&p.hBack){
    manif.push('Parte do processo corre '+IN_CAMPO[p.hBack]+' (fundo), e aparece '+IN_CAMPO[p.h]+' (manifestação); quanto menor a distância à cúspide ('+fmtOrb(dAsc)+'), mais forte o segundo.');
  }
  IN_TRAIT[k].forEach(t=>manif.push('Pode manifestar-se como '+t+' '+IN_CAMPO[p.h]+'.'));
  ru.forEach(h=>{ if(h!==p.h) manif.push('Pela regência da '+h+'ª, '+HOUSE_THEME[h]+' ficam ligados ao estado deste planeta; quando ele é ativado (trânsito, profecção, firdária), esses assuntos respondem junto.');});
  asp.slice(0,3).forEach(a=>manif.push(a+'.'));

  /* ---------- CONSTRUTIVA / PROBLEMÁTICA ---------- */
  const alta=IN_HIGH[k].map(x=>'favorece '+x), baixa=IN_LOW[k].map(x=>'sob aflição, pode aumentar '+x);

  /* ---------- FATORES QUE CONFIRMAM OU MODERAM ---------- */
  const confirma=[];
  if(rec.length)confirma.push('confirmam/moderam: recepções — '+rec.join('; '));
  if(asp.length>3)confirma.push('demais aspectos: '+(NATAL_ASP[k]||[]).slice(3).join(' · '));
  if(p.star&&p.star!=='—')confirma.push('estrela fixa conjunta: '+p.star);
  confirma.push('regente do signo ('+PT_NAME[SIGN_RULER[sg]]+', '+(NATAL.pts[SIGN_RULER[sg]]?NATAL.pts[SIGN_RULER[sg]].dig:'—')+') dá a última palavra sobre este planeta');
  confirma.push('a leitura só se confirma quando repetida por outros testemunhos do mapa');

  /* ---------- FUNDAMENTO TÉCNICO VISÍVEL ---------- */
  const limTxt=lim?(', fundo na '+p.hBack+' pela regra dos 5° a '+fmtOrb(p.limDist)+' da cúspide, peso '+lim.pct+'%'):'';
  const sectTxt=sectMal?' (maléfico contrário)':sectBen?' (benéfico da seita)':'';
  const starTxt=(p.star&&p.star!=='—')?('; estrela ['+p.star+']'):'';
  const fund='Posição '+zfmt(p.lon)+' — signo '+SIGNS[sg]+' ('+SIGN_ELEM[sg]+'/'+SIGN_MODE[sg]+'); casa funcional '+p.h+limTxt+'; dignidades ['+p.dig+']; força '+(STR[k]||4)+'/8; seita '+NATAL.sect+sectTxt+'; regências ['+(ru.map(h=>h+'ª').join(', ')||'—')+']; aspectos ['+((NATAL_ASP[k]||[]).join(' · ')||'nenhum')+']; recepções ['+(rec.join('; ')||'nenhuma')+']'+starTxt+'.';

  return {sintese:sin,manif,alta,baixa,confirma,fund};
}

/* ============================================================
   MOTOR GERENCIAL DO TEMPO — hierarquia de camadas, fórmulas de
   firdária, sub-firdária e profecção, e cruzamentos entre técnicas.
   Distingue sempre: ASSUNTO ADMINISTRADO (casas regidas) x
   CAMPO DE EXECUÇÃO (casa ocupada). Vocabulário gerencial.
   ============================================================ */

/* hierarquia interpretativa (aparece no app) */
const HIERARQUIA=[
  ['Firdária maior','Agenda estratégica do ciclo','Qual assunto domina este capítulo da vida?'],
  ['Sub-firdária','Fase operacional dentro do ciclo','Por qual assunto o ciclo está passando agora?'],
  ['Profecção','Demanda específica do ano','Qual área da vida exige desenvolvimento neste ano?'],
  ['Senhor do Ano','Administrador da demanda anual','Quem conduz e conecta os acontecimentos do ano?'],
  ['Revolução Solar','Cenário anual de manifestação','Em quais ambientes isso aparece?'],
  ['Trânsitos','Disparadores temporais','Quando o potencial é pressionado ou liberado?'],
  ['Promessa natal','Potencial estrutural do mapa','O que já estava inscrito e pode ser realizado?']];

/* operação (natureza) de cada planeta — o tipo de ação */
const IN_OP={sun:'liderar e dar direção',moon:'nutrir, adaptar e manter o ritmo',
  mercury:'comunicar, negociar e organizar informação',venus:'conciliar, valorizar e criar vínculo',
  mars:'agir, competir e executar com força',jupiter:'expandir, ensinar e buscar apoio',
  saturn:'estruturar, limitar e sustentar no tempo'};

/* relação natal entre dois planetas: aspecto / recepção / nenhuma */
function relBetween(a,b){
  if(a===b)return {kind:'same',txt:'o mesmo planeta'};
  let asp=null; ['harm','tens','conj'].forEach(cls=>{if(HAS[a+'_'+b+'_'+cls])asp=cls;});
  const rec=(NATAL.meta.receptions||[]).some(r=>r.includes(PT_GLYPH[a])&&r.includes(PT_GLYPH[b]));
  if(asp==='harm'||asp==='conj'||rec)
    return {kind:'favoravel',txt:'ligação natal favorável'+(asp==='conj'?' (conjunção)':asp==='harm'?' (aspecto harmônico)':'')+(rec?(asp?' e recepção':' (recepção)'):'')};
  if(asp==='tens')return {kind:'tenso',txt:'ligação por aspecto tenso'};
  return {kind:'nenhum',txt:'sem ligação natal direta'};
}
/* condição de entrega — medida, sem determinismo */
function condDelivery(k){
  const p=NATAL.pts[k], d=p.dig||'', parts=[];
  if(d.includes('domicílio')||d.includes('exaltação'))parts.push('com dignidade essencial — tende a entregar com relativa facilidade');
  else if(d.includes('exílio')||d.includes('queda'))parts.push('em debilidade essencial — tende a exigir mais esforço, revisão ou tempo');
  else parts.push('sem debilidades essenciais relevantes — o resultado depende dos apoios');
  if([1,4,7,10].includes(p.h))parts.push('angular, age com visibilidade');
  else if([6,8,12].includes(p.h))parts.push('em casa difícil, age com custo ou nos bastidores');
  if(d.includes('combusto'))parts.push('combusto, o tema opera encoberto pela identidade');
  if(p.retro)parts.push('retrógrado, inclina a revisar e concluir em segunda tentativa');
  const rec=(NATAL.meta.receptions||[]).filter(r=>r.includes(PT_GLYPH[k]));
  if(rec.length)parts.push('recebido, encontra apoio externo');
  return parts.join('; ');
}
const themeOf=hs=>hs.map(h=>HOUSE_THEME[h]).join('; ');

/* fórmula da firdária maior: agenda (regidas) → canal (ocupada) → condição */
function firdariaText(k){
  if(!PT_NAME[k])return {agenda:'Capítulo breve de '+(k==='nn'?'acréscimo':'remissão')+' (passagem de nodo), sem casa regida.',canal:'',cond:'',ru:[],occ:null};
  const ru=ruledHouses(k), p=NATAL.pts[k];
  return {
    agenda:'<b>Agenda principal do ciclo</b> — '+PT_NAME[k]+' ('+IN_OP[k]+') mantém em primeiro plano os assuntos da '+ru.map(h=>h+'ª').join(' e da ')+': '+themeOf(ru)+'.',
    canal:'<b>Canal de manifestação</b> — no mapa natal, '+PT_NAME[k]+' está na casa '+p.h+', ligando esses temas a '+HOUSE_THEME[p.h]+'.',
    cond:'<b>Condições de manifestação</b> — '+PT_NAME[k]+' '+condDelivery(k)+'.',
    ru, occ:p.h};
}

/* fórmula da sub-firdária: assunto que entra + função + relação natal */
function subText(mk,sk){
  if(!sk||sk===mk||!PT_NAME[sk])return null;
  const ru=ruledHouses(sk), rel=relBetween(mk,sk);
  const relFrase={
    favoravel:PT_NAME[mk]+' e '+PT_NAME[sk]+' têm '+rel.txt+': os assuntos da fase tendem a colaborar com a agenda maior de '+PT_NAME[mk]+'.',
    tenso:PT_NAME[mk]+' e '+PT_NAME[sk]+' estão ligados por aspecto tenso: a fase pode exigir conciliação ou reorganização em torno da agenda de '+PT_NAME[mk]+'.',
    nenhum:PT_NAME[mk]+' e '+PT_NAME[sk]+' não têm ligação natal direta: os dois grupos de assuntos correm em paralelo e exigem integração consciente.',
    same:''
  }[rel.kind];
  return {
    entra:'<b>Assunto que entra em primeiro plano agora</b> — a fase de '+PT_NAME[sk]+' introduz os temas da '+ru.map(h=>h+'ª').join(' e da ')+': '+themeOf(ru)+'.',
    funcao:'<b>Função dentro do ciclo</b> — esses temas passam a servir, modificar ou tensionar a agenda maior de '+PT_NAME[mk]+'.',
    relacao:'<b>Relação natal entre os regentes</b> — '+relFrase,
    rel};
}

/* profecção em quatro componentes */
function profBlocks(p){
  const yl=p.lordKey, lord=NATAL.pts[yl], ru=ruledHouses(yl);
  return {
    materia:'<b>Matéria do ano</b> — a profecção ativa a casa '+p.houseN+' em '+(p.sign||SIGNS[p.signIdx])+': '+HOUSE_THEME[p.houseN]+'.',
    admin:'<b>Administrador do ano</b> — o Senhor do Ano é '+PT_NAME[yl]+', que administra esses assuntos conforme sua condição natal ('+lord.dig+').',
    traz:'<b>Assuntos que traz consigo</b> — como '+PT_NAME[yl]+' rege a '+ru.map(h=>h+'ª').join(' e a ')+', a demanda do ano mobiliza também '+themeOf(ru)+'.',
    local:'<b>Campo natal de atuação</b> — como '+PT_NAME[yl]+' está na casa '+lord.h+', os resultados tendem a passar por '+HOUSE_THEME[lord.h]+'.'};
}

/* cruzamento firdária × profecção — frase relacional */
function crossFirdProf(mk,sk,p){
  const yl=p.lordKey;
  if(mk===yl)return 'Convergência elevada: '+PT_NAME[mk]+' governa tanto a firdária quanto o ano — seus temas natais deixam de ser secundários e tornam-se o eixo principal do período.';
  if(ruledHouses(mk).includes(p.houseN))return 'A demanda anual está subordinada ao regente do ciclo: o ano funciona como uma expressão concentrada da firdária de '+PT_NAME[mk]+'.';
  if(sk&&sk===yl)return 'O planeta que governa a fase atual ('+PT_NAME[sk]+') também administra o ano: os assuntos da sub-firdária ganham maior capacidade de produzir acontecimentos concretos.';
  const rel=relBetween(mk,yl);
  const tail={favoravel:'tendem a cooperar',tenso:'tendem a exigir conciliação',nenhum:'operam em paralelo, pedindo integração consciente',same:'coincidem'}[rel.kind];
  return 'O ciclo é administrado por '+PT_NAME[mk]+' e o ano por '+PT_NAME[yl]+'; a relação natal entre eles é '+rel.txt+' — '+tail+'.';
}

/* cartão executivo de quatro linhas + síntese */
function periodExec(age){
  const f=firdAt(age+0.001), p=profAt(age);
  const mk=f.majorKey, sk=(f.subKey&&f.subKey!==mk&&PT_NAME[f.subKey])?f.subKey:null;
  const foco = PT_NAME[mk]?themeOf(ruledHouses(mk)):'passagem de nodo';
  const canal = sk?themeOf(ruledHouses(sk)):'a fase repete o regente do ciclo';
  const demanda = HOUSE_THEME[p.houseN];
  const cross = crossFirdProf(mk,sk,p);
  // síntese: liga foco (administrado) → demanda (execução do ano) via administrador
  const sint = 'Síntese: '+(PT_NAME[mk]?('a agenda de '+PT_NAME[mk]+' ('+foco.split(';')[0]+') '):'')
    +'encontra no ano a demanda da casa '+p.houseN+' ('+demanda.split(',')[0]+'), administrada por '+PT_NAME[p.lordKey]+'.';
  return {header:(f.major+(sk?(' / '+PT_NAME[sk]):''))+' · Profecção da Casa '+p.houseN,
    foco,canal,demanda,sint,cross,f,p,mk,sk};
}
function execCardHTML(age,compact){
  const e=periodExec(age);
  let s='<div class="exec">'
    +'<div class="exec-h">'+e.header+'</div>'
    +'<div class="exec-l"><span>Foco principal</span>'+e.foco+'</div>'
    +'<div class="exec-l"><span>Canal atual</span>'+e.canal+'</div>'
    +'<div class="exec-l"><span>Demanda do ano</span>'+e.demanda+'</div>'
    +'<div class="exec-s">'+e.sint+'</div>';
  if(!compact)s+='<div class="exec-cross">'+e.cross+'</div>';
  s+='</div>';
  return s;
}

/* ============================================================
   ARQUÉTIPO (carta de tarô) por planeta — símbolo dominante do regente.
   Arquétipo ATUAL = regente do Ascendente · IDEAL = regente do Lote do Espírito.
   ============================================================ */
const ARCHETYPE={
  sun:{card:'O Imperador',num:'IV',sym:'♔',arq:'O Rei',kw:['autoridade','vontade','centro'],txt:'governar em nome próprio, dar rosto e direção ao que faz'},
  moon:{card:'A Sacerdotisa',num:'II',sym:'☾',arq:'A Guardiã',kw:['intuição','ritmo','cuidado'],txt:'sentir o clima, guardar o que importa e nutrir'},
  mercury:{card:'O Mago',num:'I',sym:'☿',arq:'O Mensageiro',kw:['palavra','razão','habilidade'],txt:'ligar as coisas pela mente e pela fala, negociar e traduzir'},
  venus:{card:'A Imperatriz',num:'III',sym:'♀',arq:'A Amante',kw:['beleza','acordo','prazer'],txt:'conciliar, agradar e criar harmonia e vínculo'},
  mars:{card:'A Torre',num:'XVI',sym:'⚔',arq:'O Guerreiro',kw:['coragem','corte','ação'],txt:'agir, cortar e defender — romper o que trava'},
  jupiter:{card:'A Roda da Fortuna',num:'X',sym:'♃',arq:'O Benfeitor',kw:['expansão','fé','mestre'],txt:'ampliar, ensinar e abrir caminho com generosidade'},
  saturn:{card:'O Eremita',num:'IX',sym:'⌛',arq:'O Ancião',kw:['tempo','limite','disciplina'],txt:'estruturar, podar e sustentar no tempo, mesmo só'}};
function tarotCard(k,role,pos){
  const a=ARCHETYPE[k]; if(!a)return '';
  const dig=pos?(', '+pos.dig+', casa '+pos.h):'';
  return '<div class="tarot" data-arche="'+role+'">'
    +'<div class="t-num">'+a.num+'</div>'
    +'<div class="t-role">'+role+'</div>'
    +'<div class="t-sym">'+a.sym+'</div>'
    +'<div class="t-card">'+a.card+'</div>'
    +'<div class="t-arq">'+a.arq+' · '+PT_NAME[k]+'</div>'
    +'<div class="t-kw">'+a.kw.map(w=>'<span>'+w+'</span>').join('')+'</div>'
    +'<div class="t-txt">'+a.txt+dig+'.</div>'
    +'</div>';
}
function archetypeCards(){
  if(!NATAL)return '';
  const ascR=NATAL.meta.ascRuler;
  const sp=NATAL.pts.spirit, spR=SIGN_RULER[signOf(sp.lon)];
  const same=ascR===spR;
  return '<div class="arche-wrap">'
    +'<div class="arche-head"><span class="kicker">Arquétipo — quem você é · quem você pode ser</span>'
      +'<p class="mono" style="margin:2px 0 0;color:var(--dim2)">Regente do Ascendente (o ponto de partida) frente ao regente do Lote do Espírito (a direção a integrar).</p></div>'
    +'<div class="tcards">'
      +tarotCard(ascR,'arquétipo atual',NATAL.pts[ascR])
      +'<div class="t-arrow">→</div>'
      +tarotCard(spR,'arquétipo ideal',NATAL.pts[spR])
    +'</div>'
    +'<p class="arche-note">'+(same
      ?'Regente do Ascendente e do Espírito coincidem em <b>'+PT_NAME[ascR]+'</b>: o ponto de partida já aponta para a direção — resta amadurecê-lo.'
      :'O caminho vai de <b>'+ARCHETYPE[ascR].arq+' ('+PT_NAME[ascR]+')</b> a <b>'+ARCHETYPE[spR].arq+' ('+PT_NAME[spR]+')</b>: integrar '+ARCHETYPE[spR].txt+', sem abandonar a força de partida.')+'</p>'
    +'</div>';
}

/* ---------- síntese em uma frase (cabeçalho) ---------- */
function interpFrase(k){
  const p=NATAL.pts[k]; if(!p)return '';
  const ru=ruledHouses(k);
  const dAsc=adiff(p.lon,NATAL.asc);
  const alvo=(dAsc<=5&&p.hBack)?('domina em parte a identidade, vindo da '+p.hBack+'ª'):p.h===1?'marca a identidade':('atua '+IN_CAMPO[p.h]);
  return PT_NAME[k]+' '+alvo+(ru.length?('; rege '+ru.map(h=>h+'ª').join(' e ')+' ('+ru.map(h=>HOUSE_THEME[h].split(',')[0].split(':')[0]).join('; ')+')'):'')+'.';
}
