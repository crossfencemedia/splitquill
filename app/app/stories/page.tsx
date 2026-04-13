import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const PREMISE_LABELS: Record<string, string> = {
  'space-rescue': 'Space Rescue',
  'neighborhood-mystery': 'Neighborhood Mystery',
  'unlikely-friendship': 'Unlikely Friendship',
  'wild-invention': 'Wild Invention',
  'chef-catastrophe': 'Chef Catastrophe',
}

type Story = {
  id: string
  premise_id: string
  status: string
  created_at: string
  panels: Record<string, { text?: string; image_url?: string }> | null
}

export default async function MyStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  // Get all children for this parent
  const { data: children } = await supabase
    .from('children')
    .select('id, name')
    .order('created_at', { ascending: true })

  if (!children || children.length === 0) redirect('/app/profile/new')

  // Active child: from query param or first child
  const childParam = typeof params.child === 'string' ? params.child : undefined
  const activeChild = childParam
    ? children.find(c => c.id === childParam) ?? children[0]
    : children[0]

  const { data: stories } = await supabase
    .from('stories')
    .select('id, premise_id, status, created_at, panels')
    .eq('child_id', activeChild.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-stone-900">My Stories</h1>
          <Link href="/app" className="text-stone-500 text-sm">← Home</Link>
        </div>

        {/* Child selector tabs */}
        {children.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {children.map(child => (
              <Link
                key={child.id}
                href={`/app/stories?child=${child.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  activeChild.id === child.id
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {!stories || stories.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-stone-500 mb-4">No stories yet for {activeChild.name}.</p>
            <Link
              href="/app/pick"
              className="bg-[#7C3AED] text-white px-6 py-3 rounded-full font-semibold inline-block"
            >
              Create First Story
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(stories as Story[]).map(story => {
              const firstPanel = story.panels?.['p1']
              const thumbnail = firstPanel?.image_url ?? null
              const label = PREMISE_LABELS[story.premise_id] ?? story.premise_id
              const date = new Date(story.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })

              return (
                <Link key={story.id} href={`/app/story/${story.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex items-center gap-4 p-3 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-xl bg-purple-100 flex-shrink-0 overflow-hidden">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={label}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          📖
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{label}</p>
                      <p className="text-sm text-stone-500">{date}</p>
                    </div>
                    <span className="text-stone-400 text-lg flex-shrink-0">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
