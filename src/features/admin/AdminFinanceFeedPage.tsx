import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Edit2, MessageSquare } from 'lucide-react'
import {
  useAdminFinancePosts,
  useCreateFinancePost,
  useUpdateFinancePost,
  useDeleteFinancePost,
  useAdminFinanceComments,
  useDeleteFinanceComment,
} from '@/lib/api/hooks'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import type { FinancePost } from '@/types/database'

export default function AdminFinanceFeedPage() {
  const { data: posts, isLoading } = useAdminFinancePosts()
  const createPost = useCreateFinancePost()
  const updatePost = useUpdateFinancePost()
  const deletePost = useDeleteFinancePost()
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [editPost, setEditPost] = useState<FinancePost | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const [commentsPostId, setCommentsPostId] = useState<string | null>(null)
  const { data: comments } = useAdminFinanceComments(commentsPostId ?? '')
  const deleteComment = useDeleteFinanceComment()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    try {
      await createPost.mutateAsync({ title: title.trim(), content: content.trim() })
      toast.success('Tip published')
      setTitle('')
      setContent('')
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post')
    }
  }

  const handleEdit = async () => {
    if (!editPost) return
    try {
      await updatePost.mutateAsync({
        id: editPost.id,
        title: editTitle.trim(),
        content: editContent.trim(),
      })
      toast.success('Tip updated')
      setEditPost(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const togglePublish = async (id: string, isPublished: boolean) => {
    try {
      await updatePost.mutateAsync({ id, is_published: !isPublished })
      toast.success(isPublished ? 'Unpublished' : 'Published')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tip permanently?')) return
    try {
      await deletePost.mutateAsync(id)
      toast.success('Tip deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const openEdit = (post: FinancePost) => {
    setEditPost(post)
    setEditTitle(post.title)
    setEditContent(post.content)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Feed</h1>
          <p className="text-gray-500 text-sm">Post and moderate financial tips</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> New Tip
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardTitle className="mb-4">New Financial Tip</CardTitle>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input id="tip-title" label="Title" value={title}
              onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            <div>
              <label htmlFor="tip-content" className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea id="tip-content" value={content} onChange={(e) => setContent(e.target.value)}
                required rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Share a practical money tip…" />
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
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">Draft</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(post.created_at)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => openEdit(post)} className="p-2 text-gray-400 hover:text-primary rounded-lg" aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setCommentsPostId(post.id)} className="p-2 text-gray-400 hover:text-primary rounded-lg" aria-label="Comments">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => togglePublish(post.id, post.is_published)} className="p-2 text-gray-400 hover:text-primary rounded-lg">
                    {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-danger rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 text-gray-400 text-sm">No tips posted yet.</Card>
      )}

      <Modal open={!!editPost} onClose={() => setEditPost(null)} title="Edit Tip">
        <div className="space-y-4">
          <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={5}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditPost(null)}>Cancel</Button>
            <Button loading={updatePost.isPending} onClick={handleEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!commentsPostId} onClose={() => setCommentsPostId(null)} title="Moderate Comments">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No comments</p>}
          {comments?.map((c) => (
            <div key={c.id} className="flex justify-between gap-3 p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-xs font-medium">{c.profiles?.full_name ?? 'User'}</p>
                <p className="text-sm">{c.body}</p>
                <p className="text-[10px] text-gray-400">{formatDate(c.created_at)}</p>
              </div>
              <Button size="sm" variant="danger" loading={deleteComment.isPending}
                onClick={async () => {
                  try {
                    await deleteComment.mutateAsync({ id: c.id, postId: commentsPostId! })
                    toast.success('Comment removed')
                  } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
                }}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
