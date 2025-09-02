

'use client';

import Link from 'next/link';
import { Home, Shield, PlusCircle, User, LogOut, ChevronDown, Wallet, Users, ShieldCheck, DollarSign, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { User as AppUser, Notification } from '@/lib/types';
import { useState, useEffect } from 'react';
import { getNotifications } from '@/lib/data';


export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isVerified } = useAuth();
  const pathname = usePathname();

  if (loading || !user || !isVerified) {
    if (pathname === '/login') {
      return <>{children}</>
    }
    if (user && !isVerified) {
        return (
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        )
    }
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}

function Header() {
  const { user: authUser, isVerified } = useAuth();
  const showFullHeader = authUser && isVerified;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm h-16">
      <div className="flex items-center gap-6">
        <Logo />
        {showFullHeader && <DesktopNav userRoles={authUser.profile?.roles} />}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {showFullHeader && (
          <>
            <NotificationBell />
          </>
        )}
        <UserMenu />
      </div>
    </header>
  );
}

function DesktopNav({ userRoles }: { userRoles: AppUser['roles'] | undefined }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Permintaan Saya', icon: Home, requiredRoles: ['Employee'] },
    { href: '/manager', label: 'Pengajuan', icon: Shield, requiredRoles: ['Manager', 'Admin', 'Super Admin'] },
    { href: '/release', label: 'Pencairan Dana', icon: DollarSign, requiredRoles: ['Releaser', 'Admin', 'Super Admin'] },
    { href: '/admin', label: 'Admin', icon: Users, requiredRoles: ['Admin', 'Super Admin'] },
  ];

  const availableNavItems = navItems.filter(item => 
    userRoles && item.requiredRoles.some(role => userRoles.includes(role))
  );

  return (
    <nav className="hidden sm:flex items-center gap-4">
      {availableNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
      <Button asChild>
        <Link href="/request/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Permintaan Baru
        </Link>
      </Button>
    </nav>
  );
}


function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRoles = user?.profile?.roles;

  const navItems = [
    { href: '/', label: 'Permintaan', icon: Home, requiredRoles: ['Employee'] },
    { href: '/manager', label: 'Pengajuan', icon: Shield, requiredRoles: ['Manager', 'Admin', 'Super Admin'] },
    { href: '/release', label: 'Pencairan', icon: DollarSign, requiredRoles: ['Releaser', 'Admin', 'Super Admin'] },
    { href: '/admin', label: 'Admin', icon: Users, requiredRoles: ['Admin', 'Super Admin'] },
    { href: '/notifications', label: 'Notifikasi', icon: Bell, requiredRoles: ['Employee', 'Manager', 'Admin', 'Super Admin', 'Releaser'] },
  ];

  const getNavOrder = (roles: AppUser['roles'] | undefined) => {
    if (!roles) return [];
    
    let baseNav = [];
    
    if(roles.includes('Employee')) baseNav.push(navItems.find(i => i.href === '/'));
    if(roles.includes('Manager')) baseNav.push(navItems.find(i => i.href === '/manager'));
    if(roles.includes('Releaser')) baseNav.push(navItems.find(i => i.href === '/release'));
    if(roles.includes('Admin')) baseNav.push(navItems.find(i => i.href === '/admin'));
    
    // Always add notifications
    baseNav.push(navItems.find(i => i.href === '/notifications'));

    return [...new Set(baseNav.filter(Boolean))];
  }

  const finalNavItems = getNavOrder(userRoles);


  return (
    <div className="fixed bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm sm:hidden">
      <nav className="grid h-16 grid-cols-5 items-center justify-around">
        {finalNavItems.map((item) => item && (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              (pathname.startsWith(item.href) && item.href !== '/') || pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
             {item.href === '/notifications' ? <NotificationIcon /> : <item.icon className="h-5 w-5" />}
            <span>{item.label}</span>
          </Link>
        ))}
         <div className="absolute -top-7 left-1/2 -translate-x-1/2">
            <Button asChild className="h-14 w-14 rounded-full shadow-lg">
                 <Link href="/request/new">
                    <PlusCircle className="h-6 w-6" />
                    <span className="sr-only">Permintaan Baru</span>
                 </Link>
            </Button>
        </div>
      </nav>
    </div>
  );
}

function NotificationIcon() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let unsubscribe: () => void;
        if (user && user.profile) {
            unsubscribe = getNotifications(user.profile.roles, (notifications: Notification[]) => {
                const count = notifications.filter(n => !n.isRead).length;
                setUnreadCount(count);
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        }
    }, [user]);

    return (
        <>
            <Bell className="h-5 w-5" />
             {unreadCount > 0 && (
                <div className="absolute top-1 right-3.5 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 border-2 border-background rounded-full">
                   {unreadCount > 9 ? '9+' : unreadCount}
                </div>
            )}
        </>
    )
}

function NotificationBell() {
    return (
        <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/notifications">
                <NotificationIcon />
                 <span className="sr-only">Notifications</span>
            </Link>
        </Button>
    )
}

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} data-ai-hint="person" />
              <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
