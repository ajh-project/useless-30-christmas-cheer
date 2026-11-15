<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import confetti from 'canvas-confetti'
import Terminal from './Terminal.vue'
import { CHEERS, STUDY, dDay, daysToChristmas, load, save, todayCheer } from './lib'

// ── 트리 장식 (위치는 % 단위, 탭하면 응원 문구) ──
const ORNAMENTS = [
  { x: 50, y: 30, c: '#ff6b81' }, { x: 40, y: 42, c: '#ffd166' }, { x: 60, y: 44, c: '#74d3ff' },
  { x: 32, y: 56, c: '#ff9ff3' }, { x: 50, y: 58, c: '#ff6b81' }, { x: 68, y: 57, c: '#ffd166' },
  { x: 24, y: 70, c: '#74d3ff' }, { x: 41, y: 72, c: '#ff9ff3' }, { x: 59, y: 73, c: '#ff6b81' },
  { x: 76, y: 71, c: '#ffd166' },
]

const message = ref(todayCheer())
const bump = ref(0)
const starOn = ref(false)
const checked = ref<string[]>(load('cheer.checked', []))
const examDate = ref<string>(load('cheer.exam', ''))
const panel = ref(false)
const term = ref(false)

const done = computed(() => checked.value.length)
const percent = computed(() => Math.round((done.value / STUDY.length) * 100))
const dd = computed(() => dDay(examDate.value))
const xmas = daysToChristmas()

watch(checked, (v) => save('cheer.checked', v), { deep: true })
watch(examDate, (v) => save('cheer.exam', v))

function pickCheer() {
  let next = message.value
  while (next === message.value) next = CHEERS[Math.floor(Math.random() * CHEERS.length)]
  message.value = next
  bump.value++
  navigator.vibrate?.(20)
}

function tapOrnament(i: number) {
  pickCheer()
  const o = ORNAMENTS[i]
  confetti({
    particleCount: 24, spread: 60, startVelocity: 22, scalar: 0.8,
    origin: { x: 0.5 + (o.x - 50) / 250, y: 0.3 + (o.y / 100) * 0.35 },
    colors: [o.c, '#ffffff', '#ffd166'],
  })
}

function toggle(id: string) {
  const i = checked.value.indexOf(id)
  if (i >= 0) checked.value.splice(i, 1)
  else {
    checked.value.push(id)
    if (checked.value.length === STUDY.length) celebrate()
  }
}

function celebrate() {
  starOn.value = true
  message.value = '전 과목 체크 완료!! 너 진짜 최고야 🏆🎄'
  bump.value++
  panel.value = false
  const end = Date.now() + 1500
  ;(function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 } })
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

function tapStar() {
  starOn.value = !starOn.value
  if (starOn.value) {
    message.value = '별이 반짝! 오늘도 네가 제일 빛나 ⭐'
    bump.value++
    confetti({ particleCount: 60, spread: 90, origin: { x: 0.5, y: 0.2 }, colors: ['#ffd166', '#fff'] })
  }
}

// ── 눈 내리기 (canvas) ──
const cv = ref<HTMLCanvasElement>()
let raf = 0
let onResize: (() => void) | null = null
onMounted(() => {
  const c = cv.value!
  const ctx = c.getContext('2d')!
  type F = { x: number; y: number; r: number; v: number; s: number; p: number }
  let flakes: F[] = []
  const fit = () => {
    c.width = innerWidth * devicePixelRatio
    c.height = innerHeight * devicePixelRatio
    flakes = Array.from({ length: Math.min(110, Math.floor(innerWidth / 4)) }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: (1 + Math.random() * 2.6) * devicePixelRatio,
      v: (0.4 + Math.random() * 1.1) * devicePixelRatio,
      s: Math.random() * 0.002 + 0.0005, p: Math.random() * 6.28,
    }))
  }
  fit()
  onResize = fit
  addEventListener('resize', fit)
  const loop = (t: number) => {
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (const f of flakes) {
      f.y += f.v
      f.x += Math.sin(t * f.s + f.p) * 0.6 * devicePixelRatio
      if (f.y > c.height + 5) { f.y = -5; f.x = Math.random() * c.width }
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.r, 0, 6.283)
      ctx.fill()
    }
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  if (onResize) removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="sky">
    <canvas ref="cv" class="snow" />
    <div class="moon" />

    <header class="top">
      <div class="chip">🎅 크리스마스까지 D-{{ xmas === 0 ? 'DAY' : xmas }}</div>
      <div v-if="dd !== null" class="chip pink">
        📝 컴활 1급 {{ dd > 0 ? 'D-' + dd : dd === 0 ? 'D-DAY 🔥' : '시험 끝! 수고했어 💐' }}
      </div>
    </header>

    <h1 class="title">성희 화이팅! 🎄</h1>
    <p class="sub">문성희 컴활 1급 합격 기원 ✨</p>

    <main class="stage">
      <div class="tree">
        <button class="star" :class="{ on: starOn }" @click="tapStar" aria-label="별">★</button>
        <svg viewBox="0 0 200 240" class="svg">
          <polygon points="100,18 168,100 32,100" fill="#2e9e5b" />
          <polygon points="100,58 182,148 18,148" fill="#26884d" />
          <polygon points="100,100 194,200 6,200" fill="#1f7340" />
          <rect x="86" y="198" width="28" height="30" rx="4" fill="#9a6a3c" />
          <path d="M40 100 Q100 116 160 100" stroke="#ffe9a8" stroke-width="2" fill="none" stroke-dasharray="2 6" stroke-linecap="round" class="lights" />
          <path d="M26 148 Q100 168 174 148" stroke="#ffe9a8" stroke-width="2" fill="none" stroke-dasharray="2 6" stroke-linecap="round" class="lights" />
        </svg>
        <button
          v-for="(o, i) in ORNAMENTS" :key="i" class="orn"
          :style="{ left: o.x + '%', top: o.y + '%', background: o.c, animationDelay: i * 0.23 + 's' }"
          @click="tapOrnament(i)" aria-label="응원 장식"
        />
        <div class="face">•ᴗ•</div>
      </div>
      <div class="snowground" />
    </main>

    <section class="bubble" :key="bump">
      <p>{{ message }}</p>
    </section>

    <footer class="bar">
      <button class="btn main" @click="pickCheer">💌 응원 받기</button>
      <button class="btn" @click="panel = true">📚 공부 {{ done }}/{{ STUDY.length }}</button>
      <button class="btn" @click="term = true">💻 터미널</button>
    </footer>

    <Terminal v-if="term" @close="term = false" />

    <transition name="up">
      <div v-if="panel" class="sheet" @click.self="panel = false">
        <div class="card">
          <div class="row head">
            <b>📚 컴활 1급 체크리스트</b>
            <button class="x" @click="panel = false">✕</button>
          </div>
          <div class="gauge"><i :style="{ width: percent + '%' }" /><span>{{ percent }}%</span></div>
          <template v-for="part in ['필기', '실기'] as const" :key="part">
            <div class="part">{{ part }}</div>
            <label v-for="s in STUDY.filter((x) => x.part === part)" :key="s.id" class="item" :class="{ on: checked.includes(s.id) }">
              <input type="checkbox" :checked="checked.includes(s.id)" @change="toggle(s.id)" />
              <span class="box">{{ checked.includes(s.id) ? '🎁' : '' }}</span>
              {{ s.label }}
            </label>
          </template>
          <div class="part">시험 날짜 (D-day)</div>
          <input class="date" type="date" v-model="examDate" />
          <p class="note">체크·날짜는 이 기기 안에만 저장돼요.</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.sky {
  position: relative; height: 100%; display: flex; flex-direction: column; align-items: center;
  background: radial-gradient(120% 80% at 50% 0%, #1d3a7a 0%, #0b1b3a 60%, #070f24 100%);
  padding: env(safe-area-inset-top) 16px calc(env(safe-area-inset-bottom) + 14px);
  overflow: hidden;
}
.snow { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
.moon { position: absolute; top: 9%; right: 8%; width: 54px; height: 54px; border-radius: 50%;
  background: #fff7d6; box-shadow: 0 0 40px 10px rgba(255, 247, 214, 0.35); }
.top { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 14px; z-index: 2; }
.chip { background: rgba(255,255,255,.14); padding: 6px 12px; border-radius: 999px; font-size: 14px; backdrop-filter: blur(6px); }
.chip.pink { background: rgba(255,107,129,.35); }
.title { z-index: 2; margin-top: 10px; font-size: clamp(26px, 7vw, 38px); letter-spacing: 1px; font-weight: 400;
  text-shadow: 0 0 14px rgba(255,233,168,.8), 0 3px 0 #b8324a; }

.sub { z-index: 2; margin-top: 4px; font-size: 15px; color: #ffe9a8; text-shadow: 0 0 8px rgba(255,233,168,.6); }
.stage { position: relative; flex: 1; width: 100%; max-width: 440px; min-height: 0; display: flex; justify-content: center; align-items: flex-end; }
.tree { position: relative; height: min(96%, 92vw); aspect-ratio: 200 / 240; z-index: 2; margin-bottom: 14px; animation: sway 5s ease-in-out infinite; transform-origin: bottom center; }
.svg { width: 100%; height: 100%; filter: drop-shadow(0 8px 14px rgba(0,0,0,.4)); }
.lights { animation: twinkle 1.4s ease-in-out infinite alternate; }
.star { position: absolute; left: 50%; top: -4%; transform: translateX(-50%); font-size: clamp(34px, 9vw, 48px);
  color: #8a7a3a; transition: .3s; z-index: 3; line-height: 1; }
.star.on { color: #ffd84a; text-shadow: 0 0 18px #ffd84a, 0 0 40px #ffb300; animation: pulse 1.2s infinite; }
.orn { position: absolute; width: 7%; aspect-ratio: 1; border-radius: 50%; transform: translate(-50%, -50%);
  box-shadow: inset -3px -3px 5px rgba(0,0,0,.25), inset 3px 3px 5px rgba(255,255,255,.55);
  animation: bob 2.2s ease-in-out infinite; z-index: 3; }
.orn::after { content: ''; position: absolute; inset: -40%; } /* 터치 영역 확대 */
.face { position: absolute; left: 50%; top: 82%; transform: translateX(-50%); font-size: clamp(11px, 3vw, 14px); color: #fff; opacity: .95; letter-spacing: 3px; pointer-events: none; }
.snowground { position: absolute; left: -10%; right: -10%; bottom: -2px; height: 46px; background: #eaf3ff; border-radius: 50% 50% 0 0 / 100% 100% 0 0; z-index: 1; box-shadow: 0 -4px 20px rgba(255,255,255,.3); }

.bubble { z-index: 6; width: 100%; max-width: 440px; margin: 12px 0 10px; background: #fff; color: #5a2335;
  border-radius: 22px; padding: 14px 18px; text-align: center; font-size: clamp(17px, 4.6vw, 20px); line-height: 1.5;
  box-shadow: 0 6px 0 #ffb3c1, 0 10px 24px rgba(0,0,0,.3); animation: pop .4s; word-break: keep-all; }
.bar { z-index: 6; display: flex; gap: 10px; width: 100%; max-width: 440px; }
.btn { flex: 1; padding: 14px 8px; border-radius: 16px; background: rgba(255,255,255,.16); font-size: 16px; backdrop-filter: blur(6px); }
.btn.main { background: #e8455f; box-shadow: 0 4px 0 #a82a40; }
.btn:active { transform: translateY(2px); }

.sheet { position: absolute; inset: 0; background: rgba(0,0,0,.5); z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.card { width: 100%; max-width: 440px; background: #fff7f2; color: #4a2a30; border-radius: 26px 26px 0 0; padding: 18px 18px calc(env(safe-area-inset-bottom) + 18px); max-height: 82%; overflow: auto; }
.row.head { display: flex; justify-content: space-between; align-items: center; font-size: 19px; }
.x { font-size: 20px; padding: 4px 8px; }
.gauge { position: relative; height: 22px; border-radius: 99px; background: #ffe0e6; margin: 12px 0 4px; overflow: hidden; }
.gauge i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, #4cc27a, #2e9e5b); transition: width .4s; }
.gauge span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; color: #3a1d24; }
.part { margin: 14px 0 6px; font-size: 14px; color: #b8324a; }
.item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: #fff; margin-bottom: 6px; font-size: 17px; cursor: pointer; }
.item.on { background: #e6f8ec; text-decoration: line-through; color: #6a8f77; }
.item input { display: none; }
.box { width: 26px; height: 26px; border-radius: 8px; border: 2px solid #e8455f; display: grid; place-items: center; font-size: 16px; }
.item.on .box { border-color: #2e9e5b; }
.date { width: 100%; padding: 10px; border-radius: 12px; border: 2px solid #ffc2cd; font: inherit; background: #fff; color: #4a2a30; }
.note { margin-top: 10px; font-size: 12px; color: #9a7a80; text-align: center; }
.up-enter-active, .up-leave-active { transition: opacity .25s; }
.up-enter-active .card, .up-leave-active .card { transition: transform .3s; }
.up-enter-from, .up-leave-to { opacity: 0; }
.up-enter-from .card, .up-leave-to .card { transform: translateY(100%); }

@keyframes sway { 0%,100% { transform: rotate(-.8deg) } 50% { transform: rotate(.8deg) } }
@keyframes twinkle { from { opacity: .35 } to { opacity: 1 } }
@keyframes bob { 0%,100% { transform: translate(-50%, -50%) } 50% { transform: translate(-50%, -42%) } }
@keyframes pulse { 50% { transform: translateX(-50%) scale(1.18) } }
@keyframes pop { from { transform: scale(.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
</style>
