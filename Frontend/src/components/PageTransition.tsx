import React, { useEffect, useState, useRef } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  pageKey: string
}

/**
 * Wraps page content in a smooth iOS-style fade + translate-up transition.
 * When `pageKey` changes, the old content fades out while new content fades in.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey }) => {
  const [displayChildren, setDisplayChildren] = useState(children)
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle')
  const prevKey = useRef(pageKey)

  useEffect(() => {
    if (pageKey === prevKey.current) return
    prevKey.current = pageKey

    // Start exit
    setPhase('exit')

    const t1 = setTimeout(() => {
      setDisplayChildren(children)
      setPhase('enter')

      const t2 = setTimeout(() => setPhase('idle'), 350)
      return () => clearTimeout(t2)
    }, 200)

    return () => clearTimeout(t1)
  }, [pageKey, children])

  const style: React.CSSProperties = {
    transition: 'opacity 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.16,1,0.3,1)',
    opacity: phase === 'exit' ? 0 : 1,
    transform:
      phase === 'exit'
        ? 'translateY(6px) scale(0.995)'
        : phase === 'enter'
          ? 'translateY(10px) scale(0.997)'
          : 'translateY(0) scale(1)',
    willChange: 'transform, opacity',
    height: '100%',
  }

  return <div style={style}>{displayChildren}</div>
}
