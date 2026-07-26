/* ============================================================
   REVS.JS — REVOLUÇÕES (RETORNOS) PLANETÁRIAS GENÉRICAS
   Modelo aberto: qualquer planeta pode ter revolução. Não depende de
   RS_DATA/RSMETA (que permanecem apenas como cache da Revolução Solar
   importada). O tipo selecionado substitui a camada contextual da síntese —
   nunca se combinam silenciosamente todas as revoluções.
   Base doutrinária: Döser (rs-001/rs-002, rl-001) e Abū Ma'shar (pn4-001):
   julgar o planeta "nos dois tempos" — natal (promessa) e revolução (entrega).
   ============================================================ */

const REV_KINDS=[
  {id:'solar',     key:'sun',     label:'Solar',      per:365.2425, sigla:'RS',
   o:'Retorno do Sol ao grau exato do seu nascimento (aniversário).',
   foco:'o ano que se inicia: direção, vitalidade e propósito',
   campo:'direção e propósito do ano'},
  {id:'lunar',     key:'moon',    label:'Lunar',      per:27.3216,  sigla:'RL',
   o:'Retorno da Lua ao grau natal (cerca de 27 dias).',
   foco:'o mês em curso: emoções, casa, rotina e necessidades',
   campo:'clima emocional e doméstico do mês'},
  {id:'mercurial', key:'mercury', label:'Mercurial',  per:365.25,   sigla:'RMe',
   o:'Retorno de Mercúrio ao grau natal.',
   foco:'comunicação, documentos, estudos e deslocamentos',
   campo:'papéis, conversas e trânsito de informação'},
  {id:'venusiana', key:'venus',   label:'Venusiana',  per:365.25,   sigla:'RVe',
   o:'Retorno de Vênus ao grau natal.',
   foco:'relacionamentos, acordos, valores e prazer',
   campo:'vínculos, acordos e dinheiro de afeto'},
  {id:'marcial',   key:'mars',    label:'Marcial',    per:686.98,   sigla:'RMa',
   o:'Retorno de Marte ao grau natal.',
   foco:'ação, disputa, iniciativa e desgaste físico',
   campo:'onde se gasta força e se enfrenta atrito'},
  /* arquitetura preservada para uso futuro — não exibidos no seletor */
  {id:'jupiteriana',key:'jupiter',label:'Jupiteriana',per:4332.6,   sigla:'RJu',
   o:'Retorno de Júpiter ao grau natal (cerca de 12 anos).',
   foco:'expansão, amparo institucional e crescimento',
   campo:'onde o ciclo longo se abre', off:true},
  {id:'saturnina', key:'saturn',  label:'Saturnina',  per:10759.2,  sigla:'RSa',
   o:'Retorno de Saturno ao grau natal (cerca de 29 anos).',
   foco:'estrutura, maturidade, encargos e encerramentos',
   campo:'onde o ciclo longo cobra consolidação', off:true}
];
const REV_BY_ID=Object.fromEntries(REV_KINDS.map(k=>[k.id,k]));
let REV_SEL='solar';
const REV_CACHE={};

function revKinds(){return REV_KINDS.filter(k=>!k.off);}
function revPlace(){
  const p=(typeof STATE!=='undefined'&&STATE.natal&&STATE.natal.place)||null;
  if(p&&isFinite(p.lat)&&isFinite(p.lon))return {lat:p.lat,lon:p.lon};
  return null;   // sem lugar não há ângulos confiáveis
}
const wrap180=x=>{x=((x+180)%360+360)%360-180;return x;};

/* --- localização do retorno: cruzamento direto da longitude natal --- */
function revDiff(key,t,Ln){return wrap180(geoLon(key,new Date(t))-Ln);}
function revBisect(key,Ln,ta,tb){                 // f(ta)<=0<f(tb)
  for(let i=0;i<48;i++){
    const tm=(ta+tb)/2, fm=revDiff(key,tm,Ln);
    if(fm<=0)ta=tm; else tb=tm;
    if(tb-ta<1000)break;                          // 1 segundo basta
  }
  return (ta+tb)/2;
}
/* último retorno em t <= T (null se anterior ao nascimento) */
function revStartBefore(key,Ln,T,per){
  const step=Math.max(0.2,per/60)*DAY, maxBack=Math.ceil(per*1.8*DAY/step);
  let tL=T, fL=revDiff(key,tL,Ln);
  for(let i=1;i<=maxBack;i++){
    const tE=T-i*step; if(tE<BIRTH-per*DAY)break;
    const fE=revDiff(key,tE,Ln);
    if(fE<=0&&fL>0&&Math.abs(fL-fE)<180) return revBisect(key,Ln,tE,tL);
    tL=tE; fL=fE;
  }
  return null;
}
/* primeiro retorno em t > T */
function revStartAfter(key,Ln,T,per){
  const step=Math.max(0.2,per/60)*DAY, maxFwd=Math.ceil(per*1.8*DAY/step);
  let tE=T, fE=revDiff(key,tE,Ln);
  for(let i=1;i<=maxFwd;i++){
    const tL=T+i*step, fL=revDiff(key,tL,Ln);
    if(fE<=0&&fL>0&&Math.abs(fL-fE)<180) return revBisect(key,Ln,tE,tL);
    tE=tL; fE=fL;
  }
  return null;
}

/* --- aspectos de um conjunto de pontos (pares planetários tradicionais) --- */
const REV_PL=['sun','moon','mercury','venus','mars','jupiter','saturn'];
function aspectPairs(ptsLon){
  const out=[];
  for(let i=0;i<REV_PL.length;i++)for(let j=i+1;j<REV_PL.length;j++){
    const a=REV_PL[i],b=REV_PL[j];
    if(ptsLon[a]==null||ptsLon[b]==null)continue;
    const sep=adiff(ptsLon[a],ptsLon[b]);
    for(const [ang,gl,cls,verb,orb] of ASPECTS){
      if(Math.abs(sep-ang)<=orb){out.push({a,b,ang,cls,gl,orb:Math.abs(sep-ang)});break;}
    }
  }
  return out;
}

/* --- construção da revolução vigente de um tipo, numa data --- */
function revolutionFor(kindId,date){
  const K=REV_BY_ID[kindId];
  if(!K||typeof NATAL==='undefined'||!NATAL)return null;
  if(typeof Astronomy==='undefined')return null;
  const pl=revPlace(); if(!pl)return null;
  const nat=NATAL.pts[K.key]; if(!nat)return null;
  const Ln=nat.lon, T=date.getTime();
  const startMs=revStartBefore(K.key,Ln,T,K.per);
  if(startMs==null)return null;
  const ck=kindId+'@'+Math.round(startMs/60000);
  if(REV_CACHE[ck])return REV_CACHE[ck];
  const endMs=revStartAfter(K.key,Ln,startMs+K.per*0.35*DAY,K.per);
  let ch;
  try{ch=computeChart(new Date(startMs),pl.lat,pl.lon);}catch(e){return null;}

  const ascLon=ch.asc, ascSign=signOf(ascLon), ascRuler=SIGN_RULER[ascSign];
  const houseInRev=L=>houseByRule(L,ch.cusps);
  const houseInNatal=L=>houseByRule(L,NATAL.cusps);
  // planetas natais projetados nas casas da revolução (bi-roda natal→revolução)
  const overlay={}; REV_PL.forEach(k=>{if(NATAL.pts[k])overlay[k]=houseInRev(NATAL.pts[k].lon);});
  // aspectos natais repetidos na revolução (rs-002: promessa daquele aspecto se manifesta)
  const natLon={},revLon={};
  REV_PL.forEach(k=>{if(NATAL.pts[k])natLon[k]=NATAL.pts[k].lon; if(ch.pts[k])revLon[k]=ch.pts[k].lon;});
  const natAsp=aspectPairs(natLon), revAsp=aspectPairs(revLon);
  const repeats=natAsp.filter(n=>revAsp.some(r=>r.a===n.a&&r.b===n.b&&r.ang===n.ang));
  // contatos principais: planeta da revolução sobre ponto natal sensível (≤3°)
  const alvos=[{k:'asc',lon:NATAL.asc,nm:'Ascendente'},{k:'mc',lon:NATAL.mc,nm:'Meio do Céu'}]
    .concat(REV_PL.filter(k=>NATAL.pts[k]).map(k=>({k,lon:NATAL.pts[k].lon,nm:PT_NAME[k]})));
  const contatos=[];
  REV_PL.forEach(k=>{ if(!ch.pts[k])return;
    alvos.forEach(al=>{ const sep=adiff(ch.pts[k].lon,al.lon);
      for(const [ang,gl,cls] of ASPECTS){ if(Math.abs(sep-ang)<=3){
        contatos.push({rev:k,alvo:al.k,alvoNm:al.nm,ang,cls,gl,orb:Math.abs(sep-ang)});break;} }
    });});
  contatos.sort((a,b)=>a.orb-b.orb);

  const R={
    kind:kindId, K, label:K.label, sigla:K.sigla, planetKey:K.key,
    start:new Date(startMs), end:endMs?new Date(endMs):null, chart:ch,
    ascLon, ascSign, ascSignNm:SIGNS[ascSign], ascRuler,
    ascNatalHouse:houseInNatal(ascLon),                 // área natal reativada
    ascRulerRevHouse:ch.pts[ascRuler]?houseInRev(ch.pts[ascRuler].lon):null,
    ascRulerNatalHouse:NATAL.pts[ascRuler]?NATAL.pts[ascRuler].h:null,
    planetRevHouse:ch.pts[K.key]?houseInRev(ch.pts[K.key].lon):null,
    planetNatalHouseNow:ch.pts[K.key]?houseInNatal(ch.pts[K.key].lon):null,
    overlay, repeats, contatos:contatos.slice(0,6),
    houseOfRev:houseInRev, houseOfNatal:houseInNatal
  };
  REV_CACHE[ck]=R;
  return R;
}
/* revolução do tipo selecionado, na data */
function revNow(date){return revolutionFor(REV_SEL,date);}
function revSetKind(id){ if(REV_BY_ID[id]){REV_SEL=id;return true;} return false; }

/* --- casa da revolução ocupada por um planeta (ambiente de manifestação) --- */
function revHouseOfPlanet(R,k){
  if(!R||!R.chart.pts[k])return null;
  return R.houseOfRev(R.chart.pts[k].lon);
}
/* --- a revolução reforça este planeta / esta casa? (peso médio/alto) --- */
function revReinforces(R,k,houseN){
  if(!R)return null;
  const out=[];
  if(k){
    if(k===R.ascRuler) out.push(['alto','é regente do Ascendente da '+R.label]);
    if(k===R.planetKey) out.push(['alto','é o planeta que retorna na '+R.label]);
    const h=revHouseOfPlanet(R,k);
    if(h&&[1,4,7,10].includes(h)) out.push(['medio','está angular na '+R.label+' (casa '+h+')']);
    if(R.repeats.some(r=>r.a===k||r.b===k)) out.push(['medio','repete na revolução um aspecto natal seu']);
    if(R.contatos.some(c=>c.rev===k&&(c.alvo==='asc'||c.alvo==='mc'))) out.push(['medio','toca um ângulo natal na '+R.label]);
  }
  if(houseN){
    if(R.ascNatalHouse===houseN) out.push(['alto','o Ascendente da '+R.label+' cai nesta casa natal']);
    if(R.ascRulerNatalHouse===houseN) out.push(['medio','o regente do Ascendente da revolução ocupa esta casa natal']);
  }
  return out;
}
