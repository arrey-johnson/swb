import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  useAdminFinancePosts,
  useCreateFinancePost,
  useUpdateFinancePost,
  useDeleteFinancePost,
} from '@/lib/api/hooks'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

export default function AdminFinanceFeedPage() {
  const { data: posts, isLoading } = useAdminFinancePosts()
  const createPost = useCreateFinancePost()
  const updatePost = useUpdateFinancePost()
  const deletePost = useDeleteFinancePost()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || !content.trim()) return
    try {
      await createPost.mutateAsync({ title: title.trim(), content: content.trim() })
      setTitle('')
      setContent('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    }
  }

  const togglePublish = async (id: string, isPublished: boolean) => {
    await updatePost.mutateAsync({ id, is_published: !isPublished })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tip permanently?')) return
    await deletePost.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Feed</h1>
          <p className="text-gray-500 text-sm">Post financial tips for savers</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          New Tip
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardTitle className="mb-4">New Financial Tip</CardTitle>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-danger/10 text-danger text-sm px-4 py-3">{error}</div>
            )}
            <Input
              id="tip-title"
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
            <div>
              <label htmlFor="tip-content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="tip-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Share a practical money tip…"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={createPost.isPending}>Publish</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base truncate">{post.title}</CardTitle>
                    {!post.is_published && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(post.created_at)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublish(post.id, post.is_published)}
                    className="p-2 text-gray-400 hover:text-primary rounded-lg"
                    aria-label={post.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-gray-400 hover:text-danger rounded-lg"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">
          No tips posted yet. Create your first financial tip above.
        </Card>
      )}
    </div>
  )
}
