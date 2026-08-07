/* ============================================================
   TIPOLOGIA.JS — perfis completos e clicáveis de MBTI,
   Sociônica (Modelo A) e Eneagrama, montados a partir da
   estrutura de cada sistema — nunca listas de adjetivos.
   Sempre "tipologia estimada a partir do mapa", com a camada
   "como foi calculado" auditável.
   ============================================================ */

/* ---------------- MBTI: pilha funcional (convenção de Grant) ---------------- */
function mbtiStack(tipo){
  const [ei,sn,tf,jp]=tipo.split('');
  const perc=sn, julg=tf;
  const percExt=jp==='P', domPerc=(ei==='E')===percExt;   // extrovertido: dominante é a função extrovertida
  const att=x=>x?'e':'i';
  const dom = domPerc? perc+att(ei==='E') : julg+att(ei==='E');
  const aux = domPerc? julg+att(ei!=='E') : perc+att(ei!=='E');
  const op={N:'S',S:'N',T:'F',F:'T'};
  const tert=op[aux[0]]+att(ei==='E');
  const inf =op[dom[0]]+att(ei!=='E');
  return [dom,aux,tert,inf];
}
/* as oito funções, em linguagem cotidiana, por posição na pilha */
const FN={
 Ni:{nome:'Intuição introvertida (Ni)',
  dom:'você tende a construir primeiro um modelo mental do problema — para onde isto vai, o que se repete, o que está implícito — e só depois agir.',
  aux:'por trás do que você mostra, há um radar de longo prazo que reduz tudo a um fio condutor.',
  tert:'de vez em quando você fecha um palpite certeiro sobre o rumo das coisas, mas não confia nele como método.',
  inf:'visões de futuro chegam como pressentimento vago — ou como catastrofização quando você está esgotado.'},
 Ne:{nome:'Intuição extrovertida (Ne)',
  dom:'você vê possibilidades onde os outros veem uma coisa só: cada fato abre três portas, e fechar cedo demais parece morte.',
  aux:'você usa alternativas e analogias para arejar o que a função principal decide.',
  tert:'você brinca com hipóteses quando o ambiente é seguro, mas volta rápido ao terreno conhecido.',
  inf:'muitas possibilidades ao mesmo tempo cansam; sob pressão, o novo parece ameaça em vez de porta.'},
 Si:{nome:'Sensação introvertida (Si)',
  dom:'você compara tudo com a experiência acumulada: o que funcionou, o que dói, o padrão conhecido — e daí tira estabilidade.',
  aux:'sua memória do que já deu certo dá lastro ao que a função principal quer fazer.',
  tert:'você gosta dos seus rituais e confortos, mas não organiza a vida em torno deles.',
  inf:'rotina e detalhe são o seu ponto fraco: ou você ignora o corpo e os hábitos, ou hiperfoca neles quando estressado.'},
 Se:{nome:'Sensação extrovertida (Se)',
  dom:'você lê o presente com precisão — o que está acontecendo agora, aqui — e age no tempo certo, sem ensaio.',
  aux:'você mantém contato direto com o concreto, o que impede a função principal de virar teoria.',
  tert:'você aprecia impacto e experiência direta em doses, como tempero.',
  inf:'o imediato tende a ser adiado ou consumido em excesso: dias inteiros na cabeça, depois impulso de estímulo forte.'},
 Ti:{nome:'Pensamento introvertido (Ti)',
  dom:'você desmonta as coisas até a estrutura: o critério é a coerência interna, não a autoridade nem o consenso.',
  aux:'você confere por dentro a lógica do que percebe antes de dar o aval.',
  tert:'você gosta de entender o mecanismo, mas aceita usá-lo sem dominar cada peça.',
  inf:'análise fria sob demanda custa caro; sob pressão vira ou paralisia de definição, ou pedantismo repentino.'},
 Te:{nome:'Pensamento extrovertido (Te)',
  dom:'você organiza o mundo para funcionar: meta, método, medida — o que não produz resultado é descartado.',
  aux:'você transforma o que a função principal enxerga em plano executável, com prazos e critérios.',
  tert:'você consegue ser prático e organizado quando o assunto interessa.',
  inf:'eficiência alheia soa como frieza; sob estresse você ou vira ditador de planilha, ou rejeita qualquer métrica.'},
 Fi:{nome:'Sentimento introvertido (Fi)',
  dom:'você mede tudo contra um núcleo de valores próprios: o que é autêntico, o que trai o que você é.',
  aux:'uma bússola ética silenciosa filtra o que a função principal faz.',
  tert:'seus valores aparecem em causas e lealdades pontuais, mais sentidos do que declarados.',
  inf:'falar do próprio sentimento é desconfortável; ele acumula em silêncio e transborda de uma vez.'},
 Fe:{nome:'Sentimento extrovertido (Fe)',
  dom:'você lê e regula o clima entre as pessoas: harmonizar, incluir e mover o grupo é o seu modo natural de agir.',
  aux:'você ajusta o tom ao ambiente e faz o grupo caminhar junto com o que a função principal decide.',
  tert:'você sabe ser caloroso e diplomático quando decide que vale a pena.',
  inf:'a expectativa dos outros pesa: você ou ignora o clima social, ou capitula a ele de repente.'}};
const MBTI_FRASE={
 INTJ:'Compreensão estrutural, planejamento independente e execução por modelo interno.',
 INTP:'Desmontar sistemas até a coerência perfeita, com o mundo prático em segundo plano.',
 ENTJ:'Comando por objetivo: enxerga a estrutura e mobiliza tudo para o resultado.',
 ENTP:'Abrir possibilidades e testar ideias pelo debate, sem apego ao já estabelecido.',
 INFJ:'Ler o subtexto humano e trabalhar, em silêncio, por uma visão de longo prazo.',
 INFP:'Fidelidade a um núcleo de valores, expressa mais em obra e escolha do que em discurso.',
 ENFJ:'Conduzir pessoas: percebe o potencial dos outros e organiza o ambiente para ele.',
 ENFP:'Entusiasmo por possibilidades humanas, com lealdade profunda ao que é autêntico.',
 ISTJ:'Responsabilidade metódica: o que foi combinado será cumprido, do jeito testado.',
 ISFJ:'Cuidado concreto e constância: protege pessoas e rotinas que dão certo.',
 ESTJ:'Organizar o mundo visível: regras claras, execução firme, resultado mensurável.',
 ESFJ:'Manter o tecido social funcionando: presença, hospitalidade e ordem afetiva.',
 ISTP:'Entender o mecanismo com as mãos: análise fria aplicada ao concreto, na hora certa.',
 ISFP:'Estética e valor pessoal vividos no presente, sem alarde e sem submissão.',
 ESTP:'Ação no tempo exato: lê a cena, age, corrige no movimento.',
 ESFP:'Presença viva: transforma o momento em experiência compartilhada.'};
const MBTI_MAL={
 INTJ:'não é frieza nem arrogância: é economia de energia social a serviço de um plano interno.',
 INTP:'não é preguiça nem indecisão: é recusa a afirmar o que ainda não fechou logicamente.',
 ENTJ:'não é autoritarismo por prazer: é impaciência com ineficiência que trava o objetivo.',
 ENTP:'não é do contra por esporte: testar pelo choque é como esse tipo verifica ideias.',
 INFJ:'não é mistério calculado: é filtragem — pouca coisa do processo interno chega à superfície.',
 INFP:'não é fragilidade: a suavidade externa cobre um núcleo inegociável de valores.',
 ENFJ:'não é manipulação: é leitura genuína do grupo — o risco real é se perder no papel de condutor.',
 ENFP:'não é dispersão vazia: cada entusiasmo é um teste de autenticidade.',
 ISTJ:'não é rigidez burra: é confiança no que sobreviveu à prova do tempo.',
 ISFJ:'não é submissão: é escolha ativa de proteger o que funciona.',
 ESTJ:'não é insensibilidade: é priorização do que pode ser feito e medido.',
 ESFJ:'não é superficialidade: manter o clima do grupo é trabalho real e constante.',
 ISTP:'não é desinteresse: é engajamento seletivo — total quando o problema é concreto.',
 ISFP:'não é passividade: é resistência silenciosa de quem não negocia o próprio gosto.',
 ESTP:'não é imprudência: é confiança treinada na leitura do momento.',
 ESFP:'não é futilidade: é inteligência do presente — do corpo, da cena, das pessoas.'};

/* ---------------- Sociônica: Modelo A ---------------- */
const SOC_BASE={ILE:['Ne','Ti'],SEI:['Si','Fe'],ESE:['Fe','Si'],LII:['Ti','Ne'],
  EIE:['Fe','Ni'],LSI:['Ti','Se'],SLE:['Se','Ti'],IEI:['Ni','Fe'],
  SEE:['Se','Fi'],ILI:['Ni','Te'],LIE:['Te','Ni'],ESI:['Fi','Se'],
  LSE:['Te','Si'],EII:['Fi','Ne'],IEE:['Ne','Fi'],SLI:['Si','Te']};
const SOC_DUAL={Ti:'Fe',Fe:'Ti',Te:'Fi',Fi:'Te',Ni:'Se',Se:'Ni',Ne:'Si',Si:'Ne'};
const SOC_INV={Ti:'Te',Te:'Ti',Fi:'Fe',Fe:'Fi',Ni:'Ne',Ne:'Ni',Si:'Se',Se:'Si'};
function socModeloA(tipo){
  const bc=SOC_BASE[tipo]; if(!bc)return null;
  const [B,C]=bc;
  return [B,C,SOC_INV[SOC_DUAL[B]],SOC_INV[SOC_DUAL[C]],SOC_DUAL[B],SOC_DUAL[C],SOC_INV[B],SOC_INV[C]];
}
const SOC_EL={
 Ne:'potencial e possibilidade — o que uma coisa PODE virar',
 Ni:'tempo e desdobramento — para onde o processo caminha',
 Se:'força e território — impor, ocupar, decidir no embate',
 Si:'conforto e estado físico — bem-estar, ritmo, sensação',
 Te:'eficiência e fato — o que funciona, quanto custa, como se faz',
 Ti:'estrutura e coerência — categorias, regras internas, sistema',
 Fe:'clima emocional expresso — animar, comover, sintonizar o grupo',
 Fi:'vínculo e distância pessoal — quem é próximo, o que se deve a quem'};
const SOC_POS=['função base — o ar que se respira: opera o tempo todo, sem esforço',
 'função criativa — a ferramenta: usada com liberdade para servir a base',
 'função de papel — sustentada por educação: funciona em público, cansa rápido',
 'função vulnerável — o ponto doído: crítica aqui fere de verdade',
 'função sugestiva — o que se admira e se recebe com gratidão do outro',
 'função ativação — desperta com incentivo, mas desregula sozinha',
 'função ignorada — competente, porém achada desnecessária e deixada de lado',
 'função demonstrativa — forte, usada com ironia ou em defesa da vulnerável'];
const SOC_FRASE={LII:'Analista: estrutura primeiro, aplicação depois.',ILE:'Inventor: toda coisa é um protótipo do que pode ser.',
 SEI:'Mediador: ajusta o ambiente até ficar habitável para todos.',ESE:'Entusiasta: move o grupo pelo clima.',
 EIE:'Mentor: dramatiza o presente para apontar o rumo.',LSI:'Inspetor: sistema aplicado com disciplina.',
 SLE:'Comandante: lê a correlação de forças e avança.',IEI:'Lírico: sente para onde a maré vai.',
 SEE:'Político: influência direta sobre pessoas e território.',ILI:'Crítico: prevê o desdobramento e corta o desperdício.',
 LIE:'Empreendedor: transforma previsão em operação.',ESI:'Guardião: lealdade e julgamento moral firmes.',
 LSE:'Administrador: processo confiável, bem-estar garantido.',EII:'Humanista: escuta o núcleo ético de cada um.',
 IEE:'Conselheiro: enxerga o talento escondido das pessoas.',SLI:'Artesão: conforto e técnica sem desperdício.'};

/* ---------------- Eneagrama ---------------- */
const ENN={
 1:{frase:'Corrigir o mundo começando por si: viver acima de qualquer reprovação.',
    motivacao:'ser íntegro, correto e além de crítica',medo:'ser corrupto, defeituoso, condenável',
    desejo:'ter integridade e equilíbrio',atencao:'o que está errado, fora do padrão, por corrigir',
    defesa:'formação reativa: sentir o impulso e fazer o oposto "correto"',virtude:'serenidade',paixao:'ira (ressentimento contido)'},
 2:{frase:'Ser necessário: garantir amor tornando-se indispensável aos outros.',
    motivacao:'sentir-se amado e necessário',medo:'ser dispensável, não amado',
    desejo:'ser amado incondicionalmente',atencao:'a necessidade dos outros — antes da própria',
    defesa:'repressão da própria carência, convertida em ajuda ativa',virtude:'humildade',paixao:'orgulho (de quem "não precisa de nada")'},
 3:{frase:'Valer pelo que realiza: transformar-se na imagem do êxito do seu meio.',
    motivacao:'ser valioso e admirado pelo que conquista',medo:'não ter valor próprio, fracassar',
    desejo:'sentir-se valioso',atencao:'metas, imagem, comparação com os outros',
    defesa:'identificação com a imagem: o papel substitui a pessoa',virtude:'veracidade',paixao:'vaidade (autoengano do papel)'},
 4:{frase:'Ser único: encontrar a identidade que falta comparando-se com o que os outros têm.',
    motivacao:'ter identidade própria e significado',medo:'não ter identidade, ser comum',
    desejo:'encontrar a si mesmo',atencao:'o que falta — no presente, em si, na relação',
    defesa:'introjeção: transformar perda em identidade ("sou o que me falta")',virtude:'equanimidade',paixao:'inveja (do que parece completo nos outros)'},
 5:{frase:'Preservar autonomia e energia reduzindo demandas externas e compreendendo antes de agir.',
    motivacao:'ser capaz e competente antes de se expor',medo:'ser invadido, esvaziado, incapaz',
    desejo:'dominar o que precisa enfrentar',atencao:'o que consome energia; conhecimento que protege',
    defesa:'isolamento e compartimentação: viver na cabeça, cortar a demanda',virtude:'desapego',paixao:'avareza (de energia, tempo e presença)'},
 6:{frase:'Antecipar o pior para nunca ser pego desprevenido; lealdade como seguro.',
    motivacao:'ter segurança e apoio confiável',medo:'ficar sem apoio, ser traído',
    desejo:'segurança',atencao:'riscos, intenções ocultas, o que pode dar errado',
    defesa:'projeção: o perigo interno é visto fora',virtude:'coragem',paixao:'medo (dúvida que não fecha)'},
 7:{frase:'Manter todas as portas abertas: planejar o próximo prazer antes que a dor alcance.',
    motivacao:'ser feliz, livre e satisfeito',medo:'ficar preso na dor ou na privação',
    desejo:'plenitude',atencao:'opções futuras, estímulo novo, saída de emergência',
    defesa:'racionalização e fuga para o futuro',virtude:'sobriedade',paixao:'gula (de experiências)'},
 8:{frase:'Nunca mais ser vulnerável: controlar o próprio território e testar a força do outro.',
    motivacao:'ser forte e dono do próprio destino',medo:'ser controlado ou traído na fraqueza',
    desejo:'proteger-se e aos seus',atencao:'poder, injustiça, quem manda em quê',
    defesa:'negação da própria vulnerabilidade',virtude:'inocência',paixao:'luxúria (intensidade e excesso)'},
 9:{frase:'Manter a paz fundindo-se com o outro e adiando a própria vontade.',
    motivacao:'ter paz interior e harmonia ao redor',medo:'conflito, separação, perda de conexão',
    desejo:'estabilidade e união',atencao:'a agenda dos outros; a própria fica embaçada',
    defesa:'narcotização: rotina e conforto que anestesiam a prioridade própria',virtude:'ação correta',paixao:'preguiça (de si mesmo)'}};
const ENN_INT={1:[7,4],2:[4,8],3:[6,9],4:[1,2],5:[8,7],6:[9,3],7:[5,1],8:[2,5],9:[3,6]};

/* ---------------- montagem dos perfis ---------------- */
const forcaLb=d=>d>=25?'forte':d>=12?'moderada':d>=5?'leve predominância':'equilibrada';
function tipDicos(Y){
  return [['Introversão × Extroversão',Y.dims.E,'E','I','Extroversão, Sociabilidade e Expressividade'],
    ['Intuição × Sensação',Y.dims.N,'N','S','Abstração, Imaginação e Idealismo'],
    ['Sentimento × Pensamento',Y.dims.F,'F','T','Emotividade, Sensibilidade e o inverso de Análise'],
    ['Julgamento × Percepção',Y.dims.J,'J','P','Ordem, Planejamento e Disciplina']];
}
function tipCalcHTML(Y,sys){
  const dic=tipDicos(Y).map(([nome,v,hi,lo,eixos])=>{
    const lado=v>=50?hi:lo, d=Math.abs(v-50);
    return '<div class="tpq-r"><span>'+nome+'</span><b>'+lado+' — '+forcaLb(d)
      +'</b><p>eixos agregados: '+eixos+'. Posição '+v+'% para '+hi+'.</p></div>';
  }).join('');
  let extra='';
  if(sys==='enn')extra='<div class="tpq-r"><span>Composição do tipo '+Y.enn+'</span><b>apoio '+Y.ennScore+'%</b>'
    +'<p>Cada tipo soma dois grupos de eixos (ex.: tipo 5 = Concentração + Introversão; tipo 8 = Dominação + Autonomia). '
    +'O tipo exibido é o de maior soma; a alternativa é o segundo colocado ('+Y.ennAlt+').</p></div>';
  if(sys==='soc')extra='<div class="tpq-r"><span>Conversão para a sociônica</span><b>via dicotomias</b>'
    +'<p>O código junguiano de quatro letras é convertido pela tabela clássica (ex.: INTj→LII, INTp→ILI). '
    +'A racionalidade sociônica (j/p) segue a dicotomia Julgamento×Percepção estimada acima.</p></div>';
  return '<details class="tpq"><summary>Como este tipo foi estimado pelo mapa</summary>'
    +'<p class="tpq-n">Estimativa derivada do padrão global dos 48 eixos — nunca de um signo ou planeta isolado. '
    +'Não é diagnóstico psicométrico: é a tipologia que o padrão do mapa mais aproxima.</p>'
    +dic+extra
    +'<div class="tpq-r"><span>Eixos que mais sustentam</span><b>'+(Y.sust.join(' · ')||'—')+'</b></div>'
    +(Y.diverg.length?('<div class="tpq-r"><span>Onde a evidência divide</span><b>'+Y.diverg.join('; ')+'</b></div>'):'')
    +'</details>';
}
const tipSec=(k,txt)=>'<div class="tps"><span>'+k+'</span><p>'+txt+'</p></div>';
function perfilMBTI(Y){
  const t=Y.mbti, st=mbtiStack(t);
  const nm=s=>({N:'N',S:'S',T:'T',F:'F'})[s[0]]+s[1];
  const key=s=>s[0].toUpperCase()+s[1];              // 'Ni' etc — já vem 'Ni'
  const fnKey=s=>s[0]+s[1];                          // dom string like 'Ni'
  const [dom,aux,tert,inf]=st.map(x=>x[0].toUpperCase()+x[1]);
  const F=k=>FN[k]||FN.Ni;
  const stackHTML='<div class="tp-stack">'+[['dominante',dom],['auxiliar',aux],['terciária',tert],['inferior',inf]]
    .map(([r,k],i)=>'<div class="tp-fn p'+i+'"><i>'+k+'</i><b>'+F(k).nome+'</b><span>'+r+'</span>'
      +'<p>'+F(k)[['dom','aux','tert','inf'][i]]+'</p></div>').join('')+'</div>';
  const percebe=[dom,aux,tert,inf].filter(k=>'NS'.includes(k[0]));
  const decide=[dom,aux,tert,inf].filter(k=>'TF'.includes(k[0]));
  return '<div class="tp-drawer mbti">'
    +'<div class="tp-hero"><i class="tp-selo jung"></i><b>'+t+'</b>'
    +'<em>tipologia estimada a partir do mapa · alternativa: '+Y.mbtiAlt+'</em></div>'
    +tipSec('Em uma frase',MBTI_FRASE[t]||'')
    +'<div class="tps"><span>Mandala funcional — como as quatro funções se organizam</span></div>'
    +stackHTML
    +tipSec('Como pensa','O canal principal de percepção é '+F(percebe[0]).nome+': '+F(percebe[0])[percebe[0]===dom?'dom':percebe[0]===aux?'aux':percebe[0]===tert?'tert':'inf'])
    +tipSec('Como decide','O critério predominante é '+F(decide[0]).nome+': '+F(decide[0])[decide[0]===dom?'dom':decide[0]===aux?'aux':decide[0]===tert?'tert':'inf'])
    +tipSec('Como se relaciona',(t[0]==='I'?'A energia social é finita e seletiva: poucos vínculos, profundos. ':'O contato energiza: a vida acontece na troca. ')
      +([dom,aux].some(k=>k==='Fe')?'Tende a cuidar ativamente do clima entre as pessoas.':[dom,aux].some(k=>k==='Fi')?'A lealdade é profunda, mas pouco verbalizada.':'O afeto aparece mais em ato e constância do que em declaração.'))
    +tipSec('Sob pressão','A função inferior ('+inf+') assume do pior jeito: '+F(inf).inf)
    +tipSec('Pontos fortes',F(dom).dom+' Somado ao apoio da auxiliar, isso vira competência estável.')
    +tipSec('Pontos cegos','O que a inferior ('+inf+') cobre: '+F(inf).inf)
    +tipSec('No trabalho',(dom[0]==='T'||aux[0]==='T'?'Funciona melhor com objetivo claro e autonomia de método.':'Funciona melhor onde pessoas e sentido importam tanto quanto o resultado.'))
    +tipSec('Nos relacionamentos',(t[3]==='J'?'Prefere definição: saber o que é a relação e para onde vai.':'Prefere espaço: rótulos cedo demais soam como prisão.'))
    +tipSec('O que costuma ser mal compreendido',MBTI_MAL[t]||'')
    +tipCalcHTML(Y,'mbti')+'</div>';
}
function perfilSOC(Y){
  const t=Y.soc, mod=socModeloA(t);
  if(!mod)return '<p class="note">tipo sociônico indisponível.</p>';
  const blocos=[['EGO',0,2,'o que a pessoa É e oferece'],['SUPER-EGO',2,2,'onde tenta corresponder e se desgasta'],
    ['SUPER-ID',4,2,'o que busca receber do outro'],['ID',6,2,'a reserva forte que fica nos bastidores']];
  const grid='<div class="soc-grid">'+blocos.map(([nome,i0,n,sub])=>
    '<div class="soc-bloco"><div class="soc-bk">'+nome+'<i>'+sub+'</i></div>'
    +mod.slice(i0,i0+n).map((el,j)=>'<div class="soc-fn"><b>'+el+'</b><span>'+SOC_EL[el]+'</span>'
      +'<p>'+SOC_POS[i0+j]+'</p></div>').join('')+'</div>').join('')+'</div>';
  return '<div class="tp-drawer soc">'
    +'<div class="tp-hero"><i class="tp-selo sov"></i><b>'+t+'</b>'
    +'<em>'+(SOC_NOME[t]||'')+' · tipologia estimada a partir do mapa · alternativa: '+Y.socAlt+'</em></div>'
    +tipSec('Em uma frase',SOC_FRASE[t]||'')
    +tipSec('O que é o Modelo A','A sociônica descreve a psique como oito posições fixas por onde circulam oito elementos de informação. '
      +'Não é "MBTI com outros nomes": aqui cada posição diz o que a pessoa produz, o que a fere, o que ela busca no outro e o que guarda de reserva.')
    +grid
    +tipSec('Com quem funciona','O que a função sugestiva ('+mod[4]+' — '+SOC_EL[mod[4]]+') pede é exatamente o que o tipo dual produz sem esforço. '
      +'Relações que alimentam essa posição tendem a descansar; relações que cobram a vulnerável ('+mod[3]+') tendem a desgastar.')
    +tipSec('Equivalência aproximada','Corresponde de longe ao MBTI '+Y.mbti+', mas os sistemas definem as funções de modo diverso — a equivalência é ponte, não identidade.')
    +tipCalcHTML(Y,'soc')+'</div>';
}
function ennFiguraSVG(tipo,asa){
  const W=190,C=W/2,R=76;
  const pos=n=>{const a=(-90+(n%9)*40)*Math.PI/180;return [C+R*Math.cos(a),C+R*Math.sin(a)];};
  let s='<svg viewBox="0 0 '+W+' '+W+'" class="enn-fig">';
  s+='<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="rgba(233,238,248,.18)"/>';
  const liga=(a,b,st,w)=>{const [x1,y1]=pos(a),[x2,y2]=pos(b);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+st+'" stroke-width="'+(w||1)+'"/>';};
  [[9,3],[3,6],[6,9]].forEach(([a,b])=>liga(a,b,'rgba(233,238,248,.14)'));
  [[1,4],[4,2],[2,8],[8,5],[5,7],[7,1]].forEach(([a,b])=>liga(a,b,'rgba(233,238,248,.14)'));
  const [gi,gd]=ENN_INT[tipo]||[];
  if(gi)liga(tipo,gi,'rgba(220,184,119,.75)',1.6);
  if(gd)liga(tipo,gd,'rgba(201,120,120,.6)',1.3);
  for(let n=1;n<=9;n++){const [x,y]=pos(n);
    const on=n===tipo, w=n===asa;
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+(on?11:8)+'" fill="'+(on?'rgba(201,143,90,.2)':'#0a0f1d')+'" '
      +'stroke="'+(on?'rgba(201,143,90,.9)':w?'rgba(201,143,90,.5)':'rgba(233,238,248,.25)')+'"/>'
      +'<text x="'+x+'" y="'+(y+3.5)+'" text-anchor="middle" font-size="'+(on?11:9)+'" '
      +'fill="'+(on?'#e6c07a':'rgba(233,238,248,.6)')+'" font-family="IBM Plex Mono">'+n+'</text>';}
  s+='</svg>';
  return s;
}
function perfilENN(Y){
  const t=Y.enn, E=ENN[t]; if(!E)return '';
  const adj=(a,b)=>Math.abs(a-b)===1||Math.abs(a-b)===8;
  const asa=adj(t,Y.ennAlt)?Y.ennAlt:null;
  const [gi,gd]=ENN_INT[t];
  return '<div class="tp-drawer enn">'
    +'<div class="tp-hero"><i class="tp-selo maya"></i><b>Tipo '+t+(asa?('w'+asa):'')+'</b>'
    +'<em>'+ENN_NOME[t]+' · tipologia estimada a partir do mapa · alternativa: tipo '+Y.ennAlt+'</em></div>'
    +tipSec('Em uma frase',E.frase)
    +ennFiguraSVG(t,asa)
    +'<p class="enn-leg">linha dourada: integração (→ '+gi+') · linha rubra: desintegração (→ '+gd+')'+(asa?(' · asa '+asa):'')+'</p>'
    +tipSec('O que motiva o padrão',cap1(E.motivacao)+'. O medo básico é '+E.medo+'; o desejo básico, '+E.desejo+'.')
    +tipSec('Para onde a atenção vai','A atenção se dirige, antes de qualquer escolha consciente, para '+E.atencao+'.')
    +tipSec('Estratégia defensiva',cap1(E.defesa)+'.')
    +tipSec('Paixão e virtude','A paixão (o vício emocional do tipo) é '+E.paixao+'. A virtude que o equilibra é a '+E.virtude+'.')
    +tipSec('Em segurança (integração)','Sob segurança real, o tipo '+t+' toma emprestado o melhor do tipo '+gi+' — '+ENN[gi].frase.toLowerCase())
    +tipSec('Sob estresse (desintegração)','Sob pressão prolongada, tende ao pior do tipo '+gd+' — atenção ao padrão: '+ENN[gd].paixao+'.')
    +(asa?tipSec('Asa','A asa '+asa+' ('+ENN_NOME[asa]+') colore o tipo: '+ENN[asa].frase.toLowerCase()):tipSec('Asa','A evidência dos eixos não separa uma asa com clareza — nenhuma é afirmada.'))
    +tipSec('O que costuma ser mal compreendido','O tipo não é o comportamento, é a motivação: dois tipos podem agir igual por razões opostas. O que define o '+t+' é '+E.motivacao+'.')
    +tipCalcHTML(Y,'enn')+'</div>';
}
/* aberturas */
function tipAbrir(sys){
  try{
    const A=allAxes(); const Y=typology(A); if(!Y)return;
    const titulo=sys==='mbti'?'MBTI — perfil completo':sys==='soc'?'Sociônica — Modelo A':'Eneagrama — perfil completo';
    const html=sys==='mbti'?perfilMBTI(Y):sys==='soc'?perfilSOC(Y):perfilENN(Y);
    if(typeof tlDrawer==='function')tlDrawer(titulo,html);
  }catch(e){console.error('tipologia',e);}
}
document.addEventListener('click',e=>{
  const t=e.target.closest&&e.target.closest('[data-tip]');
  if(t)tipAbrir(t.dataset.tip);
});
