import { useMemo, useState, useEffect, useCallback } from 'react'
import { classNames, formatKes, type PageProps } from './pageData'
import { AppShell, Badge, EmptyState, ErrorNotice, Panel, ActionButton } from './pageShell'
import {
  getProductsOffline as getProducts,
  createProductOffline as createProduct,
  updateProductOffline as updateProduct,
  deleteProductOffline as deleteProduct,
  updateStockOffline as updateStock,
  getCategoriesOffline as getCategories,
} from '../api/offline-products'
import {
  type Product,
  type CreateProductPayload,
  type UpdateStockPayload,
} from '../api/products'
import type { ApiError } from '../api/axios'

const getApiError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as ApiError).message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

type ModalType = 'create' | 'edit' | 'delete' | 'stock' | null

type Toast = {
  id: string
  message: string
  type: 'success' | 'error'
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const Inventory = ({ activeRoute, onNavigate }: PageProps) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const filters: { category?: string; search?: string } = {}
      if (category !== 'All') filters.category = category
      if (query) filters.search = query
      const response = await getProducts(Object.keys(filters).length > 0 ? filters : undefined)
      setProducts(response.data)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [category, query])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories()
      setCategories(['All', ...response.data.filter(Boolean)])
    } catch {
      // Silently fail - categories are not critical
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredItems = useMemo(() => products, [products])

  const lowStockItems = products.filter((item) => item.stock <= 10)
  const stockValue = products.reduce((sum, item) => sum + item.stock * Number(item.price), 0)

  const openModal = (type: ModalType, product?: Product) => {
    setSelectedProduct(product || null)
    setModal(type)
  }

  const closeModal = () => {
    setModal(null)
    setSelectedProduct(null)
    setIsSubmitting(false)
  }

  const handleCreate = async (data: CreateProductPayload) => {
    try {
      setIsSubmitting(true)
      await createProduct(data)
      addToast('Product created successfully', 'success')
      closeModal()
      fetchProducts()
      fetchCategories()
    } catch (err) {
      addToast(getApiError(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: number, data: Parameters<typeof updateProduct>[1]) => {
    try {
      setIsSubmitting(true)
      await updateProduct(id, data)
      addToast('Product updated successfully', 'success')
      closeModal()
      fetchProducts()
      fetchCategories()
    } catch (err) {
      addToast(getApiError(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setIsSubmitting(true)
      await deleteProduct(id)
      addToast('Product deleted successfully', 'success')
      closeModal()
      fetchProducts()
    } catch (err) {
      addToast(getApiError(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockUpdate = async (id: number, data: UpdateStockPayload) => {
    try {
      setIsSubmitting(true)
      await updateStock(id, data)
      addToast(`Stock updated successfully`, 'success')
      closeModal()
      fetchProducts()
    } catch (err) {
      addToast(getApiError(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      eyebrow="Inventory"
      title="Stock control and low-stock alerts"
      subtitle="Monitor reorder thresholds, product movement, and current stock value across categories."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={lowStockItems.length > 0 ? 'gold' : 'green'}>{lowStockItems.length} low-stock alerts</Badge>
          <ActionButton onClick={() => openModal('create')}>+ Add Product</ActionButton>
        </div>
      }
    >
      <div className="space-y-5">
        {error && <ErrorNotice message={error} />}
        {loading && <div className="py-8 text-center text-zinc-600">Loading products...</div>}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-600">Products</p>
            <strong className="mt-2 block text-2xl font-black text-zinc-950">{products.length}</strong>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Reorder needed</p>
            <strong className="mt-2 block text-2xl font-black text-amber-950">{lowStockItems.length}</strong>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Stock value</p>
            <strong className="mt-2 block text-2xl font-black text-emerald-950">{formatKes(stockValue)}</strong>
          </div>
        </section>

        <Panel title="Inventory list" description="Search, filter, and inspect reorder pressure.">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by item, SKU, or category"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((itemCategory) => (
                <button
                  key={itemCategory}
                  type="button"
                  onClick={() => setCategory(itemCategory)}
                  className={classNames(
                    'min-h-11 rounded-lg border px-3 text-sm font-bold transition',
                    category === itemCategory ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  {itemCategory}
                </button>
              ))}
            </div>
          </div>

          {!loading && filteredItems.length === 0 ? (
            <EmptyState title="No inventory matches" detail={query || category !== 'All' ? "Adjust the search or category filter to find stock items." : "No products yet. Click 'Add Product' to create your first product."} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredItems.map((item) => {
                const isLow = item.stock <= 10
                const stockRatio = Math.min(100, Math.round((item.stock / Math.max(20, 1)) * 100))

                return (
                  <article key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase text-zinc-500">ID: {item.id}</p>
                        <h3 className="mt-1 text-lg font-black text-zinc-950 truncate">{item.name}</h3>
                        <p className="mt-1 text-sm text-zinc-600">{item.category || 'Uncategorized'} - {formatKes(Number(item.price))}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={isLow ? 'gold' : 'green'}>{isLow ? 'Reorder' : 'Active'}</Badge>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openModal('stock', item)}
                            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-emerald-700"
                            title="Adjust stock"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          </button>
                          <button
                            onClick={() => openModal('edit', item)}
                            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-emerald-700"
                            title="Edit product"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => openModal('delete', item)}
                            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600"
                            title="Delete product"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-semibold text-zinc-700">{item.stock} units</span>
                        <span className="text-zinc-500">Reorder at 10</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-lg bg-zinc-100">
                        <div className={classNames('h-full rounded-lg', isLow ? 'bg-amber-500' : 'bg-emerald-700')} style={{ width: `${stockRatio}%` }} />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={classNames(
              'rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all',
              toast.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white'
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Create Product Modal */}
      {modal === 'create' && (
        <ProductFormModal
          title="Create Product"
          onClose={closeModal}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          categories={categories.filter((c) => c !== 'All')}
        />
      )}

      {/* Edit Product Modal */}
      {modal === 'edit' && selectedProduct && (
        <ProductFormModal
          title="Edit Product"
          product={selectedProduct}
          onClose={closeModal}
          onSubmit={(data) => handleUpdate(selectedProduct.id, data)}
          isSubmitting={isSubmitting}
          categories={categories.filter((c) => c !== 'All')}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modal === 'delete' && selectedProduct && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${selectedProduct.name}"? This action cannot be undone.`}
          onClose={closeModal}
          onConfirm={() => handleDelete(selectedProduct.id)}
          isSubmitting={isSubmitting}
          confirmText="Delete"
          danger
        />
      )}

      {/* Adjust Stock Modal */}
      {modal === 'stock' && selectedProduct && (
        <StockModal
          product={selectedProduct}
          onClose={closeModal}
          onSubmit={(data) => handleStockUpdate(selectedProduct.id, data)}
          isSubmitting={isSubmitting}
        />
      )}
    </AppShell>
  )
}

// Product Form Modal Component
function ProductFormModal({
  title,
  product,
  onClose,
  onSubmit,
  isSubmitting,
  categories,
}: {
  title: string
  product?: Product
  onClose: () => void
  onSubmit: (data: CreateProductPayload) => void
  isSubmitting: boolean
  categories: string[]
}) {
  const [formData, setFormData] = useState<CreateProductPayload>({
    name: product?.name || '',
    description: product?.description || '',
    price: product ? Number(product.price) : 0,
    stock: product?.stock || 0,
    category: product?.category || '',
    isActive: product?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProductPayload, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateProductPayload, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0'
    if ((formData.stock ?? 0) < 0) newErrors.stock = 'Stock cannot be negative'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={classNames(
                'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                errors.name ? 'border-rose-500' : 'border-zinc-300'
              )}
              placeholder="Product name"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Price (KES) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={classNames(
                  'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                  errors.price ? 'border-rose-500' : 'border-zinc-300'
                )}
              />
              {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className={classNames(
                  'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                  errors.stock ? 'border-rose-500' : 'border-zinc-300'
                )}
              />
              {errors.stock && <p className="mt-1 text-xs text-rose-600">{errors.stock}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Category</label>
            <input
              type="text"
              list="categories"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Select or type new category"
            />
            <datalist id="categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-zinc-300"
            />
            <label htmlFor="isActive" className="text-sm text-zinc-700">Active</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Confirmation Modal Component
function ConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
  isSubmitting,
  confirmText,
  danger,
}: {
  title: string
  message: string
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  confirmText: string
  danger?: boolean
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={classNames(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
            )}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Stock Adjustment Modal Component
function StockModal({
  product,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  product: Product
  onClose: () => void
  onSubmit: (data: UpdateStockPayload) => void
  isSubmitting: boolean
}) {
  const [operation, setOperation] = useState<'add' | 'deduct' | 'set'>('add')
  const [qty, setQty] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (qty <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    if (operation === 'deduct' && qty > product.stock) {
      setError('Cannot deduct more than current stock')
      return
    }
    setError(null)
    onSubmit({ qty, operation })
  }

  const getPreview = () => {
    switch (operation) {
      case 'add': return product.stock + qty
      case 'deduct': return Math.max(0, product.stock - qty)
      case 'set': return qty
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-zinc-950">Adjust Stock: {product.name}</h2>
        <p className="text-sm text-zinc-500">Current stock: <strong>{product.stock}</strong> units</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            {(['add', 'deduct', 'set'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setOperation(op)}
                className={classNames(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize',
                  operation === op
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                )}
              >
                {op}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Quantity</label>
            <input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className={classNames(
                'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                error ? 'border-rose-500' : 'border-zinc-300'
              )}
              placeholder="Enter quantity"
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>

          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-sm text-zinc-600">
              New stock will be: <strong className="text-zinc-950">{getPreview()}</strong> units
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Inventory
