import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user'))
    const navigate = useNavigate()
    // The menu starts closed on small screens; desktop navigation stays visible.
    const [menuOpen, setMenuOpen] = useState(false)

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
        <aside className="flex w-full flex-col bg-[#0f2747] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto">

            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 lg:block lg:p-6">
                <div>
                <h2 className="text-xl font-bold tracking-wide">
                    OPTIMUM DIAGNOSTICS
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                    Petty Cash Management
                </p>
                </div>
                {/* Only small screens need a button to show or hide navigation. */}
                <button
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls="sidebar-menu"
                    onClick={() => setMenuOpen(open => !open)}
                    className="shrink-0 rounded-lg border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"
                >
                    {menuOpen ? 'Close' : 'Menu'}
                </button>
            </div>

            {/* lg:flex keeps the menu visible on larger screens regardless of state. */}
            <div id="sidebar-menu" className={`${menuOpen ? 'flex' : 'hidden'} flex-1 flex-col lg:flex`}>
            {user.role === 'staff' && (
                <nav className="flex flex-1 flex-col gap-3 p-4 pt-6">
                    <NavLink
                        to="/staff/dashboard"
                        className={linkClass}
                        onClick={() => setMenuOpen(false)}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/staff/received"
                        className={linkClass}
                        onClick={() => setMenuOpen(false)}
                    >
                        Record Received
                    </NavLink>

                    <NavLink
                        to="/staff/expense"
                        className={linkClass}
                        onClick={() => setMenuOpen(false)}
                    >
                        Record Expense
                    </NavLink>

                    <NavLink
                        to="/staff/transactions"
                        className={linkClass}
                        onClick={() => setMenuOpen(false)}
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
                        onClick={() => setMenuOpen(false)}
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
            </div>

        </aside>
    )
}

export default Sidebar
