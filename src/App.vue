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

// 전구 줄 위의 반짝이 전구 [x, y, 색]
const BULBS: [number, number, string][] = [
  [48, 106, '#ff6b81'], [64, 112, '#ffd166'], [82, 117, '#74d3ff'], [100, 119, '#ff9ff3'], [118, 117, '#9bff9b'], [136, 112, '#ff6b81'], [152, 106, '#ffd166'],
  [34, 156, '#74d3ff'], [54, 166, '#ff9ff3'], [76, 172, '#ffd166'], [100, 174, '#ff6b81'], [124, 172, '#74d3ff'], [146, 166, '#9bff9b'], [166, 156, '#ff9ff3'],
  [22, 208, '#ffd166'], [44, 218, '#ff6b81'], [70, 225, '#74d3ff'], [100, 227, '#ffd166'], [130, 225, '#ff9ff3'], [156, 218, '#9bff9b'], [178, 208, '#ff6b81'],
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
          <defs>
            <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#3fb36e" /><stop offset=".55" stop-color="#1f8048" /><stop offset="1" stop-color="#145a32" />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#4cc47c" /><stop offset=".55" stop-color="#25904f" /><stop offset="1" stop-color="#186a3a" />
            </linearGradient>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#5ad68b" /><stop offset=".55" stop-color="#2ea15a" /><stop offset="1" stop-color="#1c7a44" />
            </linearGradient>
            <linearGradient id="gt" x1="0" x2="1"><stop offset="0" stop-color="#7a4f2a" /><stop offset=".5" stop-color="#b17a45" /><stop offset="1" stop-color="#6b4424" /></linearGradient>
            <radialGradient id="halo"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".35" /><stop offset="1" stop-color="#ffe9a8" stop-opacity="0" /></radialGradient>
          </defs>
          <circle cx="100" cy="120" r="100" fill="url(#halo)" />
          <!-- 줄기 -->
          <rect x="85" y="196" width="30" height="34" rx="5" fill="url(#gt)" />
          <!-- 아래층 -->
          <path d="M100 100 L194 204 Q182 214 168 206 Q152 218 136 208 Q118 220 100 210 Q82 220 64 208 Q48 218 32 206 Q18 214 6 204 Z" fill="url(#g3)" />
          <!-- 가운데층 -->
          <path d="M100 58 L182 152 Q170 162 156 154 Q140 166 124 156 Q112 164 100 158 Q88 164 76 156 Q60 166 44 154 Q30 162 18 152 Z" fill="url(#g2)" />
          <!-- 윗층 -->
          <path d="M100 20 L166 104 Q154 112 140 106 Q124 116 112 108 Q100 116 88 108 Q76 116 60 106 Q46 112 34 104 Z" fill="url(#g1)" />
          <!-- 잎 결(밝은 줄) -->
          <g stroke="#7be8a4" stroke-opacity=".35" stroke-width="2" stroke-linecap="round" fill="none">
            <path d="M92 36 L62 92" /><path d="M86 78 L40 140" /><path d="M80 122 L26 192" />
          </g>
          <g stroke="#0e4a28" stroke-opacity=".3" stroke-width="2" stroke-linecap="round" fill="none">
            <path d="M112 36 L140 92" /><path d="M116 78 L160 140" /><path d="M120 122 L176 192" />
          </g>
          <!-- 가지 끝 눈 -->
          <g fill="#fff" fill-opacity=".92">
            <ellipse cx="38" cy="105" rx="7" ry="3" /><ellipse cx="62" cy="108" rx="6" ry="2.6" /><ellipse cx="100" cy="115" rx="6" ry="2.6" />
            <ellipse cx="138" cy="108" rx="6" ry="2.6" /><ellipse cx="162" cy="105" rx="7" ry="3" />
            <ellipse cx="22" cy="153" rx="8" ry="3" /><ellipse cx="46" cy="159" rx="7" ry="2.8" /><ellipse cx="100" cy="162" rx="7" ry="2.8" />
            <ellipse cx="154" cy="159" rx="7" ry="2.8" /><ellipse cx="178" cy="153" rx="8" ry="3" />
            <ellipse cx="12" cy="205" rx="9" ry="3.2" /><ellipse cx="36" cy="212" rx="8" ry="3" /><ellipse cx="66" cy="214" rx="8" ry="3" />
            <ellipse cx="100" cy="216" rx="8" ry="3" /><ellipse cx="134" cy="214" rx="8" ry="3" /><ellipse cx="164" cy="212" rx="8" ry="3" /><ellipse cx="188" cy="205" rx="9" ry="3.2" />
            <path d="M100 20 L92 38 Q100 34 108 38 Z" />
          </g>
          <!-- 전구 줄 -->
          <path d="M42 100 Q100 122 158 100" stroke="#c9a24a" stroke-width="1.2" fill="none" />
          <path d="M24 148 Q100 176 176 148" stroke="#c9a24a" stroke-width="1.2" fill="none" />
          <path d="M10 200 Q100 232 190 200" stroke="#c9a24a" stroke-width="1.2" fill="none" />
          <g class="bulbs">
            <circle v-for="(b, i) in BULBS" :key="i" :cx="b[0]" :cy="b[1]" r="2.6" :fill="b[2]" :style="{ animationDelay: (i % 5) * 0.3 + 's', color: b[2] }" />
          </g>
          <!-- 선물 상자 -->
          <g>
            <rect x="22" y="212" width="32" height="22" rx="2" fill="#e8455f" /><rect x="35" y="212" width="6" height="22" fill="#ffe9a8" /><rect x="22" y="220" width="32" height="5" fill="#ffe9a8" />
            <path d="M38 212 q-8 -9 -2 -9 q5 0 2 9 q3 -9 8 -9 q6 0 -8 9z" fill="#ffe9a8" />
            <rect x="140" y="218" width="26" height="16" rx="2" fill="#4aa8ff" /><rect x="150" y="218" width="6" height="16" fill="#fff" /><rect x="140" y="224" width="26" height="4" fill="#fff" />
            <rect x="158" y="224" width="22" height="10" rx="2" fill="#b57bff" /><rect x="166" y="224" width="5" height="10" fill="#ffe9a8" />
          </g>
        </svg>
        <button
          v-for="(o, i) in ORNAMENTS" :key="i" class="orn"
          :style="{ left: o.x + '%', top: o.y + '%', background: o.c, animationDelay: i * 0.23 + 's' }"
          @click="tapOrnament(i)" aria-label="응원 장식"
        />
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
.bulbs circle { animation: twinkle 1.1s ease-in-out infinite alternate; filter: drop-shadow(0 0 3px currentColor); }
.star { position: absolute; left: 50%; top: -4%; transform: translateX(-50%); font-size: clamp(34px, 9vw, 48px);
  color: #d8b94e; text-shadow: 0 0 10px rgba(255,216,74,.6); transition: .3s; z-index: 3; line-height: 1; }
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
