
'use client'

import type { BudgetRequest } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ApprovalDialog } from '@/components/manager/approval-dialog';
import { Eye, ThumbsUp, Edit, Copy } from 'lucide-react';
import Link from 'next/link';
import { ViewRequestDialog } from './view-request-dialog';

interface ActionButtonsProps {
  request: BudgetRequest;
  isManagerView?: boolean;
}

export function ActionButtons({ request, isManagerView = false }: ActionButtonsProps) {
  const { user } = useAuth();
  const isSupervisor = user?.uid === request.supervisor?.id;
  const isActionable = isManagerView && isSupervisor && request.status === 'pending';
  const isDraft = request.status === 'draft';

  if (isDraft) {
    return (
      <Button asChild>
        <Link href={`/request/new?draft=${request.id}`}>
          <Edit className="mr-2 h-4 w-4" />
          Ubah Draf
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isActionable ? (
        <ApprovalDialog 
          request={request}
          isReadOnly={false}
          triggerButton={<Button><ThumbsUp className="mr-2 h-4 w-4" />Tinjau</Button>}
        />
      ) : (
        <ViewRequestDialog 
          request={request}
          triggerButton={<Button variant="outline"><Eye className="mr-2 h-4 w-4" />Lihat Detail</Button>}
        />
      )}
      {!isManagerView && (
        <Button asChild variant="ghost" size="icon" aria-label="Duplikat Permintaan">
          <Link href={`/request/new?duplicate=${request.id}`}>
            <Copy className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
