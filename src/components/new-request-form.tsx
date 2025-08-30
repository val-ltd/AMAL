'use client';

import { useFormState } from 'react-dom';
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

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long.'),
  institution: z.string().min(1, 'Institution is required.'),
  division: z.string().min(1, 'Division is required.'),
  supervisor: z.string().min(1, 'Please select a supervisor.'),
});

type FormData = z.infer<typeof requestSchema>;

const supervisors = [
    { id: 'user-2', name: 'Bob Williams' },
    { id: 'user-3', name: 'Charlie Brown' },
    { id: 'user-4', name: 'Diana Prince' },
];

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
    
    // The action returns a promise that resolves on redirect, so we don't await it here.
    // We navigate away optimistically.
    createRequestAction(formData);

    toast({
        title: "Request Submitted",
        description: "Your budget request has been successfully submitted.",
    });
    
    // Manually redirect
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
                <FormLabel>Institution</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., University of Acme" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="division"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Division</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., School of Engineering" {...field} />
                </FormControl>
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
              <FormLabel>Approving Supervisor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supervisor" />
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
              <FormLabel>Request Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New Laptops for Engineering Team" {...field} />
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
              <FormLabel>Amount ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} />
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
              <FormLabel>Description & Justification</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the request and why it's needed."
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
            Get AI Suggestions
            </Button>
            {suggestions.length > 0 && (
            <Card className="bg-accent/50">
                <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" />Suggestions</h4>
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
            Submit Request
        </Button>
      </form>
    </Form>
  );
}
