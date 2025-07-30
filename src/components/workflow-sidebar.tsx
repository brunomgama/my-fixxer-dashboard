"use client"

import { PlayCircle, Split, SquareStack, Code, CheckCircle2, XCircle, ClockFading } from "lucide-react"
import React from "react"

type SidebarProps = {
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}

export function WorkflowSidebar({ onDragStart }: SidebarProps) {
  const nodes = [
    { label: "Pass", icon: PlayCircle, color: "bg-blue-500", hover: "hover:bg-blue-600" },
    { label: "Wait", icon: ClockFading, color: "bg-yellow-500", hover: "hover:bg-yellow-600" },
    { label: "Choice", icon: Split, color: "bg-green-500", hover: "hover:bg-green-600" },
    // { label: "Parallel", icon: SquareStack, color: "bg-purple-500", hover: "hover:bg-purple-600" },
    { label: "Task", icon: Code, color: "bg-orange-500", hover: "hover:bg-orange-600" },
    { label: "Success", icon: CheckCircle2, color: "bg-emerald-500", hover: "hover:bg-emerald-600" },
    { label: "Failure", icon: XCircle, color: "bg-red-500", hover: "hover:bg-red-600" },
  ]

  return (
    <aside className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-2/3 border bg-muted rounded-md shadow flex flex-col items-center justify-center space-y-6 z-50">
      {nodes.map(({ label, icon: Icon, color, hover }) => (
        <div key={label} className="flex flex-col items-center">
          <div
            draggable
            onDragStart={(e) => onDragStart(e, label)}
            className={`flex items-center justify-center w-10 h-10 rounded-full ${color} text-white cursor-move ${hover} transition`}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1 text-center text-muted-foreground">{label}</span>
        </div>
      ))}
    </aside>
  )
}
