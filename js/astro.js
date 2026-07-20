/* ============================================================
   ASTRO.JS — cálculo de mapa a partir de link do Aspectarian.
   O link contém tudo (data local, fuso IANA, lat, long, nome);
   em vez de raspar a página (bloqueada por CORS num site estático),
   o mapa é computado aqui com o Astronomy Engine embarcado:
   longitudes geocêntricas exatas + cúspides PLACIDUS + nodo médio.
   Somente planetas tradicionais (Sol–Saturno) + nodos + Fortuna.
   Também computa todas as Revoluções Solares desde o nascimento.
   ============================================================ */
const RAD=Math.PI/180, DEG=180/Math.PI;

/* ---------- fuso IANA → UTC (sem base de dados própria: usa Intl) ---------- */
function localToUTC(isoLocal, tz){
  // isoLocal: "1994-08-17T06:00" interpretado no fuso tz
  const [d,t]=isoLocal.split('T');
  const [Y,M,D]=d.split('-').map(Number), [h,mi]=t.split(':').map(Number);
  let guess=Date.UTC(Y,M-1,D,h,mi); // primeiro palpite: como se fosse UTC
  for(let i=0;i<3;i++){ // 2 iterações bastam; 3 por segurança (DST)
    const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
    const parts={}; f.formatToParts(new Date(guess)).forEach(p=>parts[p.type]=p.value);
    const shown=Date.UTC(+parts.year,+parts.month-1,+parts.day,parts.hour==='24'?0:+parts.hour,+parts.minute);
    const want=Date.UTC(Y,M-1,D,h,mi);
    if(shown===want)break;
    guess+=want-shown;
  }
  return new Date(guess);
}

/* ---------- obliquidade média da eclíptica ---------- */
function obliquity(date){
  const T=(date.getTime()-Date.UTC(2000,0,1,12))/86400000/36525;
  return 23.4392911-0.0130042*T;
}

/* ---------- RAMC (ascensão reta do meio-céu) ---------- */
function ramcOf(date, lonEast){
  const gstHours=Astronomy.SiderealTime(date);      // GAST em horas
  return n360(gstHours*15 + lonEast);               // graus; longitude leste positiva
}

/* ---------- MC e Ascendente ---------- */
function mcFromRAMC(ramc, eps){
  return n360(Math.atan2(Math.sin(ramc*RAD), Math.cos(ramc*RAD)*Math.cos(eps*RAD))*DEG);
}
function ascFromRAMC(ramc, eps, lat){
  const asc=Math.atan2(Math.cos(ramc*RAD), -(Math.sin(ramc*RAD)*Math.cos(eps*RAD)+Math.tan(lat*RAD)*Math.sin(eps*RAD)))*DEG;
  return n360(asc);
}

/* ---------- cúspides PLACIDUS (semiarcos, iterativo) ----------
   11ª: AR = RAMC + 30 + AD/3      12ª: AR = RAMC + 60 + 2AD/3
    2ª: AR = RAMC + 120 + 2AD/3     3ª: AR = RAMC + 150 + AD/3
   com AD = asin(tanφ·tanδ) do próprio ponto; converge em poucas iterações. */
function lonFromRA(ra, eps){ // longitude eclíptica do ponto da eclíptica com dada ascensão reta
  return n360(Math.atan2(Math.sin(ra*RAD)/Math.cos(eps*RAD), Math.cos(ra*RAD))*DEG);
}
function placidusCusp(ramc, eps, lat, base, frac){
  let ad=0, lon=0;
  for(let i=0;i<20;i++){
    const ra=n360(ramc+base+frac*ad);
    lon=lonFromRA(ra,eps);
    const dec=Math.asin(Math.sin(eps*RAD)*Math.sin(lon*RAD))*DEG;
    const x=Math.tan(lat*RAD)*Math.tan(dec*RAD);
    const ad2=Math.asin(Math.max(-1,Math.min(1,x)))*DEG;
    if(Math.abs(ad2-ad)<1e-7)break;
    ad=ad2;
  }
  return lon;
}
function placidusCusps(date, lat, lonEast){
  const eps=obliquity(date), ramc=ramcOf(date,lonEast);
  const mc=mcFromRAMC(ramc,eps), asc=ascFromRAMC(ramc,eps,lat);
  const c=new Array(12).fill(null);
  c[0]=asc; c[9]=mc;
  c[10]=placidusCusp(ramc,eps,lat,30,1/3);   // 11ª
  c[11]=placidusCusp(ramc,eps,lat,60,2/3);   // 12ª
  c[1]=placidusCusp(ramc,eps,lat,120,2/3);   // 2ª
  c[2]=placidusCusp(ramc,eps,lat,150,1/3);   // 3ª
  c[3]=n360(mc+180); c[6]=n360(asc+180);     // IC · DSC
  c[4]=n360(c[10]+180); c[5]=n360(c[11]+180);// 5ª · 6ª (opostas 11/12)
  c[7]=n360(c[1]+180); c[8]=n360(c[2]+180);  // 8ª · 9ª (opostas 2/3)
  return {cusps:c, asc, mc, eps, ramc};
}

/* ---------- longitudes geocêntricas (planetas tradicionais) ---------- */
const AE_BODY={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn'};
function geoLon(bodyKey, date){
  const v=Astronomy.GeoVector(Astronomy.Body[AE_BODY[bodyKey]], date, true);
  return n360(Astronomy.Ecliptic(v).elon);
}
function isRetro(bodyKey, date){
  if(bodyKey==='sun'||bodyKey==='moon')return false;
  const a=geoLon(bodyKey,new Date(date.getTime()-43200000)), b=geoLon(bodyKey,new Date(date.getTime()+43200000));
  let s=b-a; if(s>180)s-=360; if(s<-180)s+=360;
  return s<0;
}
function meanNode(date){ // nodo lunar médio (☊)
  const d=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;
  return n360(125.04452-0.05295377*d);
}

/* ---------- mapa completo num instante/lugar ---------- */
function computeChart(date, lat, lonEast){
  const H=placidusCusps(date,lat,lonEast);
  const pts={};
  Object.keys(AE_BODY).forEach(k=>{pts[k]={lon:geoLon(k,date),retro:isRetro(k,date)};});
  const nn=meanNode(date);
  pts.nn={lon:nn,retro:false}; pts.sn={lon:n360(nn+180),retro:false};
  Object.values(pts).forEach(p=>{p.h=houseByRule(p.lon,H.cusps);});
  return {pts,cusps:H.cusps,asc:H.asc,mc:H.mc,date};
}

/* ---------- serialização no formato de texto do app ----------
   Gera o mesmo formato aceito no textarea, para que salvar/backup/
   restaurar continuem funcionando sem caminho especial. */
function chartToText(ch){
  const SGG='♈♉♊♋♌♍♎♏♐♑♒♓';
  const dm=L=>{const d=n360(L)%30;return Math.floor(d)+'°'+String(Math.round((d%1)*60)).padStart(2,'0')+'′';};
  const sg=L=>SGG[Math.floor(n360(L)/30)];
  const lines=[];
  const CUSP_LBL={1:'H1 - Asc',4:'H4 - IC',7:'H7 - Dsc',10:'H10 - MC'};
  for(let h=1;h<=12;h++){lines.push(CUSP_LBL[h]||('H'+h));lines.push(sg(ch.cusps[h-1]));lines.push(dm(ch.cusps[h-1]));lines.push('');}
  const PGL={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',nn:'☊',sn:'☋'};
  Object.entries(PGL).forEach(([k,g])=>{
    const p=ch.pts[k]; if(!p)return;
    lines.push(g);lines.push(sg(p.lon));lines.push(dm(p.lon));
    if(p.retro)lines.push('℞');
    lines.push('H'+p.h);lines.push('');
  });
  return lines.join('\n');
}

/* ---------- Revolução Solar: instante exato do retorno ---------- */
function solarReturnInstant(natalSunLon, year, approxMonth, approxDay){
  // busca por Newton a partir do aniversário aproximado
  let t=Date.UTC(year,approxMonth-1,approxDay,12);
  for(let i=0;i<12;i++){
    const L=geoLon('sun',new Date(t));
    let diff=natalSunLon-L; while(diff>180)diff-=360; while(diff<-180)diff+=360;
    if(Math.abs(diff)<1e-6/3600)break;
    const spd=0.9856; // °/dia (suficiente para Newton; refinado pelas iterações)
    t+=diff/spd*86400000;
  }
  return new Date(t);
}

/* ---------- parse do link do Aspectarian ---------- */
function parseAspectarianURL(url){
  let u;
  try{u=new URL(url.trim());}catch(e){return {ok:false,err:'link inválido — cole a URL completa do Aspectarian'};}
  const q=u.searchParams;
  const date=q.get('date'), lat=parseFloat(q.get('lat')), lon=parseFloat(q.get('long')), tz=q.get('t')||'UTC';
  const name=q.get('name')||q.get('n')||'mapa';
  if(!date||isNaN(lat)||isNaN(lon))return {ok:false,err:'o link precisa conter date, lat e long'};
  return {ok:true,date,lat,lon,tz,name};
}

/* ---------- orquestrador: link → natal + todas as RS ---------- */
function importAspectarian(url, onProgress){
  const P=parseAspectarianURL(url);
  if(!P.ok)return Promise.reject(new Error(P.err));
  if(typeof Astronomy==='undefined')return Promise.reject(new Error('motor astronômico não carregou — recarregue a página'));
  return new Promise(resolve=>{
    const utc=localToUTC(P.date,P.tz);
    const natal=computeChart(utc,P.lat,P.lon);
    const natalText=chartToText(natal);
    const birthISO=utc.toISOString().slice(0,16);
    // Revoluções Solares: do primeiro aniversário até o ano corrente
    const sunLon=natal.pts.sun.lon;
    const by=utc.getUTCFullYear(), bm=utc.getUTCMonth()+1, bd=utc.getUTCDate();
    const nowY=new Date().getUTCFullYear();
    const rsTexts={};
    let y=by+1;
    const step=()=>{
      const t0=performance.now();
      while(y<=nowY && performance.now()-t0<40){ // fatias de ~40ms para não travar a UI
        const inst=solarReturnInstant(sunLon,y,bm,bd);
        rsTexts[y]=chartToText(computeChart(inst,P.lat,P.lon));
        y++;
      }
      if(onProgress)onProgress(Math.min(1,(y-by-1)/Math.max(1,nowY-by)));
      if(y<=nowY)setTimeout(step,0);
      else resolve({name:P.name,birthISO,natalText,rsTexts,place:{lat:P.lat,lon:P.lon,tz:P.tz}});
    };
    step();
  });
}
