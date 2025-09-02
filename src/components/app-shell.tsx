
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { User as AppUser } from '@/lib/types';


export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isVerified } = useAuth();
  const pathname = usePathname();

  // If loading, or not logged in, or not verified, the AuthProvider handles the view.
  // The AppShell should only render its full content for verified users.
  if (loading || !user || !isVerified) {
    if (pathname === '/login') {
      return <>{children}</>
    }
     // Show a minimal shell for the "unverified" warning page
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

  // Hide main nav and new request button if not verified.
  const showFullHeader = authUser && isVerified;

  return (
    <header className="sticky top-0 z-10 hidden items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:flex h-16">
      <div className="flex items-center gap-6">
        <Logo />
        {showFullHeader && <DesktopNav userRoles={authUser.profile?.roles} />}
      </div>
      <div className="flex items-center gap-4">
        {showFullHeader && (
          <>
            <Button asChild>
                <Link href="/request/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Permintaan Baru
                </Link>
            </Button>
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
    { href: '/manager', label: 'Tampilan Manajer', icon: Shield, requiredRoles: ['Manager', 'Admin', 'Super Admin'] },
    { href: '/release', label: 'Pencairan Dana', icon: DollarSign, requiredRoles: ['Releaser', 'Admin', 'Super Admin'] },
    { href: '/admin', label: 'Manajemen Admin', icon: Users, requiredRoles: ['Admin', 'Super Admin'] },
  ];

  const availableNavItems = navItems.filter(item => 
    userRoles && item.requiredRoles.some(role => userRoles.includes(role))
  );

  return (
    <nav className="flex items-center gap-4">
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
    </nav>
  );
}


function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRoles = user?.profile?.roles;

  const navItems = [
    { href: '/', label: 'Permintaan', icon: Home, requiredRoles: ['Employee'] },
    { href: '/request/new', label: 'Baru', icon: PlusCircle, requiredRoles: ['Employee'] },
    { href: '/manager', label: 'Manajer', icon: Shield, requiredRoles: ['Manager', 'Admin', 'Super Admin'] },
    { href: '/release', label: 'Pencairan', icon: DollarSign, requiredRoles: ['Releaser', 'Admin', 'Super Admin'] },
    { href: '/notifications', label: 'Notifikasi', icon: Bell, requiredRoles: ['Employee'] },
    { href: '/admin', label: 'Admin', icon: Users, requiredRoles: ['Admin', 'Super Admin'] },
    { href: '/profile', label: 'Profil', icon: User, requiredRoles: ['Employee'] },
  ];

  const availableNavItems = navItems.filter(item => 
    userRoles && item.requiredRoles.some(role => userRoles.includes(role))
  );
  
  const bottomNavLayout = [
    availableNavItems.find(i => i.href === '/'),
    availableNavItems.find(i => i.href === '/manager'),
    availableNavItems.find(i => i.href === '/request/new'),
    availableNavItems.find(i => i.href === '/notifications'),
    availableNavItems.find(i => i.href === '/profile'),
  ].filter(Boolean);
  
  // Custom layout for bottom nav to ensure logical order
  const getNavOrder = (roles: AppUser['roles'] | undefined) => {
    if (!roles) return [];
    
    const baseNav = [
      navItems.find(i => i.href === '/'),
      navItems.find(i => i.href === '/request/new'),
    ];

    if (roles.includes('Manager')) {
      baseNav.splice(1, 0, navItems.find(i => i.href === '/manager'));
    }
     if (roles.includes('Releaser')) {
      baseNav.splice(1, 0, navItems.find(i => i.href === '/release'));
    }
     if (roles.includes('Admin')) {
      baseNav.splice(1, 0, navItems.find(i => i.href === '/admin'));
    }

    baseNav.push(navItems.find(i => i.href === '/notifications'));
    baseNav.push(navItems.find(i => i.href === '/profile'));
    
    // De-duplicate and filter by role again to be safe
    return [...new Set(baseNav.filter(Boolean))]
           .filter(item => item!.requiredRoles.some(role => roles.includes(role)));
  }

  const finalNavItems = getNavOrder(userRoles);


  return (
    <div className="fixed bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm sm:hidden">
      <nav className="flex items-center justify-around p-1">
        {finalNavItems.map((item) => item && (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-md p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              (pathname.startsWith(item.href) && item.href !== '/') || pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function NotificationBell() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {/* Unread indicator */}
                    <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                 <div className="p-4 font-medium border-b">
                    Notifikasi
                </div>
                <div className="p-4">
                    <p className="text-sm text-muted-foreground">Tidak ada notifikasi baru.</p>
                </div>
                 <div className="p-2 border-t">
                    <Button variant="link" asChild className="w-full">
                        <Link href="/notifications">Lihat semua notifikasi</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto px-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} data-ai-hint="person" />
              <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="font-medium">{user.displayName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
          </div>
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
