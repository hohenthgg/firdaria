/* ============================================================
   PREDITIVAS.JS — Direções Primárias (Placidus por semi-arcos)
                 · Progressões Secundárias (1 dia = 1 ano)
   Cálculo esférico real: ascensão reta, declinação, diferença
   ascensional, semi-arcos, polo do significador e ascensão
   oblíqua sob esse polo. Nada de "distância zodiacal ÷ 1°".
   Cada contato é cruzado com as promessas natais já detectadas.
   ============================================================ */
const PRAD=Math.PI/180, PDEG=180/Math.PI;
const PV_KEYS={naibod:{lab:'Naibod',v:0.9856473,nota:"0°59'08\" de ascensão reta por ano"},
               ptolomeu:{lab:'Ptolomeu',v:1,nota:'1° de ascensão reta por ano'}};
let PV_TAB='dir', PV_KEY='naibod', PV_SENT='ambas', PV_MARG=6;   // margem em meses
let PV_OPEN=null;                                                // item com "ver cálculo" aberto

const norm180=x=>{let d=n360(x); return d>180?d-360:d;};

/* ---------------- geometria esférica ---------------- */
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
/* latitude geográfica: a salva no import ou, na falta, resolvida do próprio mapa */
function pvSolveLat(ramc,eps,asc){
  const f=p=>norm180(ascFromRAMC(ramc,eps,p)-asc);
  let lo=-66, hi=66;
  if(f(lo)*f(hi)>0)return 0;
  for(let i=0;i<60;i++){const m=(lo+hi)/2; if(f(lo)*f(m)<=0)hi=m; else lo=m;}
  return (lo+hi)/2;
}
let PV_FRAME=null;
function pvFrame(){
  if(PV_FRAME&&PV_FRAME.birth===BIRTH)return PV_FRAME;
  const bd=new Date(BIRTH), eps=obliquity(bd);
  const ramc=n360(Math.atan2(Math.sin(NATAL.mc*PRAD)*Math.cos(eps*PRAD),Math.cos(NATAL.mc*PRAD))*PDEG);
  let phi=null, fonte='do mapa';
  try{const pl=STATE&&STATE.natal&&STATE.natal.place;
      if(pl&&isFinite(pl.lat)){phi=pl.lat;fonte='do local de nascimento';}}catch(e){}
  if(phi===null)phi=pvSolveLat(ramc,eps,NATAL.asc);
  PV_FRAME={birth:BIRTH,bd,eps,ramc,phi,fonte};
  return PV_FRAME;
}
/* polo, semi-arco e hemisfério de um ponto — o coração do método placidiano */
function pvPolo(ra,dec,F){
  const ad=adOf(dec,F.phi);
  if(ad===null)return null;                      // circumpolar: não dirige por semi-arco
  const dsa=90+ad, nsa=90-ad;
  const mdMC=norm180(ra-F.ramc);
  const acima=Math.abs(mdMC)<=dsa;
  const md=acima?Math.abs(mdMC):(180-Math.abs(mdMC));
  const sa=acima?dsa:nsa;
  if(!(sa>0))return null;
  const f=Math.max(0,Math.min(1,md/sa));
  const polo=Math.atan(Math.tan(F.phi*PRAD)*f)*PDEG;
  return {polo, md, sa, f, acima, leste:mdMC>0, ad, dsa, nsa};
}
function oaSob(ra,dec,polo,leste){               // ascensão oblíqua (ou descensão) sob um polo
  const ad=adOf(dec,polo); if(ad===null)return null;
  return n360(leste? ra-ad : ra+ad);
}

/* ---------------- significadores e promissores ---------------- */
const PV_ANG={asc:{nm:'Ascendente',ab:'Asc',casa:1},mc:{nm:'Meio do Céu',ab:'MC',casa:10},
              dsc:{nm:'Descendente',ab:'Dsc',casa:7},ic:{nm:'Fundo do Céu',ab:'IC',casa:4}};
const PV_PL=['sun','moon','mercury','venus','mars','jupiter','saturn'];
const PV_ASP=[[0,'☌','conjunção','conj'],[60,'⚹','sextil','harm'],[90,'□','quadratura','tens'],
              [120,'△','trígono','harm'],[180,'☍','oposição','tens']];

function pvSignificadores(){
  const F=pvFrame(), out=[];
  Object.keys(PV_ANG).forEach(a=>{
    const lon=a==='asc'?NATAL.asc:a==='mc'?NATAL.mc:a==='dsc'?n360(NATAL.asc+180):n360(NATAL.mc+180);
    out.push({key:a, ang:a, nm:PV_ANG[a].nm, ab:PV_ANG[a].ab, lon, lat:0, casa:PV_ANG[a].casa});
  });
  PV_PL.forEach(k=>{const p=NATAL.pts[k]; if(!p)return;
    const lat=geoLatEcl(k,F.bd), e=eqFrom(p.lon,lat,F.eps);
    out.push({key:k, pl:k, nm:PT_NAME[k], ab:(PT_GLYPH[k]||'')+'︎', lon:p.lon, lat, ra:e.ra, dec:e.dec, casa:p.h});
  });
  return out;
}
function pvPromissores(){
  const F=pvFrame(), out=[];
  PV_PL.forEach(k=>{const p=NATAL.pts[k]; if(!p)return;
    const lat=geoLatEcl(k,F.bd);
    PV_ASP.forEach(([A,gl,nome,cls])=>{
      // conjunção leva a latitude do corpo; os raios de aspecto vão sobre a eclíptica (β=0)
      const alvos = A===0 ? [[p.lon,lat]] : A===180 ? [[n360(p.lon+180),0]]
                  : [[n360(p.lon+A),0],[n360(p.lon-A),0]];
      alvos.forEach(([L,B])=>{const e=eqFrom(L,B,F.eps);
        out.push({pl:k, nm:PT_NAME[k], A, gl, aspNome:nome, cls, lon:L, lat:B, ra:e.ra, dec:e.dec});});
    });
  });
  return out;
}
/* arco de direção entre um significador e um ponto promissor */
function pvArco(sig,prom){
  const F=pvFrame();
  let polo, leste, oaS;
  if(sig.ang){
    polo = (sig.ang==='mc'||sig.ang==='ic') ? 0 : F.phi;
    leste = (sig.ang==='asc'||sig.ang==='mc');
    oaS = sig.ang==='mc'?F.ramc : sig.ang==='ic'?n360(F.ramc+180)
        : sig.ang==='asc'?n360(F.ramc+90) : n360(F.ramc+270);
  } else {
    const P=pvPolo(sig.ra,sig.dec,F); if(!P)return null;
    polo=P.polo; leste=P.leste;
    oaS=oaSob(sig.ra,sig.dec,polo,leste);
  }
  const oaP=oaSob(prom.ra,prom.dec,polo,leste);
  if(oaS===null||oaP===null)return null;
  const d=n360(oaP-oaS);
  return d<=180 ? {arc:d, sentido:'direta', polo, oaS, oaP}
                : {arc:360-d, sentido:'conversa', polo, oaS, oaP};
}
/* todas as direções dentro da vida, já convertidas em idade e data */
let PV_DIR_CACHE=null;
function direcoesPrimarias(){
  if(PV_DIR_CACHE&&PV_DIR_CACHE.birth===BIRTH&&PV_DIR_CACHE.key===PV_KEY)return PV_DIR_CACHE.lista;
  const chave=PV_KEYS[PV_KEY], sigs=pvSignificadores(), proms=pvPromissores(), out=[];
  sigs.forEach(sig=>{
    proms.forEach(prom=>{
      if(sig.pl&&sig.pl===prom.pl)return;                 // planeta não se dirige a si mesmo
      const R=pvArco(sig,prom); if(!R)return;
      const anos=R.arc/chave.v;
      if(anos<0.15||anos>95)return;
      out.push({tipo:'dir', sig, prom, arc:R.arc, sentido:R.sentido, polo:R.polo,
        oaS:R.oaS, oaP:R.oaP, anos, data:new Date(BIRTH+anos*365.2425*DAY)});
    });
  });
  out.sort((a,b)=>a.anos-b.anos);
  PV_DIR_CACHE={birth:BIRTH,key:PV_KEY,lista:out};
  return out;
}

/* ---------------- progressões secundárias ---------------- */
function pvProgDate(age){return new Date(BIRTH+age*DAY);}     // 1 dia após o nascimento = 1 ano
let PV_SAMP={}, PV_SAMP_B=null;
function pvAmostra(age,F){
  if(PV_SAMP_B!==BIRTH){PV_SAMP={};PV_SAMP_B=BIRTH;}
  const ck=age.toFixed(3);
  if(PV_SAMP[ck])return PV_SAMP[ck];
  return (PV_SAMP[ck]=pvAmostraCalc(age,F));
}
function pvAmostraCalc(age,F){
  const d=pvProgDate(age), o={age,d,lon:{}};
  PV_PL.slice(0,5).forEach(k=>{o.lon[k]=geoLon(k,d);});       // Lua a Marte
  const arcoSolar=norm180(o.lon.sun-NATAL.pts.sun.lon)+(age>0?0:0);
  const mc=n360(NATAL.mc+arcoSolar);
  const ramc=n360(Math.atan2(Math.sin(mc*PRAD)*Math.cos(F.eps*PRAD),Math.cos(mc*PRAD))*PDEG);
  o.lon.mcP=mc; o.lon.ascP=ascFromRAMC(ramc,F.eps,F.phi);
  return o;
}
const PV_MOV={moon:'Lua progredida',sun:'Sol progredido',mercury:'Mercúrio progredido',
  venus:'Vênus progredida',mars:'Marte progredido',ascP:'Ascendente progredido',mcP:'MC progredido'};
const PV_ALVO=()=>{const t={}; PV_PL.forEach(k=>{if(NATAL.pts[k])t[k]={nm:PT_NAME[k],lon:NATAL.pts[k].lon};});
  t.asc={nm:'Ascendente',lon:NATAL.asc}; t.mc={nm:'Meio do Céu',lon:NATAL.mc}; return t;};

let PV_PROG_CACHE=null;
function progressoesSecundarias(a0,a1){
  a0=Math.max(0,Math.floor(a0/4)*4); a1=Math.min(100,Math.ceil(a1/4)*4);
  const ck=a0+'/'+a1+'/'+BIRTH;
  if(PV_PROG_CACHE&&PV_PROG_CACHE.ck===ck)return PV_PROG_CACHE.lista;
  const F=pvFrame(), passo=0.08, S=[];
  for(let a=a0;a<=a1+1e-9;a+=passo)S.push(pvAmostra(a,F));
  const alvos=PV_ALVO(), out=[];
  const idadeEntre=(i,g0,g1)=>S[i].age+(S[i+1].age-S[i].age)*(g0/(g0-g1));
  const ev=(o)=>{o.tipo='prog'; o.data=new Date(BIRTH+o.anos*365.2425*DAY); out.push(o);};

  Object.keys(PV_MOV).forEach(m=>{
    for(let i=0;i<S.length-1;i++){
      const L0=S[i].lon[m], L1=S[i+1].lon[m];
      const passou=Math.abs(norm180(L1-L0))<15;                    // ignora saltos
      if(!passou)continue;
      // ingresso de signo
      if(Math.floor(L0/30)!==Math.floor(L1/30)){
        const sg=Math.floor(n360(L1)/30);
        ev({classe:'signo', mover:m, anos:S[i+1].age,
            titulo:PV_MOV[m]+' entra em '+SIGNS[sg], casas:[], planetas:[m.replace('P','')]});
      }
      // ingresso de casa
      const h0=houseByRule(L0,NATAL.cusps), h1=houseByRule(L1,NATAL.cusps);
      if(h0!==h1){
        ev({classe:'casa', mover:m, anos:S[i+1].age, casaNova:h1,
            titulo:PV_MOV[m]+' ingressa na casa '+h1, casas:[h1], planetas:[]});
      }
      // estação (só planetas de verdade)
      if(PV_PL.includes(m)&&m!=='sun'&&m!=='moon'&&i>0){
        const v0=norm180(S[i].lon[m]-S[i-1].lon[m]), v1=norm180(L1-L0);
        if(v0!==0&&v1!==0&&Math.sign(v0)!==Math.sign(v1))
          ev({classe:'estacao', mover:m, anos:S[i].age,
              titulo:PV_MOV[m]+' estaciona '+(v1<0?'retrógrado':'direto'), casas:[], planetas:[m]});
      }
      // aspectos exatos a pontos natais
      Object.keys(alvos).forEach(tk=>{
        if(tk===m)return;
        PV_ASP.forEach(([A,gl,nome,cls])=>{
          [A,-A].forEach((sinal,idx)=>{
            if(idx===1&&(A===0||A===180))return;
            const g0=norm180(L0-alvos[tk].lon-sinal), g1=norm180(L1-alvos[tk].lon-sinal);
            if(g0===0||Math.sign(g0)===Math.sign(g1))return;
            if(Math.abs(g0)+Math.abs(g1)>20)return;                // guarda contra a volta em 180°
            ev({classe:'aspecto', mover:m, alvo:tk, A, gl, cls, anos:idadeEntre(i,g0,g1),
                titulo:PV_MOV[m]+' em '+nome+' a '+alvos[tk].nm+' natal',
                casas:[], planetas:[m.replace('P',''),tk].filter(x=>PT_NAME[x])});
          });
        });
      });
    }
  });
  // lunações progredidas
  for(let i=0;i<S.length-1;i++){
    const f0=n360(S[i].lon.moon-S[i].lon.sun), f1=n360(S[i+1].lon.moon-S[i+1].lon.sun);
    if(f0>300&&f1<60) ev({classe:'lunacao', mover:'moon', anos:S[i+1].age,
      titulo:'Lua Nova progredida', casas:[houseByRule(S[i+1].lon.sun,NATAL.cusps)], planetas:['sun','moon']});
    if(f0<180&&f1>=180) ev({classe:'lunacao', mover:'moon', anos:S[i+1].age,
      titulo:'Lua Cheia progredida', casas:[houseByRule(S[i+1].lon.moon,NATAL.cusps)], planetas:['sun','moon']});
  }
  out.sort((a,b)=>a.anos-b.anos);
  PV_PROG_CACHE={ck,lista:out};
  return out;
}
/* janela de permanência da Lua progredida numa casa (para o "período") */
function pvJanelaCasa(mover,casa,anos){
  const F=pvFrame(), na=a=>houseByRule(pvAmostra(a,F).lon[mover],NATAL.cusps)===casa;
  const borda=(dir)=>{
    let a=anos, p=0.5, n=0;
    while(n++<80){const b=a+dir*p; if(b<0||b>100)break; if(!na(b))break; a=b;}
    let r=a; n=0;                                       // refina os últimos 0,5 ano
    while(n++<12){const b=r+dir*0.05; if(b<0||b>100)break; if(!na(b))break; r=b;}
    return r;
  };
  return {ini:new Date(BIRTH+borda(-1)*365.2425*DAY), fim:new Date(BIRTH+borda(1)*365.2425*DAY)};
}

/* ---------------- cruzamento com as promessas natais ---------------- */
function pvEnvolvidos(it){
  const pls=new Set(), casas=new Set();
  if(it.tipo==='dir'){
    if(it.sig.pl){pls.add(it.sig.pl); ruledHouses(it.sig.pl).forEach(h=>casas.add(h)); casas.add(it.sig.casa);}
    else casas.add(it.sig.casa);
    pls.add(it.prom.pl); ruledHouses(it.prom.pl).forEach(h=>casas.add(h));
    if(NATAL.pts[it.prom.pl])casas.add(NATAL.pts[it.prom.pl].h);
  } else {
    (it.planetas||[]).forEach(p=>{if(PT_NAME[p]){pls.add(p); ruledHouses(p).forEach(h=>casas.add(h));}});
    (it.casas||[]).forEach(h=>casas.add(h));
    if(it.alvo==='asc')casas.add(1); if(it.alvo==='mc')casas.add(10);
  }
  return {pls:[...pls], casas:[...casas].filter(Boolean)};
}
function pvPromessa(it){
  const E=pvEnvolvidos(it);
  const lista=(typeof PROMESSAS!=='undefined'?PROMESSAS:[]);
  let melhor=null, melhorSc=0;
  lista.forEach(pr=>{
    let sc=0;
    if(E.pls.includes(pr.pl))sc+=2;
    const inter=(pr.casas||[]).filter(h=>E.casas.includes(h));
    sc+=Math.min(2,inter.length);          // teto: um contato que toca muitas casas não vale mais por isso
    if(sc>melhorSc){melhorSc=sc;melhor={pr,sc,casas:inter};}
  });
  return melhor;
}
/* peso do significador: Asc/MC/Dsc/IC e os luminares comandam a direção */
function pvPesoSig(it){
  if(it.tipo!=='dir')return it.mover==='moon'||it.mover==='ascP'||it.mover==='mcP'?1.5:0;
  if(it.sig.ang)return 2;
  return (it.sig.pl==='sun'||it.sig.pl==='moon')?1.5:0;
}
/* confirmações na DATA DE PERFEIÇÃO, não na data do cursor */
function pvConfirmacoes(it,comTransito){
  const E=pvEnvolvidos(it), d=it.data, out=[];
  let S=null; try{S=tempoState(d);}catch(e){}
  if(!S)return out;
  if(E.casas.includes(S.profHouse)||E.pls.includes(S.lord))
    out.push({k:'profecção', txt:'profecção da '+ordinal(S.profHouse)+', Senhor do Ano '+PT_NAME[S.lord]});
  if(E.pls.includes(S.mk)||E.pls.includes(S.sk)||S.rulesMk.some(h=>E.casas.includes(h))||S.rulesSk.some(h=>E.casas.includes(h)))
    out.push({k:'firdária', txt:'firdária de '+(PT_NAME[S.mk]||'—')+(S.sk?(' / '+PT_NAME[S.sk]):'')});
  if(S.rev&&(E.casas.includes(S.rev.ascNatalHouse)||E.pls.includes(S.rev.ascRuler)||E.pls.includes(S.rev.planetKey)))
    out.push({k:'revolução', txt:'Revolução '+S.rev.label+' com Asc na '+ordinal(S.rev.ascNatalHouse)+' natal'});
  if(comTransito){
    try{
      const h=transitHits(d).filter(x=>x.orb<3&&(E.pls.includes(x.tKey)||E.pls.includes(x.nk)))
        .sort((a,b)=>a.orb-b.orb)[0];
      if(h)out.push({k:'trânsito', txt:PT_NAME[h.tKey]+' '+h.gl+' '+h.np.nm+' natal ('+fmtOrb(h.orb)+')'});
    }catch(e){}
  }
  return out;
}
function pvRelevancia(it,prom,conf){
  if(prom&&prom.sc>=2&&conf.length>=2)return 'alta';
  if((prom&&prom.sc>=2)||conf.length>=1)return 'média';
  return 'contextual';
}
/* ---------------- textos ---------------- */
function pvIdadeTxt(anos){
  const a=Math.floor(anos), m=Math.round((anos-a)*12);
  return m===12?(a+1)+' anos':(a+' anos'+(m?' e '+m+(m===1?' mês':' meses'):''));
}
function pvDirTitulo(it){
  return it.sig.ab+' → '+(it.prom.A?(it.prom.gl+' '):'')+(PT_GLYPH[it.prom.pl]||'')+'︎ '+PT_NAME[it.prom.pl];
}
function pvCondicaoNatal(k){
  const p=NATAL.pts[k]; if(!p)return 'condição não avaliável';
  const q=qualidade(k), lig=[];
  PV_PL.forEach(o=>{if(o===k)return;
    if(typeof HAS!=='undefined'&&(HAS[k+'_'+o+'_harm']||HAS[k+'_'+o+'_conj']))
      lig.push('aspecto favorável a '+PT_NAME[o]);});
  const rec=(NATAL.meta.receptions||[]).filter(r=>r.includes(PT_GLYPH[k]));
  const base=cap1(PT_NAME[k])+' está '+(q.txt||'—')+' na casa '+p.h;
  const via=lig.length?(', com '+lig[0]+', o que tende a permitir que o assunto se resolva por acordo, estudo ou planejamento')
    :(rec.length?', recebido por outro planeta, o que tende a suavizar a entrega'
      :(q.nivel==='travada'?', o que tende a exigir mais esforço, revisão e tempo'
        :', sem apoios nem debilidades decisivas'));
  return base+via+'.';
}
function pvTemas(env){
  const hs=env.casas.slice(0,3);
  return hs.length?cap1(casasTag(hs)):'—';
}
function pvSintese(it){
  const E=it.env, prom=it.promessa, conf=it.conf;
  const linhas=[];
  linhas.push(['Tema dominante', pvTemas(E)]);
  linhas.push(['Ativação principal', it.tipo==='dir'
    ? (it.sig.nm+' dirigido a '+(it.prom.A?it.prom.aspNome+' de ':'')+PT_NAME[it.prom.pl]+' ('+it.sentido+')')
    : it.titulo]);
  linhas.push(['Base natal', prom
    ? (prom.pr.t+' — '+PT_NAME[prom.pr.pl]+' rege '+prom.pr.ruled.map(ordinal).join(' e ')+' e ocupa a '+ordinal(prom.pr.occ))
    : 'sem promessa natal suficientemente testemunhada para este contato']);
  if(it.tipo==='dir'){
    const outro=progressoesSecundarias(Math.max(0,it.anos-2),it.anos+2)
      .filter(x=>x.classe==='signo'||x.classe==='casa')
      .sort((a,b)=>Math.abs(a.anos-it.anos)-Math.abs(b.anos-it.anos))[0];
    linhas.push(['Desenvolvimento interno', outro?outro.titulo:'sem mudança progressiva marcante na mesma janela']);
  } else {
    const dir=direcoesPrimarias().filter(x=>Math.abs(x.anos-it.anos)<=2)
      .sort((a,b)=>Math.abs(a.anos-it.anos)-Math.abs(b.anos-it.anos))[0];
    linhas.push(['Ativação estrutural próxima', dir?pvDirTitulo(dir)+' aos '+pvIdadeTxt(dir.anos):'nenhuma direção próxima na mesma janela']);
  }
  linhas.push(['Confirmação anual', conf.length?conf.map(c=>c.txt).join(' · '):'nenhuma repetição temática nas técnicas anuais']);
  const fecho = it.tipo==='dir'
    ? 'Período de definição, formalização ou reestruturação em '+ (E.casas.length?casaTag(E.casas[0]):'assuntos gerais')+'.'
    : 'Fase de amadurecimento interno e mudança de orientação em '+(E.casas.length?casaTag(E.casas[0]):'assuntos gerais')+'.';
  linhas.push(['Conclusão', fecho]);
  return linhas;
}

/* ---------------- render ---------------- */
function pvEstado(it,agora){
  const dif=(it.data-agora)/DAY/365.2425*12;                     // meses
  if(Math.abs(dif)<=PV_MARG)return 'ativo';
  return dif>0?'proximo':'passado';
}
function pvItens(){
  const agora=CURSOR, idade=ageAt(agora);
  const base = PV_TAB==='dir'
    ? direcoesPrimarias().filter(x=>PV_SENT==='ambas'||x.sentido===PV_SENT)
    : progressoesSecundarias(Math.max(0,idade-12),idade+12);
  const jan=PV_TAB==='dir'?12:8;
  const perto=base.filter(x=>Math.abs(x.anos-idade)<=jan);
  const bruta=perto.length?perto:base;
  // 1) casamento com as promessas natais é barato: roda em tudo
  const pre=bruta.map(x=>{const p=pvPromessa(x);
    return Object.assign({},x,{promessa:p,_ps:p?p.sc:0,_sig:pvPesoSig(x),
      _rank:(p?p.sc:0)+pvPesoSig(x),_dist:Math.abs(x.anos-idade)});});
  pre.sort((a,b)=>(b._rank-a._rank)||(a._dist-b._dist));
  // 2) confirmações exigem tempoState (que calcula retornos): só na lista curta
  const iPerto=pre.reduce((mi,x,i)=>(x._dist<pre[mi]._dist?i:mi),0);
  const sel=pre.slice(0,14);
  if(iPerto>=14)sel[13]=pre[iPerto];              // o contato mais próximo nunca é cortado
  const curta=sel.map(x=>{
    const conf=pvConfirmacoes(x,false);
    return Object.assign({},x,{conf,nivel:pvRelevancia(x,x.promessa,conf),env:pvEnvolvidos(x)});});
  const peso={alta:0,'média':1,contextual:2};
  curta.sort((a,b)=>(peso[a.nivel]-peso[b.nivel])||(b._rank-a._rank)||(a._dist-b._dist));
  // a ativação mais próxima da data lida sempre aparece entre as exibidas
  const maisPerto=curta.reduce((m,x)=>(!m||x._dist<m._dist)?x:m,null);
  if(maisPerto&&curta.indexOf(maisPerto)>3){
    const i=curta.indexOf(maisPerto); curta.splice(i,1); curta.splice(3,0,maisPerto);
  }
  return {lista:curta, idade, agora};
}
function pvChip(it,agora){
  const st=pvEstado(it,agora);
  return '<span class="pv-st '+st+'">'+({ativo:'ativo',proximo:'próximo',passado:'passado'}[st])+'</span>';
}
function pvCalcHTML(it){
  const F=pvFrame();
  const lin=(a,b)=>'<div class="pv-cr"><span>'+a+'</span><b>'+b+'</b></div>';
  const g=x=>(Math.round(x*1000)/1000).toFixed(3)+'°';
  if(it.tipo==='dir'){
    return '<div class="pv-calc">'
      +lin('Método','Placidus por semi-arcos')
      +lin('Chave',PV_KEYS[PV_KEY].lab+' — '+PV_KEYS[PV_KEY].nota)
      +lin('Sentido',it.sentido)
      +lin('Latitude geográfica',g(F.phi)+' ('+F.fonte+')')
      +lin('Obliquidade',g(F.eps))
      +lin('RAMC natal',g(F.ramc))
      +lin('Significador',it.sig.nm+' · λ '+g(it.sig.lon)+(it.sig.ra!=null?(' · AR '+g(it.sig.ra)+' · δ '+g(it.sig.dec)):''))
      +lin('Promissor',PT_NAME[it.prom.pl]+(it.prom.A?(' · '+it.prom.aspNome):'')+' · λ '+g(it.prom.lon)
          +' · β '+g(it.prom.lat)+' · AR '+g(it.prom.ra)+' · δ '+g(it.prom.dec))
      +lin('Polo do significador',g(it.polo))
      +lin('AO sob o polo',g(it.oaS)+' → '+g(it.oaP))
      +lin('Arco de direção',g(it.arc))
      +lin('Perfeição',pvIdadeTxt(it.anos)+' · '+fdate(it.data)+' (margem ±'+PV_MARG+' meses)')
      +'<p class="pv-nota">Comparação: a distância zodiacal simples entre os dois pontos daria '
        +g(adiff(it.sig.lon,it.prom.lon))+' — '+pvIdadeTxt(adiff(it.sig.lon,it.prom.lon)/PV_KEYS[PV_KEY].v)
        +'. A diferença vem da latitude do planeta, da declinação e do semi-arco.</p>'
      +'</div>';
  }
  const F2=pvFrame(), s=pvAmostra(it.anos,F2);
  return '<div class="pv-calc">'
    +lin('Método','Progressão secundária — 1 dia após o nascimento = 1 ano de vida')
    +lin('Data progredida',fdate(s.d)+' (nascimento + '+(Math.round(it.anos*10)/10)+' dias)')
    +lin('Ângulos progredidos','arco solar aplicado ao MC natal; Asc derivado do RAMC com a latitude do nascimento')
    +lin('Móvel',PV_MOV[it.mover]||it.mover)
    +(it.alvo?lin('Alvo natal',(PV_ALVO()[it.alvo]||{}).nm+' · λ '+g((PV_ALVO()[it.alvo]||{}).lon||0)):'')
    +lin('Posição no contato',g(s.lon[it.mover]||0))
    +lin('Perfeição',pvIdadeTxt(it.anos)+' · '+fdate(it.data))
    +'<p class="pv-nota">O passo de varredura é de 22 dias de vida, com refinamento por bisseção; '
      +'a data é aproximada dentro dessa janela.</p>'
    +'</div>';
}
function pvItemHTML(it,i,agora,principal){
  const tit=it.tipo==='dir'?pvDirTitulo(it):it.titulo;
  const sub=it.tipo==='dir'
    ? (it.sig.nm+' · '+(it.prom.A?it.prom.aspNome:'conjunção')+' · '+it.sentido)
    : (PV_MOV[it.mover]||'');
  const id='pv-'+it.tipo+'-'+i;
  const per=(it.tipo==='prog'&&it.classe==='casa')
    ? (()=>{const j=pvJanelaCasa(it.mover,it.casaNova,it.anos);return fdate(j.ini)+' – '+fdate(j.fim);})()
    : (pvIdadeTxt(it.anos)+' · '+fdate(it.data)+(it.tipo==='dir'?(' ±'+PV_MARG+' meses'):''));
  let h='<article class="pvc'+(principal?' main':'')+' n-'+it.nivel.replace('é','e')+'">'
    +'<header class="pvc-h"><b>'+tit+'</b>'+pvChip(it,agora)
    +'<em class="pvc-n">'+it.nivel+'</em></header>'
    +'<div class="pvc-r"><span>'+(it.tipo==='dir'?'Perfeição':'Período')+'</span><b>'+per+'</b></div>';
  if(principal){
    pvSintese(it).forEach(([k,v])=>{h+='<div class="pvc-s"><span>'+k+'</span><p>'+v+'</p></div>';});
    if(it.tipo==='dir')h+='<div class="pvc-s"><span>Condição</span><p>'+pvCondicaoNatal(it.prom.pl)+'</p></div>';
  } else {
    h+='<div class="pvc-r"><span>Temas</span><b>'+pvTemas(it.env)+'</b></div>'
      +'<div class="pvc-r"><span>Promessa</span><b>'+(it.promessa?it.promessa.pr.t:'—')+'</b></div>';
  }
  h+='<div class="pvc-b">'
    +'<button class="pv-lnk" data-pvcalc="'+id+'">Ver cálculo</button>'
    +(it.promessa?('<button class="pv-lnk" data-pvprom="'+it.promessa.pr.id+'">Ver promessa natal</button>'):'')
    +'</div>'
    +(PV_OPEN===id?pvCalcHTML(it):'')
    +'</article>';
  return h;
}
function pvLinhaHTML(lista,idade,agora){
  if(!lista.length)return '';
  const jan=PV_TAB==='dir'?12:8;
  const a0=idade-jan, a1=idade+jan;
  const pos=a=>Math.max(0,Math.min(100,(a-a0)/(a1-a0)*100));
  const pts=lista.slice(0,14).map(x=>'<i class="pv-dot '+pvEstado(x,agora)+'" style="left:'+pos(x.anos).toFixed(2)
    +'%" title="'+(x.tipo==='dir'?pvDirTitulo(x):x.titulo)+' — '+pvIdadeTxt(x.anos)+'"></i>').join('');
  return '<div class="pv-line"><span class="pv-lb">'+Math.round(a0)+' anos</span>'
    +'<div class="pv-track">'+pts+'<span class="pv-now" style="left:'+pos(idade).toFixed(2)+'%"></span></div>'
    +'<span class="pv-lb">'+Math.round(a1)+' anos</span></div>';
}
function renderPreditivas(){
  const el=$('pv-body'); if(!el)return;
  if(typeof NATAL==='undefined'||!NATAL){el.innerHTML='';return;}
  document.querySelectorAll('#pv-tabs [data-pvt]').forEach(b=>b.classList.toggle('on',b.dataset.pvt===PV_TAB));
  let R; try{R=pvItens();}catch(e){console.error('preditivas',e);el.innerHTML='<p class="note">não foi possível calcular as técnicas preditivas.</p>';return;}
  if(!R.lista.length){el.innerHTML='<p class="note">nenhum contato dentro da janela desta data.</p>';return;}
  const top=R.lista.slice(0,4).map(x=>{                        // trânsito só nos exibidos
    const conf=pvConfirmacoes(x,true);
    return Object.assign({},x,{conf,nivel:pvRelevancia(x,x.promessa,conf)});});
  const nota=PV_TAB==='dir'
    ? 'Direções primárias — cronologia da manifestação de promessas natais e de acontecimentos estruturais.'
    : 'Progressões secundárias — maturação interna, mudança de orientação e preparação subjetiva.';
  el.innerHTML='<p class="pv-int">'+nota+'</p>'
    +'<p class="pv-met">'+(PV_TAB==='dir'
        ?('Placidus por semi-arcos · chave '+PV_KEYS[PV_KEY].lab+' · margem ±'+PV_MARG+' meses')
        :('1 dia = 1 ano · ângulos por arco solar'))
      +' · latitude '+(Math.round(pvFrame().phi*100)/100)+'°</p>'
    +pvItemHTML(top[0],0,R.agora,true)
    +pvLinhaHTML(R.lista,R.idade,R.agora)
    +'<div class="pv-list">'+top.slice(1,4).map((x,i)=>pvItemHTML(x,i+1,R.agora,false)).join('')+'</div>';
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
  ['pv-key','pv-sent','pv-marg'].forEach(id=>{const s=$(id); if(!s)return;
    s.addEventListener('change',function(){
      if(id==='pv-key')PV_KEY=this.value;
      if(id==='pv-sent')PV_SENT=this.value;
      if(id==='pv-marg')PV_MARG=+this.value;
      PV_OPEN=null; renderPreditivas();});});
}
