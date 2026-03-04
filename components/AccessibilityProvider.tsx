"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type FontSize = 'normal' | 'large' | 'xlarge'
type Contrast = 'normal' | 'high'

interface AccessibilityContextType {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  contrast: Contrast
  setContrast: (contrast: Contrast) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>('normal')
  const [contrast, setContrast] = useState<Contrast>('normal')
  const [mounted, setMounted] = useState(false)

  // Load from localStorage if available
  useEffect(() => {
    const savedFontSize = localStorage.getItem('a11y-fontSize') as FontSize
    const savedContrast = localStorage.getItem('a11y-contrast') as Contrast
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedFontSize) setFontSize(savedFontSize)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedContrast) setContrast(savedContrast)
    setMounted(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('a11y-fontSize', fontSize)
      localStorage.setItem('a11y-contrast', contrast)
    }
  }, [fontSize, contrast, mounted])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <AccessibilityContext.Provider value={{ fontSize, setFontSize, contrast, setContrast }}>
        <div className="invisible">{children}</div>
      </AccessibilityContext.Provider>
    )
  }

  return (
    <AccessibilityContext.Provider value={{ fontSize, setFontSize, contrast, setContrast }}>
      <div className={`
        ${fontSize === 'large' ? 'text-lg' : fontSize === 'xlarge' ? 'text-xl' : 'text-base'}
        ${contrast === 'high' ? 'high-contrast' : ''}
      `}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
