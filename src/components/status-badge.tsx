import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'released';
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300',
    released: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300',
  };

  const statusText = {
    pending: 'Tertunda',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    released: 'Dicairkan',
  }

  return (
    <Badge variant="outline" className={cn("capitalize border-none", statusStyles[status], className)}>
      {statusText[status]}
    </Badge>
  )
}
