import { useEffect, useState } from 'react'
import { ActionButton, AppShell, Badge, Panel, StatCard } from './pageShell'
import { appRoutes, formatKes, type PageProps } from './pageData'
import { getSales } from '../api/sales'
import { getProducts } from '../api/products'
import { getCustomers } from '../api/customers'

const Index = ({ activeRoute, onNavigate }: PageProps) => {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [pendingKsh, setPendingKsh] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [salesRes, productsRes, customersRes] = await Promise.all([
          getSales(),
          getProducts(),
          getCustomers(),
        ])
        setTotalRevenue(salesRes.data.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0))
        setLowStockCount(productsRes.data.filter((p) => p.isActive && p.stock <= 5).length)
        setPendingKsh(customersRes.data.reduce((sum, c) => sum + parseFloat(c.pendingAmount ?? '0'), 0))
      } catch {
        // best-effort — page stays usable without live data
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      eyebrow="Modern shop intelligence"
      title="Run sales, stock, and customer credit from one calm workspace."
      subtitle="Stride Analytics gives your retail team a fast daily view of revenue, M-Pesa flow, low-stock risk, and pending balances."
      actions={
        <>
          <ActionButton onClick={() => onNavigate('dashboard')}>Open Dashboard</ActionButton>
          <ActionButton onClick={() => onNavigate('sales')} variant="secondary">
            Record Sale
          </ActionButton>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
          <Badge tone={isLoading ? 'ink' : 'green'}>{isLoading ? 'Loading...' : 'Live operating snapshot'}</Badge>
          <h2 className="mt-5 max-w-3xl text-2xl font-black text-zinc-950 dark:text-zinc-100">
            Today already has enough signals to make better buying decisions.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Track payment mix, flag low-stock pressure, and keep customer balances visible before they become a cash-flow surprise.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Revenue"
              value={isLoading ? '—' : formatKes(totalRevenue)}
              detail="Across all sales"
              tone="green"
            />
            <StatCard
              label="Low stock"
              value={isLoading ? '—' : `${lowStockCount} items`}
              detail="Need attention"
              tone="gold"
            />
            <StatCard
              label="Pending KSH"
              value={isLoading ? '—' : formatKes(pendingKsh)}
              detail="Customer balances"
              tone="ink"
            />
          </div>
        </section>

        <Panel title="Quick navigation" description="Each page has focused controls and real-time data.">
          <div className="space-y-3">
            {appRoutes
              .filter((route) => route.id !== 'home')
              .map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onNavigate(route.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-emerald-700 dark:hover:bg-emerald-950"
                >
                  <span>
                    <span className="block text-sm font-bold text-zinc-950 dark:text-zinc-100">{route.label}</span>
                    <span className="block text-sm text-zinc-600 dark:text-zinc-400">{route.description}</span>
                  </span>
                  <span className="text-sm font-black text-emerald-700">Go</span>
                </button>
              ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

export default Index
