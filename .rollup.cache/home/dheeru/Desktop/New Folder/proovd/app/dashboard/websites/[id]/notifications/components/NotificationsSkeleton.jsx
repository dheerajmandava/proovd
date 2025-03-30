export default function NotificationsSkeleton() {
    return (<div className="grid grid-cols-1 gap-6">
      {[1, 2, 3].map((index) => (<div key={index} className="card bg-base-100 shadow-lg animate-pulse">
          <div className="card-body">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="w-full">
                <div className="h-7 bg-base-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-base-300 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-base-300 rounded w-1/4 mb-2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-base-300 rounded"></div>
                <div className="h-8 w-16 bg-base-300 rounded"></div>
                <div className="h-8 w-16 bg-base-300 rounded"></div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-base-300 mr-3"></div>
                <div className="w-full">
                  <div className="h-4 bg-base-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-base-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>))}
    </div>);
}
