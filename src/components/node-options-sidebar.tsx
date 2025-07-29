"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Node } from "reactflow"
import React from "react"

type NodeOptionsSidebarProps = {
  selectedNode: Node
  selectedNodeId: string | null
  inputNodes: string[]
  outputNodes: string[]
  handleUpdateNodeName: (newName: string) => void
  handleUpdateNodeJson: (json: string) => void
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
}

export function NodeOptionsSidebar({selectedNode, selectedNodeId, inputNodes, outputNodes, handleUpdateNodeName, handleUpdateNodeJson, setNodes}
  : NodeOptionsSidebarProps) {
  return (
    <aside
      className="absolute right-0 top-1/2 -translate-y-1/2 h-2/3 w-64 border-l shadow-lg p-4 flex flex-col gap-4 mr-4 rounded-md bg-muted"
      style={{
        boxShadow:
          "rgba(0, 0, 0, 0.1) -4px 0px 6px 0px, rgba(0, 0, 0, 0.1) 4px 0px 6px 0px",
      }}
    >
      <h2 className="text-lg font-semibold">Node Properties</h2>

      {/* Node Name */}
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          className="bg-white"
          value={selectedNode.data?.label || ""}
          onChange={(e) => handleUpdateNodeName(e.target.value)}
        />
      </div>

      {/* Input JSON */}
      {["start", "choice", "task", "parallel"].includes(selectedNode.data?.nodeType) && (
        <div>
          <label className="text-sm font-medium">Input JSON</label>
          <Textarea
            className="h-64 text-xs resize-none bg-white"
            value={selectedNode.data?.inputJson || ""}
            onChange={(e) => handleUpdateNodeJson(e.target.value)}
          />
        </div>
      )}

      {/* Pass Node Fields */}
      {selectedNode.data?.nodeType === "pass" && (
        <>
          <div>
            <label className="text-sm font-medium">Input JSON</label>
            <Textarea
              className="h-32 text-xs resize-none bg-white"
              value={selectedNode.data?.inputJson || ""}
              onChange={(e) => handleUpdateNodeJson(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={selectedNode.data?.override || false}
              onChange={(e) =>
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === selectedNodeId
                      ? { ...node, data: { ...node.data, override: e.target.checked } }
                      : node
                  )
                )
              }
            />
            Override
          </label>
        </>
      )}

      {/* Input Nodes */}
      <div>
        <p className="text-sm font-medium">Input from:</p>
        <ul className="text-xs text-gray-600 list-disc pl-4">
          {inputNodes.length > 0 ? (
            inputNodes.map((name) => <li key={name}>{name}</li>)
          ) : (
            <li>None</li>
          )}
        </ul>
      </div>

      {/* Output Nodes */}
      <div>
        <p className="text-sm font-medium">Outputs to:</p>
        <ul className="text-xs text-gray-600 list-disc pl-4">
          {outputNodes.length > 0 ? (
            outputNodes.map((name) => <li key={name}>{name}</li>)
          ) : (
            <li>None</li>
          )}
        </ul>
      </div>
    </aside>
  )
}
