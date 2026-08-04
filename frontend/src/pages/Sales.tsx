import { useState, useEffect } from 'react'
import { formatKes, type PageProps } from './pageData'
import { ActionButton, AppShell, Badge, EmptyState, ErrorNotice, Panel } from './pageShell'
import {
  getSalesOffline as getSales,
  createSaleOffline as createSale,
  updateSaleStatusOffline as updateSaleStatus,
} from '../api/offline-sales'
import { type Sale } from '../api/sales'
import { getProductsOffline as getProducts } from '../api/offline-products'
import { type Product } from '../api/products'
import type { ApiError } from '../api/axios'

const paymentMethods = ['M-Pesa', 'Cash', 'Credit'] as const

type PaymentMethod = (typeof paymentMethods)[number]

type SaleDraft = {
  productId: string
  quantity: number
  unitPrice: string
  method: PaymentMethod
  notes: string
}

const initialDraft: SaleDraft = {
  productId: '',
  quantity: 1,
  unitPrice: '',
  method: 'M-Pesa',
  notes: '',
}

const quantityOptions = ['0.25', '0.5', '0.75', '1', '2', '3', '4', '5', '10', '20', '50'] as const

const getApiError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as ApiError).message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

const Sales = ({ activeRoute, onNavigate }: PageProps) => {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<SaleDraft>(initialDraft)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [salesRes, productsRes] = await Promise.all([
        getSales(),
        getProducts(),
      ])
      setSales(salesRes.data)
      setProducts(productsRes.data)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusTone = (status: string): 'green' | 'gold' | 'rose' => {
    if (status === 'completed') return 'green'
    if (status === 'cancelled') return 'rose'
    return 'gold'
  }

  const getStatusLabel = (status: string): string => {
    if (status === 'completed') return 'Paid'
    if (status === 'cancelled') return 'Cancelled'
    return 'Pending'
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const submitSale = async (event: { preventDefault(): void }) => {
    event.preventDefault()
    setError('')

    const productId = parseInt(draft.productId)
    const quantity = draft.quantity
    const unitPrice = parseFloat(draft.unitPrice)

    if (!productId) {
      setError('Please select a product')
      return
    }

    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (!unitPrice || unitPrice <= 0) {
      setError('Unit price must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      await createSale({
        items: [{ productId, quantity, unitPrice }],
        paymentMethod: draft.method,
        notes: draft.notes || undefined,
      })
      setDraft(initialDraft)
      setProductSearch('')
      setError('')
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const updateSaleStatusHandler = async (saleId: number, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      await updateSaleStatus(saleId, { status: newStatus })
      fetchData()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  const total = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0)

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      eyebrow="Sales"
      title="Transactions and quick sale capture"
      subtitle="Record sales with validation, inspect payment status, and keep daily cash movement easy to scan."
      actions={<ActionButton onClick={() => setShowForm(true)}>New Sale</ActionButton>}
    >
      <div className="space-y-5">
        {error && <ErrorNotice message={error} />}
        {loading && <div className="py-8 text-center text-zinc-600">Loading sales data...</div>}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Sales total</p>
            <strong className="mt-2 block text-2xl font-black text-emerald-950">{formatKes(total)}</strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-600">Transactions</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{sales.length}</strong>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Pending</p>
            <strong className="mt-2 block text-2xl font-black text-amber-950">
              {sales.filter((sale) => sale.status === 'pending').length}
            </strong>
          </div>
        </section>

        {showForm ? (
          <Panel title="New sale" description="Validated before it enters the transaction list.">
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submitSale}>
              {error ? <div className="sm:col-span-2 lg:col-span-4"><ErrorNotice message={error} /></div> : null}

              <label className="relative space-y-2 lg:col-span-2">
                <span className="text-sm font-bold text-zinc-800">Product *</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products..."
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            productId: product.id.toString(),
                            unitPrice: parseFloat(product.price).toString(),
                          })
                          setProductSearch(product.name)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm text-zinc-700"
                      >
                        {product.name} ({product.unit}) — {formatKes(parseFloat(product.price))}
                      </button>
                    ))}
                  </div>
                )}
                <select
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={draft.productId}
                  onChange={(event) => {
                    const productId = event.target.value
                    const product = products.find((p) => p.id.toString() === productId)
                    setDraft({
                      ...draft,
                      productId,
                      unitPrice: product ? parseFloat(product.price).toString() : '',
                    })
                    setProductSearch(product?.name ?? '')
                  }}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.unit}) — {formatKes(parseFloat(product.price))}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-800">Quantity *</span>
                <select
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={draft.quantity}
                  onChange={(event) => setDraft({ ...draft, quantity: parseFloat(event.target.value) })}
                >
                  {quantityOptions.map((qty) => (
                    <option key={qty} value={qty}>
                      {qty}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-800">Unit Price (KES) *</span>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={draft.unitPrice}
                  onChange={(event) => setDraft({ ...draft, unitPrice: event.target.value })}
                  placeholder="KES"
                  inputMode="numeric"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-800">Payment Method</span>
                <select
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={draft.method}
                  onChange={(event) => setDraft({ ...draft, method: event.target.value as PaymentMethod })}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 sm:col-span-2 lg:col-span-3">
                <span className="text-sm font-bold text-zinc-800">Notes</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="Optional notes"
                />
              </label>

              <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                <ActionButton type="submit" disabled={submitting}>
                  {submitting ? 'Creating Sale...' : 'Create Sale'}
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    setShowForm(false)
                    setDraft(initialDraft)
                    setProductSearch('')
                    setError('')
                  }}
                  variant="secondary"
                >
                  Cancel
                </ActionButton>
              </div>
            </form>
          </Panel>
        ) : null}

        <Panel title="Recent transactions" description="Desktop gets a table; smaller screens get readable transaction records.">
          {!loading && sales.length === 0 ? (
            <EmptyState title="No sales yet" detail="Create the first sale to start building the daily record." />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="py-3 pr-4">Sale</th>
                      <th className="py-3 pr-4">Method</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3 pl-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="py-4 pr-4 font-bold text-zinc-950">SL-{sale.id}</td>
                        <td className="py-4 pr-4 text-zinc-700">{sale.paymentMethod ?? 'Cash'}</td>
                        <td className="py-4 pr-4 text-zinc-500">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="py-4 pr-4">
                          <Badge tone={getStatusTone(sale.status)}>
                            {getStatusLabel(sale.status)}
                          </Badge>
                        </td>
                        <td className="py-4 text-right font-black text-zinc-950">{formatKes(parseFloat(sale.totalAmount))}</td>
                        <td className="py-4 pl-4">
                          {sale.status === 'pending' && (
                            <button
                              onClick={() => updateSaleStatusHandler(sale.id, 'completed')}
                              className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {sales.map((sale) => (
                  <article key={sale.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-zinc-950">SL-{sale.id}</h3>
                        <p className="text-sm text-zinc-600">{sale.paymentMethod ?? 'Cash'}</p>
                      </div>
                      <Badge tone={getStatusTone(sale.status)}>
                        {getStatusLabel(sale.status)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <span className="text-sm text-zinc-500">{new Date(sale.saleDate).toLocaleDateString()}</span>
                      <strong className="text-lg text-zinc-950">{formatKes(parseFloat(sale.totalAmount))}</strong>
                    </div>
                    {sale.status === 'pending' && (
                      <div className="mt-2">
                        <button
                          onClick={() => updateSaleStatusHandler(sale.id, 'completed')}
                          className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"
                        >
                          Mark as Paid
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </AppShell>
  )
}

export default Sales
