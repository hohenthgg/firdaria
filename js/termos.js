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
  ptolemaic:{
    id:'ptolemaic',
    nome:'Termos ptolomaicos',
    fonte:'imagem “Table of Essential Dignities” fornecida pelo utilizador — '
      +'transcrita célula a célula, coluna “Term”',
    transcrito:true,
    /* ---------- TRANSCRIÇÃO DA IMAGEM ----------
       Fonte de verdade declarada para a variante ptolomaica deste
       projeto. Os limites abaixo foram lidos da coluna “Term” da
       tabela, signo a signo, e não reconstruídos de memória.
       Duas células ficaram ilegíveis na resolução recebida — os dois
       últimos termos de Gêmeos e de Virgem, onde ♂ e ♄ não se
       distinguiam — e foram confirmadas pelo utilizador antes de
       escritas: Gêmeos ♄ 25 · ♂ 30, Virgem ♄ 24 · ♂ 30. */
    limites:[
      [[6,'jupiter'],[14,'venus'],[21,'mercury'],[26,'mars'],[30,'saturn']],   // Áries
      [[8,'venus'],[15,'mercury'],[22,'jupiter'],[26,'saturn'],[30,'mars']],   // Touro
      [[7,'mercury'],[14,'jupiter'],[21,'venus'],[25,'saturn'],[30,'mars']],   // Gêmeos
      [[6,'mars'],[13,'jupiter'],[20,'mercury'],[27,'venus'],[30,'saturn']],   // Câncer
      [[6,'saturn'],[13,'mercury'],[19,'venus'],[25,'jupiter'],[30,'mars']],   // Leão
      [[7,'mercury'],[13,'venus'],[18,'jupiter'],[24,'saturn'],[30,'mars']],   // Virgem
      [[6,'saturn'],[11,'venus'],[19,'jupiter'],[24,'mercury'],[30,'mars']],   // Libra
      [[6,'mars'],[14,'jupiter'],[21,'venus'],[27,'mercury'],[30,'saturn']],   // Escorpião
      [[8,'jupiter'],[14,'venus'],[19,'mercury'],[25,'saturn'],[30,'mars']],   // Sagitário
      [[6,'venus'],[12,'mercury'],[19,'jupiter'],[25,'mars'],[30,'saturn']],   // Capricórnio
      [[6,'saturn'],[12,'mercury'],[20,'venus'],[25,'jupiter'],[30,'mars']],   // Aquário
      [[8,'venus'],[14,'jupiter'],[20,'mercury'],[26,'mars'],[30,'saturn']]    // Peixes
    ]
  },
  egyptian:{
    id:'egyptian',
    nome:'Termos egípcios',
    /* ---------- RÓTULO RETIRADO, E POR QUÊ ----------
       Esta entrada apontava para `TERMS`, em tables.js, descrita em todo
       o projeto como “a tábua egípcia”. Ao conferir a imagem contra ela,
       verificou-se que TERMS NÃO É EGÍPCIA: é a própria tábua
       ptolomaica. Áries em TERMS é ♃6 ♀14 ☿21 ♂26 ♄30; o egípcio é
       ♃6 ♀12 ☿20 ♂25 ♄30. Diverge em onze dos doze signos. O projeto
       vinha portanto a usar os limites da imagem o tempo todo, com o
       nome errado — e o aviso de “recuo para o egípcio” que aparecia na
       tela descrevia mal o que de facto acontecia.
       O slot fica declarado e vazio, como o ptolomaico esteve antes:
       oferecer uma opção chamada “egípcia” que serve limites
       ptolomaicos seria pior do que não a oferecer. Preencher só a
       partir de uma fonte conferida, no mesmo formato acima. */
    transcrito:false,
    limites:null,
    porQue:'A tábua que este projeto rotulava de egípcia (TERMS, em '
      +'tables.js) não é egípcia: é a ptolomaica, e diverge da egípcia '
      +'verdadeira em onze dos doze signos. O rótulo foi retirado em vez de '
      +'servir limites ptolomaicos sob o nome de outra escola. A opção '
      +'volta assim que uma tábua egípcia conferida for transcrita em '
      +'TERM_SYSTEMS.egyptian.limites.'
  }
};

/* ---------- divergência encontrada, guardada para conferência ----------
   A transcrição da imagem coincide com a tábua antiga (TERMS) em 59 dos
   60 limites. O sexagésimo é Virgem: a imagem dá ♄ de 18° a 24° e ♂ de
   24° a 30°; TERMS tinha ♂ e ♄ trocados nessas duas faixas. Quem
   consultasse Virgem entre 18° e 30° recebia o senhor errado. */
const TERMO_DIVERGENCIA_ANTIGA={
  signo:5, nome:'Virgem',
  antes:[[18,24,'mars'],[24,30,'saturn']],
  imagem:[[18,24,'saturn'],[24,30,'mars']],
  nota:'Único ponto em que a tábua anterior discordava da imagem. Mapas '
    +'com planetas entre 18° e 30° de Virgem passam a mostrar outro senhor '
    +'de termo — o da imagem.'
};

const TERMO_PLANETAS=['mercury','venus','mars','jupiter','saturn'];
const TERMO_PADRAO_PRETENDIDO='ptolemaic';   // o que o projeto quer usar
const TERMO_CHAVE='agx_sistema_termos';

/* ---------- qual sistema está em uso ----------
   O pretendido é o ptolomaico, e está transcrito da imagem: é o que o
   app usa sempre, salvo escolha explícita do utilizador por outro
   sistema transcrito. Se o escolhido não estiver disponível, recua para
   um que esteja — e a interface declara o recuo, nunca o faz calado. */
function termosDisponiveis(){
  return Object.values(TERM_SYSTEMS).filter(s=>s.transcrito&&s.limites);
}
function termosSistemaAtual(){
  let escolhido=null;
  try{ escolhido=localStorage.getItem(TERMO_CHAVE); }catch(e){}
  const alvo=escolhido||TERMO_PADRAO_PRETENDIDO;
  const S=TERM_SYSTEMS[alvo];
  if(S&&S.transcrito&&S.limites)return alvo;
  /* o escolhido não está disponível: recua para o pretendido se este
     estiver transcrito, e senão para o primeiro que esteja. Nunca
     devolve um id sem tábua — quem consome receberia null em silêncio. */
  const P=TERM_SYSTEMS[TERMO_PADRAO_PRETENDIDO];
  if(P&&P.transcrito&&P.limites)return TERMO_PADRAO_PRETENDIDO;
  const q=termosDisponiveis()[0];
  return q?q.id:TERMO_PADRAO_PRETENDIDO;
}
/* Só aceita um sistema que se possa de facto servir. Guardar a escolha
   de uma tábua vazia deixava a preferência a apontar para nada, e o
   utilizador via outro sistema em uso sem entender porquê. */
function termosDefinirSistema(id){
  const S=TERM_SYSTEMS[id];
  if(!S||!S.transcrito||!S.limites)return false;
  try{ localStorage.setItem(TERMO_CHAVE,id); }catch(e){}
  return true;
}
/* o estado do sistema, para a interface dizer sempre qual está em uso */
function termosEstado(){
  const emUso=termosSistemaAtual();
  /* uma escolha guardada de um sistema que deixou de ter tábua — o caso
     de quem tinha “egípcio” selecionado antes de o rótulo ser retirado.
     A interface tem de o dizer, e não trocar o sistema em silêncio. */
  let guardado=null;
  try{ guardado=localStorage.getItem(TERMO_CHAVE); }catch(e){}
  const escolhaIgnorada=(guardado&&guardado!==emUso&&TERM_SYSTEMS[guardado])
    ? {id:guardado, nome:TERM_SYSTEMS[guardado].nome,
       porQue:TERM_SYSTEMS[guardado].porQue||'a tábua deste sistema não está preenchida'}
    : null;
  const pendentes=Object.values(TERM_SYSTEMS)
    .filter(s=>!s.transcrito||!s.limites)
    .map(s=>({id:s.id, nome:s.nome, porQue:s.porQue||null}));
  return {
    emUso, nome:TERM_SYSTEMS[emUso].nome, fonte:TERM_SYSTEMS[emUso].fonte,
    disponiveis:termosDisponiveis().map(s=>({id:s.id,nome:s.nome})),
    /* `pendente` fica no singular por compatibilidade com quem já o lia */
    pendente: pendentes[0]||null,
    pendentes, escolhaIgnorada,
    recuou: emUso!==TERMO_PADRAO_PRETENDIDO,
    aviso: escolhaIgnorada
      ? ('A sua escolha anterior — '+escolhaIgnorada.nome+' — já não pode ser '
        +'servida. '+escolhaIgnorada.porQue+' Em uso: '+TERM_SYSTEMS[emUso].nome+'.')
      : null,
    divergencia:TERMO_DIVERGENCIA_ANTIGA,
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
