'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AnalyticsRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // Redirect to Pulse page as it contains the analytics functionality
    router.push(`/dashboard/websites/${id}/pulse`);
  }, [router, id]);

  return (
    <div className="flex h-[600px] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Redirecting to ProovdPulse Analytics...</span>
    </div>
  );
} 