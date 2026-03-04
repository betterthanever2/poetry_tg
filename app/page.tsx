"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Feed } from "@/components/Feed"
import { Channel, Post } from "@/lib/types"
import { motion } from "motion/react"
import { LoginDialog } from "@/components/LoginDialog"

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [isLoadingChannels, setIsLoadingChannels] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      setIsAdmin(data.authenticated)
    } catch (error) {
      console.error("Failed to check auth:", error)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAdmin(false)
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const fetchChannels = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/channels", { signal })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        setChannels(data)
      } else {
        console.error("Failed to fetch channels:", data.error)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error("Failed to fetch channels:", error)
    } finally {
      setIsLoadingChannels(false)
    }
  }, [])

  const fetchPosts = useCallback(async (channelId: string | null, query: string = "", signal?: AbortSignal) => {
    try {
      let url = "/api/posts"
      if (query) {
        url = `/api/search?q=${encodeURIComponent(query)}`
      } else if (channelId) {
        url = `/api/posts?channelId=${channelId}`
      }
      const res = await fetch(url, { signal })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        console.error("Failed to fetch posts:", data.error)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error("Failed to fetch posts:", error)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    checkAuth()
    fetchChannels(controller.signal)
    return () => controller.abort()
  }, [checkAuth, fetchChannels])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingPosts(true)
    fetchPosts(selectedChannelId, searchQuery, controller.signal)
    return () => controller.abort()
  }, [selectedChannelId, searchQuery, fetchPosts])

  // Polling for new posts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(selectedChannelId, searchQuery)
    }, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [selectedChannelId, searchQuery, fetchPosts])

  const handleAddChannel = async (url: string) => {
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Failed to add channel")
    }
    
    await fetchChannels()
    await fetchPosts(selectedChannelId, searchQuery)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSelectedChannelId(null) // Reset channel filter when searching
  }

  return (
    <div className="flex h-screen w-full bg-white font-sans text-slate-900">
      <Sidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(id) => {
          setSelectedChannelId(id)
          setSearchQuery("") // Clear search when selecting a channel
        }}
        onAddChannel={handleAddChannel}
        onSearch={handleSearch}
        isAdmin={isAdmin}
        onToggleAdmin={() => isAdmin ? handleLogout() : setIsLoginOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto bg-slate-50/50 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full"
        >
          {searchQuery && (
            <div className="mx-auto max-w-2xl pt-8 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Search results for &quot;{searchQuery}&quot;
              </h2>
            </div>
          )}
          <Feed posts={posts} channels={channels} isLoading={isLoadingPosts} searchQuery={searchQuery} />
        </motion.div>
      </main>

      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen} 
        onSuccess={() => setIsAdmin(true)} 
      />
    </div>
  )
}
