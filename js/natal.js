/* ============================================================
   NATAL.JS — um planeta por vez.

   Nível 1 · conclusão legível: o que este planeta administra,
             onde isso se realiza, e o que o signo modifica.
   Nível 2 · "Estrutura natal": condição, dignidades, regências,
             dispositor, recepções nomeadas, aspectos, polaridades.
   Nível 3 · a fundamentação de cada afirmação, dentro do nível 2.

   O motor não confunde posição por casa com regência: a casa
   ocupada descreve o MODO de funcionamento; as casas regidas
   dizem QUAL matéria concreta o planeta carrega (ver olavo.js).
   ============================================================ */

/* natureza universal — o que o planeta é antes de qualquer mapa */
const PL_NATUREZA={
  sun    :{n:'centro da vida',        d:'o que organiza tudo em torno de si e dá direção'},
  moon   :{n:'corpo e hábito',        d:'o que muda de estado, se afeiçoa e pede cuidado'},
  mercury:{n:'razão e intermediação', d:'o que separa, nomeia, negocia e transporta'},
  venus  :{n:'apreço e acordo',       d:'o que aproxima, harmoniza e dá valor'},
  mars   :{n:'corte e iniciativa',    d:'o que separa à força, disputa e executa'},
  jupiter:{n:'ampliação e concessão', d:'o que abre espaço, avaliza e concede'},
  saturn :{n:'limite e duração',      d:'o que restringe, adia e faz durar'}
};
/* camada secundária: estilo, não capacidade */
const PL_MODO_EL={
  fogo :'realização imediata e direta, que perde o interesse no que demora',
  terra:'realização progressiva, concreta e persistente',
  ar   :'realização discursiva, feita de articulação e troca',
  'água':'realização indireta, que retém e responde ao clima afetivo'
};
const PL_MODO_MO={cardinal:'inicia',fixo:'sustenta',mutável:'adapta'};

/* --- contrações e concordância do português --- */
const PL_CONTR={de:{a:'da',o:'do',as:'das',os:'dos'},
                por:{a:'pela',o:'pelo',as:'pelas',os:'pelos'},
                em:{a:'na',o:'no',as:'nas',os:'nos'},
                a:{a:'à',o:'ao',as:'às',os:'aos'}};
function prep(p,s){
  if(!s)return p;
  const m=s.match(/^(as|os|a|o)\s+(.*)$/i);
  if(m&&PL_CONTR[p]&&PL_CONTR[p][m[1].toLowerCase()])return PL_CONTR[p][m[1].toLowerCase()]+' '+m[2];
  return p+' '+s;
}
function lista(a){
  a=(a||[]).filter(Boolean);
  if(a.length<=1)return a[0]||'';
  if(a.some(x=>/\se\s/.test(x)))return a.join(', ');
  return a.slice(0,-1).join(', ')+' e '+a[a.length-1];
}
const plural=(arr,txt)=>(arr&&arr.length>1)||/\se\s/.test(txt||'');

/* --- o núcleo: tudo que o app sabe sobre um planeta deste mapa --- */
function natalNucleo(k){
  const p=NATAL&&NATAL.pts[k]; if(!p)return null;
  const ctx=ctxNatal(), L=p.lon, s=signOf(L), rege=ruledHouses(k), casa=p.h;
  const cond=condicaoDe(k,ctx);
  const pol=polaridades(k,ctx);
  /* recepções nomeadas com os demais planetas */
  const rec=[];
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k||!NATAL.pts[o])return;
    const mut=recepcaoMutua(k,o,ctx.pts,ctx.diurno);
    const asp=aspectBetween(L,NATAL.pts[o].lon);
    if(mut){rec.push({com:o,mutua:true,asp,
      t:'Recepção mútua com '+PT_NAME[o]+' ('+mut.a.dig+' × '+mut.b.dig+')'
        +(mut.peso==='forte'?' — das fortes: um entrega o assunto do outro sem resistência.'
                            :' — das menores: acolhimento existe, mas é fraco.')});return;}
    const rs=recepcoesEntre(k,o,ctx.pts,ctx.diurno).filter(x=>x.quem===o);
    if(rs.length){const d=rs[0];
      rec.push({com:o,mutua:false,asp,
        t:PT_NAME[o]+' acolhe '+PT_NAME[k]+' por '+d.dig+(asp?(' · '+asp.gl+' '+fmtOrb(asp.orb)):' · sem aspecto')+'.'});}
  });
  /* aspectos aos demais */
  const asps=[];
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k||!NATAL.pts[o])return;
    const a=aspectBetween(L,NATAL.pts[o].lon); if(!a)return;
    asps.push({com:o,a});
  });
  asps.sort((x,y)=>x.a.orb-y.a.orb);
  const camadas=(typeof olavoCamadas==='function')?olavoCamadas(k,casa,rege):null;
  return {k,p,L,s,rege,casa,cond,pol,rec,asps,camadas,
    nat:PL_NATUREZA[k],retro:!!p.retro,liminar:p.hBack||null};
}

/* ---------- nível 1 · as três frases do painel ---------- */
function natalRege(N){
  if(!N.rege.length)return {t:'Não rege casa alguma',d:'Atua apenas pela casa que ocupa e pelos aspectos que faz.'};
  const mat=lista(N.rege.map(h=>HOUSE_TAG[h]));
  return {t:'Rege '+lista(N.rege.map(h=>'a '+h+'ª')),
    d:cap1(lista(N.rege.map(h=>HOUSE_THEME[h].split(':').pop().trim())))+' '
      +(plural(N.rege,mat)?'tornam-se':'torna-se')+' a matéria concreta administrada por '+PT_NAME[N.k]+'.'};
}
function natalCasa(N){
  const F=(typeof OL_FUSAO!=='undefined')?OL_FUSAO[N.casa]:null;
  const mat=N.rege.length?lista(N.rege.map(h=>HOUSE_TAG[h])):null;
  let d;
  if(!mat) d='O modo de operar é o '+(N.camadas?N.camadas.psi.campo:HOUSE_TAG[N.casa])+', sem matéria própria administrada.';
  else if(F) d=cap1(mat)+' '+(plural(N.rege,mat)?F:F.replace(/^passam /,'passa '))+'.';
  else d=cap1(mat)+' se realiza '+prep('por',HOUSE_TAG[N.casa])+'.';
  return {t:'Está na '+N.casa+'ª'+(N.liminar?(' (liminar com a '+N.liminar+'ª)'):''),d};
}
function natalSigno(N){
  return {t:SIGNS[N.s],d:cap1(PL_MODO_EL[SIGN_ELEM[N.s]])+'.'};
}

/* ---------- render: chips + painel único ---------- */
let NX_SEL=null, NX_DET=null;
function natalChipsHTML(){
  return Object.keys(PT_NAME).map(k=>{
    const p=NATAL.pts[k]; if(!p)return '';
    const on=(NX_SEL||Object.keys(PT_NAME)[0])===k;
    return '<button class="nchip'+(on?' on':'')+'" data-nx="'+k+'">'
      +'<i>'+(PT_GLYPH[k]||'')+'︎</i><span>'+PT_NAME[k]+'</span></button>';
  }).join('');
}
function natalPainelHTML(k){
  const N=natalNucleo(k); if(!N)return '<p class="note">ponto não encontrado.</p>';
  const R=natalRege(N), C=natalCasa(N), S=natalSigno(N);
  const cn=N.cond;
  const bloco=(t,d)=>'<div class="nb"><span>'+t+'</span><p>'+d+'</p></div>';
  return '<article class="npan">'
    +'<header class="npan-h">'
      +'<span class="npan-g">'+(PT_GLYPH[k]||'')+'︎</span>'
      +'<div><b>'+PT_NAME[k]+'</b>'
        +'<em>'+SIGNS[N.s]+' · '+N.casa+'ª'+(N.retro?' · ℞':'')+'</em></div>'
      +'<i class="npan-c '+cn.nivel+'">'+cn.nivel+'</i>'
    +'</header>'
    +'<p class="npan-n">'+cap1(N.nat.n)+' — '+N.nat.d+'.</p>'
    +bloco(R.t,R.d)+bloco(C.t,C.d)+bloco(S.t,S.d)
    +(N.camadas?('<div class="npan-ps"><span>leitura psicológica'
      +(N.camadas.psi.titulo?(' · '+N.camadas.psi.titulo):'')+'</span><p>'+N.camadas.psi.texto+'</p></div>'):'')
    +'<button class="npan-x" data-nxdet="'+k+'">Estrutura natal <i>'+(NX_DET===k?'⌄':'›')+'</i></button>'
    +(NX_DET===k?natalEstruturaHTML(N):'')
    +'</article>';
}
/* ---------- nível 2 · a estrutura, auditável ---------- */
function natalEstruturaHTML(N){
  const cn=N.cond;
  const sec=(t,c)=>'<section class="ne"><span>'+t+'</span>'+c+'</section>';
  const li=a=>'<ul class="ne-l">'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
  let h='<div class="ne-wrap">';
  /* condição — a pergunta central */
  h+=sec('condição — capacidade de realizar o ofício',
    '<p class="ne-v"><b>'+cap1(cn.nivel)+'</b> · '+cn.nivelTxt+'.</p>'
    +'<div class="ne-f">'+cn.fatores.map(f=>
      '<div class="ne-fi '+(f.v>0?'p':f.v<0?'n':'')+'"><i>'+f.f+'</i><span>'+f.t+'</span></div>').join('')+'</div>');
  /* regência e matéria */
  h+=sec('regências',N.rege.length
    ? li(N.rege.map(x=>'<b>'+x+'ª</b> — '+HOUSE_THEME[x]))
    : '<p>Nenhuma casa sob sua regência neste mapa.</p>');
  /* dispositor */
  h+=sec('dispositor',cn.dispositor
    ? '<p>'+PT_NAME[N.k]+' está no signo de <b>'+PT_NAME[cn.dispositor.k]+'</b>, na casa '+cn.dispositor.casa+'. '
      +(cn.dispositor.recebido
        ? 'Há acolhimento: recepção por '+cn.dispositor.dig+'.'
        : 'Não há acolhimento por nenhuma dignidade — a entrega depende de quem não tem obrigação com o assunto.')+'</p>'
    : '<p>Está no próprio domicílio: dispõe de si mesmo.</p>');
  /* recepções, sempre nomeadas */
  h+=sec('recepções',N.rec.length?li(N.rec.map(r=>r.t))
    :'<p>Nenhuma recepção com os demais planetas — nem por domicílio, exaltação, triplicidade, termo ou face.</p>');
  /* aspectos — forma de interação, não juízo */
  h+=sec('aspectos',N.asps.length?li(N.asps.map(x=>{
      const forma={0:'fusão de operação',60:'transmissão fácil',120:'transmissão fácil',
        90:'fricção que exige ajuste',180:'tensão por oposição de campo'}[x.a.ang]||'contato';
      const co=condicaoDe(x.com,ctxNatal());
      return '<b>'+PT_NAME[x.com]+'</b> '+x.a.gl+' ('+fmtOrb(x.a.orb)+') — '+forma
        +'. O que se '+(x.a.cls==='tens'?'tensiona':'facilita')+' depende da condição de '+PT_NAME[x.com]
        +', que está <i>'+(co?co.nivel:'—')+'</i>'
        +(ruledHouses(x.com).length?(' e administra '+lista(ruledHouses(x.com).map(y=>y+'ª'))):'')+'.';
    })):'<p>Sem aspectos dentro do orbe.</p>');
  /* polaridades e conflitos — a distinção explícita */
  h+=sec('polaridade e conflito',N.pol.length?li(N.pol.map(p=>p.txt))
    :'<p>Não opera em signo de debilidade de nenhum outro planeta do mapa.</p>');
  /* camadas do material psicológico */
  if(N.camadas){
    h+=sec('camada psicológica · fonte',
      '<p class="ne-src"><b>Casa ocupada ('+N.casa+'ª)</b> — descreve a estrutura psíquica, não o assunto: '
      +N.camadas.psi.desc+'.</p>'
      +'<p class="ne-src">Formulação do material: “'+(N.camadas.psi.fonte||'—')+'”'
      +(N.camadas.psi.titulo?('<br>Nomenclatura da fonte: <i>'+N.camadas.psi.titulo+'</i>.'):'')+'</p>'
      +'<p class="ne-src"><b>Casas regidas</b> — dizem qual matéria concreta o planeta carrega: '
      +N.camadas.conteudo.texto+'</p>'
      +'<p class="ne-fim">'+N.camadas.sintese+'</p>');
  } else {
    h+=sec('camada psicológica · fonte',
      '<p class="ne-src">O material de referência (Olavo de Carvalho, <i>Planetas nas Casas</i>) não cobre Mercúrio. Esta camada não se aplica.</p>');
  }
  /* estilo, camada secundária */
  h+=sec('estilo (camada secundária)','<p>'+SIGNS[N.s]+' — '+SIGN_ELEM[N.s]+', '+SIGN_MODE[N.s]+'. '
    +cap1(PL_MODO_EL[SIGN_ELEM[N.s]])+'; '+PL_MODO_MO[SIGN_MODE[N.s]]+' mais do que as outras coisas. '
    +'<i>Descreve o modo, não a capacidade.</i></p>');
  return h+'</div>';
}
function renderNatalTab(){
  const chips=$('nx-chips'), pan=$('nx-panel');
  if(!chips||!pan)return;
  if(typeof NATAL==='undefined'||!NATAL){chips.innerHTML='';pan.innerHTML=emptyState();return;}
  if(!NX_SEL)NX_SEL=Object.keys(PT_NAME)[0];
  chips.innerHTML=natalChipsHTML();
  try{pan.innerHTML=natalPainelHTML(NX_SEL);}
  catch(e){console.error('natal painel',e);pan.innerHTML='<p class="note">não foi possível montar a leitura.</p>';}
}
function bindNatal(){
  const w=$('p-natal'); if(!w)return;
  w.addEventListener('click',e=>{
    const c=e.target.closest&&e.target.closest('[data-nx]');
    if(c){NX_SEL=c.dataset.nx;NX_DET=null;renderNatalTab();
      const p=$('nx-panel'); if(p&&document.body.classList.contains('is-mobile'))
        p.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;}
    const d=e.target.closest&&e.target.closest('[data-nxdet]');
    if(d){NX_DET=(NX_DET===d.dataset.nxdet)?null:d.dataset.nxdet;renderNatalTab();return;}
  });
}
