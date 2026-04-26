'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { ArrowLeft, Send, MessageSquare, Phone } from 'lucide-react'

interface Conversation {
  customerId: string
  customerName: string
  customerPhone: string
  lastMessage: string
  lastMessageAt: string
  lastDirection: 'inbound' | 'outbound'
  unreadCount: number
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  status: string
  staffName?: string
  createdAt: string
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days}d`
}

interface Props {
  open: boolean
  onClose: () => void
}

export function MessagingPanel({ open, onClose }: Props) {
  const { token } = useAuthStore()
  const [view, setView] = useState<'list' | 'thread'>('list')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchConversations = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/messages', { headers })
      if (res.ok) setConversations((await res.json()).conversations)
    } catch {}
  }

  const openThread = async (conv: Conversation) => {
    setSelected(conv)
    setView('thread')
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/messages/${conv.customerId}`, { headers })
      if (res.ok) {
        setMessages((await res.json()).messages)
        // Mark as read locally
        setConversations((prev) =>
          prev.map((c) => c.customerId === conv.customerId ? { ...c, unreadCount: 0 } : c)
        )
      }
    } catch {}
    setLoadingThread(false)
  }

  const send = async () => {
    if (!draft.trim() || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${selected.customerId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setDraft('')
      }
    } catch {}
    setSending(false)
  }

  useEffect(() => {
    if (open) fetchConversations()
  }, [open, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen w-[360px] flex-col border-l border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center gap-3 border-b border-gray-200 dark:border-[#2a2a2a] px-4 flex-shrink-0">
          {view === 'thread' && (
            <button
              onClick={() => { setView('list'); setSelected(null); setMessages([]) }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1e1e1e] text-gray-500 dark:text-[#888]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            {view === 'list' ? (
              <span className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Messages</span>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db] truncate">{selected?.customerName}</p>
                <p className="text-xs text-gray-400 dark:text-[#555]">{selected?.customerPhone}</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#aaa] text-lg leading-none">×</button>
        </div>

        {/* Conversation List */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <MessageSquare className="h-10 w-10 text-gray-200 dark:text-[#2a2a2a] mb-3" />
                <p className="text-sm font-medium text-gray-400 dark:text-[#555]">No messages yet</p>
                <p className="text-xs text-gray-300 dark:text-[#444] mt-1">Messages from customers will appear here</p>
              </div>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.customerId}
                onClick={() => openThread(conv)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#1e1e1e] text-left transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-[#c8864e]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-[#c8864e]">
                    {conv.customerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn("text-sm text-gray-900 dark:text-[#e8e2db] truncate", conv.unreadCount > 0 && "font-semibold")}>
                      {conv.customerName}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-[#555] flex-shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <p className={cn("text-xs text-gray-500 dark:text-[#777] truncate", conv.unreadCount > 0 && "text-gray-800 dark:text-[#ccc]")}>
                    {conv.lastDirection === 'outbound' ? 'You: ' : ''}{conv.lastMessage}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="h-5 w-5 rounded-full bg-[#c8864e] text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0 mt-1">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Thread View */}
        {view === 'thread' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loadingThread && (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-[#2a2a2a] border-t-[#c8864e] animate-spin" />
                </div>
              )}
              {!loadingThread && messages.length === 0 && (
                <p className="text-center text-xs text-gray-400 dark:text-[#555] py-8">No messages yet. Send the first one.</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.direction === 'outbound' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                    msg.direction === 'outbound'
                      ? "bg-[#c8864e] text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-[#e8e2db] rounded-bl-sm"
                  )}>
                    <p className="leading-relaxed break-words">{msg.body}</p>
                    <p className={cn("text-[10px] mt-1", msg.direction === 'outbound' ? "text-white/60 text-right" : "text-gray-400 dark:text-[#555]")}>
                      {msg.direction === 'outbound' && msg.staffName ? `${msg.staffName} · ` : ''}
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-3 py-3 flex-shrink-0">
              <div className="flex items-end gap-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Type a message…"
                  className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] outline-none max-h-32"
                  style={{ minHeight: '22px' }}
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#c8864e] text-white disabled:opacity-40 hover:bg-[#b87640] transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400 dark:text-[#555] text-center">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
