import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getServerSideWebsites } from '@/app/lib/server/data-fetchers';
import EventsTable from './components/EventsTable';
import Link from 'next/link';
export default async function EventsListPage() {
    var _a;
    // Get the session and user data
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        redirect('/auth/signin');
    }
    // Fetch websites
    const websites = await getServerSideWebsites();
    if (websites.length === 0) {
        redirect('/dashboard/websites/new');
    }
    // Get the first website ID
    const websiteId = websites[0]._id.toString();
    return (<div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Event Activity</h1>
          <p className="text-base-content/70">
            Track and monitor the events happening on your website.
          </p>
        </div>
        
        <Link href="/dashboard/events" className="btn btn-primary">
          Setup Guide
        </Link>
      </div>
      
      <div className="card bg-base-200 shadow-sm mb-8">
        <div className="card-body">
          <EventsTable websiteId={websiteId}/>
        </div>
      </div>
    </div>);
}
