/* ============================================================
   RAG.JS — camada adaptadora de fontes (local, sem backend)
   Carrega os corpora .jsonl via fetch quando servidos por HTTP (GitHub Pages, servidor local);
   fallback honesto: cache condensado embutido (OLAVO_PL/OLAVO_CASA),
   claramente rotulado. Nunca simula resultados de busca.
   ============================================================ */
const RAG={
  sources:[
    {file:'rag/planetas_nas_casas_chunks.jsonl',name:'Planetas nas Casas',author:'apostila (corpus do usuário)'},
    {file:'rag/abu_mashar_de_revolutionibus_chunks.jsonl',name:'De Revolutionibus Nativitatum',author:'Abu Mashar'},
    {file:'rag/abu_mashar_great_introduction_chunks.jsonl',name:'Great Introduction',author:'Abu Mashar'},
    {file:'rag/egyptian_astrology_chunks.jsonl',name:'Egyptian Astrology',author:'corpus'}
  ],
  chunks:null, status:'não carregado',
  async load(){
    if(this.chunks) return this.chunks;
    this.chunks=[];
    for(const s of this.sources){
      try{
        const r=await fetch(s.file);
        if(!r.ok) throw 0;
        const txt=await r.text();
        txt.split('\n').filter(Boolean).forEach(l=>{try{const j=JSON.parse(l);j.__src=s;this.chunks.push(j);}catch(e){}});
      }catch(e){ /* fonte indisponível neste ambiente */ }
    }
    this.status=this.chunks.length? (this.chunks.length+' trechos carregados de '+this.sources.length+' fontes')
      : 'corpora indisponíveis neste ambiente (sirva por HTTP — GitHub Pages ou servidor local — para a busca completa)';
    return this.chunks;
  },
  textOf(c){return c.texto||c.text||c.content||'';},
  metaOf(c){return {casa:c.casa||'',planeta:c.planeta||'',secao:c.secao||c.section||'',src:c.__src};},
  /* consulta por unidade técnica: lista de termos ponderados */
  query(units,limit){
    if(!this.chunks||!this.chunks.length) return [];
    const scored=this.chunks.map(c=>{
      const t=(this.textOf(c)+' '+(c.planeta||'')+' '+(c.casa||'')).toLowerCase();
      let s=0,why=[];
      units.forEach(u=>{const [term,w,motivo]=u;
        if(t.includes(term.toLowerCase())){s+=w;why.push(motivo||term);}});
      return {c,s,why};
    }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,limit||4);
    return scored.map(x=>{
      const m=this.metaOf(x.c);
      return {fonte:m.src.name,autor:m.src.author,secao:(m.planeta?m.planeta+' · ':'')+(m.casa||m.secao),
        trecho:this.textOf(x.c).slice(0,420)+(this.textOf(x.c).length>420?'…':''),
        relevancia:x.s, motivo:x.why.join('; ')};
    });
  },
  /* unidades técnicas para um planeta do mapa */
  unitsForPlanet(k){
    const p=NATAL.pts[k], casaRom=['','Casa I','Casa II','Casa III','Casa IV','Casa V','Casa VI','Casa VII','Casa VIII','Casa IX','Casa X','Casa XI','Casa XII'][p.h];
    const u=[[PT_NAME[k],2,'significação do planeta '+PT_NAME[k]],[casaRom,3,'planeta na '+casaRom]];
    ruledHouses(k).forEach(h=>u.push([['','Casa I','Casa II','Casa III','Casa IV','Casa V','Casa VI','Casa VII','Casa VIII','Casa IX','Casa X','Casa XI','Casa XII'][h],1,'regência da casa '+h]));
    if(/recebe|recepção|recebido|recebida/.test(p.dig)) u.push(['recep',1,'recepção']);
    return u;
  },
  fallbackForPlanet(k){
    return [{fonte:'cache condensado local',autor:'condensação do corpus Planetas nas Casas',
      secao:PT_NAME[k]+' na casa '+NATAL.pts[k].h,trecho:OLAVO_PL[k]||'—',
      relevancia:1,motivo:'fallback local: corpora completos não carregados'}];
  }
};

/* ============================================================
   REGRAS — proposições técnicas curtas extraídas dos corpora.
   Servem para CONFIRMAR a regra aplicada pelo cálculo, nunca para
   substituí-lo nem para gerar parágrafos. Cada item traz a fonte real;
   quando nenhuma regra casa, o app usa apenas as regras internas e
   não simula citação.
   ============================================================ */
const DOSER='Döser, "Astrological Prediction" (ed. Dykes)';
const ABUM='Abū Ma\'shar, "On the Revolutions of the Years of Nativities"';
const EGIP='"Astrology of the Ancient Egyptians" (Karma)';
const REGRAS=[
  /* --- princípio mestre --- */
  {id:'framework-001',tags:['promessa','convergencia','sintese'],fonte:DOSER,
   p:'Nada se manifesta que não esteja prometido no mapa natal; as técnicas apenas ativam e cronometram.'},
  {id:'framework-001b',tags:['convergencia','testemunho'],fonte:DOSER,
   p:'Nenhuma técnica isolada basta: a confiabilidade vem da convergência de testemunhos independentes.'},
  {id:'framework-001c',tags:['senhor-do-tempo','firdaria','profeccao'],fonte:DOSER,
   p:'O que um senhor do tempo indica depende da casa que ocupa, das casas que rege, da dignidade e dos aspectos natais.'},
  /* --- firdária --- */
  {id:'firdaria-002',tags:['firdaria','sub'],fonte:DOSER,
   p:'O senhor maior dá o tema de fundo; o sub-senhor dá a coloração e o subtema do trecho.'},
  {id:'firdaria-002b',tags:['firdaria','sub','aspecto'],fonte:DOSER,
   p:'Se os dois senhores têm contato natal, os temas desse contato são enfatizados no subperíodo.'},
  {id:'firdaria-002c',tags:['firdaria','validacao'],fonte:DOSER,
   p:'A firdária sozinha não basta: validar com profecção, revolução e trânsitos.'},
  /* --- profecção --- */
  {id:'profeccao-001',tags:['profeccao','ano'],fonte:DOSER,
   p:'A casa natal alcançada pelo Ascendente profectado dita os temas dominantes do ano.'},
  {id:'profeccao-001b',tags:['profeccao','senhor-do-ano'],fonte:DOSER,
   p:'O Senhor do Ano é o regente do signo profectado; julga-se por natureza, casa, dignidade, aspectos e dispositor.'},
  {id:'profeccao-002',tags:['profeccao','evento'],fonte:DOSER,
   p:'Eventos são mais prováveis quando a profecção chega a signo angular, ao signo do senhor do ano ou à casa do tema investigado.'},
  /* --- revoluções --- */
  {id:'rs-001',tags:['revolucao','ascendente'],fonte:DOSER,
   p:'A casa natal onde cai o Ascendente da revolução define os temas centrais do período.'},
  {id:'rs-001b',tags:['revolucao','regente'],fonte:DOSER,
   p:'O regente do Ascendente da revolução mostra a agenda; a casa que ocupa marca a ênfase do período.'},
  {id:'rs-001c',tags:['revolucao','profeccao'],fonte:DOSER,
   p:'Se o Senhor do Ano também rege o Ascendente da revolução, a manifestação é reforçada.'},
  {id:'rs-002',tags:['revolucao','aspecto','promessa'],fonte:DOSER,
   p:'Aspecto natal repetido na revolução indica que a promessa daquele aspecto se manifesta no período.'},
  {id:'rs-002b',tags:['revolucao','natal','sobreposicao'],fonte:DOSER,
   p:'Cada planeta natal leva suas significações para a casa da revolução onde cai.'},
  {id:'rl-001',tags:['revolucao','lunar','mes'],fonte:DOSER,
   p:'A revolução lunar cronometra, no mês, o que a revolução solar prometeu para o ano.'},
  {id:'pn4-001',tags:['revolucao','senhor-do-ano','dois-tempos'],fonte:ABUM,
   p:'Julgar o planeta nos dois tempos: condição natal (promessa) e condição na revolução (entrega).'},
  /* --- trânsitos --- */
  {id:'transitos-001',tags:['transito','gatilho'],fonte:DOSER,
   p:'Trânsitos são a última camada: gatilhos do que firdária, profecção e revolução já indicaram.'},
  {id:'transitos-001b',tags:['transito','regencia'],fonte:DOSER,
   p:'O planeta em trânsito carrega sua natureza, os temas da sua casa natal e das casas que rege no natal.'},
  {id:'transitos-001c',tags:['transito','ritmo'],fonte:DOSER,
   p:'Planetas lentos dão cenário e processo; rápidos disparam o timing. A segunda passagem é a mais determinante.'},
  {id:'transitos-002',tags:['transito','alvo'],fonte:DOSER,
   p:'Os alvos mais sensíveis são os luminares, o Ascendente, o Meio do Céu e seus regentes.'},
  /* --- qualidade da entrega --- */
  {id:'transitos-002b',tags:['dignidade','qualidade'],fonte:DOSER,
   p:'Planeta bem posto entrega melhores resultados; debilitado, o positivo rende pouco e o negativo fere mais.'},
  {id:'rs-002c',tags:['recepcao','qualidade'],fonte:DOSER,
   p:'Recepção mútua mitiga aspectos difíceis: sucesso com esforço.'},
  /* --- delineação natal (módulo egípcio) --- */
  {id:'eg-lua-venus-001',tags:['lua','venus','quadratura','temperamento'],fonte:EGIP,
   p:'Lua em quadratura ou oposição a Vênus inclina à indolência e à frustração afetiva precoce; é tendência gerenciável, não sentença.'},
  {id:'eg-lua-001',tags:['lua','mercurio','intelecto'],fonte:EGIP,
   p:'Lua em trígono, sextil ou conjunção a Mercúrio é o melhor testemunho de intelecto arguto.'},
  {id:'eg-aspectos-001',tags:['aspecto','orbe'],fonte:EGIP,
   p:'Os aspectos agem entre 5 e 10 graus; quanto mais exato, mais forte.'},
  {id:'eg-aspectos-001b',tags:['aspecto','holismo'],fonte:EGIP,
   p:'Nunca julgar por um único aspecto ou signo: a decisão nasce da mescla do mapa inteiro.'},
  {id:'eg-cruz-001',tags:['saturno','luminar','apoio'],fonte:EGIP,
   p:'Bons aspectos de Saturno aos luminares trazem apoio de pessoas mais velhas e fundação duradoura.'},
  {id:'eg-integracao-001',tags:['firdaria','aspecto','ativacao'],fonte:EGIP,
   p:'Quando os dois membros de um par natal aflito regem o período maior e a fase, o traço desse par tende a se manifestar.'}
];
/* recupera regras por unidades técnicas (tags), sem devolver parágrafos longos */
function regrasPara(tags,limit){
  const want=(tags||[]).map(t=>String(t).toLowerCase());
  if(!want.length)return [];
  return REGRAS.map(r=>({r,n:r.tags.filter(t=>want.includes(t)).length}))
    .filter(x=>x.n>0).sort((a,b)=>b.n-a.n).slice(0,limit||3).map(x=>x.r);
}
/* bloco "Fundamento técnico": regras aplicadas + fonte, sem citação simulada */
function fundamentoHTML(tags,extra){
  const rs=regrasPara(tags,3);
  const linhas=(extra||[]).map(e=>'<li>'+e+'</li>').join('')
    +rs.map(r=>'<li>'+r.p+' <i>— '+r.fonte+'</i></li>').join('');
  if(!linhas)return '';
  return '<details class="fund"><summary>Fundamento técnico</summary><ul class="ilist">'+linhas+'</ul></details>';
}
