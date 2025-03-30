import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
export default async function GettingStartedPage() {
    // Get the markdown content from the file
    const filePath = path.join(process.cwd(), 'docs', 'getting-started.md');
    let fileContent = await fs.readFile(filePath, 'utf8');
    // Convert markdown to HTML (basic conversion)
    // This is a simplified approach - a proper markdown parser would be better
    fileContent = fileContent
        // Handle headings
        .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
        // Handle lists
        .replace(/^\* (.*$)/gm, '<li class="ml-6 list-disc">$1</li>')
        .replace(/^- (.*$)/gm, '<li class="ml-6 list-disc">$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-6 list-decimal">$1. $2</li>')
        // Handle links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gm, '<a href="$2" class="text-primary hover:underline">$1</a>')
        // Handle paragraphs
        .replace(/^(?!<h|<li|<a)(.*$)/gm, function (match) {
        if (match.trim() === '')
            return '<br>';
        return '<p class="my-2">' + match + '</p>';
    })
        // Handle code blocks - use a function instead of s flag
        .replace(/```([\s\S]*?)```/g, function (match, p1) {
        return '<pre class="bg-base-200 p-4 rounded-lg my-4 overflow-x-auto"><code>' + p1 + '</code></pre>';
    })
        // Handle bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Handle italics
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Group list items
        .replace(/(<li[^>]*>.*<\/li>)\n(<li[^>]*>.*<\/li>)/g, '$1$2')
        .replace(/(<li[^>]*>.*<\/li>)\n(<li[^>]*>.*<\/li>)/g, '$1$2')
        .replace(/(<li[^>]*>.*<\/li>)/g, '<ul>$1</ul>')
        .replace(/<\/ul>\n<ul>/g, '');
    return (<div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/help" className="btn btn-ghost btn-sm mr-4">
          <ArrowLeftIcon className="w-4 h-4 mr-1"/>
          Back to Help
        </Link>
        <h1 className="text-3xl font-bold">Getting Started Guide</h1>
      </div>
      
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: fileContent }}/>
        </div>
      </div>
    </div>);
}
