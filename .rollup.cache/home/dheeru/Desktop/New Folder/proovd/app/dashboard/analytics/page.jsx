import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserByEmail } from '@/app/lib/services';
import { getAnalyticsSummary, getAnalyticsDaily, getNotificationTypeBreakdown } from '@/app/lib/services/analytics.service';
export default async function AnalyticsPage() {
    var _a;
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.email)) {
        redirect('/auth/signin');
    }
    const user = await getUserByEmail(session.user.email);
    if (!user) {
        redirect('/auth/signin');
    }
    // Get analytics data using services
    const userId = user._id.toString();
    // Get notification type breakdown
    const typeBreakdown = await getNotificationTypeBreakdown(userId);
    // Get analytics summary (total notifications, displays, clicks)
    const summary = await getAnalyticsSummary(userId);
    const totalNotifications = summary.totalNotifications || 0;
    const totalDisplays = summary.totalDisplays || 0;
    const totalClicks = summary.totalClicks || 0;
    const clickRate = totalDisplays > 0 ? ((totalClicks / totalDisplays) * 100).toFixed(2) : "0.00";
    // Get daily stats for the last 7 days
    const dailyStats = await getAnalyticsDaily(userId, 7);
    // Format data for charts
    const dates = [];
    const displaysData = [];
    const clicksData = [];
    // Create an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        dates.push(formattedDate);
        // Find matching data or use 0
        const dayData = dailyStats.find(day => day._id === formattedDate);
        displaysData.push(dayData ? dayData.displays : 0);
        clicksData.push(dayData ? dayData.clicks : 0);
    }
    return (<div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            View performance metrics for your social proof notifications.
          </p>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Notifications */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Notifications</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalNotifications}</dd>
          </div>
        </div>
        
        {/* Total Displays */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Displays</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalDisplays}</dd>
          </div>
        </div>
        
        {/* Total Clicks */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Clicks</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalClicks}</dd>
          </div>
        </div>
        
        {/* Click Rate */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Click Rate</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{clickRate}%</dd>
          </div>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Performance Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Performance (Last 7 Days)</h3>
            <div className="mt-4 h-64 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Chart visualization would go here</p>
              {/* In a real implementation, you would use a chart library like Chart.js or Recharts */}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-3 h-3 inline-block bg-primary-500 rounded-full mr-1"></span>
                  <span>Displays</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 inline-block bg-primary-300 rounded-full mr-1"></span>
                  <span>Clicks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Types */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Notification Types</h3>
            <div className="mt-4">
              {typeBreakdown.length > 0 ? (<div className="space-y-4">
                  {typeBreakdown.map((type) => (<div key={type._id}>
                      <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                        <span className="capitalize">{type._id}</span>
                        <span>{type.count} ({Math.round((type.count / totalNotifications) * 100)}%)</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${(type.count / totalNotifications) * 100}%` }}></div>
                      </div>
                    </div>))}
                </div>) : (<div className="text-center py-8 text-gray-500">
                  <p>No notification data available</p>
                </div>)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recommendations</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Based on your current performance, here are some recommendations to improve your results:</p>
          </div>
          <div className="mt-5">
            <ul className="space-y-3">
              {totalNotifications === 0 ? (<li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    Create your first notification to start collecting data.
                  </p>
                </li>) : (<>
                  {Number(clickRate) < 5 && (<li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <p className="ml-3 text-sm text-gray-700">
                        Your click rate is below average. Try making your notification messages more compelling or adding a clear call to action.
                      </p>
                    </li>)}
                  {totalNotifications < 5 && (<li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <p className="ml-3 text-sm text-gray-700">
                        Add more notifications to increase variety and keep your social proof fresh.
                      </p>
                    </li>)}
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-700">
                      Experiment with different notification types to see which performs best for your audience.
                    </p>
                  </li>
                </>)}
            </ul>
          </div>
        </div>
      </div>
    </div>);
}
