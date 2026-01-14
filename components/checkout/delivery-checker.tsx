"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    MapPin, Truck, Clock, CheckCircle, Package, Calendar, AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeliverySlot {
    label: string
    date: string
    extraCharge: number
}

interface DeliveryInfo {
    isServiceable: boolean
    city?: string
    state?: string
    codAvailable?: boolean
    delivery?: {
        standardDays: number
        expressDays: number
        deliveryCharge: number
        expressCharge: number
        freeDeliveryAbove: number
        estimatedDate: string
    }
    slots?: DeliverySlot[]
    error?: string
}

interface DeliveryCheckerProps {
    onSlotSelect?: (slot: DeliverySlot | null) => void
    cartTotal?: number
}

export function DeliveryChecker({ onSlotSelect, cartTotal = 0 }: DeliveryCheckerProps) {
    const { toast } = useToast()
    const [pincode, setPincode] = useState("")
    const [checking, setChecking] = useState(false)
    const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null)

    const checkPincode = async () => {
        if (!/^\d{6}$/.test(pincode)) {
            toast({ title: "Enter valid 6-digit pincode", variant: "destructive" })
            return
        }

        setChecking(true)
        try {
            const res = await fetch(`/api/pincode?pincode=${pincode}`)
            const data = await res.json()
            setDeliveryInfo(data)
            setSelectedSlot(null)

            if (!data.isServiceable) {
                toast({ title: "Delivery not available for this pincode", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Failed to check pincode", variant: "destructive" })
        } finally {
            setChecking(false)
        }
    }

    const handleSlotSelect = (slot: DeliverySlot) => {
        setSelectedSlot(slot)
        onSlotSelect?.(slot)
    }

    const isFreeDelivery = deliveryInfo?.delivery && cartTotal >= deliveryInfo.delivery.freeDeliveryAbove

    return (
        <div className="space-y-4">
            {/* Pincode Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Enter pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="pl-10"
                        maxLength={6}
                    />
                </div>
                <Button
                    onClick={checkPincode}
                    disabled={checking || pincode.length !== 6}
                    variant="outline"
                >
                    {checking ? "Checking..." : "Check"}
                </Button>
            </div>

            {/* Delivery Info */}
            {deliveryInfo && (
                <div className="space-y-3">
                    {deliveryInfo.isServiceable ? (
                        <>
                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Delivering to {deliveryInfo.city}, {deliveryInfo.state}
                            </div>

                            {/* Delivery Options */}
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    {/* Standard Delivery */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium text-sm">Standard Delivery</p>
                                                <p className="text-xs text-gray-500">
                                                    Get by {deliveryInfo.delivery?.estimatedDate}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isFreeDelivery ? (
                                                <Badge className="bg-green-100 text-green-700">FREE</Badge>
                                            ) : (
                                                <span className="font-medium">₹{deliveryInfo.delivery?.deliveryCharge}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Express Delivery */}
                                    {deliveryInfo.delivery?.expressDays && (
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-5 h-5 text-yellow-500" />
                                                <div>
                                                    <p className="font-medium text-sm">Express Delivery</p>
                                                    <p className="text-xs text-gray-500">
                                                        Get in {deliveryInfo.delivery.expressDays} days
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-medium">₹{deliveryInfo.delivery.expressCharge}</span>
                                        </div>
                                    )}

                                    {/* COD */}
                                    {deliveryInfo.codAvailable && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t">
                                            <CheckCircle className="w-4 h-4" />
                                            Cash on Delivery available
                                        </div>
                                    )}

                                    {/* Free delivery hint */}
                                    {!isFreeDelivery && deliveryInfo.delivery && (
                                        <p className="text-xs text-gray-500 pt-2 border-t">
                                            Add ₹{deliveryInfo.delivery.freeDeliveryAbove - cartTotal} more for free delivery
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Delivery Slots */}
                            {deliveryInfo.slots && deliveryInfo.slots.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Choose Delivery Slot
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {deliveryInfo.slots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSlotSelect(slot)}
                                                className={`p-3 border rounded-lg text-left transition-colors ${selectedSlot === slot
                                                        ? "border-yellow-400 bg-yellow-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">{slot.label}</span>
                                                    {slot.extraCharge > 0 && (
                                                        <Badge variant="secondary">+₹{slot.extraCharge}</Badge>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {deliveryInfo.error || "Delivery not available for this pincode"}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
