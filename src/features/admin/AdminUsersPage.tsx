import { useState } from 'react'
import { useAdminUsers } from '@/lib/api/hooks'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { Search } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const { data: users, isLoading } = useAdminUsers(search)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm">{users?.length ?? 0} savers</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {users?.map((user) => (
            <Card key={user.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{user.full_name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.phone}</p>
                </div>
                <p className="text-xs text-gray-400">Joined {formatDate(user.created_at)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
