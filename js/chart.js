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
/* ---------- regra dos 5°: posição liminar graduada ----------
   Um planeta a menos de 5° da cúspide seguinte NÃO troca simplesmente de casa:
   participa fortemente da casa seguinte (main) e conserva a anterior como fundo (back).
   O peso da casa seguinte cresce com a proximidade da cúspide:
   0–1° ≈ 0.95–0.88 (quase integral) · 1–3° ≈ 0.88–0.74 (muito forte) ·
   3–5° ≈ 0.74–0.60 (compartilhada, predominância moderada). Interpolação linear contínua. */
function liminalOf(L,cusps){
  for(let i2=0;i2<12;i2++){const a=cusps[i2],b=cusps[(i2+1)%12];
    if(a===null||b===null)continue;
    const span=n360(b-a),off=n360(L-a);
    if(off<span){
      const dist=span-off;
      if(dist<5) return {main:(i2+1)%12+1, back:i2+1, w:0.95-(dist/5)*0.35, dist};
      return {main:i2+1, back:null, w:1, dist:null};
    }}
  return {main:1,back:null,w:1,dist:null};
}
function houseByRule(L,cusps){ // casa funcional (quadrante + regra dos 5°)
  return liminalOf(L,cusps).main;
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
  // força acidental: angular +2 · sucedente +1 · cadente 0 · casas 6/8/12 penalizam (−2)
  const angBonus=h=>([1,4,7,10].includes(h)?2:[2,5,8,11].includes(h)?1:0)-([6,8,12].includes(h)?2:0);
  order.forEach(k=>{
    const src=parsed.pts[k]; if(!src&&k!=='fort')return;
    const lon=src?src.lon:fortL;
    const retro=src?src.retro:false;
    const lim=liminalOf(lon,cusps);
    const h=lim.main;
    let dig='—';
    if(PT_NAME[k]){const d=dignityOf(k,lon,retro,sunL);dig=d.tags.join(' · ');
      // ponderação liminar: casa principal pesa w, a de fundo pesa 1-w
      let acc=lim.back?lim.w*angBonus(lim.main)+(1-lim.w)*angBonus(lim.back):angBonus(h);
      // colado num ângulo (≤3° da cúspide angular): mais forte que estar apenas dentro da casa
      if(lim.back&&[1,4,7,10].includes(lim.main)&&lim.dist<=3) acc+=1;
      STR[k]=Math.max(1,Math.min(8,4+d.pts+Math.round(acc)));}
    pts[k]={g:PT_GLYPH[k],nm:PT_FULL[k],lon,h,hBack:lim.back,limW:lim.w,limDist:lim.dist,dig,retro,star:''};
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
  // estrelas violentas derrubam força; reais protetoras somam — o senhor da genitura
  // exige dignidade essencial E acidental (Vênus domiciliada na 12ª ☌ Algol não preside)
  const STAR_MALUS={'Algol':-2,'Scheat':-1,'Alphard':-1,'Antares':-1};
  const STAR_BONUS={'Regulus':1,'Spica':1};
  Object.keys(PT_NAME).forEach(k=>{
    const p=pts[k]; if(!p||!p.star||p.star==='—')return;
    Object.entries(STAR_MALUS).forEach(([s,v])=>{if(p.star.includes(s))STR[k]=Math.max(1,(STR[k]||4)+v);});
    Object.entries(STAR_BONUS).forEach(([s,v])=>{if(p.star.includes(s))STR[k]=Math.min(8,(STR[k]||4)+v);});
  });
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
  /* pesos fixos da técnica:
     planeta na cúspide da 1 = 3 (assume a casa; ≥ Ascendente)
     Ascendente = 2 · regente do Ascendente = 3 · planetas dentro da 1 = 2
     Lua = 3 · fase da Lua = 1 · senhor da genitura = 1,5 · estação do Sol = 0,5.
     O planeta contribui a PRÓPRIA natureza, sustentada no signo em que está. */
  const PQUAL={sun:['quente','seco'],moon:['frio','úmido'],mercury:['frio','seco'],venus:['quente','úmido'],mars:['quente','seco'],jupiter:['quente','úmido'],saturn:['frio','seco']};
  add(ELEMQ[sq(NATAL.asc)],2,'Ascendente em '+SIGNS[signOf(NATAL.asc)]+' · peso 2');
  const ru=NATAL.meta.ascRuler;
  add(ELEMQ[sq(NATAL.pts[ru].lon)],3,'Regente do Ascendente ('+PT_NAME[ru]+') em '+SIGNS[signOf(NATAL.pts[ru].lon)]+' · peso 3');
  Object.keys(PT_NAME).forEach(k=>{const p=NATAL.pts[k];if(!p)return;
    const dAsc=adiff(p.lon,NATAL.asc);
    let w1=0,lbl='';
    if(dAsc<=5){w1=3;lbl='na cúspide da casa 1 ('+fmtOrb(dAsc)+' do Ascendente): assume a casa · peso 3';}
    else if(p.h===1){w1=2;lbl='dentro da casa 1 · peso 2';}
    else if(p.hBack===1){w1=1;lbl='casa 1 ao fundo (regra dos 5°) · peso 1';}
    if(w1>0){
      add(PQUAL[k],w1,PT_NAME[k]+' '+lbl+' — imprime a própria natureza');
      add(ELEMQ[sq(p.lon)],w1/3,PT_NAME[k]+' sustentado pelo signo de '+SIGNS[signOf(p.lon)]);
    }});
  add(ELEMQ[sq(NATAL.pts.moon.lon)],3,'Lua em '+SIGNS[signOf(NATAL.pts.moon.lon)]+' · peso 3');
  const elong=n360(NATAL.pts.moon.lon-NATAL.pts.sun.lon);
  const ph=elong<90?['quente','úmido']:elong<180?['quente','seco']:elong<270?['frio','seco']:['frio','úmido'];
  add(ph,1,'Fase da Lua ('+Math.round(elong)+'° do Sol) · peso 1');
  const season=[['quente','úmido'],['quente','seco'],['frio','seco'],['frio','úmido']][Math.floor(signOf(NATAL.pts.sun.lon)/3)];
  add(season,0.5,'Estação do Sol · peso 0,5');
  const lord=Object.keys(STR).sort((a,b)=>STR[b]-STR[a])[0];
  add(PQUAL[lord],1.5,'Senhor da genitura: '+PT_NAME[lord]+' · peso 1,5');
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
  // Ascendente da RS em frase completa: signo → regente → casa natal onde cai
  let ascTxt;
  if(parsed.asc!==null){
    const ascSg=signOf(parsed.asc), ascRuler=SIGN_RULER[ascSg];
    const rsRulerPos=parsed.pts[ascRuler];
    ascTxt='A Revolução nasce com o <b>Ascendente em '+SIGNS[ascSg]+'</b>; quem governa o ano da Revolução é <b>'+PT_NAME[ascRuler]+'</b>'
      +(rsRulerPos?(', que está em '+SIGNS[signOf(rsRulerPos.lon)]+(rsRulerPos.h?(', casa '+rsRulerPos.h+' da própria Revolução'):'')):'')+'.'
      +(rsAscHouseNatal?(' Esse Ascendente cai na <b>casa '+rsAscHouseNatal+' natal</b> — '+HOUSE_BLUNT[rsAscHouseNatal]+'. É por aí que o ano entra.'):'');
  } else ascTxt='O Ascendente da Revolução não consta nos dados.';
  // Senhor do Ano (pela profecção), sem rodeio
  const rsLord=parsed.pts[p.lordKey];
  if(rsLord){
    const d=dignityOf(p.lordKey,rsLord.lon,rsLord.retro,parsed.pts.sun?parsed.pts.sun.lon:undefined);
    notes.push('Pela profecção, o ano ativa a casa '+p.houseN+' — '+HOUSE_BLUNT[p.houseN]+' — e o Senhor do Ano é o regente de '+SIGNS[p.signIdx]+', <b>'+PT_NAME[p.lordKey]+'</b>. Na Revolução ele está em '+SIGNS[signOf(rsLord.lon)]+(rsLord.h?(', casa '+rsLord.h):'')+', '+d.tags.join(', ')
      +(signOf(rsLord.lon)===signOf(lord.lon)?' — e <b>repete o signo natal</b>: promessa confirmada para este ano':'')+'.');
  } else notes.push('Pela profecção, o Senhor do Ano é '+PT_NAME[p.lordKey]+', mas ele não consta nos dados da Revolução.');
  // planetas da RS sobre pontos natais / retornos ao próprio grau
  Object.entries(parsed.pts).forEach(([k,rp])=>{
    if(!PT_NAME[k])return;
    Object.entries(NATAL.pts).forEach(([nk,np])=>{
      if(nk==='spirit')return;
      const o=adiff(rp.lon,np.lon);
      if(k==='sun'&&nk==='sun')return;
      if(o<1.2) notes.push(PT_NAME[k]+' da Revolução pousa exatamente sobre '+(k===nk?('o próprio lugar natal — <b>retorno de '+PT_NAME[k]+' ao grau de nascimento</b>'):('<b>'+np.nm+' natal</b>'))+' (distância de '+fmtOrb(o)+'): o que esse ponto promete no mapa é convocado neste ano');
    });
    if(rp.h&&[1,4,7,10].includes(rp.h)) angular.push(k);
    if(k!=='sun'&&signOf(rp.lon)===signOf(NATAL.pts[k]?NATAL.pts[k].lon:-99)&&k!==p.lordKey)
      notes.push(PT_NAME[k]+' volta ao signo que ocupa no natal — reforço da promessa desse planeta no ano');
  });
  // aglomerados por casa da RS
  const byH={}; Object.entries(parsed.pts).forEach(([k,rp])=>{if(PT_NAME[k]&&rp.h){(byH[rp.h]=byH[rp.h]||[]).push(PT_NAME[k]);}});
  Object.entries(byH).forEach(([h,arr])=>{if(arr.length>=3)notes.push('Três ou mais planetas ('+arr.join(', ')+') concentram-se na casa '+h+' da Revolução: o ano converge para '+HOUSE_SHORT[h]);});
  // aspectos mais apertados
  const asps=(parsed.aspects||[]).filter(a=>a.orb!==null).sort((a,b)=>a.orb-b.orb).slice(0,3)
    .map(a=>PT_NAME[a.a]+' '+({harm:'em harmonia com',tens:'em tensão com',conj:'em conjunção com'})[ASPECTS.find(A=>A[0]===a.ang)[2]]+' '+PT_NAME[a.b]+' ('+fmtOrb(a.orb)+')');
  if(asps.length)notes.push('Os aspectos mais exatos da Revolução: '+asps.join('; '));
  // estrelas nos ângulos e no senhor
  const angSt=(parsed.stars||[]).filter(s=>['asc','mc','ic','dsc'].includes(s.who))
    .map(s=>'o '+s.who.toUpperCase()+' da Revolução em conjunção com a estrela '+s.star+(STAR_MEANINGS[s.star]?(' — '+STAR_MEANINGS[s.star]):''));
  const lordSt=(parsed.stars||[]).filter(s=>s.who===p.lordKey).map(s=>PT_NAME[s.who]+' em conjunção com a estrela '+s.star+(STAR_MEANINGS[s.star]?(' — '+STAR_MEANINGS[s.star]):''));
  RSMETA.angular[year]=angular;
  RSMETA.echo[year]=(parsed.aspects||[]).map(a=>[a.a,a.b,a.ang]);
  RS_DATA[year]={
    asc:ascTxt,
    destaque:notes.join('. ')+'.',
    estrelas:(angSt.concat(lordSt).join('; ')||'sem estrelas nos ângulos da Revolução'),
    raw:parsed};
  return RS_DATA[year];
}
