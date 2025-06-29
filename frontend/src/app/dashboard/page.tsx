"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock 
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {title === "Total Value" ? "Combined contract value" : 
           title === "Total Contracts" ? "All contracts in system" :
           title === "Active Contracts" ? "Currently active" : "Awaiting approval"}
        </p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Welcome to your CRM overview
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-card border rounded-lg px-3 py-2 shadow-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value="0"
          icon={<FileText className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Total Value"
          value="$0.00"
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          title="Active Contracts"
          value="0"
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          title="Pending Contracts"
          value="0"
          icon={<Clock className="h-4 w-4 text-amber-600" />}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Monthly Contract Values</CardTitle>
            <p className="text-sm text-muted-foreground">Contract values over the last 12 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-muted-foreground font-medium">Chart will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">Connect data source to display chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Contract Status Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown of contract statuses</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-dashed border-green-200 dark:border-green-800">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-muted-foreground font-medium">Chart will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">Connect data source to display chart</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top lists placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Top Counterparties by Value</CardTitle>
            <p className="text-sm text-muted-foreground">Highest value trading partners</p>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-muted-foreground font-medium">Data will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">Connect data source to display list</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Top Commodities by Volume</CardTitle>
            <p className="text-sm text-muted-foreground">Most traded commodities</p>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-800">
              <div className="text-center">
                <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-muted-foreground font-medium">Data will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">Connect data source to display list</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}