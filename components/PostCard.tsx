import { formatDistanceToNow } from "date-fns"
import { Eye, MessageCircle, Share2, Sparkles } from "lucide-react"
import { Post, Channel } from "@/lib/types"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface PostCardProps {
  post: Post
  channel?: Channel
}

export function PostCard({ post, channel }: PostCardProps) {
  return (
    <article className={cn(
      "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
      post.isNew ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200"
    )}>
      {post.isNew && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3 w-3" />
          New
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {channel && (
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-100">
              <Image
                src={channel.avatarUrl}
                alt={channel.name}
                fill
                sizes="40px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div>
            <h3 className="font-medium text-slate-900">
              {channel?.name || "Unknown Channel"}
            </h3>
            <p className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {post.content}
        </p>

        {post.mediaUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <Image
              src={post.mediaUrl}
              alt="Post media"
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-6 border-t border-slate-100 pt-4 text-slate-500">
        <div className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-slate-900">
          <Eye className="h-4 w-4" />
          {post.views.toLocaleString()}
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-slate-900">
          <MessageCircle className="h-4 w-4" />
          Discuss
        </button>
        <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-slate-900">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </article>
  )
}
