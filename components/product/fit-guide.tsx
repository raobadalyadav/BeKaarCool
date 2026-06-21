"use client"

interface FitGuideProps {
  fitGuide: {
    columns: string[]
    rows: Record<string, string>[]
  }
}

export function FitGuide({ fitGuide }: FitGuideProps) {
  const { columns, rows } = fitGuide
  if (!columns?.length || !rows?.length) return null

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm text-center">
        <thead>
          <tr className="bg-gray-900 text-white">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2.5 font-medium whitespace-nowrap capitalize">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              {columns.map((col) => (
                <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                  {row[col] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
