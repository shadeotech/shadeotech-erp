'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { SCAN_STATIONS, QC_CHECKLIST, STAGE_LABELS } from '@/constants/productionStages'
import { CheckCircle2, XCircle, Scan, RotateCcw, ChevronLeft } from 'lucide-react'

type ScanState = 'idle' | 'loading' | 'spec' | 'completing' | 'success' | 'error'

interface ScanResult {
  order: { orderNumber: string; customerName: string; sideMark?: string; deliveryMethod?: string }
  item: { _id: string; area: string; product: string; qty: number; width: string; length: string }
  currentStage: string
  itemStages: { stage: string; completedAt: string; stationId: string; completedByName?: string }[]
  stageAlreadyDone: boolean
  spec: {
    title: string
    isQC?: boolean
    sections: { label: string; fields: { label: string; value: string; highlight?: boolean }[] }[]
  }
  station: { id: string; label: string; stage: string; color: string }
}

// Accent colors per station — used for borders, icons, buttons (not full backgrounds)
const STATION_ACCENT: Record<string, { color: string; bg: string; border: string; badge: string }> = {
  production_check: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', badge: '#dbeafe' },
  components_cut:   { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', badge: '#ede9fe' },
  fabric_cut:       { color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', badge: '#fce7f3' },
  assembly:         { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', badge: '#ffedd5' },
  qc:               { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', badge: '#dcfce7' },
  packing:          { color: '#b45309', bg: '#fffbeb', border: '#fde68a', badge: '#fef3c7' },
  outbound:         { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', badge: '#e0e7ff' },
}

// Peach page background
const PAGE_BG = '#FFF8F3'
const CARD_BG = '#FFFFFF'
const BORDER  = '#F0E8E0'
const TEXT_DARK  = '#1C1917'
const TEXT_MID   = '#78716C'
const TEXT_LIGHT = '#A8A29E'

export default function StationPage() {
  const { token } = useAuthStore()
  const [stationId, setStationId] = useState<string>('')
  const [qrInput, setQrInput] = useState('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qcChecked, setQcChecked] = useState<boolean[]>(QC_CHECKLIST.map(() => false))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('prod_stationId') || ''
    setStationId(saved)
  }, [])

  useEffect(() => {
    if (stationId) localStorage.setItem('prod_stationId', stationId)
  }, [stationId])

  useEffect(() => {
    if (stationId && scanState === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [stationId, scanState])

  const station  = SCAN_STATIONS.find(s => s.id === stationId)
  const accent   = STATION_ACCENT[stationId] || STATION_ACCENT.packing

  const handleScan = useCallback(async (qr: string) => {
    if (!qr.trim() || !stationId) return
    setScanState('loading')
    setError(null)
    try {
      const res = await fetch('/api/production/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qrCode: qr, stationId, action: 'scan' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')
      setScanResult(data as ScanResult)
      setQcChecked(QC_CHECKLIST.map(() => false))
      setScanState('spec')
    } catch (e: any) {
      setError(e.message)
      setScanState('error')
    }
  }, [stationId, token])

  const handleComplete = async () => {
    if (!scanResult) return
    setScanState('completing')
    try {
      const res = await fetch('/api/production/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          qrCode: qrInput,
          stationId,
          action: 'complete',
          qcPassed: stationId === 'qc' ? qcChecked.every(Boolean) : true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setScanState('success')
      setTimeout(() => {
        setScanState('idle')
        setQrInput('')
        setScanResult(null)
      }, 3000)
    } catch (e: any) {
      setError(e.message)
      setScanState('spec')
    }
  }

  const handleReset = () => {
    setScanState('idle')
    setQrInput('')
    setScanResult(null)
    setError(null)
  }

  // ── Station selector ────────────────────────────────────────────────────
  if (!stationId) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b" style={{ borderColor: BORDER }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Logo" style={{ height: 26 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: TEXT_LIGHT }}>Production Control</span>
        </div>

        {/* Title */}
        <div className="text-center pt-12 pb-8 px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#D97706' }}>Shadeotech Production</p>
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: TEXT_DARK }}>Select Your Station</h1>
          <p className="text-base" style={{ color: TEXT_MID }}>Tap the station this device is assigned to</p>
        </div>

        {/* Station grid */}
        <div className="flex-1 px-6 pb-10">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {SCAN_STATIONS.map(s => {
              const a = STATION_ACCENT[s.id] || STATION_ACCENT.packing
              return (
                <button
                  key={s.id}
                  onClick={() => setStationId(s.id)}
                  className="group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: CARD_BG,
                    border: `2px solid ${BORDER}`,
                    minHeight: 190,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = a.color
                    e.currentTarget.style.background = a.bg
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = BORDER
                    e.currentTarget.style.background = CARD_BG
                  }}
                >
                  {/* Icon circle */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl transition-all"
                    style={{ background: a.badge, border: `1.5px solid ${a.border}` }}
                  >
                    {s.icon}
                  </div>
                  <p className="font-black text-lg leading-tight mb-1" style={{ color: TEXT_DARK }}>{s.label}</p>
                  <p className="text-sm leading-snug" style={{ color: TEXT_MID }}>{s.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const allQcPassed = qcChecked.every(Boolean)
  const qcCount     = qcChecked.filter(Boolean).length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      {/* Station header — white bar with colored left accent */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-white border-b"
        style={{ borderColor: BORDER, borderLeft: `5px solid ${accent.color}` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: accent.badge, border: `1.5px solid ${accent.border}` }}
          >
            {station?.icon}
          </div>
          <div>
            <p className="font-black text-xl leading-tight" style={{ color: TEXT_DARK }}>{station?.label}</p>
            <p className="text-sm mt-0.5" style={{ color: TEXT_MID }}>{station?.description}</p>
          </div>
        </div>
        <button
          onClick={() => { setStationId(''); handleReset() }}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all hover:bg-gray-100"
          style={{ color: TEXT_MID, border: `1px solid ${BORDER}` }}
        >
          <ChevronLeft className="h-4 w-4" />
          Change Station
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-5 pb-12">

          {/* ── IDLE / ERROR ─────────────────────────────────────────────────── */}
          {(scanState === 'idle' || scanState === 'error') && (
            <div className="mt-8 space-y-4">
              {/* Scan zone card */}
              <div
                className="rounded-3xl p-10 text-center bg-white"
                style={{ border: `2px dashed ${accent.border}` }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: accent.badge, border: `1.5px solid ${accent.border}` }}
                >
                  <Scan className="h-9 w-9" style={{ color: accent.color }} />
                </div>
                <p className="text-2xl font-black mb-2" style={{ color: TEXT_DARK }}>Ready to Scan</p>
                <p className="text-sm" style={{ color: TEXT_MID }}>
                  Point your barcode scanner at a shade label — input auto-fills below
                </p>
              </div>

              {/* Input */}
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan(qrInput)}
                  placeholder="QR data auto-fills here when you scan…"
                  className="flex-1 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none transition-all bg-white"
                  style={{
                    border: `1.5px solid ${BORDER}`,
                    color: TEXT_DARK,
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  onFocus={e => (e.target.style.borderColor = accent.color)}
                  onBlur={e => (e.target.style.borderColor = BORDER)}
                />
                <button
                  onClick={() => handleScan(qrInput)}
                  disabled={!qrInput.trim()}
                  className="px-7 py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-30 hover:brightness-105 active:brightness-95"
                  style={{ background: accent.color }}
                >
                  Scan
                </button>
              </div>

              {error && (
                <div className="rounded-2xl p-4 flex items-start gap-3 bg-white" style={{ border: '1.5px solid #fca5a5' }}>
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700">Scan Error</p>
                    <p className="text-sm mt-0.5 text-red-500">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LOADING ───────────────────────────────────────────────────────── */}
          {scanState === 'loading' && (
            <div className="flex flex-col items-center justify-center mt-32 gap-5">
              <div
                className="w-14 h-14 rounded-full border-4 animate-spin"
                style={{ borderColor: accent.border, borderTopColor: accent.color }}
              />
              <p className="text-base font-medium" style={{ color: TEXT_MID }}>Looking up item…</p>
            </div>
          )}

          {/* ── SUCCESS ───────────────────────────────────────────────────────── */}
          {scanState === 'success' && (
            <div className="flex flex-col items-center justify-center mt-28 gap-5">
              <div className="w-28 h-28 rounded-full flex items-center justify-center bg-green-100 border-4 border-green-300">
                <CheckCircle2 className="h-14 w-14 text-green-600" />
              </div>
              <p className="text-4xl font-black" style={{ color: TEXT_DARK }}>Stage Complete!</p>
              <p className="text-base" style={{ color: TEXT_LIGHT }}>Resetting for next scan…</p>
            </div>
          )}

          {/* ── SPEC SHEET ────────────────────────────────────────────────────── */}
          {(scanState === 'spec' || scanState === 'completing') && scanResult && (
            <div className="mt-5 space-y-4">
              {/* Identity card */}
              <div
                className="rounded-3xl bg-white overflow-hidden"
                style={{ border: `1.5px solid ${BORDER}`, borderTop: `4px solid ${accent.color}` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-2xl font-black" style={{ color: TEXT_DARK }}>{scanResult.order.orderNumber}</p>
                      <p className="text-base mt-0.5" style={{ color: TEXT_MID }}>
                        {scanResult.order.customerName}
                        {scanResult.order.sideMark ? ` · ${scanResult.order.sideMark}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className="inline-block px-3 py-1 rounded-xl text-white font-bold text-base mb-1"
                        style={{ background: accent.color }}
                      >
                        {scanResult.item.area || 'No Area'}
                      </div>
                      <p className="text-sm" style={{ color: TEXT_MID }}>{scanResult.item.product}</p>
                      <p className="text-xs mt-0.5" style={{ color: TEXT_LIGHT }}>{scanResult.item.width} × {scanResult.item.length}</p>
                    </div>
                  </div>

                  {/* Completed stage pills */}
                  {scanResult.itemStages.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {scanResult.itemStages.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                        >
                          ✓ {STAGE_LABELS[s.stage] || s.stage}
                        </span>
                      ))}
                    </div>
                  )}

                  {scanResult.stageAlreadyDone && (
                    <div
                      className="mt-3 rounded-xl px-4 py-2.5 text-sm font-medium"
                      style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
                    >
                      ⚠ This stage was already logged — completing again will add a new entry
                    </div>
                  )}
                </div>
              </div>

              {/* Spec sections */}
              {scanResult.spec?.sections?.map((section, si) => (
                <div
                  key={si}
                  className="rounded-3xl bg-white overflow-hidden"
                  style={{ border: `1.5px solid ${BORDER}` }}
                >
                  <div className="px-5 py-3" style={{ background: accent.bg, borderBottom: `1px solid ${accent.border}` }}>
                    <p className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: accent.color }}>{section.label}</p>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
                    {section.fields?.map((f, fi) => (
                      <div key={fi} className={f.highlight ? 'col-span-2 sm:col-span-1' : ''}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: TEXT_LIGHT }}>{f.label}</p>
                        <p
                          className={`font-black leading-tight ${f.highlight ? 'text-4xl' : 'text-lg'}`}
                          style={{ color: f.highlight ? accent.color : TEXT_DARK }}
                        >
                          {f.value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* QC Checklist */}
              {stationId === 'qc' && (
                <div
                  className="rounded-3xl bg-white overflow-hidden"
                  style={{ border: `1.5px solid ${BORDER}` }}
                >
                  <div className="px-5 py-3" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-green-700">
                      QC Checklist — {qcCount} / {QC_CHECKLIST.length} passed
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    {QC_CHECKLIST.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const next = [...qcChecked]
                          next[i] = !next[i]
                          setQcChecked(next)
                        }}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-left active:scale-[0.99]"
                        style={
                          qcChecked[i]
                            ? { background: '#f0fdf4', border: '1.5px solid #86efac' }
                            : { background: '#fafaf9', border: `1.5px solid ${BORDER}` }
                        }
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm transition-all"
                          style={
                            qcChecked[i]
                              ? { background: '#16a34a', color: '#fff' }
                              : { background: '#f5f5f4', color: '#a8a29e', border: `2px solid ${BORDER}` }
                          }
                        >
                          {qcChecked[i] ? '✓' : ''}
                        </div>
                        <span
                          className="font-semibold text-base"
                          style={{ color: qcChecked[i] ? '#15803d' : TEXT_DARK }}
                        >
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2 pb-8">
                <button
                  onClick={handleReset}
                  disabled={scanState === 'completing'}
                  className="flex items-center justify-center gap-2 w-1/3 py-5 rounded-2xl font-bold text-base transition-all disabled:opacity-30 bg-white hover:bg-gray-50"
                  style={{ border: `1.5px solid ${BORDER}`, color: TEXT_MID }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={scanState === 'completing' || (stationId === 'qc' && !allQcPassed)}
                  className="flex-1 py-5 rounded-2xl font-black text-xl text-white transition-all disabled:opacity-40 hover:brightness-105 active:brightness-95"
                  style={{ background: accent.color }}
                >
                  {scanState === 'completing'
                    ? 'Saving…'
                    : stationId === 'qc'
                    ? allQcPassed ? '✓  Pass QC' : `${qcCount} / ${QC_CHECKLIST.length} — keep going`
                    : `Complete  ·  ${station?.label}`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
