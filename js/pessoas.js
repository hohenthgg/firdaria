/* ============================================================
   PESSOAS.JS — significadores das figuras da vida

   O app traduzia 4ª = "casa, família de origem, pai" e 10ª = "carreira",
   sem nunca dizer QUEM. Duas consequências: o pai aparecia colado à 4ª
   como se fosse a mesma coisa que o imóvel, e a mãe não aparecia de
   todo.

   A tradição atribui cada figura por três vias, que NÃO se confundem:

     por CASA      — o regente da casa da figura, e os planetas nela.
                     Lilly, Christian Astrology I.20 (as casas) e III
                     (juízos por casa).
     por NATUREZA  — o significador natural, que muda com a SEITA.
                     Sol de dia / Saturno de noite para o pai; Vênus de
                     dia / Lua de noite para a mãe. É a doutrina dos
                     significadores naturais por seita, em Ptolomeu e
                     retomada por Lilly (CA I.20) e por Morin
                     (Astrologia Gallica XXI).
     por PRESENÇA  — planetas efetivamente colocados na casa da figura.

   O ponto que este módulo existe para tornar explícito:

     UM PLANETA PODE SER DUAS PESSOAS.

   No mapa de teste (Asc Áries, noturno) a Lua rege a 4ª — pai, por casa
   — e é a mãe por natureza, por ser o luminar da noite. Saturno rege a
   10ª — mãe, por casa — e é o pai por natureza. Escolher um dos dois em
   silêncio é inventar. Quando um contato toca a Lua, o texto tem de
   dizer que ali podem estar as duas figuras, e qual pesa mais, COM O
   MOTIVO.

   Nota de método: a atribuição 4ª = pai / 10ª = mãe é a de Lilly e da
   tradição latina medieval. Há linhagem helenística que inverte (4ª
   mãe, 10ª pai) e há autores modernos que usam 4ª para "o progenitor
   menos visível". A divergência está registada em docs/divergencias.md;
   aqui segue-se Lilly, que é a fonte declarada do projeto.
   ============================================================ */

const PESSOA_FIGURAS=['pai','mae','irmaos','filhos','conjuge'];

const PESSOA_ROTULO={
  pai:'o pai', mae:'a mãe', irmaos:'os irmãos',
  filhos:'os filhos', conjuge:'o cônjuge ou parceiro'
};
const PESSOA_ROTULO_CURTO={
  pai:'pai', mae:'mãe', irmaos:'irmão', filhos:'filho', conjuge:'parceiro'
};

/* casa de cada figura, na atribuição de Lilly */
const PESSOA_CASA={pai:4, mae:10, irmaos:3, filhos:5, conjuge:7};

/* significadores naturais. `dia`/`noite` é o primário por seita; o outro
   fica como secundário — nunca desaparece, porque a tradição usa ambos
   e apenas os ordena pela seita. */
const PESSOA_NATUREZA={
  pai:{dia:'sun', noite:'saturn'},
  mae:{dia:'venus', noite:'moon'},
  irmaos:{dia:'mercury', noite:'mercury'},
  filhos:{dia:'jupiter', noite:'jupiter', secundarios:['venus','moon']},
  /* o cônjuge depende do sexo do nativo, que o app NÃO deduz do mapa:
     é dado externo. Sem ele, ambos entram declarados como tal. */
  conjuge:{masculino:['venus'], feminino:['mars','sun'], indefinido:['venus','mars','sun']}
};

/* pesos das vias — a casa e a natureza pesam igual; a presença é a via
   mais fraca das três, porque um planeta pode estar numa casa sem a
   significar. */
const PESSOA_PESO={casa:3, natureza:3, naturezaSecundaria:1.5, presenca:2};

const PESSOA_CHAVE_SEXO='agx_sexo_nativo';
function pessoaSexoNativo(){
  try{ return localStorage.getItem(PESSOA_CHAVE_SEXO)||'indefinido'; }
  catch(e){ return 'indefinido'; }
}
function pessoaDefinirSexo(v){
  if(['masculino','feminino','indefinido'].indexOf(v)<0)return false;
  try{ localStorage.setItem(PESSOA_CHAVE_SEXO,v); }catch(e){}
  return true;
}

/* ------------------------------------------------------------
   Candidatos de UMA figura, cada um com a sua origem declarada.
   ------------------------------------------------------------ */
function significadoresDe(figura){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const casa=PESSOA_CASA[figura];
  const diurno=NATAL.sect==='diurno';
  const cand={};
  /* `primario` marca as duas pretensões FORTES: o regente da casa e o
     significador natural DA SEITA. As outras vias — natureza da seita
     contrária, natureza secundária, presença — são testemunhos, e
     nenhuma soma de testemunhos passa à frente de uma pretensão forte.
     Sem isto, num mapa noturno o Sol liderava "pai" por estar na 4ª
     (2) mais natureza secundária (1,5) = 3,5, à frente de Saturno (3),
     que é o pai por natureza justamente por ser mapa noturno — a regra
     da seita ficava revogada por uma soma. */
  const põe=(pl,via,peso,origem,primario)=>{
    if(!pl||!PT_NAME[pl])return;
    const c=cand[pl]||(cand[pl]={pl, nome:PT_NAME[pl], peso:0, vias:[],
      origens:[], primario:false, naturezaDaSeita:false});
    c.peso+=peso; c.vias.push(via); c.origens.push(origem);
    if(primario)c.primario=true;
    if(primario&&via==='natureza')c.naturezaDaSeita=true;
  };

  /* por casa: o regente */
  const reg=NATAL.rulers?NATAL.rulers[casa]:null;
  if(reg)põe(reg,'casa',PESSOA_PESO.casa,'regente da '+ordinal(casa),true);

  /* por natureza, ordenada pela seita */
  const N=PESSOA_NATUREZA[figura];
  if(figura==='conjuge'){
    const sexo=pessoaSexoNativo();
    const lista=N[sexo]||N.indefinido;
    lista.forEach((pl,i)=>põe(pl,'natureza',
      i===0?PESSOA_PESO.natureza:PESSOA_PESO.naturezaSecundaria,
      'significador natural do cônjuge'
      +(sexo==='indefinido'?' (sexo do nativo não informado: entram os dois)'
        :' em mapa '+sexo), i===0&&sexo!=='indefinido'));
  }else{
    const prim=diurno?N.dia:N.noite, sec=diurno?N.noite:N.dia;
    if(prim)põe(prim,'natureza',PESSOA_PESO.natureza,
      'significador natural em mapa '+(diurno?'diurno':'noturno'),true);
    if(sec&&sec!==prim)põe(sec,'natureza',PESSOA_PESO.naturezaSecundaria,
      'significador natural da seita contrária (secundário)');
    (N.secundarios||[]).forEach(pl=>põe(pl,'natureza',PESSOA_PESO.naturezaSecundaria,
      'significador natural secundário'));
  }

  /* por presença: planetas na casa da figura */
  Object.keys(PT_NAME).forEach(pl=>{
    const p=NATAL.pts[pl]; if(!p||p.h!==casa)return;
    põe(pl,'presenca',PESSOA_PESO.presenca,'está na '+ordinal(casa));
  });

  const lista=Object.values(cand)
    .map(c=>Object.assign(c,{peso:+c.peso.toFixed(2), vias:[...new Set(c.vias)]}))
    /* pretensão forte primeiro; dentro dela, a natureza da seita antes
       do regente da casa; depois o peso; e o nome só para não haver
       ordem instável entre iguais */
    .sort((a,b)=>(b.primario?1:0)-(a.primario?1:0)
      ||(b.naturezaDaSeita?1:0)-(a.naturezaDaSeita?1:0)
      ||b.peso-a.peso||a.pl.localeCompare(b.pl));
  return {figura, rotulo:PESSOA_ROTULO[figura], casa, seita:NATAL.sect,
    candidatos:lista, principal:lista[0]||null};
}

/* todas as figuras de uma vez */
function significadoresDePessoas(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const out={};
  PESSOA_FIGURAS.forEach(f=>{out[f]=significadoresDe(f);});
  return out;
}

/* ------------------------------------------------------------
   O INVERSO: dado um planeta, que figuras ele pode ser.
   É esta a função que impede o texto de escolher em silêncio.
   ------------------------------------------------------------ */
function figurasDoPlaneta(pl){
  const T=significadoresDePessoas(); if(!T)return [];
  const out=[];
  PESSOA_FIGURAS.forEach(f=>{
    const c=(T[f].candidatos||[]).find(x=>x.pl===pl);
    if(c)out.push({figura:f, rotulo:PESSOA_ROTULO[f], curto:PESSOA_ROTULO_CURTO[f],
      peso:c.peso, vias:c.vias, origens:c.origens, casa:T[f].casa,
      primario:!!c.primario, naturezaDaSeita:!!c.naturezaDaSeita});
  });
  return out.sort((a,b)=>(b.primario?1:0)-(a.primario?1:0)||b.peso-a.peso);
}

/* ------------------------------------------------------------
   DESEMPATE, com o motivo à vista.
   `contexto` = {casas:[], pls:[]} — o que mais o contato toca.
   Regras, na ordem do brief:
     (a) se o contato toca também a casa ou o regente da figura X, pesa X;
     (b) se o planeta está na casa da figura, pesa aquela figura;
     (c) se nada desempata, as duas ficam com igual peso — e o texto
         escreve as duas. Nunca se escolhe em silêncio.
   ------------------------------------------------------------ */
function pessoaDoContato(pl, contexto){
  const figs=figurasDoPlaneta(pl);
  if(!figs.length)return null;
  const ctx=contexto||{}; const casas=ctx.casas||[]; const pls=ctx.pls||[];
  const T=significadoresDePessoas();
  const motivos={};
  figs.forEach(f=>{
    let extra=0; const porque=[];
    /* (a) o contato toca a casa da figura, ou o seu regente */
    if(casas.indexOf(f.casa)>=0){ extra+=2;
      porque.push('o contato toca também a '+ordinal(f.casa)+', casa d'
        +(f.figura==='mae'?'a mãe':f.figura==='pai'?'o pai':'e '+PESSOA_ROTULO[f.figura])); }
    const regF=NATAL.rulers?NATAL.rulers[f.casa]:null;
    if(regF&&regF!==pl&&pls.indexOf(regF)>=0){ extra+=2;
      porque.push('o contato envolve '+PT_NAME[regF]+', regente da '+ordinal(f.casa)); }
    /* o significador natural da figura também presente no contato */
    const nat=(T[f.figura].candidatos||[]).filter(c=>c.vias.indexOf('natureza')>=0);
    nat.forEach(c=>{ if(c.pl!==pl&&pls.indexOf(c.pl)>=0){ extra+=1.5;
      porque.push('o contato envolve '+c.nome+', significador natural d'
        +(f.figura==='mae'?'a mãe':f.figura==='pai'?'o pai':'e '+PESSOA_ROTULO[f.figura])); } });
    /* (b) o planeta está na casa da figura */
    if(f.vias.indexOf('presenca')>=0){ extra+=1;
      porque.push(PT_NAME[pl]+' está na '+ordinal(f.casa)); }
    motivos[f.figura]={extra, porque};
  });
  const pontuadas=figs.map(f=>Object.assign({},f,{
    total:+(f.peso+motivos[f.figura].extra).toFixed(2),
    desempate:motivos[f.figura].porque
  })).sort((a,b)=>(b.primario?1:0)-(a.primario?1:0)||b.total-a.total);

  const p=pontuadas[0], s=pontuadas[1]||null;
  /* (c) empate: nada escolhe por nós */
  const empatado=!!(s&&p.total>0&&s.total>=0.9*p.total);
  return {
    pl, nome:PT_NAME[pl], figuras:pontuadas,
    principal:p, segunda:s, empatado,
    /* a frase pronta, no formato que o brief pede */
    frase:(()=>{
      if(!s)return PT_NAME[pl]+' aqui é '+p.rotulo+' ('+p.origens[0]+').';
      const base=PT_NAME[pl]+' aqui pode ser '+p.rotulo+' ('+p.origens[0]+') '
        +'ou '+s.rotulo+' ('+s.origens[0]+')';
      if(empatado)
        return base+'; nada no contato desempata, e as duas leituras ficam de pé.';
      const motivo=p.desempate.length?p.desempate[0]
        :('pesa mais por '+p.origens.join(' e '));
      return base+'; pesa para '+p.rotulo+' porque '+motivo+'.';
    })()
  };
}

/* rótulo curto para o nível simples: "um filho", "o pai — ou a mãe" */
function pessoaTextoCurto(pl, contexto){
  const R=pessoaDoContato(pl, contexto);
  if(!R)return null;
  if(R.empatado&&R.segunda)
    return R.principal.rotulo+' — ou '+R.segunda.rotulo;
  return R.principal.rotulo;
}

/* a figura de uma CASA, para o texto nomear quem está em jogo quando o
   campo do evento é a casa de uma figura */
function pessoaDaCasa(casa){
  const f=PESSOA_FIGURAS.find(x=>PESSOA_CASA[x]===casa);
  if(!f)return null;
  const T=significadoresDe(f);
  return T?{figura:f, rotulo:PESSOA_ROTULO[f], curto:PESSOA_ROTULO_CURTO[f],
    principal:T.principal, candidatos:T.candidatos}:null;
}

/* ------------------------------------------------------------
   TEMA DE UMA CASA, COM A PESSOA NOMEADA
   HOUSE_THEME dá o assunto; esta função acrescenta QUEM, vindo da
   camada, em vez de deixar "pai" colado à 4ª como se a pessoa e o
   imóvel fossem a mesma coisa.
   ------------------------------------------------------------ */
function pessoaTemaDaCasa(casa){
  const base=(typeof HOUSE_THEME!=='undefined'&&HOUSE_THEME[casa])?HOUSE_THEME[casa]:'';
  const P=pessoaDaCasa(casa);
  if(!P||!P.principal)return base;
  const dois=(P.candidatos||[]).filter(c=>c.primario).slice(0,2);
  const quem=dois.length>1
    ? (dois[0].nome+' ou '+dois[1].nome)
    : P.principal.nome;
  return base+' — '+PESSOA_ROTULO[P.figura]+', aqui significad'
    +(P.figura==='mae'?'a':'o')+' por '+quem;
}
/* nomes das figuras que um contato pode envolver, sem escolher em
   silêncio entre elas */
function pessoasEnvolvidas(pls, casas){
  const out=[];
  (pls||[]).forEach(pl=>{
    const R=pessoaDoContato(pl,{pls,casas});
    if(R)out.push(R);
  });
  return out;
}
