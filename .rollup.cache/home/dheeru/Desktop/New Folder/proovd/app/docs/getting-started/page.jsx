import { promises as fs } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
export default async function GettingStartedPage() {
    // Get the markdown content from the file
    const filePath = path.join(process.cwd(), 'docs', 'getting-started.md');
    const fileContent = await fs.readFile(filePath, 'utf8');
    return (<div className="container mx-auto p-6 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <MDXRemote source={fileContent}/>
      </div>
    </div>);
}
