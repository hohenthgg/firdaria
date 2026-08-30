/* ============================================================
   DIGNIDADES.JS — o motor único de dignidades, recepções,
   aspectos e orbes.

   Antes destes critérios viverem aqui, o app tinha duas
   implementações paralelas que discordavam entre si:
     · chart.js pontuava só domicílio, exaltação, exílio, queda e
       termo, e não conhecia triplicidade nem face;
     · condicao.js conhecia as cinco dignidades, mas não a luz;
     · os orbes existiam em dois lugares com valores diferentes
       (a tabela ASPECTS e um cálculo embutido em aspectBetween).
   Agora há um só conjunto de critérios, e todo o resto consome
   estas funções.
   ============================================================ */

/* ---------- orbes, num lugar só ----------
   A fonte é a própria tabela ASPECTS (tables.js), cujo quinto
   campo é o orbe de cada aspecto. Nada mais define orbe. */
function orbeDe(ang){
  const a=ASPECTS.find(x=>x[0]===ang);
  return a?a[4]:6;
}
function aspectBetween(La,Lb){
  const sep=adiff(La,Lb);
  let melhor=null;
  for(const [ang,gl,cls] of ASPECTS){
    const d=Math.abs(sep-ang);
    if(d<=orbeDe(ang)&&(!melhor||d<melhor.orb))melhor={ang,gl,cls,orb:d};
  }
  return melhor;
}

/* ---------- os cinco senhores de uma posição ---------- */
const CALD=['mars','sun','venus','mercury','moon','saturn','jupiter'];
function faceLord(L){return CALD[(Math.floor(n360(L)/10)%36)%7];}
/* triplicidades de Dorotheus: [diurno, noturno, participante] */
const TRIPL={fogo:['sun','jupiter','saturn'],terra:['venus','moon','mars'],
  ar:['saturn','mercury','jupiter'],'água':['venus','mars','moon']};
function triplLords(L,diurno){
  const T=TRIPL[SIGN_ELEM[signOf(L)]]||[];
  return diurno?[T[0],T[1],T[2]]:[T[1],T[0],T[2]];
}
function senhoresDe(L,diurno){
  const s=signOf(L);
  return {
    'domicílio':SIGN_RULER[s],
    'exaltação':Object.keys(EXALT).find(k=>EXALT[k]===s)||null,
    'triplicidade':triplLords(L,diurno)[0]||null,
    'termo':(typeof termLord==='function')?termLord(L):null,
    'face':faceLord(L)
  };
}
/* pesos tradicionais das dignidades essenciais (5·4·3·2·1) */
const DIG_PESO={'domicílio':5,'exaltação':4,'triplicidade':3,'termo':2,'face':1,
  'exílio':-4,'queda':-4};
/* as dignidades que o próprio planeta tem na sua posição */
function digProprias(k,L,diurno){
  const S=senhoresDe(L,diurno), out=[];
  DIG_ORDEM.forEach(d=>{if(S[d]===k)out.push(d);});
  const s=signOf(L);
  if(SIGN_RULER[(s+6)%12]===k)out.push('exílio');
  if(FALL[k]===s)out.push('queda');
  return out;
}

/* ---------- a luz: relação com o Sol ----------
   Um só conjunto de limiares para todo o app. */
const LUZ_LIM={cazimi:0.28, combusto:8.5, raios:15};
function luzDe(k,L,sunLon){
  if(k==='sun'||sunLon==null||!isFinite(sunLon))return null;
  const d=adiff(L,sunLon);
  if(d<LUZ_LIM.cazimi)  return {tipo:'cazimi',   d, pts: 2};
  if(d<LUZ_LIM.combusto)return {tipo:'combusto', d, pts:-3};
  if(d<LUZ_LIM.raios)   return {tipo:'sob os raios', d, pts:-1};
  return null;
}

/* ---------- a leitura completa de uma posição ----------
   Devolve as etiquetas legíveis e a soma de pontos essenciais,
   no mesmo formato que o resto do app já esperava. */
function dignityOf(k,L,retro,sunLon,diurno){
  const tags=[], props=digProprias(k,L,!!diurno);
  let pts=0;
  props.forEach(d=>{tags.push(d);pts+=(DIG_PESO[d]||0);});
  const tl=(typeof termLord==='function')?termLord(L):null;
  if(tl&&tl!==k)tags.push('termo de '+(PT_GLYPH[tl]||tl));
  const luz=luzDe(k,L,sunLon);
  if(luz){tags.push(luz.tipo);pts+=luz.pts;}
  if(retro){tags.push('℞');pts-=1;}
  return {tags,pts,term:tl,dignidades:props,luz};
}
