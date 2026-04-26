'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Send, MessageSquare, Search } from 'lucide-react'

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

function formatTime(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (hrs < 48) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const { token } = useAuthStore()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filtered, setFiltered] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchConversations = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/messages', { headers })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
        setFiltered(data.conversations)

        // Auto-select from URL param
        const paramId = searchParams.get('customer')
        if (paramId) {
          const match = data.conversations.find((c: Conversation) => c.customerId === paramId)
          if (match) openThread(match, data.conversations)
        }
      }
    } catch {}
  }

  const openThread = async (conv: Conversation, convList?: Conversation[]) => {
    setSelected(conv)
    try {
      const res = await fetch(`/api/messages/${conv.customerId}`, { headers })
      if (res.ok) {
        setMessages((await res.json()).messages)
        const list = convList || conversations
        setConversations(list.map((c) => c.customerId === conv.customerId ? { ...c, unreadCount: 0 } : c))
        setFiltered((prev) => prev.map((c) => c.customerId === conv.customerId ? { ...c, unreadCount: 0 } : c))
      }
    } catch {}
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
        // Refresh conversation list to update last message
        fetchConversations()
      }
    } catch {}
    setSending(false)
  }

  useEffect(() => { fetchConversations() }, [token])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(conversations.filter((c) =>
      c.customerName.toLowerCase().includes(q) || c.customerPhone.includes(q)
    ))
  }, [search, conversations])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111]">
      {/* Sidebar — conversation list */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a]">
          <h1 className="text-base font-semibold text-gray-900 dark:text-[#e8e2db] mb-2">Messages</h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-[#555]" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] outline-none focus:border-[#c8864e]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare className="h-10 w-10 text-gray-200 dark:text-[#222] mb-3" />
              <p className="text-sm text-gray-400 dark:text-[#555]">
                {search ? 'No results' : 'No conversations yet'}
              </p>
            </div>
          )}
          {filtered.map((conv) => (
            <button
              key={conv.customerId}
              onClick={() => openThread(conv)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#1a1a1a] text-left transition-colors",
                selected?.customerId === conv.customerId
                  ? "bg-[#c8864e]/8 dark:bg-[#c8864e]/10"
                  : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              )}
            >
              <div className="h-9 w-9 rounded-full bg-[#c8864e]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-[#c8864e]">
                  {conv.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={cn("text-sm text-gray-900 dark:text-[#e8e2db] truncate", conv.unreadCount > 0 && "font-semibold")}>
                    {conv.customerName}
                  </p>
                  <span className="text-[10px] text-gray-400 dark:text-[#555] ml-2 flex-shrink-0">{formatTime(conv.lastMessageAt)}</span>
                </div>
                <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-gray-800 dark:text-[#ccc] font-medium" : "text-gray-500 dark:text-[#666]")}>
                  {conv.lastDirection === 'outbound' ? 'You: ' : ''}{conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-[#c8864e] text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thread area */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
            <div className="h-16 w-16 rounded-full bg-[#c8864e]/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-[#c8864e]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">Select a conversation</h2>
            <p className="text-sm text-gray-400 dark:text-[#555] max-w-xs">
              Choose a customer from the left to view and send SMS messages via Twilio.
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-[#2a2a2a] px-5 py-3.5 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-[#c8864e]/15 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#c8864e]">{selected.customerName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">{selected.customerName}</p>
                <p className="text-xs text-gray-400 dark:text-[#555]">{selected.customerPhone}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((msg, i) => {
                const showDate = i === 0 || formatTime(messages[i - 1].createdAt) !== formatTime(msg.createdAt)
                return (
                  <div key={msg.id}>
                    {showDate && i > 0 && (
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-gray-100 dark:bg-[#1e1e1e]" />
                        <span className="text-[10px] text-gray-400 dark:text-[#555]">{formatTime(msg.createdAt)}</span>
                        <div className="flex-1 h-px bg-gray-100 dark:bg-[#1e1e1e]" />
                      </div>
                    )}
                    <div className={cn("flex", msg.direction === 'outbound' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm",
                        msg.direction === 'outbound'
                          ? "bg-[#c8864e] text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-[#e8e2db] rounded-bl-sm"
                      )}>
                        <p className="text-sm leading-relaxed break-words">{msg.body}</p>
                        <p className={cn("text-[10px] mt-1", msg.direction === 'outbound' ? "text-white/60 text-right" : "text-gray-400 dark:text-[#555]")}>
                          {msg.direction === 'outbound' && msg.staffName ? `${msg.staffName} · ` : ''}
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-5 py-4 flex-shrink-0">
              <div className="flex items-end gap-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder={`Message ${selected.customerName}…`}
                  className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] outline-none max-h-40"
                  style={{ minHeight: '24px' }}
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#c8864e] text-white disabled:opacity-40 hover:bg-[#b87640] transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-[#555]">
                SMS via Twilio · Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
