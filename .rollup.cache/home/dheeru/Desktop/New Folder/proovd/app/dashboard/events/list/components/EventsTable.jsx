'use client';
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
export default function EventsTable({ websiteId }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [eventType, setEventType] = useState(null);
    const limit = 10;
    const fetchEvents = async () => {
        try {
            setLoading(true);
            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (eventType) {
                params.append('type', eventType);
            }
            // Fetch events from the API
            const response = await fetch(`/api/websites/${websiteId}/events?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            // Update state
            setEvents(prev => page === 1 ? data.events : [...prev, ...data.events]);
            setHasMore(data.events.length === limit);
            setError(null);
        }
        catch (err) {
            setError('Error loading events. Please try again.');
            console.error('Error fetching events:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEvents();
    }, [websiteId, page, eventType]);
    const handleTypeFilter = (type) => {
        setEventType(type);
        setPage(1);
    };
    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };
    const formatTimeAgo = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        }
        catch (_a) {
            return 'Unknown time';
        }
    };
    const renderEventDetails = (event) => {
        const { type, data } = event;
        switch (type) {
            case 'signup':
                return (<div>
            <span className="font-medium">{data.userName || 'User'}</span>
            {data.userEmail && <span className="text-sm ml-2 opacity-70">{data.userEmail}</span>}
            {data.location && <span className="block text-xs opacity-70">from {data.location}</span>}
          </div>);
            case 'purchase':
                return (<div>
            <span className="font-medium">{data.productName || 'Product'}</span>
            {data.userName && <span className="block text-sm opacity-70">by {data.userName}</span>}
            {data.location && <span className="block text-xs opacity-70">from {data.location}</span>}
          </div>);
            case 'view':
                return (<div>
            <span className="font-medium">{data.pageTitle || 'Page view'}</span>
            {data.pageUrl && (<span className="block text-xs opacity-70 truncate max-w-xs">{data.pageUrl}</span>)}
          </div>);
            default:
                return <div>{event.name}</div>;
        }
    };
    const getEventTypeLabel = (type) => {
        switch (type) {
            case 'signup':
                return (<span className="badge badge-info">Signup</span>);
            case 'purchase':
                return (<span className="badge badge-success">Purchase</span>);
            case 'view':
                return (<span className="badge badge-neutral">View</span>);
            default:
                return (<span className="badge badge-ghost">Custom</span>);
        }
    };
    if (error) {
        return (<div className="alert alert-error">
        <span>{error}</span>
      </div>);
    }
    return (<div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button className={`btn btn-sm ${eventType === null ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTypeFilter(null)}>
          All
        </button>
        <button className={`btn btn-sm ${eventType === 'signup' ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTypeFilter('signup')}>
          Signups
        </button>
        <button className={`btn btn-sm ${eventType === 'purchase' ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTypeFilter('purchase')}>
          Purchases
        </button>
        <button className={`btn btn-sm ${eventType === 'view' ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTypeFilter('view')}>
          Views
        </button>
      </div>
      
      {loading && events.length === 0 ? (<div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>) : events.length === 0 ? (<div className="bg-base-100 p-8 text-center rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-base-content/70">
            {eventType ? `No ${eventType} events have been recorded yet.` : 'No events have been recorded yet.'}
          </p>
        </div>) : (<>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (<tr key={event.id} className="hover">
                    <td>{getEventTypeLabel(event.type)}</td>
                    <td>{renderEventDetails(event)}</td>
                    <td className="text-sm opacity-70">{formatTimeAgo(event.eventTime)}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          
          {hasMore && (<div className="mt-4 text-center">
              <button className="btn btn-outline" onClick={handleLoadMore} disabled={loading}>
                {loading ? (<>
                    <span className="loading loading-spinner loading-sm"></span>
                    Loading...
                  </>) : 'Load More'}
              </button>
            </div>)}
        </>)}
    </div>);
}
