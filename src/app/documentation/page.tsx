
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { promises as fs } from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

// The content is now read dynamically from the README.md file
async function getReadmeContent() {
  const readmePath = path.join(process.cwd(), 'README.md');
  try {
    const fileContents = await fs.readFile(readmePath, 'utf8');
    const processedContent = await remark().use(html).process(fileContents);
    return processedContent.toString();
  } catch (error) {
    console.error("Could not read README.md:", error);
    return "<p>Error: Could not load documentation.</p>";
  }
}

export default async function DocumentationPage() {
  const contentHtml = await getReadmeContent();

  return (
    <div className="container mx-auto p-0 space-y-8">
      <div className="text-left space-y-2">
        <div className="flex items-center gap-4">
            <FileText className="h-12 w-12 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">
                Platform Documentation
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                A comprehensive overview of the Proof Ledger architecture, contracts, and features.
                </p>
            </div>
        </div>
      </div>
      <Card>
        <CardContent className="p-6 md:p-8">
          <div 
            className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl prose-invert max-w-none prose-headings:text-primary prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
