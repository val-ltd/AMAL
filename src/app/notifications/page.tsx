

'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, ThumbsUp, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { getNotifications, markNotificationAsRead } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const ICONS: Record<string, JSX.Element> = {
  request_approved: <ThumbsUp className="h-5 w-5 text-green-500" />,
  request_rejected: <XCircle className="h-5 w-5 text-red-500" />,
  funds_released: <CheckCheck className="h-5 w-5 text-blue-500" />,
  new_request: <Bell className="h-5 w-5 text-primary" />,
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      setLoading(true);
      unsubscribe = getNotifications((fetchedNotifications) => {
        setNotifications(fetchedNotifications);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
      if (!notification.isRead) {
          await markNotificationAsRead(notification.id);
      }
  };

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-medium">Tidak ada notifikasi baru</h3>
          <p className="text-muted-foreground">
            Saat ada pembaruan penting, Anda akan melihatnya di sini.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {notifications.map((notif) => (
          <Link 
            href={`/request/${notif.requestId}?from=notifications`} 
            key={notif.id}
            onClick={() => handleNotificationClick(notif)} 
            className="block"
          >
            <div
              className={cn(
                'flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50',
                !notif.isRead && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="flex-shrink-0 mt-1">
                {ICONS[notif.type] || <Bell className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{notif.title}</p>
                <p className="text-sm text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                </p>
              </div>
              {!notif.isRead && (
                <div
                  className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"
                  aria-label="Unread"
                ></div>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notifikasi</CardTitle>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
