import Sidebar from '../components/Sidebar.jsx'
import { useState, useEffect} from 'react'
import './Transactions.css'
function Transactions() {
    const [transactions, setTransactions] = useState([])
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0
    })
    const[search, setSearch] = useState('')
    const[type, setType] = useState('')
    const [paymentCategory, setPaymentCategory] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    
    function fetchTransactions(page = 1) {
        //gets the JWT token of the logged_in user from localStorage
        const token = localStorage.getItem('token')
        
        //creates an object that helps us build URL filter parameters
        //it is an inbuild  webapi constructoe that helps create and manage query parameters
        const params = new URLSearchParams()

        params.append('page', page)
        
        if(search) params.append('search', search)
        if(type) params.append('type',type)
        if(startDate) params.append('start_date', startDate)
        if(endDate) params.append('end_date', endDate)

        if(paymentCategory === 'cash' || paymentCategory === 'mpesa') {
            params.append('payment_method', paymentCategory)
        }

        if (
            paymentCategory === 'transport' ||
            paymentCategory === 'supplies' ||
            paymentCategory === 'other'
        ) {
            params.append('expenditure_type', paymentCategory)
        }
        
        fetch(`http://localhost:3000/api/transactions?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
           .then(response => response.json())
           .then(data => {
                setTransactions(data.data)
                setPagination(data.pagination)
           })
    }  
    function clearFilters() {
        setSearch('')
        setType('')
        setPaymentCategory('')
        setStartDate('')
        setEndDate('')

        const token = localStorage.getItem('token')

        fetch('http://localhost:3000/api/transactions', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
          .then(response => response.json())
          .then(data => {
            setTransactions(data.data)
            setPagination(data.pagination)
          })
    }    
    useEffect(() => {
        const token = localStorage.getItem('token')

        fetch('http://localhost:3000/api/transactions', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response=> response.json())
            .then(data => {
                setTransactions(data.data)
                setPagination(data.pagination)
            })
    },[])
    return (
        <div className="dashboard-layout">
            <Sidebar />
            
            <div className='dashboard-content'>
                <h1>Transactions</h1>
                 <p>View and search all petty cash Transactions</p>
                 <div className="transaction-filters">

    <input
        type="text"
        placeholder="Search transactions"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
    />

    <select
        value={type}
        onChange={(e) => setType(e.target.value)}
    >
        <option value="">All Types</option>
        <option value="received">Received</option>
        <option value="expense">Expense</option>
    </select>

    <select
        value={paymentCategory}
        onChange={(e) => setPaymentCategory(e.target.value)}
    >
        <option value="">All Payment / Categories</option>
        <option value="cash">Cash</option>
        <option value="mpesa">M-Pesa</option>
        <option value="transport">Transport</option>
        <option value="supplies">Supplies</option>
        <option value="other">Other</option>
    </select>

    <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
    />

    <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
    />

    <button type="button" onClick={ () => fetchTransactions(1)}>
        Filter
    </button>

    <button type="button" onClick={clearFilters}>
        Clear
    </button>

</div>
                 <table className="transaction-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Details</th>
                            <th>Reference</th>
                            <th>Payment/Category</th>
                            <th>Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        {transactions.map(transaction => (
                            <tr key={`${transaction.type}-${transaction.transaction_id}`}>
                                <td>
                                    {new Date(transaction.transaction_date).toLocaleDateString(
                                        'en-GB',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        }
                                    )}
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
                                
                               <td>
                                  {transaction.receipt_number ||
                                   transaction.mpesa_transaction_number ||
                                   transaction.receipt_id ||
                                    '-'}
                               </td>

                            <td>
                                {transaction.type === 'received'
                                 ? transaction.payment_method
                                 : transaction.expenditure_type}
                            </td>

                            <td>Ksh {transaction.amount}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 <div className="pagination">

    {/* Previous button goes to the page before the current page */}
    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
    >
        Previous
    </button>

    {/* Creates one button for every available page */}
    {Array.from({ length: pagination.totalPages }, (_, index) => {

        // index starts at 0, so add 1 to get page numbers 1, 2, 3...
        const pageNumber = index + 1

        return (
            <button
                type="button"
                key={pageNumber}

                // when this page number is clicked, fetch that page
                onClick={() => fetchTransactions(pageNumber)}
            >
                {pageNumber}
            </button>
        )
    })}

    {/* Next button goes to the page after the current page */}
    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage + 1)}

        // disable Next if we are already on the last page
        disabled={pagination.currentPage === pagination.totalPages}
    >
        Next
    </button>

</div>
            </div>
        </div>
    )
}

export default Transactions