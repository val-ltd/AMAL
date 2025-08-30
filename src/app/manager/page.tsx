import RequestList from "@/components/request-list";
import { getPendingRequests } from "@/lib/data";

export default async function ManagerPage() {
  const requests = await getPendingRequests();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
      </div>

      <RequestList requests={requests} isManagerView />
    </div>
  );
}
