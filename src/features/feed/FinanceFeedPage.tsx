import { useState } from 'react'
import { useFinancePosts } from '@/lib/api/hooks'
import { FinancePostCard, FinanceFeedEmpty } from '@/features/feed/FinancePostCard'
import { cn } from '@/lib/utils'

type FeedTab = 'all' | 'saved'

export default function FinanceFeedPage() {
  const [tab, setTab] = useState<FeedTab>('all')
  const { data: posts, isLoading } = useFinancePosts(tab === 'saved')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Feed</h1>
        <p className="text-gray-500 text-sm">Tips and lessons from SaveWithBanks</p>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1">
        {(['all', 'saved'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
            )}
          >
            {t === 'all' ? 'All Tips' : 'Saved'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <FinancePostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <FinanceFeedEmpty savedOnly={tab === 'saved'} />
      )}
    </div>
  )
}
