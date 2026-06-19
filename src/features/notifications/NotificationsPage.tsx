import { useNavigate } from 'react-router-dom'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/api/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  const handleClick = (id: string, isRead: boolean, linkPath: string | null) => {
    if (!isRead) markRead.mutate(id)
    if (linkPath) navigate(linkPath)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">Stay updated on your savings</p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition-colors ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''} ${
                n.link_path ? 'cursor-pointer hover:border-primary/40' : ''
              }`}
              onClick={() => handleClick(n.id, n.is_read, n.link_path)}
            >
              <div className="flex gap-3">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{formatDate(n.created_at)}</p>
                    {n.link_path && (
                      <span className="text-xs text-primary font-medium">View →</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No notifications yet</p>
        </Card>
      )}
    </div>
  )
}
