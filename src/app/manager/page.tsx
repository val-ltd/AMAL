
'use client'

import RequestList from "@/components/request-list";
import { getPendingRequests } from "@/lib/data";
import { BudgetRequest } from "@/lib/types";
import { useEffect, useState } from "react";

export default function ManagerPage() {
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  
  useEffect(() => {
    getPendingRequests().then(setRequests);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
      </div>

      <RequestList requests={requests} isManagerView />
    </div>
  );
}
