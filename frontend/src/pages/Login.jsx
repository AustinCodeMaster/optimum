import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
    const [username, setUsername] = useState('') //useState is what lets React remember the current username and password while the user is typing
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()

    
    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        const apiUrl = import.meta.env.VITE_API_URL

        if (!apiUrl) {
            setError('The server address is not configured.')
            return
        }

        try {
            const response = await fetch(`${apiUrl}/api/auth/login`, {  //sends the reuest tthe backend
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
                setError('')
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))

                if(data.user.role === 'staff') {
                    navigate('/staff/dashboard')
                }else if (data.user.role === 'admin') {
                    navigate('/admin/dashboard')
                }
            } else {
                setError(data.message || 'Login failed. Please try again.')
            }
        } catch {
            setError('Unable to contact the server or read its response. Please try again.')
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
            <section
                aria-labelledby="login-heading"
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8"
            >
                <div className="mb-8 flex items-center justify-center gap-3">
                    
                    <div>
                        <p className="text-sm font-bold tracking-wide text-slate-900">
                            OPTIMUM DIAGNOSTICS
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Petty Cash Management
                        </p>
                    </div>
                </div>

                <h1 id="login-heading" className="text-center text-3xl font-bold tracking-tight text-slate-900">
                    Welcome Back
                </h1>
                <p className="mt-2 text-center text-sm text-slate-500">
                    Please log in to continue
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    {error && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            autoComplete="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full cursor-pointer rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                        Login
                    </button>
                </form>
            </section>
        </main>
    )
}

export default Login
