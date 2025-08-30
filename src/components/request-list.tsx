import type { BudgetRequest } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from './status-badge';
import { format } from 'date-fns';
import { ApprovalDialog } from './manager/approval-dialog';

interface RequestListProps {
  requests: BudgetRequest[];
  isManagerView?: boolean;
}

export default function RequestList({ requests, isManagerView = false }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center">
        <h3 className="text-xl font-medium">No requests found</h3>
        <p className="text-muted-foreground">
          {isManagerView ? "There are no pending requests to review." : "You haven't submitted any requests yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <Card key={request.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
                <CardTitle className="mb-1 text-lg">{request.title}</CardTitle>
                <StatusBadge status={request.status} />
            </div>
            
            <CardDescription className="flex items-center gap-2 pt-1">
              {!isManagerView ? (
                <span>Submitted on {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
              ) : (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={request.requester.avatarUrl} alt={request.requester.name} />
                    <AvatarFallback>{request.requester.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{request.requester.name}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">{request.description}</p>
          </CardContent>
          <CardFooter className="flex items-end justify-between">
            <div className="text-2xl font-bold">
              ${request.amount.toLocaleString()}
            </div>
            {isManagerView && <ApprovalDialog request={request} />}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
