/* ============================================================
   NIVEL.JS — dois níveis de leitura, um só interruptor

   Toda leitura gerada passa a existir em duas versões:

     SIMPLES (padrão)  o acontecimento provável, a janela, e o porquê em
                       linguagem comum. Sem "progredida", "dirigido",
                       "recepção", "combusto", "orbe". Sem glifo como
                       única informação. No máximo três linhas.
     TÉCNICO (toggle)  tudo o que já existia: contatos, arcos, orbes,
                       dignidades, confirmações, a votação de campo com
                       as pontuações e a origem de cada significador.

   Nada é removido — o técnico fica atrás do interruptor.

   O interruptor é GLOBAL e persistente, e o padrão é desligado: quem
   abre o app pela primeira vez lê em português comum.

   Implementação: as funções de render PERGUNTAM `modoTecnico()` e não
   emitem o texto técnico quando ele está desligado. Esconder por CSS
   não bastaria — o texto continuaria no documento, continuaria a ser
   lido por leitores de ecrã e continuaria a aparecer em textContent.
   ============================================================ */

const NIVEL_CHAVE='agx_modo_tecnico';
let NIVEL_TEC=(function(){
  try{ return localStorage.getItem(NIVEL_CHAVE)==='1'; }catch(e){ return false; }
})();

function modoTecnico(){ return !!NIVEL_TEC; }
function modoTecnicoDefinir(v){
  NIVEL_TEC=!!v;
  try{ localStorage.setItem(NIVEL_CHAVE, NIVEL_TEC?'1':'0'); }catch(e){}
  nivelAplicarClasse();
  return NIVEL_TEC;
}
function modoTecnicoAlternar(){ return modoTecnicoDefinir(!NIVEL_TEC); }

/* a classe no <body> serve só para estilo — a decisão de EMITIR ou não
   o texto técnico é sempre de quem gera o HTML */
function nivelAplicarClasse(){
  if(typeof document==='undefined'||!document.body)return;
  document.body.classList.toggle('tecnico', !!NIVEL_TEC);
}

/* ---------- vocabulário proibido no nível simples ----------
   Mantido aqui, e não espalhado pelos módulos, para que a suíte possa
   conferir a lista contra o que realmente é renderizado. */
const NIVEL_TERMOS_TECNICOS=[
  'progredid','dirigid','orbe','recepção','recepcao','combusto','combusta',
  'cazimi','arco de direção','ascensão reta','significador','promissor',
  'triplicidade','peregrin'
];
/* os quatro que a suíte exige explicitamente */
const NIVEL_TERMOS_MINIMOS=['progredid','dirigid','orbe','recepção'];

function nivelContemTecnico(txt,lista){
  const t=(txt||'').toLowerCase();
  return (lista||NIVEL_TERMOS_MINIMOS).filter(w=>t.indexOf(w)>=0);
}

/* ---------- o interruptor, para qualquer aba ---------- */
function nivelToggleHTML(){
  const on=modoTecnico();
  return '<button class="niv-t'+(on?' on':'')+'" data-nivtec="1" '
    +'role="switch" aria-checked="'+(on?'true':'false')+'" '
    +'title="Mostra contatos, arcos, dignidades e a votação de campo com as pontuações">'
    +'<i aria-hidden="true"></i><span>modo técnico</span></button>';
}
/* ligado uma vez, no documento inteiro: qualquer aba pode imprimir o
   botão sem se preocupar com o evento */
let NIVEL_LIGADO=false;
function nivelLigarEventos(reRender){
  if(NIVEL_LIGADO||typeof document==='undefined')return;
  NIVEL_LIGADO=true;
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('[data-nivtec]');
    if(!b)return;
    modoTecnicoAlternar();
    if(typeof reRender==='function'){ try{ reRender(); }catch(x){ console.error(x); } }
    else nivelReRender();
  });
}
/* re-desenha o que estiver montado, sem saber de que aba se trata */
function nivelReRender(){
  ['renderPreditivas','renderHoje','renderRS','renderProb','renderSaude','renderTempo']
    .forEach(fn=>{ if(typeof window!=='undefined'&&typeof window[fn]==='function'){
      try{ window[fn](); }catch(e){} } });
}

if(typeof window!=='undefined'){
  window.modoTecnico=modoTecnico;
  window.modoTecnicoDefinir=modoTecnicoDefinir;
  window.modoTecnicoAlternar=modoTecnicoAlternar;
  window.nivelContemTecnico=nivelContemTecnico;
  window.NIVEL_TERMOS_MINIMOS=NIVEL_TERMOS_MINIMOS;
}
