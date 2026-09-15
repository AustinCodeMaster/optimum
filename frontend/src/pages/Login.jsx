import { useState } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom'
function Login() {
    const [username, setUsername] = useState('') //useState is what lets React remember the current username and password while the user is typing
    const [password, setPassword] = useState('')
    
    const navigate = useNavigate()

    
    async function handleSubmit(e) {
        e.preventDefault()

        const response = await fetch('http://localhost:3000/api/auth/login', {  //sends the reuest tthe backend
            method: 'POST', //mathed the backend login route
            headers: {
                'Content-Type': 'application/json'  //tells Exoress we are sending JSON
            },
            body: JSON.stringify({  //conversts the javascript object into JSON text
                username: username,
                password: password
            })
        })
        //reads the response that comes from the backend
        const data = await response.json()

        if (response.ok) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            if(data.user.role === 'staff') {
                navigate('/staff/dashboard')
            }else if (data.user.role === 'admin') {
                navigate('/admin/dashboard')
            }
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">

                <h1>Welcome Back</h1>
                <p>Please log in to continue</p>

                <form onSubmit={handleSubmit}>
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit">
                        Login
                    </button>
                </form>

            </div>
        </div>
    )
}

export default Login