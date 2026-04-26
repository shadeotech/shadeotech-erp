import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Consultation – Shadeotech',
  description: 'Schedule a window covering consultation with a Shadeotech expert.',
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {children}
    </div>
  )
}
