import { Navigate} from 'react-router-dom'

function ProtectedRoute({ children, allowedRole}) {
    const token = localStorage.getItem('token') //gets the saved JWT
    const user = JSON.parse(localStorage.getItem('user')) //gets the saved user deatils and converties to js object

    if(!token || !user) { //if no user is logged in send them back to login
        return <Navigate to="/" />
    }

    if (user.role !== allowedRole) { //if the user has a wring role send them back to log in
        return <Navigate to="/" />
    }

    return children //allows access to the page
}

export default ProtectedRoute