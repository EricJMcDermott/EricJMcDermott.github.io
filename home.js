(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const motionButton = document.querySelector('.motion-toggle');
  const sculpture = document.querySelector('.sculpture');
  const canvas = document.querySelector('#world-sculpture');
  const hero = document.querySelector('.hero');
  const progress = document.querySelector('.reading-progress');
  const themes = [
    { color: [0.78, 1.0, 0.44], hex: '#c8ff70', name: 'Business', href: 'business/', caption: '01 / BUSINESS', description: 'Products, ventures, and ideas put into practice.' },
    { color: [0.54, 0.84, 1.0], hex: '#8ad6ff', name: 'Science', href: 'science/', caption: '02 / SCIENCE', description: 'Neuroscience, XR, and the questions behind the research.' },
    { color: [1.0, 0.68, 0.37], hex: '#ffad5e', name: 'Adventure', href: 'adventure/', caption: '03 / ADVENTURE', description: 'Photography, films, and places along the way.' },
    { color: [0.82, 0.66, 1.0], hex: '#d1a8ff', name: 'Art', href: 'art/', caption: '04 / ART', description: 'Stained glass, wood, words, and things made by hand.' }
  ];
  let paused = reducedMotion.matches;
  try { const saved = sessionStorage.getItem('ejm-motion-paused'); if (saved !== null) paused = saved === 'true'; } catch {}
  let targetWorld = 0;
  let shape = 0;
  let color = [...themes[0].color];
  let visible = true;
  let frame = 0;
  let elapsed = 0;
  let lastTime = 0;
  let pointer = { x: 0, y: 0 };
  let easedPointer = { x: 0, y: 0 };
  let draw = null;

  document.querySelector('#year').textContent = new Date().getFullYear();
  motionButton.hidden = false;
  function syncMotion() {
    try { sessionStorage.setItem('ejm-motion-paused', String(paused)); } catch {}
    root.classList.toggle('is-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
    if (paused) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      renderStill();
    } else start();
  }
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncMotion(); });

  // Content is visible without JavaScript; only opt into reveals once observed.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px 30px 0px' });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
    root.classList.add('motion-ready');
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    }, { rootMargin: '100px' }).observe(hero);
  }

  // Preview is a hover/focus enhancement. Native links always navigate in one click,
  // including touch, keyboard, modified clicks, and browsers without WebGL.
  function previewWorld(link) {
    targetWorld = Number(link.dataset.world);
    const theme = themes[targetWorld];
    root.style.setProperty('--accent', theme.hex);
    document.querySelector('#sculpture-caption').textContent = theme.caption;
    document.querySelector('#portal-title').textContent = `Enter ${theme.name}`;
    document.querySelector('#portal-description').textContent = theme.description;
    sculpture.href = theme.href;
    sculpture.setAttribute('aria-label', `Enter ${theme.name} — ${theme.description}`);
    document.querySelectorAll('.world-select').forEach(item => item.classList.toggle('is-active', item === link));
    if (paused) renderStill();
    else start();
  }
  document.querySelectorAll('.world-select').forEach(link => {
    link.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') previewWorld(link); });
    link.addEventListener('focus', () => previewWorld(link));
  });

  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || paused) return;
    const rect = hero.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 };
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; });

  let scrollQueued = false;
  function updateScroll() {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${scrollable > 0 ? scrollY / scrollable : 0})`;
    scrollQueued = false;
  }
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  // A small, original WebGL sculpture. No framework, runtime download, or 3D asset.
  // The four closed curves share a UV surface so changing worlds morphs smoothly.
  const vertexSource = `
    precision highp float;
    attribute vec2 aUv;
    uniform float uTime;
    uniform float uShape;
    uniform float uAspect;
    uniform vec2 uPointer;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    const float PI = 3.14159265359;
    vec3 curve(float t) {
      float r = 1.0 + .38*cos(3.0*t);
      vec3 knot = vec3(r*cos(2.0*t), r*sin(2.0*t), .55*sin(3.0*t));
      vec3 wave = vec3(1.12*cos(t), 1.12*sin(t), .48*sin(3.0*t));
      vec3 loop = vec3((1.05+.22*cos(3.0*t))*cos(t), (1.05+.22*cos(3.0*t))*sin(t), .38*sin(2.0*t));
      vec3 bloom = vec3((.95+.33*cos(3.0*t))*cos(2.0*t), (.95+.33*cos(3.0*t))*sin(2.0*t), .7*sin(3.0*t));
      if(uShape < 1.0) return mix(knot, wave, uShape);
      if(uShape < 2.0) return mix(wave, loop, uShape-1.0);
      return mix(loop, bloom, uShape-2.0);
    }
    mat3 rotateX(float a) { float s=sin(a),c=cos(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
    mat3 rotateY(float a) { float s=sin(a),c=cos(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
    mat3 rotateZ(float a) { float s=sin(a),c=cos(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.); }
    void main() {
      float u=aUv.x*2.0*PI, v=aUv.y*2.0*PI;
      vec3 center=curve(u);
      vec3 tangent=normalize(curve(u+.001)-curve(u-.001));
      vec3 binormal=normalize(cross(tangent,normalize(center)));
      vec3 normal=normalize(cross(binormal,tangent));
      vec3 outward=cos(v)*normal+sin(v)*binormal;
      float tube=.29+.045*sin(u*3.0+uTime*.3);
      vec3 p=center+outward*tube;
      mat3 rotation=rotateX(.4+uPointer.y*.6)*rotateY(-.35+uTime*.12+uPointer.x*.85)*rotateZ(-.42+uTime*.045);
      p=rotation*p;
      vNormal=rotation*outward;
      vPosition=p;
      vUv=aUv;
      p.z-=5.2;
      gl_Position=vec4(p.x*2.65/uAspect,p.y*2.65,-1.002*p.z-.2002,-p.z);
    }
  `;
  const fragmentSource = `
    precision highp float;
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
      vec3 normal=normalize(vNormal);
      vec3 light=normalize(vec3(-.8,1.1,1.5));
      vec3 view=normalize(vec3(0.,0.,5.2)-vPosition);
      float diffuse=max(dot(normal,light),0.0);
      float rim=pow(1.0-abs(dot(normal,view)),2.6);
      float spec=pow(max(dot(normal,normalize(light+view)),0.0),55.0);
      float stripe=pow(.5+.5*cos(vUv.x*6.2831853*180.0),12.0);
      float crossStripe=pow(.5+.5*cos(vUv.y*6.2831853*32.0),28.0);
      vec3 base=uColor*(.13+diffuse*.78);
      base*=.53+.47*stripe;
      base+=uColor*crossStripe*.07;
      base+=uColor*rim*.4+vec3(1.,1.,.9)*spec*.7;
      gl_FragColor=vec4(base,1.0);
    }
  `;

  function setupSculpture() {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!gl) return;
    function shader(type, source) {
      const item = gl.createShader(type);
      gl.shaderSource(item, source);
      gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(item);
        gl.deleteShader(item);
        throw new Error(message);
      }
      return item;
    }
    const program = gl.createProgram();
    const vertex = shader(gl.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const segments = 240, sides = 48;
    const vertices = [], indices = [];
    for (let u = 0; u <= segments; u++) {
      for (let v = 0; v <= sides; v++) vertices.push(u / segments, v / sides);
    }
    for (let u = 0; u < segments; u++) {
      for (let v = 0; v < sides; v++) {
        const a = u * (sides + 1) + v, b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'aUv');
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    const uniforms = {};
    ['uTime', 'uShape', 'uAspect', 'uPointer', 'uColor'].forEach(key => { uniforms[key] = gl.getUniformLocation(program, key); });
    let width = 1, height = 1;
    draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform1f(uniforms.uShape, shape);
      gl.uniform1f(uniforms.uAspect, width / height);
      gl.uniform2f(uniforms.uPointer, easedPointer.x, easedPointer.y);
      gl.uniform3fv(uniforms.uColor, color);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    };
    function resize() {
      width = Math.max(1, sculpture.clientWidth);
      height = Math.max(1, sculpture.clientHeight);
      const ratio = Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1.5 : 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      if (paused || !visible) renderStill();
    }
    new ResizeObserver(resize).observe(sculpture);
    resize();
    sculpture.classList.add('has-webgl');
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      draw = null;
      sculpture.classList.remove('has-webgl');
    });
    canvas.addEventListener('webglcontextrestored', () => { setupSculpture(); start(); });
  }

  function renderStill() {
    shape = targetWorld;
    color = [...themes[targetWorld].color];
    if (draw) draw();
  }
  function animate(time) {
    frame = 0;
    if (paused || !visible || document.hidden || !draw) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
    lastTime = time;
    elapsed += delta;
    const ease = 1 - Math.exp(-delta * 4);
    shape += (targetWorld - shape) * ease;
    color = color.map((value, i) => value + (themes[targetWorld].color[i] - value) * ease);
    easedPointer.x += (pointer.x - easedPointer.x) * ease;
    easedPointer.y += (pointer.y - easedPointer.y) * ease;
    draw();
    frame = requestAnimationFrame(animate);
  }
  function start() {
    if (!frame && !paused && visible && !document.hidden && draw) frame = requestAnimationFrame(animate);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    else start();
  });
  try { setupSculpture(); } catch (error) {
    // Keep the vector sculpture and all navigation working when WebGL is unavailable.
    sculpture.classList.remove('has-webgl');
    draw = null;
  }
  syncMotion();
})();
