import Sidebar from '../components/Sidebar.jsx'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTransactionSave from '../hooks/useTransactionSave.js'

function RecordReceived() {
    const [patientName, setPatientName] = useState('')
    const [doctorName, setDoctorName] = useState('')
    const [labNumber, setLabNumber] = useState('')
    const [amount, setAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [receiptNumber, setReceiptNumber] = useState('')
    const [mpesaTransactionNumber, setMpesaTransactionNumber] = useState('')
    const [dateReceived, setDateReceived] = useState('')
    const [receivedType, setReceivedType] = useState('patient_payment')
    const { save, isSaving, error, success } = useTransactionSave(
        '/api/received',
        'Payment recorded successfully'
    )

    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        if (isSaving) return

        const saved = await save({
            patient_name: receivedType === 'patient_payment' ? patientName : null,
            doctor_name: receivedType === 'patient_payment' ? doctorName : null,
            lab_number: receivedType === 'patient_payment' ? labNumber : null,
            amount: Number(amount),
            payment_method: paymentMethod,
            receipt_number: paymentMethod === 'cash' ? receiptNumber : null,
            mpesa_transaction_number: paymentMethod === 'mpesa' ? mpesaTransactionNumber : null,
            date_received: dateReceived,
            received_type: receivedType,
        })

        if (saved) {
            setPatientName('')
            setDoctorName('')
            setLabNumber('')
            setAmount('')
            setPaymentMethod('')
            setReceiptNumber('')
            setMpesaTransactionNumber('')
            setDateReceived('')
            setReceivedType('patient_payment')
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            <main className="min-w-0 flex-1 p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Record Received Payment
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Record a patient payment or owner funding
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    aria-busy={isSaving}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    {error && (
                        <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {success}
                        </p>
                    )}
                    <fieldset disabled={isSaving} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <legend className="sr-only">Received payment details</legend>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Received Type
                        </label>

                        <select
                            value={receivedType}
                            onChange={(e) => setReceivedType(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="patient_payment">
                                Patient Payment
                            </option>

                            <option value="owner_funding">
                                Owner Funding
                            </option>
                        </select>
                    </div>

                    {receivedType === 'patient_payment' && (
                        <>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Patient Name
                                </label>

                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) =>
                                        setPatientName(e.target.value)
                                    }
                                    required
                                    placeholder="Enter patient name"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Doctor Name
                                </label>

                                <input
                                    type="text"
                                    value={doctorName}
                                    onChange={(e) =>
                                        setDoctorName(e.target.value)
                                    }
                                    required
                                    placeholder="Enter doctor name"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Lab Number
                                </label>

                                <input
                                    type="text"
                                    value={labNumber}
                                    onChange={(e) =>
                                        setLabNumber(e.target.value)
                                    }
                                    required
                                    placeholder="Enter lab number"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Amount
                        </label>

                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            required
                            placeholder="Enter amount"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Payment Method
                        </label>

                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                Select payment method
                            </option>

                            <option value="cash">
                                Cash
                            </option>

                            <option value="mpesa">
                                Mpesa
                            </option>
                        </select>
                    </div>

                    {paymentMethod === 'cash' && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Receipt Number
                            </label>

                            <input
                                type="text"
                                value={receiptNumber}
                                onChange={(e) =>
                                    setReceiptNumber(e.target.value)
                                }
                                required
                                placeholder="Enter receipt number"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    )}

                    {paymentMethod === 'mpesa' && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                M-Pesa Transaction Number
                            </label>

                            <input
                                type="text"
                                value={mpesaTransactionNumber}
                                onChange={(e) =>
                                    setMpesaTransactionNumber(e.target.value)
                                }
                                required
                                placeholder="Enter M-Pesa transaction number"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Date Received
                        </label>

                        <input
                            type="date"
                            value={dateReceived}
                            onChange={(e) =>
                                setDateReceived(e.target.value)
                            }
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex justify-end gap-3 md:col-span-2">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => navigate('/staff/dashboard')}
                            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? 'Saving…' : 'Save Payment'}
                        </button>
                    </div>
                    </fieldset>
                </form>
            </main>
        </div>
    )
}

export default RecordReceived
