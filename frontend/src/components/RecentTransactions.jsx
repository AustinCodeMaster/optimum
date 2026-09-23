import { useState, useEffect } from 'react'
import './RecentTransactions.css'
function RecentTransactions() {
    const [transactions, setTransactions] = useState([]) //this means react should remember the transactions

    
    useEffect( () => {
        const token = localStorage.getItem('token')

        fetch('http://localhost:3000/api/transactions',{
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
           .then(response => response.json())  
           .then(data => {
            setTransactions(data.data.slice(0,5))
           })
        
    }, [])

    return (
        <div className="recent-transactions">
            <h2>Recent Transactions</h2>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Details</th>
                        <th>Amount</th>
                    </tr>
                </thead>

                <tbody> 
                    
                   {transactions.map(transaction =>( //.map means go through every transaction in the transactin array and created oe table for for each one
                    <tr key={transaction.transaction_id}>
                        <td>
                            {new Date(transaction.transaction_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </td>
                        <td>{transaction.type}</td>
                        <td>
                     {transaction.type === 'received' ? (
                        <>
                         {transaction.patient_name}
                        <br />
                       <small>Lab No: {transaction.lab_number}</small>
                        </>
                        ) : (
                        <>
                      {transaction.description}
                       {transaction.destination && (
                       <>
                       <br />
                    <small>{transaction.destination}</small>
                </> 
            )}
        </>
    )}
</td>
                        <td>Ksh {transaction.amount}</td>

                    </tr>
                   ))}
                </tbody>
            </table>
        </div>
    )
}

export default RecentTransactions