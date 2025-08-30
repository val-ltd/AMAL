
'use client'

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { getMyRequests } from "@/lib/data"
import RequestList from "@/components/request-list"
import { useEffect, useState } from "react"
import { BudgetRequest } from "@/lib/types"

export default function EmployeeDashboard() {
  const [requests, setRequests] = useState<BudgetRequest[]>([]);

  useEffect(() => {
    getMyRequests().then(setRequests);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Permintaan Saya</h1>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/request/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Permintaan Baru
          </Link>
        </Button>
      </div>

      <RequestList requests={requests} />
    </div>
  )
}
