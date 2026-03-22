import React from 'react'

const AdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all registered users
        </p>
      </div>
      
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <p className="text-gray-500">User management coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
