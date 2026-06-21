"use client"

import { useState } from "react"
import { Upload, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import * as adminApi from "@/lib/api/admin"

const TEMPLATE_CSV = `slug,title,description,brandSlug,categorySlug,sku,priceMinor,compareAtMinor,weightGrams,options
example-tshirt,Example T-Shirt,A great tshirt,brand-name,t-shirts,TSHIRT-BLK-M,49900,69900,200,"{""Color"":""Black"",""Size"":""M""}"
example-tshirt,Example T-Shirt,A great tshirt,brand-name,t-shirts,TSHIRT-BLK-L,49900,69900,210,"{""Color"":""Black"",""Size"":""L""}"
`

const FIELDS = [
  { name: "slug", desc: "Unique product URL slug (shared across variants)", required: true },
  { name: "title", desc: "Product display name", required: true },
  { name: "description", desc: "Short description (plain text)", required: false },
  { name: "brandSlug", desc: "Slug of existing brand", required: false },
  { name: "categorySlug", desc: "Slug of existing category", required: false },
  { name: "sku", desc: "Unique SKU for this variant", required: true },
  { name: "priceMinor", desc: "Price in paise (₹499 = 49900)", required: true },
  { name: "compareAtMinor", desc: "Original price in paise (for strikethrough)", required: false },
  { name: "weightGrams", desc: "Shipping weight in grams", required: false },
  { name: "options", desc: 'JSON object of variant options e.g. {"Color":"Red","Size":"M"}', required: false },
]

export default function AdminBulkUploadPage() {
  const [csv, setCsv] = useState("")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<adminApi.BulkImportResult | null>(null)
  const [error, setError] = useState("")

  const handleImport = async () => {
    if (!csv.trim()) return
    setImporting(true)
    setError("")
    setResult(null)
    try {
      const res = await adminApi.adminBulkImportProducts(csv)
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsv((ev.target?.result as string) ?? "")
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "baefikra-bulk-upload-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
        <p className="text-gray-500 text-sm">Import or update multiple products at once via CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: instructions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">CSV Format</h2>
            <div className="space-y-2">
              {FIELDS.map((f) => (
                <div key={f.name} className="text-xs">
                  <span className="font-mono text-[#F38508]">{f.name}</span>
                  {f.required && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-gray-500 ml-1">— {f.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-3">
                Rows with the same <span className="font-mono">slug</span> are grouped as variants of the same product.
              </p>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-[#F38508] font-medium hover:underline"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Notes</p>
            <p>• Existing products with same <span className="font-mono">slug</span> are updated.</p>
            <p>• Existing SKUs are updated; new SKUs create new variants.</p>
            <p>• <span className="font-mono">brandSlug</span> and <span className="font-mono">categorySlug</span> must already exist.</p>
            <p>• Use UTF-8 encoding. Wrap fields with commas in double quotes.</p>
          </div>
        </div>

        {/* Right: upload area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Upload CSV</h2>

            {/* File picker */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-[#F38508] transition-colors group">
              <Upload className="w-8 h-8 text-gray-300 group-hover:text-[#F38508] mb-2 transition-colors" />
              <p className="text-sm text-gray-500 font-medium">Click to choose a CSV file</p>
              <p className="text-xs text-gray-400 mt-1">or paste CSV below</p>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} />
            </label>

            <div className="my-3 flex items-center gap-3">
              <div className="flex-1 border-t" />
              <span className="text-xs text-gray-400">or paste CSV</span>
              <div className="flex-1 border-t" />
            </div>

            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={10}
              placeholder="slug,title,description,brandSlug,categorySlug,sku,priceMinor,..."
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#F38508] resize-none text-gray-700 placeholder-gray-300"
            />

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleImport}
                disabled={!csv.trim() || importing}
                className="flex items-center gap-2 bg-[#F38508] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#d97507] disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                {importing ? "Importing..." : "Import Products"}
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Import Results</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                    <p className="text-xs text-green-600">Imported</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{result.skipped}</p>
                    <p className="text-xs text-gray-500">Skipped</p>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {result.errors.length} errors
                  </p>
                  <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
