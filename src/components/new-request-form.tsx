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
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useRouter } from 'next/navigation';
import { departments } from '@/lib/departments';

const requestSchema = z.object({
  title: z.string().min(5, 'Judul harus memiliki setidaknya 5 karakter.'),
  amount: z.coerce.number().positive('Jumlah harus angka positif.'),
  description: z
    .string()
    .min(10, 'Deskripsi harus memiliki setidaknya 10 karakter.'),
  institution: z.string().min(1, 'Lembaga wajib diisi.'),
  division: z.string().min(1, 'Divisi wajib diisi.'),
  supervisor: z.string().min(1, 'Silakan pilih supervisor.'),
});

type FormData = z.infer<typeof requestSchema>;

const supervisors = [
    { id: 'user-2', name: 'Bob Williams' },
    { id: 'user-3', name: 'Charlie Brown' },
    { id: 'user-4', name: 'Diana Prince' },
];

const institutionOptions = Object.keys(departments);

export function NewRequestForm() {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      amount: 0,
      description: '',
      institution: '',
      division: '',
      supervisor: '',
    },
  });

  const { toast } = useToast();
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedInstitution = form.watch('institution');
  
  const divisionOptions = selectedInstitution ? Object.keys(departments[selectedInstitution as keyof typeof departments] || {}) : [];


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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('amount', String(data.amount));
    formData.append('description', data.description);
    formData.append('institution', data.institution);
    formData.append('division', data.division);
    formData.append('supervisor', data.supervisor);
    
    createRequestAction(formData);

    toast({
        title: "Permintaan Terkirim",
        description: "Permintaan anggaran Anda telah berhasil dikirim.",
    });
    
    router.push('/');
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
           <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lembaga</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('division', '');
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih lembaga" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutionOptions.map(inst => (
                        <SelectItem key={inst} value={inst}>
                          {inst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="division"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Divisi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedInstitution}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih divisi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisionOptions.map(div => (
                        <SelectItem key={div} value={div}>
                          {div}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="supervisor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supervisor Penyetuju</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih supervisor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supervisors.map(supervisor => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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


        <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Permintaan
        </Button>
      </form>
    </Form>
  );
}
