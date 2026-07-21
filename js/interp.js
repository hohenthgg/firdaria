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

/* ---------- condição essencial em rótulo comportamental ---------- */
function digReading(k,p){
  const d=p.dig||'';
  if(d.includes('domicílio'))return {q:'forte',t:'joga em casa: cumpre o que promete sem pedir favor a ninguém'};
  if(d.includes('exaltação'))return {q:'forte',t:'é o convidado de honra: entrega acima do normal — e tende a se achar por isso'};
  if(d.includes('exílio'))return {q:'fraca',t:'joga fora de casa: rende pouco, reclama muito e vive de favor alheio'};
  if(d.includes('queda'))return {q:'fraca',t:'opera no porão: promete e não sustenta; só sai alguma coisa com repetição teimosa'};
  return {q:'média',t:'é um sem-terra: faz o que os aliados (recepções, aspectos, senhor do termo) deixarem'};
}

/* ============================================================
   interpPlanet(k) → objeto com as seis partes
   ============================================================ */
function interpPlanet(k){
  const p=NATAL.pts[k]; if(!p)return null;
  const sg=signOf(p.lon), ru=ruledHouses(k), lim=limLabel(p);
  const dr=digReading(k,p);
  const sectMal=(NATAL.sect==='diurno'&&k==='mars')||(NATAL.sect==='noturno'&&k==='saturn');
  const sectBen=(NATAL.sect==='diurno'&&k==='jupiter')||(NATAL.sect==='noturno'&&k==='venus');
  const combust=(p.dig||'').includes('combusto'), cazimi=(p.dig||'').includes('cazimi');
  const asp=aspectPhrases(k), rec=receptionsOf(k);

  /* 1 — dado técnico */
  let tec=PT_NAME[k]+' a '+zfmt(p.lon)+', casa '+p.h;
  if(lim) tec+=' pela regra dos 5° (a '+fmtOrb(p.limDist)+' da cúspide: '+lim.faixa+', peso ~'+lim.pct+'% — casa '+p.hBack+' permanece como fundo)';
  tec+='. Dignidades: '+p.dig+'. Força '+(STR[k]||4)+'/8.';
  if(ru.length) tec+=' Rege a '+ru.map(h=>h+'ª').join(' e a ')+'.';
  tec+=' Mapa '+NATAL.sect+(sectMal?' — maléfico contrário à seita (o ponto de atrito recorrente do mapa)':sectBen?' — benéfico da seita (o apoio mais confiável do mapa)':'')+'.';
  if(p.retro) tec+=' Retrógrado.';
  if(p.star&&p.star!=='—') tec+=' Estrela: '+p.star+'.';

  /* 2 — função */
  let fun=PT_NAME[k]+' representa '+IN_FUNC[k]+'.';
  if(ru.length) fun+=' Como rege a '+ru.map(h=>h+'ª ('+HOUSE_SHORT[h]+')').join(' e a ')+', carrega esses assuntos para onde está: o que acontece na casa '+p.h+' repercute diretamente neles.';

  /* 3 — efeito estrutural */
  const ang=[1,4,7,10].includes(p.h);
  let efe='';
  if(p.h===1||p.hBack===1){
    efe='Atua diretamente sobre corpo, identidade e modo de reagir: a pessoa tende a apresentar-se '+({sun:'com autoridade e necessidade de reconhecimento',moon:'com humor visível e sensibilidade ao ambiente',mercury:'falante, analítica e inquieta',venus:'conciliadora e atenta à própria imagem',mars:'pronta ao embate, com reação corporal rápida',jupiter:'expansiva e confiante',saturn:'mais séria, controlada e defensiva do que o Ascendente isoladamente indicaria'}[k])+'.';
  } else if(ang){
    efe='Posição angular: o planeta age em público e sem mediação — seus temas são visíveis '+IN_CAMPO[p.h]+'.';
  } else if([6,8,12].includes(p.h)){
    efe='Casa ruim, sem eufemismo — '+HOUSE_BLUNT[p.h]+'. O planeta trabalha pagando pedágio: o que sai daqui, sai suado.';
  } else {
    efe='Posição intermediária: o planeta trabalha com apoio do contexto, sem o peso nem a exposição dos ângulos.';
  }
  efe+=' No signo de '+SIGNS[sg]+', expressa-se '+IN_ELEM_STYLE[SIGN_ELEM[sg]]+', '+IN_MODE_STYLE[SIGN_MODE[sg]]+'.';
  efe+=' Condição essencial '+dr.q+': '+dr.t+'.';
  if(p.retro) efe+=' A retrogradação inclina a revisar decisões já tomadas e a concluir em segunda tentativa o que não fechou na primeira.';
  if(combust) efe+=' Combusto: o tema opera encoberto pela identidade — a pessoa tem dificuldade de ver este próprio traço, que os outros percebem antes dela.';
  if(cazimi) efe+=' Cazimi: o tema funde-se ao propósito central com precisão rara.';

  /* 4 — manifestações literais */
  const manif=[];
  // fundo/manifestação quando liminar
  if(lim){
    manif.push('<i>Fundo da casa '+p.hBack+'</i> — '+IN_FUNDO[p.hBack]+': parte do processo acontece '+IN_CAMPO[p.hBack]+', longe do resultado visível.');
    manif.push('<i>Manifestação na casa '+p.h+'</i> — é '+IN_CAMPO[p.h]+' que o efeito aparece com maior força; quanto menor a distância da cúspide ('+fmtOrb(p.limDist)+'), maior esse peso.');
  } else {
    manif.push('O efeito concentra-se '+IN_CAMPO[p.h]+'.');
  }
  IN_TRAIT[k].forEach(t=>manif.push(t.charAt(0).toUpperCase()+t.slice(1)+' — aplicada '+IN_CAMPO[p.h]+'.'));
  ru.forEach(h=>{ if(h!==p.h) manif.push('Pela regência da '+h+'ª: os assuntos de '+HOUSE_SHORT[h]+' dependem do estado deste planeta — quando ele é ativado (trânsito, profecção, firdária), essa casa responde junto.');});
  asp.slice(0,3).forEach(a=>manif.push(a+'.'));
  if(rec.length) manif.push('Recepções: '+rec.join('; ')+' — o planeta tem onde se apoiar; os temas acima encontram fiador interno.');
  if(sectMal) manif.push('Como maléfico fora da seita, é o ponto que mais produz atrito recorrente: dar-lhe trabalho regular '+IN_CAMPO[p.h]+' antes que ele o tome à força.');

  /* 5 — forma elevada / problemática */
  const alta=IN_HIGH[k].slice(), baixa=IN_LOW[k].slice();
  if(dr.q==='fraca') baixa.unshift('a debilidade essencial acentua a lista abaixo quando não há apoio externo');
  if(dr.q==='forte') alta.unshift('a dignidade essencial dá lastro à lista abaixo');

  /* 6 — fundamento visível */
  let fund='Fatores que produziram este texto: posição '+zfmt(p.lon)+' (signo '+SIGNS[sg]+', elemento '+SIGN_ELEM[sg]+', modo '+SIGN_MODE[sg]+'); casa funcional '+p.h+(lim?(' com fundo na '+p.hBack+' (regra dos 5°, peso '+lim.pct+'%)'):'')+'; dignidades ['+p.dig+']; força '+(STR[k]||4)+'/8; seita '+NATAL.sect+(sectMal?' (maléfico contrário)':sectBen?' (benéfico da seita)':'')+'; regências ['+(ru.join('ª, ')+(ru.length?'ª':'—'))+']; aspectos ['+((NATAL_ASP[k]||[]).join(' · ')||'nenhum listado')+']; recepções ['+(rec.join('; ')||'nenhuma')+']'+(p.star&&p.star!=='—'?('; estrela ['+p.star+']'):'')+'. Modificam a leitura: condição do regente do signo ('+PT_NAME[SIGN_RULER[sg]]+'), trânsitos e técnicas temporais vigentes.';

  return {tec,fun,efe,manif,alta,baixa,fund};
}

/* ---------- síntese em uma frase (para cabeçalho do card) ---------- */
function interpFrase(k){
  const p=NATAL.pts[k]; if(!p)return '';
  const lim=limLabel(p);
  const alvo=lim?('entre a casa '+p.hBack+' (fundo) e a casa '+p.h+' (manifestação)'):('na casa '+p.h);
  return PT_NAME[k]+' opera '+alvo+': '+IN_FUNC[k].split('—')[0].trim()+' '+IN_CAMPO[p.h]+'.';
}
