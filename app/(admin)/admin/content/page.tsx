"use client"

import { useEffect, useState } from "react"
import { RefreshCw, ExternalLink, FileText, Image } from "lucide-react"
import * as contentApi from "@/lib/api/content"
import type { ContentItemDto } from "@/lib/api/types"

type Tab = "blog" | "banners"

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("blog")
  const [blogPosts, setBlogPosts] = useState<ContentItemDto[]>([])
  const [banners, setBanners] = useState<ContentItemDto[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [posts, bans] = await Promise.all([contentApi.blogPosts(), contentApi.banners()])
      setBlogPosts(posts)
      setBanners(bans)
    } catch (e: any) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const items = tab === "blog" ? blogPosts : banners

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="text-gray-500 text-sm">Blog posts & banners</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setTab("blog")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "blog" ? "bg-brand-500 text-black" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
        >
          <FileText className="w-4 h-4" /> Blog Posts ({blogPosts.length})
        </button>
        <button
          onClick={() => setTab("banners")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "banners" ? "bg-brand-500 text-black" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
        >
          <Image className="w-4 h-4" /> Banners ({banners.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No {tab === "blog" ? "blog posts" : "banners"} found.</p>
            <p className="text-xs mt-1 text-gray-300">Content is authored via API or CMS integration.</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.slug}</p>
                  {item.excerpt && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {tab === "blog" && (
                    <a
                      href={`/blog/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-brand-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-orange-800 mb-1">Rich Text Editor Coming Soon</p>
        <p className="text-xs text-brand-600">
          Full TipTap-powered blog post and banner editing (Phase 2). Currently content can be created via the API.
          Use the backend GraphQL playground to create or update content items.
        </p>
      </div>
    </div>
  )
}
