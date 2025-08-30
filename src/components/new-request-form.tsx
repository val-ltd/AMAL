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

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long.'),
});

type FormData = z.infer<typeof requestSchema>;

export function NewRequestForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      amount: 0,
      description: '',
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
    
    await createRequestAction(formData);

    toast({
        title: "Request Submitted",
        description: "Your budget request has been successfully submitted.",
    });
    // The redirect in the action will navigate the user.
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
