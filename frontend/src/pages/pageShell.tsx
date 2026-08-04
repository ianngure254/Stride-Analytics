import { useEffect, useState, type ReactNode } from 'react'
import AiChat from '../Components/aiChat'
import ConnectionStatus from '../Components/ConnectionStatus'
import { appRoutes, classNames, type PageProps } from './pageData'

type AppShellProps = PageProps & {
  title: string
  subtitle: string
  eyebrow?: string
  children: ReactNode
  actions?: ReactNode
}

type StatCardProps = {
  label: string
  value: string
  detail: string
  tone?: 'green' | 'gold' | 'ink' | 'rose'
}

type PanelProps = {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}

const toneMap = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  gold: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  ink: 'border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
  rose: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
}

export const Badge = ({
  children,
  tone = 'ink',
}: {
  children: ReactNode
  tone?: 'green' | 'gold' | 'ink' | 'rose'
}) => (
  <span className={classNames('inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold', toneMap[tone])}>
    {children}
  </span>
)

export const ActionButton = ({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={classNames(
      'inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2',
      disabled && 'opacity-50 cursor-not-allowed',
      variant === 'primary' && 'bg-emerald-700 text-white hover:bg-emerald-800',
      variant === 'secondary' && 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
      variant === 'ghost' && 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
    )}
  >
    {children}
  </button>
)

export const StatCard = ({ label, value, detail, tone = 'ink' }: StatCardProps) => (
  <article className={classNames('rounded-lg border p-4 shadow-sm', toneMap[tone])}>
    <p className="text-sm font-medium opacity-75">{label}</p>
    <strong className="mt-3 block text-2xl font-bold">{value}</strong>
    <p className="mt-2 text-sm opacity-80">{detail}</p>
  </article>
)

export const Panel = ({ title, description, children, action }: PanelProps) => (
  <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-100">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
)

export const ErrorNotice = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100" role="alert">
    {message}
  </div>
)

export const EmptyState = ({ title, detail }: { title: string; detail: string }) => (
  <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{detail}</p>
  </div>
)

export const AppShell = ({ activeRoute, onNavigate, onSignOut, userEmail, title, subtitle, eyebrow, actions, children }: AppShellProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return window.localStorage.getItem('stride-theme') === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('stride-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))

  return (
  <div className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
      <aside className="hidden w-72 border-r border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-900 lg:flex lg:flex-col">
        <button className="flex w-full items-center gap-3 text-left" type="button" onClick={() => onNavigate('home')}>
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-base font-black text-white">S</span>
          <span>
            <span className="block text-base font-black text-zinc-950 dark:text-zinc-100">Stride Analytics</span>
            <span className="block text-xs font-semibold uppercase text-amber-700">Hardware Store POS</span>
          </span>
        </button>
        <nav className="mt-8 flex-1 space-y-1">
          {appRoutes.map((route) => (
            <button
              key={route.id}
              type="button"
              onClick={() => onNavigate(route.id)}
              className={classNames(
                'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition',
                activeRoute === route.id ? 'bg-emerald-700 text-white' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
              )}
            >
              <span className="font-semibold">{route.label}</span>
              <span className={classNames('h-2 w-2 rounded-full', activeRoute === route.id ? 'bg-amber-300' : 'bg-zinc-300')} />
            </button>
          ))}
        </nav>

        {/* User info + Sign Out */}
        {userEmail && (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">{userEmail}</p>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="mt-2 w-full rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950"
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        <button
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
          onClick={toggleTheme}
          type="button"
        >
          <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          <span className="rounded-md bg-emerald-700 px-2 py-1 text-xs text-white">{theme === 'dark' ? 'Switch light' : 'Switch dark'}</span>
        </button>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-bold text-amber-950 dark:text-amber-100">AI trading note</p>
          <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">Low stock pressure is highest on flour and laundry soap. Restock before the evening rush.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button className="flex items-center gap-2 text-left" type="button" onClick={() => onNavigate('home')}>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 font-black text-white">S</span>
              <span className="text-sm font-black text-zinc-950 dark:text-zinc-100">Stride Analytics</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-white text-sm font-black text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                onClick={toggleTheme}
                type="button"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? 'L' : 'D'}
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-400"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-4">
            <ConnectionStatus />
          </div>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              {eyebrow ? <p className="text-xs font-bold uppercase text-amber-700">{eyebrow}</p> : null}
              <h1 className="mt-2 max-w-4xl text-3xl font-black text-zinc-950 dark:text-zinc-100 sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-2 py-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
            {appRoutes.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => onNavigate(route.id)}
                className={classNames(
                  'rounded-lg px-1 py-2 text-[11px] font-bold transition',
                  activeRoute === route.id ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                {route.label}
              </button>
            ))}
          </div>
        </nav>

        <AiChat activeRoute={activeRoute} onNavigate={onNavigate} />
      </div>
    </div>
  </div>
)
}
