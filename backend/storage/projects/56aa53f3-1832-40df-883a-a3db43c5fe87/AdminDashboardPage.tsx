import React from 'react'
import { useQuery } from 'react-query'
import { adminApi } from '../../services/api'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  UserCheck
} from 'lucide-react'

const AdminDashboardPage: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'adminDashboard',
    adminApi.getDashboardStats,
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

  const data = dashboardData?.data

  const getStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 ${color} rounded-lg`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of system performance and user activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCard(
          'Total Users',
          data?.overview?.totalUsers || 0,
          <Users className="h-6 w-6 text-blue-600" />,
          'bg-blue-100'
        )}
        {getStatCard(
          'Total Transactions',
          data?.overview?.totalTransactions || 0,
          <CreditCard className="h-6 w-6 text-green-600" />,
          'bg-green-100'
        )}
        {getStatCard(
          'Total Revenue',
          `₹${data?.overview?.totalRevenue || 0}`,
          <DollarSign className="h-6 w-6 text-yellow-600" />,
          'bg-yellow-100'
        )}
        {getStatCard(
          'Completed Referrals',
          data?.overview?.completedReferrals || 0,
          <UserCheck className="h-6 w-6 text-purple-600" />,
          'bg-purple-100'
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Monthly Revenue</h3>
            <p className="card-description">Revenue trends over time</p>
          </div>
          <div className="card-content">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <BarChart3 className="h-12 w-12 text-gray-400" />
              <p className="ml-3 text-gray-500">Chart visualization</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Growth</h3>
            <p className="card-description">New user registrations</p>
          </div>
          <div className="card-content">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <TrendingUp className="h-12 w-12 text-gray-400" />
              <p className="ml-3 text-gray-500">Growth chart</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <button className="w-full btn-secondary text-left justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </button>
              <button className="w-full btn-secondary text-left justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                View Transactions
              </button>
              <button className="w-full btn-secondary text-left justify-start">
                <UserCheck className="h-4 w-4 mr-2" />
                Review Referrals
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Status</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="text-sm font-medium text-success-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-success-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <span className="text-sm font-medium text-success-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-content">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <p>• 5 new users registered today</p>
                <p>• 12 transactions completed</p>
                <p>• 3 referrals pending review</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
