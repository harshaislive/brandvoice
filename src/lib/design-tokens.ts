// Design tokens for consistent styling across the chat application

export const designTokens = {
  // Spacing
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
  },
  
  // Sizing
  sizing: {
    avatar: {
      sm: '2rem',     // 32px
      md: '2.5rem',   // 40px
      lg: '3rem',     // 48px
    },
    icon: {
      xs: '0.75rem',  // 12px
      sm: '1rem',     // 16px
      md: '1.25rem',  // 20px
      lg: '1.5rem',   // 24px
    },
    sidebar: {
      collapsed: '3rem',    // 48px
      expanded: '20rem',    // 320px
      expandedMd: '18rem',  // 288px (medium screens)
      expandedSm: '16rem',  // 256px (small screens)
    },
    header: {
      height: '3.5rem',     // 56px
    },
    input: {
      minHeight: '3.75rem', // 60px
      maxHeight: '8rem',    // 128px
    },
  },

  // Border radius
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '50%',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },

  // Typography
  typography: {
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // Component-specific tokens
  chat: {
    message: {
      maxWidth: {
        mobile: '85%',
        tablet: '80%',
        desktop: '75%',
      },
      spacing: '1.5rem',  // 24px between messages
    },
    sidebar: {
      colors: {
        background: '#342e29',
        backgroundHover: '#4b3c35',
        backgroundActive: '#86312b',
        backgroundActiveHover: '#9e3430',
        text: '#ffffff',
        textSecondary: '#ffc083',
        border: '#4b3c35',
      },
    },
    loading: {
      pulseColor: 'currentColor',
      spinnerSize: {
        sm: '0.75rem',  // 12px
        md: '1rem',     // 16px
        lg: '1.25rem',  // 20px
      },
    },
  },
} as const

// Type helpers
export type SpacingToken = keyof typeof designTokens.spacing
export type SizingToken = keyof typeof designTokens.sizing
export type BorderRadiusToken = keyof typeof designTokens.borderRadius
export type AnimationDurationToken = keyof typeof designTokens.animation.duration
export type TypographyToken = keyof typeof designTokens.typography.fontSize

// Utility functions
export function getSpacing(token: SpacingToken): string {
  return designTokens.spacing[token]
}

export function getBreakpoint(breakpoint: keyof typeof designTokens.breakpoints): string {
  return designTokens.breakpoints[breakpoint]
}

export function getChatColor(path: string): string {
  const keys = path.split('.')
  let value: Record<string, unknown> = designTokens.chat
  
  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key] as Record<string, unknown>
  }
  
  return (value as unknown as string) || ''
}