import { useAdminMetrics, useProfile } from '@/lib/api/hooks'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardTitle } from '@/components/ui/Card'
import {
  Users, Wallet, ArrowDownLeft, ArrowUpRight, AlertTriangle, Target,
  Clock, CheckCircle, TrendingUp, UserPlus, Ban,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { formatFCFA } from '@/lib/utils'

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

  const pendingDeposits = metrics?.pending_deposits ?? 0
  const pendingPayouts = metrics?.pending_payouts ?? 0
  const oldestHours = metrics?.oldest_pending_deposit_hours ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
        </p>
      </div>

      {/* Alerts */}
      {(pendingDeposits > 0 || pendingPayouts > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {pendingDeposits > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <CardTitle>{pendingDeposits} Pending Deposits</CardTitle>
                    <p className="text-sm text-gray-500">
                      {oldestHours > 0 ? `Oldest waiting ${oldestHours}h` : 'Awaiting review'}
                    </p>
                  </div>
                </div>
                <Link to="/admin/deposits"><Button size="sm">Review</Button></Link>
              </div>
            </Card>
          )}
          {pendingPayouts > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <CardTitle>{pendingPayouts} Pending Payouts</CardTitle>
                    <p className="text-sm text-gray-500">Send Mobile Money & mark paid</p>
                  </div>
                </div>
                <Link to="/admin/withdrawals"><Button size="sm">Process</Button></Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Platform KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Platform Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Users" value={metrics?.total_users ?? 0} icon={<Users className="h-5 w-5" />} formatAsCurrency={false} />
          <StatCard title="Total Savings" value={metrics?.total_savings ?? 0} icon={<Wallet className="h-5 w-5" />} variant="primary" />
          <StatCard title="Total Deposits" value={metrics?.total_deposits ?? 0} icon={<ArrowDownLeft className="h-5 w-5" />} />
          <StatCard title="Total Withdrawals" value={metrics?.total_withdrawals ?? 0} icon={<ArrowUpRight className="h-5 w-5" />} />
          <StatCard title="Penalties" value={metrics?.total_penalties ?? 0} icon={<AlertTriangle className="h-5 w-5" />} />
          <StatCard title="Active Goals" value={metrics?.active_goals ?? 0} icon={<Target className="h-5 w-5" />} formatAsCurrency={false} />
          <StatCard title="Matured Goals" value={metrics?.matured_goals ?? 0} icon={<CheckCircle className="h-5 w-5" />} formatAsCurrency={false} />
          <StatCard title="Suspended" value={metrics?.suspended_accounts ?? 0} icon={<Ban className="h-5 w-5" />} formatAsCurrency={false} />
        </div>
      </div>

      {/* This week */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">This Week</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-gray-500">New Users</p>
                <p className="text-xl font-bold">{metrics?.new_users_week ?? 0}</p>
                <p className="text-[10px] text-gray-400">{metrics?.new_users_month ?? 0} this month</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs text-gray-500">Deposits</p>
                <p className="text-xl font-bold">{formatFCFA(metrics?.deposits_this_week ?? 0)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-5 w-5 text-danger" />
              <div>
                <p className="text-xs text-gray-500">Withdrawals</p>
                <p className="text-xl font-bold">{formatFCFA(metrics?.withdrawals_this_week ?? 0)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-xs text-gray-500">Queue</p>
                <p className="text-xl font-bold">{pendingDeposits + pendingPayouts}</p>
                <p className="text-[10px] text-gray-400">deposits + payouts</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/admin/users"><Button variant="outline" className="w-full">Users</Button></Link>
        <Link to="/admin/reports"><Button variant="outline" className="w-full">Reports</Button></Link>
        <Link to="/admin/settings"><Button variant="outline" className="w-full">Settings</Button></Link>
        <Link to="/admin/audit"><Button variant="outline" className="w-full">Audit Log</Button></Link>
      </div>
    </div>
  )
}
