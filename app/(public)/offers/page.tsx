import { Metadata } from "next"
import OffersClient from "./offers-client"

export const metadata: Metadata = {
    title: "Offers & Deals - BeKaarCool",
    description: "Discover amazing deals, discounts, and coupon codes on BeKaarCool. Save big on your favorite products!"
}

export default function OffersPage() {
    return <OffersClient />
}
