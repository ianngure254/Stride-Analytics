import { useEffect, useMemo, useState } from 'react'
import { classNames, formatKes, type PageProps } from './pageData'
import { AppShell, Badge, EmptyState, ErrorNotice, Panel, ActionButton } from './pageShell'
import {
  type Customer,
  clearCustomer,
} from '../api/customers'
import {
  getCustomersOffline,
  createCustomerOffline,
  deleteCustomerOffline,
} from '../api/offline-customers'
import type { ApiError } from '../api/axios'

const getApiError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as ApiError).message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

const Customers = ({ activeRoute, onNavigate }: PageProps) => {
  const [customerList, setCustomerList] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', pendingAmount: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const loadCustomers = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await getCustomersOffline()
      setCustomerList(response.data)
    } catch (err) {
      setLoadError(getApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setFormError('Customer name is required')
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      await createCustomerOffline({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim() || undefined,
        pendingAmount: newCustomer.pendingAmount ? parseFloat(newCustomer.pendingAmount) : undefined,
      })
      setNewCustomer({ name: '', phone: '', pendingAmount: '' })
      setShowAddForm(false)
      showToast('Customer added successfully')
      await loadCustomers()
    } catch (err) {
      setFormError(getApiError(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async (id: number, name: string) => {
    try {
      const response = await clearCustomer(id)
      setCustomerList((prev) => prev.map((c) => (c.id === id ? response.data : c)))
      showToast(`${name} marked as cleared`)
    } catch (err) {
      showToast(getApiError(err))
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await deleteCustomerOffline(id)
      setCustomerList((prev) => prev.filter((c) => c.id !== id))
      showToast(`${name} deleted`)
    } catch (err) {
      showToast(getApiError(err))
    }
  }

  const filteredCustomers = useMemo(
    () =>
      customerList.filter((c) =>
        `${c.name} ${c.phone ?? ''} ${c.id}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [customerList, query],
  )

  const pendingTotal = customerList.reduce((sum, c) => sum + parseFloat(c.pendingAmount ?? '0'), 0)

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      eyebrow="Customers"
      title="Customer management"
      subtitle="Track pending balances and manage customer records."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={pendingTotal > 0 ? 'gold' : 'green'}>{formatKes(pendingTotal)} pending</Badge>
          <ActionButton onClick={() => setShowAddForm(true)}>+ Add</ActionButton>
        </div>
      }
    >
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-md">
          {toast}
        </div>
      )}

      <div className="space-y-5">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-600">Total Customers</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{customerList.length}</strong>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">Pending KSH</p>
            <strong className="mt-2 block text-2xl font-black text-rose-950">{formatKes(pendingTotal)}</strong>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Follow-ups</p>
            <strong className="mt-2 block text-2xl font-black text-amber-950">
              {customerList.filter((c) => parseFloat(c.pendingAmount ?? '0') > 0).length}
            </strong>
          </div>
        </section>

        {showAddForm && (
          <Panel title="Add Customer" description="Record a new customer with pending balance.">
            {formError && <ErrorNotice message={formError} />}
            <div className={classNames('grid gap-4 md:grid-cols-3', formError ? 'mt-3' : '')}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800">Customer Name *</label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800">Phone</label>
                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800">Pending Amount (KSh)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  value={newCustomer.pendingAmount}
                  onChange={(e) => setNewCustomer({ ...newCustomer, pendingAmount: e.target.value })}
                  placeholder="Amount owed"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <ActionButton onClick={handleAddCustomer} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Amount'}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  setShowAddForm(false)
                  setFormError(null)
                }}
                variant="secondary"
              >
                Cancel
              </ActionButton>
            </div>
          </Panel>
        )}

        <Panel title="Pending KSH" description="Search and manage customer pending balances.">
          <div className="mb-4">
            <input
              className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, or ID"
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-zinc-500">Loading customers...</div>
          ) : loadError ? (
            <ErrorNotice message={loadError} />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              title="No customers found"
              detail={query ? 'Try another search term.' : 'Add your first customer above.'}
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredCustomers.map((customer) => {
                const pending = parseFloat(customer.pendingAmount ?? '0')
                const isCleared = customer.deniStatus === 'cleared' || pending === 0
                return (
                  <article key={customer.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-zinc-500">#{customer.id}</p>
                        <h3 className="mt-1 text-lg font-black text-zinc-950">{customer.name}</h3>
                        {customer.phone && <p className="mt-1 text-sm text-zinc-600">{customer.phone}</p>}
                      </div>
                      <Badge tone={isCleared ? 'green' : 'gold'}>{isCleared ? 'Cleared' : 'Pending'}</Badge>
                    </div>
                    <div className="mt-3 rounded-lg bg-zinc-50 p-3">
                      <p className="text-xs font-bold uppercase text-zinc-500">Pending Amount</p>
                      <p className="mt-1 text-base font-black text-zinc-950">{formatKes(pending)}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {!isCleared && (
                        <ActionButton onClick={() => handleClear(customer.id, customer.name)} variant="secondary">
                          Cleared
                        </ActionButton>
                      )}
                      <ActionButton onClick={() => handleDelete(customer.id, customer.name)} variant="ghost">
                        Delete
                      </ActionButton>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  )
}

export default Customers
