import SummaryCards from '../components/SummaryCards.jsx'
import RecentTransactions from '../components/RecentTransactions.jsx'
import Sidebar from '../components/Sidebar.jsx'

function StaffDashboard() {
    return (
       <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
         <main className="min-w-0 flex-1 p-6 lg:p-8">
           <div className="mb-6">
    <h1 className="text-3xl font-bold text-slate-900">
        Staff Dashboard
    </h1>

    <p className="mt-1 text-sm text-slate-500">
        Welcome back! Here is a summary of the petty cash.
    </p>
</div>
      <div className="space-y-6">
           <SummaryCards />
            <RecentTransactions />
      </div>
            
        </main>
       </div>
    )
}

export default StaffDashboard