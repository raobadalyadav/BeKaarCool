import { Metadata } from "next"
import BlogClient from "./blog-client"

export const metadata: Metadata = {
    title: "Blog - BeKaarCool",
    description: "Read the latest fashion tips, style guides, and trending articles on BeKaarCool blog."
}

export default function BlogPage() {
    return <BlogClient />
}
