import { NavLink, useNavigate } from 'react-router-dom'
import './Sidebar.css'
function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user'))
    const navigate = useNavigate() //the function useNavigate sends the user back to Login
    
    function handleLogout() {
        localStorage.removeItem('token')//removes the saved tokenfrom localStorage
        localStorage.removeItem('user') //removes the save user

        navigate('/') //sends them back to the login page
    }
    return (
        <div className="sidebar">
            <h2>OPTIMUM DIAGNOSTICS</h2>
            <p>Petty Cash Management</p>
            
            {user.role === 'staff' && (
                <div>
                    <NavLink to="/staff/dashboard">Dashboard</NavLink>
                    <NavLink to="/staff/received">Record Received</NavLink>
                    <NavLink to="/staff/expense">Record Expense</NavLink>
                    <NavLink to="/staff/transactions">Transactions</NavLink>
                </div>
            )}

            {user.role === 'admin' && (
                <div>
                    <NavLink to="/admin/dashboard">Overview</NavLink>
                    
                </div>
            )}
           <button onClick={handleLogout}>
                  LogOut
           </button>
            
        </div>
    )
}

export default Sidebar