import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
export default async function DashboardLayout({ children, }) {
    // Check if user is authenticated using the auth() function
    const session = await auth();
    // Strictly verify that we have a valid user session with ID
    if (!session || !session.user || !session.user.id) {
        console.log('User not authenticated, redirecting to signin from dashboard layout');
        redirect('/auth/signin?callbackUrl=/dashboard');
    }
    return (<div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="drawer-toggle" type="checkbox" className="drawer-toggle"/>
      
      <div className="drawer-content flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-16">
          <div className="container mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
      
      <Sidebar />
    </div>);
}
