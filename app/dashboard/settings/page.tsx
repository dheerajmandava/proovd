import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getServerSideUserData, getServerSideUserPreferences } from '@/app/lib/server/data-fetchers';
import UserSettingsForm from './components/UserSettingsForm';

export default async function SettingsPage() {
  // Get the session and user data
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }
  
  // Fetch user data with server components
  const userData = await getServerSideUserData();
  const userPreferences = await getServerSideUserPreferences();
  
  if (!userData) {
    redirect('/auth/signin');
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">User Settings</h1>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Your Profile</h2>
          
          {/* User settings form with server-fetched data */}
          <UserSettingsForm 
            initialUserData={userData} 
            initialPreferences={userPreferences} 
          />
        </div>
      </div>
    </div>
  );
} 