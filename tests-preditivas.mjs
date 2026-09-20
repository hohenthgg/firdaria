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
/* ============================================================
   SEGUNDA FASE — o mapa do caso relatado (§1 do brief)

   Asc 15°50' Áries, noturno. Sol 2°26' Leão na 4ª, REGENTE DA 5ª;
   Lua 10°16' Touro na 2ª, regente da 4ª; Marte 25°28' Câncer na 4ª,
   regente da 1ª e 8ª; Vênus 14°27' Leão na 5ª; Mercúrio 13°03' Câncer
   na 4ª.

   Facto biográfico: dois filhos (gémeos) entre setembro de 2019 e
   setembro de 2020. O motor rotulava outubro de 2019 como
   "Muda de residência".
   ============================================================ */
const MAPA_CASO='https://www.aspectarian.com/chart?date=2000-07-24T23%3A00'
  +'&lat=-22.2270778&long=-45.93937160000001&name=teste&t=America%2FSao_Paulo';
await pg.goto(BASE,{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(800);
await pg.evaluate(()=>{try{irPara('dados');}catch(e){}});
await pg.fill('#imp-url',MAPA_CASO); await pg.click('#imp-run');
await pg.waitForTimeout(15000);

const R2=await pg.evaluate(async()=>{
 const T=[], ok=(n,c,d)=>T.push({t:n,ok:!!c,d:d===undefined?'':String(d)});

 /* o mapa é mesmo o do brief — sem isto os testes seguintes não provam nada */
 ok('o mapa do caso carregou com Asc em Áries e seita noturna',
   SIGNS[signOf(NATAL.asc)]==='Áries'&&NATAL.sect==='noturno',
   SIGNS[signOf(NATAL.asc)]+' '+(n360(NATAL.asc)%30).toFixed(2)+'° · '+NATAL.sect);
 ok('o Sol ocupa a 4ª e REGE a 5ª — a colocação que produzia o erro',
   NATAL.pts.sun.h===4&&ruledHouses('sun').join()==='5',
   'ocupa '+NATAL.pts.sun.h+' · rege '+ruledHouses('sun').join(','));

 /* ---------- §6.1 outubro de 2019 ---------- */
 const evs=pvEventos();
 const alvo=evs.filter(e=>{
   const d=new Date(e.dPico);
   return d>=new Date(Date.UTC(2019,6,1))&&d<=new Date(Date.UTC(2020,0,31));
 });
 const cinco=alvo.find(e=>e.campo===5||(e.ambiguo&&e.campoAlt===5));
 ok('outubro de 2019 (±3 meses) tem campo 5, ou ambíguo com a 5ª à frente',
   !!cinco&&(cinco.campo===5||(cinco.ambiguo&&cinco.campo===5)),
   alvo.map(e=>new Date(e.dPico).toISOString().slice(0,7)+':'+e.campo
     +(e.ambiguo?('/'+e.campoAlt):'')).join(' '));
 if(cinco){
   const S=pvSimples(cinco);
   const txt=S.acontecimento+' '+S.porque+' '+S.quem;
   ok('o texto simples desse período fala em filho', /filho/i.test(txt), S.acontecimento);
   ok('o texto simples traz a janela datada',
     /\d{4}/.test(S.acontecimento)&&/janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i.test(S.acontecimento),
     S.acontecimento);
   ok('quando o campo é ambíguo, as duas casas são nomeadas por ordem',
     !cinco.ambiguo||/mais prov/i.test(S.quem), S.quem);
 }

 /* ---------- §6.2 nenhum rótulo de 4ª engolindo o regente da 5ª ---------- */
 const reg5=NATAL.rulers[5];
 const infratores=evs.filter(e=>{
   const pls=e.C.principal.env.pls||[];
   if(pls.indexOf(reg5)<0)return false;          // não envolve o regente da 5ª
   if(e.campo!==4)return false;                  // não foi rotulado de 4ª
   return !(e.ambiguo&&e.campoAlt===5);          // e a 5ª não aparece como alternativa
 });
 ok('nenhum evento com o regente da 5ª vira 4ª sem a 5ª como alternativa',
   infratores.length===0,
   infratores.length?infratores.map(e=>new Date(e.dPico).toISOString().slice(0,7)).join(' ')
     :('regente da 5ª = '+PT_NAME[reg5]));

 /* ---------- §6.3 Revolução Solar de 2019 ---------- */
 const rs=revolutionFor('solar',new Date(Date.UTC(2019,9,1)));
 ok('RS 2019: o regente do Asc cai na 5ª natal NESTA revolução',
   rs&&rs.ascRulerRevNatalHouse===5,
   rs?('natal '+rs.ascRulerNatalHouse+' · revolução '+rs.ascRulerRevNatalHouse):'sem RS');
 ok('RS 2019: a posição natal do regente é diferente, e fica declarada',
   rs&&rs.ascRulerDivergente===true&&rs.ascRulerNatalHouse===4,
   rs?('divergente: '+rs.ascRulerDivergente):'—');
 ok('os contatos da RS carregam a casa natal onde caem',
   rs&&(rs.contatos||[]).every(c=>typeof c.revNatalHouse==='number'),
   rs?((rs.contatos||[]).length+' contatos'):'—');
 irPara('rs');
 const foi=(typeof rsGoto==='function')&&rsGoto(2019);
 await new Promise(r=>setTimeout(r,500));
 ok('rsGoto está exposto e move o cursor da aba', foi===true);
 const simp=document.querySelector('#rs-resumo .rv-simp');
 ok('a leitura simples da RS de 2019 nomeia os filhos',
   !!simp&&/filho/i.test(simp.textContent),
   simp?simp.textContent.replace(/\s+/g,' ').slice(0,120):'(sem leitura simples)');

 /* ---------- §6.4 camada de pessoas, mapa noturno ---------- */
 const P=significadoresDePessoas();
 const nomes=f=>P[f].candidatos.map(c=>c.pl);
 const origemDe=(f,pl)=>(P[f].candidatos.find(c=>c.pl===pl)||{}).origens||[];
 ok('pai: Saturno pela natureza da seita, em mapa noturno',
   nomes('pai')[0]==='saturn'
   &&/noturno/.test(origemDe('pai','saturn').join(' ')),
   origemDe('pai','saturn').join(' / '));
 ok('pai: a Lua entra como regente da 4ª',
   nomes('pai').indexOf('moon')>=0&&/regente da 4/.test(origemDe('pai','moon').join(' ')),
   origemDe('pai','moon').join(' / '));
 ok('pai: o Sol entra como secundário e por estar na 4ª',
   nomes('pai').indexOf('sun')>=0&&/secund/.test(origemDe('pai','sun').join(' '))
   &&/está na 4/.test(origemDe('pai','sun').join(' ')),
   origemDe('pai','sun').join(' / '));
 ok('pai: Marte e Mercúrio entram por estarem na 4ª',
   ['mars','mercury'].every(k=>nomes('pai').indexOf(k)>=0
     &&/está na 4/.test(origemDe('pai',k).join(' '))),
   nomes('pai').join(','));
 ok('mãe: a Lua pela natureza da seita, em mapa noturno',
   nomes('mae')[0]==='moon'&&/noturno/.test(origemDe('mae','moon').join(' ')),
   origemDe('mae','moon').join(' / '));
 ok('mãe: Saturno entra como regente da 10ª',
   nomes('mae').indexOf('saturn')>=0&&/regente da 10/.test(origemDe('mae','saturn').join(' ')),
   origemDe('mae','saturn').join(' / '));
 ok('mãe: Vênus entra como secundária',
   nomes('mae').indexOf('venus')>=0&&/secund/.test(origemDe('mae','venus').join(' ')),
   origemDe('mae','venus').join(' / '));
 ok('todo candidato declara a sua origem',
   Object.values(P).every(f=>f.candidatos.every(c=>c.origens&&c.origens.length)));
 /* um planeta pode ser duas pessoas, e o texto não escolhe em silêncio */
 const lua=pessoaDoContato('moon',{pls:['moon'],casas:[]});
 ok('a Lua é declarada como pai OU mãe, sem escolha silenciosa',
   lua&&lua.empatado&&/pai/.test(lua.frase)&&/mãe/.test(lua.frase),
   lua?lua.frase:'—');
 const sat=pessoaDoContato('saturn',{pls:['saturn'],casas:[]});
 ok('Saturno também é declarado como as duas figuras',
   sat&&/pai/.test(sat.frase)&&/mãe/.test(sat.frase), sat?sat.frase:'—');

 /* ============================================================
    CICLO 2 — prioridade do principal, calibração, janelas e moldes
    ============================================================ */

 /* ---------- §1 a lunação manda ---------- */
 const o19=evs.find(e=>e.pico>=19.0&&e.pico<=19.6);
 ok('outubro de 2019: o contato principal é a lunação progredida sobre o Sol',
   !!o19&&pvLunacaoSobreSol(o19.C.principal),
   o19?pvTitulo(o19.C.principal).replace(/<[^>]+>/g,''):'—');
 ok('outubro de 2019: a 5ª ganha com folga (razão ≤ 0,80)',
   !!o19&&o19.campo===5&&o19.votacao.razao<=0.80,
   o19?('campo '+o19.campo+' · razão '+o19.votacao.razao+' · '
     +o19.votacao.ordem.slice(0,2).map(x=>x.casa+':'+x.peso).join(' ')):'—');
 /* a prioridade é por NATUREZA, e um ingresso nunca vence um aspecto */
 const ingressoIndevido=evs.filter(e=>
   pvEhIngresso(e.C.principal)&&e.C.grupo.some(g=>!pvEhIngresso(g)));
 ok('nenhum ingresso é principal havendo aspecto no mesmo aglomerado',
   ingressoIndevido.length===0,
   ingressoIndevido.length?ingressoIndevido.map(e=>
     new Date(e.dPico).toISOString().slice(0,7)).join(' '):'—');
 ok('a ordem de prioridade põe a lunação à frente do ingresso',
   pvPrioridadeContato(o19.C.principal)===0);

 /* ---------- §2 calibração da ambiguidade ---------- */
 const t30=evs.slice(0,30);
 const nAmb=t30.filter(e=>e.ambiguo).length;
 const pct=Math.round(100*nAmb/t30.length);
 ok('a taxa de ambiguidade nos 30 primeiros eventos fica entre 25% e 40%',
   pct>=25&&pct<=40, nAmb+'/'+t30.length+' = '+pct+'%');
 ok('o limiar está em 0,85 e a exceção de regência tem piso',
   PV_AMBIGUO===0.85&&PV_EXCECAO_PISO>0,
   'limiar '+PV_AMBIGUO+' · piso da exceção '+PV_EXCECAO_PISO);
 /* toda alternativa tem de ter voto de regência ou de eixo */
 const fracas=t30.filter(e=>{
   if(!e.ambiguo||!e.campoAlt)return false;
   return !e.votacao.linhas.some(l=>l.casa===e.campoAlt
     &&/rege a |regente d|eixo da |lunação progredida/.test(l.porque));
 });
 ok('nenhuma alternativa vem só de ocupação ou do promissor',
   fracas.length===0,
   fracas.length?fracas.map(e=>new Date(e.dPico).toISOString().slice(0,7)
     +':'+e.campoAlt).join(' '):'todas com regência ou eixo');
 ok('porRegencia é verdadeiro quando o voto vencedor veio de regência',
   !!o19&&o19.votacao.porRegencia===true
   &&o19.votacao.vencedoraPorRegencia===true,
   o19?('porRegencia '+o19.votacao.porRegencia
     +' · vencedora por regência '+o19.votacao.vencedoraPorRegencia):'—');
 /* e o flag tem de ser FALSO quando nenhuma das duas veio de regência */
 const semReg=evs.find(e=>!e.votacao.porRegencia);
 ok('porRegencia é falso quando nem vencedora nem alternativa vêm de regência',
   !!semReg, semReg?(new Date(semReg.dPico).toISOString().slice(0,7)):'(nenhum caso)');

 /* ---------- §3 janelas ---------- */
 const meses=e=>(e.dFim-e.dIni)/(30.44*86400000);
 const longas=evs.filter(e=>meses(e)>18);
 ok('nenhum evento tem janela superior a 18 meses',
   longas.length===0,
   longas.length?longas.slice(0,3).map(e=>new Date(e.dPico).toISOString().slice(0,7)
     +':'+Math.round(meses(e))+'m').join(' ')
   :('máxima '+Math.max.apply(null,evs.map(meses)).toFixed(1)+' meses'));
 const ings=evs.filter(e=>e.ingresso);
 ok('há ingressos no mapa de teste, e todos dizem "a partir de"',
   ings.length>0&&ings.every(e=>/a partir de/i.test(pvSimples(e).acontecimento)),
   ings.length+' ingressos');
 /* o que não pode aparecer é uma JANELA de duas datas — "março de 2027
    a julho de 2050" ou "junho–agosto de 2027". O padrão largo que tinha
    escrito aqui apanhava também "Sinal de X, A partir DE maio de 2015",
    e falhava por causa do próprio teste. */
 const MES='(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)';
 const JANELA=new RegExp(MES+'( de \\d{4})?\\s*(a|–|—|-)\\s*'+MES+' de \\d{4}','i');
 ok('nenhum ingresso escreve a janela como duas datas',
   ings.every(e=>!JANELA.test(pvSimples(e).acontecimento)),
   'padrão conferido: "mês [de ano] a mês de ano"');
 /* e o padrão apanha mesmo uma janela de duas datas, quando existe */
 ok('o padrão de janela reconhece uma faixa real',
   JANELA.test('setembro–novembro de 2019')&&JANELA.test('junho de 2027 a julho de 2050'));
 ok('a permanência na casa fica guardada à parte, não na janela',
   ings.filter(e=>e.C.principal.classe==='casa')
     .every(e=>e.permanencia&&e.permanencia.fim>e.dFim),
   ings.filter(e=>e.permanencia).length+' com permanência registada');
 /* a moldura de "tendência de fundo" é para ingressos que são EVENTOS;
    os de nível sinal já saem rotulados como sinal, numa linha só */
 const ingEv=ings.filter(e=>e.tier!=='sinal');
 ok('o ingresso-evento é rotulado como tendência de fundo, não acontecimento',
   ingEv.length>0&&ingEv.every(e=>/mudança de fundo/i.test(pvSimples(e).acontecimento)),
   ingEv.length+' ingressos-evento, '+(ings.length-ingEv.length)+' de nível sinal');

 /* ---------- §4 moldes ---------- */
 const p40=evs.slice(0,40).map(e=>pvSimples(e).porque).filter(Boolean);
 const cont={}; p40.forEach(x=>cont[x]=(cont[x]||0)+1);
 const maxRep=Math.max.apply(null,Object.values(cont));
 ok('nenhuma linha "porque" se repete mais de 3 vezes em 40 eventos',
   maxRep<=3, 'máximo '+maxRep+' repetições · '+Object.keys(cont).length
     +' frases distintas em '+p40.length);
 ok('a frase genérica "ciclos longos" desapareceu',
   p40.every(x=>!/ciclos longos/.test(x)));
 ok('o ciclo confirmador é nomeado quando existe',
   p40.some(x=>/o ano corre |período longo regido |mapa do aniversário/.test(x)));
 /* determinismo: a mesma leitura tem de sair igual ao recalcular */
 PV_EVT_CACHE=null;
 const p40b=pvEventos().slice(0,40).map(e=>pvSimples(e).porque).filter(Boolean);
 ok('os moldes são deterministas — recalcular devolve o mesmo texto',
   p40.join('|')===p40b.join('|'));

 /* ---------- §5 as duas pequenas ---------- */
 const inv=pessoaDaCasa(4);
 ok('a inversão de peso no ranking do pai é declarada, não escondida',
   !!(inv&&inv.inversao&&/pesa mais/.test(inv.inversao.nota)
     &&/pretensão forte/.test(inv.inversao.nota)),
   inv&&inv.inversao?inv.inversao.nota.slice(0,90):'(sem inversão)');
 ok('Saturno continua à frente no ranking do pai, apesar do peso menor',
   inv&&inv.candidatos[0].pl==='saturn',
   inv?inv.candidatos.slice(0,2).map(c=>c.nome+':'+c.peso).join(' '):'—');
 const sinais=evs.filter(e=>e.tier==='sinal');
 ok('os sinais saem em uma linha só, sem quem e sem alternativa',
   sinais.length>0&&sinais.every(e=>{const S=pvSimples(e);
     return S.sinal===true&&!S.porque&&!S.quem&&/^Sinal de /.test(S.acontecimento);}),
   sinais.length?pvSimples(sinais[0]).acontecimento:'(sem sinais)');

 /* ---------- §6.6 o toggle ---------- */
 modoTecnicoDefinir(false);
 ok('o modo técnico nasce desligado e pode ser desligado', modoTecnico()===false);
 irPara('tempo'); renderPreditivas();
 await new Promise(r=>setTimeout(r,400));
 const ids=[...document.querySelectorAll('[data-pvev]')].map(x=>x.dataset.pvev);
 let tudo=(document.getElementById('pv-body')||{}).textContent||'';
 for(const id of ids.slice(0,8)){
   PV_OPEN=id; renderPreditivas();
   await new Promise(r=>setTimeout(r,40));
   tudo+=(document.getElementById('pv-body')||{}).textContent||'';
 }
 const vazou=nivelContemTecnico(tudo);
 ok('modo simples: nenhum evento traz progredid/dirigid/orbe/recepção',
   vazou.length===0, vazou.length?vazou.join(', '):(ids.length+' eventos abertos'));
 /* e o técnico devolve tudo */
 modoTecnicoDefinir(true); PV_OPEN=ids[0]; renderPreditivas();
 await new Promise(r=>setTimeout(r,300));
 const tecTxt=(document.getElementById('pv-body')||{}).textContent||'';
 ok('modo técnico: o vocabulário de ofício volta, e nada foi removido',
   /progredid|dirigid/i.test(tecTxt)&&/votação do campo/i.test(tecTxt));
 ok('modo técnico: a votação mostra as pontuações por casa',
   /\d+ª/.test(tecTxt)&&/limiar/i.test(tecTxt));
 modoTecnicoDefinir(false);
 return T;
});

const pad=s=>s.length>62?s.slice(0,59)+'…':s.padEnd(62);
let f=0;
R.forEach(t=>{if(!t.ok)f++; console.log((t.ok?'  ok  ':'FALHA ')+pad(t.t)+(t.d?('  '+t.d):''));});
console.log('\n### o caso relatado — campo, revolução, pessoas e níveis');
R2.forEach(t=>{if(!t.ok)f++; console.log((t.ok?'  ok  ':'FALHA ')+pad(t.t)+(t.d?('  '+t.d):''));});
console.log('\n'+(R.length+R2.length)+' testes · '+f+' falhas');
console.log('ERRORS:', errs.length?errs.join(' | '):'(none)');
await b.close();
process.exit(f||errs.length?1:0);
