import { Metadata } from "next"
import SearchClient from "./search-client"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Search Products - BeKaarCool",
    description: "Search for your favorite fashion products on BeKaarCool."
}

export default function SearchPage() {
    return <Suspense fallback={<div>Loading...</div>}><SearchClient /></Suspense>
}
