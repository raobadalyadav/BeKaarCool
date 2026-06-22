"use client"

import { useState } from "react"
import { Search, CheckCircle2 } from "lucide-react"

interface DeviceCompatibilityProps {
  devices: string[]
}

export function DeviceCompatibility({ devices }: DeviceCompatibilityProps) {
  const [search, setSearch] = useState("")

  const filtered = search
    ? devices.filter((d) => d.toLowerCase().includes(search.toLowerCase()))
    : devices

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search your device..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          {search ? "No compatible devices found matching your search." : "No compatible devices listed."}
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
          {filtered.map((device) => (
            <div key={device} className="flex items-center gap-2 px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{device}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">{devices.length} compatible devices</p>
    </div>
  )
}
