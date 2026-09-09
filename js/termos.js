/* ============================================================
   TERMOS.JS — os limites (termos) como SISTEMAS selecionáveis.

   Havia uma única tabela, `TERMS`, com os limites EGÍPCIOS. Ela não é
   sobrescrita: passa a ser uma das variantes, nomeada como tal, e o
   sistema em uso aparece em toda leitura que dependa de termos.

   Contrato das funções:
     termLord(longitude, sistema)    → chave do planeta
     termSegment(longitude, sistema) → {system, sign, start, end, lord,
                                        degreeWithinSign}
     termRange(signIndex, longitude, sistema) → o mesmo, pelo signo dado

   Regras que o módulo faz valer, e que os testes conferem:
     · intervalos em [início, fim) — o grau exato do limite pertence ao
       termo SEGUINTE;
     · 0° e 29°59′59″ resolvem dentro do próprio signo;
     · nenhum termo atravessa para o signo seguinte;
     · os cinco segmentos de cada signo somam exatamente 30°;
     · Sol e Lua não administram termos;
     · termo próprio é dignidade MENOR — nunca vale mais que domicílio,
       exaltação, ou uma ativação temporal principal. O peso está em
       quem consome, e a nota abaixo acompanha a leitura.
   ============================================================ */

const TERMO_NOTA_MENOR=
  'O termo é dignidade menor: qualifica a administração de um grau, e não '
  +'substitui domicílio, exaltação nem um senhor do tempo. Uma coincidência '
  +'entre o senhor do termo e um senhor do tempo é confirmação MENOR.';

/* ---------- os sistemas ----------
   `limites` é uma lista de 12 signos; cada signo tem 5 pares
   [fimEmGrausDentroDoSigno, planeta], em ordem crescente, terminando
   em 30. O início de cada segmento é o fim do anterior (0 para o
   primeiro). É a mesma forma da tabela original, para que a variante
   egípcia seja exatamente a que o projeto já usava. */
const TERM_SYSTEMS={
  egyptian:{
    id:'egyptian',
    nome:'Termos egípcios',
    fonte:'tábua egípcia — a que este projeto já usava em TERMS (tables.js)',
    transcrito:true,
    limites:(typeof TERMS!=='undefined')?TERMS:null
  },
  ptolemaic:{
    id:'ptolemaic',
    nome:'Termos ptolomaicos',
    fonte:'imagem “Table of Essential Dignities” fornecida pelo utilizador',
    /* AINDA NÃO TRANSCRITO — e é deliberado que esteja vazio.
       A instrução foi explícita: transcrever exatamente os limites da
       imagem fornecida, sem reconstruir de memória e sem misturar outra
       variante histórica. A imagem NÃO chegou a esta sessão (a pasta de
       anexos veio vazia), e as variantes ptolomaicas em circulação
       divergem entre si em vários signos. Preencher isto de cabeça
       produziria uma tabela que se parece com a certa e não é a da
       imagem — exatamente o que foi proibido.
       Para completar: preencher `limites` no mesmo formato do egípcio
       acima. `termosValidar('ptolemaic')` confere soma 30°, ordem,
       ausência de Sol e Lua, e o teste falha enquanto isto estiver
       vazio. Nada mais precisa mudar: a interface, o motor e o backup
       já operam com dois sistemas. */
    transcrito:false,
    limites:null,
    porQue:'A tabela ptolomaica não foi transcrita porque a imagem indicada '
      +'como fonte de verdade não chegou a esta sessão. Reconstruí-la de '
      +'memória foi expressamente vedado, e as variantes em circulação '
      +'divergem entre si. O sistema fica declarado e selecionável assim '
      +'que os limites forem preenchidos em TERM_SYSTEMS.ptolemaic.limites.'
  }
};

const TERMO_PLANETAS=['mercury','venus','mars','jupiter','saturn'];
const TERMO_PADRAO_PRETENDIDO='ptolemaic';   // o que o projeto quer usar
const TERMO_CHAVE='agx_sistema_termos';

/* ---------- qual sistema está em uso ----------
   O pretendido é o ptolomaico. Enquanto ele não estiver transcrito, o
   app NÃO cai nele em silêncio: usa o egípcio e diz por quê. */
function termosDisponiveis(){
  return Object.values(TERM_SYSTEMS).filter(s=>s.transcrito&&s.limites);
}
function termosSistemaAtual(){
  let escolhido=null;
  try{ escolhido=localStorage.getItem(TERMO_CHAVE); }catch(e){}
  const alvo=escolhido||TERMO_PADRAO_PRETENDIDO;
  const S=TERM_SYSTEMS[alvo];
  if(S&&S.transcrito&&S.limites)return alvo;
  /* o pretendido não está disponível: recua para o egípcio, declarando */
  return 'egyptian';
}
function termosDefinirSistema(id){
  if(!TERM_SYSTEMS[id])return false;
  try{ localStorage.setItem(TERMO_CHAVE,id); }catch(e){}
  return true;
}
/* o estado do sistema, para a interface dizer sempre qual está em uso */
function termosEstado(){
  const emUso=termosSistemaAtual();
  const pretendido=TERM_SYSTEMS[TERMO_PADRAO_PRETENDIDO];
  return {
    emUso, nome:TERM_SYSTEMS[emUso].nome, fonte:TERM_SYSTEMS[emUso].fonte,
    disponiveis:termosDisponiveis().map(s=>({id:s.id,nome:s.nome})),
    pendente: (pretendido&&!pretendido.transcrito)
      ? {id:pretendido.id, nome:pretendido.nome, porQue:pretendido.porQue} : null,
    recuou: emUso!==TERMO_PADRAO_PRETENDIDO,
    nota:TERMO_NOTA_MENOR
  };
}

/* ---------- validação de uma tábua ---------- */
function termosValidar(id){
  const S=TERM_SYSTEMS[id];
  const erros=[];
  if(!S)return {ok:false, erros:['sistema desconhecido: '+id]};
  if(!S.limites){
    return {ok:false, transcrito:false,
      erros:['a tábua de '+S.nome+' não está preenchida'], porQue:S.porQue||null};
  }
  if(S.limites.length!==12)erros.push('a tábua não tem 12 signos');
  S.limites.forEach((sig,i)=>{
    const nome=(typeof SIGNS!=='undefined'&&SIGNS[i])?SIGNS[i]:('signo '+i);
    if(!Array.isArray(sig)||sig.length!==5){
      erros.push(nome+': não tem cinco segmentos'); return;
    }
    let ant=0;
    sig.forEach(([fim,lord],j)=>{
      if(typeof fim!=='number'||!(fim>ant))
        erros.push(nome+', segmento '+(j+1)+': limite não é crescente ('+ant+' → '+fim+')');
      if(fim>30)erros.push(nome+', segmento '+(j+1)+': ultrapassa 30° e invadiria o signo seguinte');
      if(TERMO_PLANETAS.indexOf(lord)<0)
        erros.push(nome+', segmento '+(j+1)+': '+lord+' não administra termos'
          +((lord==='sun'||lord==='moon')?' (Sol e Lua nunca administram)':''));
      ant=fim;
    });
    if(ant!==30)erros.push(nome+': os cinco segmentos somam '+ant+'°, e não 30°');
  });
  return {ok:erros.length===0, transcrito:true, erros};
}

/* ---------- consultas ---------- */
function termSegment(longitude, system){
  const sis=system||termosSistemaAtual();
  const S=TERM_SYSTEMS[sis];
  if(!S||!S.limites)return null;
  const L=n360(longitude);
  const sign=Math.floor(L/30);
  /* grau dentro do signo, em [0,30). O arredondamento é feito uma vez
     aqui: 29°59′59″ não pode transbordar para o signo seguinte. */
  let d=L-sign*30;
  if(d<0)d=0; if(d>=30)d=30-1e-9;
  const sig=S.limites[sign];
  let start=0;
  for(let i=0;i<sig.length;i++){
    const end=sig[i][0];
    /* [início, fim): o grau exato do limite pertence ao termo seguinte */
    if(d<end){
      return {system:sis, sign, start, end, lord:sig[i][1], degreeWithinSign:d,
        nome:(typeof SIGNS!=='undefined'?SIGNS[sign]:null),
        menor:TERMO_NOTA_MENOR};
    }
    start=end;
  }
  const ult=sig[sig.length-1];
  return {system:sis, sign, start:sig[sig.length-2][0], end:30, lord:ult[1],
    degreeWithinSign:d, nome:(typeof SIGNS!=='undefined'?SIGNS[sign]:null),
    menor:TERMO_NOTA_MENOR};
}
function termRange(signIndex, longitude, system){
  const s=((signIndex%12)+12)%12;
  const d=Math.max(0,Math.min(29.999999, longitude));
  return termSegment(s*30+d, system);
}
/* todos os cinco segmentos de um signo, para a faixa de termos */
function termosDoSigno(signIndex, system){
  const sis=system||termosSistemaAtual();
  const S=TERM_SYSTEMS[sis];
  if(!S||!S.limites)return [];
  let start=0;
  return S.limites[((signIndex%12)+12)%12].map(([end,lord])=>{
    const seg={system:sis, sign:((signIndex%12)+12)%12, start, end, lord};
    start=end; return seg;
  });
}
/* ---------- termLord ----------
   Assinatura antiga preservada: termLord(L) continua a devolver a chave
   do planeta. O segundo parâmetro escolhe o sistema. */
function termLord(L, system){
  const seg=termSegment(L, system);
  return seg?seg.lord:null;
}
