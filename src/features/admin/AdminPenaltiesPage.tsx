import { useState } from 'react'
import { usePenaltySettings, useUpdatePenalty } from '@/lib/api/hooks'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function AdminPenaltiesPage() {
  const { data: settings, isLoading } = usePenaltySettings()
  const updatePenalty = useUpdatePenalty()
  const toast = useToast()
  const [edits, setEdits] = useState<Record<string, string>>({})

  const handleSave = async (id: string) => {
    const percentage = parseFloat(edits[id])
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Enter a percentage between 0 and 100')
      return
    }
    try {
      await updatePenalty.mutateAsync({ id, percentage })
      toast.success('Penalty rate updated')
      setEdits((prev) => { const n = { ...prev }; delete n[id]; return n })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Penalty Settings</h1>
        <p className="text-gray-500 text-sm">Configure early withdrawal penalties</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {settings?.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{s.duration_months} Month Goal</CardTitle>
                  <p className="text-xs text-gray-400">Early withdrawal penalty rate</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20"
                    value={edits[s.id] ?? s.percentage.toString()}
                    onChange={(e) => setEdits({ ...edits, [s.id]: e.target.value })}
                  />
                  <span className="text-sm text-gray-500">%</span>
                  {edits[s.id] !== undefined && edits[s.id] !== s.percentage.toString() && (
                    <Button size="sm" loading={updatePenalty.isPending} onClick={() => handleSave(s.id)}>
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
