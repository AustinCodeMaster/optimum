import SummaryCards from '../components/SummaryCards.jsx'
import RecentTransactions from '../components/RecentTransactions.jsx'
import Sidebar from '../components/Sidebar.jsx'
function AdminDashboard() {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-content">
            <h1>Admin Dashboard</h1>
            <SummaryCards />
            <RecentTransactions/>
        </div>
        </div>
    )
}

export default AdminDashboard