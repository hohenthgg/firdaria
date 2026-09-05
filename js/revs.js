/* ============================================================
   REVS.JS — REVOLUÇÕES (RETORNOS) PLANETÁRIAS GENÉRICAS
   Modelo aberto: qualquer planeta pode ter revolução. Não depende de
   RS_DATA/RSMETA (que permanecem apenas como cache da Revolução Solar
   importada). O tipo selecionado substitui a camada contextual da síntese —
   nunca se combinam silenciosamente todas as revoluções.
   Base doutrinária: Döser (rs-001/rs-002, rl-001) e Abū Ma'shar (pn4-001):
   julgar o planeta "nos dois tempos" — natal (promessa) e revolução (entrega).
   ============================================================ */

const REV_KINDS=[
  {id:'solar', curto:'Aniversário. O ano que se inicia.',     key:'sun',     label:'Solar',      per:365.2425, sigla:'RS',
   o:'Retorno do Sol ao grau exato do seu nascimento (aniversário).',
   foco:'o ano que se inicia: direção, vitalidade e propósito',
   campo:'direção e propósito do ano'},
  {id:'lunar', curto:'Retorno da Lua. Emoções, lar e necessidades.',     key:'moon',    label:'Lunar',      per:27.3216,  sigla:'RL',
   o:'Retorno da Lua ao grau natal (cerca de 27 dias).',
   foco:'o mês em curso: emoções, casa, rotina e necessidades',
   campo:'clima emocional e doméstico do mês'},
  {id:'mercurial', curto:'Retorno de Mercúrio. Comunicação, estudos e movimentos.', key:'mercury', label:'Mercurial',  per:365.25,   sigla:'RMe',
   o:'Retorno de Mercúrio ao grau natal.',
   foco:'comunicação, documentos, estudos e deslocamentos',
   campo:'papéis, conversas e trânsito de informação'},
  {id:'venusiana', curto:'Retorno de Vênus. Relacionamentos, valores e prazer.', key:'venus',   label:'Venusiana',  per:365.25,   sigla:'RVe',
   o:'Retorno de Vênus ao grau natal.',
   foco:'relacionamentos, acordos, valores e prazer',
   campo:'vínculos, acordos e dinheiro de afeto'},
  {id:'marcial', curto:'Retorno de Marte. Ação, coragem e iniciativas.',   key:'mars',    label:'Marcial',    per:686.98,   sigla:'RMa',
   o:'Retorno de Marte ao grau natal.',
   foco:'ação, disputa, iniciativa e desgaste físico',
   campo:'onde se gasta força e se enfrenta atrito'},
  /* arquitetura preservada para uso futuro — não exibidos no seletor */
  {id:'jupiteriana', curto:'Retorno de Júpiter. Expansão e amparo.',key:'jupiter',label:'Jupiteriana',per:4332.6,   sigla:'RJu',
   o:'Retorno de Júpiter ao grau natal (cerca de 12 anos).',
   foco:'expansão, amparo institucional e crescimento',
   campo:'onde o ciclo longo se abre', off:true},
  {id:'saturnina', curto:'Retorno de Saturno. Estrutura e maturidade.', key:'saturn',  label:'Saturnina',  per:10759.2,  sigla:'RSa',
   o:'Retorno de Saturno ao grau natal (cerca de 29 anos).',
   foco:'estrutura, maturidade, encargos e encerramentos',
   campo:'onde o ciclo longo cobra consolidação', off:true}
];
const REV_BY_ID=Object.fromEntries(REV_KINDS.map(k=>[k.id,k]));
let REV_SEL='solar';
const REV_CACHE={};

function revKinds(){return REV_KINDS.filter(k=>!k.off);}
/* ---------- lugar do retorno ----------
   A tradição calcula o retorno para onde a pessoa ESTÁ no momento do
   retorno, que nem sempre é o lugar de nascimento. Cada revolução pode
   ter o seu próprio lugar; na falta dele, vale o do nascimento. */
function revLocalKey(kindId,startMs){
  return 'agx_revloc_'+kindId+'_'+(startMs?Math.round(startMs/86400000):'x');
}
function revLocalGet(kindId,startMs){
  try{const v=JSON.parse(localStorage.getItem(revLocalKey(kindId,startMs))||'null');
    return (v&&isFinite(v.lat)&&isFinite(v.lon))?v:null;}catch(e){return null;}
}
function revLocalSet(kindId,startMs,v){
  try{const k=revLocalKey(kindId,startMs);
    if(v)localStorage.setItem(k,JSON.stringify(v)); else localStorage.removeItem(k);}catch(e){}
}
function revPlaceNatal(){
  const p=(typeof STATE!=='undefined'&&STATE.natal&&STATE.natal.place)||null;
  if(p&&isFinite(p.lat)&&isFinite(p.lon))return {lat:p.lat,lon:p.lon,nome:p.nome||null};
  return null;
}
function revPlace(kindId,startMs){
  if(kindId){const own=revLocalGet(kindId,startMs); if(own)return own;}
  return revPlaceNatal();   // sem lugar não há ângulos confiáveis
}
const wrap180=x=>{x=((x+180)%360+360)%360-180;return x;};

/* --- localização do retorno: TODAS as passagens pela longitude natal ---
   A versão anterior aceitava só o cruzamento direto (diferença subindo
   de negativa para positiva) e, ao procurar o fim do ciclo, começava a
   busca 35% do período adiante — o que podia saltar passagens próximas
   e ignorava por completo as passagens retrógradas. Agora detectam-se
   TODAS as mudanças de sinal, em qualquer sentido, e separa-se o que é
   contato astronômico do que é convenção interpretativa de ciclo. */
function revDiff(key,t,Ln){return wrap180(geoLon(key,new Date(t))-Ln);}
function revBisect(key,Ln,ta,tb){
  for(let i=0;i<48;i++){
    const tm=(ta+tb)/2, fa=revDiff(key,ta,Ln), fm=revDiff(key,tm,Ln);
    if((fa<=0)===(fm<=0))ta=tm; else tb=tm;
    if(tb-ta<1000)break;                          // 1 segundo basta
  }
  return (ta+tb)/2;
}
/* passagens no intervalo [t0,t1], em ordem cronológica.
   sentido: 'direta' quando o planeta cruza avançando; 'retrograda'
   quando cruza recuando. */
function revPassagens(key,Ln,t0,t1,per){
  const passo=Math.max(0.2,per/120)*DAY;          // metade do passo anterior
  const out=[];
  let tA=t0, fA=revDiff(key,tA,Ln);
  for(let t=t0+passo; t<=t1; t+=passo){
    const fB=revDiff(key,t,Ln);
    /* mudança de sinal sem salto de fase (o wrap180 pula 360° no lado oposto) */
    if((fA<=0)!==(fB<=0) && Math.abs(fB-fA)<180){
      const tc=revBisect(key,Ln,tA,t);
      const antes=geoLon(key,new Date(tc-3600e3)), depois=geoLon(key,new Date(tc+3600e3));
      const avanca=wrap180(depois-antes)>=0;
      out.push({t:tc, sentido:avanca?'direta':'retrograda'});
    }
    tA=t; fA=fB;
  }
  return out;
}
/* último retorno em t <= T (null se anterior ao nascimento) */
function revStartBefore(key,Ln,T,per){
  const ini=Math.max(BIRTH-per*DAY, T-per*1.8*DAY);
  const ps=revPassagens(key,Ln,ini,T,per);
  return ps.length?ps[ps.length-1].t:null;
}
/* primeiro retorno depois de T — sem janela morta:
   a busca começa logo após T, não 35% do período adiante */
function revStartAfter(key,Ln,T,per){
  const ps=revPassagens(key,Ln,T+60000,T+per*1.8*DAY,per);
  return ps.length?ps[0].t:null;
}
/* --- aspectos de um conjunto de pontos (pares planetários tradicionais) --- */
const REV_PL=['sun','moon','mercury','venus','mars','jupiter','saturn'];
/* delega ao motor único — o mesmo do natal e dos mapas importados */
function aspectPairs(ptsLon){ return aspectosDe(ptsLon,REV_PL); }

/* --- construção da revolução vigente de um tipo, numa data --- */
function revolutionFor(kindId,date){
  const K=REV_BY_ID[kindId];
  if(!K||typeof NATAL==='undefined'||!NATAL)return null;
  if(typeof Astronomy==='undefined')return null;
  const nat=NATAL.pts[K.key]; if(!nat)return null;
  const Ln=nat.lon, T=date.getTime();
  const startMs=revStartBefore(K.key,Ln,T,K.per);
  if(startMs==null)return null;
  const pl=revPlace(kindId,startMs); if(!pl)return null;
  const ck=kindId+'@'+Math.round(startMs/60000)+'@'+pl.lat.toFixed(3)+','+pl.lon.toFixed(3);
  if(REV_CACHE[ck])return REV_CACHE[ck];
  /* CONTATOS ASTRONÔMICOS — todas as passagens pelo grau natal em torno
     deste retorno. Mercúrio, Vênus e Marte podem cruzar três vezes
     (direta, retrógrada e direta de novo) numa mesma estação; a janela
     é larga o bastante para apanhá-las, à frente e atrás do contato. */
  const janela=Math.min(120, Math.max(20, K.per*0.12))*DAY;
  const contatosGrau=revPassagens(K.key,Ln,startMs-janela,startMs+janela,K.per)
    .map(p=>({t:p.t,sentido:p.sentido}));
  /* CONVENÇÃO DE CICLO — coisa distinta dos contatos acima: o ciclo vai
     deste retorno até a próxima passagem direta pelo mesmo grau, já
     fora da janela de vaivém. */
  const seguintes=revPassagens(K.key,Ln,startMs+janela,startMs+K.per*1.8*DAY,K.per);
  const proxDireta=seguintes.find(p=>p.sentido==='direta');
  const endMs=proxDireta?proxDireta.t:(seguintes.length?seguintes[seguintes.length-1].t:null);
  let ch;
  try{ch=computeChart(new Date(startMs),pl.lat,pl.lon);}catch(e){return null;}

  const ascLon=ch.asc, ascSign=signOf(ascLon), ascRuler=SIGN_RULER[ascSign];
  const local=pl, localProprio=!!revLocalGet(kindId,startMs);
  const houseInRev=L=>houseByRule(L,ch.cusps);
  const houseInNatal=L=>houseByRule(L,NATAL.cusps);
  // planetas natais projetados nas casas da revolução (bi-roda natal→revolução)
  const overlay={}; REV_PL.forEach(k=>{if(NATAL.pts[k])overlay[k]=houseInRev(NATAL.pts[k].lon);});
  // aspectos natais repetidos na revolução (rs-002: promessa daquele aspecto se manifesta)
  const natLon={},revLon={};
  REV_PL.forEach(k=>{if(NATAL.pts[k])natLon[k]=NATAL.pts[k].lon; if(ch.pts[k])revLon[k]=ch.pts[k].lon;});
  const natAsp=aspectPairs(natLon), revAsp=aspectPairs(revLon);
  /* aspectos da própria revolução ficam guardados: sem eles o ranking
     de trânsitos perde os ecos quando a RS vem de arquivo importado */
  const repeats=natAsp.filter(n=>revAsp.some(r=>r.a===n.a&&r.b===n.b&&r.ang===n.ang));
  // contatos principais: planeta da revolução sobre ponto natal sensível (≤3°)
  const alvos=[{k:'asc',lon:NATAL.asc,nm:'Ascendente'},{k:'mc',lon:NATAL.mc,nm:'Meio do Céu'}]
    .concat(REV_PL.filter(k=>NATAL.pts[k]).map(k=>({k,lon:NATAL.pts[k].lon,nm:PT_NAME[k]})));
  const contatos=[];
  REV_PL.forEach(k=>{ if(!ch.pts[k])return;
    alvos.forEach(al=>{ const sep=adiff(ch.pts[k].lon,al.lon);
      for(const [ang,gl,cls] of ASPECTS){ if(Math.abs(sep-ang)<=3){
        contatos.push({rev:k,alvo:al.k,alvoNm:al.nm,ang,cls,gl,orb:Math.abs(sep-ang)});break;} }
    });});
  contatos.sort((a,b)=>a.orb-b.orb);

  const R={
    kind:kindId, K, label:K.label, sigla:K.sigla, planetKey:K.key,
    start:new Date(startMs), end:endMs?new Date(endMs):null, chart:ch,
    ascLon, ascSign, ascSignNm:SIGNS[ascSign], ascRuler,
    ascNatalHouse:houseInNatal(ascLon),                 // área natal reativada
    ascRulerRevHouse:ch.pts[ascRuler]?houseInRev(ch.pts[ascRuler].lon):null,
    ascRulerNatalHouse:NATAL.pts[ascRuler]?NATAL.pts[ascRuler].h:null,
    planetRevHouse:ch.pts[K.key]?houseInRev(ch.pts[K.key].lon):null,
    planetNatalHouseNow:ch.pts[K.key]?houseInNatal(ch.pts[K.key].lon):null,
    overlay, repeats, contatos:contatos.slice(0,6), local, localProprio, startMs,
    aspectos:revAsp, aspectosNatais:natAsp,
    passagens:contatosGrau,
    temRetrogrado:contatosGrau.some(p=>p.sentido==='retrograda'),
    passagensRepetidas:contatosGrau.length>1,
    convencaoCiclo:'do contato até a próxima passagem direta pelo mesmo grau',
    houseOfRev:houseInRev, houseOfNatal:houseInNatal
  };
  REV_CACHE[ck]=R;
  return R;
}
/* revolução do tipo selecionado, na data */
function revNow(date){return revolutionFor(REV_SEL,date);}
function revSetKind(id){ if(REV_BY_ID[id]){REV_SEL=id;return true;} return false; }

/* --- casa da revolução ocupada por um planeta (ambiente de manifestação) --- */
function revHouseOfPlanet(R,k){
  if(!R||!R.chart.pts[k])return null;
  return R.houseOfRev(R.chart.pts[k].lon);
}
/* --- a revolução reforça este planeta / esta casa? (peso médio/alto) --- */
function revReinforces(R,k,houseN){
  if(!R)return null;
  const out=[];
  if(k){
    if(k===R.ascRuler) out.push(['alto','é regente do Ascendente da '+R.label,'revasc:'+k]);
    if(k===R.planetKey) out.push(['alto','é o planeta que retorna na '+R.label,'revplaneta:'+k]);
    const h=revHouseOfPlanet(R,k);
    if(h&&[1,4,7,10].includes(h)) out.push(['medio','está angular na '+R.label+' (casa '+h+')','revang:'+k]);
    /* mesma origem que a linha de testemunhos(): o fato é um só */
    if(R.repeats.some(r=>r.a===k||r.b===k)) out.push(['medio','repete na revolução um aspecto natal seu','repete:'+k]);
    if(R.contatos.some(c=>c.rev===k&&(c.alvo==='asc'||c.alvo==='mc'))) out.push(['medio','toca um ângulo natal na '+R.label,'revangnat:'+k]);
  }
  if(houseN){
    if(R.ascNatalHouse===houseN) out.push(['alto','o Ascendente da '+R.label+' cai nesta casa natal','revasccasa:'+houseN]);
    if(R.ascRulerNatalHouse===houseN) out.push(['medio','o regente do Ascendente da revolução ocupa esta casa natal','revregcasa:'+houseN]);
  }
  return out;
}
