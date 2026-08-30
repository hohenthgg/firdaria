/* ============================================================
   CORPORA.JS — carga sob demanda dos corpora grandes.

   Os textos integrais (Gargatholil, Olavo, Barbault, Lions Daily e o
   RAG unificado) somam cerca de 1,5 MB e só fazem falta quando se abre
   o Mapa natal, o Perfil ou as Tipologias. Antes eram baixados e
   interpretados no carregamento da página, atrasando a primeira tela.
   Agora entram quando a aba que os usa é aberta.

   Nada muda para quem os consome: continuam sendo os mesmos globais.
   Enquanto não chegam, CORPORA_PRONTOS é falso — e quem exibe as
   fontes diz "carregando" em vez de "sem texto", para não confundir
   ausência de corpus com ausência de carga.
   ============================================================ */

const CORPORA_ARQUIVOS=[
  'js/olavo_texto.js',   // Olavo — planetas nas casas, texto integral
  'js/barbault.js',      // Barbault — os doze capítulos de signo
  'js/garg.js',          // Gargatholil — signos e casas, original
  'js/lion.js',          // Lions Daily — função, traços e registros
  'js/rag_uni.js'        // RAG unificado — casas, colocações e temperamentos
];
let CORPORA_PRONTOS=false;
let CORPORA_ERRO=null;
let _corporaPromessa=null;

function _carregaScript(src){
  return new Promise((ok,falha)=>{
    const s=document.createElement('script');
    s.src=src; s.async=false;              // preserva a ordem entre os arquivos
    s.onload=()=>ok(src);
    s.onerror=()=>falha(new Error('não foi possível carregar '+src));
    document.head.appendChild(s);
  });
}
/* carrega uma vez; chamadas seguintes recebem a mesma promessa */
function corporaCarregar(){
  if(_corporaPromessa)return _corporaPromessa;
  _corporaPromessa=CORPORA_ARQUIVOS.reduce(
    (p,src)=>p.then(()=>_carregaScript(src)),
    Promise.resolve()
  ).then(()=>{CORPORA_PRONTOS=true;return true;})
   .catch(e=>{CORPORA_ERRO=e;console.error('corpora',e);return false;});
  return _corporaPromessa;
}
/* abas que dependem dos textos integrais */
const CORPORA_ABAS=['natal','perfil','tipos'];
function corporaParaAba(p,aoTerminar){
  if(CORPORA_ABAS.indexOf(p)<0)return;
  if(CORPORA_PRONTOS)return;
  corporaCarregar().then(ok=>{if(ok&&typeof aoTerminar==='function')aoTerminar();});
}
