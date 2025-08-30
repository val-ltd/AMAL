
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createRequestAction, getSuggestionsAction } from '@/app/actions';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { getUserWithHierarchy } from '@/lib/data';
import { Skeleton } from './ui/skeleton';

const requestSchema = z.object({
  title: z.string().min(5, 'Judul harus memiliki setidaknya 5 karakter.'),
  amount: z.coerce.number().positive('Jumlah harus angka positif.'),
  description: z
    .string()
    .min(10, 'Deskripsi harus memiliki setidaknya 10 karakter.'),
});

type FormData = z.infer<typeof requestSchema>;


export function NewRequestForm() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      amount: 0,
      description: '',
    },
  });

  useEffect(() => {
    const fetchProfileData = async () => {
        if (authUser) {
            setLoadingProfile(true);
            const data = await getUserWithHierarchy(authUser.uid);
            setProfileData(data);
            setLoadingProfile(false);
        }
    }
    fetchProfileData();
  }, [authUser]);

  const { toast } = useToast();
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: FormData) => {
    if (!profileData || !profileData.supervisor) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Supervisor tidak ditemukan. Silakan hubungi admin.',
        });
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('amount', String(data.amount));
    formData.append('description', data.description);
    formData.append('institution', profileData.institution ?? '');
    formData.append('division', profileData.division ?? '');
    formData.append('supervisor', profileData.supervisor.id);
    
    await createRequestAction(formData);

    toast({
        title: "Permintaan Terkirim",
        description: "Permintaan anggaran Anda telah berhasil dikirim.",
    });
    
    router.push('/');
    setIsSubmitting(false);
  };
  
  const handleGetSuggestions = async () => {
    const description = form.getValues('description');
    setIsSuggesting(true);
    setSuggestions([]);
    const result = await getSuggestionsAction(description);
    setIsSuggesting(false);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setSuggestions(result.suggestions);
    }
  };


  if (loadingProfile) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {profileData && (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className='text-base'>Informasi Pemohon</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama</span>
                        <span className="font-medium">{profileData.name}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Lembaga</span>
                        <span className="font-medium">{profileData.institution}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Divisi</span>
                        <span className="font-medium">{profileData.division}</span>
                    </div>
                    {profileData.supervisor && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nama Atasan</span>
                            <span className="font-medium">{profileData.supervisor.name}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Permintaan</FormLabel>
              <FormControl>
                <Input placeholder="cth., Laptop baru untuk tim engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah (Rp)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="cth., 15000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi & Justifikasi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Berikan deskripsi terperinci tentang permintaan dan mengapa itu diperlukan."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <Button type="button" variant="outline" onClick={handleGetSuggestions} disabled={isSuggesting}>
            {isSuggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Wand2 className="mr-2 h-4 w-4" />
            )}
            Dapatkan Saran AI
            </Button>
            {suggestions.length > 0 && (
            <Card className="bg-accent/50">
                <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" />Saran</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            )}
        </div>


        <Button type="submit" disabled={isSubmitting || loadingProfile} className="w-full">
            {(isSubmitting || loadingProfile) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Permintaan
        </Button>
      </form>
    </Form>
  );
}
