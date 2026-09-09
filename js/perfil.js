/* ============================================================
   PERFIL.JS — TEMPERAMENTO, 48 EIXOS, CONSTITUIÇÃO E TIPOLOGIAS
   Tudo derivado do mapa natal, por testemunhos ponderados e auditáveis.
   Nenhum eixo é rótulo absoluto: cada marcador empurra o resultado
   para um polo conforme signo, modalidade, casa, condição e função natal.
   ============================================================ */

/* ---------- utilidades comuns ---------- */


const pct=x=>Math.round(x);
function lordOfGeniture(){
  const ks=Object.keys(PT_NAME).filter(k=>NATAL.pts[k]);
  return ks.sort((a,b)=>(STR[b]||0)-(STR[a]||0))[0]||'sun';
}
function planetsInH1(){
  return Object.keys(PT_NAME).filter(k=>{const p=NATAL.pts[k];return p&&(p.h===1||p.hBack===1);});
}
function onAscCusp(){ // planeta a ≤5° do Ascendente assume a casa 1
  return Object.keys(PT_NAME).filter(k=>{const p=NATAL.pts[k];return p&&adiff(p.lon,NATAL.asc)<=5;});
}
/* condição do planeta como MODULADOR (0.75–1.25) — nunca pontuação extra */
function condMod(k){
  const p=NATAL.pts[k]; if(!p)return 1;
  const d=(p.dig||'').toLowerCase(); let m=1;
  if(/domicílio|exalta/.test(d))m+=.2;
  if(/exílio|queda/.test(d))m-=.2;
  if(/combusto/.test(d))m-=.1;
  if(p.retro)m-=.05;
  if([1,4,7,10].includes(p.h))m+=.08;      // angular reforça
  if([3,6,9,12].includes(p.h))m-=.05;      // cadente atenua
  return Math.max(.75,Math.min(1.25,m));
}
/* conjunção com estrela fixa: lida do campo .star dos pontos e dos ângulos */
function starHit(nome,orbMax){
  const lim=orbMax||2;
  const parse=txt=>{const m=(txt||'').match(new RegExp(nome+"\\s+(\\d+)°(\\d+)′"));
    return m?(+m[1]+ (+m[2])/60):null;};
  for(const k of Object.keys(PT_NAME)){
    const p=NATAL.pts[k]; if(!p||!p.star||p.star==='—')continue;
    const o=parse(p.star); if(o!=null&&o<=lim)return {who:PT_NAME[k],orb:o};
  }
  for(const [ang,line] of (NATAL.angStars||[])){
    const o=parse(line); if(o!=null&&o<=lim)return {who:ang,orb:o};
  }
  return null;
}

/* ============================================================
   1 · TEMPERAMENTO FUNDAMENTAL
   Hierarquia de testemunhos (pesos fixos, sem dupla contagem):
     Ascendente 3 · planeta na cúspide da 1 = 3 (não recontado na casa 1)
     planeta dentro da casa 1 = 2 · regente do Asc (sobretudo seu signo) 3
     Lua 2 · fase lunar 1 · Senhor da Genitura 1
   Normalização em pares opostos: quente×frio = 100 e seco×úmido = 100.
   ============================================================ */
const PQUAL={sun:['quente','seco'],moon:['frio','úmido'],mercury:['frio','seco'],
  venus:['quente','úmido'],mars:['quente','seco'],jupiter:['quente','úmido'],saturn:['frio','seco']};

function temperEngine(){
  if(typeof NATAL==='undefined'||!NATAL)return null;
  const Q={quente:0,frio:0,seco:0,'úmido':0}, fx=[];
  const add=(qs,w,fonte,detalhe)=>{
    if(!qs)return; const ww=Math.round(w*100)/100;
    qs.forEach(q=>Q[q]+=ww);
    fx.push({fonte,detalhe,qs:qs.slice(),w:ww});
  };
  // 1 · Ascendente — peso 3
  const asgn=signOf(NATAL.asc);
  add(ELEMQ[SIGN_ELEM[asgn]],CFG.tw.asc,'Ascendente','em '+SIGNS[asgn]+' ('+SIGN_ELEM[asgn]+')');
  // 2 · planeta na cúspide da 1 — peso 3 (exclui-o da contagem "dentro da casa 1")
  const cusp=onAscCusp();
  cusp.forEach(k=>{const p=NATAL.pts[k];
    add(PQUAL[k],CFG.tw.cusp*condMod(k),'Planeta na cúspide da 1',
      PT_NAME[k]+' a '+fmtOrb(adiff(p.lon,NATAL.asc))+' do Ascendente, em '+SIGNS[signOf(p.lon)]+' · '+p.dig);});
  // 3 · demais planetas dentro da casa 1 — peso 2
  planetsInH1().filter(k=>!cusp.includes(k)).forEach(k=>{const p=NATAL.pts[k];
    add(PQUAL[k],CFG.tw.h1*condMod(k),'Planeta na casa 1',PT_NAME[k]+' em '+SIGNS[signOf(p.lon)]+' · '+p.dig);});
  // 4 · regente do Ascendente — peso 3, sobretudo pelo SIGNO que ocupa
  const ru=NATAL.meta.ascRuler, rp=NATAL.pts[ru];
  if(rp){const rs=signOf(rp.lon);
    add(ELEMQ[SIGN_ELEM[rs]],CFG.tw.ruler*condMod(ru),'Regente do Ascendente',
      PT_NAME[ru]+' em '+SIGNS[rs]+' ('+SIGN_ELEM[rs]+'), casa '+rp.h+' · '+rp.dig);}
  // 5 · Lua — peso 2 (pelo signo que ocupa)
  const mp=NATAL.pts.moon;
  if(mp){const ms=signOf(mp.lon);
    add(ELEMQ[SIGN_ELEM[ms]],CFG.tw.moon*condMod('moon'),'Lua','em '+SIGNS[ms]+' ('+SIGN_ELEM[ms]+'), casa '+mp.h);}
  // 6 · fase lunar — peso 1
  if(mp&&NATAL.pts.sun){
    const el=n360(mp.lon-NATAL.pts.sun.lon);
    const ph=el<90?['quente','úmido']:el<180?['quente','seco']:el<270?['frio','seco']:['frio','úmido'];
    const nm=el<90?'crescente côncava':el<180?'crescente convexa':el<270?'minguante convexa':'minguante côncava';
    add(ph,CFG.tw.phase,'Fase da Lua',nm+' ('+Math.round(el)+'° do Sol)');}
  // 7 · Senhor da Genitura — peso 1
  const lord=lordOfGeniture();
  add(PQUAL[lord],CFG.tw.lord,'Senhor da Genitura',PT_NAME[lord]+' · força '+(STR[lord]||4)+'/8');

  // normalização por pares opostos
  const hc=Q.quente+Q.frio||1, dm=Q.seco+Q['úmido']||1;
  const quente=pct(Q.quente/hc*100), frio=100-quente;
  const seco=pct(Q.seco/dm*100), umido=100-seco;
  const poloH=quente>=frio?'quente':'frio', poloD=seco>=umido?'seco':'úmido';
  const humor=poloH==='quente'?(poloD==='seco'?'colérico':'sanguíneo'):(poloD==='seco'?'melancólico':'fleumático');
  // confiança = CONCORDÂNCIA entre testemunhos (não a intensidade do resultado)
  let acordos=0, total=0;
  fx.forEach(f=>{
    f.qs.forEach(q=>{ if(q==='quente'||q==='frio'){total++;if(q===poloH)acordos++;}
                      else {total++;if(q===poloD)acordos++;} });});
  const conf=pct(total?(acordos/total)*100:0);
  const confLabel=conf>=75?'alta':conf>=60?'moderada':'baixa';
  // testemunhos que divergem do veredito
  const contra=fx.filter(f=>f.qs.some(q=>(q==='quente'||q==='frio')?q!==poloH:q!==poloD));
  return {Q,fx,quente,frio,seco,umido,poloH,poloD,humor,conf,confLabel,contra,lord,
    secundario:secondHumor(quente,seco)};
}
/* humor secundário: o quadrante vizinho mais próximo do centro */
function secondHumor(quente,seco){
  const dH=Math.abs(quente-50), dD=Math.abs(seco-50);
  if(dH<=dD){ // o eixo quente/frio é o mais indeciso: troca ele
    const h=quente>=50?'frio':'quente', d=seco>=50?'seco':'úmido';
    return h==='quente'?(d==='seco'?'colérico':'sanguíneo'):(d==='seco'?'melancólico':'fleumático');
  }
  const h=quente>=50?'quente':'frio', d=seco>=50?'úmido':'seco';
  return h==='quente'?(d==='seco'?'colérico':'sanguíneo'):(d==='seco'?'melancólico':'fleumático');
}
const HUMOR_TXT={
  'colérico':'reage rápido, decide cedo e se cansa do que demora',
  'sanguíneo':'circula bem, se adapta e precisa de troca e movimento',
  'melancólico':'analisa antes, retém e prefere o que dura ao que brilha',
  'fleumático':'absorve, acomoda e cede terreno para preservar o vínculo'};

/* ============================================================
   2 · OS 48 EIXOS — inferências graduais por matrizes de marcadores
   ============================================================ */
/* natureza planetária por família de eixo (−1..+1 rumo ao POLO A) */
const NAT={
  act:{mars:1,sun:.7,jupiter:.5,mercury:.3,venus:-.3,moon:-.4,saturn:-1},
  speed:{mercury:1,moon:.8,mars:.6,venus:.1,sun:0,jupiter:-.2,saturn:-1},
  persist:{saturn:1,sun:.6,jupiter:.3,venus:.1,mars:-.2,mercury:-.7,moon:-1},
  bold:{mars:1,jupiter:.7,sun:.5,mercury:0,venus:-.3,moon:-.5,saturn:-1},
  irrit:{mars:1,saturn:.5,sun:.3,mercury:.1,moon:-.2,jupiter:-.6,venus:-1},
  intens:{mars:1,sun:.6,saturn:.5,moon:.2,mercury:-.2,jupiter:-.5,venus:-.8},
  press:{saturn:1,sun:.7,mars:.4,jupiter:.3,mercury:-.3,venus:-.5,moon:-1},
  emot:{moon:1,venus:.8,jupiter:.3,mars:.1,sun:-.1,mercury:-.6,saturn:-1},
  extro:{jupiter:1,sun:.8,venus:.5,mars:.4,mercury:.2,moon:-.4,saturn:-1},
  domin:{sun:1,mars:.9,saturn:.4,jupiter:.3,mercury:-.2,moon:-.6,venus:-1},
  social:{venus:1,jupiter:.9,mercury:.4,moon:.2,sun:.1,mars:-.4,saturn:-1},
  trust:{jupiter:1,venus:.7,sun:.5,moon:0,mercury:-.3,mars:-.6,saturn:-1},
  bond:{venus:1,moon:.8,saturn:.5,sun:.2,jupiter:-.2,mercury:-.6,mars:-.8},
  express:{mercury:1,venus:.7,jupiter:.6,moon:.4,sun:.2,mars:0,saturn:-1},
  sensi:{moon:1,venus:.7,mercury:.2,jupiter:0,sun:-.3,mars:-.7,saturn:-.9},
  abstr:{saturn:.8,jupiter:.7,mercury:.5,moon:.3,sun:-.2,venus:-.5,mars:-1},
  analys:{mercury:1,saturn:.8,mars:.4,sun:-.1,venus:-.4,moon:-.7,jupiter:-1},
  concen:{saturn:1,sun:.6,mars:.4,venus:0,jupiter:-.5,mercury:-.7,moon:-1},
  order:{saturn:1,mercury:.6,sun:.4,venus:.2,jupiter:-.4,mars:-.7,moon:-.9},
  optim:{jupiter:1,venus:.7,sun:.6,mercury:.1,moon:-.1,mars:-.3,saturn:-1},
  ambit:{sun:1,mars:.8,saturn:.6,jupiter:.4,mercury:0,venus:-.5,moon:-.7},
  ideal:{jupiter:1,moon:.6,venus:.5,sun:.2,mercury:-.3,mars:-.6,saturn:-1},
  giving:{jupiter:1,venus:.8,sun:.4,moon:.3,mercury:-.2,mars:-.4,saturn:-1},
  honor:{sun:1,jupiter:.8,saturn:.4,mars:.3,venus:0,moon:-.3,mercury:-1},
  expand:{jupiter:1,sun:.6,mars:.5,mercury:.2,moon:-.2,venus:-.3,saturn:-1},
  hedon:{venus:1,jupiter:.8,moon:.5,sun:.2,mercury:-.2,mars:-.4,saturn:-1},
  tradi:{saturn:1,sun:.6,jupiter:.4,venus:.2,moon:0,mercury:-.6,mars:-.8},
  auton:{mars:1,sun:.8,saturn:.5,mercury:.2,jupiter:-.2,venus:-.6,moon:-1},
  assert:{mars:1,sun:.7,saturn:.3,mercury:0,jupiter:-.3,moon:-.6,venus:-1},
  selfctl:{saturn:1,mercury:.5,sun:.3,venus:0,jupiter:-.4,moon:-.7,mars:-1},
  compet:{mars:1,sun:.7,saturn:.3,mercury:.1,jupiter:-.3,moon:-.6,venus:-1},
  resist:{saturn:1,sun:.7,mars:.6,jupiter:.3,venus:-.4,mercury:-.5,moon:-1},
  cohes:{sun:1,saturn:.7,mars:.4,venus:.1,jupiter:-.2,moon:-.7,mercury:-1},
  transp:{jupiter:1,sun:.8,mars:.5,venus:.2,moon:-.3,mercury:-.6,saturn:-1}};
/* elemento e modalidade por família (−1..+1 rumo ao POLO A) */
const ELE={
  act:{fogo:1,ar:.5,terra:-.5,'água':-.9}, speed:{ar:1,fogo:.8,'água':-.4,terra:-1},
  persist:{terra:1,'água':.5,fogo:-.5,ar:-.9}, bold:{fogo:1,ar:.4,terra:-.5,'água':-.8},
  irrit:{fogo:1,'água':.2,terra:-.4,ar:-.6}, intens:{fogo:.8,'água':1,terra:-.3,ar:-.9},
  press:{terra:1,fogo:.3,ar:-.4,'água':-.9}, emot:{'água':1,fogo:.3,ar:-.5,terra:-.8},
  extro:{fogo:1,ar:.8,terra:-.5,'água':-.9}, domin:{fogo:1,terra:.3,ar:-.2,'água':-.8},
  social:{ar:1,fogo:.6,'água':-.2,terra:-.6}, trust:{fogo:.8,ar:.5,terra:-.4,'água':-.9},
  bond:{'água':1,terra:.7,fogo:-.5,ar:-.9}, express:{ar:1,fogo:.8,'água':-.2,terra:-.8},
  sensi:{'água':1,ar:.2,fogo:-.5,terra:-.8}, abstr:{ar:1,'água':.6,fogo:-.2,terra:-1},
  analys:{terra:1,ar:.6,fogo:-.5,'água':-.9}, concen:{terra:1,'água':.4,fogo:-.5,ar:-1},
  order:{terra:1,ar:.2,'água':-.4,fogo:-.9}, optim:{fogo:1,ar:.5,terra:-.5,'água':-.7},
  ambit:{fogo:1,terra:.5,ar:-.2,'água':-.7}, ideal:{'água':.8,fogo:.7,ar:.2,terra:-1},
  giving:{fogo:.8,ar:.5,'água':.2,terra:-1}, honor:{fogo:1,'água':.3,ar:-.3,terra:-.8},
  expand:{fogo:1,ar:.6,'água':-.3,terra:-1}, hedon:{'água':.7,ar:.5,fogo:.4,terra:-.9},
  tradi:{terra:1,'água':.5,ar:-.7,fogo:-.5}, auton:{fogo:1,ar:.3,terra:-.3,'água':-1},
  assert:{fogo:1,terra:.2,ar:-.3,'água':-.9}, selfctl:{terra:1,ar:.3,'água':-.4,fogo:-1},
  compet:{fogo:1,terra:.3,ar:-.2,'água':-.9}, resist:{terra:1,fogo:.5,ar:-.5,'água':-.9},
  cohes:{fogo:.7,terra:.8,'água':-.6,ar:-1}, transp:{fogo:1,ar:.4,terra:-.2,'água':-.9}};
const MOD={
  act:{cardinal:1,'mutável':.3,fixo:-.8}, speed:{'mutável':1,cardinal:.5,fixo:-1},
  persist:{fixo:1,cardinal:-.2,'mutável':-1}, bold:{cardinal:1,'mutável':-.2,fixo:-.4},
  irrit:{cardinal:.7,fixo:.2,'mutável':-.6}, intens:{fixo:.8,cardinal:.5,'mutável':-.9},
  press:{fixo:1,cardinal:.2,'mutável':-.9}, emot:{'mutável':.6,cardinal:.2,fixo:-.5},
  extro:{cardinal:.8,'mutável':.5,fixo:-.8}, domin:{cardinal:1,fixo:.3,'mutável':-.9},
  social:{'mutável':.7,cardinal:.4,fixo:-.7}, trust:{'mutável':.4,cardinal:.3,fixo:-.6},
  bond:{fixo:1,cardinal:-.2,'mutável':-1}, express:{'mutável':.8,cardinal:.4,fixo:-.7},
  sensi:{'mutável':.6,cardinal:0,fixo:-.6}, abstr:{'mutável':.8,fixo:.1,cardinal:-.7},
  analys:{'mutável':.6,fixo:.3,cardinal:-.6}, concen:{fixo:1,cardinal:.1,'mutável':-1},
  order:{fixo:.9,cardinal:.2,'mutável':-1}, optim:{cardinal:.5,'mutável':.4,fixo:-.6},
  ambit:{cardinal:1,fixo:.4,'mutável':-.8}, ideal:{'mutável':.7,cardinal:.2,fixo:-.7},
  giving:{'mutável':.5,cardinal:.3,fixo:-.7}, honor:{fixo:.7,cardinal:.5,'mutável':-.8},
  expand:{cardinal:.7,'mutável':.6,fixo:-1}, hedon:{'mutável':.5,fixo:.4,cardinal:-.6},
  tradi:{fixo:1,cardinal:-.2,'mutável':-.9}, auton:{cardinal:1,fixo:.2,'mutável':-.8},
  assert:{cardinal:1,fixo:.3,'mutável':-.9}, selfctl:{fixo:.8,cardinal:.1,'mutável':-1},
  compet:{cardinal:1,fixo:.3,'mutável':-.8}, resist:{fixo:1,cardinal:.2,'mutável':-1},
  cohes:{fixo:1,cardinal:.3,'mutável':-1}, transp:{cardinal:.6,'mutável':.3,fixo:-.7}};

/* fontes de testemunho disponíveis para os eixos */
function axisMarkers(prof,src){
  const out=[];
  const nat=NAT[prof]||NAT.act, ele=ELE[prof]||ELE.act, mod=MOD[prof]||MOD.act;
  const P=NATAL.pts, ru=NATAL.meta.ascRuler;
  const put=(dir,w,txt)=>{ if(dir!=null&&isFinite(dir)&&w>0) out.push({dir:Math.max(-1,Math.min(1,dir)),w,txt}); };
  src.forEach(sname=>{
    if(sname==='asc'){
      const s=signOf(NATAL.asc);
      put((ele[SIGN_ELEM[s]]*.6+mod[SIGN_MODE[s]]*.4),3,
        'Ascendente em '+SIGNS[s]+' ('+SIGN_ELEM[s]+', '+SIGN_MODE[s]+')');
    }
    else if(sname==='ruler'){
      const p=P[ru]; if(!p)return; const s=signOf(p.lon);
      put((nat[ru]*.45+ele[SIGN_ELEM[s]]*.35+mod[SIGN_MODE[s]]*.2)*condMod(ru),3,
        'Regente do Ascendente ('+PT_NAME[ru]+') em '+SIGNS[s]+', casa '+p.h);
    }
    else if(sname==='rulerHouse'){
      const p=P[ru]; if(!p)return;
      const ang=[1,4,7,10].includes(p.h)?1:[2,5,8,11].includes(p.h)?0:-1;
      put(ang*.6,1.2,'Regente do Ascendente em casa '+p.h+' ('+(ang>0?'angular':ang<0?'cadente':'sucedente')+')');
    }
    else if(sname==='lord'){
      const k=lordOfGeniture(), p=P[k]; if(!p)return; const s=signOf(p.lon);
      put((nat[k]*.6+ele[SIGN_ELEM[s]]*.4)*condMod(k),1.5,
        'Senhor da Genitura ('+PT_NAME[k]+') em '+SIGNS[s]);
    }
    else if(sname==='h1'){
      const ks=planetsInH1(); if(!ks.length)return;
      const m=ks.reduce((a,k)=>a+nat[k]*condMod(k),0)/ks.length;
      put(m,2,'Na casa 1: '+ks.map(k=>PT_NAME[k]).join(', '));
    }
    else if(sname==='modes'){
      const tot=(MO.cardinal+MO.fixo+MO['mutável'])||1;
      const v=(MO.cardinal*mod.cardinal+MO.fixo*mod.fixo+MO['mutável']*mod['mutável'])/tot;
      put(v,2,'Proporção de modalidades: '+pct(MO.cardinal/tot*100)+'% cardinal · '
        +pct(MO.fixo/tot*100)+'% fixo · '+pct(MO['mutável']/tot*100)+'% mutável');
    }
    else if(sname==='elems'){
      const tot=(EL.fogo+EL.terra+EL.ar+EL['água'])||1;
      const v=(EL.fogo*ele.fogo+EL.terra*ele.terra+EL.ar*ele.ar+EL['água']*ele['água'])/tot;
      put(v,2,'Proporção de elementos: '+pct(EL.fogo/tot*100)+'% fogo · '+pct(EL.terra/tot*100)+'% terra · '
        +pct(EL.ar/tot*100)+'% ar · '+pct(EL['água']/tot*100)+'% água');
    }
    else if(sname==='cadent'){
      const n=Object.keys(PT_NAME).filter(k=>P[k]&&[3,6,9,12].includes(P[k].h)).length;
      if(n)put(Math.min(1,n/3)*.7,1,n+' planeta(s) em casa cadente: puxa para dentro');
    }
    else if(sname==='h12'){
      const ks=Object.keys(PT_NAME).filter(k=>P[k]&&(P[k].h===12||P[k].hBack===12));
      if(ks.length)put(Math.min(1,ks.length/2)*.8,1.2,'Na casa 12: '+ks.map(k=>PT_NAME[k]).join(', ')+' — interioriza');
    }
    else if(sname==='algol'){
      const h=starHit('Algol',2);
      if(h)put(1,3,'Conjunção estreita com Algol ('+h.who+', '+h.orb.toFixed(1)+'°) — eleva fortemente a intensidade');
    }
    else if(/^h(\d+)ruler$/.test(sname)){
      const hn=+sname.match(/^h(\d+)ruler$/)[1], k=NATAL.rulers[hn], p=P[k]; if(!p)return;
      const s=signOf(p.lon);
      put((nat[k]*.6+ele[SIGN_ELEM[s]]*.4)*condMod(k),1.2,
        'Regente da casa '+hn+' ('+PT_NAME[k]+') em '+SIGNS[s]+', casa '+p.h);
    }
    else if(P[sname]){                                   // planeta nomeado
      const p=P[sname], s=signOf(p.lon);
      put((nat[sname]*.5+ele[SIGN_ELEM[s]]*.3+mod[SIGN_MODE[s]]*.2)*condMod(sname),2,
        PT_NAME[sname]+' em '+SIGNS[s]+', casa '+p.h+(/exílio|queda|combusto/.test(p.dig||'')?' ('+p.dig+')':''));
    }
  });
  return out;
}
/* configuração dos 48 eixos: nome, família, perfil e matriz de fontes */
const AXES48=[
 // ---- físico / vital ----
 ['Atividade–Passividade','físico','act',['asc','ruler','moon','mars','lord','modes']],
 ['Rapidez–Deliberação','físico','speed',['asc','ruler','moon','mercury','lord','modes']],
 ['Iniciativa–Reatividade','físico','act',['asc','ruler','h1','mars','moon','modes']],
 ['Persistência–Variabilidade','físico','persist',['asc','ruler','moon','mars','saturn','lord']],
 ['Audácia–Cautela','físico','bold',['asc','ruler','mars','moon']],
 ['Irritabilidade–Serenidade','físico','irrit',['asc','ruler','mars','venus']],
 ['Intensidade–Moderação','físico','intens',['asc','ruler','venus','jupiter','lord','h1','algol']],
 ['Tolerância à pressão–Saturação','físico','press',['asc','ruler','moon','saturn','sun']],
 ['Resistência–Suscetibilidade','físico','resist',['asc','ruler','saturn','mars','moon']],
 ['Resiliência–Vulnerabilidade','físico','resist',['asc','ruler','sun','moon','jupiter']],
 // ---- afetivo ----
 ['Emotividade–Reserva afetiva','emocional','emot',['asc','ruler','moon','venus']],
 ['Vinculação–Desapego','emocional','bond',['asc','ruler','h7ruler','moon','venus','modes']],
 ['Expressividade afetiva–Reticência','emocional','express',['asc','ruler','rulerHouse','moon','mercury','h1']],
 ['Sensibilidade–Blindagem','emocional','sensi',['asc','ruler','moon','venus','h1']],
 ['Confiança–Vigilância','emocional','trust',['asc','ruler','sun','moon','mars']],
 ['Hedonismo–Ascetismo','emocional','hedon',['asc','ruler','venus','jupiter','saturn']],
 ['Generosidade–Economia','emocional','giving',['asc','ruler','jupiter','venus','h2ruler']],
 ['Idealismo–Pragmatismo','emocional','ideal',['asc','ruler','jupiter','moon','saturn','elems']],
 // ---- cognitivo ----
 ['Abstração–Concretude','mental','abstr',['asc','ruler','elems','mercury','h1','cadent','h12']],
 ['Análise–Síntese','mental','analys',['asc','ruler','mercury','jupiter','saturn','moon','h3ruler','h9ruler']],
 ['Concentração–Dispersão','mental','concen',['asc','ruler','mercury','saturn','jupiter','moon','sun']],
 ['Sequencialidade–Apreensão global','mental','analys',['asc','ruler','mercury','saturn','modes']],
 ['Exame crítico–Receptividade simbólica','mental','analys',['asc','mercury','saturn','moon','h9ruler']],
 ['Retenção–Improvisação','mental','persist',['asc','ruler','saturn','mercury','moon','modes']],
 ['Flexibilidade cognitiva–Dogmatismo','mental','speed',['asc','ruler','mercury','jupiter','saturn','modes']],
 ['Imaginação simbólica–Literalidade','mental','ideal',['asc','ruler','moon','mercury','h12','elems']],
 ['Transparência–Reserva estratégica','mental','transp',['asc','ruler','mercury','jupiter','saturn','h12']],
 // ---- volitivo ----
 ['Ordem–Espontaneidade','comportamental','order',['asc','ruler','saturn','mercury','modes']],
 ['Disciplina–Inconstância','comportamental','order',['asc','ruler','saturn','moon','lord','modes']],
 ['Rigidez–Maleabilidade','comportamental','persist',['asc','ruler','saturn','mars','modes']],
 ['Estabilidade–Mudança','comportamental','persist',['asc','ruler','saturn','moon','elems','modes']],
 ['Planejamento–Ação emergente','comportamental','order',['asc','ruler','saturn','mercury','mars']],
 ['Controle–Entrega','comportamental','selfctl',['asc','ruler','saturn','sun','moon']],
 ['Execução–Procrastinação','físico','act',['asc','ruler','mars','saturn','lord']],
 ['Perfeccionismo–Suficiência','comportamental','order',['asc','ruler','mercury','saturn','h6ruler']],
 ['Autocontrole–Impulsividade','físico','selfctl',['asc','ruler','saturn','mars','moon']],
 ['Ambição–Contentamento','comportamental','ambit',['asc','ruler','sun','mars','h10ruler','saturn']],
 ['Expansão–Conservação','comportamental','expand',['asc','ruler','jupiter','saturn','modes']],
 // ---- social ----
 ['Extroversão–Introversão','comportamental','extro',['asc','ruler','rulerHouse','lord','h1','cadent']],
 ['Dominação–Acomodação','comportamental','domin',['asc','ruler','rulerHouse','sun','mars']],
 ['Sociabilidade–Seletividade','comportamental','social',['asc','ruler','jupiter','h1','lord']],
 ['Assertividade–Conciliação','emocional','assert',['asc','ruler','mars','venus','sun']],
 ['Competição–Cooperação','emocional','compet',['asc','ruler','mars','venus','h7ruler']],
 ['Autonomia–Dependência','emocional','auton',['asc','ruler','sun','mars','h7ruler','moon']],
 ['Coesão identitária–Multiplicidade','mental','cohes',['asc','ruler','sun','mercury','modes']],
 // ---- comportamental ----
 ['Otimismo–Pessimismo','emocional','optim',['asc','ruler','jupiter','saturn','moon']],
 ['Honra–Utilidade','mental','honor',['asc','ruler','sun','jupiter','mercury']],
 ['Tradição–Experimentação','mental','tradi',['asc','ruler','saturn','jupiter','modes']]];

/* avaliação de um eixo → posição, testemunhos, frase, confiança */
function evalAxis(cfg){
  const [name,fam,prof,src]=cfg;
  const [poloA,poloB]=name.split('–');
  const M=axisMarkers(prof,src).filter(m=>Math.abs(m.dir)>.03);
  if(!M.length)return {name,fam,poloA,poloB,pos:50,marks:[],conf:0,confLabel:'insuficiente',
    frase:'Sem testemunhos suficientes para inclinar o eixo.'};
  const wsum=M.reduce((a,m)=>a+m.w,0);
  const raw=M.reduce((a,m)=>a+m.dir*m.w,0)/wsum;         // −1..+1
  const pos=pct(50+raw*50);
  // confiança: concordância direcional + volume de testemunhos
  const sign=raw>=0?1:-1;
  const wAgree=M.filter(m=>Math.sign(m.dir)===sign).reduce((a,m)=>a+m.w,0);
  const acordo=wAgree/wsum;                               // 0..1
  const volume=Math.min(1,wsum/9);
  const conf=pct(((acordo*.75)+(volume*.25))*100);
  const confLabel=conf>=75?'alta':conf>=60?'moderada':'baixa';
  const top=M.slice().sort((a,b)=>Math.abs(b.dir*b.w)-Math.abs(a.dir*a.w)).slice(0,3);
  const alvo=raw>=0?poloA:poloB, grau=Math.abs(pos-50);
  const adv=grau>=25?'nitidamente':grau>=12?'de modo consistente':'levemente';
  const frase='Inclina-se '+adv+' a '+alvo.toLowerCase()+' ('+ (raw>=0?pos:100-pos) +'%): '
    +top.slice(0,2).map(t=>t.txt.replace(/\s*\(.*?\)\s*$/,'')).join(' e ')+'.';
  return {name,fam,poloA,poloB,pos,marks:M,top,conf,confLabel,frase,raw,wsum};
}
function allAxes(){
  if(typeof NATAL==='undefined'||!NATAL)return [];
  return AXES48.map(evalAxis);
}

/* ============================================================
   3 · CONSTITUIÇÃO E SUSCETIBILIDADES TRADICIONAIS
   Não diagnostica, não prevê enfermidade, não substitui médico.
   ============================================================ */
const SIGN_CORPO=['cabeça e face','pescoço e garganta','braços, mãos e pulmões','peito e estômago',
  'coração e coluna','ventre e intestinos','rins e região lombar','órgãos internos e eliminação',
  'quadris e coxas','joelhos, pele e ossos','pernas e circulação','pés e sistema linfático'];
const PL_FUNCAO={sun:'vitalidade, coração e calor vital',moon:'líquidos, estômago e ritmo do sono',
  mercury:'sistema nervoso, fala e respiração',venus:'rins, garganta e equilíbrio hormonal',
  mars:'sangue, inflamações e musculatura',jupiter:'fígado, nutrição e metabolismo',
  saturn:'ossos, pele, dentes e processos crônicos'};
const HUMOR_EXCESSO={
  'colérico':'excesso de calor e secura: tende a consumir reservas depressa, com inflamação e irritação',
  'sanguíneo':'excesso de calor e umidade: tende à plenitude, ao congestionamento e ao excesso',
  'melancólico':'excesso de frio e secura: tende ao ressecamento, à retenção e à lentidão',
  'fleumático':'excesso de frio e umidade: tende ao acúmulo de líquidos, à lentidão e ao torpor'};
const HUMOR_COMP={
  'colérico':'ritmo, refrescamento, hidratação e pausas antes da exaustão',
  'sanguíneo':'moderação, movimento regular e limites na abundância',
  'melancólico':'calor, umidade, rotina leve e convívio que quebre o isolamento',
  'fleumático':'movimento, estímulo, calor e variação que impeça a estagnação'};
function constitution(T){
  if(!NATAL||!T)return null;
  const asgn=signOf(NATAL.asc), ru=NATAL.meta.ascRuler, rp=NATAL.pts[ru];
  const h1=planetsInH1();
  const r6=NATAL.rulers[6], r12=NATAL.rulers[12];
  const p6=NATAL.pts[r6], p12=NATAL.pts[r12], mp=NATAL.pts.moon;
  const sens=[], agrav=[], comp=[], test=[];
  // partes regidas
  sens.push({o:'Ascendente em '+SIGNS[asgn],v:SIGN_CORPO[asgn]});
  if(rp){sens.push({o:'Regente do Ascendente ('+PT_NAME[ru]+')',v:PL_FUNCAO[ru]+' — em '+SIGNS[signOf(rp.lon)]+', ligado a '+SIGN_CORPO[signOf(rp.lon)]});
    test.push('regente do Ascendente em '+SIGNS[signOf(rp.lon)]+', casa '+rp.h);}
  h1.forEach(k=>{sens.push({o:PT_NAME[k]+' na casa 1',v:PL_FUNCAO[k]});test.push(PT_NAME[k]+' na casa 1');});
  if(p6){sens.push({o:'Regente da casa 6 ('+PT_NAME[r6]+')',v:PL_FUNCAO[r6]+' — '+p6.dig+', casa '+p6.h});
    if(/exílio|queda|combusto/.test(p6.dig||'')){agrav.push('regente da casa 6 debilitado ('+p6.dig+'): a rotina cobra mais do corpo');test.push('regente da 6 debilitado');}}
  if(p12){sens.push({o:'Regente da casa 12 ('+PT_NAME[r12]+')',v:PL_FUNCAO[r12]+' — '+p12.dig+', casa '+p12.h});
    if(/exílio|queda|combusto/.test(p12.dig||''))agrav.push('regente da casa 12 debilitado: fatores silenciosos ou fora de controle pedem atenção');}
  // Lua e aflições
  if(mp){
    const afl=['mars','saturn'].filter(k=>HAS['moon_'+k+'_tens']||HAS[k+'_moon_tens']);
    sens.push({o:'Lua em '+SIGNS[signOf(mp.lon)],v:'ritmo, sono e líquidos — '+SIGN_CORPO[signOf(mp.lon)]});
    if(afl.length){agrav.push('Lua sob aspecto tenso de '+afl.map(k=>PT_NAME[k]).join(' e ')+': o ritmo se desregula sob pressão');
      test.push('Lua aflita por '+afl.map(k=>PT_NAME[k]).join(', '));}
    else comp.push('Lua sem aflição dura dos maléficos: o ritmo tende a se restabelecer sozinho');
  }
  // compensações
  ['jupiter','venus'].forEach(k=>{const p=NATAL.pts[k];
    if(p&&(/domicílio|exalta/.test(p.dig||'')||[1,10].includes(p.h)))
      comp.push(PT_NAME[k]+' bem posto ('+p.dig+', casa '+p.h+'): fator tradicional de amparo');});
  comp.push(HUMOR_COMP[T.humor]);
  // sustentação
  const n=test.length;
  const sust=n>=4?'alta':n>=2?'moderada':'baixa';
  return {constituicao:T.humor, qualidades:T.poloH+' e '+T.poloD,
    excesso:HUMOR_EXCESSO[T.humor], sens:sens.slice(0,6), agrav, comp:comp.slice(0,4), test, sust};
}

/* ============================================================
   4 · CORRESPONDÊNCIAS TIPOLÓGICAS

   O que havia aqui — e foi REMOVIDO — era uma conversão direta de
   eixos caracterológicos em quatro letras do MBTI e, a partir das
   MESMAS quatro dimensões, num sotipo sociônico. Aquela rotina:

     · igualava extroversão a sociabilidade e expressividade;
     · igualava intuição a abstração, imaginação e idealismo;
     · igualava sentimento a emotividade, e pensamento à mera
       ausência dela;
     · igualava julgamento a ordem, planejamento e disciplina;
     · escolhia cada letra por um corte em 50;
     · produzia a “alternativa” invertendo a dicotomia menos
       distante do meio;
     · derivava o sociotipo das mesmas dimensões, por tabela;
     · chamava de “compatibilidade” a distância média ao ponto médio.

   Nenhum desses passos se sustenta, e todos foram retirados. A
   inferência tipológica passou a ser feita por comparação de
   estruturas completas, em módulos próprios e independentes:
   tip-ponte.js, tip-inf-mbti.js e tip-inf-soc.js.

   O que permanece aqui é apenas a estimativa do ENEAGRAMA, que
   é um sistema de motivação e não de processos cognitivos, e cuja
   derivação por eixos nunca dependeu daquelas equivalências.
   ============================================================ */
function axisPos(A,nome){const a=A.find(x=>x.name.startsWith(nome));return a?a.pos:50;}
function typology(A){
  if(!A.length)return null;
  const E=(axisPos(A,'Extroversão')+axisPos(A,'Sociabilidade')+axisPos(A,'Expressividade'))/3;
  // Eneagrama: por tríade de centro e orientação
  const assert_=axisPos(A,'Assertividade'), auton=axisPos(A,'Autonomia'),
        ordem=axisPos(A,'Ordem'), perf=axisPos(A,'Perfeccionismo'),
        soc=axisPos(A,'Sociabilidade'), amb=axisPos(A,'Ambição'),
        sensi_=axisPos(A,'Sensibilidade'), vig=100-axisPos(A,'Confiança'),
        hed=axisPos(A,'Hedonismo'), dom=axisPos(A,'Dominação'), conc=100-assert_;
  const enn=[[1,(perf+ordem)/2],[2,(soc+axisPos(A,'Generosidade'))/2],[3,(amb+axisPos(A,'Honra'))/2],
    [4,(sensi_+axisPos(A,'Imaginação'))/2],[5,(axisPos(A,'Concentração')+(100-E))/2],
    [6,(vig+axisPos(A,'Tradição'))/2],[7,(hed+axisPos(A,'Expansão'))/2],
    [8,(dom+auton)/2],[9,(conc+axisPos(A,'Tolerância'))/2]].sort((a,b)=>b[1]-a[1]);
  const sust=A.filter(x=>x.conf>=70).slice(0,4).map(x=>x.name);
  return {enn:enn[0][0], ennAlt:enn[1][0], ennScore:pct(enn[0][1]), sust,
    /* o app não deriva mais MBTI nem sociotipo daqui — ver tip-inf-*.js */
    mbti:null, soc:null,
    nota:'Estimativa restrita ao Eneagrama. MBTI e Sociônica são inferidos '
      +'noutro lugar, por comparação de estruturas, e não por estas dimensões.'};
}
const ENN_NOME={1:'Perfeccionista',2:'Prestativo',3:'Realizador',4:'Individualista',5:'Investigador',
  6:'Leal',7:'Entusiasta',8:'Confrontador',9:'Pacificador'};
