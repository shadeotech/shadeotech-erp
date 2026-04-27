'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Package, ChevronDown, ChevronRight, Layers, Tag, ImageIcon, Search, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ProductSummary {
  category: string
  isExterior: boolean
  subcategories: string[]
  collections: string[]
  fabricCount: number
}

const CATEGORY_GROUPS: Record<string, string> = {
  'Duo Shades': 'Interior',
  'Tri Shades': 'Interior',
  'Roller Shades': 'Interior',
  'Uni Shades': 'Interior',
  'Roman Shades': 'Interior',
}

function getGroup(category: string) {
  if (category.startsWith('Exterior')) return 'Exterior'
  return CATEGORY_GROUPS[category] ?? 'Interior'
}

function GroupBadge({ group }: { group: string }) {
  return group === 'Exterior'
    ? <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Exterior</span>
    : <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Interior</span>
}

export default function ProductsPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) return
    fetch('/api/production/products', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: ProductSummary[]) => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const toggle = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const filtered = products.filter(p =>
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.subcategories.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    p.collections.some(c => c.toLowerCase().includes(search.toLowerCase()))
  )

  // Group by Interior / Exterior
  const interior = filtered.filter(p => getGroup(p.category) === 'Interior')
  const exterior = filtered.filter(p => getGroup(p.category) === 'Exterior')

  const totalFabrics = products.reduce((s, p) => s + p.fabricCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Product catalog derived from the Fabric Gallery. Each category shows its openness options, collections, and fabric count.
          </p>
        </div>
        <Link href="/fabric-gallery">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Manage Fabrics
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{interior.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Interior Products</div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{exterior.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Exterior Products</div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold">{totalFabrics}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Fabrics</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, subcategories or collections…"
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border bg-white dark:bg-[#111] py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No products yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add fabrics in the Fabric Gallery to see products here.</p>
          <Link href="/fabric-gallery" className="mt-4 inline-block">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">Go to Fabric Gallery</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Interior ── */}
          {interior.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b">
                <Layers className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold">Interior Products</h2>
                <Badge variant="outline" className="text-xs">{interior.length}</Badge>
              </div>
              <div className="rounded-xl border overflow-hidden divide-y bg-white dark:bg-[#111]">
                {interior.map(product => (
                  <ProductRow
                    key={product.category}
                    product={product}
                    expanded={expanded.has(product.category)}
                    onToggle={() => toggle(product.category)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Exterior ── */}
          {exterior.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b">
                <Layers className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-semibold">Exterior Products</h2>
                <Badge variant="outline" className="text-xs">{exterior.length}</Badge>
              </div>
              <div className="rounded-xl border overflow-hidden divide-y bg-white dark:bg-[#111]">
                {exterior.map(product => (
                  <ProductRow
                    key={product.category}
                    product={product}
                    expanded={expanded.has(product.category)}
                    onToggle={() => toggle(product.category)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* How to add products note */}
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How to add or edit products</p>
            <p>Products are built from the <strong>Fabric Gallery</strong>. Each unique <code className="text-xs bg-muted px-1 rounded">Category</code> becomes a product in the estimate builder.</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs mt-2">
              <li>To <strong>add a new product</strong>: add a fabric with a new Category name in the Fabric Gallery</li>
              <li>To <strong>add an openness option</strong>: add a fabric with that Subcategory under the product</li>
              <li>To <strong>add a collection</strong>: add a fabric with that Collection name</li>
              <li>Exterior products must use the prefix <code className="bg-muted px-1 rounded">Exterior - </code> (e.g., "Exterior - Zip Track")</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductRow({ product, expanded, onToggle }: { product: ProductSummary; expanded: boolean; onToggle: () => void }) {
  const group = getGroup(product.category)
  return (
    <div>
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
        onClick={onToggle}
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{product.category}</span>
            <GroupBadge group={group} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{product.subcategories.length} openness option{product.subcategories.length !== 1 ? 's' : ''}</span>
            {product.collections.length > 0 && <span>{product.collections.length} collection{product.collections.length !== 1 ? 's' : ''}</span>}
            <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />{product.fabricCount} fabric{product.fabricCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <Link
          href={`/fabric-gallery?category=${encodeURIComponent(product.category)}`}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          View fabrics
        </Link>
      </button>

      {expanded && (
        <div className="px-11 pb-4 space-y-3 border-t bg-muted/20">
          {/* Openness / Subcategories */}
          <div className="pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Openness / Subcategories
            </p>
            {product.subcategories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {product.subcategories.map(s => (
                  <span key={s} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-background">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No subcategories — add fabrics with a Subcategory in the Fabric Gallery</p>
            )}
          </div>

          {/* Collections */}
          {product.collections.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Collections
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.collections.map(c => (
                  <span key={c} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border-amber-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
