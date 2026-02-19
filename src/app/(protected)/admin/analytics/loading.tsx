export default function AnalyticsLoading() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
                <div className="h-10 w-32 bg-emerald-200 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
                        <div>
                            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                            <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mt-2" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border shadow-sm p-6 h-80 animate-pulse" />
                <div className="bg-white rounded-xl border shadow-sm p-6 h-80 animate-pulse" />
            </div>
        </div>
    );
}
