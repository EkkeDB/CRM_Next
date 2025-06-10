'use client'

import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Follow up with new lead</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </li>
              <li className="flex items-center justify-between">
                <span>Finalize contract draft</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </li>
              <li className="flex items-center justify-between">
                <span>Schedule meeting with traders</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed">
              <BarChart2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
