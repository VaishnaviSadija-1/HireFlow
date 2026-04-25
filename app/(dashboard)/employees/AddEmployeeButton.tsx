"use client"

import { useState } from "react"
import { AddEmployeeSheet } from "@/components/employees/AddEmployeeSheet"

export function AddEmployeeButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200"
        style={{
          background: "#4f6ef7",
          boxShadow: "0 4px 14px rgba(79,110,247,0.3)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(79,110,247,0.5)"
          ;(e.currentTarget as HTMLButtonElement).style.background = "#4060e8"
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(79,110,247,0.3)"
          ;(e.currentTarget as HTMLButtonElement).style.background = "#4f6ef7"
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Employee
      </button>

      <AddEmployeeSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
