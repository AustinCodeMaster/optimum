import { NavLink, useNavigate } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user'))
    const navigate = useNavigate()

    function handleLogout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        navigate('/')
    }

    const linkClass = ({ isActive }) =>
        `rounded-lg px-4 py-3 text-sm font-medium transition ${
            isActive
                ? 'bg-white/15 text-white'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
        }`

    return (
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[#0f2747] text-white">

            <div className="border-b border-white/10 p-6">
                <h2 className="text-xl font-bold tracking-wide">
                    OPTIMUM DIAGNOSTICS
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                    Petty Cash Management
                </p>
            </div>

            {user.role === 'staff' && (
                <nav className="flex flex-1 flex-col gap-3 p-4 pt-6">
                    <NavLink
                        to="/staff/dashboard"
                        className={linkClass}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/staff/received"
                        className={linkClass}
                    >
                        Record Received
                    </NavLink>

                    <NavLink
                        to="/staff/expense"
                        className={linkClass}
                    >
                        Record Expense
                    </NavLink>

                    <NavLink
                        to="/staff/transactions"
                        className={linkClass}
                    >
                        Transactions
                    </NavLink>
                </nav>
            )}

            {user.role === 'admin' && (
                <nav className="flex flex-1 flex-col gap-3 p-4 pt-6">
                    <NavLink
                        to="/admin/dashboard"
                        className={linkClass}
                    >
                        Overview
                    </NavLink>
                </nav>
            )}

            <div className="mt-auto p-4">
                <button
                    onClick={handleLogout}
                    className="w-full rounded-lg border border-white/20 px-4 py-3 text-left text-sm font-medium transition hover:bg-white/10"
                >
                    Log Out
                </button>
            </div>

        </aside>
    )
}

export default Sidebar