import { useState, useEffect } from 'react'  //lets react remember data while the component is runnning
import './SummaryCards.css'
//useState= keeps the numbers
//useEffect = goes to get the numbers
function SummaryCards() {
    const [summary, setSummary] = useState({
        total_received: 0,
        total_expenses: 0,
        current_balance: 0
    })
    
    useEffect(() => {
        const token = localStorage.getItem('token') //get the JWT for the user

        fetch('http://localhost:3000/api/summary', { //sends  a requuest to the backend summary api
            headers: {
                Authorization: `Bearer ${token}`
            }
        }) 
           .then(response => response.json())  //when the response comes back convert it to JSON
           .then(data => {                     // when it is done save the data using setSummary saves the totals
                setSummary(data)
           })
    }, [])

    return (
        <div className="summary-cards">

            <div className="summary-card">
                <p>Total Received</p>
                <h2>Ksh {summary.total_received}</h2>
            </div>
            <div className="summary-card">
                 <p>Total Expenses</p>
                 <h2>Ksh {summary.total_expenses}</h2>
            </div>
            <div className="summary-card">
                <p>Current Balance</p>
                <h2>Ksh {summary.current_balance}</h2>
            </div>
        </div>
    )
}

export default SummaryCards