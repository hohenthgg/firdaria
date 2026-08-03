/* ============================================================
   PREDITIVAS.JS — três camadas estritamente separadas:

   1. CÁLCULO ASTRONÔMICO   — geometria esférica pura. Não conhece
      promessas, relevância nem texto.
   2. CLASSIFICAÇÃO         — normaliza eixos, casa com promessas
      natais, mede confirmações e atribui relevância.
   3. INTERPRETAÇÃO         — só lê o que as camadas 1 e 2 produziram.

   Nenhuma interpretação altera um número. Nenhum contato calculado
   é apresentado como acontecimento por si só.
   ============================================================ */
const PRAD=Math.PI/180, PDEG=180/Math.PI;
const norm180=x=>{let d=n360(x); return d>180?d-360:d;};
/* ortografia: concordância de gênero dos nomes planetários */
const PV_FEM={moon:1,venus:1};                   // concordância nos textos
const pvArtigo=k=>PV_FEM[k]?'à ':'ao ';
const pvGen=(k,txt)=>PV_FEM[k]
  ? txt.replace(/\bdignificado\b/g,'dignificada').replace(/\bdebilitado\b/g,'debilitada')
       .replace(/\brecebido\b/g,'recebida').replace(/\bcombusto\b/g,'combusta')
  : txt;
const pvPart=k=>PV_FEM[k]?'dirigida':'dirigido';

/* ============================================================
   CAMADA 1 — CÁLCULO ASTRONÔMICO
   ============================================================ */

/* métodos de direção primária — fórmulas separadas, sem mistura */
const PV_MET={
  pup:{lab:'Placidus sob o polo do significador (PUP)',
       curto:'Placidus · polo do significador',
       nota:'o significador recebe um polo próprio (tan polo = tan φ · MD/SA); ambos os pontos são reduzidos à ascensão oblíqua sob esse polo e o arco é a diferença entre elas'},
  psa:{lab:'Placidus proporcional por semi-arcos (PSA)',
       curto:'Placidus · proporcional em mundo',
       nota:'o promissor é levado pelo movimento primário até ocupar a mesma posição proporcional que o significador ocupa no seu próprio semi-arco'}};
const PV_KEYS={naibod:{lab:'Naibod',v:0.9856473,nota:"0°59'08\" de ascensão reta por ano"},
               ptolomeu:{lab:'Ptolomeu',v:1,nota:'1° de ascensão reta por ano'}};
const PV_PL=['sun','moon','mercury','venus','mars','jupiter','saturn'];
const PV_ASP=[[0,'☌','conjunção','conj'],[60,'⚹','sextil','harm'],[90,'□','quadratura','tens'],
              [120,'△','trígono','harm'],[180,'☍','oposição','tens']];
/* Asc e MC são os ângulos principais; Dsc e IC são as extremidades opostas
   dos mesmos eixos e por isso não entram como significadores próprios. */
const PV_ANG={asc:{nm:'Ascendente',ab:'Asc',casa:1,op:'Descendente',opCasa:7},
              mc :{nm:'Meio do Céu',ab:'MC', casa:10,op:'Fundo do Céu',opCasa:4}};

function eqFrom(lon,lat,eps){                    // eclíptica → equatorial
  const l=lon*PRAD, b=(lat||0)*PRAD, e=eps*PRAD;
  const ra=Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l))*PDEG;
  const dec=Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l))*PDEG;
  return {ra:n360(ra),dec};
}
function adOf(dec,polo){                         // diferença ascensional sob um polo
  const x=Math.tan(dec*PRAD)*Math.tan(polo*PRAD);
  if(!isFinite(x)||Math.abs(x)>=1)return null;   // circumpolar sob esse polo
  return Math.asin(x)*PDEG;
}
function geoLatEcl(k,date){                      // latitude eclíptica do planeta
  if(k==='sun')return 0;
  try{const v=Astronomy.GeoVector(Astronomy.Body[AE_BODY[k]],date,true);
      return Astronomy.Ecliptic(v).elat;}catch(e){return 0;}
}
/* bisseção genérica: devolve a raiz de f entre a e b */
function pvRaiz(f,a,b,it){
  let fa=f(a), fb=f(b); if(fa===0)return a; if(fb===0)return b;
  if(fa*fb>0)return null;
  for(let i=0;i<(it||48);i++){
    const m=(a+b)/2, fm=f(m);
    if(fm===0)return m;
    if(fa*fm<0){b=m;fb=fm;} else {a=m;fa=fm;}
  }
  return (a+b)/2;
}
/* latitude só é inferida como recurso auxiliar, e o fato fica registrado */
function pvSolveLat(ramc,eps,asc){
  const f=p=>norm180(ascFromRAMC(ramc,eps,p)-asc);
  const r=pvRaiz(f,-66,66,60);
  return r===null?0:r;
}
let PV_FRAME=null;
function pvFrame(){
  const fp=pvFingerprint();
  if(PV_FRAME&&PV_FRAME.fp===fp)return PV_FRAME;
  const bd=new Date(BIRTH), eps=obliquity(bd);
  const ramc=n360(Math.atan2(Math.sin(NATAL.mc*PRAD)*Math.cos(eps*PRAD),Math.cos(NATAL.mc*PRAD))*PDEG);
  let phi=null, lon=null, inferida=false;
  try{const pl=STATE&&STATE.natal&&STATE.natal.place;
      if(pl&&isFinite(pl.lat)){phi=pl.lat; lon=isFinite(pl.lon)?pl.lon:null;}}catch(e){}
  if(phi===null){phi=pvSolveLat(ramc,eps,NATAL.asc); inferida=true;}
  PV_FRAME={fp,bd,eps,ramc,phi,lonGeo:lon,inferida};
  return PV_FRAME;
}
/* impressão digital de tudo que, mudando, obriga a recalcular */
function pvFingerprint(){
  if(typeof NATAL==='undefined'||!NATAL)return 'vazio';
  let pl=''; try{const p=STATE&&STATE.natal&&STATE.natal.place;
    if(p)pl=(p.lat||'')+','+(p.lon||'');}catch(e){}
  return [BIRTH,
    NATAL.asc.toFixed(6), NATAL.mc.toFixed(6),
    NATAL.cusps.map(c=>c==null?'x':c.toFixed(4)).join('|'),
    PV_PL.map(k=>NATAL.pts[k]?NATAL.pts[k].lon.toFixed(6):'x').join('|'),
    pl, PV_METODO, PV_KEY, PV_SENT].join('§');
}

/* ---- posição de um ponto no círculo diurno ----
   μ ∈ (−2,2]: 0 no MC, ±1 no horizonte (+ leste), ±2 no IC.
   Serve ao método PSA; o PUP não usa μ.                        */
function pvMu(ra,dec,F){
  const ad=adOf(dec,F.phi); if(ad===null)return null;
  const dsa=90+ad, nsa=90-ad;
  const hd=norm180(ra-F.ramc);                   // leste positivo
  if(Math.abs(hd)<=dsa)return {mu:hd/dsa, dsa, nsa, hd, acima:true};
  const s=hd>=0?1:-1, mdIC=180-Math.abs(hd);
  return {mu:s*(2-mdIC/nsa), dsa, nsa, hd, acima:false};
}
/* ---- PUP: polo do significador e ascensão oblíqua sob ele ---- */
function pvPoloPUP(ra,dec,F){
  const M=pvMu(ra,dec,F); if(!M)return null;
  const sa=M.acima?M.dsa:M.nsa;
  const md=M.acima?Math.abs(M.hd):(180-Math.abs(M.hd));
  if(!(sa>0))return null;
  const f=Math.max(0,Math.min(1,md/sa));
  return {polo:Math.atan(Math.tan(F.phi*PRAD)*f)*PDEG, md, sa, f, leste:M.hd>0, acima:M.acima};
}
function oaSob(ra,dec,polo,leste){
  const ad=adOf(dec,polo); if(ad===null)return null;
  return n360(leste? ra-ad : ra+ad);
}
/* ---- arcos: DIRETA e CONVERSA são séries independentes ----
   Direta  : o promissor é levado pelo movimento primário ao lugar do significador.
   Conversa: o significador é levado, no sentido contrário, ao lugar do promissor. */
function pvArcosPUP(sig,prom,F){
  let polo,leste,oaS;
  if(sig.ang){
    polo = sig.ang==='mc' ? 0 : F.phi;
    leste = true;
    oaS  = sig.ang==='mc' ? F.ramc : n360(F.ramc+90);
  } else {
    const P=pvPoloPUP(sig.ra,sig.dec,F); if(!P)return null;
    polo=P.polo; leste=P.leste; oaS=oaSob(sig.ra,sig.dec,polo,leste);
  }
  const oaP=oaSob(prom.ra,prom.dec,polo,leste);
  if(oaS===null||oaP===null)return null;
  return {direta:n360(oaP-oaS), conversa:n360(oaS-oaP), polo, oaS, oaP};
}
function pvArcosPSA(sig,prom,F){
  // posição proporcional que o significador ocupa no seu próprio semi-arco
  const muS = sig.ang ? (sig.ang==='mc'?0:1) : (()=>{const M=pvMu(sig.ra,sig.dec,F);return M?M.mu:null;})();
  const Mp = pvMu(prom.ra,prom.dec,F);
  if(muS===null||!Mp)return null;
  // μ de um ponto quando o RAMC gira θ (θ>0 = movimento primário adiante)
  const muDe=(ra,dec,theta)=>{const M=pvMu(ra,dec,{ramc:n360(F.ramc+theta),phi:F.phi});return M?M.mu:null;};
  // procura o primeiro θ∈(0,360] em que μ(θ) cruza o alvo, e refina por bisseção
  const busca=(ra,dec,alvo,sinal)=>{
    let ant=muDe(ra,dec,0), passo=1;
    for(let t=passo;t<=360;t+=passo){
      const cur=muDe(ra,dec,sinal*t);
      if(cur===null||ant===null){ant=cur;continue;}
      if(Math.abs(cur-ant)<1.5){                       // sem salto na descontinuidade ±2
        const g0=ant-alvo, g1=cur-alvo;
        if(g0===0)return t-passo;
        if(g0*g1<0){
          const r=pvRaiz(x=>{const m=muDe(ra,dec,sinal*x);return m===null?g0:m-alvo;},t-passo,t,44);
          if(r!==null&&r>1e-4)return r;
        }
      }
      ant=cur;
    }
    return null;
  };
  return {
    // direta: o promissor avança com o movimento primário até a posição do significador
    direta: busca(prom.ra,prom.dec,muS,+1),
    // conversa: o significador recua contra o movimento primário até a posição do promissor
    conversa: sig.ang ? busca(sig.ra2,sig.dec2,Mp.mu,-1) : busca(sig.ra,sig.dec,Mp.mu,-1),
    polo:null, oaS:null, oaP:null, muS, muP:Mp.mu};
}

/* ---- significadores e promissores ---- */
function pvSignificadores(F){
  const out=[];
  Object.keys(PV_ANG).forEach(a=>{
    const lon=a==='asc'?NATAL.asc:NATAL.mc;
    const e=eqFrom(lon,0,F.eps);
    out.push({key:a, ang:a, nm:PV_ANG[a].nm, ab:PV_ANG[a].ab, lon, lat:0,
      ra:e.ra, dec:e.dec, ra2:e.ra, dec2:e.dec, casa:PV_ANG[a].casa});
  });
  PV_PL.forEach(k=>{const p=NATAL.pts[k]; if(!p)return;
    const lat=geoLatEcl(k,F.bd), e=eqFrom(p.lon,lat,F.eps);
    out.push({key:k, pl:k, nm:PT_NAME[k], ab:(PT_GLYPH[k]||'')+'︎',
      lon:p.lon, lat, ra:e.ra, dec:e.dec, casa:p.h});
  });
  return out;
}
/* Os pontos promissores de cada planeta cobrem os dois lados de cada aspecto.
   Como o conjunto é fechado sob +180°, dirigir só a Asc e MC já cobre, sem
   repetir, todo contato com Dsc e IC. */
function pvPromissores(F){
  const out=[];
  PV_PL.forEach(k=>{const p=NATAL.pts[k]; if(!p)return;
    const lat=geoLatEcl(k,F.bd);
    PV_ASP.forEach(([A,gl,nome,cls])=>{
      const alvos = A===0 ? [[p.lon,lat,0]] : A===180 ? [[n360(p.lon+180),0,180]]
                  : [[n360(p.lon+A),0,A],[n360(p.lon-A),0,-A]];
      alvos.forEach(([L,B,sinal])=>{const e=eqFrom(L,B,F.eps);
        out.push({pl:k, nm:PT_NAME[k], A, sinal, gl, aspNome:nome, cls,
          lon:L, lat:B, ra:e.ra, dec:e.dec});});
    });
  });
  return out;
}
/* seleção do método — nenhuma fórmula é compartilhada entre eles */
function pvArcos(sig,prom,F){
  return PV_METODO==='psa' ? pvArcosPSA(sig,prom,F) : pvArcosPUP(sig,prom,F);
}
let PV_DIR_CACHE=null;
function direcoesPrimarias(){
  const fp=pvFingerprint();
  if(PV_DIR_CACHE&&PV_DIR_CACHE.fp===fp)return PV_DIR_CACHE.lista;
  const F=pvFrame(), chave=PV_KEYS[PV_KEY];
  const sigs=pvSignificadores(F), proms=pvPromissores(F), out=[];
  const querSent=s=>PV_SENT==='ambas'||PV_SENT===s;
  sigs.forEach(sig=>{
    proms.forEach(prom=>{
      if(sig.pl&&sig.pl===prom.pl)return;
      const R=pvArcos(sig,prom,F); if(!R)return;
      [['direta',R.direta],['conversa',R.conversa]].forEach(([sent,arc])=>{
        if(arc===null||!isFinite(arc))return;
        if(!querSent(sent))return;
        const anos=arc/chave.v;
        if(anos<0.15||anos>95)return;
        // extremidade do eixo em que o contato realmente cai
        let eixo=null;
        if(sig.ang){
          const dif=Math.abs(norm180(prom.lon-sig.lon));
          eixo = dif>90 ? PV_ANG[sig.ang].op : PV_ANG[sig.ang].nm;
        }
        out.push({tipo:'dir', sig, prom, arc, sentido:sent, metodo:PV_METODO, chave:PV_KEY,
          polo:R.polo, oaS:R.oaS, oaP:R.oaP, eixo, anos,
          data:new Date(BIRTH+anos*365.2425*DAY)});
      });
    });
  });
  out.sort((a,b)=>a.anos-b.anos);
  PV_DIR_CACHE={fp,lista:out};
  return out;
}

/* ---------------- progressões secundárias ---------------- */
/* casa GEOMÉTRICA: só o setor entre cúspides. É ela que define ingressos. */
function casaGeom(L,cusps){
  for(let i=0;i<12;i++){
    const a=cusps[i], b=cusps[(i+1)%12];
    if(a==null||b==null)continue;
    const span=n360(b-a), off=n360(L-a);
    if(off<span)return i+1;
  }
  return 1;
}
/* participação antecipada da casa seguinte (regra dos 5°), só interpretativa */
function pvLiminar(L,cusps){
  const g=casaGeom(L,cusps);
  const prox=cusps[g%12];
  if(prox==null)return {casa:g, participa:null, dist:null};
  const d=n360(prox-L);
  return d<5 ? {casa:g, participa:(g%12)+1, dist:d} : {casa:g, participa:null, dist:d};
}
function pvProgDate(age){return new Date(BIRTH+age*DAY);}     // 1 dia após o nascimento = 1 ano
let PV_SAMP={}, PV_SAMP_FP=null;
function pvAmostra(age,F){
  const fp=pvFingerprint();
  if(PV_SAMP_FP!==fp){PV_SAMP={};PV_SAMP_FP=fp;}
  const ck=age.toFixed(4);
  return PV_SAMP[ck]||(PV_SAMP[ck]=pvAmostraCalc(age,F));
}
function pvAmostraCalc(age,F){
  const d=pvProgDate(age), o={age,d,lon:{}};
  PV_PL.slice(0,5).forEach(k=>{o.lon[k]=geoLon(k,d);});       // Lua a Marte
  // ângulos progredidos: arco solar em longitude aplicado ao MC natal
  const arco=norm180(o.lon.sun-NATAL.pts.sun.lon);
  const mc=n360(NATAL.mc+arco);
  const ramc=n360(Math.atan2(Math.sin(mc*PRAD)*Math.cos(F.eps*PRAD),Math.cos(mc*PRAD))*PDEG);
  o.lon.mcP=mc; o.lon.ascP=ascFromRAMC(ramc,F.eps,F.phi); o.arcoSolar=arco;
  return o;
}
const PV_MOV={moon:'Lua progredida',sun:'Sol progredido',mercury:'Mercúrio progredido',
  venus:'Vênus progredida',mars:'Marte progredido',
  ascP:'Ascendente progredido',mcP:'MC progredido'};
const PV_MOV_CASA={ascP:1,mcP:10};               // o ângulo progredido representa a sua casa
function pvAlvos(){
  const t={}; PV_PL.forEach(k=>{if(NATAL.pts[k])
    t[k]={nm:PT_NAME[k],lon:NATAL.pts[k].lon,pl:k,casa:NATAL.pts[k].h};});
  t.asc={nm:'Ascendente',lon:NATAL.asc,casa:1}; t.mc={nm:'Meio do Céu',lon:NATAL.mc,casa:10};
  return t;
}
let PV_PROG_CACHE=null;
function progressoesSecundarias(a0,a1){
  a0=Math.max(0,Math.floor(a0/4)*4); a1=Math.min(100,Math.ceil(a1/4)*4);
  const fp=pvFingerprint(), ck=fp+'§'+a0+'/'+a1;
  if(PV_PROG_CACHE&&PV_PROG_CACHE.ck===ck)return PV_PROG_CACHE.lista;
  const F=pvFrame(), passo=0.08, S=[];
  for(let a=a0;a<=a1+1e-9;a+=passo)S.push(pvAmostra(a,F));
  const alvos=pvAlvos(), out=[];
  const lonEm=(m,a)=>pvAmostra(a,F).lon[m];
  const ev=o=>{o.tipo='prog'; o.data=new Date(BIRTH+o.anos*365.2425*DAY);
               o.refino='bisseção'; out.push(o);};

  Object.keys(PV_MOV).forEach(m=>{
    for(let i=0;i<S.length-1;i++){
      const A0=S[i].age, A1=S[i+1].age, L0=S[i].lon[m], L1=S[i+1].lon[m];
      if(Math.abs(norm180(L1-L0))>15)continue;                 // salto: ignora
      // ingresso de signo — raiz real sobre a distância à fronteira
      const s0=Math.floor(n360(L0)/30), s1=Math.floor(n360(L1)/30);
      if(s0!==s1){
        const fron=n360((L1>L0||norm180(L1-L0)>0? s1 : s0)*30);
        const r=pvRaiz(a=>norm180(lonEm(m,a)-fron),A0,A1,40);
        ev({classe:'signo', mover:m, anos:r===null?A1:r, casas:[], planetas:[m.replace('P','')],
            titulo:PV_MOV[m]+' entra em '+SIGNS[Math.floor(n360(lonEm(m,(r===null?A1:r)+0.01))/30)]});
      }
      // ingresso de CASA pela cúspide geométrica
      const h0=casaGeom(L0,NATAL.cusps), h1=casaGeom(L1,NATAL.cusps);
      if(h0!==h1){
        const cusp=NATAL.cusps[h1-1];
        const r=pvRaiz(a=>norm180(lonEm(m,a)-cusp),A0,A1,40);
        ev({classe:'casa', mover:m, anos:r===null?A1:r, casaNova:h1, cusp,
            casas:[h1].concat(PV_MOV_CASA[m]?[PV_MOV_CASA[m]]:[]), planetas:[m.replace('P','')],
            titulo:PV_MOV[m]+' cruza a cúspide da casa '+h1});
      }
      // estação — raiz da velocidade
      if(PV_PL.includes(m)&&m!=='sun'&&m!=='moon'&&i>0){
        const vel=a=>norm180(lonEm(m,a+0.02)-lonEm(m,a-0.02));
        const v0=vel(A0), v1=vel(A1);
        if(v0!==0&&v1!==0&&Math.sign(v0)!==Math.sign(v1)){
          const r=pvRaiz(vel,A0,A1,36);
          ev({classe:'estacao', mover:m, anos:r===null?A0:r, casas:[], planetas:[m],
              titulo:PV_MOV[m]+' estaciona '+(v1<0?'retrógrado':'direto')});
        }
      }
      // aspectos exatos a pontos natais — raiz real
      Object.keys(alvos).forEach(tk=>{
        if(tk===m||(m==='ascP'&&tk==='asc')||(m==='mcP'&&tk==='mc'))return;
        PV_ASP.forEach(([A,gl,nome,cls])=>{
          [A,-A].forEach((sinal,idx)=>{
            if(idx===1&&(A===0||A===180))return;
            const g=a=>norm180(lonEm(m,a)-alvos[tk].lon-sinal);
            const g0=g(A0), g1=g(A1);
            if(g0===0||Math.sign(g0)===Math.sign(g1))return;
            if(Math.abs(g0)+Math.abs(g1)>20)return;
            const r=pvRaiz(g,A0,A1,40); if(r===null)return;
            ev({classe:'aspecto', mover:m, alvo:tk, A, gl, cls, anos:r,
                titulo:PV_MOV[m]+' em '+nome+' '+(alvos[tk].pl?pvArtigo(alvos[tk].pl):'ao ')+alvos[tk].nm+' natal',
                casas:(PV_MOV_CASA[m]?[PV_MOV_CASA[m]]:[]).concat(alvos[tk].casa?[alvos[tk].casa]:[]),
                planetas:[m.replace('P',''),alvos[tk].pl].filter(x=>PT_NAME[x])});
          });
        });
      });
    }
  });
  // lunações progredidas — raiz da elongação
  for(let i=0;i<S.length-1;i++){
    const el=a=>{const s=pvAmostra(a,F);return norm180(s.lon.moon-s.lon.sun);};
    const e0=el(S[i].age), e1=el(S[i+1].age);
    if(e0<0&&e1>=0&&Math.abs(e0)+Math.abs(e1)<40){
      const r=pvRaiz(el,S[i].age,S[i+1].age,40);
      ev({classe:'lunacao', mover:'moon', anos:r===null?S[i+1].age:r, planetas:['sun','moon'],
          casas:[casaGeom(pvAmostra(r===null?S[i+1].age:r,F).lon.sun,NATAL.cusps)],
          titulo:'Lua Nova progredida'});
    }
    const fl=a=>{const s=pvAmostra(a,F);return norm180(s.lon.moon-s.lon.sun-180);};
    const f0=fl(S[i].age), f1=fl(S[i+1].age);
    if(f0<0&&f1>=0&&Math.abs(f0)+Math.abs(f1)<40){
      const r=pvRaiz(fl,S[i].age,S[i+1].age,40);
      ev({classe:'lunacao', mover:'moon', anos:r===null?S[i+1].age:r, planetas:['sun','moon'],
          casas:[casaGeom(pvAmostra(r===null?S[i+1].age:r,F).lon.moon,NATAL.cusps)],
          titulo:'Lua Cheia progredida'});
    }
  }
  out.sort((a,b)=>a.anos-b.anos);
  PV_PROG_CACHE={ck,lista:out};
  return out;
}
/* janela geométrica de permanência numa casa */
function pvJanelaCasa(mover,casa,anos){
  const F=pvFrame(), dentro=a=>casaGeom(pvAmostra(a,F).lon[mover],NATAL.cusps)===casa;
  const borda=dir=>{
    let a=anos;
    for(let n=0;n<90;n++){const b=a+dir*0.5; if(b<0||b>100||!dentro(b))break; a=b;}
    for(let n=0;n<12;n++){const b=a+dir*0.05; if(b<0||b>100||!dentro(b))break; a=b;}
    return a;
  };
  return {ini:new Date(BIRTH+borda(-1)*365.2425*DAY), fim:new Date(BIRTH+borda(1)*365.2425*DAY)};
}

/* ============================================================
   CAMADA 2 — CLASSIFICAÇÃO ASTROLÓGICA
   ============================================================ */
let PV_TAB='dir', PV_METODO='pup', PV_KEY='naibod', PV_SENT='ambas', PV_MARG=6;
let PV_OPEN=null;

/* papéis: o significador é o CAMPO atingido; o promissor é a NATUREZA da ativação */
function pvPapeis(it){
  if(it.tipo==='dir'){
    const campoCasa = it.sig.ang
      ? (it.eixo===PV_ANG[it.sig.ang].op?PV_ANG[it.sig.ang].opCasa:PV_ANG[it.sig.ang].casa)
      : it.sig.casa;
    return {
      significador:{nome:it.eixo||it.sig.nm, pl:it.sig.pl||null, casa:campoCasa,
                    rege:it.sig.pl?ruledHouses(it.sig.pl):[]},
      promissor:{nome:PT_NAME[it.prom.pl], pl:it.prom.pl,
                 rege:ruledHouses(it.prom.pl),
                 ocupa:NATAL.pts[it.prom.pl]?NATAL.pts[it.prom.pl].h:null},
      aspecto:it.prom.aspNome, cls:it.prom.cls};
  }
  const mv=it.mover.replace('P','');
  const alvo=it.alvo?pvAlvos()[it.alvo]:null;
  return {
    significador:{nome:alvo?alvo.nm:(it.casaNova?('casa '+it.casaNova):PV_MOV[it.mover]),
                  pl:alvo&&alvo.pl||null,
                  casa:alvo&&alvo.casa||it.casaNova||PV_MOV_CASA[it.mover]||null,
                  rege:(alvo&&alvo.pl)?ruledHouses(alvo.pl):[]},
    promissor:{nome:PV_MOV[it.mover], pl:PT_NAME[mv]?mv:null,
               rege:PT_NAME[mv]?ruledHouses(mv):[],
               ocupa:NATAL.pts[mv]?NATAL.pts[mv].h:null},
    aspecto:it.classe==='aspecto'?(PV_ASP.find(a=>a[0]===it.A)||[])[2]:it.classe, cls:it.cls||'conj'};
}
/* casas e planetas envolvidos, separados por origem */
function pvEnvolvidos(it){
  const P=pvPapeis(it), pls=new Set(), casasSig=new Set(), casasProm=new Set();
  if(P.significador.pl)pls.add(P.significador.pl);
  if(P.promissor.pl)pls.add(P.promissor.pl);
  if(P.significador.casa)casasSig.add(P.significador.casa);
  P.significador.rege.forEach(h=>casasSig.add(h));
  P.promissor.rege.forEach(h=>casasProm.add(h));
  if(P.promissor.ocupa)casasProm.add(P.promissor.ocupa);
  (it.casas||[]).forEach(h=>{if(h)casasSig.add(h);});
  return {pls:[...pls], casasSig:[...casasSig], casasProm:[...casasProm],
          casas:[...new Set([...casasSig,...casasProm])], papeis:P};
}
/* promessa natal: o vínculo forte é pelo PLANETA; casa coincidente vale menos */
function pvPromessa(it){
  const E=pvEnvolvidos(it), lista=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]);
  let melhor=null;
  lista.forEach(pr=>{
    const porPlaneta=E.pls.includes(pr.pl);
    const inter=(pr.casas||[]).filter(h=>E.casas.includes(h));
    if(!porPlaneta&&!inter.length)return;
    const sc=(porPlaneta?3:0)+Math.min(1,inter.length);   // casa nunca supera o planeta
    const forte=(pr.cond==='forte');
    if(!melhor||sc>melhor.sc)melhor={pr,sc,casas:inter,porPlaneta,forte};
  });
  return melhor;
}
/* confirmações, distinguindo planeta / casa / tema, na DATA DE PERFEIÇÃO */
function pvConfirmacoes(it,comTransito){
  const E=pvEnvolvidos(it), out=[];
  let S=null; try{S=tempoState(it.data);}catch(e){}
  if(!S)return out;
  const push=(k,via,txt)=>out.push({k,via,txt});
  if(E.pls.includes(S.lord))push('profecção','planeta','Senhor do Ano é '+PT_NAME[S.lord]);
  else if(E.casas.includes(S.profHouse))push('profecção','casa','profecção da '+ordinal(S.profHouse));
  if(E.pls.includes(S.mk)||E.pls.includes(S.sk))
    push('firdária','planeta','firdária de '+(PT_NAME[S.mk]||'—')+(S.sk?(' / '+PT_NAME[S.sk]):''));
  else if(S.rulesMk.some(h=>E.casas.includes(h))||S.rulesSk.some(h=>E.casas.includes(h)))
    push('firdária','casa','a firdária administra a mesma casa');
  if(S.rev){
    if(E.pls.includes(S.rev.ascRuler)||E.pls.includes(S.rev.planetKey))
      push('revolução','planeta','Revolução '+S.rev.label+' regida por '+PT_NAME[S.rev.ascRuler]);
    else if(E.casas.includes(S.rev.ascNatalHouse))
      push('revolução','casa','Asc da Revolução na '+ordinal(S.rev.ascNatalHouse)+' natal');
  }
  if(comTransito){
    try{const h=transitHits(it.data).filter(x=>x.orb<3&&(E.pls.includes(x.tKey)||E.pls.includes(x.nk)))
          .sort((a,b)=>a.orb-b.orb)[0];
        if(h)push('trânsito','planeta',PT_NAME[h.tKey]+' '+h.gl+' '+h.np.nm+' natal ('+fmtOrb(h.orb)+')');
    }catch(e){}
  }
  return out;
}
/* relevância — regras explícitas, sem inflar por casa coincidente */
const PV_VITAIS=['asc','mc','sun','moon'];
function pvEstrutural(it){
  const P=pvPapeis(it), r=[];
  const alvoVital = it.tipo==='dir'
    ? (it.sig.ang||it.sig.pl==='sun'||it.sig.pl==='moon')
    : (it.alvo&&PV_VITAIS.includes(it.alvo))||!!PV_MOV_CASA[it.mover];
  const duro = it.tipo==='dir' ? (it.prom.A===0||it.prom.A===180)
                               : (it.classe==='aspecto'?(it.A===0||it.A===180):it.classe!=='signo');
  if(alvoVital&&duro)r.push('conjunção ou oposição a ponto vital');
  const regAsc=NATAL.rulers[1], regMC=NATAL.rulers[10];
  if(P.promissor.pl===regAsc)r.push('promissor rege o Ascendente');
  if(P.promissor.pl===regMC)r.push('promissor rege o Meio do Céu');
  if(P.promissor.ocupa&&[1,4,7,10].includes(P.promissor.ocupa))r.push('promissor angular no natal');
  return {alvoVital, duro, motivos:r};
}
function pvRelevancia(it,prom,conf){
  const st=pvEstrutural(it);
  const confPlaneta=conf.filter(c=>c.via==='planeta').length;
  const promForte=prom&&prom.porPlaneta&&prom.forte;
  const promReal=prom&&prom.porPlaneta;
  if((st.alvoVital&&st.duro&&promReal) ||
     (promForte&&confPlaneta>=1) ||
     (promReal&&confPlaneta>=2) ||
     (st.motivos.length>=2&&promReal&&conf.length>=1))
    return 'alta';
  if(promReal || (st.duro&&conf.length>=1) || (st.alvoVital&&conf.length>=1))
    return 'média';
  return 'contextual';
}
/* clusters: eventos vizinhos que servem à mesma promessa viram um período */
function pvClusters(itens,janelaAnos){
  const usados=new Set(), out=[];
  itens.forEach((a,i)=>{
    if(usados.has(i))return;
    const grupo=[a]; usados.add(i);
    itens.forEach((b,j)=>{
      if(usados.has(j)||j===i)return;
      if(Math.abs(b.anos-a.anos)>janelaAnos)return;
      const mesmaProm=a.promessa&&b.promessa&&a.promessa.pr.id===b.promessa.pr.id;
      const mesmoPl=a.env.pls.some(p=>b.env.pls.includes(p));
      if(mesmaProm||mesmoPl){grupo.push(b);usados.add(j);}
    });
    grupo.sort((x,y)=>x.anos-y.anos);
    const pls={}; grupo.forEach(g=>g.env.pls.forEach(p=>pls[p]=(pls[p]||0)+1));
    const dom=Object.keys(pls).sort((x,y)=>pls[y]-pls[x])[0];
    const casas={}; grupo.forEach(g=>g.env.casas.forEach(h=>casas[h]=(casas[h]||0)+1));
    const casasTop=Object.keys(casas).map(Number).sort((x,y)=>casas[y]-casas[x]).slice(0,3);
    const peso={alta:3,'média':2,contextual:1};
    const forca=grupo.reduce((s,g)=>s+peso[g.nivel],0)
      + (grupo.length>1?grupo.length:0)
      + (Object.values(pls).some(v=>v>1)?2:0);
    out.push({grupo, dom, casasTop, forca,
      nivel:grupo.map(g=>g.nivel).sort((x,y)=>peso[y]-peso[x])[0],
      ini:grupo[0].anos, fim:grupo[grupo.length-1].anos,
      principal:grupo.slice().sort((x,y)=>peso[y.nivel]-peso[x.nivel]||x._dist-y._dist)[0]});
  });
  out.sort((a,b)=>b.forca-a.forca);
  return out;
}

/* ============================================================
   CAMADA 3 — INTERPRETAÇÃO (só lê o que já foi calculado)
   ============================================================ */
const PV_ADJ={sun:'solar',moon:'lunar',mercury:'mercurial',venus:'venusiana',
  mars:'marcial',jupiter:'jupiteriana',saturn:'saturnina'};
function pvIdadeTxt(anos){
  const a=Math.floor(anos), m=Math.round((anos-a)*12);
  return m===12?(a+1)+' anos':(a+' anos'+(m?' e '+m+(m===1?' mês':' meses'):''));
}
const MESL=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto',
  'setembro','outubro','novembro','dezembro'];
function pvMesAno(d){return MESL[d.getUTCMonth()]+' de '+d.getUTCFullYear();}
/* "Saturno dirigido ao Ascendente" — promissor primeiro, nunca invertido */
function pvTitulo(it){
  if(it.tipo!=='dir')return it.titulo;
  const P=pvPapeis(it);
  const alvo = it.sig.ang ? ('ao '+P.significador.nome)
             : (pvArtigo(it.sig.pl)+P.significador.nome);
  const dir = pvPart(it.prom.pl);
  const asp = it.prom.A===0 ? dir : (dir+' em '+it.prom.aspNome);
  return (PT_GLYPH[it.prom.pl]||'')+'\uFE0E '+PT_NAME[it.prom.pl]+' '+asp+' '+alvo
    +(it.sentido==='conversa'?' <i>(conversa)</i>':'');
}
function pvCondicaoNatal(k){
  const p=NATAL.pts[k]; if(!p)return 'condição não avaliável';
  const q=qualidade(k);
  const rec=(NATAL.meta.receptions||[]).filter(r=>r.includes(PT_GLYPH[k]));
  const nivel={boa:'com maior capacidade de entrega',
    condicional:'com entrega dependente dos apoios que receber',
    travada:'com entrega que tende a exigir mais esforço, revisão e tempo'}[q.nivel]||'em condição não avaliável';
  return pvGen(k, cap1(PT_NAME[k])+' '+(q.txt||'—')+', na casa '+p.h+', '+nivel
    +(rec.length?'; recebido por outro planeta':'')+'.');
}
/* blocos na ordem pedida: campo atingido, origem, condição, síntese */
function pvLeitura(it){
  const P=it.env.papeis, prom=it.promessa, L=[];
  L.push(['Ativação', pvTitulo(it)]);
  L.push(['Promessa natal', prom
    ? (PT_NAME[prom.pr.pl]+' rege '+(prom.pr.ruled||[]).map(ordinal).join(' e ')
       +' e ocupa a '+ordinal(prom.pr.occ)+' — '+prom.pr.t)
    : 'nenhuma promessa natal suficientemente testemunhada corresponde a este contato']);
  L.push(['Campo atingido', P.significador.casa
    ? (cap1(HOUSE_THEME[P.significador.casa])+' ('+ordinal(P.significador.casa)+')')
    : cap1(P.significador.nome)]);
  const ori=[];
  if(P.promissor.rege.length)ori.push(casasTag(P.promissor.rege));
  if(P.promissor.ocupa)ori.push('a partir de '+casaTag(P.promissor.ocupa));
  L.push(['Origem da manifestação', ori.length?cap1(ori.join(', '))+'.'
    :'sem casa administrada pelo promissor.']);
  if(P.promissor.pl)L.push(['Condição natal', pvCondicaoNatal(P.promissor.pl)]);
  const campo=P.significador.casa?casaTag(P.significador.casa):'o campo atingido';
  const origem=P.promissor.rege.length?casasTag(P.promissor.rege):'os assuntos do promissor';
  const verbo={conj:'tendem a se somar a',harm:'tendem a favorecer',tens:'tendem a pressionar'}[P.cls]||'tendem a tocar';
  L.push(['Síntese', cap1(origem)+' '+verbo+' '+campo
    +(it.tipo==='dir'?', com possibilidade de definição ou reorganização nesse campo.'
                     :', com amadurecimento interno antes de qualquer forma exterior.')]);
  return L;
}
function pvClusterNome(C){
  const adj=PV_ADJ[C.dom]||'';
  const temas=C.casasTop.length?casasTag(C.casasTop):'assuntos gerais';
  return 'Convergência '+(adj||'temática')+': '+temas;
}

/* ============================================================
   SELEÇÃO E RENDER
   ============================================================ */
function pvEstado(it,agora){
  const dif=(it.data-agora)/DAY/365.2425*12;
  if(Math.abs(dif)<=PV_MARG)return 'ativo';
  return dif>0?'proximo':'passado';
}
function pvItens(){
  const agora=CURSOR, idade=ageAt(agora);
  const base = PV_TAB==='dir' ? direcoesPrimarias()
             : progressoesSecundarias(Math.max(0,idade-10),idade+10);
  const jan=PV_TAB==='dir'?10:8;
  const perto=base.filter(x=>Math.abs(x.anos-idade)<=jan);
  const bruta=perto.length?perto:base.slice(0,40);
  const pre=bruta.map(x=>{const p=pvPromessa(x), e=pvEnvolvidos(x), s=pvEstrutural(x);
    return Object.assign({},x,{promessa:p,env:e,estr:s,
      _rank:(p?p.sc:0)+s.motivos.length+(s.alvoVital?2:0)+(s.duro?1:0),
      _dist:Math.abs(x.anos-idade)});});
  pre.sort((a,b)=>(b._rank-a._rank)||(a._dist-b._dist));
  const iPerto=pre.reduce((mi,x,i)=>(x._dist<pre[mi]._dist?i:mi),0);
  const sel=pre.slice(0,16);
  if(iPerto>=16)sel[15]=pre[iPerto];
  const curta=sel.map(x=>{const conf=pvConfirmacoes(x,false);
    return Object.assign({},x,{conf,nivel:pvRelevancia(x,x.promessa,conf)});});
  const peso={alta:0,'média':1,contextual:2};
  curta.sort((a,b)=>(peso[a.nivel]-peso[b.nivel])||(b._rank-a._rank)||(a._dist-b._dist));
  return {lista:curta, clusters:pvClusters(curta,PV_TAB==='dir'?2.5:1.5), idade, agora};
}
function pvCalcHTML(it){
  const F=pvFrame(), g=x=>x==null?'—':((Math.round(x*1000)/1000).toFixed(3)+'°');
  const lin=(a,b)=>'<div class="pv-cr"><span>'+a+'</span><b>'+b+'</b></div>';
  const horaAviso=(it.tipo==='dir'&&it.sig.ang)
    ? '<p class="pv-nota">Direções a Ascendente e Meio do Céu dependem do horário exato: '
      +'quatro minutos de erro deslocam o ângulo cerca de 1°, ou seja, cerca de um ano de vida.</p>' : '';
  if(it.tipo==='dir'){
    const zod=adiff(it.sig.lon,it.prom.lon);
    return '<div class="pv-calc">'
      +lin('Método',PV_MET[it.metodo].lab)
      +lin('Fórmula',PV_MET[it.metodo].nota)
      +lin('Sentido',it.sentido==='direta'
        ?'direta — o promissor é levado ao lugar do significador'
        :'conversa — o significador é levado ao lugar do promissor')
      +lin('Chave',PV_KEYS[it.chave].lab+' — '+PV_KEYS[it.chave].nota)
      +lin('Latitude geográfica',g(F.phi)+(F.inferida?' (INFERIDA do Asc/MC — menor confiabilidade)':' (do local de nascimento)'))
      +lin('Obliquidade',g(F.eps))+lin('RAMC natal',g(F.ramc))
      +lin('Significador (campo)',it.sig.nm+' · λ '+g(it.sig.lon)+' · AR '+g(it.sig.ra)+' · δ '+g(it.sig.dec))
      +lin('Promissor (agente)',PT_NAME[it.prom.pl]+' · '+it.prom.aspNome
          +' · λ '+g(it.prom.lon)+' · β '+g(it.prom.lat)+' · AR '+g(it.prom.ra)+' · δ '+g(it.prom.dec))
      +(it.metodo==='pup'?(lin('Polo do significador',g(it.polo))+lin('AO sob o polo',g(it.oaS)+' → '+g(it.oaP))):'')
      +lin('Arco de direção',g(it.arc))
      +lin('Perfeição',pvIdadeTxt(it.anos)+' · '+pvMesAno(it.data)+' · margem ±'+PV_MARG+' meses')
      +'<p class="pv-nota">A distância zodiacal simples entre os dois pontos daria '+g(zod)
        +' ('+pvIdadeTxt(zod/PV_KEYS[it.chave].v)+'). A diferença vem da latitude do promissor, '
        +'da declinação e do semi-arco.</p>'+horaAviso+'</div>';
  }
  const F2=pvFrame(), s=pvAmostra(it.anos,F2), lim=pvLiminar(s.lon[it.mover],NATAL.cusps);
  return '<div class="pv-calc">'
    +lin('Método','Progressão secundária — 1 dia após o nascimento = 1 ano de vida')
    +lin('Data progredida',fdate(s.d)+' (nascimento + '+(Math.round(it.anos*100)/100)+' dias)')
    +lin('Ângulos progredidos','por arco solar em longitude ('+g(s.arcoSolar)+' aos '+pvIdadeTxt(it.anos)+')')
    +lin('Móvel',PV_MOV[it.mover]+' · λ '+g(s.lon[it.mover]))
    +lin('Casa geométrica','casa '+lim.casa+(lim.participa?(' · a '+g(lim.dist)+' da cúspide da '+lim.participa+'ª'):''))
    +lin('Refinamento','bisseção sobre a função de contato (48 iterações)')
    +lin('Perfeição',pvIdadeTxt(it.anos)+' · '+pvMesAno(it.data))
    +(lim.participa?('<p class="pv-nota">Regra dos 5°: a casa '+lim.participa
      +' já começa a participar, mas o ingresso só é declarado no cruzamento geométrico da cúspide.</p>'):'')
    +'</div>';
}
function pvItemHTML(it,i,agora,principal){
  const id='pv-'+PV_TAB+'-'+i;
  const per=(it.tipo==='prog'&&it.classe==='casa')
    ? (()=>{const j=pvJanelaCasa(it.mover,it.casaNova,it.anos);
            return pvMesAno(j.ini)+' – '+pvMesAno(j.fim);})()
    : (pvIdadeTxt(it.anos)+' · '+pvMesAno(it.data)+' ±'+PV_MARG+' meses');
  let h='<article class="pvc'+(principal?' main':'')+' n-'+it.nivel.replace('é','e')+'">'
    +'<header class="pvc-h"><b>'+pvTitulo(it)+'</b>'
    +'<span class="pv-st '+pvEstado(it,agora)+'">'+({ativo:'ativo',proximo:'próximo',passado:'passado'}[pvEstado(it,agora)])+'</span>'
    +'<em class="pvc-n">'+it.nivel+'</em></header>'
    +'<div class="pvc-r"><span>Período</span><b>'+per+'</b></div>';
  if(principal){
    pvLeitura(it).slice(1).forEach(([k,v])=>{h+='<div class="pvc-s"><span>'+k+'</span><p>'+v+'</p></div>';});
    h+='<div class="pvc-s"><span>Confirmações</span><p>'
      +(it.conf.length?it.conf.map(c=>c.k+' <i>('+c.via+')</i> — '+c.txt).join('<br>')
        :'nenhuma repetição temática nas técnicas anuais')+'</p></div>';
  } else {
    h+='<div class="pvc-r"><span>Campo</span><b>'+(it.env.papeis.significador.casa
        ?cap1(casaTag(it.env.papeis.significador.casa)):cap1(it.env.papeis.significador.nome))+'</b></div>'
      +'<div class="pvc-r"><span>Promessa</span><b>'+(it.promessa?it.promessa.pr.t:'—')+'</b></div>';
  }
  h+='<div class="pvc-b"><button class="pv-lnk" data-pvcalc="'+id+'">Ver cálculo</button>'
    +(it.promessa?('<button class="pv-lnk" data-pvprom="'+it.promessa.pr.id+'">Ver promessa natal</button>'):'')
    +'</div>'+(PV_OPEN===id?pvCalcHTML(it):'')+'</article>';
  return h;
}
function pvClusterHTML(C,agora){
  const peso={alta:0,'média':1,contextual:2};
  return '<article class="pvcl n-'+C.nivel.replace('é','e')+'">'
    +'<header class="pvcl-h"><b>'+pvClusterNome(C)+'</b>'
    +'<em>'+(C.grupo.length>1?(pvIdadeTxt(C.ini)+' – '+pvIdadeTxt(C.fim)):pvIdadeTxt(C.ini))+'</em></header>'
    +'<div class="pvcl-b">'+C.grupo.slice().sort((a,b)=>peso[a.nivel]-peso[b.nivel]).map(g=>
      '<div class="pvcl-i"><span class="pv-st '+pvEstado(g,agora)+'"></span>'
      +'<b>'+pvTitulo(g)+'</b><em>'+pvIdadeTxt(g.anos)+'</em>'
      +'<u class="n-'+g.nivel.replace('é','e')+'">'+g.nivel+'</u></div>').join('')
    +'</div></article>';
}
function pvLinhaHTML(lista,idade,agora){
  if(!lista.length)return '';
  const jan=PV_TAB==='dir'?10:8, a0=idade-jan, a1=idade+jan;
  const pos=a=>Math.max(0,Math.min(100,(a-a0)/(a1-a0)*100));
  const pts=lista.slice(0,16).map(x=>'<i class="pv-dot '+pvEstado(x,agora)+'" style="left:'
    +pos(x.anos).toFixed(2)+'%" title="'+pvTitulo(x).replace(/"/g,'')+' — '+pvIdadeTxt(x.anos)+'"></i>').join('');
  return '<div class="pv-line"><span class="pv-lb">'+Math.round(a0)+' anos</span>'
    +'<div class="pv-track">'+pts+'<span class="pv-now" style="left:'+pos(idade).toFixed(2)+'%"></span></div>'
    +'<span class="pv-lb">'+Math.round(a1)+' anos</span></div>';
}
function renderPreditivas(){
  const el=$('pv-body'); if(!el)return;
  if(typeof NATAL==='undefined'||!NATAL){el.innerHTML='';return;}
  document.querySelectorAll('#pv-tabs [data-pvt]').forEach(b=>b.classList.toggle('on',b.dataset.pvt===PV_TAB));
  const mt=$('pv-metodo'); if(mt)mt.parentElement.style.display=PV_TAB==='dir'?'':'none';
  const st=$('pv-sent'); if(st)st.parentElement.style.display=PV_TAB==='dir'?'':'none';
  let R; try{R=pvItens();}catch(e){console.error('preditivas',e);
    el.innerHTML='<p class="note">não foi possível calcular as técnicas preditivas.</p>';return;}
  if(!R.lista.length){el.innerHTML='<p class="note">nenhum contato dentro da janela desta data.</p>';return;}
  const top=R.lista.slice(0,3).map(x=>{const conf=pvConfirmacoes(x,true);
    return Object.assign({},x,{conf,nivel:pvRelevancia(x,x.promessa,conf)});});
  const F=pvFrame();
  const nota=PV_TAB==='dir'
    ? 'Direções primárias — cronologia da manifestação de promessas natais. O significador indica o campo atingido; o promissor, a natureza e a origem da ativação.'
    : 'Progressões secundárias — maturação interna e mudança de orientação. Ingressos são declarados só no cruzamento geométrico da cúspide.';
  const met=PV_TAB==='dir'
    ? PV_MET[PV_METODO].curto+' · chave '+PV_KEYS[PV_KEY].lab+' · '
      +({ambas:'diretas e conversas',direta:'só diretas',conversa:'só conversas'}[PV_SENT])
      +' · margem ±'+PV_MARG+' meses'
    : '1 dia = 1 ano · ângulos progredidos por arco solar em longitude · refinamento por bisseção';
  el.innerHTML=
    (F.inferida?'<p class="pv-warn">Latitude do nascimento ausente: foi inferida do Ascendente e do MC, com menor confiabilidade. Informe o local na aba Dados para direções confiáveis.</p>':'')
    +'<p class="pv-int">'+nota+'</p>'
    +'<p class="pv-met">'+met+' · latitude '+(Math.round(F.phi*100)/100)+'°</p>'
    +pvItemHTML(top[0],0,R.agora,true)
    +pvLinhaHTML(R.lista,R.idade,R.agora)
    +(R.clusters.filter(c=>c.grupo.length>1).length
      ? '<div class="pv-clh">períodos temáticos</div><div class="pv-cls">'
        +R.clusters.filter(c=>c.grupo.length>1).slice(0,2).map(c=>pvClusterHTML(c,R.agora)).join('')+'</div>'
      : '')
    +'<div class="pv-list">'+top.slice(1,3).map((x,i)=>pvItemHTML(x,i+1,R.agora,false)).join('')+'</div>';
}
function bindPreditivas(){
  const w=$('p-tempo'); if(!w)return;
  w.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('[data-pvt]');
    if(t){PV_TAB=t.dataset.pvt;PV_OPEN=null;renderPreditivas();return;}
    const c=e.target.closest&&e.target.closest('[data-pvcalc]');
    if(c){PV_OPEN=(PV_OPEN===c.dataset.pvcalc)?null:c.dataset.pvcalc;renderPreditivas();return;}
    const p=e.target.closest&&e.target.closest('[data-pvprom]');
    if(p){
      const pr=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]).find(x=>x.id===p.dataset.pvprom);
      if(pr&&typeof tlDrawer==='function')tlDrawer('Promessa natal',
        '<div class="pv-prom"><h4>'+pr.t+'</h4><p>'+pr.fat+'</p>'
        +'<div class="pv-ps"><span>testemunhos</span><p>'+pr.testemunhos.join('<br>')+'</p></div>'
        +'<div class="pv-ps"><span>condição</span><p>'+pr.cond+' · '+pr.cond_manif+'</p></div>'
        +'<div class="pv-ps"><span>facilitadores</span><p>'+pr.facilit+'</p></div>'
        +'<div class="pv-ps"><span>atenção</span><p>'+pr.atencao+'</p></div></div>');
    }
  });
  [['pv-metodo',v=>PV_METODO=v],['pv-key',v=>PV_KEY=v],['pv-sent',v=>PV_SENT=v],
   ['pv-marg',v=>PV_MARG=+v]].forEach(([id,set])=>{
    const s=$(id); if(!s)return;
    s.addEventListener('change',function(){set(this.value);PV_OPEN=null;renderPreditivas();});});
}
