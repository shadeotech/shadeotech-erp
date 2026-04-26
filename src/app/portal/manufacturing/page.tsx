'use client'

import { useEffect, useState } from 'react'
import { Loader2, ChevronDown, ChevronUp, Play, Factory } from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
}

export default function ManufacturingPage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/settings/company')
      .then((r) => r.json())
      .then((d) => {
        setVideoUrl(d.manufacturingVideoUrl ?? '')
        setFaqs(d.faqs ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Convert a YouTube watch URL to embed URL if needed
  function toEmbedUrl(url: string): string {
    if (!url) return ''
    if (url.includes('youtube.com/watch?v=')) {
      const id = new URL(url).searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0]
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    return url
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#c8864e]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Factory className="h-5 w-5 text-[#c8864e]" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e8e2db]">
            Our Manufacturing Process
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-[#888]">
          See how Shadeotech crafts every product in-house — from fabric selection to final installation.
        </p>
      </div>

      {/* Video section */}
      {videoUrl ? (
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-[#2a2a2a] bg-black aspect-video">
          <iframe
            src={toEmbedUrl(videoUrl)}
            className="w-full h-full"
            title="Shadeotech Manufacturing Process"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#111] flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-14 w-14 rounded-full bg-[#c8864e]/10 flex items-center justify-center">
            <Play className="h-6 w-6 text-[#c8864e]" />
          </div>
          <p className="text-sm text-gray-400 dark:text-[#666]">Manufacturing video coming soon</p>
        </div>
      )}

      {/* Why we're different */}
      <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Why Shadeotech?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Made In-House', desc: 'Every shade and blind is manufactured at our facility for quality control.' },
            { title: 'Custom Cut', desc: 'Each product is precision-cut to your exact window measurements.' },
            { title: 'Expert Install', desc: 'Our trained installers handle every project from start to finish.' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-[#c8864e]/5 border border-[#c8864e]/10 p-4">
              <p className="text-sm font-medium text-[#c8864e] mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-[#888] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ section */}
      {faqs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
            Frequently Asked Questions
          </h2>
          <div className="rounded-xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden divide-y divide-gray-100 dark:divide-[#2a2a2a]">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white dark:bg-[#111]">
                <button
                  type="button"
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-[#e8e2db] pr-4">
                    {faq.question}
                  </span>
                  {openIdx === idx
                    ? <ChevronUp className="h-4 w-4 text-[#c8864e] shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-gray-400 dark:text-[#555] shrink-0" />}
                </button>
                {openIdx === idx && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 dark:text-[#aaa] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
