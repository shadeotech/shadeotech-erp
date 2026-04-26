'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { GaugeWidget } from '@/components/dashboard/widgets/GaugeWidget'
import { MonthlyTargetWidget } from '@/components/dashboard/widgets/MonthlyTargetWidget'
import { PipelineConversionWidget } from '@/components/dashboard/widgets/PipelineConversionWidget'
import { AverageDealValueWidget } from '@/components/dashboard/widgets/AverageDealValueWidget'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface WidgetData {
  ytdRevenue: number
  annualGoal: number
  monthlyActual: number
  monthlyGoal: number
  avgDealValue: number
  pipeline: { new: number; sent: number; won: number; lost: number; total: number }
}

interface GoalData {
  revenueGoal: number
  quotesGoal: number
  customersGoal: number
}

export default function AnalyticsPage() {
  const { token, user } = useAuthStore()
  const { toast } = useToast()

  const [data, setData] = useState<WidgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalData, setGoalData] = useState<GoalData>({ revenueGoal: 0, quotesGoal: 0, customersGoal: 0 })
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [draftGoal, setDraftGoal] = useState<GoalData>({ revenueGoal: 0, quotesGoal: 0, customersGoal: 0 })

  const isAdmin = user?.role === 'ADMIN'

  const fetchData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [wRes, gRes] = await Promise.all([
        fetch('/api/admin/analytics/widgets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/goals', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (wRes.ok) setData(await wRes.json())
      if (gRes.ok) {
        const gd = await gRes.json()
        setGoalData(gd.goal)
        setDraftGoal(gd.goal)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveGoal = async () => {
    if (!token) return
    setSavingGoal(true)
    try {
      const res = await fetch('/api/admin/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draftGoal),
      })
      if (res.ok) {
        setGoalData(draftGoal)
        setGoalDialogOpen(false)
        await fetchData()
        toast({ title: 'Goals updated' })
      }
    } catch {
      // silently fail
    } finally {
      setSavingGoal(false)
    }
  }

  const pipelineStages = data
    ? [
        { label: 'New', count: data.pipeline.new },
        { label: 'Sent', count: data.pipeline.sent },
        { label: 'Won', count: data.pipeline.won },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sales performance & pipeline overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => { setDraftGoal(goalData); setGoalDialogOpen(true) }} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              Set Goals
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Row 1: Annual Target + Monthly Target */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GaugeWidget
              title="Annual Target"
              actual={data?.ytdRevenue ?? 0}
              target={data?.annualGoal || goalData.revenueGoal * 12 || 100000}
              label="YTD ACTUAL"
            />
            <MonthlyTargetWidget
              title="Monthly Target"
              actual={data?.monthlyActual ?? 0}
              target={data?.monthlyGoal || goalData.revenueGoal || 10000}
            />
          </div>

          {/* Row 2: Pipeline Conversion + Average Deal Value */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PipelineConversionWidget stages={pipelineStages} />
            </div>
            <AverageDealValueWidget
              value={data?.avgDealValue ?? 0}
              ytdDeals={data?.pipeline.won}
            />
          </div>
        </>
      )}

      {/* Set Goals Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Monthly Goals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Revenue Goal ($)</Label>
              <Input
                type="number"
                min={0}
                value={draftGoal.revenueGoal}
                onChange={(e) => setDraftGoal({ ...draftGoal, revenueGoal: Number(e.target.value) })}
                placeholder="e.g. 50000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Quotes Goal</Label>
              <Input
                type="number"
                min={0}
                value={draftGoal.quotesGoal}
                onChange={(e) => setDraftGoal({ ...draftGoal, quotesGoal: Number(e.target.value) })}
                placeholder="e.g. 30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly New Customers Goal</Label>
              <Input
                type="number"
                min={0}
                value={draftGoal.customersGoal}
                onChange={(e) => setDraftGoal({ ...draftGoal, customersGoal: Number(e.target.value) })}
                placeholder="e.g. 20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={savingGoal} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingGoal ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
