import React from 'react'
import { useQuery } from 'react-query'
import { userApi, paymentApi } from '../../services/api'
import { 
  Wallet, 
  Users, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

const DashboardPage: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    userApi.getDashboard,
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Referral code copied!')
    } catch (error) {
      toast.error('Failed to copy referral code')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const data = dashboardData?.data

  const getStatCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center mt-1">
                {trend >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-success-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-danger-600" />
                )}
                <span className={`text-sm ml-1 ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary-100 rounded-lg">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {data?.user?.name}! Here's an overview of your account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCard(
          'Wallet Balance',
          `₹${data?.wallet?.balance || 0}`,
          <Wallet className="h-6 w-6 text-primary-600" />
        )}
        {getStatCard(
          'Total Earnings',
          `₹${data?.user?.totalEarnings || 0}`,
          <TrendingUp className="h-6 w-6 text-success-600" />
        )}
        {getStatCard(
          'Referrals',
          data?.stats?.referrals?.find((s: any) => s._id === 'completed')?.count || 0,
          <Users className="h-6 w-6 text-warning-600" />
        )}
        {getStatCard(
          'Transactions',
          data?.stats?.payments?.find((s: any) => s._id === 'paid')?.count || 0,
          <CreditCard className="h-6 w-6 text-info-600" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Referral Code</h3>
            <p className="card-description">Share this code with friends to earn rewards</p>
          </div>
          <div className="card-content">
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <code className="text-lg font-mono text-gray-900">
                  {data?.user?.referralCode}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(data?.user?.referralCode)}
                className="btn-secondary p-3"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <h4 className="text-sm font-medium text-primary-900 mb-2">How it works:</h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>• Share your referral code with friends</li>
                <li>• They sign up and make a payment</li>
                <li>• You earn ₹100 for each successful referral</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-description">Your latest transactions and referrals</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {data?.recentActivity?.transactions?.slice(0, 3).map((transaction: any) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{transaction.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'paid' 
                        ? 'bg-success-100 text-success-800'
                        : transaction.status === 'failed'
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
              
              {data?.recentActivity?.referrals?.slice(0, 2).map((referral: any) => (
                <div key={referral._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {referral.referredUserId?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{referral.rewardAmount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      referral.status === 'completed' 
                        ? 'bg-success-100 text-success-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button className="btn-secondary flex-1 text-sm">
                View All Transactions
              </button>
              <button className="btn-secondary flex-1 text-sm">
                View All Referrals
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">Common tasks you might want to perform</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <CreditCard className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900">Make Payment</h4>
              <p className="text-sm text-gray-600 mt-1">Add funds to your account</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900">Invite Friends</h4>
              <p className="text-sm text-gray-600 mt-1">Share your referral code</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Wallet className="h-8 w-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900">Withdraw Funds</h4>
              <p className="text-sm text-gray-600 mt-1">Transfer to your bank account</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
