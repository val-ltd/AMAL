'use client';

import Link from 'next/link';
import { Home, Shield, PlusCircle, User, LogOut, ChevronDown, Wallet, Users } from 'lucide-react';
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
  const { user, isVerified } = useAuth();

  // Hide main nav and new request button if not verified.
  const showFullHeader = user && isVerified;

  return (
    <header className="sticky top-0 z-10 hidden items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:flex h-16">
      <div className="flex items-center gap-6">
        <Logo />
        {showFullHeader && <DesktopNav />}
      </div>
      <div className="flex items-center gap-4">
        {showFullHeader && (
            <Button asChild>
                <Link href="/request/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Permintaan Baru
                </Link>
            </Button>
        )}
        <UserMenu />
      </div>
    </header>
  );
}

function DesktopNav() {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Permintaan Saya', icon: Home },
    { href: '/manager', label: 'Tampilan Manajer', icon: Shield },
    { href: '/admin', label: 'Manajemen Pengguna', icon: Users },
  ];

  return (
    <nav className="flex items-center gap-4">
      {navItems.map((item) => (
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
  const navItems = [
    { href: '/', label: 'Permintaan', icon: Home },
    { href: '/request/new', label: 'Baru', icon: PlusCircle },
    { href: '/manager', label: 'Manajer', icon: Shield },
    { href: '/admin', label: 'Admin', icon: Users },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm sm:hidden">
      <nav className="grid grid-cols-5 items-center justify-around p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href ? "text-primary" : "text-muted-foreground"
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
