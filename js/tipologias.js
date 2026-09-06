/* ============================================================
   TIPOLOGIAS.JS — a aba extensa de tipologias.

   Monta a aba: primeiro as seis seções da camada tipológica nova
   (tip-ui.js), depois Eneagrama, DISC, Socoa e o Guia, que continuam
   aqui com a sua estrutura própria.

   MBTI e Sociônica NÃO são montados neste arquivo: têm módulos de
   definição, de inferência e de apresentação próprios, justamente
   para não voltarem a depender da conversão de eixos que existia aqui.
   Fontes estruturais desta aba: Palmer e Pietrak (Eneagrama),
   Marston (DISC), Michel de Socoa (tipos planetários).
   ============================================================ */
let TP_TAB='visao';



/* ---------- helpers ---------- */
function tpY(){
  try{
    const A=(typeof allAxes==='function')?allAxes():null;
    return (typeof typology==='function'&&A&&A.length)?typology(A):null;
  }catch(e){return null;}
}
const tpSec=(t,c)=>'<section class="tps"><h3>'+t+'</h3>'+c+'</section>';
const tpNote='<p class="pf-aviso">Estimativa derivada do padrão global do mapa (48 eixos) — aproximação auditável, nunca diagnóstico. O tipo verdadeiro se confirma por observação.</p>';

/* ============ MBTI e Sociônica ============
   As duas seções antigas foram substituídas pela camada tipológica
   nova (tip-ui.js), em seis seções: Visão geral, Funções e elementos,
   Hipóteses, Comparação entre sistemas, Refinar com respostas e
   Fontes e método. A estimativa deixou de vir de uma conversão de
   eixos em letras e passa a ser uma ordenação de estruturas completas,
   com o que a sustenta e o que a contraria declarados.
   ======================================================= */

/* ============ ENEAGRAMA ============ */
function tpENN(){
  const Y=tpY(); let h='';
  if(Y){
    h+='<div class="card tpe"><div class="kicker">seu tipo estimado</div>'
      +'<div class="tpe-h"><b>Tipo '+Y.enn+' · '+(typeof ENN_NOME!=='undefined'?ENN_NOME[Y.enn]:'')+'</b>'
      +'<em>'+((typeof ENN!=='undefined'&&ENN[Y.enn])?ENN[Y.enn].frase:'')+'</em></div>'
      +'<p class="np-sub">alternativa: tipo '+Y.ennAlt+'</p>'
      +(typeof tipCalcHTML==='function'?('<details class="np-int"><summary>Como foi estimado</summary>'+tipCalcHTML(Y,'enn')+'</details>'):'')
      +tpNote+'</div>';
    if(typeof perfilENN==='function')h+='<div class="card">'+perfilENN(Y)+'</div>';
  }
  h+=tpSec('O que o Eneagrama descreve',
    '<div class="tpx"><b>Motivação, não comportamento</b><p>O Eneagrama não classifica o que você faz, mas POR QUE faz: nove padrões de atenção que se formaram como defesa na infância. Dois tipos podem agir igual por motivos opostos — o tipo é o motivo.</p></div>'
    +'<div class="tpx"><b>Padrão de atenção</b><p>Cada tipo tem um foco involuntário (Palmer): o 1 nota o erro, o 2 nota a necessidade alheia, o 6 nota o risco. O que a atenção seleciona vira o mundo em que a pessoa vive.</p></div>'
    +'<div class="tpx"><b>Essência × personalidade</b><p>A personalidade é a estratégia que substituiu uma qualidade essencial perdida; o trabalho do sistema é reconhecer a estratégia em ato e afrouxá-la.</p></div>');
  const KG=(typeof TIPO_KG!=='undefined')?TIPO_KG:null;
  if(KG){
    h+=tpSec('As três tríades',KG.triads.map(t=>{
      const tt={'triad:gut':'Instintiva (8·9·1) — a emoção de fundo é a RAIVA: contra o mundo (8), adormecida (9) ou voltada para dentro como crítica (1).',
        'triad:heart':'Da imagem (2·3·4) — a emoção de fundo é a VERGONHA: o valor próprio depende da imagem refletida no outro.',
        'triad:head':'Do medo (5·6·7) — a emoção de fundo é o MEDO: recolher-se (5), antecipar (6) ou fugir para o agradável (7).'}[t.id];
      return '<div class="tpx"><b>'+t.name.replace(/ \/ .*Triad/,'')+'</b><p>'+(tt||t.core_emotion)+'</p></div>';}).join(''));
    h+=tpSec('Os nove pontos, um a um',KG.etypes.map(e=>{
      const n=e.number, D=(typeof ENN!=='undefined')?ENN[n]:null;
      const I=(typeof ENN_INT!=='undefined')?ENN_INT[n]:null;
      let corpo='';
      if(D)corpo='<p>'+D.frase+'</p>'
        +'<p class="tpq3">Motivação: '+D.motivacao+' · medo básico: '+D.medo+' · desejo: '+D.desejo
        +'.<br>Atenção presa em: '+D.atencao+'.<br>Defesa característica: '+D.defesa
        +'.<br>Paixão: '+D.paixao+' → virtude: '+D.virtude
        +(I?('.<br>Setas: sob estresse escorrega para o '+I[1]+'; em segurança colhe do '+I[0]):'')+'.</p>';
      else corpo='<p>'+e.preoccupations+'</p>';
      return '<div class="tpx"><b>'+n+' · '+(typeof ENN_NOME!=='undefined'?ENN_NOME[n]:e.palmer_name)
        +' <i>('+e.palmer_name+', Palmer)</i></b>'+corpo+'</div>';}).join(''));
  }
  h+=tpSec('Asas e setas',
    '<div class="tpx"><b>Asas</b><p>Os vizinhos do seu ponto no círculo temperam o tipo (um 9 asa 8 é mais firme; asa 1, mais exigente).</p></div>'
    +'<div class="tpx"><b>Setas — estresse e segurança</b><p>Sob pressão, cada tipo escorrega para o comportamento de um ponto específico; em segurança, colhe as qualidades de outro. As setas mapeiam esses dois caminhos e explicam por que a mesma pessoa parece dois tipos em fases diferentes.</p></div>');
  return h;
}


/* ============ DISC ============ */
const DISC_FATORES=[
  ['D','Dominância','como você lida com problemas e desafios.','Percebe-se mais forte que um ambiente hostil: avança. Direto, competitivo, decidido; motiva-se por desafio e controle; medo de fundo: ser usado, perder o comando. Sob pressão vira impaciência e imposição; em equipe, precisa de resultado à vista e detesta microgestão.'],
  ['I','Influência','como você lida com pessoas e persuasão.','Percebe-se mais forte que um ambiente favorável: encanta. Comunicativo, entusiasmado, otimista; motiva-se por reconhecimento e novidade; medo de fundo: rejeição social. Sob pressão vira dispersão e promessa demais; em equipe, precisa de palco e de gente, e sofre no trabalho solitário.'],
  ['S','Estabilidade','como você lida com ritmo e mudança.','Percebe-se mais fraco que um ambiente favorável: coopera. Constante, paciente, leal, bom ouvinte; motiva-se por segurança e harmonia; medo de fundo: perda da estabilidade. Sob pressão vira resistência passiva a qualquer mudança; em equipe, é quem sustenta o combinado — e quem menos avisa quando está sobrecarregado.'],
  ['C','Conformidade','como você lida com regras, método e qualidade.','Percebe-se mais fraco que um ambiente hostil: protege-se pela precisão. Criterioso, analítico, exigente consigo; motiva-se por fazer certo; medo de fundo: a crítica ao próprio trabalho. Sob pressão vira perfeccionismo paralisante; em equipe, é o controle de qualidade — e o gargalo, quando o padrão vira fim.']];
const DISC_DE_HUMOR={'colérico':'D','sanguíneo':'I','fleumático':'S','melancólico':'C'};
function tpDISC(){
  let est='';
  try{
    const T=(typeof temperEngine==='function')?temperEngine():null;
    if(T){
      const f1=DISC_DE_HUMOR[T.humor], f2=DISC_DE_HUMOR[T.secundario];
      const F1=DISC_FATORES.find(x=>x[0]===f1), F2=DISC_FATORES.find(x=>x[0]===f2);
      est='<div class="card tpe"><div class="kicker">seu perfil estimado</div>'
        +'<div class="tpe-h"><b>'+f1+(f2&&f2!==f1?('/'+f2):'')+'</b>'
        +'<em>'+F1[1]+(f2&&f2!==f1?(' com '+F2[1].toLowerCase()):'')+'</em></div>'
        +'<p class="np-sub">Derivado do temperamento humoral ('+T.humor+(T.secundario?(' com fundo '+T.secundario):'')
        +'), pela correspondência clássica colérico→D, sanguíneo→I, fleumático→S, melancólico→C.</p>'
        +tpNote+'</div>';
    }
  }catch(e){}
  return est
    +tpSec('O que o DISC mede',
      '<p class="tpq2">O DISC (William Marston, 1928) não é um sistema de tipos profundos: descreve o COMPORTAMENTO observável em dois eixos — você se percebe mais forte ou mais fraco que o ambiente? o ambiente lhe parece favorável ou hostil? Do cruzamento saem quatro fatores, e todo perfil é uma mistura com um ou dois dominantes.</p>')
    +tpSec('Os quatro fatores, um a um',DISC_FATORES.map(([s,n,d,deep])=>
      '<div class="tpx"><b>'+s+' — '+n+'</b><p class="tpq3">'+d+'</p><p>'+deep+'</p></div>').join(''))
    +tpSec('Como ler um perfil DISC',
      '<p class="tpq2">Fator alto não é qualidade nem defeito: é a resposta automática sob pressão. O par dominante descreve o estilo (um D/C decide rápido e cobra método; um I/S acolhe e mantém). O DISC funciona bem para trabalho e comunicação — e nada além disso: motivação profunda é assunto do Eneagrama, estrutura cognitiva é assunto de Jung.</p>');
}

/* ============ SOCOA — os sete tipos planetários ============ */
const SOCOA={
  sun:{n:'Solar',d:'O tipo do centro: consciência clara, necessidade de irradiar e de ser visto. Generoso e cerimonioso, organiza a vida como uma corte em torno do próprio coração. Vício da soberba; virtude da magnanimidade. Quando falha, vira teatralidade vazia; quando acerta, dá o chefe natural que ilumina sem esmagar.'},
  moon:{n:'Lunar',d:'O tipo mais próximo da matéria-prima plástica: retém todas as impressões, e por isso a memória e a imaginação são suas faculdades-mestras. Sereno, fatalista, algo melancólico; prazer e dor difusos pelo corpo inteiro. Vício da preguiça — mas uma preguiça habitada de poesia e de mistério; virtude da fé, que o faz poeta religioso, profeta ou místico. É o tipo das multidões que obedecem ao ambiente e se resignam.'},
  mercury:{n:'Mercuriano','d':'O intermediário: nervoso, rápido, curioso, verbal. Vive de trocas — palavras, mercadorias, ideias — e a agilidade mental é ao mesmo tempo seu dom e sua tentação (a astúcia, a mentira leve). No alto, dá o intérprete, o cientista, o escritor; no baixo, o trapaceiro charmoso.'},
  venus:{n:'Venusiano','d':'O tipo do apego: liga-se aos bens naturais e sobrenaturais, dos artistas aos religiosos; faz do sentimento o centro da vida. Doçura, gosto, necessidade de agradar e de ser amado. Vício da luxúria ou da complacência; virtude da caridade que embeleza o que toca.'},
  mars:{n:'Marciano','d':'A pulsão vital com sua energia e temeridade: audaz, intrépido, não suporta contenção — a independência é princípio, nem que seja para a errância sem fim. Violento e apaixonado, é também generoso e cavaleiresco, comovido por toda fraqueza a que possa emprestar o braço. Vício da cólera vermelha, que explode e serena; no polo passivo (Escorpião), vira o inquisidor que tortura consciências.'},
  jupiter:{n:'Jupiteriano','d':'O tipo da ordem e da expansão social: jovial, confiante, organizador, feito para a função pública, o direito e a prosperidade. Precisa de reconhecimento institucional. Vício da gula e da vaidade das honras; virtude da justiça que distribui e protege.'},
  saturn:{n:'Saturnino','d':'O tipo da profundidade e do tempo: lento, retido, concentrado, desconfiado do imediato. Envelhece cedo por dentro e amadurece o que os outros abandonam. Vício da avareza e da tristeza; virtude da prudência e da contemplação — no alto, dá o sábio e o asceta; no baixo, o solitário amargo.'}
};
function tpSOCOA(){
  let est='';
  try{
    const lord=(typeof lordOfGeniture==='function')?lordOfGeniture():null;
    const asc=(typeof NATAL!=='undefined'&&NATAL)?NATAL.rulers[1]:null;
    if(lord){
      const t=SOCOA[lord];
      est='<div class="card tpe"><div class="kicker">seu tipo estimado</div>'
        +'<div class="tpe-h"><b>'+t.n+'</b><em>pelo Senhor da Genitura: '+PT_NAME[lord]+'</em></div>'
        +'<p class="np-sub">'+t.d+'</p>'
        +(asc&&asc!==lord?('<p class="np-sub">Tipo secundário pelo regente do Ascendente: <b>'+SOCOA[asc].n+'</b>.</p>'):'')
        +tpNote+'</div>';
    }
  }catch(e){}
  return est
    +tpSec('A tipologia de Michel de Socoa',
      '<p class="tpq2">Em <i>Bases de l’astrologie individuelle — Typologie et caractères</i>, Socoa sustenta que a tipologia tradicional se baseia nos SETE PLANETAS, não nos doze signos: os signos são qualidades virtuais que só entram em ação pelas planetas («a presença prima sobre a dominação»). O tipo de um indivíduo é o planeta dominante do seu céu; cada tipo carrega um vício familiar e uma virtude polar — a mesma força, caída ou realizada.</p>')
    +tpSec('Os sete tipos planetários',Object.entries(SOCOA).map(([k,t])=>
      '<div class="tpx"><b>'+(PT_GLYPH[k]||'')+'︎ '+t.n+'</b><p>'+t.d+'</p></div>').join(''))
    +tpSec('Como o app determina o tipo',
      '<p class="tpq2">O dominante é aproximado pelo Senhor da Genitura (o planeta de maior força essencial e acidental no mapa), com o regente do Ascendente como tipo secundário — o mesmo espírito da «dominante planetária» de Socoa e de Barbault. Tipos mistos são a regra, não a exceção.</p>');
}

/* ---------- render ---------- */
/* A aba abre pelas seis seções da camada tipológica (tip-ui.js). Os
   demais sistemas — Eneagrama, DISC, Socoa — e o Guia continuam
   acessíveis, na segunda faixa, sem perder nada do que havia. */
const TP_TABS=(typeof TIP_SECOES!=='undefined'?TIP_SECOES.map(x=>[x[0],x[1]]):[])
  .concat([['enn','Eneagrama'],['disc','DISC'],['socoa','Socoa'],['guia','Guia']]);
const TP_PRINCIPAIS=(typeof TIP_SECOES!=='undefined'?TIP_SECOES.length:0);
function tpRender(id){
  if(typeof TIP_SECOES!=='undefined'){
    const S=TIP_SECOES.find(x=>x[0]===id);
    if(S)return S[2]();
  }
  const outros={enn:tpENN,disc:tpDISC,socoa:tpSOCOA,guia:tpGUIA};
  return outros[id]?outros[id]():'';
}
function renderTipos(){
  const bar=$('tp-tabs'), body=$('tp-body'); if(!bar||!body)return;
  if(!TP_TABS.some(x=>x[0]===TP_TAB))TP_TAB=TP_TABS[0][0];
  bar.innerHTML=TP_TABS.map(([id,lab],i)=>
    (i===TP_PRINCIPAIS&&TP_PRINCIPAIS?'<span class="tp-sep" aria-hidden="true"></span>':'')
    +'<button class="tp-tab'+(TP_TAB===id?' on':'')+'" data-tptab="'+id+'">'+lab+'</button>').join('');
  try{
    body.innerHTML=tpRender(TP_TAB);
  }catch(e){console.error('tipologias',e);body.innerHTML='<p class="note">não foi possível montar esta seção.</p>';}
}
function bindTipos(){
  const w=$('p-tipos'); if(!w)return;
  w.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('[data-tptab]');
    if(b){TP_TAB=b.dataset.tptab;renderTipos();window.scrollTo({top:0,behavior:'instant'});}
    const g=e.target.closest&&e.target.closest('[data-tpg]');
    if(g){TP_G=g.dataset.tpg;renderTipos();
      const a=document.querySelector('.gu-nav');
      if(a)a.scrollIntoView({behavior:'smooth',block:'start'});}
    /* ---- camada tipológica nova ---- */
    const sec=e.target.closest&&e.target.closest('[data-tipsec]');
    if(sec){TP_TAB=sec.dataset.tipsec;renderTipos();window.scrollTo({top:0,behavior:'instant'});return;}
    const fn=e.target.closest&&e.target.closest('[data-tipfn]');
    if(fn){
      const v=fn.dataset.tipfn;
      TIP_SEL=v||null; TIP_SEL_SIS=v?(fn.dataset.tipsis||'mbti'):null;
      renderTipos();
      if(v){const d=document.querySelector('.tip-det');
            if(d)d.scrollIntoView({behavior:'smooth',block:'start'});}
      return;}
    const q=e.target.closest&&e.target.closest('[data-tipq]');
    if(q){autoResponder(q.dataset.tipq,q.dataset.tipv);renderTipos();return;}
    const dc=e.target.closest&&e.target.closest('[data-tipdecl]');
    if(dc){
      const m=$('tip-decl-mbti'), so=$('tip-decl-soc');
      autoTipoDeclarado('mbti',m?m.value.trim().toUpperCase():'');
      autoTipoDeclarado('socionica',so?so.value.trim().toUpperCase():'');
      renderTipos();return;}
  });
}
