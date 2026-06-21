"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import * as adminApi from "@/lib/api/admin"
import * as productsApi from "@/lib/api/products"
import type { ProductDto, VariantDto } from "@/lib/api/types"
import { minorToRupees } from "@/lib/api/config"
import { MediaUploader } from "@/components/ui/media-uploader"
import Image from "next/image"

interface VariantForm {
  id?: string
  sku: string
  priceMinor: string
  compareAtMinor: string
  costMinor: string
  weightGrams: string
  optionsJson: string  // e.g. {"size":"M","color":"Black"}
}

const emptyVariant = (): VariantForm => ({
  sku: "", priceMinor: "", compareAtMinor: "", costMinor: "", weightGrams: "", optionsJson: '{"size":"","color":""}',
})

interface Props {
  product?: ProductDto
}

export function ProductForm({ product }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Basic fields
  const [title, setTitle] = useState(product?.title ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [status, setStatus] = useState<"draft" | "published" | "archived">(product?.status ?? "draft")
  const [brandId, setBrandId] = useState(product?.brandId ?? "")
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "")
  const [descriptionHtml, setDescriptionHtml] = useState(product?.descriptionHtml ?? "")
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "")

  // Extended fields
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [videos, setVideos] = useState<string[]>(product?.videos ?? [])
  const [view360, setView360] = useState<string[]>(product?.view360Images ?? [])
  const [highlightsText, setHighlightsText] = useState((product?.highlights ?? []).join("\n"))
  const [tagsText, setTagsText] = useState((product?.tags ?? []).join(", "))
  const [specificationsText, setSpecificationsText] = useState(() => {
    if (!product?.specificationsJson) return ""
    try {
      const obj = JSON.parse(product.specificationsJson)
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join("\n")
    } catch { return "" }
  })

  // Fashion / Jewellery / Mobile Accessories attributes
  const [fashionFabric, setFashionFabric] = useState(() => {
    try { const a = JSON.parse(product?.attributesJson ?? "{}"); return (a.fabric as string) ?? "" } catch { return "" }
  })
  const [fashionFitType, setFashionFitType] = useState(() => {
    try { const a = JSON.parse(product?.attributesJson ?? "{}"); return (a.fitType as string) ?? "" } catch { return "" }
  })
  const [fashionCareText, setFashionCareText] = useState(() => {
    try { const a = JSON.parse(product?.attributesJson ?? "{}"); const c = a.careInstructions; return Array.isArray(c) ? c.join("\n") : "" } catch { return "" }
  })
  const [fashionFitGuideJson, setFashionFitGuideJson] = useState(() => {
    try { const a = JSON.parse(product?.attributesJson ?? "{}"); return a.fitGuide ? JSON.stringify(a.fitGuide, null, 2) : "" } catch { return "" }
  })
  const [fashionRingSizeGuide, setFashionRingSizeGuide] = useState(() => {
    try { const a = JSON.parse(product?.attributesJson ?? "{}"); return !!a.ringSizeGuide } catch { return false }
  })
  const [fashionCompatibilityText, setFashionCompatibilityText] = useState(() => {
    try { const a = JSON.parse(product?.attributesJson ?? "{}"); const c = a.compatibility; return Array.isArray(c) ? c.join("\n") : "" } catch { return "" }
  })

  // Variants
  const [variants, setVariants] = useState<VariantForm[]>(() =>
    product?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      priceMinor: String(minorToRupees(v.priceMinor)),
      compareAtMinor: v.compareAtMinor ? String(minorToRupees(v.compareAtMinor)) : "",
      costMinor: v.costMinor ? String(minorToRupees(v.costMinor)) : "",
      weightGrams: String(v.weightGrams ?? ""),
      optionsJson: v.optionsJson,
    })) ?? [emptyVariant()]
  )

  // Reference data
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parentId?: string }>>([])
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    Promise.all([productsApi.listCategories(), productsApi.listBrands()])
      .then(([cats, brnds]) => { setCategories(cats); setBrands(brnds) })
  }, [])

  // Auto-generate slug from title
  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!product) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
  }

  const rupeesToMinor = (rupees: string) => {
    const n = parseFloat(rupees)
    return isNaN(n) ? "0" : String(Math.round(n * 100))
  }

  const handleSave = async () => {
    if (!title || !slug) { setMsg({ type: "err", text: "Title and slug are required" }); return }

    setSaving(true)
    setMsg(null)
    try {
      const highlights = highlightsText.split("\n").map((s) => s.trim()).filter(Boolean)
      const tags = tagsText.split(",").map((s) => s.trim()).filter(Boolean)
      const specifications: Record<string, string> = {}
      specificationsText.split("\n").forEach((line) => {
        const idx = line.indexOf(":")
        if (idx > 0) {
          specifications[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
        }
      })

      // Build fashion attributes JSON
      const fashionAttrs: Record<string, unknown> = {}
      if (fashionFabric.trim()) fashionAttrs.fabric = fashionFabric.trim()
      if (fashionFitType.trim()) fashionAttrs.fitType = fashionFitType.trim()
      const careArr = fashionCareText.split("\n").map((s) => s.trim()).filter(Boolean)
      if (careArr.length) fashionAttrs.careInstructions = careArr
      if (fashionFitGuideJson.trim()) {
        try { fashionAttrs.fitGuide = JSON.parse(fashionFitGuideJson) } catch { /* skip invalid */ }
      }
      if (fashionRingSizeGuide) fashionAttrs.ringSizeGuide = true
      const compatArr = fashionCompatibilityText.split("\n").map((s) => s.trim()).filter(Boolean)
      if (compatArr.length) fashionAttrs.compatibility = compatArr

      const productInput = {
        slug, title, status,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        shortDescription: shortDescription || undefined,
        highlightsJson: highlights.length ? JSON.stringify(highlights) : undefined,
        tagsJson: tags.length ? JSON.stringify(tags) : undefined,
        specificationsJson: Object.keys(specifications).length ? JSON.stringify(specifications) : undefined,
        imagesJson: images.length ? JSON.stringify(images) : undefined,
        videosJson: videos.length ? JSON.stringify(videos) : undefined,
        view360Json: view360.length ? JSON.stringify(view360) : undefined,
        fashionAttrsJson: Object.keys(fashionAttrs).length ? JSON.stringify(fashionAttrs) : undefined,
      }

      let savedProduct: ProductDto
      if (product) {
        savedProduct = await adminApi.adminUpdateProduct(product.id, productInput)
      } else {
        savedProduct = await adminApi.adminCreateProduct(productInput)
      }

      // Save/update variants
      for (const v of variants) {
        const vInput = {
          sku: v.sku,
          priceMinor: rupeesToMinor(v.priceMinor),
          compareAtMinor: v.compareAtMinor ? rupeesToMinor(v.compareAtMinor) : undefined,
          costMinor: v.costMinor ? rupeesToMinor(v.costMinor) : undefined,
          weightGrams: v.weightGrams ? parseInt(v.weightGrams) : undefined,
          optionsJson: v.optionsJson,
        }
        if (v.id) {
          await adminApi.adminUpdateVariant(v.id, vInput)
        } else {
          await adminApi.adminCreateVariant({ ...vInput, productId: savedProduct.id })
        }
      }

      setMsg({ type: "ok", text: product ? "Product updated!" : "Product created!" })
      if (!product) setTimeout(() => router.push("/admin/products"), 1000)
    } catch (e: any) {
      setMsg({ type: "err", text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const updateVariant = (i: number, field: keyof VariantForm, value: string) => {
    setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  const deleteVariant = async (i: number) => {
    const v = variants[i]
    if (v?.id) {
      if (!confirm(`Delete variant "${v.sku}"?`)) return
      await adminApi.adminDeleteVariant(v.id)
    }
    setVariants((prev) => prev.filter((_, idx) => idx !== i))
  }

  // Group categories for nested display
  const topCats = categories.filter((c) => !c.parentId)
  const subCats = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  return (
    <div className="max-w-5xl mx-auto">
      {msg && (
        <div className={`flex items-center gap-2 mb-6 p-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="e.g. Premium Cotton T-Shirt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="premium-cotton-t-shirt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="One-line summary shown below the product title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description (HTML)</label>
                <textarea
                  value={descriptionHtml}
                  onChange={(e) => setDescriptionHtml(e.target.value)}
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder="<p>Full product description...</p>"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Product Media (Images, Video, 360)</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 border rounded overflow-hidden group">
                      <Image src={url} alt={`Image ${i}`} fill className="object-cover" />
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <MediaUploader kind="image" maxFiles={5} onUploadComplete={(url) => setImages(prev => [...prev, url])} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {videos.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 border rounded overflow-hidden group bg-gray-100 flex items-center justify-center">
                      <video src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setVideos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 z-10"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <MediaUploader kind="video" maxFiles={2} onUploadComplete={(url) => setVideos(prev => [...prev, url])} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">360-Degree Views (Images)</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {view360.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 border rounded overflow-hidden group">
                      <Image src={url} alt={`360 ${i}`} fill className="object-cover" />
                      <button type="button" onClick={() => setView360(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <MediaUploader kind="image" maxFiles={10} onUploadComplete={(url) => setView360(prev => [...prev, url])} />
              </div>
            </div>
          </div>

          {/* Highlights & Specs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Highlights & Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
                <p className="text-xs text-gray-400 mb-1">One highlight per line</p>
                <textarea
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder={"100% Pure Cotton\nMachine Washable\nOversized Fit"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                <p className="text-xs text-gray-400 mb-1">Format: Key: Value (one per line)</p>
                <textarea
                  value={specificationsText}
                  onChange={(e) => setSpecificationsText(e.target.value)}
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder={"Material: 100% Cotton\nFit: Regular\nSleeve: Half Sleeve\nPattern: Solid"}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                placeholder="cotton, summer, casual, t-shirt (comma separated)"
              />
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Variants</h2>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="w-4 h-4" /> Add Variant
              </button>
            </div>
            <div className="space-y-4">
              {variants.map((v, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => deleteVariant(i)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">SKU *</label>
                      <input
                        value={v.sku}
                        onChange={(e) => updateVariant(i, "sku", e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F38508]"
                        placeholder="TSHIRT-BLK-M"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        value={v.priceMinor}
                        onChange={(e) => updateVariant(i, "priceMinor", e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F38508]"
                        placeholder="999"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        value={v.compareAtMinor}
                        onChange={(e) => updateVariant(i, "compareAtMinor", e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F38508]"
                        placeholder="1999"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cost Price (₹)</label>
                      <input
                        type="number"
                        value={v.costMinor}
                        onChange={(e) => updateVariant(i, "costMinor", e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F38508]"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Weight (grams)</label>
                      <input
                        type="number"
                        value={v.weightGrams}
                        onChange={(e) => updateVariant(i, "weightGrams", e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#F38508]"
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Options (JSON)</label>
                      <input
                        value={v.optionsJson}
                        onChange={(e) => updateVariant(i, "optionsJson", e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#F38508]"
                        placeholder='{"size":"M","color":"Black"}'
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fashion / Jewellery / Mobile Accessories */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Fashion, Jewellery & Mobile Details</h2>
            <p className="text-xs text-gray-400 mb-4">Category-specific fields — leave blank if not applicable</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabric / Material</label>
                  <input
                    value={fashionFabric}
                    onChange={(e) => setFashionFabric(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                    placeholder="e.g. 100% Cotton, 925 Sterling Silver"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fit Type</label>
                  <select
                    value={fashionFitType}
                    onChange={(e) => setFashionFitType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  >
                    <option value="">— Select Fit —</option>
                    <option>Regular Fit</option>
                    <option>Slim Fit</option>
                    <option>Oversized Fit</option>
                    <option>Relaxed Fit</option>
                    <option>Loose Fit</option>
                    <option>Skinny Fit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
                <p className="text-xs text-gray-400 mb-1">One instruction per line</p>
                <textarea
                  value={fashionCareText}
                  onChange={(e) => setFashionCareText(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder={"Machine wash cold\nDo not bleach\nTumble dry low"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size Chart (JSON)</label>
                <p className="text-xs text-gray-400 mb-1">{'{"columns":["Size","Chest"],"rows":[{"Size":"S","Chest":"36"}]}'}</p>
                <textarea
                  value={fashionFitGuideJson}
                  onChange={(e) => setFashionFitGuideJson(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder='{"columns":["Size","Chest (in)","Waist (in)"],"rows":[{"Size":"S","Chest (in)":"36","Waist (in)":"30"}]}'
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ringSizeGuide"
                  checked={fashionRingSizeGuide}
                  onChange={(e) => setFashionRingSizeGuide(e.target.checked)}
                  className="w-4 h-4 accent-[#F38508]"
                />
                <label htmlFor="ringSizeGuide" className="text-sm font-medium text-gray-700">
                  Show Ring Size Guide on product page (Jewellery)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compatible Devices (Mobile Accessories)</label>
                <p className="text-xs text-gray-400 mb-1">One device per line</p>
                <textarea
                  value={fashionCompatibilityText}
                  onChange={(e) => setFashionCompatibilityText(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
                  placeholder={"iPhone 15 Pro Max\niPhone 15 Pro\nSamsung Galaxy S24 Ultra\nOnePlus 12"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Publish */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 bg-[#F38508] hover:bg-[#D97706] disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {saving ? "Saving..." : product ? "Update Product" : "Create Product"}
            </button>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Category</h2>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
            >
              <option value="">— Select Category —</option>
              {topCats.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name}</option>
                  {subCats(c.id).map((sc) => (
                    <option key={sc.id} value={sc.id}>  ↳ {sc.name}</option>
                  ))}
                </optgroup>
              ))}
              {categories.filter((c) => !c.parentId && subCats(c.id).length === 0).length === 0 &&
                categories.filter((c) => !topCats.some((tc) => tc.id === c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              }
            </select>
          </div>

          {/* Brand */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Brand</h2>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F38508]"
            >
              <option value="">— Select Brand —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
