'use server';
/**
 * @fileOverview An AI agent that suggests additional details for a budget request description.
 *
 * - suggestDetails - A function that takes a budget request description and suggests additional details to include.
 * - SuggestDetailsInput - The input type for the suggestDetails function.
 * - SuggestDetailsOutput - The return type for the suggestDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDetailsInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the budget request.'),
});
export type SuggestDetailsInput = z.infer<typeof SuggestDetailsInputSchema>;

const SuggestDetailsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'A list of suggested details to add to the budget request description.'
    ),
});
export type SuggestDetailsOutput = z.infer<typeof SuggestDetailsOutputSchema>;

export async function suggestDetails(input: SuggestDetailsInput): Promise<SuggestDetailsOutput> {
  return suggestDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDetailsPrompt',
  input: {schema: SuggestDetailsInputSchema},
  output: {schema: SuggestDetailsOutputSchema},
  prompt: `You are an AI assistant that helps users create clear and complete budget requests. Analyze the following budget request description and suggest concrete, additional information that the user should add to ensure the request is clear and complete for the approver. Provide the suggestions as a list of strings.

Budget Request Description:
{{{description}}}`,
});

const suggestDetailsFlow = ai.defineFlow(
  {
    name: 'suggestDetailsFlow',
    inputSchema: SuggestDetailsInputSchema,
    outputSchema: SuggestDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
