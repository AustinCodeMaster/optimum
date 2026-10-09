import { useState, useEffect } from 'react'  //lets react remember data while the component is runnning
//useState= keeps the numbers
//useEffect = goes to get the numbers
const apiUrl = import.meta.env.VITE_API_URL

function SummaryCards({ refreshKey }) {
    const [summary, setSummary] = useState({
        total_received: 0,
        total_expenses: 0,
        current_balance: 0
    })
    const [error, setError] = useState('')
    
    useEffect(() => {
        const token = localStorage.getItem('token') //get the JWT for the user

        fetch(`${apiUrl}/api/summary`, { //sends  a requuest to the backend summary api
            headers: {
                Authorization: `Bearer ${token}`
            }
        }) 
           .then(async response => {
                const data = await response.json() //when the response comes back convert it to JSON
                if (!response.ok) {
                    setError(data.message || 'Unable to load summary.')
                    return
                }
                setError('')
                setSummary(data)
           })
           .catch(() => {
                setError('Unable to contact the server or read its response. Please try again.')
           })
    }, [refreshKey])

    return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-3">
                {error}
            </p>
        )}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                    ↓
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Total Received
                    </p>

                    <h2 className="mt-1 text-3xl font-bold text-emerald-700">
                        Ksh {summary.total_received}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Total amount received
                    </p>
                </div>
            </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
                    ↑
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Total Expenses
                    </p>

                    <h2 className="mt-1 text-3xl font-bold text-red-700">
                        Ksh {summary.total_expenses}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Total amount spent
                    </p>
                </div>
            </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-700">
                    ₵
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Current Balance
                    </p>

                    <h2 className="mt-1 text-3xl font-bold text-blue-700">
                        Ksh {summary.current_balance}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Available petty cash
                    </p>
                </div>
            </div>
        </div>

    </div>
)
}

export default SummaryCards
