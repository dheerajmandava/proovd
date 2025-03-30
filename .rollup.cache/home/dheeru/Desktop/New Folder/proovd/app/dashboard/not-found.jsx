import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
export default function NotFound() {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <FileQuestion className="h-16 w-16 text-primary mb-4"/>
          <h2 className="card-title text-2xl">Page Not Found</h2>
          
          <p className="text-base-content/80 mb-6">
            The dashboard page you're looking for doesn't exist or may have been moved.
          </p>
          
          <div className="card-actions flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>);
}
