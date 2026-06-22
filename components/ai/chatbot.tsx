"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react"
import { aiChat } from "@/lib/api/ai"

interface Message {
  role: "user" | "assistant"
  content: string
}

const QUICK_ACTIONS = [
  "Track my order",
  "Help me find my size",
  "What's your return policy?",
  "Do you offer free shipping?",
]

export function Chatbot() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const context = (() => {
        const parts: string[] = []
        const lastOrder = localStorage.getItem("bf_last_order")
        if (lastOrder) parts.push(`Last order: ${lastOrder}`)
        const page = window.location.pathname
        if (page.includes("/products/")) {
          const slug = page.split("/products/")[1]
          if (slug) parts.push(`Customer is viewing product: ${slug}`)
        }
        return parts.join(". ") || undefined
      })()

      const reply = await aiChat(newMessages, context)
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-charcoal-900 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: "480px" }}>
          {/* Header */}
          <div className="bg-brand-500 px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Baefikra Assistant</p>
              <p className="text-white/70 text-xs">Online · Typically replies instantly</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-brand-500" />
                  </div>
                  <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2 text-sm text-gray-700 max-w-[85%]">
                    Hi! I'm your Baefikra shopping assistant. How can I help you today?
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 ml-9">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="text-xs border border-brand-500 text-brand-500 px-2.5 py-1 rounded-full hover:bg-brand-100 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-brand-500" />
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                    m.role === "user"
                      ? "bg-brand-500 text-charcoal-900 rounded-tr-none"
                      : "bg-gray-50 text-gray-700 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask me anything..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-lg bg-brand-500 text-charcoal-900 flex items-center justify-center hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
