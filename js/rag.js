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
