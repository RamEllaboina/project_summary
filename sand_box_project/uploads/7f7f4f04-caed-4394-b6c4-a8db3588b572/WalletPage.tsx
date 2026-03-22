import React from 'react'
import { useQuery } from 'react-query'
import { userApi } from '../../services/api'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

const WalletPage: React.FC = () => {
  const { data: walletData, isLoading } = useQuery(
    'walletBalance',
    userApi.getWalletBalance,
    {
      staleTime: 2 * 60 * 1000,
    }
  )

  const { data: historyData } = useQuery(
    'walletHistory',
    () => userApi.getWalletHistory({ limit: 10 }),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const wallet = walletData?.data
  const history = historyData?.data.ledger || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your wallet balance and view transaction history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-semibold text-gray-900">₹{wallet?.balance || 0}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Wallet className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-semibold text-success-600">₹{wallet?.totalCredits || 0}</p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-2xl font-semibold text-danger-600">₹{wallet?.totalDebits || 0}</p>
              </div>
              <div className="p-3 bg-danger-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-danger-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
          <p className="card-description">Your latest wallet activity</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {history.map((transaction: any) => (
              <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'credit' 
                      ? 'bg-success-100' 
                      : 'bg-danger-100'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <TrendingUp className="h-4 w-4 text-success-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.type === 'credit' 
                      ? 'text-success-600' 
                      : 'text-danger-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                  </p>
                  <span className="text-xs text-gray-500">
                    {transaction.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            
            {history.length === 0 && (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button className="btn-primary">
          Request Withdrawal
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default WalletPage
