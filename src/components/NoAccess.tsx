export default function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-6 mb-4">
        <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">403 - No Access</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">You do not have permission to view this page.<br />If you believe this is a mistake, please contact your administrator.</p>
      <a href="/admin" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300">Go to Dashboard</a>
    </div>
  );
} 