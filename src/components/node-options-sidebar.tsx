"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Node } from "reactflow"
import React from "react"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

type NodeOptionsSidebarProps = {
  selectedNode: Node
  selectedNodeId: string | null
  inputNodes: string[]
  outputNodes: string[]
  handleUpdateNodeName: (newName: string) => void
  handleUpdateNodeJson: (json: string) => void
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  allNodes: Node[]
  handleConnectNodes: (sourceLabel: string, targetId: string) => void
}


export function NodeOptionsSidebar({selectedNode, selectedNodeId, inputNodes, outputNodes, handleUpdateNodeName, handleUpdateNodeJson, setNodes, allNodes, handleConnectNodes}
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

      {selectedNode.data?.nodeType === "wait" && (() => {
        let waitType: "seconds" | "timestamp" | undefined;
        let parsed: any = {};

        try {
          parsed = JSON.parse(selectedNode.data?.inputJson || "{}");
          if ("seconds" in parsed) waitType = "seconds";
          if ("timestamp" in parsed) waitType = "timestamp";
        } catch {
          waitType = undefined;
        }

        return (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Wait Type</label>
              <RadioGroup
                value={waitType}
                onValueChange={(value) => {
                  if (value === "seconds") {
                    handleUpdateNodeJson(JSON.stringify({ seconds: 0 }));
                  } else if (value === "timestamp") {
                    handleUpdateNodeJson(JSON.stringify({ timestamp: "" }));
                  }
                }}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem className="bg-white" value="seconds" id="wait-seconds" />
                  <label htmlFor="wait-seconds" className="text-sm">Seconds</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem className="bg-white" value="timestamp" id="wait-timestamp" />
                  <label htmlFor="wait-timestamp" className="text-sm">Timestamp</label>
                </div>
              </RadioGroup>
            </div>

            {waitType === "seconds" && (
              <div>
                <label className="text-sm font-medium">Wait Time (seconds)</label>
                <Input
                  type="number"
                  className="bg-white mt-1"
                  value={parsed.seconds ?? ""}
                  onChange={(e) => {
                    const seconds = parseInt(e.target.value, 10);
                    const json = JSON.stringify({ seconds: isNaN(seconds) ? 0 : seconds });
                    handleUpdateNodeJson(json);
                  }}
                />
              </div>
            )}

            {waitType === "timestamp" && (
              <div>
                <label className="text-sm font-medium">Timestamp (ISO)</label>
                <Input
                  type="datetime-local"
                  className="bg-white mt-1"
                  value={parsed.timestamp?.slice(0, 16) || ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const iso = new Date(raw).toISOString(); 
                    handleUpdateNodeJson(JSON.stringify({ timestamp: iso }));
                  }}
                />
              </div>
            )}
          </div>
        );
      })()}

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
        <p className="text-base font-medium mb-1">Input from:</p>
          {allNodes?.length > 1 ? (
          <Select
            onValueChange={(value) => {
              if (selectedNodeId) {
                handleConnectNodes(value, selectedNodeId);
              }
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={inputNodes.join(", ") || "None"} />
            </SelectTrigger>
            <SelectContent>
              {allNodes
                .filter((n) => n.id !== selectedNodeId)
                .map((node) => (
                  <SelectItem key={node.id} value={node.data.label}>
                    {node.data.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>        
        ) : (
          <p className="text-sm text-muted-foreground">Start node available</p>
        )}
      </div>

      {selectedNode.data?.nodeType !== "success" && selectedNode.data?.nodeType !== "failure" && (
        <>
          {/* Output Nodes */}
          <div>
            <p className="text-base font-medium mb-1">Outputs to:</p>
            <Select
              onValueChange={(value) => {
                if (selectedNodeId) {
                  handleConnectNodes(selectedNodeId, value);
                }
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={outputNodes.join(", ") || "None"} />
              </SelectTrigger>
              <SelectContent>
                {allNodes
                  .filter(
                    (n) =>
                      n.id !== selectedNodeId &&
                      n.data?.nodeType !== "start"
                  )
                  .map((node) => (
                    <SelectItem key={node.id} value={node.data.label}>
                      {node.data.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </aside>
  )
}
