export const motion = {
  page: 'trackdocs-motion-page',
  entrance: 'trackdocs-motion-entrance',
  card: 'trackdocs-motion-card',
  button: 'trackdocs-motion-button',
  modal: 'trackdocs-motion-modal',
  sidebarItem: 'trackdocs-motion-sidebar-item',
  toast: 'trackdocs-toast',
  loading: 'trackdocs-motion-loading',
  upload: 'trackdocs-motion-upload',
  status: 'trackdocs-motion-status',
  glow: 'trackdocs-motion-glow',
  shimmer: 'trackdocs-motion-shimmer',
  skeleton: 'trackdocs-skeleton',
} as const

export const motionDuration = {
  fast: '120ms',
  base: '220ms',
  slow: '320ms',
  slower: '450ms',
} as const

export const motionEase = {
  premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
  soft: 'cubic-bezier(0.16, 1, 0.3, 1)',
  standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const

export const motionDistance = {
  lift: '3px',
  pageEnter: '12px',
  modal: '10px',
  pressScale: '0.985',
} as const
