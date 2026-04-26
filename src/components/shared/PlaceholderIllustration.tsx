'use client'

interface PlaceholderIllustrationProps {
  title: string
  description: string
}

export function PlaceholderIllustration({ title, description }: PlaceholderIllustrationProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="text-gray-500 max-w-md">{description}</p>
      </div>
      <p className="text-sm text-gray-400">Coming Soon</p>
    </div>
  )
}
