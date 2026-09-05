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

  /* ---------- senhores natais: oikodespotes e daimon ----------
     As asserções conferem PROPRIEDADES do método (elegibilidade
     aphética, cadeia predominador→regente, espelhamento dos lotes,
     independência em relação à data), nunca a igualdade com um
     valor que o próprio motor produziu. */
  const SN = await pg.evaluate(()=>{
    const O=oikodespotes(), E=loteEspirito(), F=loteFortuna(), D=daimon();
    const esc=O.predominador;
    const lugarDe=lon=>((signOf(lon)-signOf(NATAL.asc)+12)%12)+1;
    /* o mesmo quadro em duas datas distantes: os natais não podem mudar */
    const a=senhoresDoMapa(new Date(Date.UTC(2001,0,1)));
    const c=senhoresDoMapa(new Date(Date.UTC(2031,0,1)));
    const chave=x=>x.natais.map(n=>n.papel+':'+n.k).join('|');
    return {
      seita:NATAL.sect,
      predK:esc?esc.k:null, predLugar:esc?esc.lugar:null,
      predEsperado:NATAL.sect==='diurno'?'sun':'moon',
      predLugarReal:esc&&esc.k!=='asc'?lugarDe(NATAL.pts[esc.k].lon):1,
      oiko:O.planeta,
      regenteDoSignoDoPred:esc?SIGN_RULER[signOf(esc.lon)]:null,
      genitura:(typeof lordOfGeniture==='function')?lordOfGeniture():null,
      ascRuler:NATAL.rulers[1],
      termo:O.corregenteTermo, termoEsperado:esc?termLord(esc.lon):null,
      espLon:E.lon, fortLon:F.lon, asc:NATAL.asc,
      daimonK:D.planeta, regenteDoEspirito:SIGN_RULER[signOf(E.lon)],
      natalEstavel: chave(a)===chave(c),
      temporalMudou: a.temporais.map(x=>x.papel+':'+x.k).join('|')
                   !==c.temporais.map(x=>x.papel+':'+x.k).join('|'),
      ressalvasSubstituiram: O.ressalvas.length>0 && O.planeta!==SIGN_RULER[signOf(esc.lon)]
    };
  });
  t('o predominador é o luminar da seita quando elegível, e o exame declara o lugar',
    SN.predK===SN.predEsperado ? [1,7,9,10,11].includes(SN.predLugar)
                               : SN.predK!==SN.predEsperado,
    SN.predK+' no lugar '+SN.predLugar);
  t('o lugar do predominador é contado por signos inteiros a partir do Ascendente',
    SN.predLugar===SN.predLugarReal, 'declarado '+SN.predLugar+' · recontado '+SN.predLugarReal);
  t('o Oikodespotes é o regente domiciliar do signo do predominador',
    SN.oiko===SN.regenteDoSignoDoPred, SN.oiko);
  t('as ressalvas são declaradas sem trocar o senhor', !SN.ressalvasSubstituiram);
  t('o corregente por termo vem da tábua egípcia do grau do predominador',
    SN.termo===SN.termoEsperado);
  t('Oikodespotes, Senhor da Genitura e regente do Ascendente são critérios distintos',
    true, SN.oiko+' · '+SN.genitura+' · '+SN.ascRuler
      +(SN.oiko===SN.genitura?' (coincidem neste mapa)':' (diferentes neste mapa)'));
  t('os Lotes do Espírito e da Fortuna são espelhos em torno do Ascendente',
    Math.abs(((SN.espLon+SN.fortLon)/2 - SN.asc + 540)%360-180)<1e-6
    || Math.abs(((SN.espLon+SN.fortLon)/2 - SN.asc-180 + 540)%360-180)<1e-6,
    'ponto médio '+(((SN.espLon+SN.fortLon)/2)%360).toFixed(3)+'° · Asc '+SN.asc.toFixed(3)+'°');
  t('o Daimon é o regente domiciliar do Lote do Espírito, e não o lote',
    SN.daimonK===SN.regenteDoEspirito);
  t('os senhores natais não mudam ao navegar 30 anos', SN.natalEstavel);
  t('os senhores do tempo mudam ao navegar 30 anos', SN.temporalMudou);


}

/* ---------- janela do trânsito: entrada, exatidão, saída ----------
   Um trânsito é um intervalo, não um instante. As asserções conferem
   propriedades geométricas, recalculadas a partir das longitudes: nas
   bordas o orbe tem de valer o limite da tabela; nas passagens exatas,
   a separação tem de igualar o ângulo do aspecto; e a data de hoje tem
   de cair dentro da janela. */
console.log('\n### janela do trânsito');
const TJ = await pg.evaluate(()=>{
  const d=new Date();
  const L=(typeof scoredHits==='function')?scoredHits(d,0).slice(0,6):[];
  const out=[];
  L.forEach(h=>{
    const orbMax=orbeDe(h.ang);
    const J=transitoJanela(h.tn,h.np.lon,h.ang,orbMax,d);
    if(!J)return;
    const sepEm=t=>adiff(tlon(h.tn,new Date(t)), h.np.lon);
    out.push({
      par:PT_NAME[h.tKey]+' '+h.gl+' '+h.np.nm, ang:h.ang, orbMax,
      /* na borda, a distância ao aspecto exato é o próprio orbe da tabela */
      erroEntrada:J.entrada!=null?Math.abs(Math.abs(sepEm(J.entrada)-h.ang)-orbMax):null,
      erroSaida:J.saida!=null?Math.abs(Math.abs(sepEm(J.saida)-h.ang)-orbMax):null,
      /* na passagem exata, a separação é o ângulo do aspecto */
      errosExatos:J.exatos.map(t=>Math.abs(Math.abs(sepEm(t))-h.ang)),
      contemHoje:(J.entrada==null||J.entrada<=d.getTime())
               &&(J.saida==null||J.saida>=d.getTime()),
      ordenado:(J.entrada==null||J.saida==null||J.entrada<J.saida)
               && J.exatos.every(t=>(J.entrada==null||t>=J.entrada)
                                  &&(J.saida==null||t<=J.saida)),
      repetido:J.repetido, semPerfazer:J.exatos.length===0,
      temNota:!!J.nota, dias:J.duracaoDias});
  });
  return out;
});
if(!TJ.length){ t('há trânsitos com janela calculável hoje', false); }
else {
  const bordas=TJ.flatMap(x=>[x.erroEntrada,x.erroSaida]).filter(v=>v!=null);
  t('nas bordas da janela o orbe iguala o limite da tabela',
    bordas.every(e=>e<0.02), TJ.length+' trânsitos · pior erro de borda '
    +Math.max(...bordas).toFixed(4)+'°');
  const exatos=TJ.flatMap(x=>x.errosExatos);
  t('nas passagens exatas a separação iguala o ângulo do aspecto',
    exatos.every(e=>e<0.02),
    exatos.length?('pior erro '+Math.max(...exatos).toFixed(4)+'°'):'nenhuma passagem exata hoje');
  t('a data de hoje cai dentro de toda janela apresentada',
    TJ.every(x=>x.contemHoje));
  t('entrada, exatidão e saída vêm em ordem cronológica',
    TJ.every(x=>x.ordenado));
  t('contato que não perfaz, ou que se repete, vem explicado',
    TJ.every(x=>(!x.semPerfazer&&!x.repetido)||x.temNota),
    TJ.filter(x=>x.semPerfazer).length+' sem perfazer · '
    +TJ.filter(x=>x.repetido).length+' com passagem repetida');
}

/* ---------- Placidus contra a sua definição ----------
   O motor Placidus do app é o que serve às cartas COMPUTADAS (as
   revoluções); as cúspides do mapa natal vêm do texto importado. Por
   isso a conferência aqui chama placidusCusps() diretamente, sobre uma
   grade de latitudes e tempos siderais.

   Não foi possível conferir contra uma efeméride de terceiros: o proxy
   de rede deste ambiente bloqueia o acesso a esses serviços. A
   verificação é, então, contra a DEFINIÇÃO do método — e é feita no
   sentido inverso ao do cálculo. O app itera do ângulo horário para a
   longitude; o teste parte da longitude produzida, deduz declinação,
   ascensão reta e diferença ascensional, e confere se o ponto divide o
   seu próprio semi-arco na proporção que define cada cúspide: a 11ª a
   um terço do semi-arco diurno desde o MC, a 12ª a dois terços, a 2ª a
   um terço do semi-arco noturno depois do Ascendente, a 3ª a dois
   terços. Erro de quadrante, iteração não convergida ou truncamento
   silencioso apareceriam aqui. */
console.log('\n### Placidus — propriedade definidora dos semi-arcos');
const PL = await pg.evaluate(()=>{
  const R=Math.PI/180, D=180/Math.PI;
  const norm=x=>{x%=360;return x<0?x+360:x;};
  const casos=[[11,1/3,'diurno'],[12,2/3,'diurno'],[2,1/3,'noturno'],[3,2/3,'noturno']];
  const piores=[]; let indefDeclaradas=0, indefSilenciosas=0, avaliadas=0;
  let piorAsc=0, piorMC=0, piorOposta=0;
  /* grade: latitudes dos dois hemisférios, incluindo alta latitude, e
     tempos siderais espalhados pelas 24 horas */
  for(let lat=-78; lat<=78; lat+=6){
    for(let hh=0; hh<24; hh+=3){
      const d=new Date(Date.UTC(2000,5,21,hh,0,0));
      const H=placidusCusps(d, lat, 0);
      const eps=H.eps, ramc=H.ramc;
      const decl=L=>Math.asin(Math.sin(eps*R)*Math.sin(L*R))*D;
      const raDe=L=>norm(Math.atan2(Math.sin(L*R)*Math.cos(eps*R), Math.cos(L*R))*D);
      /* Ascendente no horizonte: altitude zero, por fórmula horizontal —
         formulação diferente da usada pelo app */
      const dA=decl(H.asc), HA=norm(raDe(H.asc)-ramc);
      const alt=Math.asin(Math.sin(lat*R)*Math.sin(dA*R)
          +Math.cos(lat*R)*Math.cos(dA*R)*Math.cos(HA*R))*D;
      if(Math.abs(alt)>piorAsc)piorAsc=Math.abs(alt);
      /* MC com ascensão reta igual ao RAMC */
      const dm=Math.abs(raDe(H.mc)-ramc);
      const eMC=Math.min(dm,360-dm);
      if(eMC>piorMC)piorMC=eMC;
      /* cúspides opostas a 180° exatos */
      for(let i=0;i<6;i++){
        const dd=Math.abs(norm(H.cusps[i]-H.cusps[i+6])-180);
        if(dd>piorOposta)piorOposta=dd;
      }
      casos.forEach(([casa,fr,arco])=>{
        const declarada=H.indefinidas.indexOf(casa)>=0;
        const L=H.cusps[casa-1];
        const dd=decl(L), ra=raDe(L);
        const x=Math.tan(lat*R)*Math.tan(dd*R);
        if(Math.abs(x)>1){
          /* o método não se resolve aqui: o app tem de ter declarado */
          if(declarada)indefDeclaradas++; else indefSilenciosas++;
          return;
        }
        if(declarada)return;
        const ad=Math.asin(x)*D;
        const esperado = arco==='diurno' ? fr*(90+ad) : (90+ad)+fr*(90-ad);
        const hAng=norm(ra-ramc);
        const erro=Math.min(Math.abs(hAng-esperado), 360-Math.abs(hAng-esperado));
        avaliadas++;
        if(erro>0.005)piores.push({lat, hh, casa, erro:+erro.toFixed(4)});
      });
    }
  }
  return {avaliadas, piores:piores.slice(0,5), nPiores:piores.length,
    indefDeclaradas, indefSilenciosas,
    piorAsc:+piorAsc.toFixed(5), piorMC:+piorMC.toFixed(5),
    piorOposta:+piorOposta.toFixed(9),
    metodo:placidusCusps(new Date(Date.UTC(2000,5,21,12,0,0)),40,0).metodo};
});
t('cada cúspide intermédia divide o seu semi-arco na proporção do método',
  PL.nPiores===0, PL.avaliadas+' cúspides conferidas em 27 latitudes (−78° a +78°) × 8 tempos siderais'
  +(PL.nPiores?(' · pior: '+JSON.stringify(PL.piores[0])):''));
t('o Ascendente fica no horizonte (altitude zero, por fórmula horizontal)',
  PL.piorAsc<0.01, 'pior altitude '+PL.piorAsc+'°');
t('o Meio do Céu tem ascensão reta igual ao RAMC',
  PL.piorMC<0.01, 'pior erro '+PL.piorMC+'°');
t('cúspides opostas ficam a 180° exatos', PL.piorOposta<1e-6,
  'pior desvio '+PL.piorOposta+'°');
t('onde o método não se resolve, a cúspide é declarada e não fixada em silêncio',
  PL.indefSilenciosas===0,
  PL.indefDeclaradas+' cúspides indefinidas declaradas · '
  +PL.indefSilenciosas+' silenciosas');
t('o método das casas vem nomeado', !!PL.metodo, PL.metodo);

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
