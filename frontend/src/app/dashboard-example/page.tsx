'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, CheckCircle, Users, TrendingUp, DollarSign, Activity } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your CRM overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">2,345</div>
              <p className="text-xs text-green-600 mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">89</div>
              <p className="text-xs text-green-600 mt-1">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$45,231</div>
              <p className="text-xs text-green-600 mt-1">
                +23% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Activities</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">573</div>
              <p className="text-xs text-green-600 mt-1">
                +8% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Tasks */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-800">Follow up with new lead</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </li>
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-800">Finalize contract draft</span>
                  <CheckCircle className="h-4 w-4 text-yellow-500" />
                </li>
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-800">Schedule meeting with traders</span>
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                </li>
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-800">Review quarterly reports</span>
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                </li>
              </ul>
              <button className="w-full mt-4 px-4 py-2 text-sm text-cyan-600 border border-cyan-600 rounded-md hover:bg-cyan-50 transition-colors">
                View All Tasks
              </button>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="lg:col-span-2 bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Revenue Overview</CardTitle>
              <p className="text-sm text-gray-600">Monthly revenue for the last 6 months</p>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-md bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-dashed border-cyan-200">
                <div className="text-center">
                  <BarChart2 className="h-12 w-12 text-cyan-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Revenue Chart</p>
                  <p className="text-sm text-gray-500 mt-1">Chart visualization will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New contact added: John Smith</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-md">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Deal closed: $15,000 contract</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-md">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Meeting scheduled with Alice Johnson</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
