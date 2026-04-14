'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

type Child = {
  id: string
  name: string
  photo_url: string | null
  photo_unlocked: boolean
}

export default function MyChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    supabase.from('children').select('id, name, photo_url, photo_unlocked').then(async ({ data }) => {
      const kids = data ?? []
      setChildren(kids)

      const urls: Record<string, string> = {}
      await Promise.all(
        kids.filter(c => c.photo_url).map(async c => {
          const res = await fetch(`/api/photo-url?childId=${c.id}`)
          if (res.ok) {
            const { signedUrl } = await res.json()
            urls[c.id] = signedUrl
          }
        })
      )
      setSignedUrls(urls)
    })
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-900">My Children</h1>
          <Link
            href="/app/profile/new"
            className="bg-[#7C3AED] text-white px-4 py-2 rounded-full text-sm font-semibold"
          >
            + Add Child
          </Link>
        </div>
        <div className="space-y-3">
          {children.map(child => (
            <Link key={child.id} href={`/app/children/${child.id}/edit`}>
              <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {signedUrls[child.id] ? (
                    <Image
                      src={signedUrls[child.id]}
                      alt={child.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-purple-600">{child.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900">{child.name}</p>
                  <p className="text-sm text-stone-500">
                    {child.photo_unlocked ? (child.photo_url ? 'Photo uploaded' : 'Ready to upload photo') : 'No photo yet'}
                  </p>
                </div>
                <span className="text-stone-400 text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/app" className="block text-center text-stone-500 mt-6 text-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
