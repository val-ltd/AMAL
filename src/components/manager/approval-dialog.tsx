'use client';

import type { BudgetRequest } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { updateRequestAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '../status-badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Building, Loader2, ThumbsDown, ThumbsUp, UserCheck } from 'lucide-react';

interface ApprovalDialogProps {
  request: BudgetRequest;
}

export function ApprovalDialog({ request }: ApprovalDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    await updateRequestAction(request.id, status, comment);
    setIsSubmitting(false);
    setOpen(false);
    toast({
      title: `Request ${status}`,
      description: `The budget request for "${request.title}" has been ${status}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Review</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Review Budget Request</DialogTitle>
          <DialogDescription>
            Review the details below and approve or reject the request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className='flex items-center gap-3'>
                <Avatar>
                    <AvatarImage src={request.requester.avatarUrl} alt={request.requester.name} />
                    <AvatarFallback>{request.requester.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-semibold">{request.requester.name}</div>
                    <div className="text-sm text-muted-foreground">
                        Submitted on {format(new Date(request.createdAt), 'PP')}
                    </div>
                </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h3 className="font-semibold">{request.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.description}
              </p>
              <div className="mt-4 text-2xl font-bold">
                ${request.amount.toLocaleString()}
              </div>
            </div>
            <div className="border-t pt-4 space-y-3 text-sm">
                {request.institution && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span>{request.institution} / {request.division}</span>
                    </div>
                )}
                {request.supervisor && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCheck className="w-4 h-4" />
                        <span>Approving Supervisor: {request.supervisor.name}</span>
                    </div>
                )}
            </div>
          </div>
          
          <div>
            <label htmlFor="manager-comment" className="mb-2 block text-sm font-medium">
              Your Comment (Optional)
            </label>
            <Textarea
              id="manager-comment"
              placeholder="Provide a reason for your decision..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleSubmit('rejected')}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
            Reject
          </Button>
          <Button onClick={() => handleSubmit('approved')} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
