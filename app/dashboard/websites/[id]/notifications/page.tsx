import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getServerSideWebsite, getServerSideNotifications } from '@/app/lib/server/data-fetchers';
import NotificationsList from '../components/NotificationsTab';
import Link from 'next/link';

export default async function NotificationsPage(
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
    
    // Fetch website and notifications from server
    const website = await getServerSideWebsite(websiteId);
    const notifications = await getServerSideNotifications(websiteId, 20);
    
    if (!website) {
      notFound();
    }
    
    // Pass server data to client component
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-500">Manage notifications for {website.name}</p>
          </div>
          <Link 
            href={`/dashboard/websites/${websiteId}/notifications/new`} 
            className="btn btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Notification
          </Link>
        </div>
        
        {/* Use client component with server data */}
        <NotificationsList websiteId={websiteId} />
      </div>
    );
  } catch (error) {
    console.error('Error loading notifications:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to load notifications. Please try again later.</span>
        </div>
      </div>
    );
  }
} 