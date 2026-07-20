/* ============================================================
   CHART.JS — construtor genérico: do texto colado à estrutura
   interpretativa completa. Define os globais que o resto usa:
   NATAL, BIRTH, FIRD, RS_DATA, RSMETA, ERA_TXT, OLAVO_PL,
   NATAL_ASP, PROMESSAS, STR, EL, MO, HAS, CHARTMETA.
   ============================================================ */
let NATAL=null, BIRTH=null, FIRD=[], RS_DATA={}, RSMETA={angular:{},echo:{}};
let ERA_TXT={}, OLAVO_PL={}, NATAL_ASP={}, PROMESSAS=[], STR={}, EL={}, MO={}, HAS={}, CHARTMETA={};

const n360=x=>{x%=360;return x<0?x+360:x;};
const adiff=(a,b)=>{let d=Math.abs(n360(a)-n360(b))%360;return d>180?360-d:d;};
const zfmt=L=>{const s=Math.floor(n360(L)/30),d=n360(L)%30;return SG[s]+' '+Math.floor(d)+'°'+String(Math.round((d%1)*60)).padStart(2,'0')+'′';};
const signOf=L=>Math.floor(n360(L)/30);
function termLord(L){const s=signOf(L),d=n360(L)%30;for(const [lim,p] of TERMS[s])if(d<lim)return p;return TERMS[s][4][1];}
function houseByRule(L,cusps){ // casa quadrante + regra dos 5°
  let h=1;
  for(let i2=0;i2<12;i2++){const a=cusps[i2],b=cusps[(i2+1)%12];
    if(a===null||b===null)continue;
    const span=n360(b-a),off=n360(L-a);
    if(off<span){h=i2+1;
      if(span-off<5) h=(i2+1)%12+1; // a menos de 5° da próxima cúspide
      break;}}
  return h;
}
function dignityOf(k,L,retro,sunLon){
  const s=signOf(L), tags=[];
  let pts=0;
  if(SIGN_RULER[s]===k){tags.push('domicílio');pts+=5;}
  else if(EXALT[k]===s){tags.push('exaltação');pts+=4;}
  else if(SIGN_RULER[(s+6)%12]===k){tags.push('exílio');pts-=4;}
  else if(FALL[k]===s){tags.push('queda');pts-=4;}
  const tl=termLord(L);
  if(tl===k){tags.push('termo próprio');pts+=1;} else tags.push('termo de '+(PT_GLYPH[tl]||tl));
  if(k!=='sun'&&sunLon!==undefined){const d=adiff(L,sunLon);
    if(d<0.28){tags.push('cazimi');pts+=2;}
    else if(d<8.5){tags.push('combusto');pts-=3;}}
  if(retro){tags.push('℞');pts-=1;}
  return {tags,pts,term:tl};
}
function aspectBetween(La,Lb){
  for(const [ang,gl,cls] of ASPECTS){
    const orb=ang===0||ang===180?8:ang===60?6:7;
    if(Math.abs(adiff(La,Lb)-ang)<=orb) return {ang,gl,cls,orb:Math.abs(adiff(La,Lb)-ang)};
  } return null;
}
/* ---------- construir NATAL a partir do parse ---------- */
function buildChart(parsed, birthISO, sectMode, name){
  const cusps=parsed.cusps.map(c=>c===null?0:c);
  const asc=parsed.asc, mcv=parsed.mc!==null?parsed.mc:cusps[9];
  BIRTH=new Date(birthISO).getTime();
  // seita
  const sunH=parsed.pts.sun.h||houseByRule(parsed.pts.sun.lon,cusps);
  let sect=sectMode&&sectMode!=='auto'?sectMode:(sunH>=7&&sunH<=12?'diurno':'noturno');
  FIRD=(sect==='diurno'?FIRD_DIURNAL:FIRD_NOCTURNAL).map(x=>x.slice());
  // lotes
  const sunL=parsed.pts.sun.lon, moonL=parsed.pts.moon.lon;
  const fortL=parsed.pts.fort?parsed.pts.fort.lon:n360(sect==='diurno'?asc+moonL-sunL:asc+sunL-moonL);
  const spiritL=n360(sect==='diurno'?asc+sunL-moonL:asc+moonL-sunL);
  // pontos com dignidades
  const pts={}, order=['sun','moon','mercury','venus','mars','jupiter','saturn','nn','sn','fort'];
  order.forEach(k=>{
    const src=parsed.pts[k]; if(!src&&k!=='fort')return;
    const lon=src?src.lon:fortL;
    const retro=src?src.retro:false;
    const h=houseByRule(lon,cusps);
    let dig='—';
    if(PT_NAME[k]){const d=dignityOf(k,lon,retro,sunL);dig=d.tags.join(' · ');STR[k]=Math.max(1,Math.min(8,4+d.pts+( [1,4,7,10].includes(h)?2:[2,5,8,11].includes(h)?1:0 )));}
    pts[k]={g:PT_GLYPH[k],nm:PT_FULL[k],lon,h,dig,retro,star:''};
  });
  pts.spirit={g:PT_GLYPH.spirit,nm:'Espírito',lon:spiritL,h:houseByRule(spiritL,cusps),dig:'regido por '+PT_NAME[SIGN_RULER[signOf(spiritL)]],star:''};
  // estrelas → anexar aos pontos / ângulos
  const angStars=[];
  (parsed.stars||[]).forEach(st=>{
    const gloss=STAR_MEANINGS[st.star]||null;
    const line=st.star+(st.orb!==null?(' '+Math.floor(st.orb)+'°'+String(Math.round((st.orb%1)*60)).padStart(2,'0')+'′'):'')+(gloss?(' — '+gloss):'');
    if(st.who==='asc'||st.who==='mc'||st.who==='ic'||st.who==='dsc') angStars.push([st.who.toUpperCase(),line]);
    else if(pts[st.who]) pts[st.who].star=(pts[st.who].star?pts[st.who].star+' · ':'')+line;
  });
  order.concat(['spirit']).forEach(k=>{if(pts[k]&&!pts[k].star)pts[k].star='—';});
  // regências das casas
  const rulers={}; for(let h=1;h<=12;h++) rulers[h]=SIGN_RULER[signOf(cusps[h-1])];
  // aspectos entre planetas (dos dados; completar por cálculo se não vieram)
  const PL=['sun','moon','mercury','venus','mars','jupiter','saturn'];
  let asp=(parsed.aspects||[]).slice();
  if(!asp.length){
    for(let a2=0;a2<PL.length;a2++)for(let b2=a2+1;b2<PL.length;b2++){
      if(!pts[PL[a2]]||!pts[PL[b2]])continue;
      const r=aspectBetween(pts[PL[a2]].lon,pts[PL[b2]].lon);
      if(r)asp.push({a:PL[a2],b:PL[b2],ang:r.ang,orb:r.orb,app:null});
    }
  }
  NATAL_ASP={}; HAS={};
  asp.forEach(x=>{
    const gl=ASPECTS.find(A=>A[0]===x.ang)[1], cls=ASPECTS.find(A=>A[0]===x.ang)[2];
    const line=gl+' '+PT_GLYPH[x.b]+' '+(x.orb!==null?x.orb.toFixed(2).replace('.','°').slice(0,5)+'′':'');
    (NATAL_ASP[x.a]=NATAL_ASP[x.a]||[]).push(gl+' '+PT_GLYPH[x.b]+(x.orb!==null?(' '+fmtOrb(x.orb)):''));
    (NATAL_ASP[x.b]=NATAL_ASP[x.b]||[]).push(gl+' '+PT_GLYPH[x.a]+(x.orb!==null?(' '+fmtOrb(x.orb)):''));
    HAS[x.a+'_'+x.b+'_'+cls]=true; HAS[x.b+'_'+x.a+'_'+cls]=true;
  });
  // recepções
  const receptions=[], recPairs={};
  asp.forEach(x=>{
    [[x.a,x.b],[x.b,x.a]].forEach(([g,hst])=>{ // hst hospeda g?
      const sg=signOf(pts[g].lon);
      if(SIGN_RULER[sg]===hst||EXALT[hst]===sg){
        receptions.push(PT_GLYPH[hst]+' recebe '+PT_GLYPH[g]+' ('+(SIGN_RULER[sg]===hst?'domicílio':'exaltação')+', '+ASPECTS.find(A=>A[0]===x.ang)[1]+')');
        recPairs[g]=recPairs[g]||[]; recPairs[g].push(hst);
        pts[g].dig+=' · recebido por '+PT_GLYPH[hst];
      }
    });
  });
  // recepção mútua
  Object.keys(recPairs).forEach(g=>{(recPairs[g]||[]).forEach(hst=>{
    if((recPairs[hst]||[]).includes(g)&&g<hst) receptions.push('recepção mútua: '+PT_GLYPH[g]+' ⇄ '+PT_GLYPH[hst]);
  });});
  // dispositores: cadeia e anéis / dispositor final
  const dispOf={}; PL.forEach(k=>{if(pts[k])dispOf[k]=SIGN_RULER[signOf(pts[k].lon)];});
  const finals=[],loops=[];
  PL.forEach(k=>{if(!pts[k])return;
    let cur=k,seen=[k];
    for(let s2=0;s2<9;s2++){const d=dispOf[cur];
      if(d===cur){if(!finals.includes(cur))finals.push(cur);break;}
      if(seen.includes(d)){const loop=seen.slice(seen.indexOf(d));if(loop.length>1&&!loops.find(l=>l.join()===loop.join()))loops.push(loop);break;}
      seen.push(d);cur=d;}
  });
  // elementos/modos ponderados (Asc, Sol, Lua, regente do Asc ×3)
  EL={fogo:0,terra:0,ar:0,'água':0}; MO={cardinal:0,fixo:0,'mutável':0};
  const w3=[['asc',asc],['sun',sunL],['moon',moonL],['ruler',pts[rulers[1]]?pts[rulers[1]].lon:asc]];
  w3.forEach(([_,L])=>{EL[SIGN_ELEM[signOf(L)]]+=3;MO[SIGN_MODE[signOf(L)]]+=3;});
  PL.forEach(k=>{if(pts[k]){EL[SIGN_ELEM[signOf(pts[k].lon)]]+=1;MO[SIGN_MODE[signOf(pts[k].lon)]]+=1;}});
  NATAL={sect,asc,mc:mcv,cusps,pts,rulers,houseTheme:HOUSE_SHORT,angStars,
    loop:loops[0]||[], meta:{receptions,finals,loops,name:name||'mapa',ascRuler:rulers[1]}};
  // textos derivados
  buildEraTexts(); buildAspLabels(); buildOlavoFallback(); buildPromises(); buildConteudoDyn();
  CHARTMETA.temper=temperTestimonies();
  return NATAL;
}
function fmtOrb(o){return Math.floor(o)+'°'+String(Math.round((o%1)*60)).padStart(2,'0')+'′';}
function ruledHousesOf(k){return Object.entries(NATAL.rulers).filter(([h,r])=>r===k).map(([h])=>+h);}
function buildEraTexts(){
  ERA_TXT={};
  FIRD.forEach(([k,nm])=>{
    if(!PT_NAME[k]){ERA_TXT[nm]=k==='nn'?'Acréscimo: capítulo breve de aumento nos assuntos da casa do Nodo Norte.':'Remissão: capítulo breve de soltura e síntese.';return;}
    const ru=ruledHousesOf(k), p=NATAL.pts[k];
    ERA_TXT[nm]='Regente natal da '+ru.map(h=>h+'ª ('+HOUSE_SHORT[h]+')').join(' e da ')+', posto na casa '+p.h+' ('+HOUSE_SHORT[p.h]+'), '+p.dig+': era governada por esses assuntos.';
  });
}
function buildAspLabels(){/* NATAL_ASP já montado em buildChart */}
function buildOlavoFallback(){
  // linha genérica por planeta-na-casa; a versão do corpus substitui via RAG quando disponível
  const NAT={sun:'a vontade e a identidade',moon:'o sentir e os hábitos',mercury:'a razão e a palavra',venus:'o afeto e o gosto',mars:'a força e o corte',jupiter:'a expansão e a fé',saturn:'o limite e a estrutura'};
  Object.keys(PT_NAME).forEach(k=>{
    const p=NATAL.pts[k]; if(!p)return;
    OLAVO_PL[k]=PT_NAME[k]+' na casa '+p.h+': '+NAT[k]+' operam no campo de '+HOUSE_SHORT[p.h]+' — '+OLAVO_CASA[p.h]+'.';
  });
  // tentar substituir pelo corpus (assíncrono, não bloqueia)
  if(typeof RAG!=='undefined'){
    RAG.load().then(()=>{
      const ROM=['','Casa I','Casa II','Casa III','Casa IV','Casa V','Casa VI','Casa VII','Casa VIII','Casa IX','Casa X','Casa XI','Casa XII'];
      Object.keys(PT_NAME).forEach(k=>{
        const p=NATAL.pts[k]; if(!p||!RAG.chunks||!RAG.chunks.length)return;
        const hit=RAG.chunks.find(c=>c.planeta===PT_NAME[k]&&c.casa===ROM[p.h]&&String(c.secao)==='interpretacao');
        if(hit){const t=(hit.texto||'').replace(/\s+/g,' ').trim();
          OLAVO_PL[k]=PT_NAME[k]+' na casa '+p.h+': '+t.slice(0,340)+(t.length>340?'…':'')+' [corpus]';}
      });
    });
  }
}
function buildPromises(){
  PROMESSAS=[];
  const yearsForHouses=hs=>{const out=[];const by=new Date(BIRTH).getUTCFullYear();
    for(let a=0;a<60&&out.length<8;a++){if(hs.includes(((a)%12)+1))out.push(by+a);}return out;};
  const add=(id,t,pl,casas,fat,cond)=>{
    PROMESSAS.push({id,t,pl,casas,fat,cond,
      ajuda:(NATAL.meta.receptions.filter(r=>r.includes(PT_GLYPH[pl])).join('; ')||'sem recepções detectadas'),
      impede:(NATAL.pts[pl].dig.includes('exílio')||NATAL.pts[pl].dig.includes('queda')?'debilidade essencial: cumpre com desconto e atraso':(NATAL.pts[pl].dig.includes('combusto')?'combustão: o tema queima perto da identidade':'poucos impedimentos essenciais')),
      tec:'profecções das casas '+casas.join(' e ')+'; era de firdária de '+PT_NAME[pl]+'; RS com '+PT_NAME[pl]+' angular',
      anos:yearsForHouses(casas)});
  };
  const ru1=NATAL.meta.ascRuler;
  add('regente-asc','O caminho do regente do Ascendente',ru1,[1,NATAL.pts[ru1].h],
    PT_NAME[ru1]+' rege o Ascendente e está na casa '+NATAL.pts[ru1].h+' ('+NATAL.pts[ru1].dig+'): a vida escoa da 1ª para '+HOUSE_SHORT[NATAL.pts[ru1].h]+'.',
    'Realiza-se quando as iniciativas pessoais são dirigidas conscientemente ao campo da casa '+NATAL.pts[ru1].h+'.');
  // planeta mais forte
  const best=Object.keys(STR).sort((a,b)=>STR[b]-STR[a])[0];
  if(best&&best!==ru1) add('mais-forte','O dom do planeta mais dignificado',best,[NATAL.pts[best].h].concat(ruledHousesOf(best)).slice(0,3),
    PT_NAME[best]+' é o ponto mais forte do mapa ('+NATAL.pts[best].dig+', força '+STR[best]+'/8) na casa '+NATAL.pts[best].h+'.',
    'Entrega visível pelos temas de '+HOUSE_SHORT[NATAL.pts[best].h]+' e das casas que rege.');
  // dispositor final
  (NATAL.meta.finals||[]).forEach(f=>{
    add('final-'+f,'A dispositora final: '+PT_NAME[f],f,[NATAL.pts[f].h].concat(ruledHousesOf(f)).slice(0,3),
      'Todas as cadeias de regência do mapa deságuam em '+PT_NAME[f]+' ('+NATAL.pts[f].dig+', casa '+NATAL.pts[f].h+').',
      'A economia psíquica inteira resolve-se pelos assuntos deste planeta: cultivá-lo é cultivar o mapa.');
  });
  // anel fechado
  if(NATAL.meta.loops.length){
    const L=NATAL.meta.loops[0];
    PROMESSAS.push({id:'anel',t:'O anel fechado de dispositores',pl:L[0],casas:L.map(k=>NATAL.pts[k].h),
      fat:'Circuito fechado: '+L.map(k=>PT_GLYPH[k]).join('→')+'→'+PT_GLYPH[L[0]]+' — nada escapa do circuito; tudo circula entre as casas '+L.map(k=>NATAL.pts[k].h).join(', ')+'.',
      cond:'Autossuficiência interna: crises e dons giram no anel até serem digeridos.',
      ajuda:'as recepções internas do anel',impede:'fechar-se no circuito sem saída externa',
      tec:'qualquer trânsito a um membro do anel move os demais',
      anos:[]});
  }
  // malefico contrário à seita
  const contrary=NATAL.sect==='diurno'?'mars':'saturn';
  if(NATAL.pts[contrary]) add('malefico','A prova do maléfico fora da seita',contrary,[NATAL.pts[contrary].h],
    PT_NAME[contrary]+' é o maléfico contrário à seita ('+NATAL.sect+'), na casa '+NATAL.pts[contrary].h+' ('+NATAL.pts[contrary].dig+'): o ponto de maior atrito recorrente.',
    'Administra-se com método: dar-lhe trabalho regular no campo de '+HOUSE_SHORT[NATAL.pts[contrary].h]+' antes que ele o tome à força.');
  PROMESSAS=PROMESSAS.slice(0,7);
}
function buildConteudoDyn(){
  const sp=NATAL.pts.spirit, spr=SIGN_RULER[signOf(sp.lon)];
  CONTEUDO.daimon='O <b>Lote do Espírito a '+zfmt(sp.lon)+' (casa '+sp.h+')</b> é o daimon deste mapa — o Eu-celeste a integrar. Seu regente é <b>'+PT_NAME[spr]+'</b>, no natal na casa '+NATAL.pts[spr].h+' ('+NATAL.pts[spr].dig+'): a missão vital passa por converter os assuntos da casa '+sp.h+' ('+HOUSE_SHORT[sp.h]+') na direção que esse regente aponta ('+HOUSE_SHORT[NATAL.pts[spr].h]+').';
  const su=NATAL.pts.sun, mo=NATAL.pts.moon;
  CONTEUDO.solLua='O <b>Sol</b> ('+zfmt(su.lon)+', casa '+su.h+', '+su.dig+') é a fonte de direção; a <b>Lua</b> ('+zfmt(mo.lon)+', casa '+mo.h+', '+mo.dig+') é a receptora que encarna. Mapa '+NATAL.sect+': '+(NATAL.sect==='diurno'?'o Sol preside — a identidade manda e o sentir serve.':'a Lua preside — o sentir conduz e a identidade amadurece ao longo da vida.')+(NATAL.meta.receptions.length?(' Recepções ativas: '+NATAL.meta.receptions.join('; ')+'.'):'');
}
function temperTestimonies(){
  const fx=[]; const Q={quente:0,frio:0,seco:0,'úmido':0};
  const add=(qs,w,label)=>{qs.forEach(q=>Q[q]+=w);fx.push([label,qs.join('-'),w]);};
  const sq=L=>SIGN_ELEM[signOf(L)];
  add(ELEMQ[sq(NATAL.asc)],3,'Asc em '+SIGNS[signOf(NATAL.asc)]);
  const ru=NATAL.meta.ascRuler;
  add(ELEMQ[sq(NATAL.pts[ru].lon)],3,'Regente do Asc ('+PT_NAME[ru]+') em '+SIGNS[signOf(NATAL.pts[ru].lon)]);
  Object.keys(PT_NAME).forEach(k=>{const p=NATAL.pts[k];if(p&&p.h===1)add(ELEMQ[sq(p.lon)],3,PT_NAME[k]+' na casa I');});
  add(ELEMQ[sq(NATAL.pts.moon.lon)],3,'Lua em '+SIGNS[signOf(NATAL.pts.moon.lon)]);
  const elong=n360(NATAL.pts.moon.lon-NATAL.pts.sun.lon);
  const ph=elong<90?['quente','úmido']:elong<180?['quente','seco']:elong<270?['frio','seco']:['frio','úmido'];
  add(ph,3,'Fase da Lua ('+Math.round(elong)+'° do Sol)');
  const season=[['quente','úmido'],['quente','seco'],['frio','seco'],['frio','úmido']][Math.floor(signOf(NATAL.pts.sun.lon)/3)];
  add(season,2,'Estação do Sol (hemisfério norte)');
  const lord=Object.keys(STR).sort((a,b)=>STR[b]-STR[a])[0];
  const PQ={sun:['quente','seco'],moon:['frio','úmido'],mercury:['frio','seco'],venus:['quente','úmido'],mars:['quente','seco'],jupiter:['quente','úmido'],saturn:['frio','seco']};
  add(PQ[lord],1,'Senhor da genitura: '+PT_NAME[lord]);
  const hot=Q.quente-Q.frio,dry=Q.seco-Q['úmido'];
  const humor=hot>=0?(dry>=0?'colérico':'sanguíneo'):(dry>=0?'melancólico':'fleumático');
  const total=Q.quente+Q.frio+Q.seco+Q['úmido'];
  return {Q,fx,hot,dry,humor,conf:Math.round(((Math.abs(hot)+Math.abs(dry))/total)*100),
    contra:fx.filter(f=>{const [h2,d2]=humor==='colérico'?['frio','úmido']:humor==='sanguíneo'?['frio','seco']:humor==='melancólico'?['quente','úmido']:['quente','seco'];return f[1].includes(h2)||f[1].includes(d2);})};
}
/* ---------- Revolução Solar: interpretação automática ---------- */
function addRS(parsed, year){
  const by=new Date(BIRTH).getUTCFullYear(), age=year-by;
  const p={signIdx:(signOf(NATAL.asc)+age)%12,houseN:(age%12)+1};
  p.lordKey=NATAL.rulers[p.houseN];
  const lord=NATAL.pts[p.lordKey];
  const rsAscHouseNatal=parsed.asc!==null?houseByRule(parsed.asc,NATAL.cusps):null;
  const notes=[], angular=[];
  // senhor do ano na RS
  const rsLord=parsed.pts[p.lordKey];
  if(rsLord){
    const d=dignityOf(p.lordKey,rsLord.lon,rsLord.retro,parsed.pts.sun?parsed.pts.sun.lon:undefined);
    notes.push('Senhor do Ano <b>'+PT_NAME[p.lordKey]+'</b> na RS: '+zfmt(rsLord.lon)+(rsLord.h?(', casa '+rsLord.h+' da RS'):'')+' ('+d.tags.join(' · ')+')'+(signOf(rsLord.lon)===signOf(lord.lon)?' — <b>repete o signo natal: promessa confirmada (Abu Mashar)</b>':''));
  } else notes.push('Senhor do Ano '+PT_NAME[p.lordKey]+' não consta nos dados da RS.');
  // planetas sobre pontos natais / retornos
  Object.entries(parsed.pts).forEach(([k,rp])=>{
    if(!PT_NAME[k])return;
    Object.entries(NATAL.pts).forEach(([nk,np])=>{
      if(nk==='spirit')return;
      const o=adiff(rp.lon,np.lon);
      if(k==='sun'&&nk==='sun')return;
      if(o<1.2) notes.push(PT_GLYPH[k]+' da RS sobre <b>'+np.nm+' natal</b> ('+fmtOrb(o)+')'+(k===nk?' — retorno ao próprio grau':''));
    });
    if(rp.h&&[1,4,7,10].includes(rp.h)) angular.push(k);
    if(k!=='sun'&&signOf(rp.lon)===signOf(NATAL.pts[k]?NATAL.pts[k].lon:-99)&&k!==p.lordKey)
      notes.push(PT_GLYPH[k]+' repete o signo natal na RS');
  });
  // aglomerados por casa da RS
  const byH={}; Object.entries(parsed.pts).forEach(([k,rp])=>{if(PT_NAME[k]&&rp.h){(byH[rp.h]=byH[rp.h]||[]).push(PT_GLYPH[k]);}});
  Object.entries(byH).forEach(([h,arr])=>{if(arr.length>=3)notes.push('Aglomerado na casa '+h+' da RS: '+arr.join(' ')+' — '+HOUSE_SHORT[h]+' concentram o ano');});
  // aspectos mais apertados
  const asps=(parsed.aspects||[]).filter(a=>a.orb!==null).sort((a,b)=>a.orb-b.orb).slice(0,3)
    .map(a=>PT_GLYPH[a.a]+ASPECTS.find(A=>A[0]===a.ang)[1]+PT_GLYPH[a.b]+' '+fmtOrb(a.orb));
  if(asps.length)notes.push('Aspectos mais apertados da RS: '+asps.join(' · '));
  // estrelas nos ângulos e no senhor
  const angSt=(parsed.stars||[]).filter(s=>['asc','mc','ic','dsc'].includes(s.who))
    .map(s=>s.who.toUpperCase()+' ☌ '+s.star+(STAR_MEANINGS[s.star]?(' — '+STAR_MEANINGS[s.star]):''));
  const lordSt=(parsed.stars||[]).filter(s=>s.who===p.lordKey).map(s=>PT_GLYPH[s.who]+' ☌ '+s.star+(STAR_MEANINGS[s.star]?(' — '+STAR_MEANINGS[s.star]):''));
  RSMETA.angular[year]=angular;
  RSMETA.echo[year]=(parsed.aspects||[]).map(a=>[a.a,a.b,a.ang]);
  RS_DATA[year]={
    asc:parsed.asc!==null?(zfmt(parsed.asc)+(rsAscHouseNatal?(' — cai na casa '+rsAscHouseNatal+' natal ('+HOUSE_SHORT[rsAscHouseNatal]+')'):'')):'Asc da RS não informado',
    destaque:notes.join('. ')+'.',
    estrelas:(angSt.concat(lordSt).join('; ')||'sem estrelas angulares informadas'),
    raw:parsed};
  return RS_DATA[year];
}
