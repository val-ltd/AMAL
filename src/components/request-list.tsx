
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
import { id } from 'date-fns/locale';
import { ApprovalDialog } from './manager/approval-dialog';
import { formatDepartment } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';

interface RequestListProps {
  requests: BudgetRequest[];
  isManagerView?: boolean;
}

export default function RequestList({ requests, isManagerView = false }: RequestListProps) {
  const { user } = useAuth();
  
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center">
        <h3 className="text-xl font-medium">Tidak ada permintaan ditemukan</h3>
        <p className="text-muted-foreground">
          {isManagerView ? "Tidak ada permintaan tertunda untuk ditinjau." : "Anda belum mengajukan permintaan apa pun."}
        </p>
      </div>
    );
  }
  
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => {
        const canApprove = user?.uid === request.supervisor?.id;
        const firstItemDescription = request.items && request.items.length > 0 ? request.items[0].description : 'Tidak ada item';
        const itemCount = request.items?.length || 0;

        return (
            <Card key={request.id} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={request.requester.avatarUrl} alt={request.requester.name} />
                            <AvatarFallback>{request.requester.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{isManagerView ? request.requester.name : 'Anda'}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(request.createdAt), 'PP', { locale: id })}
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={request.status} />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div>
                    <h3 className="font-semibold text-lg">{firstItemDescription}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                        {itemCount > 1 ? `dan ${itemCount - 1} item lainnya...` : (request.items?.[0]?.category || 'Permintaan anggaran')}
                    </p>
                </div>
                <Separator />
                <div>
                    <p className="text-sm font-medium">Departemen</p>
                    <p className="text-sm text-muted-foreground">{request.department ? formatDepartment(request.department) : `${request.institution} / ${request.division}`}</p>
                </div>
            </CardContent>
            <CardFooter className="flex items-end justify-between bg-muted/50 p-4 rounded-b-lg">
                <div className="text-xl font-bold">
                {formatRupiah(request.amount)}
                </div>
                <ApprovalDialog 
                    request={request}
                    isReadOnly={!canApprove}
                    triggerButton={
                        <Button variant={isManagerView && canApprove ? 'default' : 'outline'}>
                            {isManagerView && canApprove ? 'Tinjau' : <><Eye className="mr-2 h-4 w-4" />Lihat Detail</>}
                        </Button>
                    }
                />
            </CardFooter>
            </Card>
        )
      })}
    </div>
  );
}
