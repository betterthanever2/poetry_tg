"use client"

import { useState } from "react"
import { Settings, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAccessibility } from "./AccessibilityProvider"
import { cn } from "@/lib/utils"

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const { fontSize, setFontSize, contrast, setContrast } = useAccessibility()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
          <DialogDescription>
            Customize the appearance of the app to improve readability.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-900">Font Size</h4>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors",
                    fontSize === size
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-900">Contrast</h4>
            <div className="flex gap-2">
              {(['normal', 'high'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setContrast(c)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors",
                    contrast === c
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
