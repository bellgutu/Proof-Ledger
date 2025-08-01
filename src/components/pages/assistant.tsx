"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getTradingStrategy, TradingStrategyInput, TradingStrategyOutput } from "@/ai/flows/trading-strategy-assistant";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Bot, Zap, ShieldAlert } from "lucide-react";

const TradingStrategyInputSchema = z.object({
  marketTrends: z.string().min(10, { message: "Please describe the market trends in at least 10 characters." }),
  riskProfile: z.enum(['low', 'medium', 'high']),
});

export default function AssistantPage() {
  const [strategyOutput, setStrategyOutput] = useState<TradingStrategyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TradingStrategyInput>({
    resolver: zodResolver(TradingStrategyInputSchema),
    defaultValues: {
      marketTrends: "",
      riskProfile: "medium",
    },
  });

  async function onSubmit(values: TradingStrategyInput) {
    setIsLoading(true);
    setError(null);
    setStrategyOutput(null);
    try {
      const result = await getTradingStrategy(values);
      setStrategyOutput(result);
    } catch (e) {
      setError("Failed to generate trading strategy. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <BrainCircuit className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Trading Strategy Assistant</h1>
          <p className="text-muted-foreground">Get AI-powered insights based on market conditions and your risk appetite.</p>
        </div>
      </div>

      <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
        <CardHeader>
          <CardTitle>Generate Strategy</CardTitle>
          <CardDescription>Describe the current market and select your risk profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="marketTrends"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Market Trends</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Bitcoin is showing strong upward momentum, altcoins are volatile..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="riskProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Profile</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your risk profile" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Bot className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate AI Strategy
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-center">{error}</p>}

      {strategyOutput && (
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="transform transition-transform duration-300 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center"><Zap className="mr-2 text-primary" /> Strategy Suggestion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{strategyOutput.strategySuggestion}</p>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center"><ShieldAlert className="mr-2 text-yellow-500" /> Risk Considerations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{strategyOutput.riskConsiderations}</p>
            </CardContent>
          </Card>
           <Card className="md:col-span-2 bg-muted/50 transform transition-transform duration-300 hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="text-sm">Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{strategyOutput.disclaimer}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
