import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { getMyRequests } from "@/lib/data"
import RequestList from "@/components/request-list"

export default async function EmployeeDashboard() {
  const requests = await getMyRequests()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
        <Button asChild>
          <Link href="/request/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <RequestList requests={requests} />
    </div>
  )
}