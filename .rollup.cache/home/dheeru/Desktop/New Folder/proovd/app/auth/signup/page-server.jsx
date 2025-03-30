import { Suspense } from 'react';
import SignUpClient from './page';
export default function SignUpPage() {
    return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70">Loading signup form...</p>
      </div>
    </div>}>
      <SignUpClient />
    </Suspense>);
}
