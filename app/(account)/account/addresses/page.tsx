"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Address {
    _id: string
    name: string
    phone: string
    addressLine1: string
    addressLine2?: string
    address?: string
    city: string
    state: string
    pincode: string
    isDefault: boolean
}

export default function AddressesPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState<Partial<Address>>({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false
    })

    useEffect(() => {
        fetchAddresses()
    }, [])

    const fetchAddresses = async () => {
        try {
            const res = await fetch("/api/addresses")
            if (res.ok) {
                const data = await res.json()
                setAddresses(data.addresses || data || [])
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const method = editingAddress ? "PUT" : "POST"
            const url = editingAddress ? `/api/addresses/${editingAddress._id}` : "/api/addresses"
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })
            if (res.ok) {
                toast({ title: `Address ${editingAddress ? "updated" : "added"} successfully!` })
                resetForm()
                fetchAddresses()
            } else {
                throw new Error("Failed to save address")
            }
        } catch (error) {
            toast({ title: "Error saving address", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return
        try {
            const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" })
            if (res.ok) {
                toast({ title: "Address deleted" })
                fetchAddresses()
            }
        } catch (error) {
            toast({ title: "Error deleting address", variant: "destructive" })
        }
    }

    const startEdit = (addr: Address) => {
        setEditingAddress(addr)
        setForm({
            name: addr.name,
            phone: addr.phone,
            addressLine1: addr.addressLine1 || addr.address || "",
            addressLine2: addr.addressLine2 || "",
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            isDefault: addr.isDefault
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setShowForm(false)
        setEditingAddress(null)
        setForm({
            name: "",
            phone: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
            isDefault: false
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
                <Button
                    onClick={() => {
                        resetForm()
                        setShowForm(true)
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Address
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingAddress ? "Edit Address" : "Add New Address"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Phone Number</Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Address Line 1</Label>
                                <Input
                                    value={form.addressLine1}
                                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Address Line 2 (Optional)</Label>
                                <Input
                                    value={form.addressLine2}
                                    onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>City</Label>
                                <Input
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>State</Label>
                                <Input
                                    value={form.state}
                                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Pincode</Label>
                                <Input
                                    value={form.pincode}
                                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={form.isDefault}
                                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="isDefault">Set as default address</Label>
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                                <Button type="submit" disabled={loading} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingAddress ? "Update" : "Save"} Address
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {addresses.length === 0 && !showForm ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No addresses saved</h3>
                        <p className="text-gray-500 mt-2">Add a new address to get started</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <Card key={addr._id} className={addr.isDefault ? "border-yellow-400 border-2" : ""}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{addr.name}</h3>
                                    {addr.isDefault && (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Default</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">{addr.addressLine1 || addr.address}</p>
                                {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                                <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                                <p className="text-sm text-gray-600 mt-1">Phone: {addr.phone}</p>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(addr)}>
                                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(addr._id)}>
                                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
