"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"

export function EmployeeSearch() {
  const [query, setQuery] = useState("")

  useEffect(() => {
    const q = query.toLowerCase().trim()
    const rows = document.querySelectorAll<HTMLTableRowElement>("#employee-rows tr")
    rows.forEach((row) => {
      const name = row.dataset.name ?? ""
      const dept = row.dataset.dept ?? ""
      const matches = !q || name.includes(q) || dept.includes(q)
      row.style.display = matches ? "" : "none"
    })
  }, [query])

  return (
    <div className="relative max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#55556a" }} />
      <input
        type="text"
        placeholder="Search employees…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white transition-all"
        style={{
          background: "#16161f",
          border: "1px solid rgba(255,255,255,0.1)",
          outline: "none",
          color: "#f1f1f3",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(79,110,247,0.4)"
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.08)"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
          e.currentTarget.style.boxShadow = "none"
        }}
      />
    </div>
  )
}
