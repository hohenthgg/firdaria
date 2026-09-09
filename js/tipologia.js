/* ============================================================
   TIPOLOGIA.JS — perfis completos e clicáveis de MBTI,
   Sociônica (Modelo A) e Eneagrama, montados a partir da
   estrutura de cada sistema — nunca listas de adjetivos.
   Sempre "tipologia estimada a partir do mapa", com a camada
   "como foi calculado" auditável.
   ============================================================ */

/* ---------------- MBTI e Sociônica: movidos ----------------
   As definições do MBTI (pilha funcional, frases e mal-entendidos)
   e as da Sociônica (Modelo A, elementos, posições) foram movidas
   para módulos próprios e independentes — tip-mbti.js e
   tip-socionica.js —, com a convenção adotada declarada, as fontes
   nomeadas e sem reaproveitar as definições de um sistema no outro.
   Este arquivo guarda agora apenas o Eneagrama.
   ---------------------------------------------------------------- */

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
/* A auditoria das quatro dicotomias saiu daqui junto com a conversão que
   as produzia: elas vinham de médias de eixos e não descreviam nada que o
   app ainda calcule. O Eneagrama não depende delas — é um sistema de
   MOTIVAÇÃO, e a sua derivação por eixos nunca passou por MBTI. */
function tipCalcHTML(Y,sys){
  if(sys!=='enn')return '';
  return '<details class="tpq"><summary>Como este tipo foi estimado pelo mapa</summary>'
    +'<p class="tpq-n">Estimativa derivada do padrão global dos 48 eixos — nunca de '
    +'um signo ou planeta isolado. Não é diagnóstico psicométrico.</p>'
    +'<div class="tpq-r"><span>Composição do tipo '+Y.enn+'</span><b>apoio '+Y.ennScore+'%</b>'
    +'<p>Cada tipo soma dois grupos de eixos (por exemplo, o tipo 5 = Concentração '
    +'com Introversão; o tipo 8 = Dominação com Autonomia). O tipo exibido é o de '
    +'maior soma, e a alternativa é o segundo colocado ('+Y.ennAlt+'). A soma serve '
    +'para ORDENAR os nove tipos — não é probabilidade nem grau de certeza.</p></div>'
    +'<div class="tpq-r"><span>Eixos que mais sustentam</span><b>'
      +((Y.sust&&Y.sust.join(' · '))||'—')+'</b></div>'
    +'<div class="tpq-r"><span>MBTI e Sociônica</span><b>não saem daqui</b>'
    +'<p>São inferidos noutro lugar, por comparação de estruturas completas, na aba '
    +'de tipologias. Não há conversão destes eixos para letras nem para sociotipo.</p></div>'
    +'</details>';
}
const tipSec=(k,txt)=>'<div class="tps"><span>'+k+'</span><p>'+txt+'</p></div>';
/* perfilMBTI e perfilSOC removidos: a apresentação desses dois
   sistemas passou para tip-ui.js, em seis seções. */
function ennFiguraSVG(tipo,asa){
  const W=190,C=W/2,R=76;
  const pos=n=>{const a=(-90+(n%9)*40)*Math.PI/180;return [C+R*Math.cos(a),C+R*Math.sin(a)];};
  let s='<svg viewBox="0 0 '+W+' '+W+'" class="enn-fig">';
  s+='<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="rgba(246,249,255,0.279)"/>';
  const liga=(a,b,st,w)=>{const [x1,y1]=pos(a),[x2,y2]=pos(b);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+st+'" stroke-width="'+(w||1)+'"/>';};
  [[9,3],[3,6],[6,9]].forEach(([a,b])=>liga(a,b,'rgba(246,249,255,0.217)'));
  [[1,4],[4,2],[2,8],[8,5],[5,7],[7,1]].forEach(([a,b])=>liga(a,b,'rgba(246,249,255,0.217)'));
  const [gi,gd]=ENN_INT[tipo]||[];
  if(gi)liga(tipo,gi,'rgba(240,207,142,1.0)',1.6);
  if(gd)liga(tipo,gd,'rgba(238,145,132,0.93)',1.3);
  for(let n=1;n<=9;n++){const [x,y]=pos(n);
    const on=n===tipo, w=n===asa;
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+(on?11:8)+'" fill="'+(on?'rgba(201,143,90,.2)':'#0a0f1d')+'" '
      +'stroke="'+(on?'rgba(201,143,90,.9)':w?'rgba(201,143,90,.5)':'rgba(246,249,255,0.388)')+'"/>'
      +'<text x="'+x+'" y="'+(y+3.5)+'" text-anchor="middle" font-size="'+(on?11:9)+'" '
      +'fill="'+(on?'#e6c07a':'rgba(246,249,255,0.93)')+'" font-family="IBM Plex Mono">'+n+'</text>';}
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
    /* MBTI e Sociônica deixaram de ser abertos daqui: têm agora seções
       próprias na aba de tipologias, com hipóteses ordenadas, o que as
       sustenta e o que as contraria. O atalho leva para lá. */
    if(sys==='mbti'||sys==='soc'){
      if(typeof TP_TAB!=='undefined'){TP_TAB='visao';
        if(typeof renderTipos==='function')renderTipos();}
      if(typeof irPara==='function')irPara('tipos');
      return;
    }
    const A=allAxes(); const Y=typology(A); if(!Y)return;
    if(typeof tlDrawer==='function')tlDrawer('Eneagrama — perfil completo',perfilENN(Y));
  }catch(e){console.error('tipologia',e);}
}
document.addEventListener('click',e=>{
  const t=e.target.closest&&e.target.closest('[data-tip]');
  if(t)tipAbrir(t.dataset.tip);
});
