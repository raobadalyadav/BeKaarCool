"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const RING_SIZES = [
  { size: "6",  us: "6",   uk: "L",    india: "12", diameter: "16.5" },
  { size: "7",  us: "7",   uk: "N",    india: "14", diameter: "17.3" },
  { size: "8",  us: "8",   uk: "P",    india: "16", diameter: "18.2" },
  { size: "9",  us: "9",   uk: "R",    india: "18", diameter: "19.0" },
  { size: "10", us: "10",  uk: "T",    india: "20", diameter: "19.8" },
  { size: "11", us: "11",  uk: "V",    india: "22", diameter: "20.6" },
  { size: "12", us: "12",  uk: "X",    india: "24", diameter: "21.4" },
  { size: "13", us: "13",  uk: "Z",    india: "26", diameter: "22.2" },
  { size: "14", us: "13½", uk: "Z+1",  india: "28", diameter: "23.0" },
  { size: "15", us: "14",  uk: "Z+2",  india: "30", diameter: "23.8" },
]

export function RingSizeGuide() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-teal-600 text-sm font-semibold flex items-center gap-1 hover:underline"
      >
        Find Your Ring Size →
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ring Size Guide</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Measure the inner diameter of a ring that fits you well, or use a piece of string to measure your finger circumference and divide by π (3.14).
            </p>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-3 py-2 font-medium">India</th>
                    <th className="px-3 py-2 font-medium">US / Canada</th>
                    <th className="px-3 py-2 font-medium">UK / Australia</th>
                    <th className="px-3 py-2 font-medium">Diameter (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {RING_SIZES.map((r, i) => (
                    <tr key={r.india} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-3 py-2 font-semibold text-gray-900">{r.india}</td>
                      <td className="px-3 py-2 text-gray-600">{r.us}</td>
                      <td className="px-3 py-2 text-gray-600">{r.uk}</td>
                      <td className="px-3 py-2 text-gray-600">{r.diameter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <strong>Tip:</strong> Fingers swell during the day — measure your ring size in the evening for best accuracy. If between sizes, go up.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
