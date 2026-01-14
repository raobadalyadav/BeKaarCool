"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    MessageCircle, Plus, Clock, CheckCircle, AlertCircle, ChevronRight, Send
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Ticket {
    _id: string
    ticketNumber: string
    subject: string
    category: string
    priority: string
    status: string
    messages: Array<{
        sender: "customer" | "support"
        message: string
        createdAt: string
    }>
    createdAt: string
}

export default function SupportPage() {
    const { toast } = useToast()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [showNewTicket, setShowNewTicket] = useState(false)
    const [replyMessage, setReplyMessage] = useState("")
    const [sending, setSending] = useState(false)

    // New ticket form
    const [newTicket, setNewTicket] = useState({
        subject: "",
        category: "other",
        priority: "medium",
        message: ""
    })

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/support/tickets")
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error)
        } finally {
            setLoading(false)
        }
    }

    const createTicket = async () => {
        if (!newTicket.subject || !newTicket.message) {
            toast({ title: "Please fill all fields", variant: "destructive" })
            return
        }

        setSending(true)
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTicket)
            })

            if (res.ok) {
                const data = await res.json()
                toast({ title: `Ticket ${data.ticket.ticketNumber} created!` })
                setShowNewTicket(false)
                setNewTicket({ subject: "", category: "other", priority: "medium", message: "" })
                fetchTickets()
            } else {
                const data = await res.json()
                toast({ title: data.error || "Failed to create ticket", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Failed to create ticket", variant: "destructive" })
        } finally {
            setSending(false)
        }
    }

    const sendReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return

        setSending(true)
        try {
            const res = await fetch(`/api/support/tickets/${selectedTicket._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: replyMessage })
            })

            if (res.ok) {
                const data = await res.json()
                setSelectedTicket({ ...selectedTicket, messages: data.ticket.messages, status: data.ticket.status })
                setReplyMessage("")
                fetchTickets()
            }
        } catch (error) {
            toast({ title: "Failed to send reply", variant: "destructive" })
        } finally {
            setSending(false)
        }
    }

    const closeTicket = async (ticketId: string) => {
        try {
            const res = await fetch(`/api/support/tickets/${ticketId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "close" })
            })

            if (res.ok) {
                toast({ title: "Ticket closed" })
                setSelectedTicket(null)
                fetchTickets()
            }
        } catch (error) {
            toast({ title: "Failed to close ticket", variant: "destructive" })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open": return "bg-blue-100 text-blue-700"
            case "in_progress": return "bg-yellow-100 text-yellow-700"
            case "waiting_customer": return "bg-orange-100 text-orange-700"
            case "resolved": return "bg-green-100 text-green-700"
            case "closed": return "bg-gray-100 text-gray-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                    <DialogTrigger asChild>
                        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                            <Plus className="w-4 h-4 mr-2" /> New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <Input
                                placeholder="Subject"
                                value={newTicket.subject}
                                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            />
                            <Select
                                value={newTicket.category}
                                onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="order">Order Issue</SelectItem>
                                    <SelectItem value="payment">Payment</SelectItem>
                                    <SelectItem value="product">Product</SelectItem>
                                    <SelectItem value="shipping">Shipping</SelectItem>
                                    <SelectItem value="return">Return/Refund</SelectItem>
                                    <SelectItem value="account">Account</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="Describe your issue..."
                                value={newTicket.message}
                                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                                rows={4}
                            />
                            <Button
                                onClick={createTicket}
                                disabled={sending}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                            >
                                {sending ? "Creating..." : "Submit Ticket"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No support tickets</h3>
                        <p className="text-gray-500 mt-2">Create a ticket if you need help</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => (
                        <Card
                            key={ticket._id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedTicket(ticket)}
                        >
                            <CardContent className="py-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm text-gray-500">#{ticket.ticketNumber}</span>
                                        <Badge className={getStatusColor(ticket.status)}>
                                            {ticket.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold">{ticket.subject}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {formatDate(ticket.createdAt)}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    #{selectedTicket.ticketNumber}
                                    <Badge className={getStatusColor(selectedTicket.status)}>
                                        {selectedTicket.status.replace("_", " ")}
                                    </Badge>
                                </DialogTitle>
                                <p className="text-gray-600">{selectedTicket.subject}</p>
                            </DialogHeader>

                            {/* Messages */}
                            <div className="space-y-3 my-4 max-h-60 overflow-y-auto">
                                {selectedTicket.messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg ${msg.sender === "customer"
                                                ? "bg-yellow-50 ml-6"
                                                : "bg-gray-100 mr-6"
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-gray-600 mb-1">
                                            {msg.sender === "customer" ? "You" : "Support"}
                                        </p>
                                        <p className="text-gray-800">{msg.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(msg.createdAt)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Form */}
                            {selectedTicket.status !== "closed" && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type your reply..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && sendReply()}
                                    />
                                    <Button onClick={sendReply} disabled={sending}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Close Button */}
                            {selectedTicket.status !== "closed" && (
                                <Button
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => closeTicket(selectedTicket._id)}
                                >
                                    Close Ticket
                                </Button>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
