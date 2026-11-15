<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import confetti from 'canvas-confetti'
import Terminal from './Terminal.vue'
import Room3D from './Room3D.vue'
import { CHEERS, STUDY, dDay, daysToChristmas, load, save, todayCheer } from './lib'

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

// 3D 트리 장식을 탭했을 때 (x, y는 화면 비율 0~1)
function onOrn(p: { x: number; y: number; c: string }) {
  pickCheer()
  confetti({
    particleCount: 26, spread: 60, startVelocity: 20, scalar: 0.8,
    origin: { x: p.x, y: p.y },
    colors: [p.c, '#ffe2a8', '#ffffff'],
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
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#e6b650', '#d4202f', '#ffe2a8'] })
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#e6b650', '#d4202f', '#ffe2a8'] })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

function tapStar() {
  starOn.value = !starOn.value
  if (starOn.value) {
    message.value = '별이 반짝! 오늘도 성희가 제일 빛나 ⭐'
    bump.value++
    confetti({ particleCount: 60, spread: 90, origin: { x: 0.6, y: 0.22 }, colors: ['#ffd166', '#fff'] })
  }
}
</script>

<template>
  <div class="room-wrap">
    <Room3D :star-on="starOn" @orn="onOrn" @star="tapStar" />
    <div class="vignette" />

    <div class="head">
      <header class="top">
        <div class="chip">🎅 크리스마스까지 D-{{ xmas === 0 ? 'DAY' : xmas }}</div>
        <div v-if="dd !== null" class="chip pink">
          📝 컴활 1급 {{ dd > 0 ? 'D-' + dd : dd === 0 ? 'D-DAY 🔥' : '시험 끝! 수고했어 💐' }}
        </div>
      </header>
      <h1 class="title">성희 화이팅! 🎄</h1>
      <p class="sub">문성희 컴활 1급 합격 기원 ✨</p>
    </div>

    <div class="spacer" />
    <p class="hint">장식·별을 눌러봐 · 옆으로 밀면 트리가 돌아가요</p>

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
          <div class="row head2">
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
.room-wrap {
  position: relative; height: 100%; display: flex; flex-direction: column; align-items: center;
  background: #1a0f09;
  padding: env(safe-area-inset-top) 16px calc(env(safe-area-inset-bottom) + 14px);
  overflow: hidden;
}
.vignette { position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 48%, transparent 45%, rgba(10,4,1,.6) 100%); }
.head { z-index: 6; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
.top { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 14px; }
.chip { background: rgba(40,20,8,.55); border: 1px solid rgba(255,210,150,.25); padding: 6px 12px; border-radius: 999px; font-size: 14px; color: #ffe9c8; backdrop-filter: blur(6px); }
.chip.pink { background: rgba(160,30,40,.5); }
.title { margin-top: 10px; font-size: clamp(28px, 7.4vw, 40px); letter-spacing: 1px; font-weight: 400; color: #fff4dc;
  text-shadow: 0 0 16px rgba(255,190,100,.85), 0 3px 0 #8a1f26; }
.sub { margin-top: 4px; font-size: 15px; color: #ffd9a0; text-shadow: 0 0 8px rgba(255,170,80,.6); }
.spacer { flex: 1; pointer-events: none; }
.hint { z-index: 6; font-size: 12px; color: rgba(255,226,180,.7); pointer-events: none; text-shadow: 0 1px 3px #000; }

.bubble { z-index: 6; width: 100%; max-width: 440px; margin: 8px 0 10px; background: #fff8ec; color: #5a2335;
  border-radius: 22px; padding: 14px 18px; text-align: center; font-size: clamp(17px, 4.6vw, 20px); line-height: 1.5;
  box-shadow: 0 6px 0 #c9884a, 0 10px 24px rgba(0,0,0,.45); animation: pop .4s; word-break: keep-all; }
.bar { z-index: 6; display: flex; gap: 10px; width: 100%; max-width: 440px; }
.btn { flex: 1; padding: 14px 8px; border-radius: 16px; background: rgba(60,32,14,.7); border: 1px solid rgba(255,210,150,.25); color: #ffe9c8; font-size: 16px; backdrop-filter: blur(6px); }
.btn.main { background: #b3242f; border-color: transparent; color: #fff; box-shadow: 0 4px 0 #6e141b; }
.btn:active { transform: translateY(2px); }

.sheet { position: absolute; inset: 0; background: rgba(0,0,0,.5); z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.card { width: 100%; max-width: 440px; background: #fff7f2; color: #4a2a30; border-radius: 26px 26px 0 0; padding: 18px 18px calc(env(safe-area-inset-bottom) + 18px); max-height: 82%; overflow: auto; }
.row.head2 { display: flex; justify-content: space-between; align-items: center; font-size: 19px; }
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

@keyframes pop { from { transform: scale(.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
</style>
