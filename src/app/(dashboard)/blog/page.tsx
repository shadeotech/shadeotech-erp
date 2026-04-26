'use client'

import Image from 'next/image'

export default function BlogPage() {
  return (
    <div className="-m-6 h-[calc(100vh-72px)] relative overflow-hidden rounded-2xl">
      <Image
        src="/images/blog.webp"
        alt="Blog overview"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
    </div>
  )
}


