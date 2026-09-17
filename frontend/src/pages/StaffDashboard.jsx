import SummaryCards from '../components/SummaryCards.jsx'
import RecentTransactions from '../components/RecentTransactions.jsx'
import Sidebar from '../components/Sidebar.jsx'

function StaffDashboard() {
    return (
       <div className="dashboard-layout">
        <Sidebar />
         <div className="dashboard-content">
            <h1>Staff Dashboard</h1>
            <SummaryCards />
            <RecentTransactions />
        </div>
       </div>
    )
}

export default StaffDashboard