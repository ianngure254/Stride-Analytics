import { useEffect, useState } from 'react'
import { formatKes, type PageProps } from './pageData'
import { AppShell, Badge, ErrorNotice, Panel, StatCard } from './pageShell'
import { getSalesOffline as getSales } from '../api/offline-sales'
import { getProductsOffline as getProducts } from '../api/offline-products'
import { getCustomersOffline as getCustomers } from '../api/offline-customers'
import { type Sale } from '../api/sales'
import { type Product } from '../api/products'
import { type Customer } from '../api/customers'
import type { ApiError } from '../api/axios'
import ReportExport from '../Components/ReportExport'

const getApiError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) return (err as ApiError).message
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

const LOW_STOCK_THRESHOLD = 5

const Dashboard = ({ activeRoute, onNavigate }: PageProps) => {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const [salesRes, productsRes, customersRes] = await Promise.all([
          getSales(),
          getProducts(),
          getCustomers(),
        ])
        setSales(salesRes.data)
        setProducts(productsRes.data)
        setCustomers(customersRes.data)
      } catch (err) {
        setLoadError(getApiError(err))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const revenue = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
  const mpesaRevenue = sales
    .filter((s) => (s.paymentMethod ?? '').toLowerCase().includes('pesa'))
    .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
  const cashRevenue = sales
    .filter((s) => (s.paymentMethod ?? '').toLowerCase() === 'cash')
    .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
  const creditRevenue = sales
    .filter((s) => (s.paymentMethod ?? '').toLowerCase() === 'credit')
    .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
  const pendingKsh = customers.reduce((sum, c) => sum + parseFloat(c.pendingAmount ?? '0'), 0)
  const lowStockItems = products.filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)
  const paidSales = sales.filter((s) => s.status === 'completed').length

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      eyebrow="Dashboard"
      title="Daily business pulse"
      subtitle="A tight view of revenue, payment channels, stock risk, and customer credit exposure."
      actions={
        <>
          <Badge tone="green">{paidSales} paid transactions</Badge>
          <Badge tone={lowStockItems.length > 0 ? 'gold' : 'green'}>{lowStockItems.length} stock alerts</Badge>
        </>
      }
    >
      <div className="space-y-5">
        {loadError && <ErrorNotice message={loadError} />}

        {isLoading ? (
          <div className="py-12 text-center text-sm text-zinc-500">Loading dashboard data...</div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Revenue" value={formatKes(revenue)} detail={`${sales.length} total sales`} tone="green" />
              <StatCard label="M-Pesa" value={formatKes(mpesaRevenue)} detail="Digital collections" tone="ink" />
              <StatCard label="Cash" value={formatKes(cashRevenue)} detail="Counter payments" tone="gold" />
              <StatCard label="Pending KSH" value={formatKes(pendingKsh)} detail="Customer balances" tone="rose" />
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel title="Revenue mix" description="Payment channel performance across all sales.">
                {sales.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-500">No sales recorded yet. Record your first sale to see the revenue breakdown.</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: 'M-Pesa', value: mpesaRevenue, color: 'bg-emerald-700' },
                      { label: 'Cash', value: cashRevenue, color: 'bg-amber-500' },
                      { label: 'Credit', value: creditRevenue, color: 'bg-zinc-800 dark:bg-zinc-200' },
                    ].map((item) => {
                      const width = revenue > 0 ? Math.round((item.value / revenue) * 100) : 0
                      return (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.label}</span>
                            <span className="text-zinc-600 dark:text-zinc-400">{formatKes(item.value)}</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <div className={`${item.color} h-full rounded-lg transition-all`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Panel>

              <Panel title="Business summary" description="Key actions for the next trading cycle.">
                <div className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {revenue > 0 ? (
                    <p>
                      {mpesaRevenue >= cashRevenue
                        ? 'Revenue is strongest through M-Pesa — reconcile till messages before closing the shift.'
                        : 'Cash is leading revenue today — confirm all counter collections before close.'}
                    </p>
                  ) : (
                    <p>No sales recorded yet. Record your first sale to start seeing revenue insights.</p>
                  )}
                  {lowStockItems.length > 0 ? (
                    <p>
                      {lowStockItems.length} product{lowStockItems.length > 1 ? 's are' : ' is'} at or below {LOW_STOCK_THRESHOLD} units. Restock before the next trading cycle.
                    </p>
                  ) : (
                    <p>All products are well-stocked.</p>
                  )}
                  {pendingKsh > 0 ? (
                    <p>Follow up on {formatKes(pendingKsh)} in pending customer balances before they go overdue.</p>
                  ) : (
                    <p>No pending customer balances. All accounts are cleared.</p>
                  )}
                </div>
              </Panel>
            </div>

            {lowStockItems.length > 0 && (
              <Panel title="Stock alerts" description={`Products at or below ${LOW_STOCK_THRESHOLD} units.`}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {lowStockItems.map((item) => (
                    <article key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-amber-950 dark:text-amber-100">{item.name}</h3>
                          {item.category && <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{item.category}</p>}
                        </div>
                        <Badge tone="gold">{item.stock} left</Badge>
                      </div>
                      <p className="mt-4 text-sm text-amber-900 dark:text-amber-200">
                        Reorder threshold: {LOW_STOCK_THRESHOLD} units. Current price: {formatKes(parseFloat(item.price))}.
                      </p>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {customers.filter((c) => parseFloat(c.pendingAmount ?? '0') > 0).length > 0 && (
              <Panel title="Pending balances" description="Customers with outstanding amounts.">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {customers
                    .filter((c) => parseFloat(c.pendingAmount ?? '0') > 0)
                    .slice(0, 6)
                    .map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                        <div>
                          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">{c.name}</p>
                          {c.phone && <p className="text-xs text-zinc-500">{c.phone}</p>}
                        </div>
                        <Badge tone="gold">{formatKes(parseFloat(c.pendingAmount ?? '0'))}</Badge>
                      </div>
                    ))}
                </div>
              </Panel>
            )}

            <ReportExport />
          </>
        )}
      </div>
    </AppShell>
  )
}

export default Dashboard
