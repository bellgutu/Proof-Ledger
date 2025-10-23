
"use client";

import React, auseState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileText, Bot, Zap, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { marked } from 'marked';
import { analyzeWhitePaper } from '@/ai/flows/whitepaper-analyzer-flow';

const AnalyzerInputSchema = z.object({
  whitePaperUrl: z.string().url({ message: "Please enter a valid URL." }),
});

type AnalyzerInput = z.infer<typeof AnalyzerInputSchema>;

export default function AnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AnalyzerInput>({
    resolver: zodResolver(AnalyzerInputSchema),
    defaultValues: {
      whitePaperUrl: "",
    },
  });

  async function onSubmit(values: AnalyzerInput) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeWhitePaper(values.whitePaperUrl);
      if (!result || !result.analysis) {
        throw new Error("Analysis engine failed to produce a result.");
      }
      const htmlResult = await marked(result.analysis);
      setAnalysisResult(htmlResult);
    } catch (e: any) {
      console.error("Analysis failed:", e);
      setError(e.message || "Failed to analyze the document. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <FileText className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Document Analyzer</h1>
          <p className="text-muted-foreground">Submit a URL to a white paper or document to get an automated summary and analysis.</p>
        </div>
      </div>

      <Card className="transform transition-transform duration-300 hover:scale-[1.01]">
        <CardHeader>
          <CardTitle>Analyze a Document</CardTitle>
          <CardDescription>Enter the public URL of a document PDF or a page linking to one.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="whitePaperUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/whitepaper.pdf"
                        {...field}
                      />
                    </FormControl>
                    <FormDesc>The URL must be publicly accessible. The system will attempt to fetch and parse it.</FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-center">{error}</p>}
      
      {isLoading && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Bot className="mr-2 text-primary" /> Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <br/>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                 <br/>
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Bot className="mr-2 text-primary" /> Analysis</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground">
            <div dangerouslySetInnerHTML={{ __html: analysisResult }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
