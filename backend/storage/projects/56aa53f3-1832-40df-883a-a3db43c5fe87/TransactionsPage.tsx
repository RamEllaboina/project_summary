import React from 'react'

const TransactionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your payment history and transaction details
        </p>
      </div>
      
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <p className="text-gray-500">Transaction history coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionsPage
