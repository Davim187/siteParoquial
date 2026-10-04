/** Agenda tarefas leves no idle, uma por vez, para não saturar a rede nem o thread. */
export function scheduleIdleTasks(tasks: Array<() => void>, gapMs = 90) {
  let index = 0
  let cancelled = false
  let idleId = 0
  let timerId = 0

  const runNext = () => {
    if (cancelled || index >= tasks.length) return
    try {
      tasks[index++]()
    } catch {
      index += 1
    }
    if (index >= tasks.length || cancelled) return
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(runNext, { timeout: gapMs + 400 })
    } else {
      timerId = window.setTimeout(runNext, gapMs)
    }
  }

  if (typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(runNext, { timeout: 1200 })
  } else {
    timerId = window.setTimeout(runNext, 200)
  }

  return () => {
    cancelled = true
    if (idleId && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId)
    }
    if (timerId) window.clearTimeout(timerId)
  }
}
