/* ============================================================
   NATAL.JS — o planeta como núcleo interno de significado.

   Nenhum planeta é lido pelo simbolismo universal sozinho. A leitura
   se monta em sete camadas, nesta ordem:

     1 natureza universal do planeta
     2 casas que ele rege NESTE mapa
     3 casa que ele ocupa
     4 signo que ele ocupa
     5 dignidade / exílio / exaltação / queda
     6 recepções e tensões com o dispositor e com os outros regentes
     7 circuitos — quando o significado de um regente depende de outro

   A camada psicológica (olavo.js) entra modulada: o CAMPO genérico da
   casa é trocado pelo que o planeta concretamente rege. Sol na 11 não é
   "apoteose"; é apoteose daquilo que o Sol rege naquele mapa.
   ============================================================ */

/* 1 · natureza universal — o que o planeta é antes de qualquer mapa */
const PL_NATUREZA={
  sun    :{n:'centro de consciência',       d:'o que organiza a vida em torno de si e dá direção'},
  moon   :{n:'corpo, hábito e apego',       d:'o que muda de estado, se afeiçoa e pede cuidado'},
  mercury:{n:'razão e intermediação',       d:'o que separa, nomeia, negocia e transporta'},
  venus  :{n:'apreço e acordo',             d:'o que aproxima, harmoniza e dá valor'},
  mars   :{n:'corte e iniciativa',          d:'o que separa à força, disputa e executa'},
  jupiter:{n:'ampliação e concessão',       d:'o que abre espaço, avaliza e concede'},
  saturn :{n:'limite e duração',            d:'o que restringe, adia e faz durar'}
};
/* --- contrações do português: de+a=da, por+os=pelos, em+o=no ---
   Os rótulos de casa carregam artigo; sem isto sai "de a identidade". */
const PL_CONTR={de:{a:'da',o:'do',as:'das',os:'dos'},
                por:{a:'pela',o:'pelo',as:'pelas',os:'pelos'},
                em:{a:'na',o:'no',as:'nas',os:'nos'},
                a:{a:'à',o:'ao',as:'às',os:'aos'}};
function prep(p,s){
  if(!s)return p;
  const m=s.match(/^(as|os|a|o)\s+(.*)$/i);
  if(m&&PL_CONTR[p]&&PL_CONTR[p][m[1].toLowerCase()])
    return PL_CONTR[p][m[1].toLowerCase()]+' '+m[2];
  return p+' '+s;
}
/* lista em português: "a, b e c" — nunca "a e b e c" */
function lista(a){
  a=a.filter(Boolean);
  if(a.length<=1)return a[0]||'';
  // se os próprios itens já têm "e", o "e" final vira vírgula: evita "x e y e z"
  if(a.some(x=>/\se\s/.test(x)))return a.join(', ');
  return a.slice(0,-1).join(', ')+' e '+a[a.length-1];
}
/* plural pelo número de itens ou pelo artigo inicial */
const ehPlural=(a,s)=>(Array.isArray(a)?a.length>1:false)||/^(os|as)\s/i.test(s||'');

/* verbos de realização por elemento do signo ocupado */
const PL_MODO_EL={
  fogo :'imediato, iniciador e pouco afeito ao que demora',
  terra:'estável, concreto, perseverante e acumulativo',
  ar   :'articulado, discursivo e movido por troca',
  'água':'indireto, retentivo e movido pelo clima afetivo'
};
const PL_MODO_MO={cardinal:'começa',fixo:'sustenta',mutável:'adapta'};

/* --- utilidades de dignidade e recepção --- */
function plDigNivel(k,L){
  const s=signOf(L);
  if(SIGN_RULER[s]===k)return {n:'domicílio',v:2,t:'está em casa própria: dispõe de si mesmo e não depende de terceiro para entregar'};
  if(EXALT[k]===s)     return {n:'exaltação',v:2,t:'é honrado acima do próprio peso: promete mais do que sustenta sozinho'};
  if(SIGN_RULER[(s+6)%12]===k)return {n:'exílio',v:-2,t:'opera em terreno alheio: consegue, mas por meios que não são os seus'};
  if(FALL[k]===s)      return {n:'queda',v:-2,t:'está desconsiderado: o assunto tende a ser tratado tarde ou de menos'};
  const tl=(typeof termLord==='function')?termLord(L):null;
  if(tl===k)           return {n:'termo próprio',v:1,t:'tem apoio no grau, sem ter o signo'};
  return {n:'peregrino',v:0,t:'sem dignidade no signo: depende de quem o dispõe'};
}
/* recepção mútua e simples entre dois planetas do mapa */
function plRecepcao(a,b){
  const pa=NATAL.pts[a], pb=NATAL.pts[b]; if(!pa||!pb)return null;
  const sa=signOf(pa.lon), sb=signOf(pb.lon);
  const aRecebeB=(SIGN_RULER[sb]===a)||(EXALT[b]===sb&&false)||(SIGN_RULER[sb]===a);
  const bRecebeA=(SIGN_RULER[sa]===b);
  const aExB=(EXALT[b]===sb&&SIGN_RULER[sb]===a);
  if(aRecebeB&&bRecebeA)return {tipo:'mútua',t:PT_NAME[a]+' e '+PT_NAME[b]+' se recebem por domicílio: um entrega o assunto do outro sem resistência'};
  if(bRecebeA)return {tipo:'simples',quem:b,t:PT_NAME[b]+' recebe '+PT_NAME[a]+' em domicílio: '+PT_NAME[a]+' opera em terreno amigo'};
  if(aRecebeB)return {tipo:'simples',quem:a,t:PT_NAME[a]+' recebe '+PT_NAME[b]+' em domicílio'};
  return null;
}
/* o planeta está no signo de exílio/queda de quem? — a fricção silenciosa */
function plHostil(L){
  const s=signOf(L), out=[];
  Object.keys(PT_NAME).forEach(k=>{
    if(SIGN_RULER[(s+6)%12]===k)out.push({k,tipo:'exílio'});
    else if(FALL[k]===s)out.push({k,tipo:'queda'});
  });
  return out;
}

/* --- 2 · o núcleo: tudo que o app sabe sobre um planeta deste mapa --- */
function natalNucleo(k){
  const p=NATAL.pts[k]; if(!p)return null;
  const L=p.lon, s=signOf(L), rege=ruledHouses(k), casa=p.h;
  const dig=plDigNivel(k,L);
  const disp=SIGN_RULER[s];                       // quem dispõe deste planeta
  const dp=NATAL.pts[disp];
  const nat=PL_NATUREZA[k];
  /* 3 · o que ele rege — a matéria concreta sob sua administração */
  const materia=rege.length?casasTag(rege):null;
  /* 4 · onde isso se realiza */
  const onde=HOUSE_TAG[casa];
  /* 5 · como o signo qualifica */
  const modo=PL_MODO_EL[SIGN_ELEM[s]]+' — '+PL_MODO_MO[SIGN_MODE[s]]+' mais do que as outras coisas';
  /* 6 · circuitos: quem se incomoda com o signo em que este planeta está.
     Prioriza o planeta hostil que administra mais matéria — é o atrito
     que tem consequência, não a curiosidade técnica. */
  const tags=hs=>lista(hs.map(x=>HOUSE_TAG[x]));
  const circuitos=[];
  plHostil(L).filter(h=>h.k!==k&&NATAL.pts[h.k])
    .map(h=>Object.assign(h,{rege:ruledHouses(h.k)}))
    .sort((a,b)=>b.rege.length-a.rege.length)
    .forEach(h=>{
      const meu=rege.length?tags(rege.slice(0,2)):HOUSE_TAG[casa];
      circuitos.push({tipo:'fricção',com:h.k,peso:h.rege.length,
        t:SIGNS[s]+' é signo de '+PT_NAME[h.k]+' em '+h.tipo+'. '
          +(h.rege.length
            ? cap1(PT_NAME[h.k])+' rege '+lista(h.rege.map(x=>'a '+x+'ª'))+' ('+tags(h.rege)+'), '
              +'de modo que a via por que '+PT_NAME[k]+' realiza '+meu+' não é simpática a '+tags(h.rege)+'.'
            : cap1(PT_NAME[h.k])+' não administra casa aqui, mas o modo '+SIGNS[s]
              +' contraria a natureza dele: a fricção fica no temperamento, não nos assuntos.')});
    });
  /* dispositor: de quem este planeta depende para entregar */
  let dependencia=null;
  if(disp!==k&&dp){
    const dr=ruledHouses(disp);
    const rec=plRecepcao(k,disp);
    dependencia={k:disp,casa:dp.h,rege:dr,recebido:!!(rec&&(rec.tipo==='mútua'||rec.quem===disp)),
      t:PT_NAME[k]+' está no signo de '+PT_NAME[disp]+', que '
        +(dr.length?('administra '+casasTag(dr)+' e '):'')
        +'ocupa a casa '+dp.h+' — '+(rec&&rec.tipo==='mútua'
          ? 'e o recebe de volta: o circuito se fecha sem custo'
          : (rec&&rec.quem===disp ? 'e o recebe bem: a entrega passa por ali com apoio'
             : 'e não o recebe: a entrega depende de um terceiro que não tem obrigação com o assunto'))+'.'};
  }
  /* recepções relevantes com os demais regentes */
  const recepcoes=[];
  Object.keys(PT_NAME).forEach(o=>{
    if(o===k||o===disp)return;
    const r=plRecepcao(k,o); if(!r)return;
    const asp=NATAL.pts[o]?aspectBetween(L,NATAL.pts[o].lon):null;
    recepcoes.push({com:o,asp,t:r.t+(asp?(' ('+asp.gl+', '+fmtOrb(asp.orb)+')'):' (sem aspecto)')});
  });
  /* 7 · camada psicológica, modulada pela regência */
  const psi=(typeof OL_MODO!=='undefined'&&OL_MODO[k])?{
    modo:OL_MODO[k].v, campo:OL_CAMPO[casa].c, desc:OL_CAMPO[casa].d,
    bruto:olavoBruto(k,casa),
    modulado:olavoModulado(k,casa,rege),
    intel:k==='sun'?('inteligência intuitiva '+(OL_INTEL[casa]||'')):''
  }:null;
  return {k,p,L,s,rege,casa,dig,disp,dp,nat,materia,onde,modo,circuitos,dependencia,recepcoes,psi,
    liminar:p.hBack||null,retro:!!p.retro};
}
/* --- 3 · a síntese curta: o card --- */
function natalSintese(N){
  if(!N)return '';
  const nome=PT_NAME[N.k];
  const meu=lista(N.rege.map(h=>HOUSE_TAG[h]));
  let s=cap1(N.nat.n)+'; '+N.nat.d+'. ';
  if(N.rege.length)
    s+='Rege '+lista(N.rege.map(h=>'a '+h+'ª'))+' — logo '+meu+' '
      +(N.rege.length>1?'passam':'passa')+' a depender de '+nome+'. ';
  else s+='Não administra casa alguma: atua só pela casa em que está. ';
  s+=!N.rege.length
    ? 'Está na casa '+N.casa+', e é por '+HOUSE_TAG[N.casa]+' que sua natureza aparece. '
    : (N.rege.length===1&&N.rege[0]===N.casa
       ? 'Está na própria casa que rege, a '+N.casa+'ª: faz '+prep('de',HOUSE_TAG[N.casa])+' o campo central da vida. '
       : (N.rege.includes(N.casa)
          ? 'Está na '+N.casa+'ª, casa que ele mesmo rege: as demais matérias passam por aqui. '
          : 'Está na casa '+N.casa+', o que tende a realizar essa matéria '+prep('por',HOUSE_TAG[N.casa])+'. '));
  s+='Em '+SIGNS[N.s]+', o modo é '+PL_MODO_EL[SIGN_ELEM[N.s]]+'.';
  return s;
}
/* frase de circuito, curta, só quando há algo real a dizer.
   Prefere a dependência não recebida (mais consequente) quando o planeta
   está sem dignidade; senão, a fricção de signo mais pesada. */
function natalCircuito(N){
  if(!N)return null;
  if(N.dependencia&&!N.dependencia.recebido&&N.dig.v<0)return N.dependencia.t;
  if(N.circuitos.length&&N.circuitos[0].peso)return N.circuitos[0].t;
  if(N.dependencia&&!N.dependencia.recebido)return N.dependencia.t;
  if(N.circuitos.length)return N.circuitos[0].t;
  return null;
}

/* a frase de uma linha do card: matéria → onde se realiza → modo */
function natalFraseCurta(N){
  const meu=lista(N.rege.map(h=>HOUSE_TAG[h]));
  const modo=PL_MODO_EL[SIGN_ELEM[N.s]].split(',')[0].split(' — ')[0];
  if(!N.rege.length)
    return cap1(N.nat.d)+', atuando '+prep('por',HOUSE_TAG[N.casa])+', de modo '+modo+'.';
  if(N.rege.length===1&&N.rege[0]===N.casa)
    return 'Faz '+prep('de',HOUSE_TAG[N.casa])+' o campo central da vida, de modo '+modo+'.';
  if(N.rege.includes(N.casa)){
    const rest=N.rege.filter(h=>h!==N.casa);
    const outras=lista(rest.map(h=>HOUSE_TAG[h]));
    const pl=rest.length>1||/\se\s/.test(outras);   // "saúde e trabalho" já é plural
    return cap1(outras)+' '+(pl?'passam':'passa')+' a ser tratad'+(pl?'os':'o')
      +' a partir '+prep('de',HOUSE_TAG[N.casa])+', casa que o próprio planeta rege, de modo '+modo+'.';
  }
  const plM=N.rege.length>1||/\se\s/.test(meu);
  return cap1(meu)+' '+(plM?'se realizam':'se realiza')+' '
    +prep('por',HOUSE_TAG[N.casa])+', de modo '+modo+'.';
}
/* --- 4 · render: cards compactos --- */
function natalCardHTML(k){
  const N=natalNucleo(k); if(!N)return '';
  const cir=natalCircuito(N);
  const dg=N.dig.v>=2?'ok':N.dig.v<=-2?'mal':'';
  return '<button class="nx'+(dg?(' '+dg):'')+'" data-nx="'+k+'">'
    +'<span class="nx-g">'+(PT_GLYPH[k]||'')+'︎</span>'
    +'<span class="nx-h"><b>'+PT_NAME[k]+'</b>'
      +'<em>'+sgOf(N.L)+' '+SIGNS[N.s]+' · casa '+N.casa+(N.retro?' · ℞':'')+'</em>'
      +'<i class="nx-d">'+N.dig.n+'</i></span>'
    +'<span class="nx-b">'
      +'<u>'+cap1(N.nat.n)+'</u>'
      +'<span class="nx-r">'+(N.rege.length?('rege '+lista(N.rege.map(h=>h+'ª'))):'sem regência')
        +' → '+HOUSE_TAG[N.casa]+'</span>'
      +'<span class="nx-p">'+natalFraseCurta(N)+'</span>'
      +(cir?('<span class="nx-c">⚱ '+cir+'</span>'):'')
    +'</span></button>';
}
/* --- 5 · o nível expandido, no drawer --- */
function natalDrawerHTML(k){
  const N=natalNucleo(k); if(!N)return '<p>ponto não encontrado.</p>';
  const bl=(t,c)=>'<div class="nxd-s"><span>'+t+'</span><div>'+c+'</div></div>';
  const li=a=>'<ul class="nxd-l">'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
  let h='<div class="nxd">';
  h+='<header class="nxd-h"><span class="nxd-g">'+(PT_GLYPH[k]||'')+'︎</span>'
    +'<div><b>'+PT_NAME[k]+'</b><em>'+sgOf(N.L)+' '+SIGNS[N.s]+' '+zfmt(N.L).replace(/^[^\s]+\s/,'')
    +' · casa '+N.casa+(N.liminar?(' (liminar com a '+N.liminar+'ª)'):'')+(N.retro?' · retrógrado':'')+'</em></div>'
    +'<i class="nxd-dig '+(N.dig.v>=2?'ok':N.dig.v<=-2?'mal':'')+'">'+N.dig.n+'</i></header>';
  h+=bl('1 · natureza',cap1(N.nat.n)+' — '+N.nat.d+'.');
  h+=bl('2 · o que rege neste mapa',N.rege.length
      ? li(N.rege.map(x=>'<b>'+x+'ª</b> — '+HOUSE_THEME[x]))
        +'<p>Estes assuntos ficam sob a administração de '+PT_NAME[k]+': a condição dele é a condição deles.</p>'
      : '<p>Nenhuma casa sob sua regência neste mapa. Atua apenas pela casa que ocupa e pelos aspectos que faz.</p>');
  const meuT=lista(N.rege.map(h=>HOUSE_TAG[h]));
  h+=bl('3 · onde isso se realiza','<p>Casa '+N.casa+' — '+HOUSE_THEME[N.casa]+'.'
      +(N.rege.length
        ? (N.rege.length===1&&N.rege[0]===N.casa
           ? ' Rege a própria casa que ocupa: '+HOUSE_TAG[N.casa]+' se torna o campo central da vida, sem intermediário.'
           : ' Ou seja: '+meuT+' '+(N.rege.length>1?'tendem':'tende')+' a se realizar '+prep('por',HOUSE_TAG[N.casa])+'.')
        :'')+'</p>');
  h+=bl('4 · o que o signo modifica','<p>'+SIGNS[N.s]+' ('+SIGN_ELEM[N.s]+', '+SIGN_MODE[N.s]+'): o modo é '
      +PL_MODO_EL[SIGN_ELEM[N.s]]+'. '+cap1(PL_MODO_MO[SIGN_MODE[N.s]])+' mais do que inicia ou muda.</p>');
  h+=bl('5 · dignidade','<p><b>'+N.dig.n+'</b> — '+N.dig.t+'.'
      +(N.p.dig?(' <em>'+N.p.dig+'</em>'):'')+'</p>');
  const rec=[];
  if(N.dependencia)rec.push(N.dependencia.t);
  N.recepcoes.forEach(r=>rec.push(r.t));
  h+=bl('6 · recepção e dependência',rec.length?li(rec):'<p>Sem recepção relevante: entrega ou não entrega por conta própria.</p>');
  h+=bl('7 · circuitos',N.circuitos.length?li(N.circuitos.map(c=>c.t))
      :'<p>Nenhuma fricção estrutural entre o signo deste planeta e os demais regentes.</p>');
  if(N.psi){
    h+=bl('leitura psicológica'+(N.psi.intel?(' · '+N.psi.intel):''),
      '<p class="nxd-ps">'+N.psi.modulado+'</p>'
      +'<p class="nxd-src">Campo da casa '+N.casa+': '+N.psi.desc+'.<br>'
      +'Formulação original: “'+N.psi.bruto+'”</p>');
  } else {
    h+=bl('leitura psicológica','<p class="nxd-src">O material de referência (Olavo de Carvalho, <i>Planetas nas Casas</i>) não cobre Mercúrio. Esta camada não se aplica aqui.</p>');
  }
  h+=bl('síntese','<p class="nxd-fim">'+natalSintese(N)
      +(natalCircuito(N)?(' <b>Mas:</b> '+natalCircuito(N)):'')+'</p>');
  return h+'</div>';
}
function bindNatal(){
  const w=$('p-natal'); if(!w)return;
  w.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('[data-nx]');
    if(b&&typeof tlDrawer==='function'){
      try{tlDrawer(PT_NAME[b.dataset.nx]+' — núcleo natal',natalDrawerHTML(b.dataset.nx));}
      catch(x){console.error('natal drawer',x);}
    }
  });
}
