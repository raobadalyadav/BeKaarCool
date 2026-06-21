import { Metadata } from "next"
import CompareClient from "./compare-client"

export const metadata: Metadata = {
    title: "Compare Products | Baefikra",
    description: "Compare products on Baefikra",
}

export default function ComparePage() {
    return <CompareClient />
}
