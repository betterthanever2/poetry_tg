"use client"

import { Hash, Users, Globe, Search, LogIn, LogOut } from "lucide-react"
import { Channel } from "@/lib/types"
import { AddChannelDialog } from "./AddChannelDialog"
import { SettingsDialog } from "./SettingsDialog"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"

interface SidebarProps {
  channels: Channel[]
  selectedChannelId: string | null
  onSelectChannel: (id: string | null) => void
  onAddChannel: (url: string) => Promise<void>
  onSearch: (query: string) => void
  isAdmin: boolean
  onToggleAdmin: () => void
}

export function Sidebar({ 
  channels, 
  selectedChannelId, 
  onSelectChannel, 
  onAddChannel,
  onSearch,
  isAdmin,
  onToggleAdmin
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }
  return (
    <div className="flex h-full w-72 flex-col border-r border-slate-200 bg-slate-50/50">
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Telegram Aggregator
          </h2>
          <button 
            onClick={onToggleAdmin}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            title={isAdmin ? "Logout" : "Login as Admin"}
          >
            {isAdmin ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="mb-4 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          />
        </form>

        {isAdmin && <AddChannelDialog onAdd={onAddChannel} />}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          <button
            onClick={() => onSelectChannel(null)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              selectedChannelId === null
                ? "bg-slate-200/50 text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Globe className="h-4 w-4" />
            All Posts
          </button>
        </div>

        <div className="mt-8">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Channels
          </h3>
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  selectedChannelId === channel.id
                    ? "bg-slate-200/50 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <Image
                    src={channel.avatarUrl}
                    alt={channel.name}
                    fill
                    sizes="24px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
            {channels.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-500">No channels added yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <SettingsDialog />
      </div>
    </div>
  )
}
