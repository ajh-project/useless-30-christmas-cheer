<script setup lang="ts">
// 3D 거실: 우드 벽·마루, 벽난로(불꽃·장작·스타킹·리스), 따뜻한 전구 트리, 러그, 선물
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{ starOn: boolean }>()
const emit = defineEmits<{
  orn: [p: { x: number; y: number; c: string }]
  star: []
}>()
const cv = ref<HTMLCanvasElement>()

let raf = 0
let cleanup: (() => void) | null = null
let starTarget = 0
watch(() => props.starOn, (v) => { starTarget = v ? 1 : 0 })

// ── 재현 가능한 난수 ──
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rx = 1, ry = 1) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 4
  return t
}

function glowTex() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.25, 'rgba(255,255,255,.65)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function flameTex() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 256
  const g = c.getContext('2d')!
  g.translate(64, 150)
  g.scale(1, 1.7)
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 62)
  gr.addColorStop(0, 'rgba(255,250,210,1)')
  gr.addColorStop(0.3, 'rgba(255,200,80,.95)')
  gr.addColorStop(0.65, 'rgba(255,100,20,.55)')
  gr.addColorStop(1, 'rgba(255,60,0,0)')
  g.fillStyle = gr
  g.fillRect(-64, -150, 128, 300)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

onMounted(() => {
  const canvas = cv.value!
  const R = rng(7)

  // ── 렌더러 · 씬 · 카메라 ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1a0f09')
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.28
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 150)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.85)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const glow = glowTex()

  // ── 조명 ──
  scene.add(new THREE.AmbientLight(0xffc99a, 0.28))
  const key = new THREE.DirectionalLight(0xffdcb8, 0.45)
  key.position.set(1, 6, 14)
  scene.add(key)
  const fireLight = new THREE.PointLight(0xff7a2a, 70, 16, 1.6)
  const treeLight = new THREE.PointLight(0xffd9a0, 30, 8, 1.6)

  // ── 방: 마루 · 우드 벽 ──
  const floorTex = canvasTex(512, 512, (g) => {
    for (let r = 0; r < 8; r++) {
      const h = 64
      const base = 38 + R() * 16
      g.fillStyle = `hsl(24 ${48 + R() * 10}% ${base}%)`
      g.fillRect(0, r * h, 512, h)
      const cut = R() * 400 + 40
      g.fillStyle = 'rgba(30,14,6,.7)'
      g.fillRect(cut, r * h, 3, h)
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = `rgba(60,28,10,${0.12 + R() * 0.15})`
        g.lineWidth = 1
        g.beginPath()
        const y = r * h + R() * h
        g.moveTo(0, y); g.bezierCurveTo(150, y + R() * 6 - 3, 350, y + R() * 6 - 3, 512, y)
        g.stroke()
      }
      g.fillStyle = 'rgba(25,10,4,.85)'
      g.fillRect(0, r * h, 512, 3)
    }
  }, 6, 5)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.62, metalness: 0.05 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, 0, 10)
  scene.add(floor)

  const wallTex = canvasTex(256, 256, (g) => {
    for (let b = 0; b < 4; b++) {
      g.fillStyle = `hsl(20 ${40 + R() * 10}% ${15 + R() * 6}%)`
      g.fillRect(b * 64, 0, 64, 256)
      for (let k = 0; k < 10; k++) {
        g.strokeStyle = `rgba(20,8,2,${0.1 + R() * 0.15})`
        g.beginPath()
        const x = b * 64 + 6 + R() * 52
        g.moveTo(x, 0); g.bezierCurveTo(x + 4, 80, x - 4, 170, x + 2, 256)
        g.stroke()
      }
      g.fillStyle = 'rgba(10,4,0,.8)'
      g.fillRect(b * 64, 0, 3, 256)
    }
  }, 20, 5)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 }))
  wall.position.set(0, 8, -3)
  scene.add(wall)
  const baseboard = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, 0.12), new THREE.MeshStandardMaterial({ color: '#2b160b', roughness: 0.6 }))
  baseboard.position.set(0, 0.17, -2.94)
  scene.add(baseboard)

  // 러그
  const rugTex = canvasTex(512, 512, (g) => {
    const ring = (r: number, col: string) => { g.fillStyle = col; g.beginPath(); g.arc(256, 256, r, 0, 6.283); g.fill() }
    ring(256, '#5e1418'); ring(236, '#e9dcc0'); ring(222, '#8a1f26'); ring(180, '#e9dcc0'); ring(168, '#2f5d3c')
    ring(120, '#e9dcc0'); ring(108, '#8a1f26')
    g.strokeStyle = '#e9dcc0'; g.lineWidth = 3
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.283
      g.beginPath(); g.moveTo(256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120); g.lineTo(256 + Math.cos(a) * 168, 256 + Math.sin(a) * 168); g.stroke()
    }
  })
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.5, 64), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0.1, 0.012, 1.0)
  scene.add(rug)

  // ── 벽난로 ──
  const FX = -2.6, FZ = -2.5
  const fp = new THREE.Group()
  fp.position.set(FX, 0, FZ)
  scene.add(fp)
  const brickTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#3a2820'; g.fillRect(0, 0, 256, 256)
    for (let r = 0; r < 8; r++) {
      for (let c = -1; c < 4; c++) {
        const x = c * 64 + (r % 2 ? 32 : 0)
        g.fillStyle = `hsl(${10 + R() * 8} ${35 + R() * 12}% ${28 + R() * 10}%)`
        g.fillRect(x + 2, r * 32 + 2, 60, 28)
      }
    }
  }, 1.2, 1.4)
  const brick = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 })
  const wood = new THREE.MeshStandardMaterial({ color: '#4b2a14', roughness: 0.45, metalness: 0.05 })
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    b.position.set(x, y, z)
    fp.add(b)
    return b
  }
  addBox(3.3, 0.18, 1.7, 0, 0.09, 0.35, new THREE.MeshStandardMaterial({ color: '#5b4a40', roughness: 0.8 })) // 화덕 바닥
  addBox(0.7, 2.0, 1.0, -1.0, 1.18, 0, brick)
  addBox(0.7, 2.0, 1.0, 1.0, 1.18, 0, brick)
  addBox(2.7, 0.6, 1.0, 0, 2.48, 0, brick)
  addBox(2.4, 9, 0.8, 0, 7.2, -0.1, brick)
  addBox(3.5, 0.2, 1.25, 0, 2.88, 0.1, wood) // 맨틀
  const soot = addBox(1.3, 1.9, 0.15, 0, 1.13, -0.42, new THREE.MeshStandardMaterial({ color: '#0e0704', roughness: 1, emissive: '#3a1204', emissiveIntensity: 0.6 }))
  soot.name = 'soot'

  // 장작
  const logMat = new THREE.MeshStandardMaterial({ color: '#3b2112', roughness: 0.9, emissive: '#ff4a10', emissiveIntensity: 0.55 })
  const addLog = (x: number, y: number, z: number, ry: number, rz: number, len: number) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, len, 10), logMat)
    l.rotation.set(0, ry, rz)
    l.position.set(x, y, z)
    fp.add(l)
  }
  addLog(0, 0.3, -0.05, 0, Math.PI / 2, 1.05)
  addLog(-0.15, 0.3, 0.12, 0.3, Math.PI / 2, 0.95)
  addLog(0.1, 0.5, 0.02, -0.35, Math.PI / 2, 0.9)
  addLog(0, 0.28, -0.2, 1.1, Math.PI / 2, 0.8)

  // 불꽃
  const flameMat = (c: number) => new THREE.SpriteMaterial({ map: flameTex(), color: c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
  const flames: { s: THREE.Sprite; bx: number; ph: number; sz: number }[] = []
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(flameMat(i % 3 === 0 ? 0xffd070 : 0xff8a30))
    const bx = (R() - 0.5) * 0.9
    const sz = 0.55 + R() * 0.55
    s.position.set(bx, 0.7, -0.05 + (R() - 0.5) * 0.2)
    s.scale.set(sz * 0.8, sz * 1.5, 1)
    fp.add(s)
    flames.push({ s, bx, ph: R() * 6, sz })
  }
  fireLight.position.set(0, 0.9, 0.4)
  fp.add(fireLight)

  // 스타킹 3개
  const stockCol = ['#c0262d', '#2f7a4a', '#c0262d']
  stockCol.forEach((col, i) => {
    const g = new THREE.Group()
    const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.14), m)
    leg.position.set(0, -0.3, 0)
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.14), m)
    foot.position.set(0.1, -0.62, 0)
    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.18), new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 1 }))
    g.add(leg, foot, cuff)
    g.position.set(-1.1 + i * 1.1, 2.78, 0.72)
    g.rotation.z = (i - 1) * 0.04
    fp.add(g)
  })
  // 리스
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.15, 10, 36), new THREE.MeshStandardMaterial({ color: '#1f5a34', roughness: 0.9 }))
  wreath.position.set(0, 4.5, 0.34)
  fp.add(wreath)
  const bowMat = new THREE.MeshStandardMaterial({ color: '#c0262d', roughness: 0.6 })
  for (const sx of [-1, 1]) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), bowMat)
    lobe.scale.set(1.5, 0.9, 0.6)
    lobe.position.set(sx * 0.17, -0.48, 0.2)
    lobe.rotation.z = sx * 0.5
    wreath.add(lobe)
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bowMat)
  knot.position.set(0, -0.48, 0.22)
  wreath.add(knot)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.283
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshStandardMaterial({ color: '#d4202f', roughness: 0.4 }))
    berry.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.15)
    wreath.add(berry)
  }

  // ── 트리 ──
  const TX = 1.15, TZ = 0.6
  const H = 6.4, Y0 = 0.5, TH = H - Y0, R0 = 2.35, TIERS = 7
  const treeG = new THREE.Group()
  treeG.position.set(TX, 0, TZ)
  scene.add(treeG)
  const surf = (t: number) => {
    const u = (t * TIERS) % 1
    return (R0 * Math.pow(1 - t, 0.92) + 0.04) * (0.74 + 0.26 * (1 - u))
  }
  const env = (t: number) => R0 * Math.pow(1 - t, 0.92) + 0.1

  const core = new THREE.Mesh(new THREE.ConeGeometry(1.9, TH + 0.2, 20), new THREE.MeshStandardMaterial({ color: '#06190d', roughness: 1 }))
  core.position.y = Y0 + TH / 2 + 0.1
  treeG.add(core)
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#4a2d18', roughness: 1 }))
  trunk.position.y = 0.4
  treeG.add(trunk)

  const N = 12000
  const fronds = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 5, 1), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), N)
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), col = new THREE.Color()
  for (let i = 0; i < N; i++) {
    const t = Math.pow(R(), 0.85) * 0.97
    const S = surf(t)
    const th = R() * 6.2832
    const pitch = 0.12 + R() * 0.4
    const len = (0.45 + R() * 0.45) * (1 - t * 0.6)
    const tipR = S * (0.6 + 0.4 * Math.pow(R(), 0.6))
    const baseR = Math.max(0, tipR - len * Math.cos(pitch))
    const cr = (baseR + tipR) / 2
    const tipY = Y0 + t * TH
    pos.set(Math.cos(th) * cr, tipY + (len * Math.sin(pitch)) / 2, Math.sin(th) * cr)
    dir.set(Math.cos(th + (R() - 0.5) * 0.5) * Math.cos(pitch), -Math.sin(pitch), Math.sin(th + (R() - 0.5) * 0.5) * Math.cos(pitch)).normalize()
    q.setFromUnitVectors(up, dir)
    const w = (0.07 + R() * 0.06) * (1 - t * 0.5)
    sc.set(w, len, w)
    m4.compose(pos, q, sc)
    fronds.setMatrixAt(i, m4)
    col.setHSL(0.33 + R() * 0.05, 0.45 + R() * 0.2, 0.09 + R() * 0.14)
    fronds.setColorAt(i, col)
  }
  treeG.add(fronds)

  // 전구 (따뜻한 흰색 위주)
  const NL = 1300
  const lp = new Float32Array(NL * 3)
  const lcBase = new Float32Array(NL * 3)
  const lc = new Float32Array(NL * 3)
  const lph = new Float32Array(NL)
  const lsp = new Float32Array(NL)
  const palette = ['#ffe2a8', '#ffe2a8', '#ffe2a8', '#ffe2a8', '#ffd080', '#ff7a55', '#ffcf6a', '#ffb0b8']
  for (let i = 0; i < NL; i++) {
    const s = i / NL
    const t = 0.04 + 0.9 * (((s * 7) % 1) * 0.0 + R())
    const a = R() * 6.2832
    const r = surf(t) * (0.85 + R() * 0.2)
    lp.set([Math.cos(a) * r, Y0 + t * TH - 0.1 + R() * 0.2, Math.sin(a) * r], i * 3)
    col.set(palette[Math.floor(R() * palette.length)])
    lcBase.set([col.r, col.g, col.b], i * 3)
    lph[i] = R() * 6.28
    lsp[i] = 0.8 + R() * 2.2
  }
  const lg = new THREE.BufferGeometry()
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3))
  lg.setAttribute('color', new THREE.BufferAttribute(lc, 3))
  const lights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 0.3, map: glow, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  treeG.add(lights)

  // 금색 가랜드
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 260; i++) {
    const s = i / 260
    const t = 0.06 + 0.86 * s
    const a = s * Math.PI * 2 * 5
    const r = env(t) * 0.92 + 0.06
    pts.push(new THREE.Vector3(Math.cos(a) * r, Y0 + t * TH, Math.sin(a) * r))
  }
  const garland = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.022, 6), new THREE.MeshStandardMaterial({ color: '#e6b650', metalness: 0.9, roughness: 0.3, emissive: '#5a3404', emissiveIntensity: 0.25 }))
  treeG.add(garland)

  // 장식 구슬
  const ornCols = ['#b3122a', '#d4202f', '#e8b64a', '#e8b64a', '#f2d38a', '#7a0f1f', '#c9ced4', '#d4202f']
  const orns: THREE.Mesh[] = []
  const gold = new THREE.MeshStandardMaterial({ color: '#e6b650', metalness: 1, roughness: 0.3 })
  for (let i = 0; i < 48; i++) {
    const t = 0.06 + 0.84 * Math.pow(R(), 0.8)
    const a = R() * 6.2832
    const rad = 0.13 + R() * 0.08
    const c = ornCols[i % ornCols.length]
    const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 20, 16), new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.18, envMapIntensity: 1.6 }))
    const r = surf(t) * 0.97
    m.position.set(Math.cos(a) * r, Y0 + t * TH, Math.sin(a) * r)
    m.userData = { c, bounce: 0, base: rad }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.28, rad * 0.28, rad * 0.35, 8), gold)
    cap.position.y = rad * 1.05
    m.add(cap)
    treeG.add(m)
    orns.push(m)
  }

  // 별
  const sh = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? 0.24 : 0.56
    const a = Math.PI / 2 + (i * Math.PI) / 5
    i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  sh.closePath()
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 })
  sg.center()
  const starMat = new THREE.MeshStandardMaterial({ color: '#ffd24a', metalness: 0.6, roughness: 0.3, emissive: '#ffb300', emissiveIntensity: 0.9 })
  const star = new THREE.Mesh(sg, starMat)
  star.position.y = H + 0.25
  treeG.add(star)
  const starLight = new THREE.PointLight(0xffd27a, 3, 4, 2)
  starLight.position.y = H + 0.3
  treeG.add(starLight)
  treeLight.position.set(0, 3.2, 0.2)
  treeG.add(treeLight)

  // 트리 치마 + 선물 (고정)
  const giftG = new THREE.Group()
  giftG.position.set(TX, 0, TZ)
  scene.add(giftG)
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.1, 48), new THREE.MeshStandardMaterial({ color: '#6e1218', roughness: 0.9 }))
  skirt.position.y = 0.05
  giftG.add(skirt)
  const wraps = ['#b3122a', '#1f5d3a', '#d9a63c', '#f4efe6', '#2c4a7a', '#8a2a5a', '#b3122a', '#d9a63c', '#1f5d3a']
  const ribs = ['#e6b650', '#f4efe6', '#b3122a', '#b3122a', '#e6b650', '#e6b650', '#f4efe6', '#b3122a', '#f4efe6']
  for (let i = 0; i < 9; i++) {
    const a = 0.1 + (i / 8) * (Math.PI * 0.85) + (i % 2 ? 0.1 : 0)
    const rr = 2.55 + (i % 3) * 0.3
    const w = 0.55 + R() * 0.4, h = 0.4 + R() * 0.45, d = 0.5 + R() * 0.35
    const g = new THREE.Group()
    g.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr * 0.9)
    g.rotation.y = R() * 1.2
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: wraps[i], roughness: 0.55 }))
    const rm = new THREE.MeshStandardMaterial({ color: ribs[i], roughness: 0.35, metalness: 0.3 })
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h + 0.01, d + 0.01), rm)
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, h + 0.01, d * 0.16), rm)
    const bow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), rm)
    bow.scale.set(1.5, 0.8, 1)
    bow.position.y = h / 2 + 0.05
    g.add(box, r1, r2, bow)
    giftG.add(g)
  }

  // 불씨
  const NE = 70
  const ep = new Float32Array(NE * 3)
  const ev = new Float32Array(NE)
  const resetEmber = (i: number) => {
    ep[i * 3] = FX + (R() - 0.5) * 0.8
    ep[i * 3 + 1] = 0.9 + R() * 0.6
    ep[i * 3 + 2] = FZ + 0.2 + R() * 0.3
    ev[i] = 0.5 + R() * 1.1
  }
  for (let i = 0; i < NE; i++) { resetEmber(i); ep[i * 3 + 1] += R() * 2 }
  const eg = new THREE.BufferGeometry()
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3))
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ size: 0.09, map: glow, color: 0xffa050, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  scene.add(embers)

  // ── 크기 맞춤 ──
  const CX = -0.15
  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.setSize(w, h, false)
    composer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    composer.setSize(w, h)
    bloom.setSize(w, h)
    camera.aspect = w / h
    const fov = (camera.fov * Math.PI) / 180
    const visH = Math.max(8.4 / 0.55, 8.2 / (0.96 * camera.aspect))
    const dist = visH / (2 * Math.tan(fov / 2))
    camera.position.set(CX, 4.3, 0 + dist)
    camera.lookAt(CX, 3.4, 0)
    const yc = (0.17 + 0.72) / 2
    camera.setViewOffset(w, h, 0, (0.5 - yc) * h, w, h)
    camera.updateProjectionMatrix()
  }
  fit()
  addEventListener('resize', fit)

  // ── 터치: 드래그로 트리 돌리기, 탭하면 장식/별 ──
  let dragging = false, lastX = 0, sx = 0, sy = 0, st = 0, moved = 0, vel = 0
  const tmp = new THREE.Vector3()
  const pick = (px: number, py: number) => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    const cx = treeG.position.x
    let best: { d: number; kind: 'orn' | 'star'; m: THREE.Object3D } | null = null
    const test = (m: THREE.Object3D, kind: 'orn' | 'star', limit: number) => {
      m.getWorldPosition(tmp)
      const toCamX = camera.position.x - tmp.x, toCamZ = camera.position.z - tmp.z
      if ((tmp.x - cx) * toCamX + (tmp.z - TZ) * toCamZ < 0 && kind === 'orn') return
      const v = tmp.clone().project(camera)
      const d = Math.hypot((v.x * 0.5 + 0.5) * w - px, (-v.y * 0.5 + 0.5) * h - py)
      if (d < limit && (!best || d < best.d)) best = { d, kind, m }
    }
    orns.forEach((o) => test(o, 'orn', 34))
    test(star, 'star', 46)
    return best as { d: number; kind: 'orn' | 'star'; m: THREE.Object3D } | null
  }
  const onDown = (e: PointerEvent) => {
    dragging = true; lastX = sx = e.clientX; sy = e.clientY; st = performance.now(); moved = 0
    canvas.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    moved += Math.abs(dx)
    treeG.rotation.y += dx * 0.012
    vel = dx * 0.7
  }
  const onUp = (e: PointerEvent) => {
    dragging = false
    if (moved < 8 && performance.now() - st < 500) {
      const r = canvas.getBoundingClientRect()
      const hit = pick(e.clientX - r.left, e.clientY - r.top)
      if (hit?.kind === 'orn') {
        hit.m.userData.bounce = 1
        hit.m.getWorldPosition(tmp)
        const v = tmp.clone().project(camera)
        emit('orn', { x: (v.x * 0.5 + 0.5), y: (-v.y * 0.5 + 0.5), c: hit.m.userData.c })
      } else if (hit?.kind === 'star') emit('star')
    }
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', () => { dragging = false })

  // ── 애니메이션 ──
  const clock = new THREE.Clock()
  let starK = 0
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    if (!dragging) {
      treeG.rotation.y += (0.16 + vel) * dt
      vel *= 0.95
    }
    // 전구 반짝
    for (let i = 0; i < NL; i++) {
      const b = 1.1 + 0.6 * Math.sin(t * lsp[i] + lph[i])
      lc[i * 3] = lcBase[i * 3] * b
      lc[i * 3 + 1] = lcBase[i * 3 + 1] * b
      lc[i * 3 + 2] = lcBase[i * 3 + 2] * b
    }
    lg.attributes.color.needsUpdate = true
    // 장식 튕김
    for (const o of orns) {
      const b = o.userData.bounce as number
      if (b > 0) { o.userData.bounce = Math.max(0, b - dt * 2.2); o.scale.setScalar(1 + 0.45 * Math.sin(b * Math.PI)) }
    }
    // 별
    starK += (starTarget - starK) * Math.min(1, dt * 4)
    starMat.emissiveIntensity = 0.9 + starK * 2.4
    starLight.intensity = 3 + starK * 14
    star.rotation.y = Math.sin(t * 0.8) * 0.5
    star.scale.setScalar(1 + starK * 0.18 + Math.sin(t * 3) * 0.02 * starK)
    // 불
    const fl = 0.86 + 0.14 * Math.sin(t * 13) + 0.1 * Math.sin(t * 7.3 + 1) + 0.06 * Math.sin(t * 29)
    fireLight.intensity = 70 * fl
    for (const f of flames) {
      const k = 0.8 + 0.3 * Math.sin(t * (7 + f.ph) + f.ph)
      f.s.scale.set(f.sz * 0.8 * (0.9 + 0.15 * Math.sin(t * 9 + f.ph)), f.sz * 1.5 * k, 1)
      f.s.position.x = f.bx + Math.sin(t * 4 + f.ph) * 0.05
      f.s.position.y = 0.35 + f.sz * 0.55 * k
      f.s.material.opacity = 0.75 + 0.25 * Math.sin(t * 11 + f.ph)
    }
    // 불씨
    for (let i = 0; i < NE; i++) {
      ep[i * 3 + 1] += ev[i] * dt
      ep[i * 3] += Math.sin(t * 2 + i) * dt * 0.15
      if (ep[i * 3 + 1] > 4.2) resetEmber(i)
    }
    eg.attributes.position.needsUpdate = true
    composer.render()
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  cleanup = () => {
    cancelAnimationFrame(raf)
    removeEventListener('resize', fit)
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    renderer.dispose()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <canvas ref="cv" class="room" />
</template>

<style scoped>
.room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 1; touch-action: none; }
</style>
