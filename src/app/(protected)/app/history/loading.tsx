export default function HistoryLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
                <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-blue-100 rounded-full animate-pulse" />
                        <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                        <div className="h-6 w-6 bg-gray-100 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
