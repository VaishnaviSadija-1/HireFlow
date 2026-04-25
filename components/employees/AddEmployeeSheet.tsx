"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  title: string
}

interface AddEmployeeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddEmployeeSheet({ open, onOpenChange }: AddEmployeeSheetProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [managerId, setManagerId] = useState("")
  const [location, setLocation] = useState("")
  const [hireDate, setHireDate] = useState("")
  const [gender, setGender] = useState("")
  const [skills, setSkills] = useState("")

  useEffect(() => {
    if (!open) return

    async function fetchData() {
      try {
        const [deptRes, empRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/employees"),
        ])
        if (deptRes.ok) {
          const depts = await deptRes.json()
          setDepartments(depts)
        }
        if (empRes.ok) {
          const emps = await empRes.json()
          setEmployees(emps)
        }
      } catch {
        // silently fail — dropdowns will just be empty
      }
    }

    fetchData()
  }, [open])

  function resetForm() {
    setName("")
    setEmail("")
    setTitle("")
    setDepartmentId("")
    setManagerId("")
    setLocation("")
    setHireDate("")
    setGender("")
    setSkills("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name || !email || !title || !location || !hireDate) {
      toast.error("Please fill in all required fields")
      return
    }

    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    setLoading(true)
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          title,
          departmentId: departmentId || undefined,
          managerId: managerId || undefined,
          location,
          hireDate,
          gender: gender || undefined,
          skills: skillsArray,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to add employee")
        return
      }

      toast.success("Employee added successfully")
      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Add Employee</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-name">Full Name *</Label>
            <Input
              id="emp-name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-email">Email *</Label>
            <Input
              id="emp-email"
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Job Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-title">Job Title *</Label>
            <Input
              id="emp-title"
              type="text"
              placeholder="Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-department">Department</Label>
            <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
              <SelectTrigger id="emp-department" className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manager */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-manager">Manager</Label>
            <Select value={managerId} onValueChange={(v) => setManagerId(v ?? "")}>
              <SelectTrigger id="emp-manager" className="w-full">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-location">Location *</Label>
            <Input
              id="emp-location"
              type="text"
              placeholder="San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          {/* Hire Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-hire-date">Hire Date *</Label>
            <Input
              id="emp-hire-date"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
            />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-gender">Gender</Label>
            <Select value={gender} onValueChange={(v) => setGender(v ?? "")}>
              <SelectTrigger id="emp-gender" className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skills */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-skills">Skills</Label>
            <Input
              id="emp-skills"
              type="text"
              placeholder="React, Python, SQL"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="text-xs text-slate-400">e.g. React, Python, SQL</p>
          </div>

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Employee"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
