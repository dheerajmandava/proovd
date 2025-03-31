import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import ServerHydratedWebsiteDetails from './components/ServerHydratedWebsiteDetails';
import Link from 'next/link';

export default async function WebsitePage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  try {
    const websiteId = params.id;
    
    return (
      <>
        <ServerHydratedWebsiteDetails websiteId={websiteId} />
      </>
    );
  } catch (error) {
    console.error('Error loading website:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load website. Please try again later.</span>
        </div>
      </div>
    );
  }
} 