import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminUsers, useSendAdminNotification } from '@/lib/api/hooks'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function AdminNotifyPage() {
  const [searchParams] = useSearchParams()
  const preselectedUser = searchParams.get('user') ?? ''
  const { data: usersData } = useAdminUsers('', 1, 100)
  const sendNotification = useSendAdminNotification()
  const toast = useToast()

  const [userId, setUserId] = useState(preselectedUser)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [linkPath, setLinkPath] = useState('')

  useEffect(() => { if (preselectedUser) setUserId(preselectedUser) }, [preselectedUser])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !title.trim() || !body.trim()) {
      toast.error('Select a user and fill in title and body')
      return
    }
    try {
      await sendNotification.mutateAsync({
        user_id: userId,
        title: title.trim(),
        body: body.trim(),
        link_path: linkPath.trim() || undefined,
      })
      toast.success('Notification sent')
      setTitle('')
      setBody('')
      setLinkPath('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
        <p className="text-gray-500 text-sm">Message a saver directly in-app</p>
      </div>

      <Card>
        <CardTitle className="mb-4">Compose Message</CardTitle>
        <form onSubmit={handleSend} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            >
              <option value="">Select a user...</option>
              {usersData?.users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <Input label="Deep link (optional)" placeholder="/profile"
            value={linkPath} onChange={(e) => setLinkPath(e.target.value)} />
          <Button type="submit" loading={sendNotification.isPending}>Send Notification</Button>
        </form>
      </Card>
    </div>
  )
}
