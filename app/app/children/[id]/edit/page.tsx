'use client'
import { Suspense, useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Child = {
  id: string
  name: string
  photo_url: string | null
  photo_unlocked: boolean
}

function EditChildContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [child, setChild] = useState<Child | null>(null)
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null)
  const [gateSent, setGateSent] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [describing, setDescribing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const justUnlocked = searchParams.get('photo_unlocked') === '1'

  useEffect(() => {
    supabase
      .from('children')
      .select('id, name, photo_url, photo_unlocked')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        setChild(data)
        if (data?.photo_url) {
          const res = await fetch(`/api/photo-url?childId=${data.id}`)
          if (res.ok) {
            const { signedUrl } = await res.json()
            setSignedPhotoUrl(signedUrl)
          }
        }
      })
  }, [id])

  async function sendEmailGate() {
    const res = await fetch('/api/email-gate/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: id }),
    })
    if (res.ok) {
      setGateSent(true)
    }
    // If it fails, gateSent stays false and the button remains visible for retry
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)
    const form = new FormData()
    form.append('photo', file)
    form.append('childId', id)
    const res = await fetch('/api/upload-photo', { method: 'POST', body: form })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setUploadError(body.error ?? 'Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { photoUrl } = await res.json()
    setSignedPhotoUrl(photoUrl)
    setChild(c => c ? { ...c, photo_url: `${id}/photo.jpeg` } : c)
    setUploading(false)

    setDescribing(true)
    await fetch('/api/describe-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: id }),
    })
    setDescribing(false)
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  const isUnlocked = child.photo_unlocked || justUnlocked

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">{child.name}</h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-stone-800 mb-4">Story Photo</h2>
          <p className="text-stone-500 text-sm mb-4">
            {child.name}&apos;s photo lets them star as the hero in every illustration.
          </p>

          {signedPhotoUrl && (
            <div className="mb-4 flex justify-center">
              <Image
                src={signedPhotoUrl}
                alt={child.name}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
          )}

          {!isUnlocked && !gateSent && (
            <>
              <div className="bg-purple-50 rounded-xl p-4 mb-4 text-sm text-purple-800">
                A parent confirmation is required before uploading a child&apos;s photo. We&apos;ll send a secure link to your email.
              </div>
              <button
                onClick={sendEmailGate}
                className="w-full bg-[#7C3AED] text-white py-3 rounded-2xl font-semibold"
              >
                Send Confirmation Link
              </button>
            </>
          )}

          {!isUnlocked && gateSent && (
            <div className="text-center py-6">
              <p className="text-stone-600 text-sm">
                Check your email and click the confirmation link to unlock photo upload.
              </p>
            </div>
          )}

          {isUnlocked && (
            <>
              {(uploading || describing) && (
                <p className="text-stone-500 text-sm text-center mb-3">
                  {uploading ? 'Uploading photo...' : 'Analyzing appearance...'}
                </p>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || describing}
                className="w-full border-2 border-dashed border-purple-300 rounded-2xl py-5 text-purple-600 font-medium hover:border-purple-500 transition-colors disabled:opacity-50"
              >
                {child.photo_url ? '↑ Change Photo' : '+ Upload Photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {uploadError && (
                <p className="text-red-600 text-sm mt-2 text-center">{uploadError}</p>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => router.push('/app/children')}
          className="block text-center text-stone-500 text-sm w-full"
        >
          ← Back to My Children
        </button>
      </div>
    </div>
  )
}

export default function EditChildPage() {
  return (
    <Suspense>
      <EditChildContent />
    </Suspense>
  )
}
