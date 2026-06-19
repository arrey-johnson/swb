import { useState } from 'react'
import {
  Heart,
  MessageCircle,
  Bookmark,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useFinanceComments,
  useToggleFinanceLike,
  useToggleFinanceSave,
  useAddFinanceComment,
} from '@/lib/api/hooks'
import type { FinancePostWithMeta } from '@/types/database'

interface FinancePostCardProps {
  post: FinancePostWithMeta
}

export function FinancePostCard({ post }: FinancePostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const toggleLike = useToggleFinanceLike()
  const toggleSave = useToggleFinanceSave()
  const addComment = useAddFinanceComment()
  const { data: comments, isLoading: commentsLoading } = useFinanceComments(
    showComments ? post.id : ''
  )

  const handleLike = () => {
    toggleLike.mutate({ postId: post.id, liked: post.liked_by_me })
  }

  const handleSave = () => {
    toggleSave.mutate({ postId: post.id, saved: post.saved_by_me })
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = comment.trim()
    if (!body) return
    await addComment.mutateAsync({ postId: post.id, body })
    setComment('')
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary text-xs font-bold">SW</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">SaveWithBanks</p>
          <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
        </div>
      </div>

      <h2 className="font-bold text-gray-900 mb-2">{post.title}</h2>
      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLike}
          disabled={toggleLike.isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            post.liked_by_me ? 'text-danger bg-danger/10' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} />
          {post.like_count > 0 ? post.like_count : 'Like'}
        </button>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comment_count > 0 ? post.comment_count : 'Comment'}
          {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={toggleSave.isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-auto',
            post.saved_by_me ? 'text-primary bg-primary/10' : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          <Bookmark className={cn('h-4 w-4', post.saved_by_me && 'fill-current')} />
          {post.saved_by_me ? 'Saved' : 'Save'}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          {commentsLoading ? (
            <p className="text-xs text-gray-400 text-center py-2">Loading comments…</p>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-700">
                    {c.profiles?.full_name ?? 'Member'}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{c.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-1">No comments yet. Be the first!</p>
          )}

          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment…"
              maxLength={1000}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" size="sm" loading={addComment.isPending} disabled={!comment.trim()}>
              Post
            </Button>
          </form>
        </div>
      )}
    </Card>
  )
}

interface FinanceFeedEmptyProps {
  savedOnly: boolean
}

export function FinanceFeedEmpty({ savedOnly }: FinanceFeedEmptyProps) {
  return (
    <Card className="text-center py-12">
      <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 text-sm font-medium">
        {savedOnly ? 'No saved tips yet' : 'No financial tips yet'}
      </p>
      <p className="text-gray-400 text-xs mt-1">
        {savedOnly
          ? 'Tap Save on any tip to find it here later.'
          : 'SaveWithBanks will share money tips here soon.'}
      </p>
    </Card>
  )
}
