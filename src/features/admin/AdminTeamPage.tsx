import { useState } from 'react'
import { useAdminTeam, useAdminUsers, useAdminUpdateUserRole } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import { Shield, UserPlus } from 'lucide-react'

export default function AdminTeamPage() {
  const { data: team, isLoading } = useAdminTeam()
  const { data: savers } = useAdminUsers('', 1, 50)
  const updateRole = useAdminUpdateUserRole()
  const toast = useToast()

  const [promoteModal, setPromoteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')

  const handlePromote = async () => {
    if (!selectedUser) return
    try {
      await updateRole.mutateAsync({ userId: selectedUser, role: 'admin' })
      toast.success('User promoted to admin')
      setPromoteModal(false)
      setSelectedUser('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to promote')
    }
  }

  const handleDemote = async (userId: string, name: string) => {
    if (!confirm(`Remove admin access from ${name}?`)) return
    try {
      await updateRole.mutateAsync({ userId, role: 'saver' })
      toast.success('Admin access removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to demote')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm">Manage admin access</p>
        </div>
        <Button size="sm" onClick={() => setPromoteModal(true)}>
          <UserPlus className="h-4 w-4" /> Add Admin
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {team?.map((admin) => (
            <Card key={admin.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{admin.full_name}</p>
                    <p className="text-xs text-gray-400">{admin.email}</p>
                    <p className="text-xs text-gray-400">Since {formatDate(admin.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary">Admin</Badge>
                  {team.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => handleDemote(admin.id, admin.full_name)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={promoteModal} onClose={() => setPromoteModal(false)} title="Promote to Admin">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a saver to grant admin access.</p>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
          >
            <option value="">Select user...</option>
            {savers?.users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setPromoteModal(false)}>Cancel</Button>
            <Button loading={updateRole.isPending} onClick={handlePromote} disabled={!selectedUser}>
              Promote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
