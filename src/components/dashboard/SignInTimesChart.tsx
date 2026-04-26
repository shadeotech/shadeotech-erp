'use client'

interface SignInTimesChartProps {
  data: Array<{
    month: string
    value1: number
    value2: number
  }>
}

export function SignInTimesChart({ data }: SignInTimesChartProps) {
  const maxValue = 32
  const chartHeight = 172 // Height minus label space

  return (
    <div className="pt-4">
      <div className="flex gap-3" style={{ height: '192px' }}>
        {/* Y-axis Labels */}
        <div className="flex flex-col justify-between h-full pr-3 text-xs text-gray-400">
          <span>30K</span>
          <span>20K</span>
          <span>10K</span>
          <span>0</span>
        </div>
        
        {/* Bars Container */}
        <div className="flex-1 flex items-end justify-between gap-1 border-l border-gray-200 pl-3 h-full">
          {data.map((item, index) => {
            const barHeight1 = (item.value1 / maxValue) * chartHeight
            const barHeight2 = (item.value2 / maxValue) * chartHeight
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center justify-end h-full relative">
                <div className="flex items-end justify-center gap-0.5 w-full relative" style={{ height: `${chartHeight}px` }}>
                  <div
                    className="bg-blue-300 rounded-t absolute"
                    style={{ 
                      width: '14px',
                      height: `${barHeight1}px`,
                      left: '50%',
                      transform: 'translateX(-60%)',
                      bottom: 0
                    }}
                  />
                  <div
                    className="bg-blue-400 rounded-t absolute"
                    style={{ 
                      width: '14px',
                      height: `${barHeight2}px`,
                      left: '50%',
                      transform: 'translateX(10%)',
                      bottom: 0
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">{item.month}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

