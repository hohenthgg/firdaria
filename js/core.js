/* ============================================================
   CORE.JS — cálculo puro: tempo, efemérides, relevância, janelas
   Sem DOM. Depende apenas de data.js.
   ============================================================ */
const DAY=864e5;
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fdate=d=>d.getUTCDate()+' '+MESES[d.getUTCMonth()]+' '+d.getUTCFullYear();

const ageAt=d=>(d.getTime()-BIRTH)/DAY/365.2425;
const rsYearOf=d=>{ // ano da última Revolução Solar antes de d (pelo aniversário real, não fixo)
  const y=d.getUTCFullYear();
  if(!BIRTH)return y;
  const b=new Date(BIRTH);
  const passed=(d.getUTCMonth()>b.getUTCMonth())||(d.getUTCMonth()===b.getUTCMonth()&&d.getUTCDate()>=b.getUTCDate());
  return passed?y:y-1;
};

/* ---------- firdária / profecção ---------- */
function firdAt(age){
  let a=age; for(const [k,nm,len] of FIRD){ if(a<len){
      const subs=FIRD.slice(0,7).map(f=>f[0]);
      let si=subs.indexOf(k); if(si<0) si=0;
      const part=len/7, idx=Math.min(6,Math.floor(a/part));
      const subKey=subs[(si+idx)%7];
      const subStart=BIRTH+ (age-a+idx*part)*365.2425*DAY;
      return {major:nm, majorKey:k, sub:(FIRD.find(f=>f[0]===subKey)||[,subKey])[1], subKey,
              from:age-a, len, subStart, subEnd:subStart+part*365.2425*DAY};
    } a-=len; }
  return {major:'—',majorKey:null,sub:'—',subKey:null};
}
function profAt(age){
  const base=NATAL?Math.floor(n360(NATAL.asc)/30):0;
  const s=(base+Math.floor(age))%12;
  const houseN=((Math.floor(age))%12)+1;
  return {signIdx:s, sign:SIGNS[s], houseN, lordKey:NATAL.rulers[houseN]};
}
function ruledHouses(k){return Object.entries(NATAL.rulers).filter(([h,r])=>r===k).map(([h])=>+h);}


/* ---------- efemérides ---------- */
let usingAE=false;
function tlon(nm,d){
  if(typeof Astronomy!=='undefined'){try{const v=Astronomy.GeoVector(Astronomy.Body[nm],d,true);usingAE=true;return n360(Astronomy.Ecliptic(v).elon);}catch(e){}}
  usingAE=false;const days=(d.getTime()-Date.UTC(2000,0,1,12))/DAY;const e=MEAN[nm];return n360(e[0]+e[1]*days);
}


/* pontos natais tocáveis: planetas + Asc + MC */
function natalPoints(){
  if(!NATAL)return[];
  const pts=Object.entries(NATAL.pts).filter(([k])=>k!=='spirit').map(([k,p])=>({k,g:p.g,nm:p.nm,lon:p.lon,h:p.h,hBack:p.hBack,limW:p.limW}));
  pts.push({k:'asc',g:'Asc',nm:'Ascendente',lon:NATAL.asc,h:1});
  pts.push({k:'mc',g:'MC',nm:'Meio do Céu',lon:NATAL.mc,h:10});
  return pts;
}
let NPTS=[];
function refreshNPTS(){NPTS=natalPoints();}

function transitHits(d){
  const hits=[]; if(!NATAL)return hits;
  TB.forEach(([bn,key,g])=>{const L=tlon(bn,d), spd=null;
    NPTS.forEach(np=>{
      ASPECTS.forEach(([ang,gl,cls,verb,orb])=>{const o=Math.abs(adiff(L,np.lon)-ang);
        if(o<=orb) hits.push({tKey:key,tg:g,tn:bn,lon:L,nk:np.k,np,gl,ang,cls,verb,orb:o});});
    });});
  hits.sort((a,b)=>a.orb-b.orb); return hits;
}

/* ---------- motor de relevância (auditável) ---------- */
function scoreHit(hit,d){
  const age=ageAt(d), f=firdAt(age), p=profAt(age), y=rsYearOf(d);
  const F=[]; let s=0;
  const add=(pts,label)=>{s+=pts;F.push([pts,label]);};
  if(hit.tKey===f.majorKey) add(3,'transitante é senhor da firdária maior ('+f.major+')');
  if(hit.tKey===f.subKey&&f.subKey!==f.majorKey) add(2,'transitante é senhor da sub-firdária ('+f.sub+')');
  if(hit.tKey===p.lordKey) add(3,'transitante é o Senhor do Ano ('+PT_NAME[p.lordKey]+')');
  if(ruledHouses(hit.tKey).includes(p.houseN)) add(2,'transitante rege a casa profectada ('+p.houseN+'ª)');
  if((RSMETA.angular[y]||[]).includes(hit.tKey)) add(2,'transitante angular na Revolução '+y);
  if(['asc','sun','moon','mc'].includes(hit.nk)) add(2,'toca ponto vital natal ('+hit.np.nm+')');
  if(hit.nk===p.lordKey) add(2,'toca o Senhor do Ano natal');
  if((RSMETA.echo[y]||[]).some(([a,b,ang])=>((hit.tKey===a&&hit.nk===b)||(hit.tKey===b&&hit.nk===a))&&hit.ang===ang)) add(2,'repete aspecto presente na Revolução '+y);
  if(hit.orb<1) add(2,'orbe abaixo de 1° ('+hit.orb.toFixed(1)+'°)');
  else if(hit.orb<3) add(1,'orbe apertado ('+hit.orb.toFixed(1)+'°)');
  const tier=s>=8?'convergência muito alta':s>=5?'relevância alta':s>=3?'relevância moderada':'relevância baixa';
  return {score:s,tier,factors:F};
}
function scoredHits(d,min){
  return transitHits(d).map(h=>Object.assign(h,{rel:scoreHit(h,d)}))
    .sort((a,b)=>b.rel.score-a.rel.score||a.orb-b.orb)
    .filter(h=>h.rel.score>=(min||0));
}


/* ---------- eletiva ---------- */
/* ELECT_SIG (significador natural da atividade + casas) é definido em tables.js. */


/* síntese do ano = cartão executivo (agenda → canal → demanda → síntese) */
function synthYear(age,p,f){
  return execCardHTML(age,true);
}

/* ---------- regra dos 5° na personalidade ----------
   Planeta a menos de 5° da cúspide do Ascendente empurra CONCRETAMENTE
   traços da própria natureza nos eixos cujo polo casa com esses traços.
   (Ex.: Saturno na cúspide → introversão, vigilância, rigidez, disciplina,
   autocontrole, reserva, seletividade, pessimismo prudencial; e reduz
   espontaneidade, flexibilidade, confiança imediata.) */


