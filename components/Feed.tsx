"use client"

import { PostCard } from "./PostCard"
import { Post, Channel } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface FeedProps {
  posts: Post[]
  channels: Channel[]
  isLoading: boolean
  searchQuery?: string
}

export function Feed({ posts, channels, isLoading, searchQuery }: FeedProps) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-slate-100 p-4">
          <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-900">No posts found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery ? "Try adjusting your search query." : "Add a channel to start seeing posts."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      {posts.map((post) => {
        const channel = channels.find((c) => c.id === post.channelId)
        return <PostCard key={post.id} post={post} channel={channel} />
      })}
    </div>
  )
}
