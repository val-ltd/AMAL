
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
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { getManagers, getUser } from '@/lib/data';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { budgetCategories } from '@/lib/categories';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

const requestSchema = z.object({
  category: z.string().min(1, 'Kategori harus diisi.'),
  amount: z.coerce.number().positive('Jumlah harus angka positif.'),
  description: z
    .string()
    .min(10, 'Deskripsi harus memiliki setidaknya 10 karakter.'),
  supervisor: z.string().min(1, 'Silakan pilih atasan.'),
});

type FormData = z.infer<typeof requestSchema>;


export function NewRequestForm() {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: '',
      amount: 0,
      description: '',
      supervisor: '',
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
        if (authUser) {
            setLoading(true);
            const userProfile = await getUser(authUser.uid);
            const managerList = await getManagers();
            setProfileData(userProfile);
            setManagers(managerList);
            setLoading(false);
        }
    }
    fetchInitialData();
  }, [authUser]);

  const { toast } = useToast();
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const {formState: {isSubmitting}} = form;

  const onSubmit = async (data: FormData) => {
    setFormError(null);
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('amount', String(data.amount));
    formData.append('description', data.description);
    formData.append('supervisor', data.supervisor);
    
    const result = await createRequestAction(formData);

    if (result?.errors) {
      if (result.errors._form) {
        setFormError(result.errors._form.join(', '));
      }
      // You can also handle field-specific errors if you want
      // For example: form.setError('supervisor', { message: result.errors.supervisor?.[0] })
    }
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


  if (loading) {
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
                </CardContent>
            </Card>
        )}

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori Permintaan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori anggaran" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {budgetCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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

        <FormField
            control={form.control}
            name="supervisor"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Nama Atasan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih seorang atasan untuk menyetujui" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {managers.map(manager => (
                                <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

        {formError && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Gagal Mengirim Permintaan</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
            </Alert>
        )}

        <Button type="submit" disabled={isSubmitting || loading} className="w-full">
            {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Permintaan
        </Button>
      </form>
    </Form>
  );
}
