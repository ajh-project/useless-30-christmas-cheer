<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CHEERS, todayCheer } from './lib'

const emit = defineEmits<{ close: [] }>()

// ── ASCII 트리: 줄마다 폭이 늘어나는 삼각형, 장식 자리는 고정 시드로 결정 ──
const H = 13
const COLORS = ['#ff6b81', '#ffd166', '#74d3ff', '#ff9ff3', '#9bff9b']
type Cell = { ch: string; kind: 'leaf' | 'orn' | 'star' | 'trunk' | 'sp'; c?: string }

function seeded(n: number) {
  const x = Math.sin(n * 91.7) * 10000
  return x - Math.floor(x)
}

const rows: Cell[][] = []
rows.push([{ ch: '★', kind: 'star' }])
for (let r = 0; r < H; r++) {
  const w = 1 + r * 2 + 2
  const row: Cell[] = []
  for (let i = 0; i < w; i++) {
    const s = seeded(r * 31 + i)
    if (i === 0) row.push({ ch: '/', kind: 'leaf' })
    else if (i === w - 1) row.push({ ch: '\\', kind: 'leaf' })
    else if (s > 0.8) row.push({ ch: 'o', kind: 'orn', c: COLORS[Math.floor(seeded(r * 7 + i * 3) * COLORS.length)] })
    else row.push({ ch: s > 0.4 ? '*' : '^', kind: 'leaf' })
  }
  rows.push(row)
}
rows.push([{ ch: '|', kind: 'trunk' }, { ch: '_', kind: 'trunk' }, { ch: '|', kind: 'trunk' }])
const maxW = 1 + (H - 1) * 2 + 2

// ── 깜빡임·타이핑 ──
const tick = ref(0)
const lines = ref<string[]>([])
const typing = ref('')
const script = [
  '$ git checkout -b christmas-cheer',
  'Switched to a new branch \'christmas-cheer\'',
  '$ ./cheer --to "문성희" --goal "컴활 1급"',
  'loading 응원 ...  ████████████ 100%',
  '',
]
let timers: number[] = []
let ended = false

function wait(ms: number) {
  return new Promise<void>((res) => timers.push(window.setTimeout(res, ms)))
}

async function play() {
  for (const l of script) {
    if (ended) return
    if (l.startsWith('$')) {
      typing.value = ''
      for (const ch of l) {
        if (ended) return
        typing.value += ch
        await wait(35)
      }
      lines.value.push(typing.value)
      typing.value = ''
    } else {
      lines.value.push(l)
    }
    await wait(250)
  }
  lines.value.push('> ' + todayCheer())
}

async function more() {
  const c = CHEERS[Math.floor(Math.random() * CHEERS.length)]
  lines.value.push('$ ./cheer --more')
  lines.value.push('> ' + c)
  if (lines.value.length > 14) lines.value.splice(0, lines.value.length - 14)
}

onMounted(() => {
  const id = window.setInterval(() => tick.value++, 450)
  timers.push(id)
  play()
})
onBeforeUnmount(() => {
  ended = true
  timers.forEach((t) => { clearTimeout(t); clearInterval(t) })
})

const starOn = computed(() => tick.value % 2 === 0)
function ornOn(r: number, i: number) {
  return (tick.value + r * 3 + i) % 3 !== 0
}
</script>

<template>
  <div class="term">
    <div class="titlebar">
      <span class="dots"><i /><i /><i /></span>
      <span class="name">christmas-cheer — zsh</span>
      <button class="close" @click="emit('close')">✕ 닫기</button>
    </div>

    <div class="snowfall" aria-hidden="true">
      <span v-for="n in 24" :key="n" :style="{ left: ((n * 37) % 100) + '%', animationDelay: -((n * 13) % 9) + 's', animationDuration: 7 + (n % 5) + 's' }">❄</span>
    </div>

    <pre class="tree"><template v-for="(row, r) in rows" :key="r"><span class="pad">{{ ' '.repeat(Math.floor((maxW - row.length) / 2)) }}</span><template v-for="(cell, i) in row" :key="i"><span
      v-if="cell.kind === 'star'" :class="['star', { off: !starOn }]">{{ cell.ch }}</span><span
      v-else-if="cell.kind === 'orn'" class="orn" :style="{ color: ornOn(r, i) ? cell.c : '#2a5a3a' }">{{ cell.ch }}</span><span
      v-else-if="cell.kind === 'trunk'" class="trunk">{{ cell.ch }}</span><span
      v-else class="leaf">{{ cell.ch }}</span></template>
</template></pre>
    <p class="merry">Merry Christmas, 성희 화이팅! ♥</p>

    <div class="log">
      <div v-for="(l, i) in lines" :key="i" :class="{ ok: l.startsWith('>'), cmd: l.startsWith('$') }">{{ l || ' ' }}</div>
      <div v-if="typing" class="cmd">{{ typing }}<b class="cur" /></div>
      <div v-else class="cmd">$ <b class="cur" /></div>
    </div>

    <button class="more" @click="more">./cheer --more</button>
  </div>
</template>

<style scoped>
.term {
  position: absolute; inset: 0; z-index: 30; background: #0a0f14; color: #c8e6c9;
  font-family: 'Cascadia Mono', 'D2Coding', Consolas, monospace;
  display: flex; flex-direction: column; align-items: center; overflow: hidden;
  padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
}
.titlebar { width: 100%; display: flex; align-items: center; gap: 10px; padding: calc(env(safe-area-inset-top) + 8px) 12px 8px; background: #151c24; font-size: 13px; }
.dots { display: flex; gap: 6px; }
.dots i { width: 11px; height: 11px; border-radius: 50%; background: #ff5f57; }
.dots i:nth-child(2) { background: #febc2e; }
.dots i:nth-child(3) { background: #28c840; }
.name { flex: 1; text-align: center; color: #8aa0b0; }
.close { color: #8aa0b0; font-size: 13px; }
.snowfall span { position: absolute; top: -20px; color: #cfe8ff; opacity: .7; font-size: 14px; animation: fall linear infinite; pointer-events: none; }
.tree {
  margin-top: 18px; line-height: 1.15; font-size: clamp(12px, 3.8vw, 17px); text-align: left;
  font-family: inherit; white-space: pre; user-select: none;
}
.leaf { color: #3fbf6a; }
.trunk { color: #b07a45; }
.orn { transition: color .2s; text-shadow: 0 0 6px currentColor; font-weight: 700; }
.star { color: #ffd84a; text-shadow: 0 0 10px #ffb300; transition: opacity .2s; }
.star.off { opacity: .35; }
.merry { margin: 10px 0 6px; color: #ff9fb3; font-size: 15px; text-shadow: 0 0 8px rgba(255,107,129,.6); }
.log { width: 100%; max-width: 480px; flex: 1; min-height: 0; overflow: hidden; padding: 8px 16px; font-size: 14px; line-height: 1.6; display: flex; flex-direction: column; justify-content: flex-end; word-break: keep-all; }
.cmd { color: #8be9fd; }
.ok { color: #ffd166; }
.cur { display: inline-block; width: 8px; height: 15px; background: #c8e6c9; vertical-align: middle; margin-left: 2px; animation: blink 1s steps(1) infinite; }
.more { margin-top: 6px; padding: 10px 18px; border: 1px solid #3fbf6a; border-radius: 8px; color: #3fbf6a; font-family: inherit; font-size: 14px; }
.more:active { background: #3fbf6a33; }
@keyframes blink { 50% { opacity: 0 } }
@keyframes fall { to { transform: translateY(110vh) translateX(20px) } }
</style>
