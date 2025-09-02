
'use client';

import { Bell, CheckCheck, ThumbsUp, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

// Mock data - this will be replaced with real data later
const notifications = [
  {
    id: '1',
    type: 'request_approved',
    text: 'Permintaan Anda untuk "Pembelian ATK" telah disetujui.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    isRead: false,
  },
  {
    id: '2',
    type: 'request_rejected',
    text: 'Permintaan Anda untuk "Biaya Perjalanan Dinas" ditolak.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: false,
  },
  {
    id: '3',
    type: 'funds_released',
    text: 'Dana untuk permintaan "Konsumsi Rapat" telah dicairkan.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
  },
  {
    id: '4',
    type: 'new_request',
    text: 'Aisha Lestari mengajukan permintaan baru "Pembelian Kertas".',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 1 day ago
    isRead: true,
  }
];

const ICONS: Record<string, JSX.Element> = {
  request_approved: <ThumbsUp className="h-5 w-5 text-green-500" />,
  request_rejected: <XCircle className="h-5 w-5 text-red-500" />,
  funds_released: <CheckCheck className="h-5 w-5 text-blue-500" />,
  new_request: <Bell className="h-5 w-5 text-primary" />,
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50",
                    !notif.isRead && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex-shrink-0">
                    {ICONS[notif.type] || <Bell className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{notif.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: id })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" aria-label="Unread"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">Tidak ada notifikasi baru</h3>
                <p className="text-muted-foreground">
                    Saat ada pembaruan penting, Anda akan melihatnya di sini.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
