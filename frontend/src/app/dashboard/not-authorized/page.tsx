"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function NotAuthorizedPage() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Not Authorized</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You do not have permission to view this page.
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
        </CardContent>
      </Card>
    </div>
  )
}

