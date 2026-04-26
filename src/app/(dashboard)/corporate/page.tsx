'use client'

import Image from 'next/image'

export default function CorporatePage() {
  return (
    <div className="-m-6 h-[calc(100vh-72px)] relative overflow-hidden rounded-2xl">
      <Image
        src="/images/corporate%202.webp"
        alt="Corporate overview 2"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
    </div>
  )
}


