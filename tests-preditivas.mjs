/* ============================================================
   tests-preditivas.mjs — suíte das Direções Primárias e das
   Progressões Secundárias (js/preditivas.js).

   Não valida por semelhança de idade: cada asserção confere uma
   propriedade verificável — arco contra simulação independente do
   movimento primário, resíduo do refinamento, separação das séries,
   deduplicação de eixos, invalidação de cache, e assim por diante.

   Como rodar:
     python3 -m http.server 8099 &
     node tests-preditivas.mjs [url-do-aspectarian]

   Requer playwright-core e um Chromium. Defina CHROME_PATH se o
   executável não estiver no caminho padrão do ambiente.
   ============================================================ */
import { chromium } from 'playwright-core';

const URL_MAPA = process.argv[2] ||
  'https://www.aspectarian.com/chart?date=1994-08-17T06%3A00&lat=-22.2270778&long=-45.93937160000001&name=lucas&t=America%2FSao_Paulo';
const BASE = process.env.BASE_URL || 'http://localhost:8099/index.html';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
pg.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION|404|Failed to load/.test(m.text())) errs.push('CONSOLE: ' + m.text()); });
await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(800);
await pg.fill('#imp-url', URL_MAPA); await pg.click('#imp-run'); await pg.waitForTimeout(12000);

const R=await pg.evaluate(()=>{
 const T=[], ok=(n,c,d)=>T.push({t:n,ok:!!c,d:d===undefined?'':String(d)});
 const F=pvFrame(), ap=Math.abs;

 /* 1. VERIFICAÇÃO INDEPENDENTE DO ARCO — simulação do movimento primário.
       Gira o RAMC e observa quando o promissor cruza o CÍRCULO DE POSIÇÃO do
       significador (definido pelo polo dele). Não reusa a fórmula de arco. */
 const sig=pvSignificadores(F).find(s=>s.key==='saturn');
 const prom=pvPromissores(F).find(p=>p.pl==='venus'&&p.A===0);
 const A=pvArcosPUP(sig,prom,F);
 const P=pvPoloPUP(sig.ra,sig.dec,F);
 // sob rotação θ, a AO do promissor sob o polo fixo cai θ; o alvo é a AO do significador
 const resid=t=>{const ad=Math.asin(Math.tan(prom.dec*Math.PI/180)*Math.tan(P.polo*Math.PI/180))*180/Math.PI;
   const oa=n360(prom.ra-(P.leste?ad:-ad)-t); return norm180(oa-A.oaS);};
 let sim=null; for(let t=0;t<=360;t+=0.25){if(resid(t)*resid(t+0.25)<0&&ap(resid(t))<10){sim=pvRaiz(resid,t,t+0.25,40);break;}}
 ok('arco PUP confere com simulação do movimento primário', sim!==null&&ap(sim-A.direta)<1e-4,
    'fórmula '+A.direta.toFixed(6)+'° · simulação '+(sim===null?'—':sim.toFixed(6))+'°');

 /* 2. MC: o arco deve ser exatamente AR(promissor) − RAMC */
 const sigMC=pvSignificadores(F).find(s=>s.key==='mc');
 const pSat=pvPromissores(F).find(p=>p.pl==='saturn'&&p.A===0);
 const AMC=pvArcosPUP(sigMC,pSat,F);
 ok('MC: arco = AR(promissor) − RAMC', ap(AMC.direta-n360(pSat.ra-F.ramc))<1e-9,
    AMC.direta.toFixed(6)+' vs '+n360(pSat.ra-F.ramc).toFixed(6));

 /* 3. DIRETA e CONVERSA são séries independentes (não o menor caminho) */
 ok('direta + conversa = 360° (séries independentes)', ap((A.direta+A.conversa)-360)<1e-9,
    A.direta.toFixed(3)+' + '+A.conversa.toFixed(3));
 PV_SENT='direta'; PV_DIR_CACHE=null; const soD=direcoesPrimarias();
 PV_SENT='conversa'; PV_DIR_CACHE=null; const soC=direcoesPrimarias();
 PV_SENT='ambas'; PV_DIR_CACHE=null; const amb=direcoesPrimarias();
 ok('filtro de sentido separa as séries',
    soD.every(x=>x.sentido==='direta')&&soC.every(x=>x.sentido==='conversa')
    &&amb.length===soD.length+soC.length,
    'diretas '+soD.length+' · conversas '+soC.length+' · ambas '+amb.length);
 ok('há conversas dentro da vida', soC.length>0, soC.length+' contatos');

 /* 4. DEDUPLICAÇÃO DE EIXOS — Dsc e IC não são significadores próprios */
 ok('só Asc e MC como ângulos significadores',
    pvSignificadores(F).filter(s=>s.ang).map(s=>s.key).join(',')==='asc,mc');
 // MC ⚹ Vênus e IC △ Vênus seriam o mesmo fenômeno: não podem coexistir
 const mcVen=amb.filter(x=>x.sig.key==='mc'&&x.prom.pl==='venus');
 const chaves=new Set(mcVen.map(x=>x.prom.lon.toFixed(4)+'/'+x.sentido));
 ok('nenhum contato de eixo duplicado', chaves.size===mcVen.length,
    mcVen.length+' contatos MC×Vênus, '+chaves.size+' pontos distintos');
 ok('o eixo tocado é identificado', amb.some(x=>x.eixo==='Descendente')&&amb.some(x=>x.eixo==='Fundo do Céu'));

 /* 5. CASA GEOMÉTRICA × REGRA DOS 5° */
 const c10=NATAL.cusps[9];
 const antes=n360(c10-3);                                  // 3° antes da cúspide da 10
 ok('casa geométrica não antecipa o ingresso', casaGeom(antes,NATAL.cusps)===9,
    'geométrica '+casaGeom(antes,NATAL.cusps)+' · com regra dos 5° '+houseByRule(antes,NATAL.cusps));
 const L=pvLiminar(antes,NATAL.cusps);
 ok('regra dos 5° só sinaliza participação', L.casa===9&&L.participa===10&&ap(L.dist-3)<0.001,
    'casa '+L.casa+', participa '+L.participa+' a '+L.dist.toFixed(2)+'°');

 /* 6. REFINAMENTO REAL — a raiz devolvida é de fato exata */
 const evs=progressoesSecundarias(0,96);
 const asp=evs.find(e=>e.classe==='aspecto'&&e.mover==='moon');
 if(asp){const alvo=pvAlvos()[asp.alvo].lon, sinal=asp.A;
   const g=a=>norm180(pvAmostra(a,F).lon.moon-alvo-sinal);
   const g2=a=>norm180(pvAmostra(a,F).lon.moon-alvo+sinal);
   ok('aspecto progredido refinado: resíduo < 0,01°', ap(g(asp.anos))<0.01||ap(g2(asp.anos))<0.01,
      'resíduo '+Math.min(ap(g(asp.anos)),ap(g2(asp.anos))).toFixed(5)+'°');}
 const ing=evs.find(e=>e.classe==='casa');
 if(ing){const r=ap(norm180(pvAmostra(ing.anos,F).lon[ing.mover]-ing.cusp));
   ok('ingresso de casa refinado sobre a cúspide: resíduo < 0,01°', r<0.01, 'resíduo '+r.toFixed(5)+'°');}
 const sg=evs.find(e=>e.classe==='signo');
 if(sg){const L2=pvAmostra(sg.anos,F).lon[sg.mover]; const r=ap(norm180(L2-Math.round(L2/30)*30));
   ok('ingresso de signo refinado sobre a fronteira: resíduo < 0,01°', r<0.01, 'resíduo '+r.toFixed(5)+'°');}
 const est=evs.find(e=>e.classe==='estacao');
 ok('estação progredida detectada', !!est, est?est.titulo+' aos '+est.anos.toFixed(2):'nenhuma em 0–96');
 if(est){const v=a=>norm180(pvAmostra(a+0.02,F).lon[est.mover]-pvAmostra(a-0.02,F).lon[est.mover]);
   ok('estação refinada: velocidade ≈ 0', ap(v(est.anos))<0.002, 'v = '+v(est.anos).toFixed(6)+'°/passo');
   // referência independente: varredura bruta da longitude real a 0,5 dia
   let ref=null,ant=null;
   for(let d=est.anos-3;d<=est.anos+3;d+=0.5){
     const a=geoLon(est.mover,new Date(BIRTH+(d-0.25)*DAY)), b2=geoLon(est.mover,new Date(BIRTH+(d+0.25)*DAY));
     const s2=norm180(b2-a);
     if(ant!==null&&Math.sign(s2)!==Math.sign(ant))ref=d; ant=s2;}
   ok('estação bate com varredura independente (±0,5 dia)', ref!==null&&ap(ref-est.anos)<0.6,
      'detectada '+est.anos.toFixed(2)+' · varredura '+(ref===null?'—':ref.toFixed(1)));}
 const lun=evs.find(e=>e.classe==='lunacao');
 if(lun){const s=pvAmostra(lun.anos,F), el=norm180(s.lon.moon-s.lon.sun);
   const r=lun.titulo.includes('Nova')?ap(el):ap(ap(el)-180);
   ok('lunação progredida refinada: resíduo < 0,05°', r<0.05, lun.titulo+' · resíduo '+r.toFixed(4)+'°');}

 /* 7. ÂNGULOS PROGREDIDOS */
 const s20=pvAmostra(20,F);
 ok('MC progredido = MC natal + arco solar', ap(norm180(s20.lon.mcP-NATAL.mc-s20.arcoSolar))<1e-9,
    'arco solar '+s20.arcoSolar.toFixed(4)+'°');
 ok('Asc progredido deriva do RAMC do MC progredido',
    ap(norm180(s20.lon.ascP-ascFromRAMC(n360(Math.atan2(Math.sin(s20.lon.mcP*Math.PI/180)*Math.cos(F.eps*Math.PI/180),Math.cos(s20.lon.mcP*Math.PI/180))*180/Math.PI),F.eps,F.phi)))<1e-9);
 ok('Asc progredido → casa 1 · MC progredido → casa 10',
    PV_MOV_CASA.ascP===1&&PV_MOV_CASA.mcP===10);

 /* 8. PAPÉIS: significador = campo, promissor = agente; título não inverte */
 const it=amb.find(x=>x.sig.key==='asc'&&x.prom.pl==='jupiter'&&x.prom.A===0)||amb.find(x=>x.sig.ang);
 const pap=pvPapeis(it);
 ok('título traz o promissor primeiro', pvTitulo(it).indexOf(PT_NAME[it.prom.pl])<pvTitulo(it).indexOf('dirigido'),
    pvTitulo(it).replace(/<[^>]+>/g,''));
 ok('significador carrega a casa do campo atingido', !!pap.significador.casa, 'casa '+pap.significador.casa);
 ok('promissor carrega regências e casa ocupada',
    Array.isArray(pap.promissor.rege)&&pap.promissor.ocupa!=null,
    'rege '+pap.promissor.rege.join(',')+' · ocupa '+pap.promissor.ocupa);

 /* 9. PROMESSA: vínculo por planeta pesa mais que por casa */
 const porPl=amb.map(x=>pvPromessa(x)).filter(p=>p&&p.porPlaneta);
 const soCasa=amb.map(x=>pvPromessa(x)).filter(p=>p&&!p.porPlaneta);
 ok('planeta (3+) sempre supera casa isolada (1)',
    porPl.every(p=>p.sc>=3)&&soCasa.every(p=>p.sc<=1),
    'por planeta '+porPl.length+' · só casa '+soCasa.length);

 /* 10. CONFIRMAÇÕES distinguem planeta, casa e tema */
 CURSOR=new Date('2026-08-02T12:00:00Z');
 const alvo2=amb.filter(x=>ap(x.anos-ageAt(CURSOR))<6);
 const vias=new Set(); alvo2.forEach(x=>pvConfirmacoes(x,false).forEach(c=>vias.add(c.via)));
 ok('confirmações registram a via (planeta/casa)', vias.size>0, [...vias].join(','));

 /* 11. CACHE invalidado por mudança estrutural */
 const fp1=pvFingerprint(); const n1=direcoesPrimarias().length;
 PV_METODO='psa'; const fp2=pvFingerprint();
 ok('mudar de método muda a impressão digital', fp1!==fp2);
 const psa=direcoesPrimarias(); const n2=psa.length;
 ok('PSA produz série própria', psa!==null&&n2>0&&psa[0].metodo==='psa', n2+' contatos');
 // PSA e PUP não podem coincidir em todos os arcos
 PV_METODO='pup'; const pup=direcoesPrimarias();
 const par=(l)=>{const m={};l.forEach(x=>m[x.sig.key+'|'+x.prom.pl+'|'+x.prom.sinal+'|'+x.sentido]=x.arc);return m;};
 const mp=par(pup), ms=par(psa); let dif=0,com=0;
 Object.keys(mp).forEach(k=>{if(ms[k]!=null){com++; if(ap(mp[k]-ms[k])>0.01)dif++;}});
 ok('PUP e PSA divergem (fórmulas distintas)', com>0&&dif>0, dif+' de '+com+' arcos comuns diferem');
 // mudança de mapa invalida
 const guardaAsc=NATAL.asc; NATAL.asc=n360(NATAL.asc+10);
 ok('mudar o Ascendente muda a impressão digital', pvFingerprint()!==fp1);
 NATAL.asc=guardaAsc;
 ok('restaurar o mapa restaura a impressão digital', pvFingerprint()===fp1);

 /* 12. CLUSTERS agrupam o equivalente */
 PV_TAB='dir'; const it2=pvItens();
 const cl=it2.clusters.filter(c=>c.grupo.length>1);
 ok('clusters agrupam eventos da mesma promessa/planeta', cl.length>0,
    cl.length+' períodos · maior com '+(cl[0]?cl[0].grupo.length:0)+' eventos');
 if(cl[0])ok('cluster tem planeta dominante e nome temático', !!cl[0].dom&&pvClusterNome(cl[0]).length>10,
    pvClusterNome(cl[0]));
 ok('nenhum evento em dois clusters ao mesmo tempo',
    (()=>{const v=new Set();let d=false;it2.clusters.forEach(c=>c.grupo.forEach(g=>{const k=g.anos.toFixed(6)+g.sentido;if(v.has(k))d=true;v.add(k);}));return !d;})());

 /* 13. volume reduzido */
 ok('a tela mostra poucos resultados', it2.lista.length<=16, it2.lista.length+' avaliados');
 return T;
});
const pad=s=>s.length>62?s.slice(0,59)+'…':s.padEnd(62);
let f=0; R.forEach(t=>{if(!t.ok)f++; console.log((t.ok?'  ok  ':'FALHA ')+pad(t.t)+(t.d?('  '+t.d):''));});
console.log('\n'+R.length+' testes · '+f+' falhas');
console.log('ERRORS:', errs.length?errs.join(' | '):'(none)');
await b.close();
process.exit(f||errs.length?1:0);
