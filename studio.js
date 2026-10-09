import * as THREE from './assets/vendor/three.module.js';

const canvas = document.querySelector('#studio-canvas');
const wrap = document.querySelector('#scene-wrap');
const status = document.querySelector('#room-status');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduce.matches;

const menu = document.querySelector('.studio-menu');
function openIndex(){if(location.hash==='#directory') menu.open=true;}
addEventListener('hashchange',openIndex);openIndex();
const links = [...document.querySelectorAll('[data-object]')];
const destinations = Object.fromEntries(links.map(a => [a.dataset.object, a]));
const notes = {
  business: ['The workbench / Business', 'AI products, ventures, and ideas put to work.'],
  science: ['The instrument / Science', 'Neuroscience, movement, and the questions between.'],
  adventure: ['The window / Adventure', 'Photograph 76. There is always more outside.'],
  art: ['The glass / Art', 'Ducks in Flight. An idea, made by hand.'],
  woodworking: ['The wood / Workshop', 'Grain, geometry, and the pleasure of making.'],
  writings: ['The notebook / Writings', 'Poems, prose, and thoughts along the way.']
};
const caption = document.querySelector('#object-caption');
function describe(key) {
  const [title, text] = notes[key] || ['Six objects. Six ways in.', 'Choose an object. Follow your curiosity.'];
  caption.replaceChildren(document.createTextNode(title), document.createElement('br'));
  const span = document.createElement('span'); span.textContent = text; caption.append(span);
  links.forEach(a => a.classList.toggle('is-active', a.dataset.object === key));
}

try { startStudio(); } catch (error) {
  console.warn('Studio unavailable; collection links remain available.', error);
  document.body.classList.remove('scene-ready');
  status.textContent = 'USE EXPLORE TO OPEN A COLLECTION';
}

function startStudio() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const baseCamera = new THREE.Vector3(13, 11, 16);
  const target = new THREE.Vector3(0, 1.7, 0);
  camera.position.copy(baseCamera); camera.lookAt(target);
  const room = new THREE.Group(); scene.add(room);
  const objects = {}, anchors = {};
  const material = (color, roughness=.7, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const wood = material('#985e35'), paleWood = material('#c29a69'), darkWood = material('#493329');
  const teal = material('#20464c'), wall = material('#213c41'), brass = material('#bda16a',.3,.65);
  const iron = material('#243137',.38,.65), cream = material('#d4ccb1');
  function box(w,h,d,mat,x,y,z,parent=room) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function cylinder(rt,rb,h,mat,x,y,z,parent=room,segments=32) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);
    mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function sphere(r,mat,x,y,z,parent=room) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat); mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function rod(a,b,r,mat,parent=room) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const mesh = cylinder(r,r,delta.length(),mat,0,0,0,parent,12);
    mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
  }
  function register(key,group,anchor) { group.userData.destination=key; objects[key]=group; anchors[key]=new THREE.Vector3(...anchor); }
  function textTexture(width,height,draw) {
    const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return texture;
  }
  const woodTexture=textTexture(512,256,(ctx,w,h)=>{
    ctx.fillStyle='#a87949';ctx.fillRect(0,0,w,h);
    for(let i=0;i<180;i++){const y=i*h/180;ctx.strokeStyle=i%3?'#57392119':'#e6bd8130';ctx.lineWidth=.5+(i%4)*.25;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(140,y+Math.sin(i)*5,300,y+Math.cos(i)*4,w,y);ctx.stroke();}
  });
  const grain=new THREE.MeshStandardMaterial({map:woodTexture,roughness:.75,color:'#d7b281'});
  const loader = new THREE.TextureLoader();
  function photograph(url,w,h,parent,x,y,z,rotation=0,light=1) {
    const tex=loader.load(url);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color().setScalar(light)}));
    mesh.position.set(x,y,z);mesh.rotation.y=rotation;parent.add(mesh);return mesh;
  }
  const hemi=new THREE.HemisphereLight('#b6d7ef','#73502d',2.2);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffe4b2',4.0);sun.position.set(-3,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;scene.add(sun);
  const fill=new THREE.DirectionalLight('#8bcfe7',1.5);fill.position.set(7,5,-2);scene.add(fill);
  const amber=new THREE.PointLight('#ffa753',28,9,2);amber.position.set(-2,3.6,-2);room.add(amber);
  const screenLight=new THREE.PointLight('#79f5cc',9,4,2);screenLight.position.set(1.8,2.2,-1.2);room.add(screenLight);

  // An open architectural model: the front and right walls are removed.
  box(10.3,.35,7.3,darkWood,0,-.12,0);
  for(let i=0;i<18;i++) box(10,.07,.377,grain,0,.09,-3.3+i*.39);
  box(10.2,4.8,.18,wall,0,2.5,-3.6);
  box(.18,4.8,7.2,wall,-5.1,2.5,0);
  box(10.3,.13,.24,brass,0,4.94,-3.6);box(.24,.13,7.3,brass,-5.1,4.94,0);
  box(10,.16,.15,darkWood,0,.25,-3.47);box(.15,.16,7,darkWood,-4.97,.25,0);
  for(let i=0;i<11;i++) box(.022,2.2,.025,material('#517075'),-4.5+i*.88,1.25,-3.49);
  box(10,.045,.08,brass,0,2.4,-3.46);
  // A rug softens the working area; fine stripes echo an instrument scale.
  box(6,.025,2.7,material('#435c59'),.2,.145,1.0);
  for(let i=0;i<25;i++) box(.012,.027,2.65,material(i%2?'#b4a77f':'#6b8580'),-2.68+i*.24,.16,1);
  // Window: Eric's own mountain photograph is the view.
  const windowGroup=new THREE.Group();room.add(windowGroup);
  box(.20,3.03,3.72,darkWood,-4.88,3.01,-.57,windowGroup);
  photograph('assets/home/photograph-76-1200.webp',3.42,2.72,windowGroup,-4.76,3.01,-.57,Math.PI/2,.86);
  box(.18,.10,3.6,brass,-4.7,3.0,-.57,windowGroup);box(.18,2.82,.085,brass,-4.7,3.01,-.57,windowGroup);
  box(.52,.12,3.9,grain,-4.71,1.51,-.57,windowGroup);
  register('adventure',windowGroup,[-4.6,3.5,.5]);
  // The real finished stained-glass piece, mounted above the workbench.
  const glass=new THREE.Group();room.add(glass);
  box(2.88,2.13,.16,brass,-2.1,3.54,-3.37,glass);
  box(2.70,1.95,.18,darkWood,-2.1,3.54,-3.26,glass);
  photograph('assets/home/ducks-in-flight-final-1200.webp',2.56,1.80,glass,-2.1,3.54,-3.15,0,1.12);
  register('art',glass,[-2.1,4.15,-3.1]);
  // Amber, blue, and rose reflections beneath the glass.
  for(let i=0;i<7;i++){
    const mat=new THREE.MeshBasicMaterial({color:['#e6a54b','#cd5d35','#4a9cbb'][i%3],transparent:true,opacity:.11,depthWrite:false});
    const patch=new THREE.Mesh(new THREE.PlaneGeometry(.5,2.8),mat);patch.rotation.x=-Math.PI/2;patch.rotation.z=-.5;patch.position.set(-2.4+i*.42,.181,-.15);room.add(patch);
  }
  // Full-length bench with joinery, drawers, keyboard, and screen.
  box(7.75,.18,1.7,grain,.5,1.48,-2.15);
  for(const x of [-3.05,4.05]){box(.16,1.3,.16,iron,x,.74,-2.77);box(.16,1.3,.16,iron,x,.74,-1.48);box(.16,.1,1.5,iron,x,.35,-2.12);}
  box(1.5,1.1,1.3,wood,3.1,.82,-2.16);
  for(let y=.48;y<1.4;y+=.3){box(1.44,.27,.05,grain,3.1,y,-1.48);box(.32,.045,.06,brass,3.1,y,-1.43);}
  const business=new THREE.Group();room.add(business);
  box(.8,.08,.55,iron,1.18,1.64,-2.15,business);box(.13,.45,.13,iron,1.18,1.87,-2.4,business);
  box(2.18,1.39,.16,iron,1.18,2.54,-2.43,business);
  const screenTex=textTexture(1024,640,(ctx,w,h)=>{
    const background=ctx.createLinearGradient(0,0,w,h);
    background.addColorStop(0,'#07171c');background.addColorStop(1,'#12343a');
    ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#376367';ctx.lineWidth=2;ctx.strokeRect(26,26,w-52,h-52);
    ctx.fillStyle='#80b6ad';ctx.font='22px monospace';ctx.fillText('NOW PLAYING  /  01',58,75);
    ctx.fillStyle='#e9e4d5';ctx.font='bold 90px sans-serif';ctx.fillText('Meuccitech',54,195);
    ctx.fillStyle='#aaccc3';ctx.font='26px monospace';ctx.fillText('AI AUDIOBOOK PRODUCTION',59,249);
    const wave=ctx.createLinearGradient(58,0,970,0);
    wave.addColorStop(0,'#4cbbb4');wave.addColorStop(.5,'#e7c088');wave.addColorStop(1,'#6ed1be');
    ctx.fillStyle=wave;ctx.shadowColor='#9ce9d0';ctx.shadowBlur=22;
    for(let i=0;i<65;i++){
      const x=60+i*14, envelope=.25+.75*Math.pow(Math.sin(Math.PI*i/64),1.3);
      const pulse=Math.abs(Math.sin(i*.72)*Math.cos(i*.19)+.32*Math.sin(i*1.38));
      const bar=20+Math.min(1,pulse)*155*envelope;
      ctx.fillRect(x,378-bar/2,6,bar);
    }
    ctx.shadowBlur=0;ctx.fillStyle='#689c94';ctx.fillRect(59,517,906,3);
    ctx.fillStyle='#e6b87c';ctx.fillRect(59,517,514,3);
    ctx.beginPath();ctx.arc(573,518,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9ab8b1';ctx.font='21px monospace';ctx.fillText('VOICE  ·  HUMAN REVIEW  ·  FINISHED AUDIO',58,585);
  });
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.02,1.24),new THREE.MeshBasicMaterial({map:screenTex}));screen.position.set(1.18,2.54,-2.337);business.add(screen);
  box(1.4,.06,.48,cream,1.18,1.63,-1.64,business);
  for(let r=0;r<4;r++)for(let c=0;c<15;c++)box(.068,.023,.065,iron,.55+c*.089,1.672,-1.80+r*.091,business);
  register('business',business,[1.18,3.12,-2.25]);
  // The lamp has a visible shade, cable, and warm interior.
  const lampShade=new THREE.Mesh(new THREE.ConeGeometry(.6,.5,32,1,true),new THREE.MeshStandardMaterial({color:'#53736a',side:THREE.DoubleSide,metalness:.2,roughness:.5}));lampShade.position.set(3.05,3.99,-1.95);room.add(lampShade);
  cylinder(.045,.045,1.0,iron,3.05,4.72,-1.95);sphere(.13,new THREE.MeshBasicMaterial({color:'#ffe1a0'}),3.05,3.80,-1.95);
  const lampLight=new THREE.PointLight('#ffcd83',15,5,2);lampLight.position.set(3.05,3.70,-1.95);room.add(lampLight);
  // Books and a ceramic mug bring scale to the room.
  const bookMats=['#527a72','#b5844b','#bbb59a','#344b5b'].map(c=>material(c));
  for(let i=0;i<6;i++){const h=.43+(i%3)*.13;const book=box(.13,h,.42,bookMats[i%4],-.85+i*.15,1.6+h/2,-2.8);book.rotation.z=i===0?.12:0;}
  cylinder(.12,.1,.22,cream,-1,1.72,-1.60);const handle=new THREE.Mesh(new THREE.TorusGeometry(.085,.025,8,20),cream);handle.position.set(-.88,1.75,-1.6);room.add(handle);
  // The camera lives on the high shelf, where the brass sphere used to be.
  const photoCamera=new THREE.Group();photoCamera.position.set(3.62,4.16,-3.30);photoCamera.rotation.y=-.18;room.add(photoCamera);
  box(.62,.38,.3,iron,0,0,0,photoCamera);box(.25,.1,.22,iron,0,.22,0,photoCamera);
  const lens=cylinder(.16,.17,.33,iron,0,0,.25,photoCamera);lens.rotation.x=Math.PI/2;
  const lensGlass=cylinder(.125,.125,.014,material('#2b6773',.1,.75),0,0,.42,photoCamera);lensGlass.rotation.x=Math.PI/2;photoCamera.userData.destination='adventure';
  // Scientific armillary: an abstract signal instrument, not a medical device.
  const instrument=new THREE.Group();instrument.position.set(-2.5,0,1.5);room.add(instrument);
  cylinder(.68,.78,.13,darkWood,0,.22,0,instrument);cylinder(.12,.23,1.04,brass,0,.80,0,instrument);cylinder(.46,.55,.13,brass,0,1.35,0,instrument);
  const rings=new THREE.Group();rings.position.y=2.05;instrument.add(rings);
  const blueGlow=new THREE.MeshStandardMaterial({color:'#93d4db',emissive:'#6bbecb',emissiveIntensity:.7,roughness:.3,metalness:.3});
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.72+i*.08,.019,8,80),i===1?blueGlow:brass);ring.rotation.set(i*.85,.4+i*.65,.3);rings.add(ring);}
  sphere(.15,blueGlow,0,0,0,rings);rod([0,1.25,0],[0,2.9,0],.025,brass,instrument);
  register('science',instrument,[-2.5,2.5,1.5]);
  // A sample of Eric's inlay on a small maker's bench.
  const workshop=new THREE.Group();workshop.position.set(1.3,0,1.6);room.add(workshop);
  box(2.2,.17,1.16,grain,0,1.06,0,workshop);for(const x of [-.84,.84])for(const z of [-.36,.36]){const leg=box(.13,.93,.13,darkWood,x,.56,z,workshop);leg.rotation.z=x*.10;}
  const inlay=new THREE.Group();inlay.position.set(-.24,1.3,-.13);inlay.rotation.x=-.65;workshop.add(inlay);
  box(1.30,.74,.07,darkWood,0,0,0,inlay);photograph('assets/home/inlay-detail-600.webp',1.22,.66,inlay,0,0,.045);
  const bowl=cylinder(.28,.15,.2,wood,.72,1.26,.1,workshop);cylinder(.24,.21,.03,darkWood,.72,1.365,.1,workshop);
  register('woodworking',workshop,[1.3,1.48,1.7]);
  // Open notebook with lines and handwritten-looking marks.
  const notebook=new THREE.Group();notebook.position.set(3.25,1.6,-1.85);notebook.rotation.y=-.25;room.add(notebook);
  const pageTexture=textTexture(512,384,(ctx,w,h)=>{ctx.fillStyle='#d9ccb0';ctx.fillRect(0,0,w,h);ctx.fillStyle='#5a655d';ctx.font='italic 36px Georgia';ctx.fillText('A few words...',28,65);ctx.strokeStyle='#70827b55';for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(28,110+i*28);ctx.lineTo(w-35-(i%3)*32,110+i*28);ctx.stroke();}ctx.fillStyle='#836342';ctx.font='italic 24px Georgia';ctx.fillText('keep looking.',28,350);});
  const pageMat=new THREE.MeshStandardMaterial({map:pageTexture,roughness:1});
  box(.95,.04,.7,darkWood,0,0,0,notebook);
  for(const x of [-.225,.225]){const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.44,.65),pageMat);leaf.rotation.x=-Math.PI/2;leaf.position.set(x,.027,0);notebook.add(leaf);}
  rod([.5,.05,-.2],[.5,.05,.30],.016,brass,notebook);
  register('writings',notebook,[3.45,1.9,-1.6]);
  // Plant, stools, shelves, and folded prints complete the lived-in scale.
  cylinder(.38,.27,.55,material('#b87952'),4.13,.4,.62);
  const leafMat=material('#4a7760');
  for(let i=0;i<9;i++){const angle=i*2.4;const y=1.15+(i%3)*.48;rod([4.13,.64,.62],[4.13+Math.cos(angle)*.32,y,.62+Math.sin(angle)*.32],.025,leafMat);const leaf=sphere(.24,leafMat,4.13+Math.cos(angle)*.36,y,.62+Math.sin(angle)*.36);leaf.scale.set(.45,1.5,.8);leaf.rotation.z=Math.cos(angle)*.8;}
  cylinder(.41,.41,.12,grain,.15,.85,-.18);for(let i=0;i<3;i++){const a=i*2.094;rod([.15+Math.cos(a)*.24,.81,-.18+Math.sin(a)*.24],[.15+Math.cos(a)*.39,.17,-.18+Math.sin(a)*.39],.055,iron);}
  box(2.5,.10,.46,grain,2.7,3.84,-3.25);for(let i=0;i<5;i++){box(.22,.43+(i%2)*.13,.3,bookMats[i%4],2.05+i*.23,4.11+(i%2)*.065,-3.25);}
  // Volleyball: six curved faces, each divided into three stitched panels.
  const volleyball=new THREE.Group();volleyball.position.set(-3.45,.67,2.72);volleyball.rotation.set(.3,.4,-.25);room.add(volleyball);
  sphere(.49,material('#b5ac95'),0,0,0,volleyball);
  const panelMats=[material('#ebe3ca'),material('#315a82'),material('#e4b650')];
  const faceAxes=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]];
  faceAxes.forEach(([normal,u,v],face)=>{for(let strip=0;strip<3;strip++){
    const vertices=[],indices=[],steps=10;
    for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++){
      const a=-1+strip*2/3+.014+x/steps*(2/3-.028),b=-.986+y/steps*1.972;
      const point=new THREE.Vector3(...normal).addScaledVector(new THREE.Vector3(...u),a).addScaledVector(new THREE.Vector3(...v),b).normalize().multiplyScalar(.502);
      vertices.push(point.x,point.y,point.z);
    }
    for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){const a=y*(steps+1)+x;indices.push(a,a+1,a+steps+1,a+1,a+steps+2,a+steps+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mat=panelMats[(face+strip)%3].clone();mat.side=THREE.DoubleSide;
    const panel=new THREE.Mesh(geo,mat);panel.castShadow=true;volleyball.add(panel);
  }});
  // A pair of downturned climbing shoes hangs by the heel loops beside the window.
  const shoes=new THREE.Group();shoes.position.set(-4.66,2.45,2.12);room.add(shoes);
  const rubber=material('#242b2b'),shoeUpper=material('#d4a34e'),strap=material('#658780');
  rod([-.30,.72,0],[.03,.72,0],.045,brass,shoes);
  for(const side of [-1,1]){
    rod([.03,.72,0],[.06,.20,side*.26],.012,cream,shoes);
    const shoe=new THREE.Group();shoe.position.set(.08,-.20,side*.26);shoe.rotation.x=side*.10;shoe.rotation.z=.10;shoes.add(shoe);
    const sole=sphere(.3,rubber,.04,-.08,0,shoe);sole.scale.set(.46,1.65,.63);
    const upper=sphere(.27,shoeUpper,.13,-.04,0,shoe);upper.scale.set(.6,1.5,.62);
    const toe=sphere(.19,rubber,.17,-.40,0,shoe);toe.scale.set(.8,.75,.86);
    const opening=sphere(.13,rubber,.20,.24,0,shoe);opening.scale.set(.5,1,.86);
    for(const y of [-.04,.10]){const band=box(.055,.075,.33,strap,.285,y,0,shoe);band.rotation.z=-.2;}
    const loop=new THREE.Mesh(new THREE.TorusGeometry(.065,.018,8,20),strap);loop.position.set(.05,.37,0);loop.rotation.y=Math.PI/2;shoe.add(loop);
  }
  // Walnut turntable, grooved vinyl, center label, and a separate tonearm.
  const turntable=new THREE.Group();turntable.position.set(-2.04,1.70,-2.03);room.add(turntable);
  box(1.65,.19,1.10,darkWood,0,0,0,turntable);box(1.58,.035,1.04,iron,0,.11,0,turntable);
  for(const x of [-.65,.65])for(const z of [-.38,.38])cylinder(.075,.075,.07,rubber,x,-.12,z,turntable);
  cylinder(.48,.48,.065,brass,-.18,.16,0,turntable);
  cylinder(.45,.45,.026,material('#161c20',.32,.3),-.18,.205,0,turntable);
  for(let i=0;i<10;i++){const groove=new THREE.Mesh(new THREE.TorusGeometry(.17+i*.026,.003,4,64),material('#3b4446',.35,.25));groove.rotation.x=Math.PI/2;groove.position.set(-.18,.221,0);turntable.add(groove);}
  cylinder(.13,.13,.029,material('#bc654a'),-.18,.21,0,turntable);cylinder(.018,.018,.06,brass,-.18,.24,0,turntable);
  cylinder(.075,.075,.10,brass,.61,.18,-.34,turntable);
  rod([.61,.24,-.34],[.55,.25,.12],.018,brass,turntable);rod([.55,.25,.12],[.25,.25,.27],.018,brass,turntable);
  box(.14,.045,.065,rubber,.25,.235,.27,turntable);cylinder(.045,.045,.035,brass,.65,.15,.36,turntable);
  // Sparse suspended dust catches the light without obscuring the objects.
  const dustPositions=new Float32Array(80*3);for(let i=0;i<80;i++){dustPositions[i*3]=Math.sin(i*16.1)*4.5;dustPositions[i*3+1]=.6+(i%19)*.22;dustPositions[i*3+2]=Math.cos(i*5.3)*3;}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#d4b786',size:.021,transparent:true,opacity:.45,depthWrite:false}));room.add(dust);

  let width=1,height=1, hover='', pointer=new THREE.Vector2(), easedPointer=new THREE.Vector2(), entering=false;
  let visible=true, frame=0, last=0;
  const raycaster=new THREE.Raycaster();
  const look=new THREE.Vector3();
  const zoomPosition=new THREE.Vector3();
  const zoomTarget=new THREE.Vector3();
  const started=performance.now();
  let transitionStart=0;
  function resize(){width=wrap.clientWidth;height=wrap.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=innerWidth<600?42:34;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(wrap);resize();
  function setHover(key){if(hover===key)return;hover=key;describe(key);canvas.style.cursor=key?'pointer':'default';}
  function hit(event){const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);const hits=raycaster.intersectObjects(room.children,true);for(const hit of hits){let obj=hit.object;while(obj&&obj!==room){if(obj.userData.destination)return obj.userData.destination;obj=obj.parent;}if(hit.object.material?.transparent)continue;return ''; }return '';}
  canvas.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||entering)return;const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width-.5,(event.clientY-rect.top)/rect.height-.5);setHover(hit(event));});
  canvas.addEventListener('pointerleave',()=>{pointer.set(0,0);setHover('');});
  function enter(key,event){if(!destinations[key]||entering)return;if(event&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button>0))return;if(reduce.matches||paused)return;event?.preventDefault();entering=true;document.body.classList.add('scene-entering');zoomTarget.copy(anchors[key]);zoomPosition.copy(camera.position).lerp(zoomTarget,.38);transitionStart=performance.now();setTimeout(()=>location.assign(destinations[key].href),720);}
  canvas.addEventListener('click',event=>{const key=hit(event);if(key){if(reduce.matches||paused)location.assign(destinations[key].href);else enter(key,event);}});
  links.forEach(a=>{a.addEventListener('pointerenter',()=>setHover(a.dataset.object));a.addEventListener('focus',()=>setHover(a.dataset.object));a.addEventListener('pointerleave',()=>{if(document.activeElement!==a)setHover('');});a.addEventListener('blur',()=>setHover(''));a.addEventListener('click',event=>enter(a.dataset.object,event));});
  reduce.addEventListener('change',()=>{paused=reduce.matches;});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);document.body.classList.remove('scene-ready');status.textContent='USE EXPLORE TO OPEN A COLLECTION';});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(wrap);
  document.addEventListener('visibilitychange',()=>{last=0;});
  function animate(now){frame=requestAnimationFrame(animate);if(!visible||document.hidden)return;const dt=Math.min((now-(last||now))/1000,.05);last=now;const t=(now-started)/1000;
    const smoothing=1-Math.exp(-dt*4);easedPointer.lerp(paused||reduce.matches?new THREE.Vector2():pointer,smoothing);
    if(entering){const v=Math.min(1,(now-transitionStart)/700);const ease=v*v*(3-2*v);camera.position.copy(baseCamera).lerp(zoomPosition,ease);look.copy(target).lerp(zoomTarget,ease);camera.lookAt(look);}else{camera.position.set(baseCamera.x+easedPointer.x*1.25,baseCamera.y-easedPointer.y*.65,baseCamera.z-easedPointer.x*.55);camera.lookAt(target);}
    if(!paused&&!reduce.matches&&t<5){rings.rotation.y+=dt*.18;dust.rotation.y=Math.sin(t*.05)*.03;}
    for(const [key,anchor] of Object.entries(anchors)){const p=anchor.clone().project(camera);const a=destinations[key];a.style.left=`${(p.x*.5+.5)*width}px`;a.style.top=`${(-p.y*.5+.5)*height}px`;}
    renderer.render(scene,camera);
  }
  animate(performance.now());document.body.classList.add('scene-ready');
  // A restored back/forward cache must not retain the departure zoom.
  addEventListener('pageshow',()=>{entering=false;document.body.classList.remove('scene-entering');});
}
