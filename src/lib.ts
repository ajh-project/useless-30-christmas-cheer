// 응원 문구·공부 항목·D-day 계산 (순수 함수)

export const CHEERS: string[] = [
  '오늘도 한 문제 풀었으면 충분히 잘한 거야 🎄',
  '컴활 1급? 너라면 합격하고도 남지 ✨',
  '엑셀 함수보다 네가 더 대단해 💚',
  '틀린 문제는 합격 점수를 만드는 재료야 🍪',
  '지금 흘리는 땀방울이 내년 자격증이 돼 ⭐',
  'VLOOKUP처럼 나는 항상 네 곁을 찾아가 💌',
  '쉬는 것도 공부의 일부야, 따뜻한 거 마시고 와 ☕',
  '산타도 네가 열심히 하는 거 다 보고 있어 🎅',
  '액세스 쿼리도 결국 해내는 사람, 너야 🔍',
  '크리스마스 선물은 합격증으로 받자 🎁',
  '피벗 테이블처럼 오늘 공부도 차곡차곡 쌓여 📊',
  '졸려도 괜찮아, 5분만 더 해볼까? 우리 같이 🌙',
  '네가 포기하지 않는 모습이 제일 멋있어 🫶',
  '매크로처럼 합격까지 자동으로 달려가자 🚀',
  '오늘의 너에게 100점 줄게 💯',
  '성희 화이팅! 합격은 이미 성희 편이야 🎄',
  '문성희, 오늘도 잘하고 있어. 진짜로 💚',
  '성희야, 힘들면 잠깐 쉬어도 돼. 난 여기 있을게 ☃️',
]

export type Study = { id: string; part: '필기' | '실기'; label: string }

export const STUDY: Study[] = [
  { id: 'w1', part: '필기', label: '컴퓨터 일반' },
  { id: 'w2', part: '필기', label: '스프레드시트 일반' },
  { id: 'w3', part: '필기', label: '데이터베이스 일반' },
  { id: 'p1', part: '실기', label: '스프레드시트 (엑셀)' },
  { id: 'p2', part: '실기', label: '데이터베이스 (액세스)' },
]

/** 오늘 날짜 기준으로 정해지는 "오늘의 응원" (같은 날은 같은 문구) */
export function todayCheer(d = new Date()): string {
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
  return CHEERS[day % CHEERS.length]
}

/** 목표 날짜(yyyy-mm-dd)까지 남은 일수. 잘못된 값이면 null */
export function dDay(target: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(target)
  if (!m) return null
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3])
  const n = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((t - n) / 86400000)
}

/** 크리스마스(12/25)까지 남은 일수 (지났으면 내년 기준) */
export function daysToChristmas(now = new Date()): number {
  const y = now.getFullYear()
  const n = Date.UTC(y, now.getMonth(), now.getDate())
  let c = Date.UTC(y, 11, 25)
  if (c < n) c = Date.UTC(y + 1, 11, 25)
  return Math.round((c - n) / 86400000)
}

/** localStorage는 막힐 수 있어서 항상 try/catch */
export function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장 불가여도 화면은 정상 동작 */
  }
}
