import { auth } from '@/auth';
import ServerHydratedWebsiteDetails from './components/ServerHydratedWebsiteDetails';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/ui/card';
import Link from 'next/link';
export default async function WebsitePage(props) {
    var _a;
    const params = await props.params;
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.email)) {
        return (<div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>);
    }
    try {
        const websiteId = params.id;
        return (<>
        <ServerHydratedWebsiteDetails websiteId={websiteId}/>
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ProovdPulse</CardTitle>
            <div className="h-4 w-4 rounded-full bg-indigo-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(Math.random() * 100) + 10}
            </div>
            <p className="text-xs text-muted-foreground">Active users right now</p>
          </CardContent>
          <CardFooter>
            <Link href={`/dashboard/websites/${websiteId}/pulse`} className="text-xs text-blue-500 hover:underline">
              View engagement insights
            </Link>
          </CardFooter>
        </Card>
      </>);
    }
    catch (error) {
        console.error('Error loading website:', error);
        return (<div className="container mx-auto p-6">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Failed to load website. Please try again later.</span>
        </div>
      </div>);
    }
}
