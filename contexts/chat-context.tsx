"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Message {
  id: string
  text: string
  sender: "user" | "support"
  timestamp: Date
}

interface ChatContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void
  isOnline: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Simulate support availability
    const checkOnlineStatus = () => {
      const now = new Date()
      const hour = now.getHours()
      setIsOnline(hour >= 9 && hour <= 18) // 9 AM to 6 PM
    }

    checkOnlineStatus()
    const interval = setInterval(checkOnlineStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])

    // Auto-reply for demo purposes
    if (message.sender === "user") {
      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for your message. A support representative will be with you shortly.",
          sender: "support",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, autoReply])
      }, 1000)
    }
  }

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, messages, addMessage, isOnline }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
