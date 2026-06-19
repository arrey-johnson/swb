import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminUsers } from '@/lib/api/hooks'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Pagination, ADMIN_PAGE_SIZE } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils'
import { Search, ChevronRight } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminUsers(search, page, ADMIN_PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm">{data?.total ?? 0} savers registered</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data?.users.map((user) => (
              <Link key={user.id} to={`/admin/users/${user.id}`}>
                <Card className="hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{user.full_name}</p>
                        {user.phone_verified && (
                          <Badge className="bg-success/10 text-success text-[10px]">Verified</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 hidden sm:block">Joined {formatDate(user.created_at)}</p>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            {data?.users.length === 0 && (
              <Card className="text-center py-12 text-gray-400 text-sm">No users found</Card>
            )}
          </div>
          <Pagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
