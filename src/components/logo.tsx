import { Wallet } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-foreground group-data-[collapsible=icon]:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
        </div>
        <span className="text-foreground">BudgetFlow</span>
    </Link>
  );
}
