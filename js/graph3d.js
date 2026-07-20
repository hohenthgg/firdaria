/* ============================================================
   GRAPH3D.JS — grafo natal em Three.js (versão fixa 0.128.0)
   Lazy-load: só carrega a biblioteca ao abrir a aba.
   Fallback 2D (SVG) quando WebGL indisponível.
   ============================================================ */
const G3D={inited:false,paused:false,three:null,scene:null,camera:null,renderer:null,
  nodes:[],edges:[],raycaster:null,mouse:null,rot:{x:-0.35,y:0.6},dist:34,auto:true,
  reduced:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches};

const EDGE_STYLES={
  ocupa:{color:0x66707c,label:'ocupa casa',dash:false,w:1},
  rege:{color:0xc9a86a,label:'rege casa',dash:false,w:2},
  aspecto_h:{color:0x5f9e7f,label:'aspecto harmônico',dash:false,w:2},
  aspecto_t:{color:0xb0564a,label:'aspecto tenso',dash:true,w:2},
  disp:{color:0x6b93b8,label:'disposição',dash:false,w:1},
  recep:{color:0xe8e4d8,label:'recepção',dash:false,w:2},
  termo:{color:0x8878a8,label:'termo',dash:true,w:1},
  estrela:{color:0x6b93b8,label:'estrela fixa',dash:true,w:1},
  ativa:{color:0xf2c15f,label:'ativação temporal',dash:false,w:3}
};
const MODE_FILTERS={
  estrutura:['ocupa','rege','disp','recep'],
  regencias:['ocupa','rege'],
  aspectos:['aspecto_h','aspecto_t'],
  recepcoes:['recep','disp'],
  carreira:['rege','ocupa','aspecto_h','aspecto_t','estrela'],
  relacionamentos:['rege','ocupa','aspecto_h','aspecto_t','recep'],
  dinheiro:['rege','ocupa','aspecto_h','aspecto_t'],
  temperamento:['ocupa','disp'],
  ativacao:['ativa','rege','ocupa']
};
const MODE_FOCUS={carreira:[10,1,2],relacionamentos:[7,5],dinheiro:[2,8],temperamento:[1]};

function g3dModel(){
  // nós
  const N=[];
  const add=(id,label,type,extra)=>{N.push(Object.assign({id,label,type},extra||{}));return N.length-1;};
  const IDX={};
  // planetas + pontos
  Object.entries(NATAL.pts).forEach(([k,p])=>{IDX[k]=add(k,p.g+' '+p.nm,'planeta',{lon:p.lon,h:p.h});});
  IDX['asc']=add('asc','Asc','angulo',{lon:NATAL.asc,h:1});
  IDX['mc']=add('mc','MC','angulo',{lon:NATAL.mc,h:10});
  for(let hh=1;hh<=12;hh++) IDX['casa'+hh]=add('casa'+hh,'Casa '+hh,'casa',{h:hh,lon:NATAL.cusps[hh-1]});
  for(let ss=0;ss<12;ss++) IDX['sg'+ss]=add('sg'+ss,SG[ss],'signo',{lon:ss*30+15});
  // estrelas principais
  const STARS=[['Dubhe','asc'],['Algol','mc'],['Porrima','venus'],['Menkalinan','mars'],['Khambalia','jupiter'],['Al Jabhah','mercury'],['Zuben Eschamali','nn']];
  STARS.forEach(([nm,att])=>{IDX['st_'+nm]=add('st_'+nm,'★ '+nm,'estrela',{att});});
  // arestas
  const E=[];
  const link=(a,b,t,info)=>E.push({a:IDX[a],b:IDX[b],t,info});
  Object.entries(NATAL.pts).forEach(([k,p])=>{if(k==='spirit'||k==='fort')link(k,'casa'+p.h,'ocupa',PT_NAME[k]||p.nm);else link(k,'casa'+p.h,'ocupa','');});
  Object.entries(NATAL.rulers).forEach(([hh,k])=>link(k,'casa'+hh,'rege','regência natal'));
  // aspectos natais principais
  const ASP=[['mercury','mars','h','⚹ 1°39′'],['jupiter','saturn','h','△ 2°22′'],['moon','jupiter','h','⚹ 2°44′'],['sun','mercury','h','☌ 4°29′'],
             ['moon','mars','t','☍ 4°39′'],['moon','venus','t','□ 5°02′'],['moon','saturn','h','⚹ 5°06′'],['mars','jupiter','h','△ 7°24′']];
  ASP.forEach(([a,b,ht,o])=>link(a,b,ht==='h'?'aspecto_h':'aspecto_t',o));
  // disposição (regente do signo do planeta)
  const dispOf={sun:'sun',moon:'saturn',mercury:'sun',venus:'venus',mars:'moon',jupiter:'mars',saturn:'jupiter'};
  Object.entries(dispOf).forEach(([k,d])=>{if(k!==d)link(k,d,'disp','dispositor');});
  // recepções
  link('saturn','jupiter','recep','♃ recebe ♄ (signo+termo, △)');
  link('moon','saturn','recep','♄ recebe ☾ (⚹)');
  link('mars','jupiter','recep','recepção mútua mista (△)');
  link('jupiter','mars','recep','recepção mútua mista (△)');
  // termos (senhor do termo de cada ponto)
  const termOf={sun:'jupiter',moon:'venus',mercury:'mars',venus:'venus',mars:'mars',jupiter:'jupiter',saturn:'jupiter'};
  Object.entries(termOf).forEach(([k,t])=>{if(k!==t)link(k,t,'termo','termo');});
  // estrelas
  STARS.forEach(([nm,att])=>link('st_'+nm,att,'estrela',''));
  return {N,E,IDX};
}
function g3dLayout(N){
  // camadas: signos (r=16), casas (r=11), planetas (r=7 por longitude), ângulos (r=7), estrelas (junto ao alvo, r=8.5)
  N.forEach(n=>{
    let r=7,y=0;
    if(n.type==='signo'){r=16;y=0;}
    if(n.type==='casa'){r=11;y=-1.5;}
    if(n.type==='planeta'){r=7;y=1.2;}
    if(n.type==='angulo'){r=7;y=2.6;}
    const lon=n.lon!==undefined?n.lon:0;
    const a=(lon-NATAL.asc+180)*Math.PI/180;
    n.pos=[r*Math.cos(a), y+(n.type==='planeta'?Math.sin(lon):0)*0.6, r*Math.sin(a)];
  });
  // estrelas: perto do alvo
  N.forEach(n=>{
    if(n.type==='estrela'){
      const t=N.find(x=>x.id===n.att)||N[0];
      n.pos=[t.pos[0]*1.28,t.pos[1]+1.6,t.pos[2]*1.28];
    }
  });
}
function g3dInit(){
  if(G3D.inited||!NATAL)return;
  const canvas=document.getElementById('g3d');
  const boot=()=>{
    try{
      const THREE=window.THREE; G3D.three=THREE;
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
      renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
      renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(48,canvas.clientWidth/canvas.clientHeight,0.1,300);
      scene.add(new THREE.AmbientLight(0xffffff,0.85));
      const dl=new THREE.DirectionalLight(0xffffff,0.5);dl.position.set(10,20,10);scene.add(dl);
      const model=g3dModel(); g3dLayout(model.N);
      G3D.model=model;
      const COLORS={planeta:0xc9a86a,angulo:0xe8e4d8,casa:0x33415a,signo:0x232e3f,estrela:0x6b93b8};
      const SIZES={planeta:0.62,angulo:0.55,casa:0.42,signo:0.3,estrela:0.3};
      const group=new THREE.Group();
      model.N.forEach((n,i)=>{
        const geo=new THREE.SphereGeometry(SIZES[n.type],18,14);
        const mat=new THREE.MeshLambertMaterial({color:COLORS[n.type]});
        const m=new THREE.Mesh(geo,mat);
        m.position.set(...n.pos); m.userData={i};
        group.add(m); n.mesh=m;
        const spr=makeLabel(THREE,n.label,n.type);
        spr.position.set(n.pos[0],n.pos[1]+(SIZES[n.type]+0.55),n.pos[2]);
        group.add(spr); n.sprite=spr;
      });
      model.E.forEach(e=>{
        const st=EDGE_STYLES[e.t];
        const a=model.N[e.a].pos,b=model.N[e.b].pos;
        const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);
        const mat=st.dash?new THREE.LineDashedMaterial({color:st.color,dashSize:0.5,gapSize:0.35,transparent:true,opacity:0.75})
                         :new THREE.LineBasicMaterial({color:st.color,transparent:true,opacity:0.8});
        const line=new THREE.Line(g,mat);
        if(st.dash)line.computeLineDistances();
        group.add(line); e.line=line;
      });
      scene.add(group); G3D.group=group;
      G3D.scene=scene;G3D.camera=camera;G3D.renderer=renderer;
      G3D.raycaster=new THREE.Raycaster();G3D.mouse=new THREE.Vector2();
      bindG3D(canvas);
      applyG3DMode();
      legend();
      if(G3D.reduced)G3D.auto=false;
      animateG3D();
      G3D.inited=true;
    }catch(err){ g3dFallback('WebGL indisponível ('+err.message+').'); }
  };
  if(window.THREE) boot();
  else{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/0.128.0/three.min.js'; // versão fixa
    s.onload=boot;
    s.onerror=()=>g3dFallback('Biblioteca 3D não carregou (sem rede?).');
    document.head.appendChild(s);
  }
}
function makeLabel(THREE,text,type){
  const c=document.createElement('canvas');c.width=256;c.height=64;
  const x=c.getContext('2d');
  x.font=(type==='planeta'||type==='angulo'?'600 30px Inter':'24px Inter');
  x.fillStyle=type==='planeta'?'#e8e4d8':type==='angulo'?'#c9a86a':type==='estrela'?'#6b93b8':'#9aa3ad';
  x.textAlign='center';x.fillText(text,128,40);
  const t=new THREE.CanvasTexture(c);
  const m=new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false});
  const sp=new THREE.Sprite(m);sp.scale.set(4.6,1.15,1);
  return sp;
}
function bindG3D(canvas){
  let drag=false,px=0,py=0;
  canvas.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;});
  window.addEventListener('pointermove',e=>{if(!drag)return;G3D.rot.y+=(e.clientX-px)*0.006;G3D.rot.x+=(e.clientY-py)*0.006;G3D.rot.x=Math.max(-1.3,Math.min(1.3,G3D.rot.x));px=e.clientX;py=e.clientY;G3D.auto=false;});
  window.addEventListener('pointerup',()=>drag=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();G3D.dist=Math.max(14,Math.min(70,G3D.dist+e.deltaY*0.03));},{passive:false});
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect();
    G3D.mouse.x=((e.clientX-r.left)/r.width)*2-1;
    G3D.mouse.y=-((e.clientY-r.top)/r.height)*2+1;
    G3D.raycaster.setFromCamera(G3D.mouse,G3D.camera);
    const hits=G3D.raycaster.intersectObjects(G3D.group.children.filter(o=>o.userData&&o.userData.i!==undefined));
    if(hits.length) g3dSelect(hits[0].object.userData.i);
  });
  document.getElementById('g3d-reset').onclick=()=>{G3D.rot={x:-0.35,y:0.6};G3D.dist=34;G3D.auto=!G3D.reduced;};
  document.getElementById('g3d-pause').onclick=function(){G3D.paused=!G3D.paused;this.textContent=G3D.paused?'retomar':'pausar';};
  document.getElementById('g3d-mode').onchange=applyG3DMode;
  document.getElementById('g3d-search').oninput=function(){
    const q=this.value.toLowerCase().trim();
    G3D.model.N.forEach(n=>{
      const hit=q&&(n.label.toLowerCase().includes(q)||n.id.includes(q));
      if(n.mesh)n.mesh.scale.setScalar(hit?1.9:1);
    });
  };
  document.addEventListener('visibilitychange',()=>{G3D.paused=document.hidden?true:G3D.paused;});
}
function applyG3DMode(){
  const mode=document.getElementById('g3d-mode').value;
  const allow=MODE_FILTERS[mode]||Object.keys(EDGE_STYLES);
  const focus=MODE_FOCUS[mode];
  // ativação atual: injetar arestas temporais
  if(mode==='ativacao'&&!G3D.actLinked){
    const THREE=G3D.three;
    scoredHits(new Date(),3).slice(0,6).forEach(h=>{
      const a=G3D.model.N.find(n=>n.id===h.tKey), b=G3D.model.N.find(n=>n.id===h.nk);
      if(!a||!b)return;
      const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a.pos),new THREE.Vector3(...b.pos)]);
      const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:EDGE_STYLES.ativa.color,transparent:true,opacity:0.95}));
      G3D.group.add(line);
      G3D.model.E.push({a:G3D.model.N.indexOf(a),b:G3D.model.N.indexOf(b),t:'ativa',line,info:'trânsito hoje: '+h.gl+' orbe '+h.orb.toFixed(1)+'°'});
    });
    G3D.actLinked=true;
  }
  G3D.model.E.forEach(e=>{
    let vis=allow.includes(e.t);
    if(vis&&focus){
      const na=G3D.model.N[e.a],nb=G3D.model.N[e.b];
      const touch=n=>n.type==='casa'?focus.includes(n.h):(n.h!==undefined&&focus.includes(n.h))||(n.type==='planeta'&&ruledHouses(n.id).some(x=>focus.includes(x)));
      vis=touch(na)||touch(nb);
    }
    if(e.line)e.line.visible=vis;
  });
  // nível de detalhe: esconder signos fora dos modos estruturais
  const showSigns=['estrutura','regencias'].includes(mode);
  G3D.model.N.forEach(n=>{
    if(n.type==='signo'){if(n.mesh)n.mesh.visible=showSigns;if(n.sprite)n.sprite.visible=showSigns;}
  });
}
function legend(){
  document.getElementById('g3d-legend').innerHTML=Object.values(EDGE_STYLES).map(s=>'<div><i style="background:#'+s.color.toString(16).padStart(6,'0')+'"></i>'+s.label+'</div>').join('');
}
async function g3dSelect(i){
  const n=G3D.model.N[i]; const panel=document.getElementById('g3d-panel');
  panel.classList.add('on');
  if(n.type==='planeta'&&NATAL.pts[n.id]){
    const k=n.id,p=NATAL.pts[k];
    const edges=G3D.model.E.filter(e=>e.a===i||e.b===i);
    let html='<div class="kicker">'+p.g+' '+p.nm+'</div>'
      +'<p class="mono">'+zfmt(p.lon)+' · casa '+p.h+' ('+HOUSE_SIG[p.h].q+') · seita: '+(k==='sun'||k==='jupiter'||k==='saturn'?'diurno':'noturno')+' em mapa noturno</p>'
      +'<p><b>Dignidades:</b> '+p.dig+'</p>'
      +'<p><b>Casas regidas:</b> '+ (listRuled(k)||'—')+'</p>'
      +'<p><b>Aspectos:</b> '+(NATAL_ASP[k]||[]).join(' · ')+'</p>'
      +(p.star&&p.star!=='—'?('<p><b>Estrela:</b> '+p.star+'</p>'):'')
      +'<p><b>Cadeia dispositora:</b> '+dispChain(k)+'</p>'
      +'<p><b>Interpretação literal:</b> '+(OLAVO_PL[k]||'')+'</p>'
      +'<p><b>Manifestações possíveis:</b> '+manifestFor(k)+'</p>'
      +'<div id="g3d-src" class="mono">buscando fontes…</div>'
      +'<button class="btn" onclick="document.getElementById(\'g3d-panel\').classList.remove(\'on\')">fechar</button>';
    panel.innerHTML=html;
    await RAG.load();
    const src=RAG.query(RAG.unitsForPlanet(k),3);
    document.getElementById('g3d-src').innerHTML=renderSources(src.length?src:RAG.fallbackForPlanet(k));
  }else{
    panel.innerHTML='<div class="kicker">'+n.label+'</div>'
      +(n.type==='casa'?('<p>'+HOUSE_SIG[n.h].q+': <b>'+HOUSE_SIG[n.h].s+'</b></p><p>'+OLAVO_CASA[n.h]+'</p><p><b>Regente natal:</b> '+PT_NAME[NATAL.rulers[n.h]]+'</p>'):'')
      +(n.type==='estrela'?('<p>Conjunção natal registrada no ponto '+n.att+'.</p>'):'')
      +(n.type==='signo'?('<p>Signo no anel externo do modelo.</p>'):'')
      +'<button class="btn" onclick="document.getElementById(\'g3d-panel\').classList.remove(\'on\')">fechar</button>';
  }
}
function dispChain(k){
  const dispOf={sun:'sun',moon:'saturn',mercury:'sun',venus:'venus',mars:'moon',jupiter:'mars',saturn:'jupiter'};
  let chain=[k],cur=k;
  for(let i=0;i<6;i++){const d=dispOf[cur];if(!d||chain.includes(d))
    {if(d&&chain.includes(d)&&d!==cur)chain.push(d+' (anel)');break;}chain.push(d);cur=d;}
  return chain.map(x=>PT_NAME[x]||x).join(' → ');
}
function animateG3D(){
  if(!G3D.renderer)return;
  requestAnimationFrame(animateG3D);
  if(G3D.paused)return;
  if(G3D.auto)G3D.rot.y+=0.0016;
  const c=G3D.camera;
  c.position.set(G3D.dist*Math.cos(G3D.rot.x)*Math.sin(G3D.rot.y),G3D.dist*Math.sin(G3D.rot.x)+4,G3D.dist*Math.cos(G3D.rot.x)*Math.cos(G3D.rot.y));
  c.lookAt(0,0,0);
  G3D.renderer.render(G3D.scene,G3D.camera);
}
/* fallback 2D */
function g3dFallback(msg){
  document.getElementById('g3d-wrap').style.display='none';
  const model=g3dModel(); g3dLayout(model.N);
  const W=760,H=520;
  const P=n=>[W/2+n.pos[0]*20, H/2+n.pos[2]*14 - n.pos[1]*8];
  let s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;border:1px solid var(--line);border-radius:6px;background:var(--bg2)">';
  model.E.forEach(e=>{const st=EDGE_STYLES[e.t];const [x1,y1]=P(model.N[e.a]),[x2,y2]=P(model.N[e.b]);
    s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#'+st.color.toString(16).padStart(6,'0')+'" stroke-width="'+(st.w*0.7)+'" '+(st.dash?'stroke-dasharray="4 3"':'')+' opacity=".65"/>';});
  model.N.forEach(n=>{const [x,y]=P(n);
    s+='<circle cx="'+x+'" cy="'+y+'" r="'+(n.type==='planeta'?7:n.type==='casa'?5:3.5)+'" fill="'+(n.type==='planeta'?'#c9a86a':n.type==='angulo'?'#e8e4d8':n.type==='estrela'?'#6b93b8':'#33415a')+'"/>'
     +'<text x="'+x+'" y="'+(y-9)+'" text-anchor="middle" font-size="10" fill="#9aa3ad">'+n.label+'</text>';});
  s+='</svg>';
  document.getElementById('g3d-fallback').innerHTML='<div class="card"><div class="kicker">fallback 2D · '+esc(msg)+'</div>'+s+'</div>';
}
