
'use client'

import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ThumbsUp, XCircle, CheckCircle, FilePlus, List, FileSignature } from 'lucide-react';
import Link from "next/link"
import { getMyRequests } from "@/lib/data"
import RequestList from "@/components/request-list"
import { useEffect, useState, useMemo } from "react"
import { BudgetRequest } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import StatusBadge from "@/components/status-badge"
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { STATUS_COLOR_MAP } from "@/lib/color-map";

const formatRupiah = (amount: number, short = false) => {
    if (short) {
        if (amount >= 1e9) return `Rp${(amount / 1e9).toFixed(1)}M`;
        if (amount >= 1e6) return `Rp${(amount / 1e6).toFixed(1)}Jt`;
        if (amount >= 1e3) return `Rp${(amount / 1e3).toFixed(1)}k`;
        return `Rp${amount}`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};


const statusIcons = {
    pending: <Clock className="h-6 w-6 text-yellow-500" />,
    approved: <ThumbsUp className="h-6 w-6 text-green-500" />,
    rejected: <XCircle className="h-6 w-6 text-red-500" />,
    released: <CheckCircle className="h-6 w-6 text-blue-500" />,
    completed: <CheckCircle className="h-6 w-6 text-purple-500" />,
    draft: <FileSignature className="h-6 w-6 text-gray-500" />,
}

const statusText = {
    pending: 'Tertunda',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    released: 'Dicairkan',
    completed: 'Selesai',
    draft: 'Draf',
}


export default function EmployeeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;
    if (!authLoading && user) {
      setLoading(true);
      unsubscribe = getMyRequests((fetchedRequests) => {
        setRequests(fetchedRequests);
        setLoading(false);
      });
    } else if (!authLoading && !user) {
        setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading]);

  const summaryStats = useMemo(() => {
    const stats = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
      released: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      draft: { count: 0, amount: 0 },
    };
    requests.forEach(req => {
      const statusKey = req.status;
      if (stats[statusKey]) {
        stats[statusKey].count++;
        stats[statusKey].amount += req.amount;
      }
    });
    return stats;
  }, [requests]);

  const chartData = useMemo(() => {
      const statusOrder: (keyof typeof summaryStats)[] = ['pending', 'approved', 'rejected', 'released'];
      return statusOrder.map(status => ({
          name: statusText[status],
          total: summaryStats[status].amount,
          fill: `hsl(var(--chart-${Object.keys(STATUS_COLOR_MAP).indexOf(status) + 1}))`
      }))
  }, [summaryStats])

  const chartConfig: ChartConfig = {
      total: {
          label: 'Total',
      },
  }

  const groupedRequests = useMemo(() => {
    return requests.reduce((acc, request) => {
      const status = request.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(request);
      return acc;
    }, {} as Record<BudgetRequest['status'], BudgetRequest[]>);
  }, [requests]);

  const accordionItems: { status: BudgetRequest['status'], title: string }[] = [
    { status: 'draft', title: 'Draf' },
    { status: 'pending', title: 'Tertunda' },
    { status: 'approved', title: 'Disetujui' },
    { status: 'rejected', title: 'Ditolak' },
    { status: 'released', title: 'Dicairkan' },
    { status: 'completed', title: 'Selesai' },
  ];

  if (loading || authLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle>Selamat Datang, {user?.displayName || 'Pengguna'}!</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                    Ini adalah ringkasan aktivitas permintaan anggaran Anda.
                </CardDescription>
            </CardHeader>
        </Card>
        
        <div className="grid grid-cols-2 gap-4">
            {Object.entries(summaryStats)
                .filter(([status]) => ['pending', 'approved', 'rejected', 'completed'].includes(status))
                .map(([status, data]) => (
                <Card key={status}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{statusText[status as keyof typeof statusText]}</CardTitle>
                        {statusIcons[status as keyof typeof statusIcons]}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.count}</div>
                        <p className="text-xs text-muted-foreground">{formatRupiah(data.amount)}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Total Pengajuan per Status</CardTitle>
                    <CardDescription>Visualisasi total dana yang diajukan berdasarkan status.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickFormatter={(value) => formatRupiah(value as number, true)} />
                                <Tooltip
                                    cursor={false}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Status
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {payload[0].payload.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Total
                                                            </span>
                                                            <span className="font-bold">
                                                                {formatRupiah(payload[0].value as number)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar dataKey="total" radius={4}>
                                     <LabelList dataKey="total" position="top" formatter={(value: number) => formatRupiah(value, true)} className="fill-foreground" fontSize={12} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button asChild size="lg">
                        <Link href="/request/new">
                            <FilePlus />
                            Buat Permintaan Baru
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                         <Link href="#request-list">
                            <List />
                            Lihat Semua Permintaan
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div id="request-list">
             <h2 className="text-2xl font-bold tracking-tight my-4">Daftar Permintaan Anda</h2>
             <Accordion type="multiple" defaultValue={['draft', 'pending', 'approved']} className="w-full space-y-4">
              {accordionItems.map(item => {
                const requestsForStatus = groupedRequests[item.status] || [];
                if (requestsForStatus.length === 0) return null;
                
                return (
                  <AccordionItem value={item.status} key={item.status} className="border-none">
                    <AccordionTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg shadow-sm hover:no-underline">
                      <div className="flex items-center gap-3">
                         <StatusBadge status={item.status} />
                         <span className="font-semibold">{item.title}</span>
                         <span className="text-sm text-muted-foreground">({requestsForStatus.length} permintaan)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <RequestList requests={requestsForStatus} />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
        </div>
    </div>
  )
}

function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-28 w-full" />
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-80 w-full" />
                <Skeleton className="lg:col-span-3 h-80 w-full" />
            </div>
            <Skeleton className="h-48 w-full" />
        </div>
    )
}
