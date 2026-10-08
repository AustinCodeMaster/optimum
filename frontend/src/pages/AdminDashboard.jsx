import SummaryCards from '../components/SummaryCards.jsx'
import Sidebar from '../components/Sidebar.jsx'
import AdminTransactions from '../components/AdminTransactions.jsx'
import { useState } from 'react'

function AdminDashboard() {
    const [summaryRefresh, setSummaryRefresh] = useState(0)
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="min-w-0 flex-1 p-6 lg:p-8">
            <h1 className="mb-6 text-3xl font-bold text-slate-900">Admin Dashboard</h1>
           <SummaryCards refreshKey={summaryRefresh} />

            <AdminTransactions
            onTransactionUpdated={() =>
            setSummaryRefresh(previous => previous + 1)
            }
           />
        </div>
        </div>
    )
}

export default AdminDashboard