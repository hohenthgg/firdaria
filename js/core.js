/* ============================================================
   CORE.JS — cálculo puro: tempo, efemérides, relevância, janelas
   Sem DOM. Depende apenas de data.js.
   ============================================================ */
const DAY=864e5;
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fdate=d=>d.getUTCDate()+' '+MESES[d.getUTCMonth()]+' '+d.getUTCFullYear();
const fdatetime=d=>fdate(d)+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')+' UTC';
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
function listRuled(k){const hs=ruledHouses(k);return hs.map(x=>x+'ª ('+HOUSE_SHORT[x]+')').join(' e a ');}
function houseOfLon(L){ // casa natal funcional de uma longitude (mesma regra dos 5° do natal)
  return houseByRule(L,NATAL.cusps);
}

/* ---------- efemérides ---------- */
let usingAE=false;
function tlon(nm,d){
  if(typeof Astronomy!=='undefined'){try{const v=Astronomy.GeoVector(Astronomy.Body[nm],d,true);usingAE=true;return n360(Astronomy.Ecliptic(v).elon);}catch(e){}}
  usingAE=false;const days=(d.getTime()-Date.UTC(2000,0,1,12))/DAY;const e=MEAN[nm];return n360(e[0]+e[1]*days);
}
function speedOf(nm,d){const a=tlon(nm,new Date(d.getTime()-DAY/2)),b=tlon(nm,new Date(d.getTime()+DAY/2));let s=b-a;if(s>180)s-=360;if(s<-180)s+=360;return s;}

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

/* ---------- duração/pico de uma ativação ---------- */
function hitWindow(hit,d){
  const orbMax=ASPECTS.find(a=>a[0]===hit.ang)[4];
  const probe=t=>Math.abs(adiff(tlon(hit.tn,new Date(t)),hit.np.lon)-hit.ang);
  let t0=d.getTime(),t1=d.getTime(),peak=d.getTime(),best=hit.orb;
  const lim=(hit.tKey==='saturn'||hit.tKey==='jupiter')?400:(hit.tKey==='mars'?140:60);
  for(let i=1;i<=lim;i++){const t=d.getTime()-i*DAY,o=probe(t);if(o>orbMax)break;t0=t;if(o<best){best=o;peak=t;}}
  for(let i=1;i<=lim;i++){const t=d.getTime()+i*DAY,o=probe(t);if(o>orbMax)break;t1=t;if(o<best){best=o;peak=t;}}
  return {start:new Date(t0),end:new Date(t1),peak:new Date(peak),minOrb:best};
}

/* ---------- varredura de eventos (30 dias / N dias) ---------- */
function scanEvents(from,days){
  const ev=[]; const bodies=TB.map(t=>t[0]);
  let prev={};
  bodies.forEach(bn=>{prev[bn]={lon:tlon(bn,from),spd:speedOf(bn,from)}});
  let prevSM=adiff(tlon('Sun',from),tlon('Moon',from));
  let prevPhase=n360(tlon('Moon',from)-tlon('Sun',from));
  for(let i=1;i<=days;i++){
    const d=new Date(from.getTime()+i*DAY);
    bodies.forEach(bn=>{
      const L=tlon(bn,d), spd=speedOf(bn,d), key=TB.find(t=>t[0]===bn)[1], g=TB.find(t=>t[0]===bn)[2];
      if(Math.floor(L/30)!==Math.floor(prev[bn].lon/30) && Math.abs(L-prev[bn].lon)<180)
        ev.push({d,type:'ingresso',txt:g+' '+PT_NAME[key]+' entra em '+SIGNS[Math.floor(L/30)],cls:'info'});
      if(bn!=='Sun'&&bn!=='Moon'&&Math.sign(spd)!==Math.sign(prev[bn].spd)&&prev[bn].spd!==0)
        ev.push({d,type:'estação',txt:g+' '+PT_NAME[key]+' estaciona '+(spd<0?'retrógrado':'direto')+' a '+zfmt(L),cls:'warn'});
      // passagem sobre ponto natal (conjunção exata)
      NPTS.forEach(np=>{const o0=adiff(prev[bn].lon,np.lon),o1=adiff(L,np.lon);
        if(o1<0.6&&o1<o0) ev.push({d,type:'passagem',txt:g+' '+PT_NAME[key]+' sobre '+np.nm+' natal ('+zfmt(np.lon)+')',cls:key==='saturn'||key==='mars'?'tens':'harm'});});
      prev[bn]={lon:L,spd};
    });
    const phase=n360(tlon('Moon',d)-tlon('Sun',d));
    if(prevPhase>350&&phase<10) ev.push({d,type:'lunação',txt:'Lua Nova a '+zfmt(tlon('Sun',d)),cls:'info'});
    if(prevPhase<180&&phase>=180) ev.push({d,type:'lunação',txt:'Lua Cheia a '+zfmt(tlon('Moon',d)),cls:'info'});
    prevPhase=phase;
    // aspectos exatos entre transitante e natal (orbe mínima do dia < 0.25)
    if(i<=days){
      transitHits(d).filter(h=>h.orb<0.25).forEach(h=>{
        ev.push({d,type:'exato',txt:h.tg+' '+h.gl+' '+h.np.g+' '+PT_NAME[h.tKey]+' '+h.verb+' '+h.np.nm+' natal (exato)',cls:h.cls});
      });
    }
  }
  // dedupe (mesmo texto em dias contíguos)
  const seen={}; return ev.filter(e=>{const k=e.type+e.txt;if(seen[k]&&Math.abs(seen[k]-e.d)<3*DAY)return false;seen[k]=e.d;return true;})
    .sort((a,b)=>a.d-b.d);
}
function nextRelevantWindow(from){
  for(let i=1;i<=120;i++){
    const d=new Date(from.getTime()+i*DAY);
    const top=scoredHits(d,5).filter(h=>h.orb<1.2);
    if(top.length) return {d,hit:top[0]};
  }
  return null;
}

/* ---------- orientação literal (linguagem direta) ---------- */
/* PL_EFFECT, FAVOR e CAUTION são definidos em tables.js (dados). */
function orient(hit,d){
  const w=hitWindow(hit,d);
  const houses=ruledHouses(hit.nk);
  const housesTxt=houses.length?houses.map(h=>h+'ª ('+HOUSE_SHORT[h]+')').join(' e '):null;
  const tech=PT_NAME[hit.tKey]+' a '+zfmt(hit.lon)+' em '+({conj:'conjunção',harm:hit.ang===60?'sextil':'trígono',tens:hit.ang===90?'quadratura':'oposição'})[hit.cls]+' com '+hit.np.nm+' natal ('+zfmt(hit.np.lon)+', casa '+hit.np.h+'), orbe '+hit.orb.toFixed(1)+'°.';
  let lit=PT_NAME[hit.tKey]+' '+({harm:'facilita',conj:'ativa',tens:'tensiona'})[hit.cls]+' '+PL_EFFECT[hit.tKey].split(',')[0]+' sobre '+hit.np.nm+' natal — '+NATAL.houseTheme[hit.np.h]+'.';
  if(hit.np.hBack) lit+=' Ponto liminar (regra dos 5°): o efeito visível aparece na casa '+hit.np.h+', mas parte do processo corre na casa '+hit.np.hBack+' ('+NATAL.houseTheme[hit.np.hBack]+').';
  if(housesTxt) lit+=' Como '+hit.np.nm+' rege a '+housesTxt+', esses assuntos também são afetados.';
  if(NATAL.loop.includes(hit.nk)) lit+=' O ponto pertence ao anel de recepções ☾→♄→♃→♂: efeito encadeado nas quatro casas do anel.';
  const fav=(FAVOR[hit.cls][hit.tKey]||FAVOR[hit.cls]['sun']||[]).slice();
  const cau=hit.cls==='tens'?(CAUTION.tens[hit.tKey]||[]).slice():CAUTION[hit.cls].slice();
  return {tech,lit,fav,cau,w};
}

/* ---------- índice de convergência do dia ---------- */
function convergence(d){
  const top=scoredHits(d,0).slice(0,6);
  const s=top.reduce((a,h)=>a+h.rel.score,0);
  return {value:s, label:s>=18?'muito alta':s>=11?'alta':s>=6?'moderada':'baixa', top};
}

/* ---------- eletiva ---------- */
/* ELECT_SIG (significador natural da atividade + casas) é definido em tables.js. */
const MOON_DIG={3:'exaltada (Touro)',0:'peregrina',[-99]:''};
function moonCondition(d){
  const L=tlon('Moon',d), s=Math.floor(L/30);
  let dig='peregrina'; if(s===3) dig='domicílio (Câncer)'; if(s===1) dig='exaltação (Touro)';
  if(s===9) dig='exílio (Capricórnio)'; if(s===7) dig='queda (Escorpião)';
  // próximo aspecto aplicativo da Lua (varre 48h)
  let next=null;
  outer: for(let hstep=2;hstep<=60;hstep+=2){
    const dd=new Date(d.getTime()+hstep*3600e3), Lm=tlon('Moon',dd);
    for(const [bn,key,g] of TB){ if(bn==='Moon')continue;
      const Lo=tlon(bn,dd);
      for(const [ang,gl,cls] of ASPECTS){ if(Math.abs(adiff(Lm,Lo)-ang)<0.5){ next={key,g,gl,cls,hours:hstep}; break outer; } } }
  }
  return {lon:L,sign:SIGNS[s],dig,next};
}
function evalElection(d,act){
  const cfg=ELECT_SIG[act]||{sig:'sun',houses:[1]};
  const F=[],P=[]; let score=0;
  const mc=moonCondition(d);
  if(/domicílio|exalta/.test(mc.dig)){score+=2;F.push('Lua dignificada: '+mc.dig);}
  else if(/exílio|queda/.test(mc.dig)){score-=2;P.push('Lua debilitada: '+mc.dig);}
  if(mc.next){ if(mc.next.cls==='harm'||(mc.next.cls==='conj'&&['venus','jupiter'].includes(mc.next.key))){score+=2;F.push('próximo aspecto da Lua aplica a '+PT_NAME[mc.next.key]+' ('+mc.next.gl+') — conclusão favorável');}
    else if(mc.next.cls==='tens'||['mars','saturn'].includes(mc.next.key)){score-=2;P.push('próximo aspecto da Lua aplica a '+PT_NAME[mc.next.key]+' ('+mc.next.gl+') — conclusão sob atrito');} }
  else P.push('Lua sem aplicação próxima detectada (curso vazio provável): assunto tende a não andar');
  const sigBn=TB.find(t=>t[1]===cfg.sig)[0];
  const spd=speedOf(sigBn,d);
  if(spd<0){score-=2;P.push(PT_NAME[cfg.sig]+' (significador) retrógrado');} else {score+=1;F.push(PT_NAME[cfg.sig]+' (significador) direto');}
  const sunL=tlon('Sun',d), sigL=tlon(sigBn,d);
  if(cfg.sig!=='sun'&&adiff(sunL,sigL)<8.5){score-=2;P.push(PT_NAME[cfg.sig]+' combusto ('+adiff(sunL,sigL).toFixed(1)+'° do Sol)');}
  // trânsitos ao natal nas casas da atividade
  scoredHits(d,0).slice(0,10).forEach(h=>{
    const touched=[h.np.h].concat(ruledHouses(h.nk));
    if(cfg.houses.some(x=>touched.includes(x))){
      if(h.cls==='harm'){score+=1;F.push(h.tg+' '+h.gl+' '+h.np.g+' favorece as casas da atividade');}
      if(h.cls==='tens'){score-=1;P.push(h.tg+' '+h.gl+' '+h.np.g+' tensiona as casas da atividade');}
    }
    if(h.tKey===profAt(ageAt(d)).lordKey&&h.cls!=='tens'){score+=1;F.push('Senhor do Ano ativo em harmonia');}
  });
  const f=firdAt(ageAt(d));
  if(cfg.sig===f.majorKey||cfg.sig===f.subKey){score+=1;F.push('significador é senhor de firdária vigente');}
  return {score,F,P,moon:mc};
}
function searchWindows(act,startDate,endDate,h0,h1,stepH){
  const out=[];
  for(let t=startDate.getTime();t<=endDate.getTime();t+=DAY){
    for(let hh=h0;hh<=h1;hh+=stepH){
      const d=new Date(t+hh*3600e3);
      const r=evalElection(d,act);
      out.push({d,score:r.score,F:r.F,P:r.P});
    }
  }
  out.sort((a,b)=>b.score-a.score);
  return out;
}

/* ---------- síntese literal do ano (recuperada do MVP) ---------- */
function synthYear(age,p,f){
  const H=p.houseN,lord=NATAL.pts[p.lordKey];
  const sub=f.subKey&&NATAL.pts[f.subKey]?f.subKey:null;
  const ruledL=ruledHouses(p.lordKey), ruledS=sub?ruledHouses(sub):[];
  let t='<b>Casa '+H+'</b>: '+HOUSE_ACID[H]+'.';
  t+=' Quem manda no ano é <b>'+PT_NAME[p.lordKey]+'</b>, regente de '+(p.sign||SIGNS[p.signIdx])+' — e no seu mapa ele responde por '+(ruledL.map(h=>h+'ª ('+HOUSE_BLUNT[h]+')').join(' e ')||'nada')+'. Esses assuntos entram no ano junto.';
  if(sub&&sub!==p.lordKey)t+=' O sub-período é de <b>'+PT_NAME[sub]+'</b>'+(ruledS.length?(', que responde pela '+ruledS.map(h=>h+'ª').join(' e pela ')):'')+'.';
  // sem véu: senhores do período que respondem por 6ª/8ª/12ª
  const hard=[...new Set(ruledL.concat(ruledS))].filter(h=>[6,8,12].includes(h));
  if(hard.length)t+=' <b>Na lata:</b> '+hard.map(h=>({
    6:'o senhor do período responde pela 6ª — doença e rotina que esmaga têm passagem comprada',
    8:'o senhor do período responde pela 8ª natal — chance real de morte no entorno, perda, luto, ansiedade, crise',
    12:'o senhor do período responde pela 12ª — inimigo oculto, isolamento, hospital, e a sabotagem costuma ser sua'}[h])).join('; ')+'.';
  const mal=[6,8,12].includes(H);
  t+=mal?' Casa maléfica: o ano cobra pedágio — o que se salva vem por método, não por sorte.'
        :((STR[p.lordKey]||3)>=6?' Senhor forte: o ano entrega o que promete.':' Senhor fraco: promete, entrega a metade, e atrasado.');
  return t;
}

/* ---------- motor dos 48 eixos ---------- */
function computeAxis(name,tests,sigKey){
  let pos=0,neg=0,wsum=0;const facts=[];
  tests.forEach(([v,w,lb])=>{const c=v*w; if(c>=0)pos+=c;else neg-=c; wsum+=w; if(Math.abs(v)>0.05)facts.push(lb);});
  const raw=(pos-neg)/Math.max(1,wsum);              // -1..1
  const val=Math.max(1,Math.min(4,2.5+raw*1.5));
  const inten=Math.abs(val-2.5)/1.5;                  // 0..1
  const conf=Math.min(1,wsum/8);
  const tension=Math.min(pos,neg)/Math.max(pos,neg,0.001);
  const sigStrong=STR[sigKey]>=5;
  const quality=(inten>0.25&&(sigStrong||conf>0.7))?'integrada':(tension>0.7?'em disputa':'difusa');
  return {name,val,inten,conf,tension,quality,facts,poleIdx:raw>=0?0:1};
}

/* ---------- avaliador dos testemunhos genéricos (48 eixos) ---------- */
function evalT(t){
  const kind=t[0];
  if(kind==='el'){const e=t[1],w=t[2],dir=t[3];const tot=(EL.fogo+EL.terra+EL.ar+EL['água'])||1;const sh=EL[e]/tot;
    return [dir*Math.max(-1,Math.min(1,(sh-0.25)*4)),w,'elemento '+e+': '+(sh*100|0)+'% do peso'];}
  if(kind==='mo'){const m2=t[1],w=t[2],dir=t[3];const tot=(MO.cardinal+MO.fixo+MO['mutável'])||1;const sh=MO[m2]/tot;
    return [dir*Math.max(-1,Math.min(1,(sh-0.333)*3.6)),w,'modo '+m2+': '+(sh*100|0)+'%'];}
  if(kind==='pl'){const k=t[1],w=t[2],dir=t[3];const s=(STR[k]||4);
    return [dir*((s-4)/4),w,PT_NAME[k]+' força '+s+'/8'+(s<4?' (debilitado: forma invertida)':'')];}
  if(kind==='asp'){const a=t[1],b=t[2],cls=t[3],w=t[4],dir=t[5];const has=HAS[a+'_'+b+'_'+cls];
    return [has?dir:0,w,has?(PT_GLYPH[a]+'–'+PT_GLYPH[b]+' aspecto '+cls):'sem '+PT_GLYPH[a]+'–'+PT_GLYPH[b]];}
  return [0,0,'—'];
}
