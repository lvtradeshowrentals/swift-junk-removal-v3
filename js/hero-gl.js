/* =========================================================================
   Hero point cloud. One photo of a real job, drawn as ~135k points.
   Junk points are flagged copper, then swept off to the right behind a
   chevron-shaped front; what is left settles into an ordered dot grid.
   All motion is a pure function of (progress, time) so it scrubs both ways.
   ========================================================================= */
(function (W) {
  'use strict';
  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uTex;
uniform vec2 uGrid, uRes, uOff, uSize, uMouse;
uniform float uDpr, uTime, uIntro, uSweep, uOrder, uPulse;
out vec4 vCol; out vec2 vC; out float vStreak;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

void main(){
  int gx = int(uGrid.x);
  int n = gx * int(uGrid.y);
  bool ghost = gl_InstanceID >= n;
  int id = ghost ? gl_InstanceID - n : gl_InstanceID;
  int ix = id % gx, iy = id / gx;
  vec4 t = texelFetch(uTex, ivec2(ix, iy), 0);
  float lum = t.r, junk = smoothstep(.12, .85, t.g), dep = t.b;
  vec2 uv = (vec2(ix, iy) + .5) / uGrid;
  float r1 = hash(vec2(ix, iy)), r2 = hash(vec2(iy, ix) + 7.3);
  float mv = ghost ? 0. : junk;               /* how much this point travels */
  if (ghost) lum = .6 + .14 * r2;            /* the clean concrete that was under it */

  vec2 pos = uOff + uv * uSize;
  pos += uMouse * (dep - .45) * 30. * uDpr;

  /* chaos: junk shivers until it is taken away; everything else is dead still */
  float pre = 1. - smoothstep(0., .25, uSweep);
  pos += mv * pre * 2.4 * uDpr * vec2(sin(uTime * 1.9 + r1 * 6.283), cos(uTime * 1.5 + r2 * 6.283));

  /* the sweep: a chevron front (apex leads) running left to right */
  float front = uSweep * 1.9;
  float d = uv.x * .74 + abs(uv.y - .64) * .46 + r1 * .05;
  float tl = max(front - d, 0.) / .34;
  float vel = 0.;
  if (mv > .02) {
    float k = tl * .22 + pow(tl, 2.) * 1.15;
    pos.x += mv * k * uSize.x * (.75 + r2 * .5);
    pos.y += mv * k * uSize.y * .06 * (r1 - .5);
    vel = mv * clamp(tl * 1.3, 0., 1.2);
  }
  /* light that rides the front across the whole scene */
  float band = exp(-pow((front - d) / .055, 2.)) * smoothstep(0., .08, uSweep) * (1. - smoothstep(.92, 1., uSweep));

  /* intro scan */
  float sf = uIntro * 1.22;
  float seen = smoothstep(0., .035, sf - uv.x);
  float scanEdge = exp(-pow((sf - uv.x) / .012, 2.)) * (1. - smoothstep(.9, 1., uIntro));

  /* order: only every 4th point survives, grows into a clean halftone dot */
  bool keep = (ix % 3 == 0) && (iy % 3 == 0);
  float ordWave = smoothstep(0., 1., uOrder * 1.7 - uv.x * .7);
  float orderAlpha = keep ? 1. : 1. - ordWave;

  float size = (1.4 + 1.9 * pow(lum, 1.3)) * uDpr;
  if (keep) size = mix(size, (1.8 + 7.4 * pow(lum, 1.6)) * uDpr, ordWave);
  size += band * 2.2 * uDpr + scanEdge * 3. * uDpr;
  float len = vel * uSize.x * .11 * (.55 + r2 * .8);
  vStreak = clamp(len / (size * 2.), 0., 1.);

  float a = (.2 + .8 * pow(lum, .95)) * seen * orderAlpha;
  if (keep) a = mix(a, .5 + .5 * lum, ordWave);
  vec3 bone = vec3(.93, .92, .88), cu = vec3(.93, .5, .22), hot = vec3(1., .72, .45);
  float flag = mv * smoothstep(.04, .3, sf - uv.x);
  vec3 col = mix(bone, cu, flag * (1. - ordWave));
  col = mix(col, hot, clamp(band * .8 + scanEdge, 0., 1.));
  col = mix(col, bone * .9, ordWave * (1. - mv));
  a = clamp(a + band * .5 * seen + scanEdge * .8, 0., 1.);
  if (pos.x > uRes.x + 140.) a = 0.;
  if (ghost) a = (junk > .02) ? a * junk * smoothstep(.03, .9, tl) : 0.;
  vCol = vec4(col, a);

  vec2 dir = normalize(vec2(1., (r2 - .5) * .08));
  vec2 prp = vec2(-dir.y, dir.x);
  float t01 = aCorner.x * .5 + .5;
  float half_ = size * .5;
  float xo = mix(-half_ - len, half_, t01);
  vec2 p = pos + dir * xo + prp * aCorner.y * half_;
  vC = vec2(t01 * 2. - 1., aCorner.y);
  vec2 clip = p / uRes * 2. - 1.;
  gl_Position = vec4(clip.x, -clip.y, 0., 1.);
}`;
  const FS = `#version 300 es
precision mediump float;
in vec4 vCol; in vec2 vC; in float vStreak;
out vec4 o;
void main(){
  float r = length(vC);
  float dotA = 1. - smoothstep(.55, 1., r);
  float tail = smoothstep(1., .2, abs(vC.y)) * mix(.12, 1., smoothstep(-1., .9, vC.x));
  float s = mix(dotA, tail, vStreak);
  o = vec4(vCol.rgb, vCol.a * s);
}`;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  function Hero(canvas, data) {
    this.c = canvas; this.data = data; this.p = 0; this.pT = 0; this.mx = 0; this.my = 0; this.mxT = 0; this.myT = 0;
    this.intro = 0; this.introOn = false; this.t0 = performance.now(); this.visible = true; this.raf = 0; this.ok = false;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance', premultipliedAlpha: false });
    if (!gl) return;
    this.gl = gl;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ok = false; this.visible = false; document.documentElement.classList.add('no-gl'); });
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    this.pr = pr; gl.useProgram(pr);
    this.u = {}; ['uTex', 'uGrid', 'uRes', 'uOff', 'uSize', 'uMouse', 'uDpr', 'uTime', 'uIntro', 'uSweep', 'uOrder'].forEach((n) => { this.u[n] = gl.getUniformLocation(pr, n); });
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    this.tex = gl.createTexture();
    this.ready = false;
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.ready = true; this.ok = true; this.resize(); this.draw(); if (this.onReady) this.onReady();
    };
    img.src = data.png;
    this.resize = this.resize.bind(this); this.frame = this.frame.bind(this);
    addEventListener('resize', this.resize);
  }
  Hero.prototype.resize = function () {
    const c = this.c, r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, r.width < 700 ? 2 : 1.75) * (this.q || 1);
    const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.dpr = dpr; this.cw = w; this.ch = h;
    const ar = this.data.aspect, portrait = r.width < 700;
    /* cover fit, with a bias so the junk (lower right) always stays in frame */
    let iw = Math.max(w, h * ar), ih = iw / ar;
    if (!portrait) { const z = 1.04; iw *= z; ih *= z; }
    const fx = portrait ? .78 : .62, fy = portrait ? .5 : .78;
    this.off = [-(iw - w) * fx, -(ih - h) * fy]; this.size = [iw, ih];
    this.map = (u, v) => [(this.off[0] + u * iw) / dpr, (this.off[1] + v * ih) / dpr];
    if (this.onResize) this.onResize();
    if (this.ready) this.draw();
  };
  Hero.prototype.params = function () {
    const p = this.p;
    return { sweep: sm(.06, .56, p), order: sm(.6, .93, p) };
  };
  Hero.prototype.draw = function () {
    const gl = this.gl; if (!gl || !this.ready) return;
    const q = this.params(), u = this.u, t = (performance.now() - this.t0) / 1000;
    gl.viewport(0, 0, this.cw, this.ch);
    gl.clearColor(.0235, .027, .031, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.pr);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uGrid, this.data.w, this.data.h); gl.uniform2f(u.uRes, this.cw, this.ch);
    gl.uniform2f(u.uOff, this.off[0], this.off[1]); gl.uniform2f(u.uSize, this.size[0], this.size[1]);
    gl.uniform2f(u.uMouse, this.mx, this.my);
    gl.uniform1f(u.uDpr, this.dpr); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uIntro, this.intro);
    gl.uniform1f(u.uSweep, q.sweep); gl.uniform1f(u.uOrder, q.order);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.data.w * this.data.h * 2);
  };
  Hero.prototype.frame = function (now) {
    this.raf = 0; if (!this.visible) return;
    /* adaptive quality: if frames are slow for a while, render at lower resolution */
    if (this.lastT) {
      const d = now - this.lastT; this.avg = this.avg ? this.avg * .94 + d * .06 : d; this.n = (this.n || 0) + 1;
      if (this.n > 90 && this.avg > 26 && (this.q || 1) > .6) { this.q = (this.q || 1) * .82; this.n = 0; this.avg = 0; this.resize(); }
    }
    this.lastT = now;
    this.p += (this.pT - this.p) * .12; if (Math.abs(this.pT - this.p) < 1e-4) this.p = this.pT;
    this.mx += (this.mxT - this.mx) * .06; this.my += (this.myT - this.my) * .06;
    if (this.introOn && this.intro < 1) this.intro = Math.min(1, this.intro + 1 / 60 / 2.1);
    this.draw(); this.kick();
  };
  Hero.prototype.kick = function () { if (!this.raf && this.visible) this.raf = requestAnimationFrame(this.frame); };
  Hero.prototype.setProgress = function (p, snap) { this.pT = p; if (snap) this.p = p; this.kick(); };
  Hero.prototype.setMouse = function (x, y) { this.mxT = x; this.myT = y; };
  Hero.prototype.playIntro = function () { this.introOn = true; this.kick(); };
  Hero.prototype.setVisible = function (v) { this.visible = v; this.lastT = 0; if (v) this.kick(); };
  Hero.prototype.setIntro = function (v) { this.intro = v; this.draw(); };

  W.SwiftHero = Hero;
})(window);
