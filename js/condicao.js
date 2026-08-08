/* ============================================================
   CONDICAO.JS — "o que este planeta administra, e quão capaz ele
   está de realizar esse ofício?"

   Duas perguntas separadas, que o app não deve confundir:

     RECEPÇÃO  — relação de acolhimento entre um planeta e o
                 senhor da dignidade onde ele está. É um fato de
                 tabela: nomeia-se sempre a dignidade envolvida
                 (por domicílio, por exaltação, por termo…).

     CONFLITO  — só existe quando algo no mapa reitera a
                 polaridade. Estar em signo de debilidade de outro
                 planeta é polaridade receptiva, não conflito.
   ============================================================ */

/* --- dignidades por grau: quem é senhor do quê --- */
const DIG_ORDEM=['domicílio','exaltação','triplicidade','termo','face'];
/* faces (decanatos), ordem caldaica a partir de Marte em Áries */
const CALD=['mars','sun','venus','mercury','moon','saturn','jupiter'];
function faceLord(L){
  const idx=Math.floor(n360(L)/10)%36;
  return CALD[(idx+0)%7];
}
/* triplicidade por seita (Dorotheus): [dia, noite, participante] */
const TRIPL={fogo:['sun','jupiter','saturn'],terra:['venus','moon','mars'],
  ar:['saturn','mercury','jupiter'],'água':['venus','mars','moon']};
function triplLords(L,diurno){
  const T=TRIPL[SIGN_ELEM[signOf(L)]]||[];
  return diurno?[T[0],T[1],T[2]]:[T[1],T[0],T[2]];
}
/* todos os senhores da posição, do mais forte ao mais fraco */
function senhoresDe(L,diurno){
  const s=signOf(L);
  const tl=(typeof termLord==='function')?termLord(L):null;
  const tri=triplLords(L,diurno);
  return {
    'domicílio':SIGN_RULER[s],
    'exaltação':Object.keys(EXALT).find(k=>EXALT[k]===s)||null,
    'triplicidade':tri[0]||null,
    'termo':tl,
    'face':faceLord(L)
  };
}
/* dignidade essencial do próprio planeta na sua posição */
function digProprias(k,L,diurno){
  const S=senhoresDe(L,diurno), out=[];
  DIG_ORDEM.forEach(d=>{if(S[d]===k)out.push(d);});
  const s=signOf(L);
  if(SIGN_RULER[(s+6)%12]===k)out.push('exílio');
  if(FALL[k]===s)out.push('queda');
  return out;
}

/* ============ RECEPÇÃO ============
   A recepção é sempre NOMEADA pela dignidade que a produz. O app
   nunca diz "recebe" sem dizer por quê. */
function recepcoesEntre(a,b,pts,diurno){
  const pa=pts[a], pb=pts[b]; if(!pa||!pb)return [];
  const out=[];
  const Sa=senhoresDe(pa.lon,diurno), Sb=senhoresDe(pb.lon,diurno);
  DIG_ORDEM.forEach(d=>{
    if(Sa[d]===b)out.push({quem:b,de:a,dig:d,dir:'b→a'});   // b recebe a
    if(Sb[d]===a)out.push({quem:a,de:b,dig:d,dir:'a→b'});   // a recebe b
  });
  return out;
}
/* recepção mútua: cada um está em dignidade do outro */
function recepcaoMutua(a,b,pts,diurno){
  const r=recepcoesEntre(a,b,pts,diurno);
  const ab=r.filter(x=>x.dir==='a→b'), ba=r.filter(x=>x.dir==='b→a');
  if(!ab.length||!ba.length)return null;
  const forte=x=>DIG_ORDEM.indexOf(x.dig);
  const A=ab.sort((x,y)=>forte(x)-forte(y))[0], B=ba.sort((x,y)=>forte(x)-forte(y))[0];
  return {a:A,b:B,peso:(A.dig==='domicílio'||A.dig==='exaltação')&&(B.dig==='domicílio'||B.dig==='exaltação')?'forte':'menor'};
}
const recTexto=r=>'recepção por '+r.dig;

/* ============ CONDIÇÃO ============
   Fatores tradicionais, na ordem em que pesam para a capacidade de
   entregar o ofício. Elemento e modalidade ficam de fora daqui —
   são camada secundária, de estilo, não de capacidade. */
const ANG={1:'angular',10:'angular',7:'angular',4:'angular',
  11:'sucedente',2:'sucedente',5:'sucedente',8:'sucedente',
  9:'cadente',12:'cadente',3:'cadente',6:'cadente'};
const SETA_DIA=['sun','jupiter','saturn'], SETA_NOITE=['moon','venus','mars'];

function condicaoDe(k,ctx){
  /* ctx: {pts, diurno, sunLon, cusps} — serve ao natal e a mapas leves */
  const p=ctx.pts[k]; if(!p)return null;
  const L=p.lon, diurno=!!ctx.diurno, F=[];
  const add=(f,v,t)=>F.push({f,v,t});          // v: +2..-2

  /* 1 · dignidade essencial */
  const digs=digProprias(k,L,diurno);
  if(digs.includes('domicílio'))      add('dignidade',2,'em domicílio: dispõe de si, não depende de terceiro para entregar');
  else if(digs.includes('exaltação')) add('dignidade',2,'em exaltação: é honrado acima do próprio peso — promete mais do que sustenta sozinho');
  else if(digs.includes('exílio'))    add('dignidade',-2,'em exílio: opera por meios que não são os seus');
  else if(digs.includes('queda'))     add('dignidade',-2,'em queda: o assunto tende a ser tratado tarde ou de menos');
  else if(digs.includes('triplicidade'))add('dignidade',1,'em triplicidade própria: apoio de fundo, sem posse do signo');
  else if(digs.includes('termo'))     add('dignidade',1,'em termo próprio: apoio no grau');
  else if(digs.includes('face'))      add('dignidade',0,'apenas em face própria: apoio mínimo');
  else                                add('dignidade',0,'peregrino: sem dignidade na posição — depende de quem o dispõe');

  /* 2 · seita: o planeta está no time da carta? */
  const naSeita=(diurno?SETA_DIA:SETA_NOITE).includes(k)
    ||(k==='mercury'&&((diurno&&n360(L-ctx.sunLon)>180)||(!diurno&&n360(L-ctx.sunLon)<180)));
  if(k!=='mercury')add('seita',naSeita?1:-1,naSeita
    ?'em seita: joga a favor da natureza da carta'
    :'fora de seita: age contra o tom da carta e custa mais caro');
  else add('seita',naSeita?1:0,naSeita?'oriental/ocidental conforme a seita':'sem vantagem de seita');

  /* 3 · angularidade: tem palco para agir? */
  const ang=ANG[p.h]||'cadente';
  add('angularidade',ang==='angular'?2:ang==='sucedente'?1:-1,
    ang==='angular'?'em casa angular: age à vista e com efeito imediato'
    :ang==='sucedente'?'em casa sucedente: age com atraso, mas mantém o que conquista'
    :'em casa cadente: age de lado, por vias indiretas');

  /* 4 · relação com o Sol: cazimi, combustão, sob os raios */
  if(k!=='sun'&&ctx.sunLon!=null){
    const d=adiff(L,ctx.sunLon);
    if(d<0.28)      add('luz',2,'cazimi: no coração do Sol — assunto conduzido pelo centro da vida');
    else if(d<8.5)  add('luz',-2,'combusto: o assunto fica encoberto pela vontade central');
    else if(d<15)   add('luz',-1,'sob os raios: opera com pouca visibilidade');
    else            add('luz',0,'livre dos raios do Sol');
  }
  /* 5 · movimento */
  if(p.retro) add('movimento',-1,'retrógrado: revisa, atrasa e reabre o que parecia resolvido');
  else        add('movimento',0,'direto');
  if(p.spd!=null){
    const md=({moon:13.2,mercury:1.38,venus:1.2,sun:0.99,mars:0.52,jupiter:0.083,saturn:0.034})[k];
    if(md){const r=Math.abs(p.spd)/md;
      if(r>1.25)      add('velocidade',1,'veloz: entrega rápido, com menos acabamento');
      else if(r<0.4)  add('velocidade',-1,'lento ou estacionário: o assunto se arrasta');
    }
  }
  /* 6 · dispositor: de quem depende para entregar */
  const disp=SIGN_RULER[signOf(L)];
  let dispTxt=null;
  if(disp!==k&&ctx.pts[disp]){
    const rec=recepcoesEntre(k,disp,ctx.pts,diurno).filter(x=>x.quem===disp);
    dispTxt={k:disp,casa:ctx.pts[disp].h,
      recebido:rec.length>0,
      dig:rec.length?rec.sort((a,b)=>DIG_ORDEM.indexOf(a.dig)-DIG_ORDEM.indexOf(b.dig))[0].dig:null};
    add('dispositor',rec.length?1:0,
      'depende de '+PT_NAME[disp]+(rec.length?(', que o acolhe ('+recTexto(rec[0])+')')
        :', que não o acolhe por nenhuma dignidade'));
  }
  const soma=F.reduce((s,x)=>s+x.v,0);
  const nivel=soma>=4?'capaz':soma>=1?'condicional':soma>=-2?'limitado':'impedido';
  const nivelTxt={
    capaz:'tem meios para realizar o que administra',
    condicional:'realiza o que administra, mas com apoios e prazos',
    limitado:'realiza com custo: falta-lhe apoio essencial ou palco',
    impedido:'encontra obstáculo estrutural para realizar o que administra'}[nivel];
  return {k,fatores:F,soma,nivel,nivelTxt,digs,angular:ang,naSeita,dispositor:dispTxt,
    /* camada secundária, de estilo */
    estilo:{elem:SIGN_ELEM[signOf(L)],modo:SIGN_MODE[signOf(L)]}};
}

/* ============ POLARIDADE × CONFLITO ============
   Estar em signo de debilidade de outro planeta é POLARIDADE
   RECEPTIVA. Só vira conflito estrutural se o mapa reiterar:
   aspecto duro entre os dois, ou dependência de dispositor não
   acolhida, ou o outro em má condição administrando matéria que
   depende deste. */
function polaridades(k,ctx){
  const p=ctx.pts[k]; if(!p)return [];
  const s=signOf(p.lon), out=[];
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k||!ctx.pts[o])return;
    let tipo=null;
    if(SIGN_RULER[(s+6)%12]===o)tipo='exílio';
    else if(FALL[o]===s)tipo='queda';
    if(!tipo)return;
    const asp=aspectBetween(p.lon,ctx.pts[o].lon);
    const duro=asp&&(asp.cls==='tens'||asp.ang===0);
    const rege=(typeof ruledHouses==='function')?ruledHouses(o):[];
    const dispDep=SIGN_RULER[s]===o;              // ele é o dispositor?
    const provas=[];
    if(duro)provas.push(PT_NAME[o]+' faz '+({0:'conjunção',90:'quadratura',180:'oposição'}[asp.ang]||asp.gl)
      +' a '+PT_NAME[k]+' ('+fmtOrb(asp.orb)+')');
    if(dispDep)provas.push(PT_NAME[o]+' é o dispositor de '+PT_NAME[k]);
    out.push({com:o,tipo,rege,provas,
      confirmado:provas.length>0,
      /* a formulação muda conforme haja ou não confirmação */
      txt:provas.length
        ? 'Conflito estrutural: '+PT_NAME[k]+' opera em '+SIGNS[s]+', signo de '+tipo+' de '+PT_NAME[o]
          +(rege.length?(', que administra '+rege.map(h=>h+'ª').join(' e a ')):'')
          +' — e o mapa reitera ('+provas.join('; ')+').'
        : 'Polaridade receptiva: '+PT_NAME[k]+' opera em signo de debilidade de '+PT_NAME[o]
          +(rege.length?(' (que administra '+rege.map(h=>h+'ª').join(' e a ')+')'):'')
          +'. Nada no mapa reitera isso — é tendência de estilo, não conflito.'});
  });
  return out.sort((a,b)=>(b.confirmado-a.confirmado)||(b.rege.length-a.rege.length));
}
/* contexto do mapa natal, pronto para as funções acima */
function ctxNatal(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  return {pts:NATAL.pts,diurno:NATAL.sect==='diurno',
    sunLon:NATAL.pts.sun?NATAL.pts.sun.lon:null,cusps:NATAL.cusps};
}
