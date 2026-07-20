/* ============================================================
   PARSE.JS — parser tolerante do formato colado (glifos + inglês)
   Extrai: pontos (lon, casa, ℞), cúspides, aspectos, estrelas.
   ============================================================ */
const GLYPH_PT={'☉':'sun','☼':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars','♃':'jupiter','♄':'saturn','☊':'nn','☋':'sn','⊗':'fort'};
const EN_PT={'sun':'sun','moon':'moon','mercury':'mercury','venus':'venus','mars':'mars','jupiter':'jupiter','saturn':'saturn',
 'north node':'nn','south node':'sn','lot of fortune':'fort','fortune':'fort','asc':'asc','dsc':'dsc','mc':'mc','ic':'ic','part of fortune':'fort'};
const EN_ASPECT={'conjunct':0,'sextile':60,'square':90,'trine':120,'opposite':180,'opposition':180};
const SIGN_GLYPHS='♈♉♊♋♌♍♎♏♐♑♒♓';
function stripVS(s){return s.replace(/[\ufe0e\ufe0f]/g,'');}
function parseDegTok(t){const m=t.match(/^(\d+)°(\d+)?/);return m?(+m[1]+(+(m[2]||0))/60):null;}
function parseChartText(txt){
  txt=stripVS(txt);
  const lines=txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const pts={}, cusps=new Array(12).fill(null), aspects=[], stars=[];
  let i=0;
  const isSign=t=>SIGN_GLYPHS.indexOf(t[0])>=0;
  const signIdx=t=>SIGN_GLYPHS.indexOf(t[0]);
  while(i<lines.length){
    const L=lines[i];
    // ---- estrela: "X Conjunct STAR" (linha em inglês) ----
    let m=L.match(/^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|North Node|South Node|Lot of Fortune|Asc|Dsc|MC|IC)\s+Conjunct\s+(.+)$/i);
    if(m&&!EN_ASPECT[m[2].trim().toLowerCase().split(/\s/)[0]]&&!EN_PT[m[2].trim().toLowerCase()]){
      const who=EN_PT[m[1].toLowerCase()], star=m[2].trim();
      let orb=null; if(i+1<lines.length){const o=parseDegTok(lines[i+1]); if(o!==null){orb=o;i++;}}
      if(i+1<lines.length&&/^[AS]$/.test(lines[i+1]))i++;
      stars.push({who,star,orb}); i++; continue;
    }
    // ---- aspecto: "Moon Square Mars" ----
    m=L.match(/^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn)\s+(Conjunct|Sextile|Square|Trine|Opposite|Opposition)\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn)$/i);
    if(m){
      const a=EN_PT[m[1].toLowerCase()],ang=EN_ASPECT[m[2].toLowerCase()],b=EN_PT[m[3].toLowerCase()];
      let orb=null,app=null;
      if(i+1<lines.length){const o=parseDegTok(lines[i+1]); if(o!==null){orb=o;i++;}}
      if(i+1<lines.length&&/^[AS]$/.test(lines[i+1])){app=lines[i+1]==='A';i++;}
      aspects.push({a,b,ang,orb,app}); i++; continue;
    }
    // ---- cúspide: "H1 - Asc" / "H4 - IC" / "H2" ----
    m=L.match(/^H(\d{1,2})(\s*-\s*(Asc|IC|Dsc|MC))?$/i);
    if(m){
      const h=+m[1];
      // pode vir "H1 - Asc\n♊\n15°50′" ou tudo na mesma linha em variantes
      let sg=null,deg=null,j=i+1;
      while(j<lines.length&&(sg===null||deg===null)){
        const t=lines[j];
        if(sg===null&&isSign(t)){sg=signIdx(t);
          const d=parseDegTok(t.replace(/^./,'').trim()); if(d!==null){deg=d;} j++; continue;}
        const d=parseDegTok(t);
        if(d!==null){deg=d;j++;continue;}
        break;
      }
      if(sg!==null&&deg!==null){cusps[h-1]=sg*30+deg;i=j;continue;}
      i++; continue;
    }
    // ---- ponto: glifo → signo → grau → [℞] → H# ----
    if(GLYPH_PT[L[0]]&&L.length<=3){
      const key=GLYPH_PT[L[0]];
      let sg=null,deg=null,retro=false,house=null,j=i+1;
      while(j<lines.length){
        const t=lines[j];
        if(sg===null&&isSign(t)){sg=signIdx(t);const d=parseDegTok(t.slice(1).trim());if(d!==null)deg=d;j++;continue;}
        if(deg===null){const d=parseDegTok(t);if(d!==null){deg=d;j++;continue;}}
        if(/^℞/.test(t)){retro=true;j++;continue;}
        const hm=t.match(/^H(\d{1,2})/i); if(hm){house=+hm[1];j++;break;}
        break;
      }
      if(sg!==null&&deg!==null){pts[key]={lon:sg*30+deg,h:house,retro};i=j;continue;}
    }
    // ---- ponto inline: "☿ ♌ 28°43′ H1" numa linha só ----
    if(GLYPH_PT[L[0]]){
      const toks=L.split(/\s+/);
      const key=GLYPH_PT[toks[0][0]];
      let sg=null,deg=null,retro=/℞/.test(L),house=null;
      toks.forEach(t=>{
        if(isSign(t)){sg=signIdx(t);const d=parseDegTok(t.slice(1));if(d!==null)deg=d;}
        else{const d=parseDegTok(t);if(d!==null&&deg===null)deg=d;
          const hm=t.match(/^H(\d{1,2})/i);if(hm)house=+hm[1];}
      });
      if(sg!==null&&deg!==null){pts[key]={lon:sg*30+deg,h:house,retro};}
    }
    i++;
  }
  const asc=cusps[0], mc=cusps[9];
  return {pts,cusps,asc,mc,aspects,stars,
    ok: !!(asc!==null && pts.sun && pts.moon),
    problems: [
      asc===null?'Ascendente/cúspide H1 não encontrado':null,
      cusps.filter(c=>c!==null).length<12?('apenas '+cusps.filter(c=>c!==null).length+' de 12 cúspides encontradas'):null,
      !pts.sun?'Sol não encontrado':null,!pts.moon?'Lua não encontrada':null
    ].filter(Boolean)};
}
