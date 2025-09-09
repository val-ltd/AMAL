
'use client'

import type { BudgetRequest } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ApprovalDialog } from '@/components/manager/approval-dialog';
import { Eye, ThumbsUp, Edit, Copy, Printer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ActionButtonsProps {
  request: BudgetRequest;
  isManagerView?: boolean;
}

export function ActionButtons({ request, isManagerView = false }: ActionButtonsProps) {
  const { user } = useAuth();
  const router = useRouter();

  const isSupervisor = user?.uid === request.supervisor?.id;
  const isActionable = isManagerView && isSupervisor && request.status === 'pending';
  const isDraft = request.status === 'draft';
  const canPrint = request.status === 'approved' || request.status === 'released' || request.status === 'completed';

  const handlePrint = () => {
    window.open(`/request/${request.id}/print`, '_blank');
  };

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
        <ApprovalDialog 
          request={request}
          isReadOnly={true}
          triggerButton={<Button variant="outline"><Eye className="mr-2 h-4 w-4" />Lihat Detail</Button>}
        />
      )}
      {canPrint && (
        <Button variant="outline" size="icon" onClick={handlePrint} aria-label="Cetak Memo">
          <Printer className="h-4 w-4" />
        </Button>
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
