/* ============================================================
   TRANSITOS.JS — mandala bi-roda (natal dentro · trânsito fora)
   Clicar num planeta abre o card do que ele significa.
   ============================================================ */
let TR_CURSOR=new Date();
let TR_VIEW='both';                    // 'natal' | 'trans' | 'both'
let TR_SEL=null;                       // {side:'n'|'t', k:'sun'|'asc'|'mc'}

const TR_COL={nat:'43,35,22', tra:'138,109,58'};   // marfim = natal · ouro = trânsito
const TR_ASPCOL={harm:'58,74,128', tens:'154,75,63', conj:'138,109,58'};

function trDate(){return TR_CURSOR;}
function trLons(d){                    // longitudes transitantes do momento
  const o={}; TB.forEach(([bn,key])=>{o[key]=tlon(bn,d);}); return o;
}
/* separa visualmente pontos colados, preservando a ordem no zodíaco */
function trSpread(items,minSep){
  if(!items.length)return items;
  const a=items.slice().sort((x,y)=>x.lon-y.lon).map(x=>Object.assign({},x,{disp:x.lon}));
  for(let pass=0;pass<3;pass++){
    for(let i=1;i<a.length;i++){const gap=a[i].disp-a[i-1].disp;
      if(gap<minSep)a[i].disp=a[i-1].disp+minSep;}
    // fecha o círculo: o último não pode invadir o primeiro
    const volta=(a[0].disp+360)-a[a.length-1].disp;
    if(volta<minSep){const empurra=(minSep-volta)/2;
      a[0].disp+=empurra; for(let i=a.length-1;i>=1;i--)a[i].disp-=empurra;}
  }
  return a;
}

/* ---------------- a mandala ---------------- */
function trWheelSVG(){
  const svg=$('tr-wheel'); if(!svg||!NATAL)return '';
  const W=Math.max(280,svg.clientWidth||640), H=W, CX=W/2, CY=H/2, RAD=Math.PI/180;
  const M=W/2, u=M/320;
  const fs=(v,min)=>Math.max(min==null?6.5:min,Math.round(v*u*10)/10);
  // raios como frações do raio total: nunca se invertem em telas estreitas
  const rZod=M*0.955, rZin=M*0.868,
        rTr =M*0.788,                              // anel dos transitantes
        rHoO=M*0.714,                              // limite externo das casas
        rHoI=M*0.614,                              // limite interno das casas
        rNat=M*0.534,                              // anel natal
        rAsp=M*0.460;                              // círculo dos aspectos
  const ang=L=>180+(L-NATAL.asc);                  // Ascendente à esquerda
  const P=(L,r)=>{const a=ang(L)*RAD;return [CX+r*Math.cos(a), CY-r*Math.sin(a)];};
  const d=trDate(), TL=trLons(d);
  const verNat=TR_VIEW!=='trans', verTra=TR_VIEW!=='natal';
  let s='<defs><filter id="trg" x="-60%" y="-60%" width="220%" height="220%">'
    +'<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<radialGradient id="trc"><stop offset="0%" stop-color="#e4d9bb"/><stop offset="100%" stop-color="#ddd0ae"/></radialGradient></defs>';
  const circ=(r,st,w)=>'<circle cx="'+CX+'" cy="'+CY+'" r="'+r+'" fill="none" stroke="'+st+'" stroke-width="'+(w||1)+'"/>';
  s+=circ(rZod,'rgba(58,47,30,.32)')+circ(rZin,'rgba(58,47,30,.22)')
    +circ(rHoO,'rgba(58,47,30,.15)')+circ(rHoI,'rgba(58,47,30,.15)');
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+rAsp+'" fill="url(#trc)" stroke="rgba(58,47,30,.12)"/>';

  /* faixa zodiacal */
  for(let i=0;i<12;i++){
    const [x1,y1]=P(i*30,rZod), [x2,y2]=P(i*30,rZin);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(58,47,30,.26)"/>';
    const [gx,gy]=P(i*30+15,(rZod+rZin)/2), f=fs(15,10);
    s+='<text x="'+gx+'" y="'+(gy+f*0.35)+'" text-anchor="middle" font-size="'+f+'" fill="rgba(45,37,24,.75)">'+(SIGN_GLYPHS[i]||'')+'︎</text>';
  }
  /* cúspides e números das casas do mapa natal */
  for(let h=0;h<12;h++){
    const L=NATAL.cusps[h], eixo=(h%3===0);
    const [x1,y1]=P(L,rAsp), [x2,y2]=P(L,eixo?rZin:rHoO);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(58,47,30,'+(eixo?'.5':'.16')+')" stroke-width="'+(eixo?1.2:1)+'"/>';
    const meio=L+(n360(NATAL.cusps[(h+1)%12]-L)||30)/2;
    const [mx,my]=P(meio,(rHoO+rHoI)/2), f=fs(11,8);
    s+='<text x="'+mx+'" y="'+(my+f*0.35)+'" text-anchor="middle" font-size="'+f+'" font-family="IBM Plex Mono" fill="rgba(45,37,24,.55)">'+(h+1)+'</text>';
  }
  /* aspectos entre planetas natais — as linhas do miolo */
  if(verNat){
    const ks=Object.keys(PT_NAME).filter(k=>NATAL.pts[k]);
    for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){
      const A=NATAL.pts[ks[i]].lon, B=NATAL.pts[ks[j]].lon, sep=adiff(A,B);
      for(const [a0,gl,cls,vb,orb] of ASPECTS){
        if(Math.abs(sep-a0)<=orb*0.75){
          const [x1,y1]=P(A,rAsp), [x2,y2]=P(B,rAsp);
          const op=(0.60-Math.abs(sep-a0)/(orb*3.2)).toFixed(3);
          s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba('+TR_ASPCOL[cls]+','+op+')" stroke-width="'+(a0===0?1.2:1)+'"/>';
          break;
        }}}
  }
  /* marcador do planeta: tique no grau exato + disco deslocado */
  const marca=(side,k,lon,disp,r,rTick,on)=>{
    const col=side==='t'?TR_COL.tra:TR_COL.nat;
    const [tx,ty]=P(lon,rTick), [t2x,t2y]=P(disp,r+(side==='t'?-1:1)*0);
    const [x,y]=P(disp,r), rd=fs(12.5,9), f=fs(13,9.5);
    const grau=Math.floor(n360(lon)%30);
    return '<g class="trpl'+(on?' on':'')+'" data-tp="'+side+':'+k+'" style="cursor:pointer">'
      +'<line x1="'+tx+'" y1="'+ty+'" x2="'+t2x+'" y2="'+t2y+'" stroke="rgba('+col+',.22)"/>'
      +'<circle cx="'+x+'" cy="'+y+'" r="'+rd+'" fill="#ddd0ae" stroke="rgba('+col+','+(on?'.9':'.42')+')" stroke-width="'+(on?1.6:1)+'"'+(on?' filter="url(#trg)"':'')+'/>'
      +'<text x="'+x+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" fill="rgba('+col+','+(on?'1':'.9')+')" style="pointer-events:none">'+(PT_GLYPH[k]||'')+'︎</text>'
      +'<text x="'+x+'" y="'+(y+rd+fs(9,7))+'" text-anchor="middle" font-size="'+fs(7.5,6)+'" font-family="IBM Plex Mono" fill="rgba('+col+',.45)" style="pointer-events:none">'+grau+'°</text>'
      +'<title>'+PT_NAME[k]+' '+(side==='t'?'em trânsito':'natal')+' · '+zfmt(lon)+'</title></g>';
  };
  /* anel natal */
  if(verNat){
    const its=Object.keys(PT_NAME).filter(k=>NATAL.pts[k]).map(k=>({k,lon:NATAL.pts[k].lon}));
    trSpread(its,fs(11,9)).forEach(it=>{
      s+=marca('n',it.k,it.lon,it.disp,rNat,rHoI,TR_SEL&&TR_SEL.side==='n'&&TR_SEL.k===it.k);});
  }
  /* anel de trânsito */
  if(verTra){
    const its=Object.keys(PT_NAME).map(k=>({k,lon:TL[k]}));
    trSpread(its,fs(11,9)).forEach(it=>{
      s+=marca('t',it.k,it.lon,it.disp,rTr,rZin,TR_SEL&&TR_SEL.side==='t'&&TR_SEL.k===it.k);});
  }
  /* ângulos */
  [['ASC',NATAL.asc,'asc'],['MC',NATAL.mc,'mc'],['DSC',n360(NATAL.asc+180),null],['IC',n360(NATAL.mc+180),null]]
    .forEach(([nm,L,key])=>{
      const [x,y]=P(L,rZod+fs(11,8)), f=fs(8.5,6.5);
      const on=key&&TR_SEL&&TR_SEL.side==='n'&&TR_SEL.k===key;
      s+='<text x="'+x+'" y="'+(y+f*0.35)+'" text-anchor="middle" font-size="'+f+'" font-family="IBM Plex Mono" '
        +'letter-spacing="'+Math.max(.8,1.4*u)+'" fill="rgba(45,37,24,'+(on?'.95':'.6')+')"'
        +(key?(' class="trpl'+(on?' on':'')+'" data-tp="n:'+key+'" style="cursor:pointer"'):'')+'>'+nm+'</text>';
    });
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  return s;
}

/* ---------------- cards de leitura ---------------- */
function trNatalFrase(k){
  const p=NATAL.pts[k]; if(!p)return '';
  const ru=ruledHouses(k), occ=p.h;
  if(!ru.length)return 'Sem regência de casa neste mapa; atua sobretudo pela casa onde está.';
  if(ru.length===1&&ru[0]===occ)return 'O nativo tende a fazer de '+casaTag(occ)+' o campo central da própria vida.';
  if(ru.includes(occ))return 'O nativo tende a viver '+casasTag(ru)+' como um mesmo campo, realizado em '+casaTag(occ)+'.';
  return 'O nativo tende a realizar '+casasTag(ru)+' por meio de '+casaTag(occ)+'.';
}
function trLinha(k,v){return '<div class="trl"><span>'+k+'</span><b>'+v+'</b></div>';}

function trCardNatal(k){
  const d=trDate(), S=(typeof tempoState==='function')?tempoState(d):null;
  if(k==='asc'||k==='mc'){
    const L=k==='asc'?NATAL.asc:NATAL.mc, nm=k==='asc'?'Ascendente':'Meio do Céu';
    const rul=k==='asc'?NATAL.rulers[1]:NATAL.rulers[10], rp=NATAL.pts[rul];
    const hits=transitHits(d).filter(h=>h.nk===k).sort((a,b)=>a.orb-b.orb);
    return '<article class="trcard"><header class="trcard-h">'
      +'<span class="trcard-g nat">'+(k==='asc'?'Asc':'MC')+'</span>'
      +'<div><b>'+nm+'</b><em>ponto natal · '+zfmt(L)+'</em></div></header>'
      +'<div class="trcard-b">'
      +trLinha('Signo',SIGNS[signOf(L)])
      +trLinha('Regente',PT_NAME[rul]+(rp?(' · casa '+rp.h+' · '+(rp.dig||'—')):''))
      +trLinha('Matéria',cap1(HOUSE_THEME[k==='asc'?1:10]))
      +'<p class="trcard-p">'+(k==='asc'
        ? 'O Ascendente descreve o corpo, a vitalidade e o modo de se apresentar. Quem administra esse campo é '+PT_NAME[rul]+', e a condição dele no mapa tende a colorir a saúde e a presença do nativo.'
        : 'O Meio do Céu descreve a reputação, a autoridade e a vocação visível. Quem administra esse campo é '+PT_NAME[rul]+', e a condição dele tende a indicar por onde o reconhecimento chega.')+'</p>'
      +trTransitosSobre(hits,d,S)+'</div></article>';
  }
  const p=NATAL.pts[k]; if(!p)return '<p class="note">ponto não encontrado no mapa.</p>';
  const ru=ruledHouses(k);
  const hits=transitHits(d).filter(h=>h.nk===k).sort((a,b)=>a.orb-b.orb);
  const lim=p.hBack?(' · liminar: divide com a casa '+p.hBack+' (5°)'):'';
  return '<article class="trcard"><header class="trcard-h">'
    +'<span class="trcard-g nat">'+(PT_GLYPH[k]||'')+'︎</span>'
    +'<div><b>'+PT_NAME[k]+'</b><em>natal · '+zfmt(p.lon)+(p.retro?' · retrógrado':'')+'</em></div></header>'
    +'<div class="trcard-b">'
    +trLinha('Casa','casa '+p.h+lim)
    +trLinha('Rege',ru.length?ru.map(h=>h+'ª').join(' e a '):'—')
    +trLinha('Condição',p.dig||'—')
    +((p.star&&p.star!=='—')?trLinha('Estrela fixa',p.star):'')
    +'<p class="trcard-p">'+trNatalFrase(k)+'</p>'
    +'<div class="trsec"><span>Campos administrados</span><p>'
      +(ru.length?ru.map(h=>'<b>'+h+'ª</b> — '+HOUSE_THEME[h]).join('<br>'):'nenhuma casa sob sua regência.')+'</p></div>'
    +'<div class="trsec"><span>Como tende a se manifestar</span><p>'+manifestFor(k)+'</p></div>'
    +trTransitosSobre(hits,d,S)+'</div></article>';
}
function trTransitosSobre(hits,d,S){
  if(!hits.length)return '<div class="trsec"><span>Trânsitos sobre este ponto</span><p>nenhum aspecto dentro do orbe nesta data.</p></div>';
  const li=hits.slice(0,4).map(h=>{
    const T=(typeof transitoTexto==='function')?transitoTexto(Object.assign(h,{pri:transitPriority(h,d,S)}),d,S):null;
    return '<div class="trhit '+h.cls+'"><span class="trhit-g">'+(PT_GLYPH[h.tKey]||'')+'︎ '+h.gl+'</span>'
      +'<div><b>'+PT_NAME[h.tKey]+' '+({conj:'em conjunção',harm:h.ang===60?'em sextil':'em trígono',tens:h.ang===90?'em quadratura':'em oposição'})[h.cls]+'</b>'
      +'<em>orbe '+fmtOrb(h.orb)+(T?(' · '+fdate(T.janela.peak)+' no pico'):'')+'</em>'
      +(T?('<p>'+T.efeito+'</p>'):'')+'</div></div>';}).join('');
  return '<div class="trsec"><span>Trânsitos sobre este ponto</span>'+li+'</div>';
}
function trCardTransito(k){
  const d=trDate(), S=(typeof tempoState==='function')?tempoState(d):null;
  const bn=TB.find(t=>t[1]===k)[0], L=tlon(bn,d), spd=speedOf(bn,d);
  const casa=houseByRule(L,NATAL.cusps);
  const np=NATAL.pts[k], ru=ruledHouses(k);
  const hits=transitHits(d).filter(h=>h.tKey===k).sort((a,b)=>a.orb-b.orb);
  const li=hits.slice(0,5).map(h=>{
    const T=(typeof transitoTexto==='function')?transitoTexto(Object.assign(h,{pri:transitPriority(h,d,S)}),d,S):null;
    return '<div class="trhit '+h.cls+'"><span class="trhit-g">'+h.gl+' '+(h.np.g||'')+'︎</span>'
      +'<div><b>'+({conj:'conjunção a',harm:h.ang===60?'sextil a':'trígono a',tens:h.ang===90?'quadratura a':'oposição a'})[h.cls]+' '+h.np.nm+' natal</b>'
      +'<em>orbe '+fmtOrb(h.orb)+(T?(' · até '+fdate(T.janela.end)):'')+'</em>'
      +(T?('<p>'+T.efeito+'</p>'):'')+'</div></div>';}).join('')
    ||'<p>nenhum aspecto a pontos natais dentro do orbe nesta data.</p>';
  return '<article class="trcard"><header class="trcard-h">'
    +'<span class="trcard-g tra">'+(PT_GLYPH[k]||'')+'︎</span>'
    +'<div><b>'+PT_NAME[k]+'</b><em>em trânsito · '+zfmt(L)+(spd<0?' · retrógrado':'')+'</em></div></header>'
    +'<div class="trcard-b">'
    +trLinha('Passa pela','casa '+casa+' do mapa natal')
    +trLinha('Matéria em jogo',cap1(HOUSE_THEME[casa]))
    +trLinha('Marcha',(spd<0?'retrógrado, ':'direto, ')+Math.abs(spd).toFixed(2)+'° por dia')
    +(np?trLinha('No seu natal','casa '+np.h+' · '+zfmt(np.lon)):'')
    +trLinha('Rege no natal',ru.length?ru.map(h=>h+'ª').join(' e a '):'—')
    +'<p class="trcard-p">'+cap1(PT_NAME[k])+' em trânsito não muda o que o mapa promete: ele apenas movimenta o que já está prometido. '
      +'Ao cruzar a casa '+casa+', tende a mexer com '+HOUSE_THEME[casa]+''
      +(ru.length?(', trazendo consigo os assuntos das casas que rege no natal ('+ru.map(h=>h+'ª').join(' e ')+')'):'')+'.</p>'
    +'<div class="trsec"><span>O que ele toca agora</span>'+li+'</div>'
    +'</div></article>';
}
/* ---------------- regentes das casas ----------------
   Um card por casa. Aberto, mostra onde o regente transita agora, o termo
   ptolomaico do grau, a posição natal, uma síntese literal e os aspectos. */
let TR_RUL=null;                       // casa cujo regente está aberto
/* limites do termo (tábua de TERMS, ptolomaica) que contém a longitude */
function termBounds(L){
  const s=signOf(L), d=n360(L)%30, T=TERMS[s]; let prev=0;
  for(const [lim,p] of T){ if(d<lim) return {lord:p,from:prev,to:lim,sign:s}; prev=lim; }
  return {lord:T[4][1],from:T[3][0],to:30,sign:s};
}
const TERM_TXT={
  saturn:'pede prazo, estrutura e revisão',
  jupiter:'favorece ampliação e o apoio de terceiros',
  mars:'acelera e expõe ao atrito',
  venus:'suaviza e aproxima acordos',
  mercury:'movimenta papéis, conversas e informação'};
const ROMANO=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
/* fileira horizontal: doze cartas fechadas, uma por casa */
function trRulersHTML(){
  let out='';
  for(let h=1;h<=12;h++){
    const k=NATAL.rulers[h]; if(!k)continue;
    out+='<button class="rgb'+(TR_RUL===h?' on':'')+'" data-rgh="'+h+'" title="Regente da '+h+'ª — '+casaTag(h)+'">'
      +'<span class="rgb-n">'+ROMANO[h]+'</span>'
      +'<span class="rgb-g">'+(PT_GLYPH[k]||'')+'\uFE0E</span>'
      +'<span class="rgb-p">'+PT_NAME[k]+'</span></button>';
  }
  return out;
}
/* a carta aberta: lida dentro da tela, sem tocar no painel lateral */
function trCartaHTML(h){
  const k=NATAL&&NATAL.rulers[h]; if(!k)return '';
  const d=trDate();
  const bn=TB.find(t=>t[1]===k)[0], L=tlon(bn,d), spd=speedOf(bn,d);
  const casaT=houseByRule(L,NATAL.cusps), tb=termBounds(L);
  const np=NATAL.pts[k], tbN=np?termBounds(np.lon):null, ru=ruledHouses(k), q=qualidade(k);
  const lin=(a,b)=>'<div class="ct-r"><span>'+a+'</span><b>'+b+'</b></div>';
  const grau=x=>Math.floor(x)+'°';
  const hits=transitHits(d).filter(x=>x.tKey===k).sort((a,b)=>a.orb-b.orb).slice(0,3);
  const asp=hits.length
    ? hits.map(x=>'<div class="ct-a '+x.cls+'"><i>'+x.gl+'</i>'
        +({conj:'conjunção a',harm:x.ang===60?'sextil a':'trígono a',tens:x.ang===90?'quadratura a':'oposição a'})[x.cls]
        +' '+x.np.nm+' natal <u>'+fmtOrb(x.orb)+'</u></div>').join('')
    : '<div class="ct-a"><i>—</i>nenhum aspecto a pontos natais dentro do orbe nesta data.</div>';
  const sintese=cap1(PT_NAME[k])+' administra '+(ru.length?casasTag(ru):'nenhuma casa')+'. '
    +'Neste momento cruza '+casaTag(casaT)+' ('+ordinal(casaT)+' natal), em '+SIGNS[tb.sign]
    +', no termo de '+PT_NAME[tb.lord]+' — '+(TERM_TXT[tb.lord]||'modula a entrega neste grau')+'. '
    +(spd<0?'Retrógrado, tende a rever o que já estava em curso. ':'')
    +'As matérias da '+ordinal(h)+' tendem a ser tratadas por '+casaTag(casaT)+'.';
  const canto=(cls)=>'<span class="ct-c '+cls+'"><b>'+ROMANO[h]+'</b><i>'+(PT_GLYPH[k]||'')+'\uFE0E</i></span>';
  return '<article class="carta">'
    +'<button class="ct-x" data-rgclose aria-label="fechar">✕</button>'
    +canto('a')+canto('b')
    +'<header class="ct-h">'
      +'<span class="ct-med">'+(PT_GLYPH[k]||'')+'\uFE0E</span>'
      +'<b>'+PT_NAME[k]+'</b>'
      +'<em>regente da '+h+'ª · '+casaTag(h)+'</em>'
    +'</header>'
    +'<div class="ct-b">'
      +'<div class="ct-s"><span>posição de agora</span>'
        +lin('Transita',sgOf(L)+' '+SIGNS[signOf(L)]+' '+grau(n360(L)%30)+(spd<0?' ℞':''))
        +lin('Casa cruzada',ordinal(casaT)+' natal')
        +lin('Matéria em jogo',cap1(casaTag(casaT)))
        +lin('Termo do grau',(PT_GLYPH[tb.lord]||'')+'\uFE0E '+PT_NAME[tb.lord]+' ('+tb.from+'°–'+tb.to+'°)')
      +'</div>'
      +'<div class="ct-s"><span>no mapa natal</span>'
        +(np?lin('Posição',sgOf(np.lon)+' '+SIGNS[signOf(np.lon)]+' '+grau(n360(np.lon)%30)):'')
        +(np?lin('Casa',ordinal(np.h)):'')
        +(tbN?lin('Termo do grau',(PT_GLYPH[tbN.lord]||'')+'\uFE0E '+PT_NAME[tbN.lord]):'')
        +lin('Também rege',ru.filter(x=>x!==h).length?ru.filter(x=>x!==h).map(ordinal).join(' e '):'—')
        +lin('Condição',q.txt||'—')
      +'</div>'
      +'<div class="ct-s"><span>leitura</span><p class="ct-p">'+sintese+'</p></div>'
      +'<div class="ct-s"><span>aspectos aos pontos natais</span>'+asp+'</div>'
    +'</div>'
    +'<footer class="ct-f">'+fdate(d)+'</footer>'
    +'</article>';
}
function trCardVazio(){
  return '<article class="trcard trcard-empty">'
    +'<div class="trcard-b"><div class="kicker">como ler</div>'
    +'<p class="trcard-p">O anel externo, em ouro, traz os planetas <b>em trânsito</b> agora. O anel interno, em marfim, traz os planetas do <b>mapa natal</b>. '
    +'As casas e as cúspides são sempre as do mapa natal; as linhas do miolo são os aspectos natais.</p>'
    +'<p class="trcard-p">Clique em qualquer planeta da mandala para ver o que ele significa — natalmente, no caso do anel interno; e o que está movimentando agora, no caso do anel externo.</p>'
    +'</div></article>';
}
function trDetalhe(){
  const el=$('tr-detail'); if(!el)return;
  if(!TR_SEL){el.innerHTML=trCardVazio();return;}
  try{ el.innerHTML=TR_SEL.side==='t'?trCardTransito(TR_SEL.k):trCardNatal(TR_SEL.k); }
  catch(e){console.error('tr card',e);el.innerHTML='<p class="note">não foi possível montar a leitura deste ponto.</p>';}
}
function renderTrans(){
  if(typeof NATAL==='undefined'||!NATAL){
    if($('tr-detail'))$('tr-detail').innerHTML=emptyState();
    if($('tr-wheel'))$('tr-wheel').innerHTML='';
    return;
  }
  refreshNPTS();
  const dt=$('tr-date'); if(dt&&!dt.value)dt.value=TR_CURSOR.toISOString().slice(0,10);
  const st=$('tr-stamp'); if(st)st.textContent=fdate(TR_CURSOR);
  document.querySelectorAll('#tr-view [data-trv]').forEach(b=>b.classList.toggle('on',b.dataset.trv===TR_VIEW));
  try{ $('tr-wheel').innerHTML=trWheelSVG(); }catch(e){console.error('tr wheel',e);}
  trDetalhe();
  try{ if($('tr-rulers'))$('tr-rulers').innerHTML=trRulersHTML(); trCarta(); }
  catch(e){console.error('tr rulers',e);}
}
function trCarta(){
  const ov=$('tr-carta'); if(!ov)return;
  const slot=$('tr-carta-slot');
  if(!TR_RUL||typeof NATAL==='undefined'||!NATAL){ov.hidden=true;document.body.classList.remove('carta-open');if(slot)slot.innerHTML='';return;}
  if(slot)slot.innerHTML=trCartaHTML(TR_RUL);
  const b=slot&&slot.querySelector('.ct-b'); if(b)b.scrollTop=0;
  ov.hidden=false; document.body.classList.add('carta-open');
}
function trCartaFechar(){TR_RUL=null;if($('tr-rulers'))$('tr-rulers').innerHTML=trRulersHTML();trCarta();}
function bindTrans(){
  const w=$('p-trans'); if(!w)return;
  w.addEventListener('click',e=>{
    const p=e.target.closest&&e.target.closest('[data-tp]');
    if(p){const [side,k]=p.dataset.tp.split(':');
      TR_SEL=(TR_SEL&&TR_SEL.side===side&&TR_SEL.k===k)?null:{side,k};
      renderTrans();
      const det=$('tr-detail'); if(det&&document.body.classList.contains('is-mobile'))det.scrollIntoView({behavior:'smooth',block:'start'});
      return;}
    const v=e.target.closest&&e.target.closest('[data-trv]');
    if(v){TR_VIEW=v.dataset.trv;renderTrans();return;}
    // fileira de regentes: abre a carta, sem tocar no painel lateral
    const rb=e.target.closest&&e.target.closest('[data-rgh]');
    if(rb){TR_RUL=(TR_RUL===+rb.dataset.rgh)?null:+rb.dataset.rgh;
      if($('tr-rulers'))$('tr-rulers').innerHTML=trRulersHTML();
      trCarta();}
  });
  const ov=$('tr-carta');
  if(ov)ov.addEventListener('click',e=>{
    const nv=e.target.closest&&e.target.closest('[data-rgnav]');
    if(nv&&TR_RUL){TR_RUL=((TR_RUL-1+ +nv.dataset.rgnav)+12)%12+1;
      if($('tr-rulers'))$('tr-rulers').innerHTML=trRulersHTML(); trCarta(); return;}
    // ✕ ou qualquer ponto fora da carta fecha
    if((e.target.closest&&e.target.closest('[data-rgclose]'))
       ||!(e.target.closest&&e.target.closest('.carta'))) trCartaFechar();
  });
  document.addEventListener('keydown',e=>{
    if(!TR_RUL||$('tr-carta').hidden)return;
    if(e.key==='Escape')trCartaFechar();
    else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      TR_RUL=((TR_RUL-1+(e.key==='ArrowRight'?1:-1))+12)%12+1;
      if($('tr-rulers'))$('tr-rulers').innerHTML=trRulersHTML(); trCarta();}
  });
  const dt=$('tr-date');
  if(dt)dt.addEventListener('change',function(){if(this.value){TR_CURSOR=new Date(this.value+'T12:00:00Z');renderTrans();}});
  const hj=$('tr-today');
  if(hj)hj.onclick=()=>{TR_CURSOR=new Date();if($('tr-date'))$('tr-date').value=TR_CURSOR.toISOString().slice(0,10);renderTrans();};
  window.addEventListener('resize',()=>{try{if($('p-trans').classList.contains('on'))renderTrans();}catch(e){}});
}
