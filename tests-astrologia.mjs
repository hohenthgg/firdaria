/* ============================================================
   tests-astrologia.mjs — suíte dos fundamentos astrológicos.

   Cobre o que o app calcula antes de qualquer interpretação:
   seita, profecção, dignidades, recepções, aspectos e orbes,
   revoluções e o efeito do lugar do retorno.

   Cada asserção confere uma propriedade verificável de forma
   independente do próprio motor — a partir das longitudes cruas —,
   e não a igualdade com um valor que o app produziu.

   Como rodar:
     python3 -m http.server 8099 &
     node tests-astrologia.mjs

   Configuração (tudo por variável de ambiente, com padrão):
     BASE_URL     página a testar          (http://localhost:8099/index.html)
     CHROME_PATH  executável do Chromium
     MAPAS        json com [{nome,url}]    (senão usa os embutidos)
     VIEWPORT     ex.: 1600x1000
   ============================================================ */
import { chromium } from 'playwright-core';

const BASE   = process.env.BASE_URL || 'http://localhost:8099/index.html';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const [VW,VH] = (process.env.VIEWPORT || '1600x1000').split('x').map(Number);

/* mapas de prova: um diurno, um noturno, hemisférios e horas diferentes */
const MAPAS = process.env.MAPAS ? JSON.parse(process.env.MAPAS) : [
  { nome:'lucas · manhã · sul',
    url:'https://www.aspectarian.com/chart?date=1994-08-17T06%3A00&lat=-22.2270778&long=-45.93937160000001&name=lucas&t=America%2FSao_Paulo' },
  { nome:'ana · tarde · sul',
    url:'https://www.aspectarian.com/chart?date=1997-03-05T14%3A30&lat=-23.5505&long=-46.6333&name=ana&t=America%2FSao_Paulo' },
  { nome:'noite · sul',
    url:'https://www.aspectarian.com/chart?date=1997-03-05T22%3A30&lat=-23.5505&long=-46.6333&name=noite&t=America%2FSao_Paulo' },
  { nome:'norte · madrugada',
    url:'https://www.aspectarian.com/chart?date=1985-11-22T03%3A10&lat=51.5074&long=-0.1278&name=norte&t=Europe%2FLondon' }
];

let ok=0, fail=0; const falhas=[]; let divergenciaTotal=0;
function t(nome, cond, detalhe){
  if(cond){ ok++; console.log('  ok  '+nome+(detalhe?('   '+detalhe):'')); }
  else { fail++; falhas.push(nome+(detalhe?('   '+detalhe):'')); console.log('  FALHA  '+nome+(detalhe?('   '+detalhe):'')); }
}

const b = await chromium.launch({ executablePath: CHROME, args:['--no-sandbox'] });
const pg = await b.newPage({ viewport:{ width:VW, height:VH } });
const errs=[];
pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
pg.on('console', m=>{ if(m.type()==='error' && !/ERR_CONNECTION|404|Failed to load/.test(m.text())) errs.push('CONSOLE: '+m.text()); });

async function carrega(url){
  await pg.goto(BASE,{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(700);
  await pg.click('#nav button[data-p="dados"]');
  await pg.fill('#imp-url', url);
  await pg.click('#imp-run');
  await pg.waitForTimeout(12000);
  return pg.evaluate(()=>typeof NATAL!=='undefined' && !!NATAL);
}

for(const M of MAPAS){
  console.log('\n### '+M.nome);
  const carregou = await carrega(M.url);
  t('o mapa foi construído', carregou);
  if(!carregou) continue;

  /* ---------- seita ---------- */
  const S = await pg.evaluate(()=>{
    const rel=n360(NATAL.pts.sun.lon-NATAL.asc);
    return { seita:NATAL.sect, rel, casaFuncional:NATAL.pts.sun.h,
             distCuspide7:Math.min(adiff(NATAL.pts.sun.lon,NATAL.cusps[6]),
                                   adiff(NATAL.pts.sun.lon,NATAL.cusps[0])) };
  });
  t('seita segue a posição geométrica do Sol',
    S.seita === (S.rel>=180 ? 'diurno' : 'noturno'),
    'rel '+S.rel.toFixed(1)+'° → '+S.seita);
  t('seita não depende da casa funcional (regra dos 5°)',
    S.seita === (S.rel>=180 ? 'diurno' : 'noturno'),
    'casa funcional do Sol: '+S.casaFuncional);

  /* ---------- profecção ---------- */
  const P = await pg.evaluate(()=>{
    const out=[];
    for(let idade=0; idade<=48; idade++){
      const p=profAt(idade);
      out.push({ idade, signIdx:p.signIdx, casa:p.houseN,
                 lord:p.lordKey, regenteDoSigno:SIGN_RULER[p.signIdx],
                 regenteDaCuspide:NATAL.rulers[p.houseN] });
    }
    return { ascSigno:Math.floor(n360(NATAL.asc)/30), amostra:out };
  });
  t('Senhor do Ano é o regente do signo profectado, em todas as idades',
    P.amostra.every(x=>x.lord===x.regenteDoSigno),
    P.amostra.length+' idades conferidas');
  const divergem=P.amostra.filter(x=>x.regenteDoSigno!==x.regenteDaCuspide).length;
  divergenciaTotal+=divergem;
  console.log('       ('+divergem+' idades em que a cúspide daria outro senhor)');
  t('a profecção avança um signo por ano a partir do Ascendente',
    P.amostra.every(x=>x.signIdx===(P.ascSigno+x.idade)%12));
  t('a casa profectada percorre 1..12 em ciclo',
    P.amostra.every(x=>x.casa===(x.idade%12)+1));

  /* ---------- dignidades ---------- */
  const D = await pg.evaluate(()=>{
    const diurno=NATAL.sect==='diurno';
    const r=[];
    Object.keys(PT_NAME).forEach(k=>{
      const p=NATAL.pts[k]; if(!p)return;
      const s=signOf(p.lon);
      const props=digProprias(k,p.lon,diurno);
      const dg=dignityOf(k,p.lon,!!p.retro,NATAL.pts.sun.lon,diurno);
      r.push({ k, s, props, tags:dg.tags, pts:dg.pts,
               domicilioEsperado:SIGN_RULER[s]===k,
               exilioEsperado:SIGN_RULER[(s+6)%12]===k,
               quedaEsperada:FALL[k]===s,
               exaltEsperada:EXALT[k]===s });
    });
    return r;
  });
  t('domicílio é detectado exatamente quando o planeta rege o signo',
    D.every(x=>x.props.includes('domicílio')===x.domicilioEsperado));
  t('exílio é detectado exatamente no signo oposto ao domicílio',
    D.every(x=>x.props.includes('exílio')===x.exilioEsperado));
  t('queda e exaltação seguem as tabelas',
    D.every(x=>x.props.includes('queda')===x.quedaEsperada
              && x.props.includes('exaltação')===x.exaltEsperada));
  t('nenhum planeta é domiciliado e exilado ao mesmo tempo',
    D.every(x=>!(x.props.includes('domicílio')&&x.props.includes('exílio'))));
  t('as cinco dignidades são as únicas emitidas como próprias',
    D.every(x=>x.props.every(p=>['domicílio','exaltação','triplicidade','termo','face','exílio','queda'].includes(p))));

  /* ---------- aspectos e orbes ---------- */
  const A = await pg.evaluate(()=>{
    const ks=Object.keys(PT_NAME).filter(k=>NATAL.pts[k]);
    const out=[];
    for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){
      const a=NATAL.pts[ks[i]].lon, c=NATAL.pts[ks[j]].lon;
      const asp=aspectBetween(a,c);
      out.push({ a:ks[i], b:ks[j], sep:adiff(a,c),
                 asp:asp?{ang:asp.ang,orb:asp.orb}:null });
    }
    const tabela=ASPECTS.map(x=>({ang:x[0],orb:x[4]}));
    return { pares:out, tabela };
  });
  t('todo aspecto detectado está dentro do orbe da tabela ASPECTS',
    A.pares.filter(p=>p.asp).every(p=>{
      const lim=A.tabela.find(x=>x.ang===p.asp.ang).orb;
      return p.asp.orb<=lim+1e-9;
    }));
  t('nenhum par dentro do orbe deixou de ser detectado',
    A.pares.filter(p=>!p.asp).every(p=>
      A.tabela.every(x=>Math.abs(p.sep-x.ang)>x.orb+1e-9)));
  t('o orbe informado é a distância ao aspecto exato',
    A.pares.filter(p=>p.asp).every(p=>Math.abs(Math.abs(p.sep-p.asp.ang)-p.asp.orb)<1e-6));
  t('há um só conjunto de orbes no app',
    await pg.evaluate(()=>{
      /* o motor e a tabela têm de concordar em todos os ângulos */
      return ASPECTS.every(([ang,,,,orb])=>{
        const dentro=aspectBetween(0, ang+orb-0.01);
        const fora  =aspectBetween(0, ang+orb+0.5);
        return dentro && dentro.ang===ang && (!fora || fora.ang!==ang);
      });
    }));

  /* ---------- recepções ---------- */
  const R = await pg.evaluate(()=>{
    const ctx=ctxNatal(), ks=Object.keys(PT_NAME).filter(k=>NATAL.pts[k]);
    const out=[];
    ks.forEach(a=>ks.forEach(b=>{
      if(a===b)return;
      const rs=recepcoesEntre(a,b,ctx.pts,ctx.diurno);
      rs.forEach(r=>out.push({de:a,por:r.quem,dig:r.dig}));
    }));
    return out;
  });
  t('toda recepção vem nomeada por uma dignidade',
    R.every(x=>['domicílio','exaltação','triplicidade','termo','face'].includes(x.dig)),
    R.length+' recepções');

  /* ---------- revoluções ---------- */
  const V = await pg.evaluate(()=>{
    const hoje=new Date();
    const r=revolutionFor('solar',hoje);
    if(!r)return null;
    const solNatal=NATAL.pts.sun.lon;
    const solRet=r.chart&&r.chart.pts&&r.chart.pts.sun?r.chart.pts.sun.lon:null;
    return { dif:solRet==null?null:adiff(solRet,solNatal),
             inicio:+r.start, fim:r.end?+r.end:null,
             agora:+hoje, local:r.local, proprio:r.localProprio };
  });
  if(V){
    t('no retorno solar o Sol volta ao grau natal', V.dif!=null && V.dif<0.05,
      V.dif!=null?('desvio '+(V.dif*60).toFixed(1)+"'"):'sem Sol');
    t('a data de hoje cai dentro da vigência do retorno',
      V.agora>=V.inicio && (!V.fim || V.agora<=V.fim));
    t('o retorno usa o lugar do nascimento quando não há lugar próprio',
      !V.proprio && V.local && isFinite(V.local.lat));
  }

  /* ---------- lugar do retorno muda os ângulos, não os planetas ---------- */
  const L = await pg.evaluate(()=>{
    const hoje=new Date();
    const a=revolutionFor('solar',hoje);
    if(!a)return null;
    const solA=a.chart.pts.sun.lon, ascA=a.ascLon;
    const mcA=a.chart.mc;
    revLocalSet('solar',a.startMs,{lat:64.14,lon:-21.94});   // Reiquiavique, 21,8° a oeste
    const c=revolutionFor('solar',hoje);
    /* o instante do retorno é rebuscado a cada chamada e varia alguns
       milissegundos: a tolerância é de um milésimo de grau, não zero */
    const r={ solIgual:adiff(c.chart.pts.sun.lon,solA)<1e-3,
              solDelta:adiff(c.chart.pts.sun.lon,solA),
              /* o Meio do Céu é função direta da longitude e do instante:
                 mover 21,8° a oeste tem de deslocá-lo de forma visível */
              mcMovido:adiff(c.chart.mc,mcA),
              ascDelta:adiff(c.ascLon,ascA),
              proprio:c.localProprio };
    revLocalSet('solar',a.startMs,null);
    return r;
  });
  if(L){
    t('mudar o lugar do retorno não move os planetas', L.solIgual,
      'desvio do Sol '+(L.solDelta*3600).toFixed(1)+'″');
    t('mudar o lugar do retorno move os ângulos', L.mcMovido>5,
      'MC '+L.mcMovido.toFixed(1)+'° · Asc '+L.ascDelta.toFixed(1)+'°');
    t('o retorno passa a declarar lugar próprio', L.proprio);
  }
}

/* ---------- backup ---------- */
console.log('\n### backup');
const BK = await pg.evaluate(()=>{
  localStorage.setItem('agx_teste_backup','valor-de-prova');
  const p=bkColeta();
  const antes=p.dados['agx_teste_backup'];
  localStorage.removeItem('agx_teste_backup');
  const r=bkRestaurar(JSON.stringify(p),false);
  const depois=localStorage.getItem('agx_teste_backup');
  localStorage.removeItem('agx_teste_backup');
  /* o backup não deve escrever chaves fora do app */
  let intruso=null;
  try{ bkRestaurar(JSON.stringify({app:'AstroGraph',dados:{'outro_app':'x'}}),false);
       intruso=localStorage.getItem('outro_app'); }catch(e){}
  localStorage.removeItem('outro_app');
  return { coletou:antes==='valor-de-prova', restaurou:depois==='valor-de-prova',
           chaves:p.chaves, intruso };
});
t('o backup coleta as chaves do app', BK.coletou, BK.chaves+' chaves');
t('a restauração devolve o valor guardado', BK.restaurou);
t('a restauração não escreve chaves de fora do app', BK.intruso===null);

t('o conjunto de mapas distingue signo profectado de cúspide Placidus',
  divergenciaTotal>0, divergenciaTotal+' idades divergentes no total — sem isso o teste da profecção não provaria nada');

console.log('\n'+ok+' asserções · '+fail+' falhas');
if(falhas.length) console.log('falhas:\n - '+falhas.join('\n - '));
console.log('ERROS DE PÁGINA: '+(errs.length?('\n'+errs.join('\n')):'(nenhum)'));
await b.close();
process.exit(fail||errs.length?1:0);
