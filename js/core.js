/* ============================================================
   CORE.JS — cálculo puro: tempo, efemérides, relevância, janelas
   Sem DOM. Depende apenas de data.js.
   ============================================================ */
const DAY=864e5;
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fdate=d=>d.getUTCDate()+' '+MESES[d.getUTCMonth()]+' '+d.getUTCFullYear();

/* ---------- idade ----------
   ageAt devolve idade fracionária em anos médios (serve a gráficos e
   interpolações). Para tudo que dependa da VIRADA anual — profecção,
   firdária, seleção de revolução — usa-se a idade civil abaixo, que
   conta aniversários de calendário.

   Convenção declarada: as datas do app são tratadas em UTC (o mapa é
   guardado com o instante UTC do nascimento); a virada ocorre no
   aniversário civil, isto é, quando mês e dia igualam os do
   nascimento. Nascidos em 29/02 fazem aniversário em 01/03 nos anos
   comuns — regra explicitada em anivEm(). */
const ageAt=d=>(d.getTime()-BIRTH)/DAY/365.2425;
function anivEm(ano){
  const n=new Date(BIRTH);
  const mes=n.getUTCMonth(), dia=n.getUTCDate();
  const hh=n.getUTCHours(), mm=n.getUTCMinutes(), ss=n.getUTCSeconds();
  if(mes===1&&dia===29){
    /* 29 de fevereiro: em ano bissexto a virada é em 29/02; nos demais,
       em 01/03 — convenção declarada, e não um deslize de calendário */
    const bis=(ano%4===0&&ano%100!==0)||(ano%400===0);
    return bis?Date.UTC(ano,1,29,hh,mm,ss):Date.UTC(ano,2,1,hh,mm,ss);
  }
  return Date.UTC(ano,mes,dia,hh,mm,ss);
}
/* idade civil completa (anos inteiros já vividos) numa data */
function idadeCivil(d){
  const n=new Date(BIRTH);
  let a=d.getUTCFullYear()-n.getUTCFullYear();
  if(d.getTime()<anivEm(d.getUTCFullYear()))a--;
  return a;
}
/* início e fim do ano de profecção que contém a data */
function anoProfectado(d){
  const idade=idadeCivil(d);
  const anoIni=new Date(BIRTH).getUTCFullYear()+idade;
  return {idade, ini:new Date(anivEm(anoIni)), fim:new Date(anivEm(anoIni+1))};
}
/* ano da última Revolução Solar anterior à data — pelo aniversário real
   (mesma convenção de anivEm: mês, dia e hora do nascimento em UTC) */
const rsYearOf=d=>{
  const y=d.getUTCFullYear();
  if(!BIRTH)return y;
  return d.getTime()>=anivEm(y)?y:y-1;
};

/* ---------- FIRDÁRIA ----------
   Períodos persas (Albumasar): a sequência começa pelo Sol nos mapas
   diurnos e pela Lua nos noturnos (FIRD é montado em chart.js conforme a
   seita geométrica). Cada era maior divide-se em sete sub-períodos
   iguais, começando pelo próprio senhor da era e seguindo a ordem dos
   sete planetas. A idade aqui é fracionária em anos médios — a firdária
   é medida por DURAÇÃO contínua, não pela virada de aniversário civil
   que rege a profecção; a diferença de convenção está declarada. */
function firdAt(age){
  let a=age;
  for(const [k,nm,len] of FIRD){
    if(a<len){
      const subs=FIRD.slice(0,7).map(f=>f[0]);
      let si=subs.indexOf(k); if(si<0) si=0;
      const part=len/7, idx=Math.min(6,Math.floor(a/part));
      const subKey=subs[(si+idx)%7];
      const subStart=BIRTH+(age-a+idx*part)*365.2425*DAY;
      return {major:nm, majorKey:k,
              sub:(FIRD.find(f=>f[0]===subKey)||[,subKey])[1], subKey,
              from:age-a, len, subStart, subEnd:subStart+part*365.2425*DAY,
              metodo:'firdária persa · durações em anos médios a partir do nascimento'};
    }
    a-=len;
  }
  return {major:'—',majorKey:null,sub:'—',subKey:null,
          metodo:'firdária persa · fora do ciclo de 75 anos tabelado'};
}

/* ---------- FONTE ÚNICA DO SENHOR DO ANO ----------
   Todo o app consome profAt(). Ela distingue explicitamente:
     signIdx  · o SIGNO ativado pela profecção anual por signos inteiros
     lordKey  · o SENHOR DO ANO — regente domiciliar desse signo
     houseN   · a casa contada a partir do Ascendente (1..12)
     cuspSign · o signo da CÚSPIDE PLACIDUS dessa casa natal
     lordCusp · o regente dessa cúspide — critério ALTERNATIVO, exibido
                lado a lado, nunca somado nem substituído ao senhor do ano
   O método está nomeado em `metodo` para aparecer na interface. */
function profAt(age){
  /* profecção anual por signos inteiros: o Ascendente avança um signo por ano.
     O Senhor do Ano é o regente do SIGNO profectado — não o regente da cúspide
     Placidus daquela casa, que é outro signo sempre que a casa não coincide
     com o signo inteiro. */
  const base=NATAL?Math.floor(n360(NATAL.asc)/30):0;
  const s=(base+Math.floor(age))%12;
  const houseN=((Math.floor(age))%12)+1;
  const cuspSign=NATAL?signOf(NATAL.cusps[houseN-1]):null;
  return {signIdx:s, sign:SIGNS[s], houseN,
          metodo:'signos inteiros a partir do Ascendente',
          lordKey:SIGN_RULER[s],
          cuspSign, cuspSignNm:cuspSign!=null?SIGNS[cuspSign]:null,
          lordCuspide:NATAL?NATAL.rulers[houseN]:null,
          divergeCuspide:!!(NATAL&&NATAL.rulers[houseN]!==SIGN_RULER[s])};
}
function ruledHouses(k){return Object.entries(NATAL.rulers).filter(([h,r])=>r===k).map(([h])=>+h);}


/* ---------- efemérides ---------- */
let usingAE=false;
function tlon(nm,d){
  if(typeof Astronomy!=='undefined'){try{const v=Astronomy.GeoVector(Astronomy.Body[nm],d,true);usingAE=true;return n360(Astronomy.Ecliptic(v).elon);}catch(e){}}
  usingAE=false;const days=(d.getTime()-Date.UTC(2000,0,1,12))/DAY;const e=MEAN[nm];return n360(e[0]+e[1]*days);
}


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

/* ---------- janela de um trânsito: entrada no orbe, exatidão, saída ----------
   Um trânsito não é um instante: é um intervalo. O app passa a mostrar
   as três datas — quando o corpo ENTRA no orbe, quando o aspecto fica
   EXATO e quando SAI —, em vez de apenas o orbe de hoje.

   Corpos retrógrados podem cruzar o mesmo grau três vezes; por isso a
   varredura recolhe TODAS as passagens exatas dentro da janela, e não
   só a primeira. Nenhuma delas é apresentada como acontecimento certo:
   é a geometria do contato, e nada mais. */
function transitoJanela(tn, natalLon, ang, orb, d, limiteDias){
  const f=t=>Math.abs(adiff(tlon(tn,new Date(t)), natalLon))-ang;   // 0 no exato
  const dentro=t=>Math.abs(f(t))<=orb;
  const t0=d.getTime();
  if(!dentro(t0))return null;
  const lim=(limiteDias||900)*DAY;
  /* passo proporcional à velocidade do corpo: fino para a Lua, largo para
     os lentos. A bissecção refina depois, então o passo só precisa ser
     pequeno o bastante para não pular uma passagem exata. */
  const PASSO_DIAS={Moon:0.02, Mercury:0.2, Venus:0.25, Sun:0.25,
                    Mars:0.5, Jupiter:1, Saturn:1};
  const passo=(PASSO_DIAS[tn]||0.25)*DAY;
  const borda=dir=>{
    let t=t0;
    while(Math.abs(t-t0)<lim){
      const p=t+dir*passo;
      if(!dentro(p)){
        let a=t, b=p;                       // bissecção na borda do orbe
        for(let i=0;i<40;i++){
          const m=(a+b)/2;
          if(dentro(m))a=m; else b=m;
        }
        return (a+b)/2;
      }
      t=p;
    }
    return null;                            // não saiu dentro do limite
  };
  const entrada=borda(-1), saida=borda(1);
  /* passagens exatas: mudanças de sinal de f dentro da janela */
  const exatos=[];
  const ini=entrada!=null?entrada:t0-lim, fim=saida!=null?saida:t0+lim;
  let tA=ini, fA=f(tA);
  for(let t=ini+passo; t<=fim; t+=passo){
    const fB=f(t);
    if((fA<=0)!==(fB<=0)&&Math.abs(fB-fA)<orb*4){
      let a=tA,b=t;
      for(let i=0;i<40;i++){const m=(a+b)/2; if((f(a)<=0)===(f(m)<=0))a=m; else b=m;}
      exatos.push((a+b)/2);
    }
    tA=t; fA=fB;
  }
  return {entrada, saida, exatos,
    passagens:exatos.length,
    repetido:exatos.length>1,
    duracaoDias:(entrada!=null&&saida!=null)?((saida-entrada)/DAY):null,
    incompleta:(entrada==null||saida==null),
    nota:exatos.length>1
      ? 'O aspecto fica exato '+exatos.length+' vezes: o corpo retrograda sobre '
        +'o mesmo grau. É a mesma configuração revisitada, e não '+exatos.length
        +' acontecimentos.'
      : exatos.length===0
      ? 'O aspecto entra e sai do orbe sem chegar a perfazer: aproxima-se do '
        +'ângulo exato, volta atrás e afasta-se. Contato parcial.'
      : (entrada==null||saida==null)
      ? 'A janela excede o intervalo varrido — o contato é mais longo do que o '
        +'período examinado.'
      : null};
}

/* ---------- motor de relevância (auditável) ---------- */
function scoreHit(hit,d){
  /* mesma distinção de tempoState: firdária por duração, profecção por
     aniversário civil */
  const age=ageAt(d), f=firdAt(age), p=profAt(idadeCivil(d)), y=rsYearOf(d);
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


/* ---------- eletiva ---------- */
/* ELECT_SIG (significador natural da atividade + casas) é definido em tables.js. */


/* síntese do ano = cartão executivo (agenda → canal → demanda → síntese) */
function synthYear(age,p,f){
  return execCardHTML(age,true);
}

/* ---------- regra dos 5° na personalidade ----------
   Planeta a menos de 5° da cúspide do Ascendente empurra CONCRETAMENTE
   traços da própria natureza nos eixos cujo polo casa com esses traços.
   (Ex.: Saturno na cúspide → introversão, vigilância, rigidez, disciplina,
   autocontrole, reserva, seletividade, pessimismo prudencial; e reduz
   espontaneidade, flexibilidade, confiança imediata.) */


