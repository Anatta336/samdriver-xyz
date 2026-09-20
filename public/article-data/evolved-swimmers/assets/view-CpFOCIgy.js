var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=t({B:()=>i,BS:()=>l,DEATH_ENERGY:()=>3,DEATH_NAN:()=>1,DEATH_SPEED:()=>2,DEFAULT_SIM:()=>f,E:()=>s,I:()=>c,J:()=>a,M:()=>d,MAX_TARGETS:()=>16,N:()=>o,S:()=>r,U:()=>p,brainStateWords:()=>u,wgslLayoutPreamble:()=>h}),r={WORDS:12,BODY_COUNT:0,JOINT_COUNT:1,BODY_OFF:2,JOINT_OFF:3,NEURON_COUNT:4,NEURON_OFF:5,EDGE_OFF:6,SENSOR_COUNT:7,PARAM_COUNT:8,TOTAL_MASS:9},i={WORDS:20,HALF:0,MASS:3,INV_INERTIA:4,SENSOR_BASE:7,POS:8,MIRRORED:11,ROT:12,INV_MASS:16},a={WORDS:24,PARENT:0,CHILD:1,TYPE:2,DOF:3,ANCHOR_P:4,MAX_TORQUE:7,ANCHOR_C:8,SENSOR_BASE:11,REST_ROT:12,LIMITS:16,MIRRORED:19,EFFECTOR:20},o={WORDS:4,KIND_ACT:0,PARAM_BASE:1,EDGE_START:2,EDGE_COUNT:3},s={WORDS:2,SRC:0,PARAM:1},c={WORDS:80,STRUCT:0,PARAM_OFF:1,BODY_STATE_OFF:2,BRAIN_OFF:3,START_POS:4,SETTLE_STEPS:7,START_ROT:8,TARGET_COUNT:12,REACH:13,TARGETS:16},l={WORDS:32,X:0,Q:4,V:8,W:12,XP:16,QP:20,F:24,T:28},u=(e,t)=>e+3*t,d={WORDS:24,STEP:0,ALIVE:1,TOWARD:2,TIME:3,WORK:4,SPEED:5,DIST:6,KE:7,COM0:8,GOALS:11,COM:12,VCOM:16,DEATH:19,DIST0:20,MIN_DIST:21,JOINT_SPEED:22},f={dt:1/30,substeps:6,brainTicks:2,dragLinear:.2,dragQuad:1.5,dragEvery:2,addedMass:.15,servoKp:4,maxJointSpeed:10,jointDamping:2,angularClamp:25,maxSpeed:30,maxAngSpeed:80,energyFactor:4,energySlack:.05},p={WORDS:16,DT:0,SUBSTEPS:1,BRAIN_TICKS:2,DRAG_LIN:3,DRAG_QUAD:4,KP:5,MAX_JOINT_SPEED:6,JOINT_DAMP:7,MAX_SPEED:8,MAX_ANG_SPEED:9,ENERGY_SLACK:10,INSTANCE_COUNT:11,STEPS:12,ENERGY_FACTOR:13,ANG_CLAMP:14,DRAG_EVERY:15},m=(e,t)=>Object.entries(t).map(([t,n])=>`const ${e}_${t}: u32 = ${n}u;`).join(`
`);function h(){return[m(`S`,r),m(`B`,i),m(`J`,a),m(`N`,o),m(`E`,s),m(`I`,c),m(`BS`,l),m(`M`,d),m(`U`,p),`const MAX_TARGETS: u32 = 16u;`,`const DEATH_NAN: f32 = 1.0;`,`const DEATH_SPEED: f32 = 2.0;`,`const DEATH_ENERGY: f32 = 3.0;`].join(`
`)}var g=`
struct Frame {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  camPos: vec4f,    // xyz, time
  lightDir: vec4f,  // xyz (towards the light), fog density
  goal: vec4f,      // target xyz, visible (0/1)
  viewport: vec4f,  // width, height, body-state offset (vec4 units), body count
  focus: vec4f,     // xyz, trail count
  misc: vec4f,      // highlight, _, _, _
};

@group(0) @binding(0) var<uniform> frame: Frame;

const DEEP = vec3f(0.012, 0.07, 0.13);
const SHALLOW = vec3f(0.12, 0.46, 0.58);

/** Colour of the water looking along direction d from depth y. */
fn waterColor(d: vec3f, y: f32) -> vec3f {
  let up = smoothstep(-0.7, 0.9, d.y);
  var c = mix(DEEP, SHALLOW, up * up);
  let sun = max(dot(d, normalize(frame.lightDir.xyz)), 0.0);
  c += vec3f(0.35, 0.55, 0.55) * pow(sun, 24.0) * 0.6 + vec3f(0.1, 0.2, 0.2) * pow(sun, 4.0) * 0.25;
  let depthDim = exp(clamp(y, -60.0, 10.0) * 0.015);
  return c * depthDim;
}

/** Blend a lit surface colour into the water by distance. */
fn applyFog(color: vec3f, world: vec3f) -> vec3f {
  let toP = world - frame.camPos.xyz;
  let dist = length(toP);
  let f = 1.0 - exp(-dist * frame.lightDir.w);
  return mix(color, waterColor(toP / max(dist, 1e-4), world.y), clamp(f, 0.0, 1.0));
}

/** Animated caustic light pattern projected from above. */
fn caustics(p: vec3f, t: f32) -> f32 {
  var q = p.xz * 1.7;
  var s = 0.0;
  for (var i = 0; i < 3; i++) {
    let fi = f32(i);
    q = vec2f(q.x + sin(q.y * 1.3 + t * (0.6 + 0.2 * fi)), q.y + cos(q.x * 1.1 - t * (0.5 + 0.15 * fi)));
    s += 1.0 / (1.0 + 6.0 * abs(sin(q.x) * sin(q.y)));
  }
  return s / 3.0;
}

/** Lit colour of a surface with albedo \`base\` and world normal \`n\` at \`world\` (before fog). */
fn shadeSurface(base: vec3f, n: vec3f, world: vec3f) -> vec3f {
  let L = normalize(frame.lightDir.xyz);
  let V = normalize(frame.camPos.xyz - world);
  let t = frame.camPos.w;
  let wrap = max((dot(n, L) + 0.35) / 1.35, 0.0);
  let hemi = mix(vec3f(0.05, 0.12, 0.18), vec3f(0.35, 0.6, 0.7), n.y * 0.5 + 0.5);
  let caus = caustics(world, t) * smoothstep(-0.2, 0.8, n.y);
  let H = normalize(L + V);
  let spec = pow(max(dot(n, H), 0.0), 40.0) * 0.35;
  let rim = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.35;
  var col = base * (hemi * 0.9 + vec3f(0.9, 0.95, 0.9) * wrap * 0.75 + vec3f(0.5, 0.8, 0.8) * caus * 0.45);
  col += vec3f(spec) + vec3f(0.3, 0.6, 0.7) * rim;
  return col;
}

fn quatRotate(q: vec4f, v: vec3f) -> vec3f {
  let t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}
`,_=`
${g}

struct VOut { @builtin(position) pos: vec4f, @location(0) ndc: vec2f };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let p = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3))[vi];
  var o: VOut;
  o.pos = vec4f(p, 1.0, 1.0);
  o.ndc = p;
  return o;
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  let a = frame.invViewProj * vec4f(i.ndc, 0.0, 1.0);
  let b = frame.invViewProj * vec4f(i.ndc, 1.0, 1.0);
  let d = normalize(b.xyz / b.w - a.xyz / a.w);
  var c = waterColor(d, frame.camPos.y);
  // Soft god rays: streaks around the light direction, drifting slowly.
  let t = frame.camPos.w;
  let ang = atan2(d.x, d.z);
  let rays = 0.5 + 0.5 * sin(ang * 23.0 + t * 0.15) * sin(ang * 37.0 - t * 0.1);
  c += vec3f(0.04, 0.09, 0.1) * rays * smoothstep(0.1, 0.9, d.y);
  return vec4f(c, 1.0);
}
`,v=`
${g}

@group(0) @binding(1) var<storage, read> bodyState: array<vec4f>;
/** Per body: (half extents, _), (rgb, glow). */
@group(0) @binding(2) var<storage, read> bodyInfo: array<vec4f>;

const BS_VEC4S = 8u;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) local: vec3f,
  @location(2) @interpolate(flat) nLocal: vec3f,
  @location(3) @interpolate(flat) half: vec3f,
  @location(4) @interpolate(flat) color: vec4f,
  @location(5) @interpolate(flat) q: vec4f,
};

const FACE_N = array<vec3f, 6>(
  vec3f(1, 0, 0), vec3f(-1, 0, 0), vec3f(0, 1, 0), vec3f(0, -1, 0), vec3f(0, 0, 1), vec3f(0, 0, -1));
const FACE_U = array<vec3f, 6>(
  vec3f(0, 1, 0), vec3f(0, 0, 1), vec3f(0, 0, 1), vec3f(1, 0, 0), vec3f(1, 0, 0), vec3f(0, 1, 0));
const CORNER = array<vec2f, 6>(
  vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(-1, 1));

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) body: u32) -> VOut {
  let face = vi / 6u;
  let c = CORNER[vi % 6u];
  let n = FACE_N[face];
  let u = FACE_U[face];
  let v = cross(n, u);
  let half = bodyInfo[body * 2u].xyz;
  let local = (n + u * c.x + v * c.y) * half;
  let base = u32(frame.viewport.z) + body * BS_VEC4S;
  let x = bodyState[base].xyz;
  let q = bodyState[base + 1u];
  let world = x + quatRotate(q, local);
  var o: VOut;
  o.pos = frame.viewProj * vec4f(world, 1.0);
  o.world = world;
  o.local = local;
  o.nLocal = n;
  o.half = half;
  o.color = bodyInfo[body * 2u + 1u];
  o.q = q;
  return o;
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  // Bevel: bend the normal towards the edges within radius r.
  let r = max(min(min(i.half.x, i.half.y), i.half.z) * 0.6, 0.004);
  let e = max(abs(i.local) - (i.half - vec3f(r)), vec3f(0.0)) / r;
  let bent = normalize(i.nLocal + sign(i.local) * e * (vec3f(1.0) - abs(i.nLocal)) * 1.2);
  let n = normalize(quatRotate(i.q, bent));
  let edge = max(max(e.x * (1.0 - abs(i.nLocal.x)), e.y * (1.0 - abs(i.nLocal.y))), e.z * (1.0 - abs(i.nLocal.z)));

  var col = shadeSurface(i.color.rgb, n, i.world);
  col *= 1.0 - edge * 0.12;
  // Editor highlight: lift the colour and add a warm rim and edge line.
  let glow = i.color.a;
  if (glow > 0.0) {
    let V = normalize(frame.camPos.xyz - i.world);
    let rim = pow(1.0 - max(dot(n, V), 0.0), 2.0);
    col = mix(col, col * 1.3 + vec3f(0.05, 0.045, 0.02), glow);
    col += vec3f(1.0, 0.78, 0.34) * (rim * 0.8 + smoothstep(0.55, 1.0, edge) * 0.5) * glow;
  }
  col = mix(col, col * 1.25 + vec3f(0.05), frame.misc.x);
  return vec4f(applyFog(col, i.world), 1.0);
}
`,y=`
${g}

@group(0) @binding(1) var<storage, read> bodyState: array<vec4f>;
/** Per eye: (centre xyz, part), (forward xyz, radius), (up xyz, side), (lid rgb, _); part frame. */
@group(0) @binding(2) var<storage, read> eyeInfo: array<vec4f>;
/** Per eye: (pupil x, y, radius, _), (u, l, tiltU, tiltL), (bendU, bendL, _, _). */
@group(0) @binding(3) var<storage, read> eyeState: array<vec4f>;

const BS_VEC4S = ${l.WORDS/4}u;
const INFO = 4u;
const STATE = 3u;
/** Lid shell radius, in eyeball radii. */
const SHELL = 1.08;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) @interpolate(perspective, sample) world: vec3f,
  @location(1) @interpolate(flat) eye: u32,
  @location(2) @interpolate(flat) center: vec3f,
  @location(3) @interpolate(flat) fwd: vec3f,
  @location(4) @interpolate(flat) up: vec3f,
};

const FACE_N = array<vec3f, 6>(
  vec3f(1, 0, 0), vec3f(-1, 0, 0), vec3f(0, 1, 0), vec3f(0, -1, 0), vec3f(0, 0, 1), vec3f(0, 0, -1));
const FACE_U = array<vec3f, 6>(
  vec3f(0, 1, 0), vec3f(0, 0, 1), vec3f(0, 0, 1), vec3f(1, 0, 0), vec3f(1, 0, 0), vec3f(0, 1, 0));
const CORNER = array<vec2f, 6>(
  vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(-1, 1));

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) eye: u32) -> VOut {
  let c0 = eyeInfo[eye * INFO];
  let f0 = eyeInfo[eye * INFO + 1u];
  let u0 = eyeInfo[eye * INFO + 2u];
  let base = u32(frame.viewport.z) + u32(c0.w) * BS_VEC4S;
  let x = bodyState[base].xyz;
  let q = bodyState[base + 1u];
  let center = x + quatRotate(q, c0.xyz);
  let fwd = quatRotate(q, f0.xyz);
  let up = quatRotate(q, u0.xyz);
  let right = cross(up, fwd);

  let face = vi / 6u;
  let c = CORNER[vi % 6u];
  let n = FACE_N[face];
  let u = FACE_U[face];
  let v = cross(n, u);
  let l = (n + u * c.x + v * c.y) * f0.w * SHELL;
  let world = center + right * l.x + up * l.y + fwd * l.z;
  var o: VOut;
  o.pos = frame.viewProj * vec4f(world, 1.0);
  o.world = world;
  o.eye = eye;
  o.center = center;
  o.fwd = fwd;
  o.up = up;
  return o;
}

/** Nearest ray parameter where the ray hits the sphere, or −1. */
fn hitSphere(ro: vec3f, rd: vec3f, c: vec3f, r: f32) -> f32 {
  let oc = ro - c;
  let b = dot(oc, rd);
  let h = b * b - (dot(oc, oc) - r * r);
  if (h < 0.0) { return -1.0; }
  let s = sqrt(h);
  let t = -b - s;
  if (t > 0.0) { return t; }
  return select(-1.0, -b + s, -b + s > 0.0);
}

// Lid edges: see src/looks/lids.ts.
fn inner(x: f32, side: f32) -> f32 {
  return select(side * x, 0.5 - abs(x), side == 0.0);
}
fn upperEdge(lid: vec4f, bend: vec4f, x: f32, side: f32) -> f32 {
  return lid.x - lid.z * inner(x, side) - bend.x * x * x;
}
fn lowerEdge(lid: vec4f, bend: vec4f, x: f32, side: f32) -> f32 {
  return lid.y + lid.w * inner(x, side) - bend.y * x * x;
}

struct FOut {
  @location(0) color: vec4f,
  @builtin(frag_depth) depth: f32,
};

fn finish(col: vec3f, p: vec3f) -> FOut {
  var o: FOut;
  let lit = mix(col, col * 1.25 + vec3f(0.05), frame.misc.x);
  o.color = vec4f(applyFog(lit, p), 1.0);
  let clip = frame.viewProj * vec4f(p, 1.0);
  o.depth = clip.z / clip.w;
  return o;
}

@fragment
fn fs(i: VOut) -> FOut {
  let info = i.eye * INFO;
  let radius = eyeInfo[info + 1u].w;
  let side = eyeInfo[info + 2u].w;
  let lidColor = eyeInfo[info + 3u].rgb;
  let st = i.eye * STATE;
  let pupil = eyeState[st];
  let lid = eyeState[st + 1u];
  let bend = eyeState[st + 2u];
  let right = cross(i.up, i.fwd);

  let ro = frame.camPos.xyz;
  let rd = normalize(i.world - ro);

  // Lid shell: eye-space coordinates in eyeball radii, so a head-on view matches lids.ts.
  let ts = hitSphere(ro, rd, i.center, radius * SHELL);
  if (ts < 0.0) { discard; }
  let ps = ro + rd * ts;
  let ls = (ps - i.center) / radius;
  let sx = dot(ls, right);
  let sy = dot(ls, i.up);
  let sz = dot(ls, i.fwd);
  if (sz > -0.25 * SHELL) {
    let up = upperEdge(lid, bend, sx, side);
    let lo = lowerEdge(lid, bend, sx, side);
    if (sy > up || sy < lo) {
      let n = normalize(ps - i.center);
      var col = shadeSurface(lidColor, n, ps);
      // Dark lash line along the lid's edge, softer crease a little further in.
      let edge = min(abs(sy - up), abs(sy - lo));
      col *= mix(0.25, 1.0, smoothstep(0.04, 0.1, edge));
      col *= mix(0.85, 1.0, smoothstep(0.18, 0.26, edge));
      return finish(col, ps);
    }
  }

  // Eyeball.
  let te = hitSphere(ro, rd, i.center, radius);
  if (te < 0.0) { discard; }
  let pe = ro + rd * te;
  let n = normalize(pe - i.center);
  let x = dot(n, right);
  let y = dot(n, i.up);
  let z = dot(n, i.fwd);
  let d = length(vec2f(x, y) - pupil.xy);
  let aa = 0.02;
  let inPupil = select(0.0, 1.0 - smoothstep(pupil.z - aa, pupil.z + aa, d), z > 0.0);
  let sclera = vec3f(0.96, 0.95, 0.9) * mix(0.75, 1.0, smoothstep(-0.3, 0.6, z));
  var col = shadeSurface(sclera, n, pe) * 0.85 + sclera * 0.15;
  let pupilCol = vec3f(0.015, 0.015, 0.025);
  col = mix(col, pupilCol + vec3f(pow(max(dot(n, normalize(normalize(frame.lightDir.xyz) - rd)), 0.0), 120.0)), inPupil);
  // Cartoon glint: a small white dot on the pupil, up and to one side.
  let g = length(vec2f(x, y) - (pupil.xy + vec2f(-0.35, 0.4) * pupil.z));
  col = mix(col, vec3f(1.0), inPupil * (1.0 - smoothstep(0.18 * pupil.z, 0.24 * pupil.z, g)));
  // Faint shadow under the upper lid.
  let shade = smoothstep(0.0, 0.18, upperEdge(lid, bend, x, side) - y);
  col *= mix(0.7, 1.0, shade);
  return finish(col, pe);
}
`,b=`
${g}

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let corner = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(-1, 1))[vi];
  let p = frame.goal.xyz;
  let toCam = normalize(frame.camPos.xyz - p);
  let right = normalize(cross(vec3f(0, 1, 0), toCam));
  let up = cross(toCam, right);
  let size = 0.55;
  var o: VOut;
  o.pos = frame.viewProj * vec4f(p + (right * corner.x + up * corner.y) * size, 1.0);
  o.uv = corner;
  return o;
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  if (frame.goal.w < 0.5) { discard; }
  let r = length(i.uv);
  let t = frame.camPos.w;
  let core = exp(-r * r * 60.0);
  let halo = exp(-r * r * 7.0) * 0.45;
  let ringR = fract(t * 0.6) * 0.9 + 0.1;
  let ring = exp(-pow((r - ringR) * 18.0, 2.0)) * (1.0 - ringR) * 0.8;
  let c = vec3f(1.0, 0.85, 0.35) * (core * 2.0 + halo) + vec3f(1.0, 0.7, 0.3) * ring;
  let a = clamp(core + halo + ring, 0.0, 1.0);
  return vec4f(c, a);
}
`,x=`
${g}

@group(0) @binding(1) var<storage, read> trail: array<vec4f>;

struct VOut { @builtin(position) pos: vec4f, @location(0) a: f32 };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let n = u32(frame.focus.w);
  let p = trail[vi];
  var o: VOut;
  o.pos = frame.viewProj * vec4f(p.xyz, 1.0);
  o.a = select(0.0, f32(vi) / f32(max(n, 1u)), vi < n);
  return o;
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  let a = i.a * i.a * 0.7;
  return vec4f(vec3f(0.5, 0.9, 1.0) * a, a);
}
`,S=2500,C=`
${g}

const BOX = 18.0;

fn hash3(n: u32) -> vec3f {
  var x = n * 747796405u + 2891336453u;
  var v = vec3u(x, x * 1664525u + 1013904223u, x * 22695477u + 1u);
  v = (v >> vec3u(16u)) ^ v;
  v = v * 0x45d9f3bu;
  v = (v >> vec3u(16u)) ^ v;
  return vec3f(v & vec3u(0xffffu)) / 65535.0;
}

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f, @location(1) alpha: f32 };

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
  let t = frame.camPos.w;
  let h = hash3(ii);
  let drift = (hash3(ii + 7919u) - 0.5) * vec3f(0.05, 0.03, 0.05) + vec3f(0.0, -0.01, 0.0);
  let cam = frame.camPos.xyz;
  var p = h * BOX + drift * t;
  p = p - BOX * floor((p - cam) / BOX + 0.5);
  let corner = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(-1, 1))[vi];
  let size = 0.012 + 0.02 * h.x;
  var clip = frame.viewProj * vec4f(p, 1.0);
  clip = vec4f(clip.xy + corner * size * vec2f(frame.viewport.y / frame.viewport.x, 1.0) * 1.6, clip.zw);
  let dist = length(p - cam);
  var o: VOut;
  o.pos = clip;
  o.uv = corner;
  o.alpha = (1.0 - smoothstep(BOX * 0.25, BOX * 0.5, dist)) * smoothstep(0.3, 1.2, dist) * (0.25 + 0.35 * h.y);
  return o;
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  let r = dot(i.uv, i.uv);
  let a = i.alpha * exp(-r * 3.0);
  return vec4f(vec3f(0.6, 0.85, 0.9) * a, a);
}
`,w=4,T=`depth24plus`,E={color:{srcFactor:`one`,dstFactor:`one`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one`,operation:`add`}},D=class{device;context;format;frameBuf;frameData=new Float32Array(64);trailBuf;trailData=new Float32Array(2400);bodyInfoBuf=null;bodyStateBuf=null;bodyStateOffset=0;bodyCount=0;ownedStateBuf=null;eyeInfoBuf=null;eyeStateBuf=null;eyeCount=0;eyeGroup=null;bgPipeline;bodyPipeline;eyePipeline;particlePipeline;targetPipeline;trailPipeline;frameGroup;bodyGroup=null;trailGroup;fixedGroups=new Map;skip=new Set;msaa=null;depth=null;constructor(e,t,n){this.device=e,this.context=t,this.format=n,t.configure({device:e,format:n,alphaMode:`opaque`}),this.frameBuf=e.createBuffer({size:256,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.trailBuf=e.createBuffer({size:9600,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});let r=(t,r,i)=>{let a=e.createShaderModule({code:t,label:r});return e.createRenderPipeline({label:r,layout:`auto`,vertex:{module:a,entryPoint:`vs`},fragment:{module:a,entryPoint:`fs`,targets:[{format:n,blend:i.blend}]},primitive:{topology:i.topology??`triangle-list`,cullMode:i.cull??`none`},depthStencil:{format:T,depthWriteEnabled:i.depthWrite,depthCompare:`less-equal`},multisample:{count:w}})};this.bgPipeline=r(_,`background`,{depthWrite:!1}),this.bodyPipeline=r(v,`bodies`,{depthWrite:!0,cull:`back`}),this.eyePipeline=r(y,`eyes`,{depthWrite:!0,cull:`back`}),this.particlePipeline=r(C,`particles`,{depthWrite:!1,blend:E}),this.targetPipeline=r(b,`target`,{depthWrite:!1,blend:E}),this.trailPipeline=r(x,`trail`,{depthWrite:!1,blend:E,topology:`line-strip`}),this.frameGroup=t=>{let n=this.fixedGroups.get(t);return n||(n=e.createBindGroup({layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.frameBuf}}]}),this.fixedGroups.set(t,n)),n},this.trailGroup=e.createBindGroup({layout:this.trailPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.frameBuf}},{binding:1,resource:{buffer:this.trailBuf}}]})}setBodies(e){this.bodyInfoBuf?.destroy();let t=new Float32Array(Math.max(e.length,1)*8);e.forEach((e,n)=>{t.set(e.halfExtents,n*8),t.set(e.color,n*8+4),t[n*8+7]=e.glow??0}),this.bodyInfoBuf=this.device.createBuffer({size:t.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.bodyInfoBuf,0,t),this.bodyCount=e.length,this.bodyGroup=null}setEyes(e){this.eyeInfoBuf?.destroy(),this.eyeStateBuf?.destroy();let t=Math.max(e.length,1),n=new Float32Array(t*4*4);e.forEach((e,t)=>{let r=t*4*4;n.set([...e.center,e.part],r),n.set([...e.forward,e.radius],r+4),n.set([...e.up,e.side],r+8),n.set([...e.lidColor,0],r+12)}),this.eyeInfoBuf=this.device.createBuffer({size:n.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.eyeInfoBuf,0,n),this.eyeStateBuf=this.device.createBuffer({size:t*3*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.eyeCount=e.length,this.eyeGroup=null}setEyeState(e){this.eyeStateBuf&&this.eyeCount!==0&&this.device.queue.writeBuffer(this.eyeStateBuf,0,e,0,this.eyeCount*3*4)}useBodyStateBuffer(e,t){(this.bodyStateBuf!==e||this.bodyStateOffset!==t/4)&&(this.bodyStateBuf=e,this.bodyStateOffset=t/4,this.bodyGroup=null,this.eyeGroup=null)}clearBodyState(){this.bodyStateBuf=null,this.bodyGroup=null,this.eyeGroup=null}uploadBodyState(e){let t=Math.max(e.byteLength,16);(!this.ownedStateBuf||this.ownedStateBuf.size<t)&&(this.ownedStateBuf?.destroy(),this.ownedStateBuf=this.device.createBuffer({size:t,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),this.device.queue.writeBuffer(this.ownedStateBuf,0,e),(this.bodyStateBuf!==this.ownedStateBuf||this.bodyStateOffset!==0)&&this.useBodyStateBuffer(this.ownedStateBuf,0)}ensureTargets(e,t){this.msaa&&this.msaa.width===e&&this.msaa.height===t||(this.msaa?.destroy(),this.depth?.destroy(),this.msaa=this.device.createTexture({size:[e,t],format:this.format,sampleCount:w,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.depth=this.device.createTexture({size:[e,t],format:T,sampleCount:w,usage:GPUTextureUsage.RENDER_ATTACHMENT}))}render(e,t){let n=t??this.context.getCurrentTexture(),{width:r,height:i}=n;this.ensureTargets(r,i);let a=e.camera;a.update(r/i);let o=this.frameData;o.set(a.viewProj,0),o.set(a.invViewProj,16);let s=a.eye;o.set([s[0],s[1],s[2],e.time],32),o.set([.35,1,.25,.035],36),o.set([...e.target??[0,0,0],+!!e.target],40),o.set([r,i,this.bodyStateOffset,this.bodyCount],44);let c=e.trail.slice(-600);o.set([...a.focus,c.length],48),o.set([e.highlight??0,0,0,0],52),this.device.queue.writeBuffer(this.frameBuf,0,o),c.forEach((e,t)=>this.trailData.set([e[0],e[1],e[2],1],t*4)),c.length&&this.device.queue.writeBuffer(this.trailBuf,0,this.trailData,0,c.length*4);let l=this.device.createCommandEncoder(),u=l.beginRenderPass({colorAttachments:[{view:this.msaa.createView(),resolveTarget:n.createView(),loadOp:`clear`,storeOp:`discard`,clearValue:{r:0,g:.03,b:.06,a:1}}],depthStencilAttachment:{view:this.depth.createView(),depthLoadOp:`clear`,depthStoreOp:`discard`,depthClearValue:1}});this.skip.has(`bg`)||(u.setPipeline(this.bgPipeline),u.setBindGroup(0,this.frameGroup(this.bgPipeline)),u.draw(3)),!this.skip.has(`bodies`)&&this.bodyInfoBuf&&this.bodyStateBuf&&this.bodyCount>0&&(this.bodyGroup||=this.device.createBindGroup({layout:this.bodyPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.frameBuf}},{binding:1,resource:{buffer:this.bodyStateBuf}},{binding:2,resource:{buffer:this.bodyInfoBuf}}]}),u.setPipeline(this.bodyPipeline),u.setBindGroup(0,this.bodyGroup),u.draw(36,this.bodyCount)),!this.skip.has(`eyes`)&&this.eyeCount>0&&this.eyeInfoBuf&&this.eyeStateBuf&&this.bodyStateBuf&&(this.eyeGroup||=this.device.createBindGroup({layout:this.eyePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.frameBuf}},{binding:1,resource:{buffer:this.bodyStateBuf}},{binding:2,resource:{buffer:this.eyeInfoBuf}},{binding:3,resource:{buffer:this.eyeStateBuf}}]}),u.setPipeline(this.eyePipeline),u.setBindGroup(0,this.eyeGroup),u.draw(36,this.eyeCount)),!this.skip.has(`trail`)&&c.length>1&&(u.setPipeline(this.trailPipeline),u.setBindGroup(0,this.trailGroup),u.draw(c.length)),this.skip.has(`particles`)||(u.setPipeline(this.particlePipeline),u.setBindGroup(0,this.frameGroup(this.particlePipeline)),u.draw(6,S)),!this.skip.has(`target`)&&e.target&&(u.setPipeline(this.targetPipeline),u.setBindGroup(0,this.frameGroup(this.targetPipeline)),u.draw(6)),u.end(),this.device.queue.submit([l.finish()])}async capture(e,t,n){let r=this.device.createTexture({size:[t,n],format:this.format,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});this.render(e,r);let i=Math.ceil(t*4/256)*256,a=this.device.createBuffer({size:i*n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),o=this.device.createCommandEncoder();o.copyTextureToBuffer({texture:r},{buffer:a,bytesPerRow:i},[t,n]),this.device.queue.submit([o.finish()]),await a.mapAsync(GPUMapMode.READ);let s=new Uint8Array(a.getMappedRange()),c=new Uint8ClampedArray(t*n*4),l=this.format===`bgra8unorm`;for(let e=0;e<n;e++)for(let n=0;n<t;n++){let r=e*i+n*4,a=(e*t+n)*4;c[a]=s[r+(l?2:0)],c[a+1]=s[r+1],c[a+2]=s[r+(l?0:2)],c[a+3]=255}return a.unmap(),a.destroy(),r.destroy(),c}destroy(){this.frameBuf.destroy(),this.trailBuf.destroy(),this.bodyInfoBuf?.destroy(),this.ownedStateBuf?.destroy(),this.eyeInfoBuf?.destroy(),this.eyeStateBuf?.destroy(),this.msaa?.destroy(),this.depth?.destroy()}};l.WORDS;async function O(){let e=await(async()=>{if(!(`gpu`in navigator))return`navigator.gpu is missing.`;let e=await navigator.gpu.requestAdapter({powerPreference:`high-performance`});if(!e)return`No WebGPU adapter was found.`;let t=await e.requestDevice({requiredLimits:{maxStorageBufferBindingSize:e.limits.maxStorageBufferBindingSize,maxBufferSize:e.limits.maxBufferSize}});return t.lost.then(e=>console.error(`WebGPU device lost:`,e.message)),{device:t,adapter:e}})();if(typeof e!=`string`)return Object.assign(window,{__gpu:e}),e;let t=document.getElementById(`no-webgpu-detail`);return t&&(t.textContent=e),document.getElementById(`no-webgpu`)?.showModal(),null}function k(e,t){let n=new D(e,t.getContext(`webgpu`),navigator.gpu.getPreferredCanvasFormat());e.addEventListener(`uncapturederror`,e=>console.error(`WebGPU:`,e.error.message));let r=new URLSearchParams(location.search).get(`skip`);return r&&(n.skip=new Set(r.split(`,`))),n}var A=(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]],j=(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],M=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],N=(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2],P=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],F=e=>Math.hypot(e[0],e[1],e[2]),I=e=>{let t=F(e);return t>1e-12?M(e,1/t):[0,0,0]},L=(e,t)=>[e[3]*t[0]+e[0]*t[3]+e[1]*t[2]-e[2]*t[1],e[3]*t[1]-e[0]*t[2]+e[1]*t[3]+e[2]*t[0],e[3]*t[2]+e[0]*t[1]-e[1]*t[0]+e[2]*t[3],e[3]*t[3]-e[0]*t[0]-e[1]*t[1]-e[2]*t[2]],ee=e=>[-e[0],-e[1],-e[2],e[3]],te=e=>{let t=Math.hypot(e[0],e[1],e[2],e[3]);return[e[0]/t,e[1]/t,e[2]/t,e[3]/t]},R=(e,t)=>{let n=I(e),r=Math.sin(t/2);return[n[0]*r,n[1]*r,n[2]*r,Math.cos(t/2)]},ne=(e,t,n)=>L(R([0,0,1],n),L(R([0,1,0],t),R([1,0,0],e))),z=(e,t)=>{let n=[e[0],e[1],e[2]],r=M(P(n,t),2);return A(A(t,M(r,e[3])),P(n,r))},re=(e,t)=>z(ee(e),t),ie=e=>[z(e,[1,0,0]),z(e,[0,1,0]),z(e,[0,0,1])],ae=(e,t)=>{let n=N(e,t);if(n<-.999999){let t=P([1,0,0],e);return F(t)<1e-6&&(t=P([0,1,0],e)),R(t,Math.PI)}let r=P(e,t);return te([r[0],r[1],r[2],1+n])},oe=(e,t,n)=>{let r=e[0],i=t[1],a=n[2],o=r+i+a,s;if(o>0){let r=Math.sqrt(o+1)*2;s=[(t[2]-n[1])/r,(n[0]-e[2])/r,(e[1]-t[0])/r,.25*r]}else if(r>i&&r>a){let o=Math.sqrt(1+r-i-a)*2;s=[.25*o,(t[0]+e[1])/o,(n[0]+e[2])/o,(t[2]-n[1])/o]}else if(i>a){let o=Math.sqrt(1+i-r-a)*2;s=[(t[0]+e[1])/o,.25*o,(n[1]+t[2])/o,(n[0]-e[2])/o]}else{let o=Math.sqrt(1+a-r-i)*2;s=[(n[0]+e[2])/o,(n[1]+t[2])/o,.25*o,(e[1]-t[0])/o]}return te(s)},se=(e,t,n)=>e<t?t:e>n?n:e,ce=class e{a;b;c;d;spare=null;constructor(e){let t=e>>>0,n=()=>{t=t+2654435769>>>0;let e=t;return e=Math.imul(e^e>>>16,2246822507)>>>0,e=Math.imul(e^e>>>13,3266489909)>>>0,(e^e>>>16)>>>0};this.a=n(),this.b=n(),this.c=n(),this.d=n();for(let e=0;e<12;e++)this.u32()}u32(){let e=(this.a+this.b>>>0)+this.d>>>0;return this.d=this.d+1>>>0,this.a=this.b^this.b>>>9,this.b=this.c+(this.c<<3)>>>0,this.c=this.c<<21|this.c>>>11,this.c=this.c+e>>>0,e}next(){return this.u32()/4294967296}range(e,t){return e+(t-e)*this.next()}int(e){return Math.floor(this.next()*e)}chance(e){return this.next()<e}normal(){if(this.spare!==null){let e=this.spare;return this.spare=null,e}let e=0;for(;e===0;)e=this.next();let t=this.next(),n=Math.sqrt(-2*Math.log(e));return this.spare=n*Math.sin(2*Math.PI*t),n*Math.cos(2*Math.PI*t)}pick(e){return e[this.int(e.length)]}fork(){return new e(this.u32()^1540483477)}},le=[`rigid`,`hinge`,`twist`,`universal`,`spherical`],ue={rigid:0,hinge:1,twist:1,universal:2,spherical:3},de=e=>le.indexOf(e),fe=[`front`,`sides`,`top`,`cyclops`,`tips`,`none`],pe=.6,me=1.8,he={eyes:{placement:`front`,size:1}};function ge(e){if(!e||typeof e!=`object`)return;let t=e.eyes??{};return{eyes:{placement:fe.includes(t.placement)?t.placement:he.eyes.placement,size:typeof t.size==`number`&&Number.isFinite(t.size)?Math.min(me,Math.max(pe,t.size)):he.eyes.size}}}function _e(e){let t=e;if(!t||typeof t!=`object`||t.format!==`evolved-swimmer`)throw Error(`Not an evolved-swimmer creature file`);if(t.version!==1)throw Error(`Unsupported creature version ${String(t.version)}`);if(!t.genome||!Array.isArray(t.genome.nodes)||t.genome.nodes.length===0)throw Error(`Creature file has no genome`);let n=t;if(`look`in n){let e=ge(n.look);e?n.look=e:delete n.look}return n}var ve=.4,ye=.5000000000000001,be=(e,t)=>t===0?.5-Math.abs(e):t*e,xe=(e,t,n)=>e.u-e.tiltU*be(t,n)-e.bendU*t*t,Se=(e,t,n)=>e.l+e.tiltL*be(t,n)-e.bendL*t*t,Ce=(e,t,n,r)=>n>xe(e,t,r)||n<Se(e,t,r);function we(e,t){if(t<=0)return e;let n=e.l+.4*(e.u-e.l),r=1-t;return{u:n+(e.u-n)*r,l:n+(e.l-n)*r,tiltU:e.tiltU*r,tiltL:e.tiltL*r,bendU:e.bendU*r,bendL:e.bendL*r}}var Te=20;function Ee(e,t){let n=0,r=0;for(let i=0;i<Te;i++)for(let a=0;a<Te;a++){let o=(i+.5)/Te*2-1,s=(a+.5)/Te*2-1;if(o*o+s*s>1)continue;n++;let c=e.px+o*e.pr,l=e.py+s*e.pr;!Ce(e.lids,c,l,t)&&c*c+l*l<=1&&r++}return r/n}function De(e,t){let{px:n,py:r}=e,i=Math.hypot(n,r);i>.5000000000000001&&(n*=ye/i,r*=ye/i);let a={...e.lids},o=.5*e.pr,s=xe(a,n,t)-o,c=Se(a,n,t)+o;r=s>=c?Math.min(s,Math.max(c,r)):(s+c)/2;let l=Math.hypot(n,r);l>.5000000000000001&&(n*=ye/l,r*=ye/l);let u={px:n,py:r,pr:e.pr,lids:a};for(let i=0;i<40&&Ee(u,t)<.55;i++)r+e.pr-xe(a,n,t)>=Se(a,n,t)-(r-e.pr)?(a.u+=.03,a.tiltU*=.9,a.bendU*=.9):(a.l-=.03,a.tiltL*=.9,a.bendL*=.9),u={px:n,py:r,pr:e.pr,lids:a};return u}function Oe(e,t){let n=t&&t.length>=e.length*12?t:new Float32Array(Math.max(e.length,1)*12);return e.forEach((e,t)=>{let r=t*12;n[r]=e.px,n[r+1]=e.py,n[r+2]=e.pr,n[r+3]=0,n[r+4]=e.lids.u,n[r+5]=e.lids.l,n[r+6]=e.lids.tiltU,n[r+7]=e.lids.tiltL,n[r+8]=e.lids.bendU,n[r+9]=e.lids.bendL,n[r+10]=0,n[r+11]=0}),n}var ke={search:{u:.6,l:-.66,tiltU:0,tiltL:0,bendU:.12,bendL:-.1,pr:ve},track:{u:.86,l:-.8,tiltU:0,tiltL:0,bendU:.15,bendL:-.1,pr:.42},focus:{u:.3,l:-.34,tiltU:.4,tiltL:.1,bendU:0,bendL:-.05,pr:.35},happy:{u:.8,l:.02,tiltU:0,tiltL:0,bendU:.1,bendL:.6,pr:ve},dizzy:{u:.62,l:-.74,tiltU:-.25,tiltL:0,bendU:.1,bendL:-.1,pr:.34},drowsy:{u:.08,l:-.6,tiltU:-.1,tiltL:0,bendU:0,bendL:-.1,pr:ve}},Ae=95*Math.PI/180,je=55*Math.PI/180,Me=25*Math.PI/180,Ne=35*Math.PI/180,Pe=.25,Fe=30,Ie=.45,Le=1/240,Re=.5,ze=10,Be=.35,Ve=4,He=8,Ue=1.1,We=.3,Ge=(e,t)=>[e[t],e[t+1],e[t+2]],Ke=class{mood=`search`;inView=!1;facingAngle=NaN;rt;rng;birth;heading;meanForward;lids={...ke.search};fixation;nextSaccade=0;jitter=[0,0];nextJitter=0;outOfView=1/0;focusHold=0;focused=!1;happy=0;spin=[0,0,0];world=[];dizzyPhase=0;pausedFor=0;lastTarget=null;lastTime=NaN;blink=null;nextBlink;frames=[];desired=[];saccades=0;constructor(e,t,n,r=Date.now()>>>0){this.rng=new ce(r),this.rt=t.map(e=>({spec:e,p:[0,0],v:[0,0],lastVel:null})),this.birth=e.body.parts.map(e=>({x:e.pos,q:e.rot,v:[0,0,0],w:[0,0,0]}));let i=e.body.parts[0],a=n&&F(n)>1e-6?I(n):[0,0,1];this.heading=re(i.rot,a);let o=[0,0,0];for(let n of t)o=A(o,z(e.body.parts[n.part].rot,n.forward));this.meanForward=re(i.rot,F(o)>.3?I(o):a),this.fixation=this.meanForward,this.nextBlink=this.rng.range(1.5,4)}get eyeCount(){return this.rt.length}onReached(){this.happy=Ue,this.rt.length>=2&&this.rng.chance(.25)&&this.startBlink(.25,0)}current(){return this.frames}update(e,t){e=Math.min(Math.max(e,0),.1);let n=this.poses(t.poses),r=n[0],i=t.time!==this.lastTime,a=Number.isNaN(this.lastTime)?0:t.time-this.lastTime;this.lastTime=t.time;let o=this.rt.map(e=>qe(n[e.spec.part],e.spec));this.world=o.map(e=>({center:e.c,forward:e.f}));let s=t.target;if(this.inView=!1,s)for(let e of o)N(I(j(s,e.c)),e.f)>Math.cos(Ae)&&(this.inView=!0);if(this.outOfView=this.inView?0:this.outOfView+e,s){let e=z(r.q,this.heading),n=j(s,t.com);this.facingAngle=F(n)>1e-6?Math.acos(Math.max(-1,Math.min(1,N(e,I(n))))):0}else this.facingAngle=NaN;let c=this.inView&&this.facingAngle<(this.focused?Ne:Me);this.focusHold=c?this.focusHold+e:0;let l=this.focused;this.focused=this.focused?c:this.focusHold>=Pe,this.focused&&!l&&this.rng.chance(.5)&&this.startBlink(.02),t.paused||(this.spin=A(this.spin,M(j(r.w,this.spin),1-Math.exp(-e))));let u=!!s&&(!this.lastTarget||F(j(s,this.lastTarget))>1e-5);this.lastTarget=s,this.pausedFor=t.paused&&!u?this.pausedFor+e:0,this.happy=Math.max(0,this.happy-e),this.mood=!t.alive||F(this.spin)>Ve?`dizzy`:this.happy>0?`happy`:this.pausedFor>He?`drowsy`:this.focused?`focus`:this.inView?`track`:`search`;let d=ke[this.mood],f=1-Math.exp(-e*ze);for(let e of Object.keys(d))this.lids[e]+=(d[e]-this.lids[e])*f;if(this.nextSaccade-=e,!s||this.outOfView>Be?this.nextSaccade<=0&&this.saccade(r,t):this.nextSaccade=Math.min(this.nextSaccade,.15),this.nextJitter-=e,this.nextJitter<=0&&(this.nextJitter=this.rng.range(.12,.35),this.jitter=[this.rng.range(-.035,.035),this.rng.range(-.035,.035)]),this.dizzyPhase+=e*9,this.nextBlink-=e,!this.blink&&this.nextBlink<=0){let e=this.mood===`drowsy`;this.startBlink(e?.4:.02),this.nextBlink=e?this.rng.range(1.5,3):this.rng.range(2.5,6),!e&&this.rng.chance(.1)&&(this.nextBlink=.3)}let p=0;this.blink&&(this.blink.t+=e,p=Ye(this.blink.t,this.blink.hold),this.blink.t>.14+this.blink.hold&&(this.blink=null));let m=z(r.q,this.fixation),h=[];return this.rt.forEach((t,r)=>{let c=o[r],l;if(this.mood===`dizzy`){let e=this.dizzyPhase*(t.spec.side===0?1:t.spec.side);l=[.75*ye*Math.cos(e),.75*ye*Math.sin(e)]}else l=s&&this.outOfView<=Be?Je(I(j(s,c.c)),c):Je(m,c);this.desired[r]=l,l=[l[0]+this.jitter[0],l[1]+this.jitter[1]];let u=A(n[t.spec.part].v,P(n[t.spec.part].w,j(c.c,n[t.spec.part].x)));if(i&&a>0&&t.lastVel){let e=M(j(u,t.lastVel),Re/t.spec.radius),n=-N(e,c.r),r=-N(e,c.u),i=Math.hypot(n,r);i>6&&(n*=6/i,r*=6/i),t.v[0]+=n,t.v[1]+=r}i&&(t.lastVel=u),this.integrate(t,l,e);let d={...this.lids};d.u+=We*t.p[1],d.l+=We*t.p[1];let f=De({px:t.p[0],py:t.p[1],pr:this.lids.pr,lids:d},t.spec.side);t.p=[f.px,f.py];let g=this.blink&&(this.blink.only<0||this.blink.only===r)?p:0;h.push({...f,lids:we(f.lids,g)})}),this.frames=h,h}get blinking(){return this.blink!==null}startBlink(e,t=-1){this.blink={t:0,hold:e,only:t}}desiredOffsets(){return this.desired}saccade(e,t){this.saccades++,this.nextSaccade=this.rng.range(.4,1.6);let n=this.meanForward,r=I(A(n,[this.rng.normal()*.6,this.rng.normal()*.6,this.rng.normal()*.6]));if(N(r,n)<.2&&(r=I(A(r,n))),t.target&&this.rng.chance(.5)){let n=re(e.q,j(t.target,t.com));F(n)>1e-6&&(r=I(A(r,M(I(n),.7))))}this.fixation=r}integrate(e,t,n){let r=Math.max(1,Math.ceil(n/Le)),i=n/r;for(let n=0;n<r;n++){for(let n=0;n<2;n++){let r=900*(t[n]-e.p[n])-2*Ie*Fe*e.v[n];e.v[n]+=r*i,e.p[n]+=e.v[n]*i}let n=Math.hypot(e.p[0],e.p[1]);if(n>.5000000000000001){let t=e.p[0]/n,r=e.p[1]/n;e.p=[t*ye,r*ye];let i=e.v[0]*t+e.v[1]*r;i>0&&(e.v[0]-=1.4*i*t,e.v[1]-=1.4*i*r)}}}poses(e){return!e||e.length<this.birth.length*l.WORDS?this.birth:this.birth.map((t,n)=>{let r=n*l.WORDS;return{x:Ge(e,r+l.X),q:[e[r+l.Q],e[r+l.Q+1],e[r+l.Q+2],e[r+l.Q+3]],v:Ge(e,r+l.V),w:Ge(e,r+l.W)}})}};function qe(e,t){let n=z(e.q,t.forward),r=z(e.q,t.up);return{c:A(e.x,z(e.q,t.center)),f:n,u:r,r:P(r,n)}}function Je(e,t){let n=N(e,t.r),r=N(e,t.u),i=N(e,t.f),a=Math.hypot(n,r);if(a<1e-6)return i>=0?[0,0]:[ye,0];let o=i<=0?1:Math.min(1,a/Math.sin(je));return[n/a*o*ye,r/a*o*ye]}function Ye(e,t){return e<.06?e/.06:e<.06+t?1:Math.max(0,1-(e-.06-t)/.08)}function Xe(e,t){let n=0,r=[0,0,0];for(let t of e.body.parts){let e=8*t.halfExtents[0]*t.halfExtents[1]*t.halfExtents[2];n+=e,r=A(r,M(t.pos,e))}r=M(r,1/n);let i=.3;for(let t of e.body.parts){let e=Math.hypot(t.pos[0]-r[0],t.pos[1]-r[1],t.pos[2]-r[2]);i=Math.max(i,e+Math.max(...t.halfExtents))}return{com:r,size:i,mass:n,heading:t??[0,0,1]}}var Ze=.75;function Qe(e,t,n){let r=ae([0,0,1],I(t.heading)),i=n*t.size,a=t.com;return e.map(e=>a=A(a,M(z(r,e),i)))}function $e(e,t,n,r,i){return{paramSet:i,targets:Qe(e.legs,t,n.legSizes),reach:n.reachSizes*t.size,settleSteps:Math.round(n.settleSeconds/r.dt)}}var et=(e,t)=>e[t+d.ALIVE]===1,tt=.11,nt=.35,rt=.6,it=8,at=.9,ot=.25,st=.2,ct=.3,lt=[[1,0,0],[0,1,0],[0,0,1]];function ut(e,t){let n=[];for(let r=0;r<3;r++)for(let i of[1,-1]){let a=M(lt[r],i),o=M(a,e.halfExtents[r]),s=(r+1)%3,c=(r+2)%3;n.push({part:t,nLocal:a,cLocal:o,t:[lt[s],lt[c]],e:[e.halfExtents[s],e.halfExtents[c]],n:z(e.rot,a),c:A(e.pos,z(e.rot,o))})}return n}var dt=(e,t)=>Math.abs(N(t,e.t[0]))*e.e[0]+Math.abs(N(t,e.t[1]))*e.e[1];function ft(e,t){let n=j(t,M(e.nLocal,N(t,e.nLocal)));return F(n)>.3?I(n):null}function pt(e,t){let n=e.cLocal;return e.t.forEach((r,i)=>n=A(n,M(r,se(N(j(t,e.cLocal),r),-e.e[i],e.e[i])))),n}var mt=e=>e.e[0]>=e.e[1]?e.t[0]:e.t[1];function ht(e,t,n,r){return e.some((e,i)=>{if(i===t)return!1;let a=re(e.rot,j(n,e.pos));return Math.hypot(Math.max(Math.abs(a[0])-e.halfExtents[0],0),Math.max(Math.abs(a[1])-e.halfExtents[1],0),Math.max(Math.abs(a[2])-e.halfExtents[2],0))<r*.98})}function gt(e){let{parts:t}=e.body,n=[];return t.forEach((r,i)=>{if(r.parent<0)return void(n[i]=!0);let a=e.genome.nodes[t[r.parent].node].connections[r.conn];n[i]=n[r.parent]&&!a.reflect}),n}function _t(e,t){let n=1e-4*t,r=e=>e.halfExtents[0]*e.halfExtents[1]*e.halfExtents[2],i=(e,t)=>e.every((e,r)=>Math.abs(e-t[r])<n),a=0,o=0;for(let t of e){a+=r(t);let n=[-t.pos[0],t.pos[1],t.pos[2]];e.some(e=>i(e.pos,n)&&i(e.halfExtents,t.halfExtents))&&(o+=r(t))}return o>=at*a}function vt(e,t){let n=Xe(e),r=F(t)>1e-6?I(t):[0,0,1],i=[0,r[1],r[2]];F(i)>ct&&_t(e.body.parts,n.size)&&(r=I(i));let a=Math.abs(r[0])>.9?[0,0,1]:[1,0,0],o=I(j(a,M(r,N(a,r)))),s=I(P(r,o));return N(j(e.body.parts.reduce((e,t)=>N(t.pos,r)>N(e.pos,r)?t:e,e.body.parts[0]).pos,n.com),s)<-1e-6&&(s=M(s,-1)),{h:r,s:o,u:s,size:n.size,com:n.com,central:gt(e)}}function yt(e,t,n,r,i,a,o=nt,s){let c=s??t.nLocal,l=j(i,M(c,N(i,c)));if(F(l)<.3){let e=mt(t);l=j(e,M(c,N(e,c)))}l=I(l);let u=P(l,c),d=A(n,M(t.nLocal,o*r)),f=e[t.part];return{spec:{part:t.part,center:d,forward:c,up:l,radius:r,side:a?N(u,a)>=0?1:-1:0},world:A(f.pos,z(f.rot,d))}}var bt=(e,t)=>re(e,t);function xt(e,t,n,r,i){let a=e[t.part].rot,o=ft(t,bt(a,n.s))??mt(t),s=i?ft(t,bt(a,n.h)):null,c=s?I(A(t.nLocal,M(s,.9))):void 0,l=s?t.nLocal:bt(a,n.u),u=dt(t,o),d=dt(t,P(t.nLocal,o));for(let n of[1,.8,.65,.5]){let a=se(Math.min(u/1.3,d*1.4+r*.2),.55*r,r)*n,f=a*1.1,p=t.cLocal;s&&(p=A(p,M(s,Math.max(0,dt(t,s)-a*1.2))));let m=[1,-1].map(n=>yt(e,t,pt(t,A(p,M(o,n*f))),a,l,M(o,-n),i?rt:nt,c));if(!(F(j(m[0].world,m[1].world))<1.9*a)&&m.every(n=>!ht(e,t.part,n.world,n.spec.radius)))return m.map(e=>e.spec)}return null}function St(e,t,n,r=.5){let i=t.h;return e.flatMap((e,t)=>ut(e,t)).filter(e=>N(e.n,n)>r).sort((e,r)=>Number(t.central[r.part])-Number(t.central[e.part])||N(r.c,i)-N(e.c,i)+(N(r.n,n)-N(e.n,n))*.05)}function Ct(e,t){let n=t.h,r=0,i=-1/0;return e.forEach((e,a)=>{if(!t.central[a])return;let o=N(e.pos,n)+lt.reduce((t,r,i)=>t+Math.abs(N(z(e.rot,r),n))*e.halfExtents[i],0);o>i&&(i=o,r=a)}),r}function wt(e,t,n){let r=Math.max(...e.flatMap((e,n)=>t.central[n]?ut(e,n).map(e=>N(e.c,t.h)):[])),i=e=>N(e.c,t.h)>r-ot*t.size,a=[St(e,t,t.h).filter(i),St(e,t,t.h,st).filter(i),St(e,t,t.h)];for(let r of a)for(let i of r){let r=xt(e,i,t,n,!1);if(r)return r}return[]}function Tt(e,t,n){let r=Ct(e,t),i=St(e,t,t.u,.4).sort((e,t)=>Number(t.part===r)-Number(e.part===r));for(let r of i){let i=xt(e,r,t,n,!0);if(i)return i}return wt(e,t,n)}function Et(e,t,n){let r=n*1.6;for(let n of St(e,t,t.h)){let i=e[n.part].rot,a=bt(i,t.u);for(let t of[1,.8,.65,.5]){let i=se(Math.min(n.e[0],n.e[1])*1.3,.6*r,r)*t,o=yt(e,n,n.cLocal,i,a,null);if(!ht(e,n.part,o.world,i))return[o.spec]}}return[]}function Dt(e,t,n){let r=Ct(e,t),i=e.map((e,t)=>t).sort((n,i)=>Number(i===r)-Number(n===r)||Number(t.central[i])-Number(t.central[n])||N(e[i].pos,t.h)-N(e[n].pos,t.h));for(let r of i){let i=e[r],a=ut(i,r),o=e=>a.reduce((t,n)=>N(n.n,e)>N(t.n,e)?n:t,a[0]),s=o(t.s),c=o(M(t.s,-1));if(N(s.n,t.s)<.4||s===c)continue;let l=[];for(let a of[s,c]){let o=ft(a,bt(i.rot,t.h)),s=o?dt(a,o):0,c=dt(a,ft(a,bt(i.rot,t.u))??(o?P(a.nLocal,o):a.t[0])),u=null;for(let l of[1,.8,.65,.5]){let d=se(Math.min(s,c)*1.4,.55*n,n)*l,f=yt(e,a,o?pt(a,A(a.cLocal,M(o,Math.max(0,s-d*1.1)))):a.cLocal,d,bt(i.rot,t.u),o);if(!ht(e,r,f.world,d)){u=f.spec;break}}u&&l.push(u)}if(l.length===2)return l}return wt(e,t,n)}function Ot(e,t,n){let r=new Set(e.map(e=>e.parent)),i=e.map((e,t)=>({p:e,i:t})).filter(({p:e,i:t})=>!r.has(t)&&e.parent>=0).sort((e,n)=>F(j(n.p.pos,t.com))-F(j(e.p.pos,t.com))).slice(0,it),a=[],o=n*.75;for(let{p:n,i:r}of i){let i=I(j(n.pos,e[n.parent].pos)),s=ut(n,r).sort((e,t)=>N(t.n,i)-N(e.n,i))[0];for(let i of[1,.75,.55]){let c=se(Math.max(s.e[0],s.e[1])*1.2,.5*o,o)*i,l=yt(e,s,s.cLocal,c,bt(n.rot,t.u),null);if(!ht(e,r,l.world,c)){a.push(l.spec);break}}}return a.length>0?a:Et(e,t,n)}function kt(e,t,n){let r=e.body.parts,i=vt(e,t??[0,0,1]),a=tt*i.size*n.eyes.size;switch(n.eyes.placement){case`front`:return wt(r,i,a);case`sides`:return Dt(r,i,a);case`top`:return Tt(r,i,a);case`cyclops`:return Et(r,i,a);case`tips`:return Ot(r,i,a);case`none`:return[]}}var At=()=>new Float32Array(16);function jt(e,t,n,r,i){let a=1/Math.tan(t/2);return e.fill(0),e[0]=a/n,e[5]=a,e[10]=i/(r-i),e[11]=-1,e[14]=i*r/(r-i),e}function Mt(e,t,n,r){let i=t[0]-n[0],a=t[1]-n[1],o=t[2]-n[2],s=Math.hypot(i,a,o);i/=s,a/=s,o/=s;let c=r[1]*o-r[2]*a,l=r[2]*i-r[0]*o,u=r[0]*a-r[1]*i;s=Math.hypot(c,l,u),c/=s,l/=s,u/=s;let d=a*u-o*l,f=o*c-i*u,p=i*l-a*c;return e[0]=c,e[1]=d,e[2]=i,e[3]=0,e[4]=l,e[5]=f,e[6]=a,e[7]=0,e[8]=u,e[9]=p,e[10]=o,e[11]=0,e[12]=-(c*t[0]+l*t[1]+u*t[2]),e[13]=-(d*t[0]+f*t[1]+p*t[2]),e[14]=-(i*t[0]+a*t[1]+o*t[2]),e[15]=1,e}function Nt(e,t,n){let r=new Float32Array(16);for(let e=0;e<4;e++)for(let i=0;i<4;i++){let a=0;for(let r=0;r<4;r++)a+=t[r*4+i]*n[e*4+r];r[e*4+i]=a}return e.set(r),e}function Pt(e,t){let n=new Float32Array(16),r=t;n[0]=r[5]*r[10]*r[15]-r[5]*r[11]*r[14]-r[9]*r[6]*r[15]+r[9]*r[7]*r[14]+r[13]*r[6]*r[11]-r[13]*r[7]*r[10],n[4]=-r[4]*r[10]*r[15]+r[4]*r[11]*r[14]+r[8]*r[6]*r[15]-r[8]*r[7]*r[14]-r[12]*r[6]*r[11]+r[12]*r[7]*r[10],n[8]=r[4]*r[9]*r[15]-r[4]*r[11]*r[13]-r[8]*r[5]*r[15]+r[8]*r[7]*r[13]+r[12]*r[5]*r[11]-r[12]*r[7]*r[9],n[12]=-r[4]*r[9]*r[14]+r[4]*r[10]*r[13]+r[8]*r[5]*r[14]-r[8]*r[6]*r[13]-r[12]*r[5]*r[10]+r[12]*r[6]*r[9],n[1]=-r[1]*r[10]*r[15]+r[1]*r[11]*r[14]+r[9]*r[2]*r[15]-r[9]*r[3]*r[14]-r[13]*r[2]*r[11]+r[13]*r[3]*r[10],n[5]=r[0]*r[10]*r[15]-r[0]*r[11]*r[14]-r[8]*r[2]*r[15]+r[8]*r[3]*r[14]+r[12]*r[2]*r[11]-r[12]*r[3]*r[10],n[9]=-r[0]*r[9]*r[15]+r[0]*r[11]*r[13]+r[8]*r[1]*r[15]-r[8]*r[3]*r[13]-r[12]*r[1]*r[11]+r[12]*r[3]*r[9],n[13]=r[0]*r[9]*r[14]-r[0]*r[10]*r[13]-r[8]*r[1]*r[14]+r[8]*r[2]*r[13]+r[12]*r[1]*r[10]-r[12]*r[2]*r[9],n[2]=r[1]*r[6]*r[15]-r[1]*r[7]*r[14]-r[5]*r[2]*r[15]+r[5]*r[3]*r[14]+r[13]*r[2]*r[7]-r[13]*r[3]*r[6],n[6]=-r[0]*r[6]*r[15]+r[0]*r[7]*r[14]+r[4]*r[2]*r[15]-r[4]*r[3]*r[14]-r[12]*r[2]*r[7]+r[12]*r[3]*r[6],n[10]=r[0]*r[5]*r[15]-r[0]*r[7]*r[13]-r[4]*r[1]*r[15]+r[4]*r[3]*r[13]+r[12]*r[1]*r[7]-r[12]*r[3]*r[5],n[14]=-r[0]*r[5]*r[14]+r[0]*r[6]*r[13]+r[4]*r[1]*r[14]-r[4]*r[2]*r[13]-r[12]*r[1]*r[6]+r[12]*r[2]*r[5],n[3]=-r[1]*r[6]*r[11]+r[1]*r[7]*r[10]+r[5]*r[2]*r[11]-r[5]*r[3]*r[10]-r[9]*r[2]*r[7]+r[9]*r[3]*r[6],n[7]=r[0]*r[6]*r[11]-r[0]*r[7]*r[10]-r[4]*r[2]*r[11]+r[4]*r[3]*r[10]+r[8]*r[2]*r[7]-r[8]*r[3]*r[6],n[11]=-r[0]*r[5]*r[11]+r[0]*r[7]*r[9]+r[4]*r[1]*r[11]-r[4]*r[3]*r[9]-r[8]*r[1]*r[7]+r[8]*r[3]*r[5],n[15]=r[0]*r[5]*r[10]-r[0]*r[6]*r[9]-r[4]*r[1]*r[10]+r[4]*r[2]*r[9]+r[8]*r[1]*r[6]-r[8]*r[2]*r[5];let i=r[0]*n[0]+r[1]*n[4]+r[2]*n[8]+r[3]*n[12];i=i===0?0:1/i;for(let t=0;t<16;t++)e[t]=n[t]*i;return e}function Ft(e,t){let n=t[0],r=t[1],i=t[2];return[e[0]*n+e[4]*r+e[8]*i+e[12],e[1]*n+e[5]*r+e[9]*i+e[13],e[2]*n+e[6]*r+e[10]*i+e[14],e[3]*n+e[7]*r+e[11]*i+e[15]]}var It=class{yaw=.7;pitch=.35;distance=5;focus=[0,0,0];fovY=50*Math.PI/180;aspect=1;view=At();proj=At();viewProj=At();invViewProj=At();get eye(){let e=Math.cos(this.pitch);return A(this.focus,[this.distance*e*Math.sin(this.yaw),this.distance*Math.sin(this.pitch),this.distance*e*Math.cos(this.yaw)])}update(e){this.aspect=e,Mt(this.view,this.eye,this.focus,[0,1,0]),jt(this.proj,this.fovY,e,.05,200),Nt(this.viewProj,this.proj,this.view),Pt(this.invViewProj,this.viewProj)}orbit(e,t){this.yaw-=e*.006,this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch+t*.006))}zoom(e){this.distance=Math.max(1,Math.min(60,this.distance*e))}pan(e,t,n){let r=I(j(this.focus,this.eye)),i=I(P(r,[0,1,0])),a=P(i,r),o=2*this.distance*Math.tan(this.fovY/2)/n;this.focus=A(this.focus,A(M(i,-e*o),M(a,t*o)))}ray(e,t){let n=this.invViewProj,r=Ft(n,[e,t,0]),i=Ft(n,[e,t,1]),a=[r[0]/r[3],r[1]/r[3],r[2]/r[3]],o=[i[0]/i[3],i[1]/i[3],i[2]/i[3]];return{origin:this.eye,dir:I(j(o,a))}}project(e){let t=Ft(this.viewProj,e);return{x:t[0]/t[3],y:t[1]/t[3],w:t[3]}}get forward(){return I(j(this.focus,this.eye))}},Lt={seconds:12,settleSeconds:1,cones:[30,60,90,135,180],waypoints:16,legSizes:3,reachSizes:Ze,energyWeight:2e-4,jointSpeedWeight:.005},Rt=Math.PI/180,zt=(e,t)=>[Math.sin(e)*Math.cos(t),Math.sin(e)*Math.sin(t),Math.cos(e)];function Bt(e,t){let n=Math.cos(t),r=1-e.next()*(1-n);return zt(Math.acos(r),e.next()*Math.PI*2)}function Vt(e,t,n){return z(ae([0,0,1],t),Bt(e,n))}function Ht(e={}){let t={...Lt,...e},n=e=>t.cones[Math.min(e,t.cones.length-1)]*Rt,r=(e,n,r)=>{let i=[r];for(;i.length<t.waypoints;)i.push(Vt(e,i[i.length-1],n));return{legs:i}};return{name:`follow-target`,seconds:t.seconds,settleSeconds:t.settleSeconds,levels:t.cones.length,legSizes:t.legSizes,reachSizes:t.reachSizes,sampleTrials(e,t,i){let a=n(i.level);return Array.from({length:t},()=>r(e,a,Bt(e,a)))},examTrials(e,t){let i=new ce(1e3+t.level),a=n(t.level);return Array.from({length:e},(t,n)=>{let o=2*Math.PI*(n+.5)/e,s=1-(n%3+.5)/3*(1-Math.cos(a));return r(i,a,zt(Math.acos(s),o))})},score(e,n,r,i){if(!et(e,n))return 0;let a=e[n+d.TIME];if(a<=0)return 0;let o=e[n+d.TOWARD]/(a*r.size),s=e[n+d.WORK]/(a*r.mass*r.size*r.size),c=e[n+d.JOINT_SPEED]/a;return o-t.energyWeight*s-t.jointSpeedWeight*c},describeLevel:e=>`legs turn up to ${t.cones[Math.min(e,t.cones.length-1)]}°`}}var Ut=[28,190,330,95,260,48,160,5,215,125];function Wt(e,t,n){let r=t=>(t+e/30)%12,i=t*Math.min(n,1-n),a=e=>n-i*Math.max(-1,Math.min(r(e)-3,Math.min(9-r(e),1)));return[a(0),a(8),a(4)]}function Gt(e){let t=[];return e.body.parts.map((e,n)=>{t[n]=e.parent<0?0:t[e.parent]+1;let r=Ut[e.node%Ut.length],[i,a,o]=Wt(r,.62,Math.max(.38,.62-t[n]*.03));return[i*i,a*a,o*o]})}var Kt=.1,qt=Math.PI/2,Jt=class{canvas;renderer;backend;opts;camera=new It;paused=!1;speed=1;follow=!0;course=!0;target=[0,0,4];trail=[];trailClock=0;stepDebt=0;stepping=!1;lastFrame=0;startTime=performance.now();creature=null;raf=0;status={com:[0,0,0],vcom:[0,0,0],dist:0,time:0,alive:!0};reachRadius=.6;legLength=3;legFrom=[0,0,0];rng=new ce(Date.now()>>>0);reachedLatch=!1;appearance={};eyes=null;eyeData;suspended=!1;constructor(e,t,n,r){this.canvas=e,this.renderer=t,this.backend=n,this.opts=r,this.bindInput()}get backendKind(){return this.backend.kind}async setBackend(e){this.suspended||this.renderer.clearBodyState(),this.backend.dispose(),this.backend=e,this.creature&&await this.show(this.creature,!1)}async show(e,t=!0,n){this.creature=e,n&&(this.appearance=n);let r=Yt(e),i=Xe(e).size;this.reachRadius=Ze*i,this.legLength=3*i,t&&(this.camera.distance=Math.max(9,r*4.2),this.camera.focus=[0,0,0],this.target=this.randomTargetAround([0,0,0],Math.max(3,r*2.5))),this.suspended||(this.setBodies(),this.renderer.setEyes([]),this.renderer.clearBodyState()),this.eyes=null,await this.backend.load(e,this.target),await this.backend.advance(1),this.status=this.backend.status(),this.placeEyes(),this.trail=[],this.stepDebt=0,this.reachedLatch=!1,this.legFrom=this.status.com}setBodies(){let e=this.creature,t=Gt(e);this.renderer.setBodies(e.body.parts.map((e,n)=>({halfExtents:e.halfExtents,color:t[n]})))}suspend(){this.suspended=!0}resume(){this.suspended=!1,this.lastFrame=0,this.creature&&(this.setBodies(),this.placeEyes())}setAppearance(e){this.appearance=e,this.creature&&this.placeEyes()}eyeState(){let e=this.eyes;return e?{mood:e.mood,inView:e.inView,facingDeg:e.facingAngle*180/Math.PI,blinking:e.blinking,eyes:e.current(),world:e.world}:null}placeEyes(){let e=this.creature,t=this.appearance.look??he,n=kt(e,this.appearance.heading,t),r=Gt(e);this.suspended||this.renderer.setEyes(n.map(e=>({...e,lidColor:M(r[e.part],.8)}))),this.eyes=n.length>0?new Ke(e,n,this.appearance.heading):null,this.eyeData=void 0,this.animateEyes(0)}animateEyes(e){if(!this.eyes)return;let t=this.eyes.update(e,{poses:this.backend.poses(),target:this.target,com:this.status.com,time:this.status.time,alive:this.status.alive,paused:this.paused});this.eyeData=Oe(t,this.eyeData),this.suspended||this.renderer.setEyeState(this.eyeData)}async reset(){this.creature&&await this.show(this.creature,!1)}setTarget(e,t=this.status.com){this.target=e,this.legFrom=t,this.backend.setTarget(e),this.reachedLatch=!1}getTarget(){return this.target}getStatus(){return this.status}randomTarget(){let e=this.creature?Yt(this.creature):1;this.setTarget(this.randomTargetAround(this.status.com,Math.max(3,e*(2.5+Math.random()*1.5))))}nextCourseTarget(){let e=j(this.target,this.legFrom),t=F(e)>1e-6?I(e):[0,0,1],n=Vt(this.rng,t,qt),r=I([n[0],n[1]*.6,n[2]]);this.setTarget(A(this.target,M(r,this.legLength)),this.target)}randomTargetAround(e,t){let n=Math.random()*2-1,r=Math.random()*Math.PI*2,i=Math.sqrt(1-n*n)*.9;return A(e,M(I([i*Math.cos(r),n*.6,i*Math.sin(r)]),t))}start(){let e=t=>{this.raf=requestAnimationFrame(e),this.frame(t)};this.raf=requestAnimationFrame(e)}stop(){cancelAnimationFrame(this.raf)}async frame(e){if(this.suspended)return;let t=this.lastFrame?Math.min((e-this.lastFrame)/1e3,.1):0;if(this.lastFrame=e,!this.paused&&this.creature&&!this.stepping){this.stepDebt+=t*this.speed;let e=Math.min(Math.floor(this.stepDebt/this.opts.dt),8);if(e>0){this.stepDebt-=e*this.opts.dt,this.stepping=!0;try{await this.backend.advance(e)}finally{this.stepping=!1}this.status=this.backend.status(),this.trailClock+=e*this.opts.dt,this.trailClock>=Kt&&(this.trailClock=0,this.trail.push(this.status.com),this.trail.length>600&&this.trail.shift()),this.checkReached()}}if(this.animateEyes(t),this.follow){let e=1-Math.exp(-t*2.5);this.camera.focus=A(this.camera.focus,M(j(this.status.com,this.camera.focus),e))}this.draw(e),this.opts.onStatus?.({...this.status,target:this.target,speed:F(this.status.vcom)})}draw(e=performance.now()){this.resize(),this.backend.present(this.renderer),this.renderer.render({camera:this.camera,time:(e-this.startTime)/1e3,target:this.target,trail:this.trail})}capture(e,t){return this.backend.present(this.renderer),this.renderer.capture({camera:this.camera,time:(performance.now()-this.startTime)/1e3,target:this.target,trail:this.trail},e,t)}checkReached(){this.status.dist<this.reachRadius&&(this.reachedLatch||(this.reachedLatch=!0,this.eyes?.onReached(),this.opts.onTargetReached?.(),this.course&&this.nextCourseTarget()))}resize(){let e=Math.min(window.devicePixelRatio||1,2),t=Math.max(1,Math.round(this.canvas.clientWidth*e)),n=Math.max(1,Math.round(this.canvas.clientHeight*e));(this.canvas.width!==t||this.canvas.height!==n)&&(this.canvas.width=t,this.canvas.height=n)}ndc(e){let t=this.canvas.getBoundingClientRect();return[(e.clientX-t.left)/t.width*2-1,1-(e.clientY-t.top)/t.height*2]}pointOnViewPlane(e,t){let[n,r]=this.ndc(e),{origin:i,dir:a}=this.camera.ray(n,r),o=this.camera.forward,s=N(a,o);if(Math.abs(s)<1e-6)return null;let c=N(j(t,i),o)/s;return c>0?A(i,M(a,c)):null}nearTarget(e){let t=this.camera.project(this.target);if(t.w<=0)return!1;let n=this.canvas.getBoundingClientRect(),r=(t.x+1)/2*n.width+n.left,i=(1-t.y)/2*n.height+n.top;return Math.hypot(r-e.clientX,i-e.clientY)<24}bindInput(){let e=this.canvas,t=`none`,n=0,r=0,i=0,a=0,o=!1;e.addEventListener(`contextmenu`,e=>e.preventDefault()),e.addEventListener(`pointerdown`,s=>{this.suspended||(e.setPointerCapture(s.pointerId),n=i=s.clientX,r=a=s.clientY,o=!1,t=s.button===0&&this.nearTarget(s)?`target`:s.button===2||s.shiftKey?`pan`:`orbit`,e.classList.toggle(`dragging-target`,t===`target`))}),e.addEventListener(`pointermove`,s=>{if(t===`none`){e.classList.toggle(`over-target`,this.nearTarget(s));return}let c=s.clientX-i,l=s.clientY-a;if(i=s.clientX,a=s.clientY,Math.hypot(s.clientX-n,s.clientY-r)>4&&(o=!0),t===`orbit`)this.camera.orbit(c,l);else if(t===`pan`)this.follow=!1,this.camera.pan(c,l,e.clientHeight),e.dispatchEvent(new CustomEvent(`followchange`,{detail:!1}));else if(t===`target`){let e=this.pointOnViewPlane(s,this.target);e&&this.setTarget(e)}}),e.addEventListener(`pointerup`,n=>{if(t===`orbit`&&!o&&n.button===0){let e=this.pointOnViewPlane(n,this.status.com);e&&this.setTarget(e)}t=`none`,e.classList.remove(`dragging-target`)}),e.addEventListener(`pointercancel`,()=>{t=`none`,e.classList.remove(`dragging-target`)}),e.addEventListener(`wheel`,e=>{if(e.preventDefault(),t===`target`){let t=-Math.sign(e.deltaY)*Math.max(.15,this.camera.distance*.05);this.setTarget(A(this.target,M(this.camera.forward,t)))}else this.camera.zoom(Math.exp(e.deltaY*.001))},{passive:!1})}};function Yt(e){let t=0;for(let n of e.body.parts)t=Math.max(t,F(n.pos)+Math.max(...n.halfExtents));return Math.max(t,.3)}function Xt(e,t,n,r){let i=e=>r*e*Math.sqrt(e);return[i(4*t*n),i(4*e*n),i(4*e*t)]}function Zt(e,t,n,p=f){let m=e.length*r.WORDS;for(let t of e)m+=t.body.parts.length*i.WORDS,m+=t.body.joints.length*a.WORDS,m+=t.brain.neuronCount*o.WORDS,m+=t.brain.edgeSrc.length*s.WORDS;let h=new Uint32Array(m),g=new Float32Array(h.buffer),_=new Int32Array(h.buffer),v=e.length*r.WORDS;e.forEach((e,t)=>{let n=t*r.WORDS,{parts:c,joints:l}=e.body,u=e.brain;h[n+r.BODY_COUNT]=c.length,h[n+r.JOINT_COUNT]=l.length,h[n+r.NEURON_COUNT]=u.neuronCount,h[n+r.SENSOR_COUNT]=u.sensorCount,h[n+r.PARAM_COUNT]=u.paramCount,h[n+r.BODY_OFF]=v;let d=0;c.forEach((e,t)=>{let n=v+t*i.WORDS,[r,a,o]=e.halfExtents,s=8*r*a*o;d+=s;let[c,l,f]=Xt(r,a,o,p.addedMass);g[n+i.HALF]=r,g[n+i.HALF+1]=a,g[n+i.HALF+2]=o,g[n+i.MASS]=s;let m=1/(s+(c+l+f)/3);g[n+i.INV_MASS]=m,g[n+i.INV_MASS+1]=m,g[n+i.INV_MASS+2]=m,g[n+i.INV_INERTIA]=3/(s*(a*a+o*o)+l*o*o+f*a*a),g[n+i.INV_INERTIA+1]=3/(s*(r*r+o*o)+c*o*o+f*r*r),g[n+i.INV_INERTIA+2]=3/(s*(r*r+a*a)+c*a*a+l*r*r),h[n+i.SENSOR_BASE]=u.partSensorBase[t],g.set(e.pos,n+i.POS),h[n+i.MIRRORED]=+!!e.mirrored,g.set(e.rot,n+i.ROT)}),v+=c.length*i.WORDS,g[n+r.TOTAL_MASS]=d,h[n+r.JOINT_OFF]=v,l.forEach((e,t)=>{let n=v+t*a.WORDS,r=ue[e.type];h[n+a.PARENT]=e.parent,h[n+a.CHILD]=e.child,h[n+a.TYPE]=de(e.type),h[n+a.DOF]=r,g.set(e.anchorParent,n+a.ANCHOR_P),g[n+a.MAX_TORQUE]=e.maxTorque,g.set(e.anchorChild,n+a.ANCHOR_C),h[n+a.SENSOR_BASE]=u.partSensorBase[e.child]+3,g.set(e.restRot,n+a.REST_ROT),g.set(e.limits,n+a.LIMITS),h[n+a.MIRRORED]=+(e.axisSign[1]<0);for(let e=0;e<3;e++)_[n+a.EFFECTOR+e]=u.effector[t*3+e]}),v+=l.length*a.WORDS,h[n+r.NEURON_OFF]=v;for(let e=0;e<u.neuronCount;e++){let t=v+e*o.WORDS;h[t+o.KIND_ACT]=u.kind[e]|u.act[e]<<8,h[t+o.PARAM_BASE]=u.paramBase[e],h[t+o.EDGE_START]=u.edgeStart[e],h[t+o.EDGE_COUNT]=u.edgeCount[e]}v+=u.neuronCount*o.WORDS,h[n+r.EDGE_OFF]=v;for(let e=0;e<u.edgeSrc.length;e++)h[v+e*s.WORDS+s.SRC]=u.edgeSrc[e],h[v+e*s.WORDS+s.PARAM]=u.edgeParam[e];v+=u.edgeSrc.length*s.WORDS});let y=[],b=0;for(let n of t){let t=e[n.structure].brain.paramCount;if(n.params.length!==t)throw Error(`param set length ${n.params.length} does not match structure (${t})`);y.push(b),b+=n.params.length}let x=new Float32Array(Math.max(b,1));t.forEach((e,t)=>x.set(Array.from(e.params),y[t]));let S=new Uint32Array(n.length*c.WORDS),C=new Float32Array(S.buffer),w=new Uint32Array(n.length),T=0,E=0,D=0;return n.forEach((n,r)=>{let i=r*c.WORDS,a=t[n.paramSet],o=e[a.structure];S[i+c.STRUCT]=a.structure,S[i+c.PARAM_OFF]=y[n.paramSet],S[i+c.BODY_STATE_OFF]=T,S[i+c.BRAIN_OFF]=E;let s=n.targets.length;if(s<1||s>16)throw Error(`instance ${r}: ${s} targets (1..16)`);n.targets.forEach((e,t)=>C.set(e,i+c.TARGETS+4*t)),S[i+c.TARGET_COUNT]=s,C[i+c.REACH]=n.reach??0,S[i+c.SETTLE_STEPS]=n.settleSteps??0,C.set(n.startPos??[0,0,0],i+c.START_POS),C.set(n.startRot??[0,0,0,1],i+c.START_ROT);let d=o.body.parts.length;w[r]=d,D=Math.max(D,d),T+=d*l.WORDS,E+=u(o.brain.sensorCount,o.brain.neuronCount)}),{statics:h,params:x,instances:S,structCount:e.length,instanceCount:n.length,instanceBodies:w,bodyStateWords:T,brainStateWords:Math.max(E,1),metricsWords:n.length*d.WORDS,maxBodies:D}}function Qt(e){let{statics:t,instances:n}=e,a=new Float32Array(t.buffer),o=new Float32Array(n.buffer),s=new Float32Array(Math.max(e.bodyStateWords,1)),u=new Float32Array(e.brainStateWords),f=new Float32Array(Math.max(e.metricsWords,1));for(let u=0;u<e.instanceCount;u++){let e=u*c.WORDS,p=n[e+c.STRUCT]*r.WORDS,m=t[p+r.BODY_OFF],h=Array.from(o.subarray(e+c.START_POS,e+c.START_POS+3)),g=Array.from(o.subarray(e+c.START_ROT,e+c.START_ROT+4)),_=n[e+c.BODY_STATE_OFF];for(let e=0;e<t[p+r.BODY_COUNT];e++){let t=m+e*i.WORDS,n=Array.from(a.subarray(t+i.POS,t+i.POS+3)),r=Array.from(a.subarray(t+i.ROT,t+i.ROT+4)),o=A(h,z(g,n)),c=L(g,r),u=_+e*l.WORDS;s.set(o,u+l.X),s.set(c,u+l.Q),s.set(o,u+l.XP),s.set(c,u+l.QP)}f[u*d.WORDS+d.ALIVE]=1,f[u*d.WORDS+d.MIN_DIST]=1e9}return{bodyState:s,brainState:u,metrics:f}}var $t=t({ACTIVATIONS:()=>en,ACTIVATION_NAMES:()=>tn,FREQ_MAX:()=>ln,FREQ_MIN:()=>cn,NEURON_KINDS:()=>an,TAU_MAX:()=>4,TAU_MIN:()=>sn,WEIGHT_MAX:()=>8,activationId:()=>rn,freqFromRaw:()=>fn,neuronKindCode:()=>on,tauFromRaw:()=>dn}),en=[{id:0,name:`tanh`,fn:Math.tanh,wgsl:`tanh(clamp(x, -20.0, 20.0))`},{id:1,name:`sin`,fn:Math.sin,wgsl:`sin(x)`},{id:2,name:`linear`,fn:e=>e<-1?-1:e>1?1:e,wgsl:`clamp(x, -1.0, 1.0)`},{id:3,name:`abs`,fn:e=>Math.min(Math.abs(e),1),wgsl:`min(abs(x), 1.0)`},{id:4,name:`step`,fn:e=>+(e>0),wgsl:`select(0.0, 1.0, x > 0.0)`},{id:5,name:`gaussian`,fn:e=>Math.exp(-e*e),wgsl:`exp(-x * x)`}],tn=en.map(e=>e.name),nn=new Map(en.map(e=>[e.name,e])),rn=e=>nn.get(e).id,an=[`ctrnn`,`osc`,`instant`],on=e=>an.indexOf(e),sn=.1,cn=.05,ln=1.5,un=e=>1/(1+Math.exp(-e)),dn=e=>sn+3.9*un(e),fn=e=>cn+1.45*un(e),{freqFromRaw:pn,tauFromRaw:mn,WEIGHT_MAX:hn}=$t,{B,BS:V,DEATH_ENERGY:gn,DEATH_NAN:_n,DEATH_SPEED:vn,E:yn,I:bn,J:H,M:U,N:xn,S:Sn}=n,W={nb:0,nj:0,bodyOff:0,jointOff:0,neuronCount:0,neuronOff:0,edgeOff:0,sensorCount:0,totalMass:0,pOff:0,bsOff:0,brOff:0,mo:0,tx:0,ty:0,tz:0},Cn=en.map(e=>e.fn),wn=Math.PI*2,G=new Float64Array(3),Tn=new Float64Array(4),En=new Float64Array(4),K=new Float64Array(3),q=new Float64Array(9),Dn=(e,t)=>e===2?2:t,On=[0,1,4,3,7];function kn(e,t,n,r,i){let a=e[t],o=e[t+1],s=e[t+2],c=e[t+3],l=2*(o*i-s*r),u=2*(s*n-a*i),d=2*(a*r-o*n);G[0]=n+c*l+(o*d-s*u),G[1]=r+c*u+(s*l-a*d),G[2]=i+c*d+(a*u-o*l)}function An(e,t,n,r,i){let a=-e[t],o=-e[t+1],s=-e[t+2],c=e[t+3],l=2*(o*i-s*r),u=2*(s*n-a*i),d=2*(a*r-o*n);G[0]=n+c*l+(o*d-s*u),G[1]=r+c*u+(s*l-a*d),G[2]=i+c*d+(a*u-o*l)}function J(e,t,n,r,i,a){let{bs:o,sf:s}=e;An(o,t+V.Q,r,i,a);let c=G[0]*s[n+B.INV_INERTIA],l=G[1]*s[n+B.INV_INERTIA+1],u=G[2]*s[n+B.INV_INERTIA+2];kn(o,t+V.Q,c,l,u)}function jn(e,t,n,r,i,a){let{bs:o,sf:s}=e;An(o,t+V.Q,r,i,a);let c=G[0]*s[n+B.INV_MASS],l=G[1]*s[n+B.INV_MASS+1],u=G[2]*s[n+B.INV_MASS+2];kn(o,t+V.Q,c,l,u)}function Mn(e,t,n,r,i){let a=e[t],o=e[t+1],s=e[t+2],c=e[t+3],l=a+.5*(n*c+r*s-i*o),u=o+.5*(-n*s+r*c+i*a),d=s+.5*(n*o-r*a+i*c),f=c+.5*(-n*a-r*o-i*s),p=1/Math.sqrt(l*l+u*u+d*d+f*f);e[t]=l*p,e[t+1]=u*p,e[t+2]=d*p,e[t+3]=f*p}function Nn(e,t,n,r,i){let a=e[t],o=e[t+1],s=e[t+2],c=e[t+3],l=n[r],u=n[r+1],d=n[r+2],f=n[r+3];i[0]=c*l+a*f+o*d-s*u,i[1]=c*u-a*d+o*f+s*l,i[2]=c*d+a*u-o*l+s*f,i[3]=c*f-a*l-o*u-s*d}var Pn=!1,Y=new Float64Array(448);function Fn(){Pn=!0,Y.length<W.nb*7&&(Y=new Float64Array(W.nb*7)),Y.fill(0,0,W.nb*7)}function In(e){Pn=!1;let{bs:t}=e;for(let e=0;e<W.nb;e++){let n=e*7,r=Y[n+6];if(r===0)continue;let i=1/r,a=W.bsOff+e*V.WORDS;t[a+V.X]=t[a+V.X]+Y[n]*i,t[a+V.X+1]=t[a+V.X+1]+Y[n+1]*i,t[a+V.X+2]=t[a+V.X+2]+Y[n+2]*i,Mn(t,a+V.Q,Y[n+3]*i,Y[n+4]*i,Y[n+5]*i)}}function Ln(e,t,n,r,i){if(Pn){let e=(t-W.bsOff)/V.WORDS*7;Y[e]=Y[e]+n,Y[e+1]=Y[e+1]+r,Y[e+2]=Y[e+2]+i;return}e[t+V.X]=e[t+V.X]+n,e[t+V.X+1]=e[t+V.X+1]+r,e[t+V.X+2]=e[t+V.X+2]+i}function Rn(e,t,n,r,i,a){if(Pn){let e=(t-W.bsOff)/V.WORDS*7;Y[e+3]=Y[e+3]+n,Y[e+4]=Y[e+4]+r,Y[e+5]=Y[e+5]+i,a&&(Y[e+6]=Y[e+6]+1);return}Mn(e,t+V.Q,n,r,i)}function zn(e,t){let{statics:n,sf:r,bs:i}=e,a=W.bsOff+n[t+H.PARENT]*V.WORDS,o=W.bsOff+n[t+H.CHILD]*V.WORDS;Nn(i,a+V.Q,r,t+H.REST_ROT,Tn);let s=-Tn[0],c=-Tn[1],l=-Tn[2],u=Tn[3],d=i[o+V.Q],f=i[o+V.Q+1],p=i[o+V.Q+2],m=i[o+V.Q+3],h=u*d+s*m+c*p-l*f,g=u*f-s*p+c*m+l*d,_=u*p+s*f-c*d+l*m,v=u*m-s*d-c*f-l*p;v<0&&(h=-h,g=-g,_=-_,v=-v),En[0]=h,En[1]=g,En[2]=_,En[3]=v;let y=Math.sqrt(_*_+v*v),b=0,x=h,S=g,C=y;if(y>1e-9){let e=_/y,t=v/y;b=2*Math.atan2(_,v),x=h*t-g*e,S=h*e+g*t}else C=0;let w=Math.sqrt(x*x+S*S),T=w>1e-9?2*Math.atan2(w,C)/w:2/Math.max(C,1e-9);K[0]=x*T,K[1]=S*T,K[2]=b}function Bn(e,t,n,r,i,a,o,s,c,l,u){let{bs:d}=e;J(e,r,i,a,o,s);let f=G[0],p=G[1],m=G[2],h=a*f+o*p+s*m;J(e,t,n,a,o,s);let g=G[0],_=G[1],v=G[2],y=c/(h+(a*g+o*_+s*v)+l);return y>u?y=u:y<-u&&(y=-u),Rn(d,r,f*y,p*y,m*y,!0),Rn(d,t,-g*y,-_*y,-v*y,!0),y}function Vn(e,t,n,r,i,a){let{bs:o,sf:s}=e;kn(o,n+V.Q,s[t+H.ANCHOR_P],s[t+H.ANCHOR_P+1],s[t+H.ANCHOR_P+2]);let c=G[0],l=G[1],u=G[2];kn(o,i+V.Q,s[t+H.ANCHOR_C],s[t+H.ANCHOR_C+1],s[t+H.ANCHOR_C+2]);let d=G[0],f=G[1],p=G[2],m=o[i+V.X]+d-(o[n+V.X]+c),h=o[i+V.X+1]+f-(o[n+V.X+1]+l),g=o[i+V.X+2]+p-(o[n+V.X+2]+u),_=Math.sqrt(m*m+h*h+g*g);if(_<1e-9)return;m/=_,h/=_,g/=_,jn(e,i,a,m,h,g);let v=G[0],y=G[1],b=G[2];jn(e,n,r,m,h,g);let x=G[0],S=G[1],C=G[2],w=f*g-p*h,T=p*m-d*g,E=d*h-f*m;J(e,i,a,w,T,E);let D=m*v+h*y+g*b+w*G[0]+T*G[1]+E*G[2];w=l*g-u*h,T=u*m-c*g,E=c*h-l*m,J(e,n,r,w,T,E);let O=m*x+h*S+g*C+w*G[0]+T*G[1]+E*G[2],k=-_/(D+O),A=m*k,j=h*k,M=g*k;Ln(o,i,v*k,y*k,b*k),Ln(o,n,-x*k,-S*k,-C*k),J(e,i,a,f*M-p*j,p*A-d*M,d*j-f*A),Rn(o,i,G[0],G[1],G[2],!0),J(e,n,r,l*M-u*j,u*A-c*M,c*j-l*A),Rn(o,n,-G[0],-G[1],-G[2],!0)}function Hn(){for(let e=0;e<3;e++)kn(Tn,0,+(e===0),+(e===1),+(e===2)),q[e*3]=G[0],q[e*3+1]=G[1],q[e*3+2]=G[2]}function Un(e,t,n,r){let i=Math.sqrt(e*e+t*t),a=0,o=0,s=1;if(i>1e-12){let n=Math.sin(i/2)/i;a=e*n,o=t*n,s=Math.cos(i/2)}let c=Math.sin(n/2),l=Math.cos(n/2);r[0]=a*l+o*c,r[1]=o*l-a*c,r[2]=s*c,r[3]=s*l}var Wn=new Float64Array(4),X=new Float64Array(192),Z=new Float64Array(192);function Gn(e,t){let{statics:n}=e,r=W.jointOff+t*H.WORDS,i=n[r+H.PARENT],a=n[r+H.CHILD];Vn(e,r,W.bsOff+i*V.WORDS,W.bodyOff+i*B.WORDS,W.bsOff+a*V.WORDS,W.bodyOff+a*B.WORDS)}function Kn(e,t){let{statics:n,sf:r,si:i,br:a,cfg:o,bs:s}=e;X.length<W.nb*3&&(X=new Float64Array(W.nb*3)),Z.length<W.nj*3&&(Z=new Float64Array(W.nj*3)),X.fill(0,0,W.nb*3),Z.fill(0,0,W.nj*3);let c=o.maxJointSpeed>0&&o.maxJointSpeed<1/0?1/o.maxJointSpeed:0;for(let l=0;l<W.nj;l++){let u=W.jointOff+l*H.WORDS,d=n[u+H.DOF],f=r[u+H.MAX_TORQUE];if(d===0||f<=0)continue;let p=n[u+H.PARENT],m=n[u+H.CHILD],h=W.bsOff+p*V.WORDS,g=W.bsOff+m*V.WORDS,_=W.bodyOff+p*B.WORDS,v=W.bodyOff+m*B.WORDS,y=n[u+H.TYPE],b=n[u+H.MIRRORED]===1,x=f*t*t;zn(e,u),Hn();for(let n=0;n<d;n++){let d=i[u+H.EFFECTOR+n];if(d<0)continue;let S=Dn(y,n),C=b&&S>0?-1:1,w=r[u+H.LIMITS+n],T=C*a[W.brOff+W.sensorCount+d]*w,E=w/(o.servoKp*f*t*t),D=q[S*3],O=q[S*3+1],k=q[S*3+2];J(e,g,v,D,O,k);let A=G[0],j=G[1],M=G[2];J(e,h,_,D,O,k);let N=G[0],P=G[1],F=G[2],I=D*(A+N)+O*(j+P)+k*(M+F),L=(T-K[S])/(I+E),ee=D*(s[g+V.W]-s[h+V.W])+O*(s[g+V.W+1]-s[h+V.W+1])+k*(s[g+V.W+2]-s[h+V.W+2]),te=1-(L>=0?ee:-ee)*c,R=x*(te<0?0:te>1?1:te);L>R?L=R:L<-R&&(L=-R),X[m*3]=X[m*3]+A*L,X[m*3+1]=X[m*3+1]+j*L,X[m*3+2]=X[m*3+2]+M*L,X[p*3]=X[p*3]-N*L,X[p*3+1]=X[p*3+1]-P*L,X[p*3+2]=X[p*3+2]-F*L,Z[l*3]=Z[l*3]+D*L,Z[l*3+1]=Z[l*3+1]+O*L,Z[l*3+2]=Z[l*3+2]+k*L}}for(let t=0;t<W.nb;t++){let n=X[t*3],r=X[t*3+1],i=X[t*3+2];(n!==0||r!==0||i!==0)&&Mn(e.bs,W.bsOff+t*V.WORDS+V.Q,n,r,i)}}function qn(e,t){let{statics:n,bs:r}=e,i=0,a=0,o=0,s=1/(t*t);for(let e=0;e<W.nj;e++){let t=W.jointOff+e*H.WORDS;if(n[t+H.DOF]===0)continue;let c=W.bsOff+n[t+H.PARENT]*V.WORDS,l=W.bsOff+n[t+H.CHILD]*V.WORDS,u=r[l+V.W]-r[c+V.W],d=r[l+V.W+1]-r[c+V.W+1],f=r[l+V.W+2]-r[c+V.W+2];a+=Math.sqrt(u*u+d*d+f*f),o++;let p=Z[e*3],m=Z[e*3+1],h=Z[e*3+2];(p!==0||m!==0||h!==0)&&(i+=Math.abs(p*u+m*d+h*f)*s)}ar.w+=i*t,o>0&&(ar.s+=a/o*t)}function Jn(e,t){let{statics:n,sf:r}=e,i=W.jointOff+t*H.WORDS,a=n[i+H.PARENT],o=n[i+H.CHILD],s=W.bsOff+a*V.WORDS,c=W.bsOff+o*V.WORDS,l=W.bodyOff+a*B.WORDS,u=W.bodyOff+o*B.WORDS,d=n[i+H.TYPE];zn(e,i);let f=On[d],p=0,m=0,h=0;if(f&1){let e=r[i+H.LIMITS+0];p=Math.min(e,Math.max(-e,K[0]))}if(f&2){let e=r[i+H.LIMITS+1];m=Math.min(e,Math.max(-e,K[1]))}if(f&4){let e=r[i+H.LIMITS+(d===2?0:2)];h=Math.min(e,Math.max(-e,K[2]))}if(Math.abs(p-K[0])+Math.abs(m-K[1])+Math.abs(h-K[2])<1e-7)return;Un(p,m,h,Wn);let g=Wn[0],_=Wn[1],v=Wn[2],y=Wn[3],b=-En[0],x=-En[1],S=-En[2],C=En[3],w=y*b+g*C+_*S-v*x,T=y*x-g*S+_*C+v*b,E=y*S+g*x-_*b+v*C,D=y*C-g*b-_*x-v*S;D<0&&(w=-w,T=-T,E=-E);let O=Math.sqrt(w*w+T*T+E*E);if(O<1e-12)return;let k=2*Math.atan2(O,Math.abs(D));kn(Tn,0,w/O,T/O,E/O),Bn(e,s,l,c,u,G[0],G[1],G[2],k,0,1/0)}function Yn(e,t){let{statics:n,sf:r,inst:i,instF:a}=e,o=t*bn.WORDS,s=i[o+bn.STRUCT]*Sn.WORDS;W.nb=n[s+Sn.BODY_COUNT],W.nj=n[s+Sn.JOINT_COUNT],W.bodyOff=n[s+Sn.BODY_OFF],W.jointOff=n[s+Sn.JOINT_OFF],W.neuronCount=n[s+Sn.NEURON_COUNT],W.neuronOff=n[s+Sn.NEURON_OFF],W.edgeOff=n[s+Sn.EDGE_OFF],W.sensorCount=n[s+Sn.SENSOR_COUNT],W.totalMass=r[s+Sn.TOTAL_MASS],W.pOff=i[o+bn.PARAM_OFF],W.bsOff=i[o+bn.BODY_STATE_OFF],W.brOff=i[o+bn.BRAIN_OFF],W.mo=t*U.WORDS;let c=i[o+bn.TARGET_COUNT]-1,l=e.met[W.mo+U.GOALS],u=o+bn.TARGETS+4*(l<c?l:c);W.tx=a[u],W.ty=a[u+1],W.tz=a[u+2]}var Xn=(e,t)=>e>t?t:e<-t?-t:e,Q=new Float64Array(6);function Zn(e){let{bs:t,sf:n}=e;Q.fill(0);for(let e=0;e<W.nb;e++){let r=W.bsOff+e*V.WORDS,i=n[W.bodyOff+e*B.WORDS+B.MASS];for(let e=0;e<3;e++)Q[e]=Q[e]+i*t[r+V.X+e],Q[3+e]=Q[3+e]+i*t[r+V.V+e]}for(let e=0;e<6;e++)Q[e]=Q[e]/W.totalMass}function Qn(e){let{statics:t,sf:n,bs:r,br:i}=e,a=W.brOff,o=W.bsOff;An(r,o+V.Q,r[o+V.V],r[o+V.V+1],r[o+V.V+2]),i[a]=Xn(G[0],5),i[a+1]=Xn(G[1],5),i[a+2]=Xn(G[2],5),An(r,o+V.Q,r[o+V.W],r[o+V.W+1],r[o+V.W+2]),i[a+3]=Xn(G[0]*.25,5),i[a+4]=Xn(G[1]*.25,5),i[a+5]=Xn(G[2]*.25,5),Zn(e);let s=W.tx-Q[0],c=W.ty-Q[1],l=W.tz-Q[2],u=Math.sqrt(s*s+c*c+l*l);i[a+6]=u/(1+u);for(let e=0;e<W.nb;e++){let n=W.bsOff+e*V.WORDS,o=W.bodyOff+e*B.WORDS,s=W.tx-r[n+V.X],c=W.ty-r[n+V.X+1],l=W.tz-r[n+V.X+2],u=Math.sqrt(s*s+c*c+l*l);u>1e-9&&(s/=u,c/=u,l/=u),An(r,n+V.Q,s,c,l);let d=a+t[o+B.SENSOR_BASE];i[d]=t[o+B.MIRRORED]?-G[0]:G[0],i[d+1]=G[1],i[d+2]=G[2]}for(let o=0;o<W.nj;o++){let s=W.jointOff+o*H.WORDS,c=t[s+H.DOF];if(c===0)continue;let l=t[s+H.TYPE],u=t[s+H.MIRRORED]===1;zn(e,s);let d=W.bsOff+t[s+H.PARENT]*V.WORDS,f=W.bsOff+t[s+H.CHILD]*V.WORDS;An(Tn,0,r[f+V.W]-r[d+V.W],r[f+V.W+1]-r[d+V.W+1],r[f+V.W+2]-r[d+V.W+2]);let p=a+t[s+H.SENSOR_BASE];for(let e=0;e<c;e++){let t=Dn(l,e),r=u&&t>0?-1:1;i[p+e]=Xn(r*K[t]/n[s+H.LIMITS+e],1.5),i[p+c+e]=Xn(r*G[t]*.25,3)}}}function $n(e,t){let{statics:n,params:r,br:i}=e,a=W.sensorCount,o=W.neuronCount,s=W.brOff,c=W.brOff+a+o,l=c+o,u=W.pOff;for(let e=0;e<o;e++){let a=W.neuronOff+e*xn.WORDS,o=n[a+xn.KIND_ACT],d=o&255,f=o>>8,p=u+n[a+xn.PARAM_BASE],m=r[p],h=W.edgeOff+n[a+xn.EDGE_START]*yn.WORDS,g=n[a+xn.EDGE_COUNT];for(let e=0;e<g;e++){let t=h+e*yn.WORDS,a=r[u+n[t+yn.PARAM]];a=a>hn?hn:a<-hn?-hn:a,m+=a*i[s+n[t+yn.SRC]]}let _;if(d===0){let n=i[c+e]+t/mn(r[p+1])*(m-i[c+e]);i[c+e]=n,_=Cn[f](n)}else if(d===1){let n=i[c+e]+t*wn*pn(r[p+1])*(1+.5*Math.tanh(m));n>wn&&(n-=wn),i[c+e]=n,_=Math.sin(n+r[p+2])}else _=Cn[f](m);i[l+e]=_}for(let e=0;e<o;e++)i[s+a+e]=i[l+e]}function er(e,t){let{bs:n,sf:r,cfg:i}=e,a=i.dragLinear,o=i.dragQuad;for(let i=0;i<W.nb;i++){let s=W.bsOff+i*V.WORDS,c=W.bodyOff+i*B.WORDS,l=[r[c+B.HALF],r[c+B.HALF+1],r[c+B.HALF+2]];for(let e=0;e<3;e++)kn(n,s+V.Q,+(e===0),+(e===1),+(e===2)),q[e*3]=G[0],q[e*3+1]=G[1],q[e*3+2]=G[2];let u=n[s+V.V],d=n[s+V.V+1],f=n[s+V.V+2],p=n[s+V.W],m=n[s+V.W+1],h=n[s+V.W+2],g=0,_=0,v=0,y=0,b=0,x=0,S=0;for(let t=0;t<3;t++){let n=(t+1)%3,i=(t+2)%3,C=l[n]*l[i];for(let w=-1;w<=1;w+=2){let T=w*q[t*3],E=w*q[t*3+1],D=w*q[t*3+2],O=r[c+B.INV_MASS+t];for(let r=-1;r<=1;r+=2)for(let k=-1;k<=1;k+=2){let A=w*l[t],j=.5*r*l[n],M=.5*k*l[i],N=q[t*3]*A+q[n*3]*j+q[i*3]*M,P=q[t*3+1]*A+q[n*3+1]*j+q[i*3+1]*M,F=q[t*3+2]*A+q[n*3+2]*j+q[i*3+2]*M,I=u+m*F-h*P,L=d+h*N-p*F,ee=f+p*P-m*N,te=I*T+L*E+ee*D;if(te<=0)continue;let R=(a+o*te)*te*C,ne=-R*T,z=-R*E,re=-R*D;g+=ne,_+=z,v+=re,y+=P*re-F*z,b+=F*ne-N*re,x+=N*z-P*ne;let ie=P*D-F*E,ae=F*T-N*D,oe=N*E-P*T;J(e,s,c,ie,ae,oe);let se=O+ie*G[0]+ae*G[1]+oe*G[2];S+=(a+2*o*te)*C*se}}}let C=S*t>1?1/(S*t):1;n[s+V.F]=g*C,n[s+V.F+1]=_*C,n[s+V.F+2]=v*C,n[s+V.T]=y*C,n[s+V.T+1]=b*C,n[s+V.T+2]=x*C}}function tr(e,t){let{bs:n,sf:r}=e;for(let i=0;i<W.nb;i++){let a=W.bsOff+i*V.WORDS,o=W.bodyOff+i*B.WORDS;jn(e,a,o,n[a+V.F],n[a+V.F+1],n[a+V.F+2]);for(let e=0;e<3;e++)n[a+V.V+e]=n[a+V.V+e]+t*G[e],n[a+V.XP+e]=n[a+V.X+e],n[a+V.X+e]=n[a+V.X+e]+t*n[a+V.V+e];let s=r[o+B.INV_INERTIA],c=r[o+B.INV_INERTIA+1],l=r[o+B.INV_INERTIA+2];An(n,a+V.Q,n[a+V.W],n[a+V.W+1],n[a+V.W+2]);let u=G[0],d=G[1],f=G[2];An(n,a+V.Q,n[a+V.T],n[a+V.T+1],n[a+V.T+2]);let p=u/s,m=d/c,h=f/l,g=G[0]-(d*h-f*m),_=G[1]-(f*p-u*h),v=G[2]-(u*m-d*p);u+=t*s*g,d+=t*c*_,f+=t*l*v,kn(n,a+V.Q,u,d,f),n[a+V.W]=G[0],n[a+V.W+1]=G[1],n[a+V.W+2]=G[2];for(let e=0;e<4;e++)n[a+V.QP+e]=n[a+V.Q+e];Mn(n,a+V.Q,t*G[0],t*G[1],t*G[2])}}function nr(e,t){let{bs:n}=e,r=e.cfg.angularClamp*e.cfg.angularClamp;for(let e=0;e<W.nb;e++){let i=W.bsOff+e*V.WORDS;for(let e=0;e<3;e++)n[i+V.V+e]=(n[i+V.X+e]-n[i+V.XP+e])/t;let a=n[i+V.Q],o=n[i+V.Q+1],s=n[i+V.Q+2],c=n[i+V.Q+3],l=-n[i+V.QP],u=-n[i+V.QP+1],d=-n[i+V.QP+2],f=n[i+V.QP+3],p=c*l+a*f+o*d-s*u,m=c*u-a*d+o*f+s*l,h=c*d+a*u-o*l+s*f,g=c*f-a*l-o*u-s*d>=0?2/t:-2/t,_=(p*p+m*m+h*h)*g*g;_>r&&(g*=Math.sqrt(r/_)),n[i+V.W]=p*g,n[i+V.W+1]=m*g,n[i+V.W+2]=h*g}}function rr(e,t){let{statics:n,bs:r,cfg:i}=e,a=Math.min(i.jointDamping*t,1);if(!(a<=0)){Y.length<W.nb*7&&(Y=new Float64Array(W.nb*7)),Y.fill(0,0,W.nb*7);for(let t=0;t<W.nj;t++){let i=W.jointOff+t*H.WORDS,o=n[i+H.PARENT],s=n[i+H.CHILD],c=W.bsOff+o*V.WORDS,l=W.bsOff+s*V.WORDS,u=W.bodyOff+o*B.WORDS,d=W.bodyOff+s*B.WORDS,f=r[l+V.W]-r[c+V.W],p=r[l+V.W+1]-r[c+V.W+1],m=r[l+V.W+2]-r[c+V.W+2],h=Math.sqrt(f*f+p*p+m*m);if(h<1e-9)continue;let g=f/h,_=p/h,v=m/h;J(e,l,d,g,_,v);let y=G[0],b=G[1],x=G[2],S=g*y+_*b+v*x;J(e,c,u,g,_,v);let C=G[0],w=G[1],T=G[2],E=g*C+_*w+v*T,D=h*a/(S+E),O=s*7,k=o*7;Y[O]=Y[O]-y*D,Y[O+1]=Y[O+1]-b*D,Y[O+2]=Y[O+2]-x*D,Y[O+6]=Y[O+6]+1,Y[k]=Y[k]+C*D,Y[k+1]=Y[k+1]+w*D,Y[k+2]=Y[k+2]+T*D,Y[k+6]=Y[k+6]+1}for(let e=0;e<W.nb;e++){let t=e*7,n=Y[t+6];if(n===0)continue;let i=W.bsOff+e*V.WORDS;r[i+V.W]=r[i+V.W]+Y[t]/n,r[i+V.W+1]=r[i+V.W+1]+Y[t+1]/n,r[i+V.W+2]=r[i+V.W+2]+Y[t+2]/n}}}function ir(e,t){let{bs:n,sf:r,inst:i,instF:a,met:o,cfg:s}=e,c=W.mo,l=t*bn.WORDS;Zn(e);let u=0,d=0,f=s.maxSpeed*s.maxSpeed,p=s.maxAngSpeed*s.maxAngSpeed;for(let e=0;e<W.nb;e++){let t=W.bsOff+e*V.WORDS,i=W.bodyOff+e*B.WORDS,a=n[t+V.V],o=n[t+V.V+1],s=n[t+V.V+2],c=a*a+o*o+s*s;An(n,t+V.Q,a,o,s),u+=.5*(G[0]*G[0]/r[i+B.INV_MASS]+G[1]*G[1]/r[i+B.INV_MASS+1]+G[2]*G[2]/r[i+B.INV_MASS+2]),An(n,t+V.Q,n[t+V.W],n[t+V.W+1],n[t+V.W+2]);let l=G[0]*G[0]+G[1]*G[1]+G[2]*G[2];u+=.5*(G[0]*G[0]/r[i+B.INV_INERTIA]+G[1]*G[1]/r[i+B.INV_INERTIA+1]+G[2]*G[2]/r[i+B.INV_INERTIA+2]),c<=f&&l<=p||(d=c!==c||l!==l?_n:vn)}(u!==u||Q[0]!==Q[0])&&(d=_n),!d&&u>s.energyFactor*o[c+U.WORK]+s.energySlack*W.totalMass&&(d=gn);let m=o[c+U.STEP];if(o[c+U.STEP]=m+1,d){o[c+U.ALIVE]=0,o[c+U.DEATH]=d;return}o[c+U.KE]=u;let h=W.tx-Q[0],g=W.ty-Q[1],_=W.tz-Q[2],v=Math.sqrt(h*h+g*g+_*_);o[c+U.DIST]=v;for(let e=0;e<3;e++)o[c+U.COM+e]=Q[e],o[c+U.VCOM+e]=Q[3+e];let y=i[l+bn.SETTLE_STEPS];if(m===y){for(let e=0;e<3;e++)o[c+U.COM0+e]=Q[e];o[c+U.DIST0]=v}if(m>=y){let e=s.dt,t=v>1e-6?(Q[3]*h+Q[4]*g+Q[5]*_)/v:0;o[c+U.TOWARD]=o[c+U.TOWARD]+t*e,o[c+U.TIME]=o[c+U.TIME]+e,o[c+U.SPEED]=o[c+U.SPEED]+Math.sqrt(Q[3]**2+Q[4]**2+Q[5]**2)*e,v<o[c+U.MIN_DIST]&&(o[c+U.MIN_DIST]=v);let n=o[c+U.GOALS];v<a[l+bn.REACH]&&n<i[l+bn.TARGET_COUNT]&&(o[c+U.GOALS]=n+1,o[c+U.MIN_DIST]=1e9)}}var ar={w:0,s:0};function or(e,t){if(e.met[t*U.WORDS+U.ALIVE]===0)return;Yn(e,t);let{cfg:n}=e;Qn(e);let r=n.dt/n.brainTicks;for(let t=0;t<n.brainTicks;t++)$n(e,r);let i=n.dt/n.substeps,a=Math.max(1,n.dragEvery);ar.w=0,ar.s=0;for(let t=0;t<n.substeps;t++){t%a===0&&er(e,i*a),tr(e,i),Fn();for(let t=0;t<W.nj;t++)Gn(e,t);In(e),Kn(e,i),Fn();for(let t=0;t<W.nj;t++)Jn(e,t);In(e),nr(e,i),qn(e,i),rr(e,i)}e.met[W.mo+U.WORK]=e.met[W.mo+U.WORK]+ar.w,e.met[W.mo+U.JOINT_SPEED]=e.met[W.mo+U.JOINT_SPEED]+ar.s,ir(e,t)}var sr=class{backend=`cpu`;ctx=null;batch=null;load(e,t){let n=Qt(e);this.batch=e;let r=e.instances.slice();this.ctx={statics:e.statics,sf:new Float32Array(e.statics.buffer),si:new Int32Array(e.statics.buffer),inst:r,instF:new Float32Array(r.buffer),params:e.params,bs:Float64Array.from(n.bodyState),br:Float64Array.from(n.brainState),met:Float64Array.from(n.metrics),cfg:{...t}}}stepSync(e){let t=this.ctx,n=this.batch.instanceCount;for(let r=0;r<e;r++)for(let e=0;e<n;e++)or(t,e)}stepInstanceSync(e,t){for(let n=0;n<t;n++)or(this.ctx,e)}async step(e){this.stepSync(e)}metricsSync(){return Float32Array.from(this.ctx.met)}bodyStateSync(){return Float32Array.from(this.ctx.bs)}get raw(){let e=this.ctx;return{bs:e.bs,br:e.br,met:e.met}}async readMetrics(){return this.metricsSync()}async readBodyState(){return this.bodyStateSync()}setTarget(e,t){let n=this.ctx,r=e*c.WORDS;n.instF.set(t,r+c.TARGETS),n.inst[r+c.TARGET_COUNT]=1}dispose(){this.ctx=null,this.batch=null}},cr=en.map(e=>`    case ${e.id}u: { return ${e.wgsl}; }`).join(`
`),lr=()=>`
${h()}

const WG: u32 = 64u;
const TAU_MIN: f32 = ${sn};
const TAU_MAX: f32 = 4;
const FREQ_MIN: f32 = ${cn};
const FREQ_MAX: f32 = ${ln};
const WEIGHT_MAX: f32 = 8.0;
const TWO_PI: f32 = 6.283185307179586;
/** Scratch floats per body: Jacobi deltas (pos 3, rot 3, count 1, pad 1), joint drive torque (3, pad 1). */
const SC_WORDS: u32 = 12u;
const FREE_MASK = array<u32, 5>(0u, 1u, 4u, 3u, 7u);

@group(0) @binding(0) var<uniform> U: array<vec4<u32>, 4>;
@group(0) @binding(1) var<storage, read> statics: array<u32>;
@group(0) @binding(2) var<storage, read> params: array<f32>;
@group(0) @binding(3) var<storage, read> instances: array<u32>;
@group(0) @binding(4) var<storage, read_write> bs: array<f32>;
@group(0) @binding(5) var<storage, read_write> br: array<f32>;
@group(0) @binding(6) var<storage, read_write> met: array<f32>;
@group(0) @binding(7) var<storage, read_write> sc: array<f32>;

// Uniform accessors (U is 16 words as 4 × vec4<u32>).
fn uw(i: u32) -> u32 { return U[i / 4u][i % 4u]; }
fn uf(i: u32) -> f32 { return bitcast<f32>(uw(i)); }

// Per-invocation "view" of the instance (mirrors View in kernel.ts).
var<private> nb: u32;
var<private> nj: u32;
var<private> bodyOff: u32;
var<private> jointOff: u32;
var<private> neuronCount: u32;
var<private> neuronOff: u32;
var<private> edgeOff: u32;
var<private> sensorCount: u32;
var<private> totalMass: f32;
var<private> pOff: u32;
var<private> bsOff: u32;
var<private> brOff: u32;
var<private> mo: u32;
var<private> scOff: u32;
var<private> tgt: vec3f;
var<private> deferred: bool;

// Joint scratch (mirrors QJ, QE, ANG).
var<private> QJ: vec4f;
var<private> QE: vec4f;
var<private> ANG: vec3f;

fn sf(i: u32) -> f32 { return bitcast<f32>(statics[i]); }
fn sv3(i: u32) -> vec3f { return vec3f(sf(i), sf(i + 1u), sf(i + 2u)); }
fn sq(i: u32) -> vec4f { return vec4f(sf(i), sf(i + 1u), sf(i + 2u), sf(i + 3u)); }
fn instF(i: u32) -> f32 { return bitcast<f32>(instances[i]); }
fn bv3(i: u32) -> vec3f { return vec3f(bs[i], bs[i + 1u], bs[i + 2u]); }
fn setbv3(i: u32, v: vec3f) { bs[i] = v.x; bs[i + 1u] = v.y; bs[i + 2u] = v.z; }
fn bq(i: u32) -> vec4f { return vec4f(bs[i], bs[i + 1u], bs[i + 2u], bs[i + 3u]); }
fn setbq(i: u32, q: vec4f) { bs[i] = q.x; bs[i + 1u] = q.y; bs[i + 2u] = q.z; bs[i + 3u] = q.w; }

fn rotq(q: vec4f, v: vec3f) -> vec3f {
  let t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}
fn rotInv(q: vec4f, v: vec3f) -> vec3f { return rotq(vec4f(-q.xyz, q.w), v); }
fn qmul(a: vec4f, b: vec4f) -> vec4f {
  return vec4f(
    a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z);
}

fn bodyState(b: u32) -> u32 { return bsOff + b * BS_WORDS; }
fn bodyStatic(b: u32) -> u32 { return bodyOff + b * B_WORDS; }

/** I⁻¹_world · v for body state offset o, static offset s. */
fn invInertia(o: u32, s: u32, v: vec3f) -> vec3f {
  let q = bq(o + BS_Q);
  return rotq(q, rotInv(q, v) * sv3(s + B_INV_INERTIA));
}
fn invMass(o: u32, s: u32, v: vec3f) -> vec3f {
  let q = bq(o + BS_Q);
  return rotq(q, rotInv(q, v) * sv3(s + B_INV_MASS));
}

fn addRotation(o: u32, th: vec3f) {
  let q = bq(o);
  let d = 0.5 * vec4f(
    th.x * q.w + th.y * q.z - th.z * q.y,
    -th.x * q.z + th.y * q.w + th.z * q.x,
    th.x * q.y - th.y * q.x + th.z * q.w,
    -th.x * q.x - th.y * q.y - th.z * q.z);
  setbq(o, normalize(q + d));
}

// --- Jacobi passes -----------------------------------------------------------

fn scIdx(o: u32) -> u32 { return scOff + ((o - bsOff) / BS_WORDS) * SC_WORDS; }

fn beginPass() {
  deferred = true;
  for (var b = 0u; b < nb; b++) {
    let d = scOff + b * SC_WORDS;
    for (var k = 0u; k < 7u; k++) { sc[d + k] = 0.0; }
  }
}

fn flushPass(average: bool) {
  deferred = false;
  for (var b = 0u; b < nb; b++) {
    let d = scOff + b * SC_WORDS;
    let n = sc[d + 6u];
    if (average && n == 0.0) { continue; }
    let k = select(1.0, 1.0 / n, average);
    let o = bodyState(b);
    setbv3(o + BS_X, bv3(o + BS_X) + vec3f(sc[d], sc[d + 1u], sc[d + 2u]) * k);
    let r = vec3f(sc[d + 3u], sc[d + 4u], sc[d + 5u]) * k;
    if (any(r != vec3f(0.0))) { addRotation(o + BS_Q, r); }
  }
}

fn movePos(o: u32, v: vec3f) {
  if (deferred) {
    let d = scIdx(o);
    sc[d] += v.x; sc[d + 1u] += v.y; sc[d + 2u] += v.z;
    return;
  }
  setbv3(o + BS_X, bv3(o + BS_X) + v);
}

fn moveRot(o: u32, v: vec3f, count: bool) {
  if (deferred) {
    let d = scIdx(o);
    sc[d + 3u] += v.x; sc[d + 4u] += v.y; sc[d + 5u] += v.z;
    if (count) { sc[d + 6u] += 1.0; }
    return;
  }
  addRotation(o + BS_Q, v);
}

// --- Joint kinematics ---------------------------------------------------------

fn dofAxis(t: u32, d: u32) -> u32 { return select(d, 2u, t == 2u); }

fn jointState(jo: u32) {
  let p = bodyState(statics[jo + J_PARENT]);
  let ch = bodyState(statics[jo + J_CHILD]);
  QJ = qmul(bq(p + BS_Q), sq(jo + J_REST_ROT));
  var e = qmul(vec4f(-QJ.xyz, QJ.w), bq(ch + BS_Q));
  if (e.w < 0.0) { e = -e; }
  QE = e;
  let l = sqrt(e.z * e.z + e.w * e.w);
  var twist = 0.0;
  var sx = e.x;
  var sy = e.y;
  var sw = l;
  if (l > 1e-9) {
    let tz = e.z / l;
    let tw = e.w / l;
    twist = 2.0 * atan2(e.z, e.w);
    sx = e.x * tw - e.y * tz;
    sy = e.x * tz + e.y * tw;
  } else {
    sw = 0.0;
  }
  let s = sqrt(sx * sx + sy * sy);
  let k = select(2.0 / max(sw, 1e-9), 2.0 * atan2(s, sw) / s, s > 1e-9);
  ANG = vec3f(sx * k, sy * k, twist);
}

fn axisOf(q: vec4f, a: u32) -> vec3f {
  var e = vec3f(0.0);
  e[a] = 1.0;
  return rotq(q, e);
}

fn angularCorrect(p: u32, sp: u32, ch: u32, scb: u32, n: vec3f, err: f32, alphaTilde: f32, maxDl: f32) -> f32 {
  let ci = invInertia(ch, scb, n);
  let pi = invInertia(p, sp, n);
  let w = dot(n, ci) + dot(n, pi);
  let dl = clamp(err / (w + alphaTilde), -maxDl, maxDl);
  moveRot(ch, ci * dl, true);
  moveRot(p, -pi * dl, true);
  return dl;
}

fn solveAnchor(jo: u32, p: u32, sp: u32, ch: u32, scb: u32) {
  let rp = rotq(bq(p + BS_Q), sv3(jo + J_ANCHOR_P));
  let rc = rotq(bq(ch + BS_Q), sv3(jo + J_ANCHOR_C));
  let d = bv3(ch + BS_X) + rc - (bv3(p + BS_X) + rp);
  let len = length(d);
  if (len < 1e-9) { return; }
  let n = d / len;
  let mc = invMass(ch, scb, n);
  let mp = invMass(p, sp, n);
  let ac = cross(rc, n);
  let ap = cross(rp, n);
  let wc = dot(n, mc) + dot(ac, invInertia(ch, scb, ac));
  let wp = dot(n, mp) + dot(ap, invInertia(p, sp, ap));
  let dl = -len / (wc + wp);
  let imp = n * dl;
  movePos(ch, mc * dl);
  movePos(p, -mp * dl);
  moveRot(ch, invInertia(ch, scb, cross(rc, imp)), true);
  moveRot(p, -invInertia(p, sp, cross(rp, imp)), true);
}

fn anchorJoint(j: u32) {
  let jo = jointOff + j * J_WORDS;
  let pb = statics[jo + J_PARENT];
  let cb = statics[jo + J_CHILD];
  solveAnchor(jo, bodyState(pb), bodyStatic(pb), bodyState(cb), bodyStatic(cb));
}

fn driveJoints(h: f32) {
  for (var b = 0u; b < nb; b++) {
    let d = scOff + b * SC_WORDS;
    for (var k = 0u; k < 7u; k++) { sc[d + k] = 0.0; }
    sc[d + 8u] = 0.0; sc[d + 9u] = 0.0; sc[d + 10u] = 0.0;
  }
  // 0 (or a non-finite value) means "no force-velocity law": the fade term drops out.
  let topSpeed = uf(U_MAX_JOINT_SPEED);
  let invTopSpeed = select(0.0, 1.0 / topSpeed, topSpeed > 0.0 && topSpeed < 3.4e38);
  for (var j = 0u; j < nj; j++) {
    let jo = jointOff + j * J_WORDS;
    let dof = statics[jo + J_DOF];
    let maxT = sf(jo + J_MAX_TORQUE);
    if (dof == 0u || maxT <= 0.0) { continue; }
    let pb = statics[jo + J_PARENT];
    let cb = statics[jo + J_CHILD];
    let p = bodyState(pb);
    let ch = bodyState(cb);
    let sp = bodyStatic(pb);
    let scb = bodyStatic(cb);
    let jt = statics[jo + J_TYPE];
    let mirrored = statics[jo + J_MIRRORED] == 1u;
    let maxDl = maxT * h * h;
    jointState(jo);
    for (var d = 0u; d < dof; d++) {
      let n = bitcast<i32>(statics[jo + J_EFFECTOR + d]);
      if (n < 0) { continue; }
      let a = dofAxis(jt, d);
      let sgn = select(1.0, -1.0, mirrored && a > 0u);
      let limit = sf(jo + J_LIMITS + d);
      let u = br[brOff + sensorCount + u32(n)];
      let goal = sgn * u * limit;
      let alphaTilde = limit / (uf(U_KP) * maxT * h * h);
      let ax = axisOf(QJ, a);
      let ci = invInertia(ch, scb, ax);
      let pi = invInertia(p, sp, ax);
      let w = dot(ax, ci + pi);
      var dl = (goal - ANG[a]) / (w + alphaTilde);
      // Force-velocity law: w_rel about this axis, signed by the way the drive pushes.
      let wRel = dot(ax, bv3(ch + BS_W) - bv3(p + BS_W));
      let fade = 1.0 - select(-wRel, wRel, dl >= 0.0) * invTopSpeed;
      let cap = maxDl * clamp(fade, 0.0, 1.0);
      dl = clamp(dl, -cap, cap);
      let dc = scOff + cb * SC_WORDS;
      let dp = scOff + pb * SC_WORDS;
      sc[dc + 3u] += ci.x * dl; sc[dc + 4u] += ci.y * dl; sc[dc + 5u] += ci.z * dl;
      sc[dp + 3u] -= pi.x * dl; sc[dp + 4u] -= pi.y * dl; sc[dp + 5u] -= pi.z * dl;
      // Drive torque (×h²) for power accounting, stored with the child body.
      sc[dc + 8u] += ax.x * dl; sc[dc + 9u] += ax.y * dl; sc[dc + 10u] += ax.z * dl;
    }
  }
  flushPass(false);
}

// Returns this substep's drive metrics (already multiplied by h): x = motor work,
// y = mean |w_rel| over actuated joints. Mirrors driveMetrics in the CPU kernel.
fn driveMetrics(h: f32) -> vec2f {
  var power = 0.0;
  var speed = 0.0;
  var n = 0u;
  let inv = 1.0 / (h * h);
  for (var j = 0u; j < nj; j++) {
    let jo = jointOff + j * J_WORDS;
    if (statics[jo + J_DOF] == 0u) { continue; }
    let cb = statics[jo + J_CHILD];
    let d = scOff + cb * SC_WORDS;
    let p = bodyState(statics[jo + J_PARENT]);
    let ch = bodyState(cb);
    let wRel = bv3(ch + BS_W) - bv3(p + BS_W);
    speed += length(wRel);
    n++;
    let t = vec3f(sc[d + 8u], sc[d + 9u], sc[d + 10u]);
    if (all(t == vec3f(0.0))) { continue; }
    power += abs(dot(t, wRel)) * inv;
  }
  return vec2f(power * h, select(0.0, speed / f32(n) * h, n > 0u));
}

fn quatFromSwingTwist(rx: f32, ry: f32, tw: f32) -> vec4f {
  let a = sqrt(rx * rx + ry * ry);
  var sx = 0.0;
  var sy = 0.0;
  var sw = 1.0;
  if (a > 1e-12) {
    let s = sin(a / 2.0) / a;
    sx = rx * s;
    sy = ry * s;
    sw = cos(a / 2.0);
  }
  let tz = sin(tw / 2.0);
  let tww = cos(tw / 2.0);
  return vec4f(sx * tww + sy * tz, sy * tww - sx * tz, sw * tz, sw * tww);
}

fn limitJoint(j: u32) {
  let jo = jointOff + j * J_WORDS;
  let pb = statics[jo + J_PARENT];
  let cb = statics[jo + J_CHILD];
  let p = bodyState(pb);
  let ch = bodyState(cb);
  let sp = bodyStatic(pb);
  let scb = bodyStatic(cb);
  let jt = statics[jo + J_TYPE];
  jointState(jo);
  let free = FREE_MASK[jt];
  var t = vec3f(0.0);
  if ((free & 1u) != 0u) { let l = sf(jo + J_LIMITS); t.x = clamp(ANG.x, -l, l); }
  if ((free & 2u) != 0u) { let l = sf(jo + J_LIMITS + 1u); t.y = clamp(ANG.y, -l, l); }
  if ((free & 4u) != 0u) { let l = sf(jo + J_LIMITS + select(2u, 0u, jt == 2u)); t.z = clamp(ANG.z, -l, l); }
  let diff = abs(t.x - ANG.x) + abs(t.y - ANG.y) + abs(t.z - ANG.z);
  if (diff < 1e-7) { return; }
  let qt = quatFromSwingTwist(t.x, t.y, t.z);
  var c = qmul(qt, vec4f(-QE.xyz, QE.w));
  if (c.w < 0.0) { c = vec4f(-c.xyz, c.w); }
  let vl = length(c.xyz);
  if (vl < 1e-12) { return; }
  let angle = 2.0 * atan2(vl, abs(c.w));
  let n = rotq(QJ, c.xyz / vl);
  _ = angularCorrect(p, sp, ch, scb, n, angle, 0.0, 3.4e38);
}

// --- Step phases -----------------------------------------------------------------

fn loadView(k: u32) -> bool {
  let o = k * I_WORDS;
  let h = instances[o + I_STRUCT] * S_WORDS;
  nb = statics[h + S_BODY_COUNT];
  nj = statics[h + S_JOINT_COUNT];
  bodyOff = statics[h + S_BODY_OFF];
  jointOff = statics[h + S_JOINT_OFF];
  neuronCount = statics[h + S_NEURON_COUNT];
  neuronOff = statics[h + S_NEURON_OFF];
  edgeOff = statics[h + S_EDGE_OFF];
  sensorCount = statics[h + S_SENSOR_COUNT];
  totalMass = sf(h + S_TOTAL_MASS);
  pOff = instances[o + I_PARAM_OFF];
  bsOff = instances[o + I_BODY_STATE_OFF];
  brOff = instances[o + I_BRAIN_OFF];
  mo = k * M_WORDS;
  scOff = (bsOff / BS_WORDS) * SC_WORDS;
  let current = min(u32(met[mo + M_GOALS]), instances[o + I_TARGET_COUNT] - 1u);
  let t = o + I_TARGETS + 4u * current;
  tgt = vec3f(instF(t), instF(t + 1u), instF(t + 2u));
  return met[mo + M_ALIVE] != 0.0;
}

fn centreOfMass() -> array<vec3f, 2> {
  var c = vec3f(0.0);
  var v = vec3f(0.0);
  for (var b = 0u; b < nb; b++) {
    let o = bodyState(b);
    let m = sf(bodyStatic(b) + B_MASS);
    c += m * bv3(o + BS_X);
    v += m * bv3(o + BS_V);
  }
  return array<vec3f, 2>(c / totalMass, v / totalMass);
}

fn sense() {
  let root = bsOff;
  let rq = bq(root + BS_Q);
  let lv = clamp(rotInv(rq, bv3(root + BS_V)), vec3f(-5.0), vec3f(5.0));
  let lw = clamp(rotInv(rq, bv3(root + BS_W)) * 0.25, vec3f(-5.0), vec3f(5.0));
  br[brOff] = lv.x; br[brOff + 1u] = lv.y; br[brOff + 2u] = lv.z;
  br[brOff + 3u] = lw.x; br[brOff + 4u] = lw.y; br[brOff + 5u] = lw.z;
  let cv = centreOfMass();
  let dist = length(tgt - cv[0]);
  br[brOff + 6u] = dist / (1.0 + dist);

  for (var b = 0u; b < nb; b++) {
    let o = bodyState(b);
    let s = bodyStatic(b);
    var d = tgt - bv3(o + BS_X);
    let l = length(d);
    if (l > 1e-9) { d = d / l; }
    let local = rotInv(bq(o + BS_Q), d);
    let slot = brOff + statics[s + B_SENSOR_BASE];
    br[slot] = select(local.x, -local.x, statics[s + B_MIRRORED] != 0u);
    br[slot + 1u] = local.y;
    br[slot + 2u] = local.z;
  }

  for (var j = 0u; j < nj; j++) {
    let jo = jointOff + j * J_WORDS;
    let dof = statics[jo + J_DOF];
    if (dof == 0u) { continue; }
    let jt = statics[jo + J_TYPE];
    let mirrored = statics[jo + J_MIRRORED] == 1u;
    jointState(jo);
    let p = bodyState(statics[jo + J_PARENT]);
    let ch = bodyState(statics[jo + J_CHILD]);
    let rw = rotInv(QJ, bv3(ch + BS_W) - bv3(p + BS_W));
    let slot = brOff + statics[jo + J_SENSOR_BASE];
    for (var d = 0u; d < dof; d++) {
      let a = dofAxis(jt, d);
      let sgn = select(1.0, -1.0, mirrored && a > 0u);
      br[slot + d] = clamp(sgn * ANG[a] / sf(jo + J_LIMITS + d), -1.5, 1.5);
      br[slot + dof + d] = clamp(sgn * rw[a] * 0.25, -3.0, 3.0);
    }
  }
}

fn activate(act: u32, x: f32) -> f32 {
  switch act {
${cr}
    default: { return 0.0; }
  }
}

fn think(dt: f32) {
  let S0 = sensorCount;
  let nN = neuronCount;
  let vals = brOff;
  let state = brOff + S0 + nN;
  let scratch = state + nN;
  for (var n = 0u; n < nN; n++) {
    let no = neuronOff + n * N_WORDS;
    let ka = statics[no + N_KIND_ACT];
    let kind = ka & 0xffu;
    let act = ka >> 8u;
    let pb = pOff + statics[no + N_PARAM_BASE];
    var u = params[pb];
    let e0 = edgeOff + statics[no + N_EDGE_START] * E_WORDS;
    let ec = statics[no + N_EDGE_COUNT];
    for (var e = 0u; e < ec; e++) {
      let eo = e0 + e * E_WORDS;
      let w = clamp(params[pOff + statics[eo + E_PARAM]], -WEIGHT_MAX, WEIGHT_MAX);
      u += w * br[vals + statics[eo + E_SRC]];
    }
    var y: f32;
    if (kind == 0u) {
      let tau = TAU_MIN + (TAU_MAX - TAU_MIN) / (1.0 + exp(-params[pb + 1u]));
      let s = br[state + n] + (dt / tau) * (u - br[state + n]);
      br[state + n] = s;
      y = activate(act, s);
    } else if (kind == 1u) {
      let f = FREQ_MIN + (FREQ_MAX - FREQ_MIN) / (1.0 + exp(-params[pb + 1u]));
      var phase = br[state + n] + dt * TWO_PI * f * (1.0 + 0.5 * tanh(clamp(u, -20.0, 20.0)));
      if (phase > TWO_PI) { phase -= TWO_PI; }
      br[state + n] = phase;
      y = sin(phase + params[pb + 2u]);
    } else {
      y = activate(act, u);
    }
    br[scratch + n] = y;
  }
  for (var n = 0u; n < nN; n++) { br[vals + S0 + n] = br[scratch + n]; }
}

fn drag(interval: f32) {
  let c1 = uf(U_DRAG_LIN);
  let c2 = uf(U_DRAG_QUAD);
  for (var b = 0u; b < nb; b++) {
    let o = bodyState(b);
    let s = bodyStatic(b);
    let half = sv3(s + B_HALF);
    let q = bq(o + BS_Q);
    let ax = array<vec3f, 3>(rotq(q, vec3f(1, 0, 0)), rotq(q, vec3f(0, 1, 0)), rotq(q, vec3f(0, 0, 1)));
    let v = bv3(o + BS_V);
    let w = bv3(o + BS_W);
    var f = vec3f(0.0);
    var tq = vec3f(0.0);
    var stiff = 0.0;
    for (var a = 0u; a < 3u; a++) {
      let t1 = (a + 1u) % 3u;
      let t2 = (a + 2u) % 3u;
      let area = half[t1] * half[t2];
      let invMn = sf(s + B_INV_MASS + a);
      for (var sg = -1.0; sg <= 1.0; sg += 2.0) {
        let n = sg * ax[a];
        for (var i = -1.0; i <= 1.0; i += 2.0) {
          for (var k = -1.0; k <= 1.0; k += 2.0) {
            let r = ax[a] * (sg * half[a]) + ax[t1] * (0.5 * i * half[t1]) + ax[t2] * (0.5 * k * half[t2]);
            let pv = v + cross(w, r);
            let vn = dot(pv, n);
            if (vn <= 0.0) { continue; }
            let F = -(c1 + c2 * vn) * vn * area * n;
            f += F;
            tq += cross(r, F);
            let cr = cross(r, n);
            let wEff = invMn + dot(cr, invInertia(o, s, cr));
            stiff += (c1 + 2.0 * c2 * vn) * area * wEff;
          }
        }
      }
    }
    let scale = select(1.0, 1.0 / (stiff * interval), stiff * interval > 1.0);
    setbv3(o + BS_F, f * scale);
    setbv3(o + BS_T, tq * scale);
  }
}

fn integrate(h: f32) {
  for (var b = 0u; b < nb; b++) {
    let o = bodyState(b);
    let s = bodyStatic(b);
    let v = bv3(o + BS_V) + h * invMass(o, s, bv3(o + BS_F));
    setbv3(o + BS_V, v);
    setbv3(o + BS_XP, bv3(o + BS_X));
    setbv3(o + BS_X, bv3(o + BS_X) + h * v);
    let q = bq(o + BS_Q);
    let ii = sv3(s + B_INV_INERTIA);
    var wl = rotInv(q, bv3(o + BS_W));
    let tl = rotInv(q, bv3(o + BS_T));
    let L = wl / ii;
    wl += h * ii * (tl - cross(wl, L));
    let ww = rotq(q, wl);
    setbv3(o + BS_W, ww);
    setbq(o + BS_QP, q);
    addRotation(o + BS_Q, h * ww);
  }
}

fn updateVelocities(h: f32) {
  let clamp2 = uf(U_ANG_CLAMP) * uf(U_ANG_CLAMP);
  for (var b = 0u; b < nb; b++) {
    let o = bodyState(b);
    setbv3(o + BS_V, (bv3(o + BS_X) - bv3(o + BS_XP)) / h);
    let dq = qmul(bq(o + BS_Q), vec4f(-bs[o + BS_QP], -bs[o + BS_QP + 1u], -bs[o + BS_QP + 2u], bs[o + BS_QP + 3u]));
    var s = select(-2.0 / h, 2.0 / h, dq.w >= 0.0);
    let w2 = dot(dq.xyz, dq.xyz) * s * s;
    if (w2 > clamp2) { s *= sqrt(clamp2 / w2); }
    setbv3(o + BS_W, dq.xyz * s);
  }
}

fn dampJoints(h: f32) {
  let k = min(uf(U_JOINT_DAMP) * h, 1.0);
  if (k <= 0.0) { return; }
  for (var b = 0u; b < nb; b++) {
    let d = scOff + b * SC_WORDS;
    for (var i = 0u; i < 7u; i++) { sc[d + i] = 0.0; }
  }
  for (var j = 0u; j < nj; j++) {
    let jo = jointOff + j * J_WORDS;
    let pb = statics[jo + J_PARENT];
    let cb = statics[jo + J_CHILD];
    let p = bodyState(pb);
    let ch = bodyState(cb);
    let r = bv3(ch + BS_W) - bv3(p + BS_W);
    let len = length(r);
    if (len < 1e-9) { continue; }
    let n = r / len;
    let ci = invInertia(ch, bodyStatic(cb), n);
    let pi = invInertia(p, bodyStatic(pb), n);
    let imp = len * k / (dot(n, ci) + dot(n, pi));
    let dc = scOff + cb * SC_WORDS;
    let dp = scOff + pb * SC_WORDS;
    sc[dc] -= ci.x * imp; sc[dc + 1u] -= ci.y * imp; sc[dc + 2u] -= ci.z * imp; sc[dc + 6u] += 1.0;
    sc[dp] += pi.x * imp; sc[dp + 1u] += pi.y * imp; sc[dp + 2u] += pi.z * imp; sc[dp + 6u] += 1.0;
  }
  for (var b = 0u; b < nb; b++) {
    let d = scOff + b * SC_WORDS;
    let n = sc[d + 6u];
    if (n == 0.0) { continue; }
    let o = bodyState(b);
    setbv3(o + BS_W, bv3(o + BS_W) + vec3f(sc[d], sc[d + 1u], sc[d + 2u]) / n);
  }
}

fn finish(k: u32) {
  let o = k * I_WORDS;
  let cv = centreOfMass();
  var ke = 0.0;
  var dead = 0.0;
  let maxV2 = uf(U_MAX_SPEED) * uf(U_MAX_SPEED);
  let maxW2 = uf(U_MAX_ANG_SPEED) * uf(U_MAX_ANG_SPEED);
  for (var b = 0u; b < nb; b++) {
    let bo = bodyState(b);
    let s = bodyStatic(b);
    let q = bq(bo + BS_Q);
    let v = bv3(bo + BS_V);
    let v2 = dot(v, v);
    let vl = rotInv(q, v);
    ke += 0.5 * dot(vl * vl, vec3f(1.0) / sv3(s + B_INV_MASS));
    let wl = rotInv(q, bv3(bo + BS_W));
    let w2 = dot(wl, wl);
    ke += 0.5 * dot(wl * wl, vec3f(1.0) / sv3(s + B_INV_INERTIA));
    if (!(v2 <= maxV2 && w2 <= maxW2)) { dead = select(DEATH_SPEED, DEATH_NAN, v2 != v2 || w2 != w2); }
  }
  if (ke != ke || cv[0].x != cv[0].x) { dead = DEATH_NAN; }
  if (dead == 0.0 && ke > uf(U_ENERGY_FACTOR) * met[mo + M_WORK] + uf(U_ENERGY_SLACK) * totalMass) { dead = DEATH_ENERGY; }

  let step = u32(met[mo + M_STEP]);
  met[mo + M_STEP] = f32(step + 1u);
  if (dead != 0.0) {
    met[mo + M_ALIVE] = 0.0;
    met[mo + M_DEATH] = dead;
    return;
  }
  met[mo + M_KE] = ke;
  let dvec = tgt - cv[0];
  let dist = length(dvec);
  met[mo + M_DIST] = dist;
  for (var i = 0u; i < 3u; i++) {
    met[mo + M_COM + i] = cv[0][i];
    met[mo + M_VCOM + i] = cv[1][i];
  }
  let settle = instances[o + I_SETTLE_STEPS];
  if (step == settle) {
    for (var i = 0u; i < 3u; i++) { met[mo + M_COM0 + i] = cv[0][i]; }
    met[mo + M_DIST0] = dist;
  }
  if (step >= settle) {
    let dt = uf(U_DT);
    let toward = select(0.0, dot(cv[1], dvec) / dist, dist > 1e-6);
    met[mo + M_TOWARD] += toward * dt;
    met[mo + M_TIME] += dt;
    met[mo + M_SPEED] += length(cv[1]) * dt;
    if (dist < met[mo + M_MIN_DIST]) { met[mo + M_MIN_DIST] = dist; }
    // Reached the active waypoint: the next one becomes active from the next step.
    let goals = met[mo + M_GOALS];
    if (dist < instF(o + I_REACH) && goals < f32(instances[o + I_TARGET_COUNT])) {
      met[mo + M_GOALS] = goals + 1.0;
      met[mo + M_MIN_DIST] = 1e9;
    }
  }
}

fn stepInstance(k: u32) {
  if (!loadView(k)) { return; }
  sense();
  let ticks = uw(U_BRAIN_TICKS);
  let dt = uf(U_DT);
  for (var t = 0u; t < ticks; t++) { think(dt / f32(ticks)); }
  let substeps = uw(U_SUBSTEPS);
  let h = dt / f32(substeps);
  let every = max(1u, uw(U_DRAG_EVERY));
  var acc = vec2f(0.0);
  for (var s = 0u; s < substeps; s++) {
    if (s % every == 0u) { drag(h * f32(every)); }
    integrate(h);
    beginPass();
    for (var j = 0u; j < nj; j++) { anchorJoint(j); }
    flushPass(true);
    driveJoints(h);
    beginPass();
    for (var j = 0u; j < nj; j++) { limitJoint(j); }
    flushPass(true);
    updateVelocities(h);
    acc += driveMetrics(h);
    dampJoints(h);
  }
  met[mo + M_WORK] += acc.x;
  met[mo + M_JOINT_SPEED] += acc.y;
  finish(k);
}

@compute @workgroup_size(WG)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let k = gid.x;
  if (k >= uw(U_INSTANCE_COUNT)) { return; }
  let steps = uw(U_STEPS);
  for (var s = 0u; s < steps; s++) { stepInstance(k); }
}
`,ur=12,dr=new WeakMap;function fr(e){let t=dr.get(e);if(!t){let n=e.createShaderModule({code:lr(),label:`sim-step`});t=n.getCompilationInfo().then(t=>{let r=t.messages.filter(e=>e.type===`error`);if(r.length)throw Error(`sim-step WGSL errors:\n${r.map(e=>`${e.lineNum}:${e.linePos} ${e.message}`).join(`
`)}`);return e.createComputePipeline({layout:`auto`,compute:{module:n,entryPoint:`main`},label:`sim-step`})}),dr.set(e,t)}return t}var pr=class{device;backend=`gpu`;stepsPerDispatch=10;buffers=null;bindGroup=null;pipeline=null;batch=null;config=null;uniformData=new ArrayBuffer(p.WORDS*4);constructor(e){this.device=e}get bodyStateBuffer(){return this.buffers.bodyState}storage(e,t,n=0){let r=Math.max(16,Math.ceil(e.byteLength/4)*4),i=this.device.createBuffer({size:r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|n,label:t,mappedAtCreation:!0});return new Uint8Array(i.getMappedRange()).set(new Uint8Array(e.buffer,e.byteOffset,e.byteLength)),i.unmap(),i}async load(e,t){this.destroyBuffers(),this.pipeline=await fr(this.device);let n=Qt(e),r=e.bodyStateWords/l.WORDS;this.buffers={uniforms:this.device.createBuffer({size:p.WORDS*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,label:`sim-uniforms`}),statics:this.storage(e.statics,`sim-statics`),params:this.storage(e.params,`sim-params`),instances:this.storage(e.instances,`sim-instances`),bodyState:this.storage(n.bodyState,`sim-body-state`),brainState:this.storage(n.brainState,`sim-brain-state`),metrics:this.storage(n.metrics,`sim-metrics`),scratch:this.storage(new Float32Array(Math.max(r,1)*ur),`sim-scratch`)};let i=this.buffers;this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.uniforms}},{binding:1,resource:{buffer:i.statics}},{binding:2,resource:{buffer:i.params}},{binding:3,resource:{buffer:i.instances}},{binding:4,resource:{buffer:i.bodyState}},{binding:5,resource:{buffer:i.brainState}},{binding:6,resource:{buffer:i.metrics}},{binding:7,resource:{buffer:i.scratch}}]}),this.batch=e,this.config={...t}}writeUniforms(e){let t=this.config,n=new Float32Array(this.uniformData),r=new Uint32Array(this.uniformData);n[p.DT]=t.dt,r[p.SUBSTEPS]=t.substeps,r[p.BRAIN_TICKS]=t.brainTicks,n[p.DRAG_LIN]=t.dragLinear,n[p.DRAG_QUAD]=t.dragQuad,n[p.KP]=t.servoKp,n[p.MAX_JOINT_SPEED]=Number.isFinite(t.maxJointSpeed)?t.maxJointSpeed:34e37,n[p.JOINT_DAMP]=t.jointDamping,n[p.MAX_SPEED]=t.maxSpeed,n[p.MAX_ANG_SPEED]=t.maxAngSpeed,n[p.ENERGY_SLACK]=t.energySlack,r[p.INSTANCE_COUNT]=this.batch.instanceCount,r[p.STEPS]=e,n[p.ENERGY_FACTOR]=t.energyFactor,n[p.ANG_CLAMP]=Number.isFinite(t.angularClamp)?t.angularClamp:34e37,r[p.DRAG_EVERY]=t.dragEvery,this.device.queue.writeBuffer(this.buffers.uniforms,0,this.uniformData)}encode(e){let t=this.device.createCommandEncoder(),n=Math.ceil(this.batch.instanceCount/64);for(let r=0;r<e;r++){let e=t.beginComputePass();e.setPipeline(this.pipeline),e.setBindGroup(0,this.bindGroup),e.dispatchWorkgroups(n),e.end()}this.device.queue.submit([t.finish()])}async step(e){if(!this.batch||this.batch.instanceCount===0||e<=0)return;let t=Math.max(1,this.stepsPerDispatch),n=Math.floor(e/t),r=e-n*t;n>0&&(this.writeUniforms(t),this.encode(n)),r>0&&(this.writeUniforms(r),this.encode(1))}done(){return this.device.queue.onSubmittedWorkDone()}async read(e,t){let n=Math.max(16,t*4),r=this.device.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),i=this.device.createCommandEncoder();i.copyBufferToBuffer(e,0,r,0,n),this.device.queue.submit([i.finish()]),await r.mapAsync(GPUMapMode.READ);let a=new Float32Array(r.getMappedRange().slice(0,t*4));return r.unmap(),r.destroy(),a}readMetrics(){return this.read(this.buffers.metrics,this.batch.instanceCount*d.WORDS)}readBodyState(){return this.read(this.buffers.bodyState,this.batch.bodyStateWords)}setTarget(e,t){let n=e*c.WORDS,r=this.device.queue;r.writeBuffer(this.buffers.instances,(n+c.TARGETS)*4,Float32Array.from(t)),r.writeBuffer(this.buffers.instances,(n+c.TARGET_COUNT)*4,Uint32Array.of(1))}destroyBuffers(){if(this.buffers){for(let e of Object.values(this.buffers))e.destroy();this.buffers=null}}dispose(){this.destroyBuffers(),this.batch=null}},mr=class{kind=`cpu`;sim=new sr;bodies=0;config;constructor(e=f){this.config=e}async load(e,t){let n=Zt([e],[{structure:0,params:e.params}],[{paramSet:0,targets:[t]}]);this.sim.load(n,this.config),this.bodies=e.body.parts.length}async advance(e){this.sim.stepSync(e)}setTarget(e){this.sim.setTarget(0,e)}present(e){this.bodies!==0&&e.uploadBodyState(Float32Array.from(this.sim.raw.bs.subarray(0,this.bodies*l.WORDS)))}poses(){return this.bodies>0?this.sim.raw.bs.subarray(0,this.bodies*l.WORDS):null}status(){let e=this.sim.raw.met;return{com:[e[d.COM],e[d.COM+1],e[d.COM+2]],vcom:[e[d.VCOM],e[d.VCOM+1],e[d.VCOM+2]],dist:e[d.DIST],time:e[d.STEP]*this.config.dt,alive:e[d.ALIVE]===1}}dispose(){this.sim.dispose()}},hr=class{kind=`gpu`;sim;last={com:[0,0,0],vcom:[0,0,0],dist:0,time:0,alive:!0};reading=!1;bodyState=null;config;constructor(e,t=f){this.sim=new pr(e),this.sim.stepsPerDispatch=8,this.config=t}async load(e,t){let n=Zt([e],[{structure:0,params:e.params}],[{paramSet:0,targets:[t]}],this.config);this.last={com:[0,0,0],vcom:[0,0,0],dist:0,time:0,alive:!0},this.bodyState=null,await this.sim.load(n,this.config),await this.refresh()}async refresh(){let[e,t]=await Promise.all([this.sim.readMetrics(),this.sim.readBodyState()]);this.bodyState=t,this.last={com:[e[d.COM],e[d.COM+1],e[d.COM+2]],vcom:[e[d.VCOM],e[d.VCOM+1],e[d.VCOM+2]],dist:e[d.DIST],time:e[d.STEP]*this.config.dt,alive:e[d.ALIVE]===1}}async advance(e){await this.sim.step(e),this.reading||(this.reading=!0,this.refresh().finally(()=>this.reading=!1))}setTarget(e){this.sim.setTarget(0,e)}present(e){this.bodyState&&e.useBodyStateBuffer(this.sim.bodyStateBuffer,0)}status(){return this.last}poses(){return this.bodyState}dispose(){this.sim.dispose()}},$=e=>document.getElementById(e);function gr(e){let{canvas:t,renderer:n,device:r,adapter:i}=e,a=0,o=0,s=e=>{a=e,$(`hud-reached`).textContent=String(e)},c=e=>e===`cpu`?new mr:new hr(r),l=new URLSearchParams(location.search).get(`backend`)===`cpu`?`cpu`:`gpu`,u=new Jt(t,n,c(l),{dt:f.dt,onTargetReached:()=>s(a+1),onStatus:e=>{let t=performance.now();t-o<100||(o=t,$(`hud-dist`).textContent=e.alive?e.dist.toFixed(2):`unstable`,$(`hud-speed`).textContent=e.speed.toFixed(2),$(`hud-time`).textContent=`${e.time.toFixed(1)} s`)}}),d=()=>$(`backend-badge`).textContent=`physics: ${u.backendKind} · ${i.info?.architecture||i.info?.vendor||`gpu`}`;d();let p=$(`sel-backend`);p.value=l,p.addEventListener(`change`,async()=>{await u.setBackend(c(p.value)),d()});let m=$(`hud`),h=$(`btn-hud`),g=e=>{m.classList.toggle(`open`,e),h.setAttribute(`aria-expanded`,String(e)),h.title=e?`Hide the stats`:`Show the stats`};g(!1),m.addEventListener(`click`,e=>{e.target.closest(`input, select, textarea, a, .look-button`)||g(!m.classList.contains(`open`))});let _=$(`btn-pause`),v=e=>{u.paused=e,_.setAttribute(`aria-pressed`,String(e)),_.textContent=e?`Play`:`Pause`};_.addEventListener(`click`,()=>v(!u.paused)),$(`btn-reset`).addEventListener(`click`,()=>{s(0),u.reset()});let y=$(`speed`);y.addEventListener(`input`,()=>{u.speed=Number(y.value),$(`speed-out`).textContent=`${y.value}×`}),$(`btn-random-target`).addEventListener(`click`,()=>u.randomTarget());let b=$(`chk-course`);b.addEventListener(`change`,()=>u.course=b.checked);let x=$(`chk-follow`);return x.addEventListener(`change`,()=>u.follow=x.checked),t.addEventListener(`followchange`,()=>x.checked=u.follow),window.addEventListener(`keydown`,t=>{e.keysBlocked?.()||t.target.closest(`input, textarea, select`)||(t.key===` `?(t.preventDefault(),v(!u.paused)):t.key===`r`||t.key===`R`?u.reset():t.key===`t`||t.key===`T`?u.randomTarget():(t.key===`c`||t.key===`C`)&&(b.checked=!b.checked,u.course=b.checked))}),{viewer:u,resetReached:()=>s(0),setPaused:v}}function _r(e,t,n={}){return{render(r,i){e.replaceChildren();let a=[[`Your creatures`,r.filter(e=>e.source===`user`)],[`Evolved gallery`,r.filter(e=>e.source===`bundled`)]];for(let[r,o]of a)if(o.length!==0){if(n.headings!==!1){let t=document.createElement(`li`);t.className=`section`,t.textContent=r,e.append(t)}for(let{record:n,customised:r}of o){let a=document.createElement(`li`),o=document.createElement(`button`);o.type=`button`,o.setAttribute(`aria-current`,String(n.id===i));let s=document.createElement(`span`);if(s.className=`name`,s.textContent=n.name,r){let e=document.createElement(`span`);e.className=`edited`,e.textContent=`edited`,e.title=`Renamed or restyled on this device`,s.append(e)}let c=document.createElement(`span`);c.className=`fit`,c.textContent=n.fitness?n.fitness.value.toFixed(2):``,c.title=n.fitness?`Fitness (${n.fitness.task})`:``;let l=document.createElement(`span`);l.className=`meta`,l.textContent=vr(n),o.append(s,c,l),o.addEventListener(`click`,()=>t(n)),a.append(o),e.append(a)}}}}}function vr(e){let t=[];return e.stats&&t.push(`${e.stats.parts} parts`,`${e.stats.neurons} neurons`),e.origin.iteration!==void 0&&t.push(`iter ${e.origin.iteration}`),e.origin.strategy&&t.push(e.origin.strategy),e.origin.body&&t.push(`body: ${e.origin.body}`),e.origin.start&&t.push(`from: ${e.origin.start}`),e.origin.kind===`random`&&t.push(`untrained`),e.origin.kind===`imported`&&t.push(`imported`),t.join(` · `)}var yr=e=>3+e.inputs.length,br=e=>[...e.neurons,...e.effectors];function xr(e){let t=0,n=e=>br(e).map(e=>{let n=t;return t+=yr(e),n});return{global:n(e.global),nodes:e.nodes.map(e=>n(e.brain)),count:t}}function Sr(e,t){br(e.global).forEach(t);for(let n of e.nodes)br(n.brain).forEach(t)}function Cr(e){let t=[];return Sr(e,e=>{t.push(e.bias,e.a,e.b);for(let n of e.inputs)t.push(n.w)}),Float32Array.from(t)}function wr(e,t){let{parts:n,joints:r}=t,i=xr(e),a=new Int32Array(n.length),o=new Int32Array(n.length),s=7;n.forEach((e,t)=>{let n=t===0?0:ue[r[t-1].type];a[t]=s,o[t]=3+2*n,s+=o[t]});let c=s,l=[{module:e.global,paramBases:i.global,part:-1}];for(let t=0;t<n.length;t++){let r=n[t].node;l.push({module:e.nodes[r].brain,paramBases:i.nodes[r],part:t})}let u=[],d=0;for(let e of l){let t=e.module.neurons.length+e.module.effectors.length;u.push(Array.from({length:t},(e,t)=>d+t)),d+=t}let f=u[0],p=e=>u[e+1],m=new Int32Array(d),h=new Int32Array(d),g=new Int32Array(d),_=new Int32Array(d),v=new Int32Array(d),y=[],b=[],x=(e,t)=>e.length===0?-1:e[(t%e.length+e.length)%e.length],S=(t,r)=>{let i=t.part,s=e=>e<0?-1:c+e;switch(r.k){case`sensor`:{if(i<0)return(r.i%7+7)%7;let e=o[i];return a[i]+(r.i%e+e)%e}case`neuron`:return s(x(i<0?f:p(i),r.i));case`global`:return s(x(f,r.i));case`parent`:{if(i<0)return s(x(p(0),r.i));let e=n[i].parent;return s(x(e<0?f:p(e),r.i))}case`child`:{let t=i<0?0:i,a=e.nodes[n[t].node].connections;if(a.length===0)return-1;let o=(r.c%a.length+a.length)%a.length,c=n.findIndex(e=>e.parent===t&&e.conn===o);return c<0?-1:s(x(p(c),r.i))}}};l.forEach((e,t)=>{[...e.module.neurons,...e.module.effectors].forEach((n,r)=>{let i=u[t][r];m[i]=on(n.kind),h[i]=rn(n.act),g[i]=e.paramBases[r],_[i]=y.length,n.inputs.forEach((t,n)=>{let i=S(e,t.src);i<0||(y.push(i),b.push(e.paramBases[r]+3+n))}),v[i]=y.length-_[i]})});let C=new Int32Array(r.length*3).fill(-1);return r.forEach((t,r)=>{let i=ue[t.type],a=e.nodes[n[t.child].node].brain,o=p(t.child);for(let e=0;e<Math.min(i,a.effectors.length);e++)C[r*3+e]=o[a.neurons.length+e]}),{sensorCount:c,neuronCount:d,paramCount:i.count,kind:m,act:h,paramBase:g,edgeStart:_,edgeCount:v,edgeSrc:Int32Array.from(y),edgeParam:Int32Array.from(b),partSensorBase:a,effector:C}}function Tr(e,t,n=1){let r=ie(e.rot),i=ie(t.rot),a=e.halfExtents.map(e=>e*n),o=t.halfExtents.map(e=>e*n),s=j(t.pos,e.pos),c=[...r,...i];for(let e of r)for(let t of i){let n=P(e,t);N(n,n)>1e-10&&c.push(n)}for(let e of c){let t=a[0]*Math.abs(N(r[0],e))+a[1]*Math.abs(N(r[1],e))+a[2]*Math.abs(N(r[2],e)),n=o[0]*Math.abs(N(i[0],e))+o[1]*Math.abs(N(i[1],e))+o[2]*Math.abs(N(i[2],e));if(Math.abs(N(s,e))>t+n)return!1}return!0}function Er(e,t=.85){let{parts:n}=e,r=[];for(let e=0;e<n.length;e++)for(let i=e+1;i<n.length;i++)n[i].parent!==e&&n[e].parent!==i&&Tr(n[e],n[i],t)&&r.push([e,i]);return r}var Dr={maxParts:20,minHalfExtent:.03,maxHalfExtent:1,torquePerArea:1.5,maxAngularAccel:2e3,rejectOverlaps:!0};function Or(e){let t=e>>1,n=e&1?-1:1,r=(t+1)%3,i=(t+2)%3,a=[0,0,0];a[t]=n;let o=[0,0,0];o[r]=1;let s=[0,0,0];return s[i]=n,{normal:a,t1:o,t2:s,axis:t,t1Axis:r,t2Axis:i}}var kr=e=>[-e[0],e[1],e[2]],Ar=e=>[e[0],-e[1],-e[2],e[3]];function jr(e,t,n){let r=Or(n.face),i=[0,0,0];i[r.axis]=r.normal[r.axis]*e[r.axis],i[r.t1Axis]=se(n.u,-1,1)*e[r.t1Axis],i[r.t2Axis]=se(n.v,-1,1)*e[r.t2Axis];let a=L(oe(r.t1,r.t2,r.normal),ne(n.rot[0],n.rot[1],n.rot[2]));return{anchorParent:i,anchorChild:[0,0,-t[2]],relRot:a,relPos:A(i,z(a,[0,0,t[2]]))}}var Mr=e=>4*Math.max(e[0]*e[1],e[1]*e[2],e[0]*e[2]),Nr=e=>{let t=8*e[0]*e[1]*e[2],[n,r,i]=[e[0]*e[0],e[1]*e[1],e[2]*e[2]];return t/3*Math.min(r+i,n+i,n+r)};function Pr(e,t=Dr){let{nodes:n}=e,r=e=>se(e,t.minHalfExtent,t.maxHalfExtent),i={node:0,parent:-1,conn:-1,halfExtents:n[0].size.map(e=>r(e/2)),pos:[0,0,0],rot:[0,0,0,1],mirrored:!1},a=[i],o=[],s=[{part:i,scale:1,counts:new Map([[0,1]])}];for(let e=0;e<s.length;e++){let{part:i,scale:c,counts:l}=s[e],u=a.indexOf(i),d=n[i.node],f=(l.get(i.node)??0)>=d.recursiveLimit;if(d.connections.forEach((e,d)=>{if(e.to<0||e.to>=n.length||e.terminalOnly&&!f)return;let p=n[e.to],m=l.get(e.to)??0;if(m>=p.recursiveLimit)return;let h=c*e.scale,g=p.size.map(e=>r(e/2*h)),_=jr(i.halfExtents,g,e),v=e.reflect?[!1,!0]:[!1];for(let n of v){let r=i.mirrored!==n,c=i.mirrored?kr(_.anchorParent):_.anchorParent,f=i.mirrored?Ar(_.relRot):_.relRot,v=i.mirrored?kr(_.relPos):_.relPos,y=n?kr(c):c,b=n?Ar(f):f,x=n?kr(v):v,S={node:e.to,parent:u,conn:d,halfExtents:g,pos:A(i.pos,z(i.rot,x)),rot:L(i.rot,b),mirrored:r};if(a.push(S),a.length>t.maxParts)return;let C=ue[p.joint.type],w=Math.max(0,p.joint.strength)*Math.min(t.torquePerArea*Math.min(Mr(i.halfExtents),Mr(g)),t.maxAngularAccel*Nr(g));o.push({parent:u,child:a.length-1,type:p.joint.type,anchorParent:y,anchorChild:_.anchorChild,restRot:b,limits:p.joint.limits.map((e,t)=>t<C?se(e,.05,Math.PI*.9):0),maxTorque:w,axisSign:r?[1,-1,-1]:[1,1,1]});let T=new Map(l);T.set(e.to,m+1),s.push({part:S,scale:h,counts:T})}}),a.length>t.maxParts)return{ok:!1,reason:`too-many-parts`}}if(o.length===0)return{ok:!1,reason:`no-joints`};let c={parts:a,joints:o};return t.rejectOverlaps&&Er(c).length>0?{ok:!1,reason:`overlap`}:{ok:!0,body:c}}function Fr(e,t=Dr){let n=Pr(e,t);if(!n.ok)return n;let r=wr(e,n.body);return r.effector.some(e=>e>=0)?{ok:!0,creature:{genome:e,body:n.body,brain:r,params:Cr(e)}}:{ok:!1,reason:`no-effectors`}}async function Ir(e=`/article-data/evolved-swimmers/`){try{let t=await fetch(`${e}creatures/index.json`);if(!t.ok)return[];let n=await t.json();return await Promise.all(n.files.map(async t=>_e(await(await fetch(`${e}creatures/${t}`)).json())))}catch(e){return console.warn(`Could not load bundled creatures`,e),[]}}var Lr=.02;function Rr(e,t={}){let n=t.sim??f,r=Ht(),i=Xe(e,t.frame),a=r.examTrials(t.trials??3,{level:0}),o=Zt([e],[{structure:0,params:t.params??e.params}],a.map(e=>$e(e,i,r,n,0)),n),s=new sr;s.load(o,n);let{bs:u,met:p}=s.raw,m=a.map((e,t)=>o.instances[t*c.WORDS+c.BODY_STATE_OFF]),h=Math.round(r.settleSeconds/n.dt),g=Math.round(r.seconds/n.dt),_=a.map(()=>[0,0,0]);for(let e=0;e<g;e++)if(s.stepSync(1),!(e<h))for(let e=0;e<a.length;e++){let t=e*d.WORDS;if(p[t+d.ALIVE]!==1)continue;let r=m[e]+l.Q,i=[u[r],u[r+1],u[r+2],u[r+3]],a=[p[t+d.VCOM],p[t+d.VCOM+1],p[t+d.VCOM+2]];_[e]=A(_[e],M(re(i,a),n.dt))}s.dispose();let v=[0,0,0];a.forEach((e,t)=>{p[t*d.WORDS+d.ALIVE]===1&&(v=A(v,_[t]))});let y=(g-h)*n.dt*a.length;return F(v)/(y*i.size)>Lr?I(v):null}var zr=e=>document.getElementById(e);function Br(e){return e.matches(`:hover`)||e.contains(document.activeElement)}function Vr(e,t){let n=!1,r=t=>{t!==n&&(n=t,t?e.start():e.stop())};new IntersectionObserver(([e])=>r(e.isIntersecting)).observe(t)}async function Hr(){let e=await O();if(!e)return;let{device:t,adapter:n}=e,r=zr(`view`),i=k(t,r),a=document.querySelector(`.app`),o=a.classList.contains(`embed`),s=gr({canvas:r,renderer:i,device:t,adapter:n,keysBlocked:o?()=>!Br(a):void 0}),{viewer:c}=s,l=[],u=null,d=_r(zr(`creature-list`),e=>void f(e),{headings:!1});async function f(e){let t=Fr(e.genome);if(!t.ok){zr(`hud-name`).textContent=e.name,zr(`hud-meta`).textContent=`This creature cannot be built (${t.reason}).`;return}let n=e.facing??Rr(t.creature,{frame:e.heading})??e.heading;u=e,s.resetReached(),zr(`hud-name`).textContent=e.name,zr(`hud-meta`).textContent=vr(e),d.render(l,e.id),await c.show(t.creature,!0,{look:e.look,heading:n})}l=(await Ir()).map(e=>({record:e,source:`bundled`})),d.render(l,null),zr(`list-empty`).hidden=l.length>0;let p=l[0]?.record;p&&await f(p),o?Vr(c,a):c.start(),Object.assign(window,{__debug:{viewer:c,status:()=>c.getStatus(),target:()=>c.getTarget(),setTarget:(e,t,n)=>c.setTarget([e,t,n]),entries:()=>l.map(e=>e.record.name),select:e=>f(l[e].record),record:()=>u,eyes:()=>c.eyeState(),capture:async(e=960,t=640)=>{let n=await c.capture(e,t),r=new OffscreenCanvas(e,t);r.getContext(`2d`).putImageData(new ImageData(n,e,t),0,0);let i=await r.convertToBlob({type:`image/png`}),a=new Uint8Array(await i.arrayBuffer()),o=``;for(let e of a)o+=String.fromCharCode(e);return`data:image/png;base64,${btoa(o)}`},ready:!0}})}Hr();