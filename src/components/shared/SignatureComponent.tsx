'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PenLine, Type, Bookmark, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIGNATURE_FONTS: { label: string; variable: string; family: string }[] = [
  { label: 'Dancing Script', variable: '--font-dancing-script', family: 'Dancing Script' },
  { label: 'Great Vibes',    variable: '--font-great-vibes',    family: 'Great Vibes' },
  { label: 'Sacramento',     variable: '--font-sacramento',     family: 'Sacramento' },
  { label: 'Yellowtail',     variable: '--font-yellowtail',     family: 'Yellowtail' },
  { label: 'Marck Script',   variable: '--font-marck-script',   family: 'Marck Script' },
  { label: 'La Belle Aurore',variable: '--font-la-belle-aurore',family: 'La Belle Aurore' },
  { label: 'Bilbo Swash Caps',variable: '--font-bilbo-swash-caps',family: 'Bilbo Swash Caps' },
  { label: 'Qwigley',        variable: '--font-qwigley',        family: 'Qwigley' },
]

interface SavedSignature {
  id: number
  dataURL: string
}

interface SignatureComponentProps {
  onSave: (dataURL: string) => void
  userId: string | undefined
  label?: string
  disabled?: boolean
}

function getStorageKey(userId: string | undefined) {
  return `shadeosig_${userId ?? 'guest'}`
}

function loadSaved(userId: string | undefined): SavedSignature[] {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(userId)) || '[]')
  } catch {
    return []
  }
}

function persistSave(userId: string | undefined, dataURL: string) {
  try {
    const existing = loadSaved(userId)
    const updated = [{ id: Date.now(), dataURL }, ...existing].slice(0, 3)
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

export default function SignatureComponent({
  onSave,
  userId,
  label,
  disabled = false,
}: SignatureComponentProps) {
  // ── DRAW TAB ──────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (parent) canvas.width = parent.clientWidth - 2
    canvas.height = 180
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  useEffect(() => { initCanvas() }, [initCanvas])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
    isDrawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || disabled) return
    if ('touches' in e) e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const endDraw = () => { isDrawing.current = false }

  const clearDraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const saveDraw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataURL = canvas.toDataURL('image/png')
    const saved = persistSave(userId, dataURL)
    setSavedSigs(saved)
    onSave(dataURL)
  }

  // ── TYPE TAB ──────────────────────────────────────────────────────────────
  const [typedText, setTypedText] = useState('')
  const [activeFont, setActiveFont] = useState(SIGNATURE_FONTS[0])
  const [typeSaved, setTypeSaved] = useState(false)

  const saveTyped = async () => {
    if (!typedText.trim()) return
    try {
      await document.fonts.load(`72px "${activeFont.family}"`)
    } catch { /* continue anyway */ }
    const off = document.createElement('canvas')
    off.width = 500
    off.height = 150
    const ctx = off.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 500, 150)
    ctx.fillStyle = '#1a1a1a'
    ctx.font = `72px "${activeFont.family}"`
    ctx.textBaseline = 'middle'
    ctx.fillText(typedText.trim(), 16, 75)
    const dataURL = off.toDataURL('image/png')
    const saved = persistSave(userId, dataURL)
    setSavedSigs(saved)
    onSave(dataURL)
    setTypeSaved(true)
    setTimeout(() => setTypeSaved(false), 2000)
  }

  // ── SAVED TAB ─────────────────────────────────────────────────────────────
  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>([])

  useEffect(() => {
    if (userId) setSavedSigs(loadSaved(userId))
  }, [userId])

  const deleteSaved = (id: number) => {
    const updated = savedSigs.filter(s => s.id !== id)
    setSavedSigs(updated)
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Tabs defaultValue="draw" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draw" disabled={disabled}>
            <PenLine className="w-3.5 h-3.5 mr-1.5" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="type" disabled={disabled}>
            <Type className="w-3.5 h-3.5 mr-1.5" />
            Type
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
            Saved {savedSigs.length > 0 && `(${savedSigs.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ── DRAW ── */}
        <TabsContent value="draw" className="space-y-3 mt-3">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="block w-full cursor-crosshair"
              style={{ touchAction: 'none' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <p className="text-xs text-muted-foreground">Draw your signature above using mouse or touch</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearDraw} disabled={disabled || !hasDrawn}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
            <Button size="sm" onClick={saveDraw} disabled={disabled || !hasDrawn}>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Save Signature
            </Button>
          </div>
        </TabsContent>

        {/* ── TYPE ── */}
        <TabsContent value="type" className="space-y-3 mt-3">
          <Input
            placeholder="Type your name..."
            value={typedText}
            onChange={e => setTypedText(e.target.value)}
            disabled={disabled}
          />

          {/* Font picker */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Choose a font style:</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {SIGNATURE_FONTS.map(font => (
                <button
                  key={font.family}
                  type="button"
                  onClick={() => setActiveFont(font)}
                  disabled={disabled}
                  className={cn(
                    'px-2 py-1.5 rounded border text-sm text-left transition-all',
                    activeFont.family === font.family
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  )}
                  style={{ fontFamily: `var(${font.variable})` }}
                >
                  {typedText || font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {typedText && (
            <div className="bg-white dark:bg-gray-950 border rounded-lg p-4 min-h-[80px] flex items-center">
              <span
                className="text-5xl text-gray-900 dark:text-white"
                style={{ fontFamily: `var(${activeFont.variable})` }}
              >
                {typedText}
              </span>
            </div>
          )}

          <Button
            size="sm"
            onClick={saveTyped}
            disabled={disabled || !typedText.trim()}
          >
            {typeSaved
              ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved!</>
              : <><Check className="w-3.5 h-3.5 mr-1.5" />Save Signature</>
            }
          </Button>
        </TabsContent>

        {/* ── SAVED ── */}
        <TabsContent value="saved" className="mt-3">
          {savedSigs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No saved signatures yet.</p>
              <p className="text-xs mt-1">Use the Draw or Type tabs to create one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedSigs.map(sig => (
                <div
                  key={sig.id}
                  className="flex items-center gap-3 border rounded-lg p-2 hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 bg-white rounded overflow-hidden border h-14 flex items-center px-2">
                    <img
                      src={sig.dataURL}
                      alt="Saved signature"
                      className="max-h-12 max-w-full object-contain"
                    />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSave(sig.dataURL)}
                      disabled={disabled}
                    >
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSaved(sig.id)}
                      disabled={disabled}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
