import type { ReactNode } from 'react'
import { Card } from './Card'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '../auth/useAuth'
import { motion } from '../lib/motion'

interface AppShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const { session, signOut } = useAuth()

  if (!session) {
    return null
  }

  return (
    <div className="trackdocs-page">
      <div className="trackdocs-shell min-h-[100dvh] px-3 py-3 sm:px-4 sm:py-4 lg:px-0 lg:py-0">
        <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] w-full max-w-none gap-4 lg:min-h-[100dvh] lg:grid-cols-[284px_minmax(0,1fr)] lg:gap-0">
          <div className="hidden lg:block">
            <Sidebar session={session} />
          </div>
          <div className="flex min-h-[calc(100dvh-1.5rem)] flex-col gap-5 lg:min-h-[100dvh] lg:gap-6 lg:px-8 lg:py-8 xl:px-10">
            <div className="lg:hidden">
              <Sidebar session={session} />
            </div>
            <main className={motion.page + ' flex-1 pb-2 sm:pb-4'}>
              <div className="trackdocs-stagger-list flex w-full flex-col gap-5 lg:gap-7">
                <Topbar session={session} title={title} subtitle={subtitle} onSignOut={signOut} />
                {actions ? (
                  <Card
                    tone="glass"
                    padding="md"
                    className={motion.entrance + ' flex min-h-[96px] flex-col gap-4 rounded-[30px] px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7'}
                  >
                    {actions}
                  </Card>
                ) : null}
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
