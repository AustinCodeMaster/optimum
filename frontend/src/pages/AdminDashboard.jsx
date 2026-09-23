import SummaryCards from '../components/SummaryCards.jsx'
import Sidebar from '../components/Sidebar.jsx'
import AdminTransactions from '../components/AdminTransactions.jsx'
import { useState } from 'react'

function AdminDashboard() {
    const [summaryRefresh, setSummaryRefresh] = useState(0)
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-content">
            <h1>Admin Dashboard</h1>
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