

'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, FilePlus, ThumbsUp, Trash2, XCircle, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { getNotifications, markNotificationAsRead, deleteNotification, deleteReadNotifications } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


const ICONS: Record<string, JSX.Element> = {
  request_approved: <ThumbsUp className="h-5 w-5 text-green-500" />,
  request_rejected: <XCircle className="h-5 w-5 text-red-500" />,
  funds_released: <CheckCheck className="h-5 w-5 text-blue-500" />,
  new_request: <FilePlus className="h-5 w-5 text-primary" />,
  request_submitted: <FilePlus className="h-5 w-5 text-gray-500" />,
  ready_for_release: <FileWarning className="h-5 w-5 text-orange-500" />,
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: () => void;
    if (user && user.profile) {
      setLoading(true);
      unsubscribe = getNotifications(user.profile.roles, (fetchedNotifications) => {
        setNotifications(fetchedNotifications);
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading]);

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
      if (!isRead) {
          await markNotificationAsRead(notificationId);
      }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      toast({ title: 'Notifikasi dihapus.' });
    } catch (error) {
      toast({ title: 'Gagal menghapus notifikasi.', variant: 'destructive'});
    }
  }

  const handleClearRead = async () => {
    if (!user) return;
    try {
      await deleteReadNotifications(user.uid);
      toast({ title: 'Notifikasi yang sudah dibaca telah dihapus.'});
    } catch (error) {
      toast({ title: 'Gagal menghapus notifikasi.', variant: 'destructive'});
    }
  }

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
            <div
              key={notif.id}
              className={cn(
                'flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50 cursor-pointer group',
                !notif.isRead && 'bg-blue-50 dark:bg-blue-900/20'
              )}
              onClick={() => handleNotificationClick(notif.id, notif.isRead)}
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
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notif.isRead && (
                    <div
                    className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                    aria-label="Unread"
                    ></div>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => {e.stopPropagation(); handleDelete(notif.id);}}>
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
        <CardFooter>
            {notifications.some(n => n.isRead) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Notifikasi Terbaca
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Semua Notifikasi Terbaca?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Ini akan menghapus semua notifikasi yang telah Anda baca.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearRead}>
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
