import { useCallback, useRef, useState } from 'react'

export default function useHistory(initial) {
  const [state, setState] = useState(initial)
  const current = useRef(initial)
  const past = useRef([])
  const future = useRef([])
  const gestureBase = useRef(null)

  const record = useCallback((before) => {
    past.current.push(before)
    if (past.current.length > 100) past.current.shift()
    future.current = []
  }, [])

  const set = useCallback(
    (updater) => {
      const before = current.current
      const next = typeof updater === 'function' ? updater(before) : updater
      if (next === before) return
      current.current = next
      if (gestureBase.current === null) record(before)
      setState(next)
    },
    [record]
  )

  const beginGesture = useCallback(() => {
    if (gestureBase.current === null) gestureBase.current = current.current
  }, [])

  const endGesture = useCallback(() => {
    const base = gestureBase.current
    gestureBase.current = null
    if (base && base !== current.current) record(base)
  }, [record])

  const undo = useCallback(() => {
    if (!past.current.length) return
    gestureBase.current = null
    const prev = past.current.pop()
    future.current.push(current.current)
    current.current = prev
    setState(prev)
  }, [])

  const redo = useCallback(() => {
    if (!future.current.length) return
    gestureBase.current = null
    const next = future.current.pop()
    past.current.push(current.current)
    current.current = next
    setState(next)
  }, [])

  const replace = useCallback((next) => {
    gestureBase.current = null
    current.current = next
    past.current = []
    future.current = []
    setState(next)
  }, [])

  const canUndo = useCallback(() => past.current.length > 0, [])
  const canRedo = useCallback(() => future.current.length > 0, [])

  return { state, set, beginGesture, endGesture, undo, redo, replace, canUndo, canRedo }
}
