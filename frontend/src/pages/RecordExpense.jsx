import Sidebar from '../components/Sidebar.jsx'
import './RecordExpense.css'
import { useState } from 'react'

function RecordExpense() {
    const [amount, setAmount] = useState('')
    const [expenseType, setExpenseType] = useState('')
    const [description, setDescription] = useState('')
    const [destination, setDestination] = useState('')
    const [receiptId, setReceiptId] = useState('')
    const [dateOfExpense, setDateOfExpense] = useState('')
    
    async function handleSubmit(e) {
        e.preventDefault()

        const token = localStorage.getItem('token')

        const response = await fetch('http://localhost:3000/api/expense', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: Number(amount),
                expenditure_type: expenseType,
                description: description,
            //if it is transport send the destination otherwise null
                destination:
                   expenseType === 'transport'
                   ? destination
                   : null,
                
                receipt_id:
                expenseType === 'supplies' || expenseType === 'other'
                  ?receiptId || null
                  : null,

                  date_of_expense: dateOfExpense
            })
        })

        const data = await response.json()
        if (response.ok) {
            alert('Expense recorded successfully')
        } else {
            alert(data.message)
        }

    }
    return (
        <div className="dashboard-layout">
            <Sidebar/>

            <div className="dashboard-content">
                  <h1>Record Expense</h1>
                  <p>Enter details of the Expense</p>

                  <form className="expense-form" onSubmit={handleSubmit}>
                    <label>Amount</label>
                    <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    required
                     />

                     <label>Expense Category</label>
                     <select
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value)}
                      required
                     >
                        <option value="">Select category</option>
                        <option value="transport">Transport</option>
                        <option value="supplies">Supplies</option>
                        <option value="other">Other</option>
                     </select>

                     <label>Description</label>
                     <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    {expenseType === 'transport' && (
                        <>
                         <label>Destination</label>
                         <input type="text"
                         value={destination}
                         onChange={(e) => setDestination(e.target.value)}
                         required
                         />
                        </>
                    )}

                    {(expenseType === 'supplies' || expenseType === 'other') && (
                        <>
                        <label>Receipt ID</label>
                        <input 
                          type="text"
                          value={receiptId}
                          onChange={(e) => setReceiptId(e.target.value)}
                          required
                        />
                        </>
                    )}

                    <label>Date of Expense</label>
                    <input 
                     type="date" 
                     value={dateOfExpense}
                     onChange={(e) => setDateOfExpense(e.target.value)}
                     />

                     <button type="submit"> Save expense</button>
                  </form>
            </div>

        </div>
    )
}

export default RecordExpense