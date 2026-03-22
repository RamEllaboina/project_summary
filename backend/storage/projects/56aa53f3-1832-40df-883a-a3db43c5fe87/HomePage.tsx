import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users, TrendingUp, Shield, Star } from 'lucide-react'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900">Smart</span>
          </div>
          <div className="space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link to="/signup" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Referral &
            <br />
            Payment System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Earn rewards by referring friends. Make secure payments with Razorpay. 
            Track your earnings and transactions in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary text-lg px-8 py-3">
              Start Earning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Refer & Earn
            </h3>
            <p className="text-gray-600">
              Share your unique referral code and earn ₹100 for every successful referral
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Track Earnings
            </h3>
            <p className="text-gray-600">
              Monitor your wallet balance, referral earnings, and transaction history
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-warning-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-warning-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Secure Payments
            </h3>
            <p className="text-gray-600">
              Make safe payments with Razorpay integration and instant verification
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Sign Up</h4>
                    <p className="text-gray-600">
                      Create your account and get your unique referral code
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Refer Friends</h4>
                    <p className="text-gray-600">
                      Share your referral code with friends and family
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Earn Rewards</h4>
                    <p className="text-gray-600">
                      Get ₹100 when your referrals make their first payment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Start Earning Today
              </h3>
              <p className="text-gray-700 mb-6">
                Join thousands of users who are already earning rewards through our referral program.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-gray-700">No hidden fees</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-gray-700">Instant rewards</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-gray-700">Secure transactions</span>
                </div>
              </div>
              <Link to="/signup" className="btn-primary w-full">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Trusted by Users
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success-600 mb-2">₹50L+</div>
              <p className="text-gray-600">Rewards Paid</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-warning-600 mb-2">99.9%</div>
              <p className="text-gray-600">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
