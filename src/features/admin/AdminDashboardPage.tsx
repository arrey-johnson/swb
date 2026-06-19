import { useAdminMetrics, useProfile } from '@/lib/api/hooks'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardTitle } from '@/components/ui/Card'
import { Users, Wallet, ArrowDownLeft, ArrowUpRight, AlertTriangle, Target, Clock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function AdminDashboardPage() {
  const { data: metrics, isLoading } = useAdminMetrics()
  const { data: profile } = useProfile()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Total Users" value={metrics?.total_users ?? 0} icon={<Users className="h-5 w-5" />} formatAsCurrency={false} />
        <StatCard title="Total Savings" value={metrics?.total_savings ?? 0} icon={<Wallet className="h-5 w-5" />} variant="primary" />
        <StatCard title="Total Deposits" value={metrics?.total_deposits ?? 0} icon={<ArrowDownLeft className="h-5 w-5" />} />
        <StatCard title="Total Withdrawals" value={metrics?.total_withdrawals ?? 0} icon={<ArrowUpRight className="h-5 w-5" />} />
        <StatCard title="Penalties Collected" value={metrics?.total_penalties ?? 0} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Active Goals" value={metrics?.active_goals ?? 0} icon={<Target className="h-5 w-5" />} formatAsCurrency={false} />
        <StatCard title="Matured Goals" value={metrics?.matured_goals ?? 0} icon={<CheckCircle className="h-5 w-5" />} formatAsCurrency={false} />
      </div>

      {(metrics?.pending_deposits ?? 0) > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <CardTitle>{metrics?.pending_deposits} Pending Deposits</CardTitle>
                <p className="text-sm text-gray-500">Awaiting your review</p>
              </div>
            </div>
            <Link to="/admin/deposits">
              <Button size="sm">Review</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/users"><Button variant="outline" className="w-full">Users</Button></Link>
        <Link to="/admin/penalties"><Button variant="outline" className="w-full">Penalties</Button></Link>
        <Link to="/admin/reports"><Button variant="outline" className="w-full">Reports</Button></Link>
        <Link to="/admin/deposits"><Button variant="outline" className="w-full">Deposits</Button></Link>
      </div>
    </div>
  )
}
