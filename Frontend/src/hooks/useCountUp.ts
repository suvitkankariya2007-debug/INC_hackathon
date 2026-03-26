import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 to `target` with an easing function.
 * Perfect for stat card counter animations.
 */
export function useCountUp(target: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return
    const startValue = 0

    const delayTimer = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Cubic ease-out
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(startValue + (target - startValue) * eased))

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(delayTimer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startTimeRef.current = null
    }
  }, [target, duration, delay])

  return value
}

/**
 * Format a number as Indian currency (₹ lakhs/crores shorthand)
 */
export function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`
  if (abs >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`
  if (abs >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toLocaleString('en-IN')}`
}
