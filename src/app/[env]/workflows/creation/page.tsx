"use client"

import { useState, useCallback, useRef } from "react"
import ReactFlow, {
  addEdge, Background, Controls, useNodesState,
  useEdgesState, Connection, Edge,
  Node, useReactFlow, ReactFlowProvider} from "reactflow"
import "reactflow/dist/style.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useEnvironment } from "@/lib/context/environment"
import { WorkflowApi } from "@/lib/api/workflow"
import { toast } from "sonner"
import { CheckCircle2, Code, PlayCircle, Split, SquareStack, XCircle } from "lucide-react"
import { ChoiceNode } from "@/components/nodes/choice-node"
import { ParallelNode } from "@/components/nodes/parallel-node"
import { Textarea } from "@/components/ui/textarea"
import { StartNode } from "@/components/nodes/start-node"
import { PassNode } from "@/components/nodes/pass-node"
import { TaskNode } from "@/components/nodes/task-node"
import { SuccessNode } from "@/components/nodes/success-node"
import { FailureNode } from "@/components/nodes/failure-node"
import { WorkflowSidebar } from "@/components/workflow-sidebar"
import { NodeOptionsSidebar } from "@/components/node-options-sidebar"

export default function CreateWorkflowPageWrapper() {
  return (
    <ReactFlowProvider>
      <CreateWorkflowPage />
    </ReactFlowProvider>
  )
}

const nodeTypes = {
  start: StartNode,
  choice: ChoiceNode,
  parallel: ParallelNode,
  pass: PassNode,
  task: TaskNode,
  success: SuccessNode,
  failure: FailureNode,
};

function CreateWorkflowPage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const api = new WorkflowApi(env)

  const { project } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Initial node has nodeType and JSON field
  const initialNodes: Node[] = [
    {
      id: "1",
      type: "start",
      data: { label: "Start", nodeType: "start", inputJson: "{}" },
      position: { x: 250, y: 0 },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [])

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow")
      if (!type || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const headerHeight = 64

      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top - headerHeight,
      })

      const newNode: Node = {
        id: `${nodes.length + 1}`,
        type:
          type === "Choice" ? "choice"
          : type === "Parallel" ? "parallel"
          : type === "Pass" ? "pass"
          : type === "Task" ? "task"
          : type === "Success" ? "success"
          : type === "Failure" ? "failure"
          : "default",
        position,
        data: {
          label: `${type}`,
          nodeType: type.toLowerCase(),
          inputJson: "{}",
          override: false,
          rules: [
            { condition: "$.default", nextStep: "", comment: "" },
          ],
        },
      };
      
      setNodes((nds) => nds.concat(newNode))
    },
    [nodes, setNodes, project]
  )

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }

  const handlePaneClick = () => {
    setSelectedNodeId(null)
  }

  // Update node label
  const handleUpdateNodeName = (newName: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeId ? { ...node, data: { ...node.data, label: newName } } : node
      )
    )
  }

  // Update JSON for Start nodes
  const handleUpdateNodeJson = (json: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeId ? { ...node, data: { ...node.data, inputJson: json } } : node
      )
    )
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const inputNodes = edges
    .filter((edge) => edge.target === selectedNodeId)
    .map((edge) => nodes.find((n) => n.id === edge.source)?.data.label || edge.source)

  const outputNodes = edges
    .filter((edge) => edge.source === selectedNodeId)
    .map((edge) => nodes.find((n) => n.id === edge.target)?.data.label || edge.target)

    const styledNodes = nodes.map((node) => ({
      ...node,
      style: node.type === "start"
        ? {}
        : {
            ...node.style,
            border: node.id === selectedNodeId ? "1px solid red" : "1px solid #ccc",
            borderRadius: "10px",
            padding: "4px",
            backgroundColor: "white",
          },
    }));
    

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Left Sidebar for Node Types */}
      <WorkflowSidebar onDragStart={onDragStart} />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col relative z-0" ref={reactFlowWrapper}>
        <div className="flex justify-end p-4 border-b">
          <Button onClick={() => toast.success("Workflow saved!")}>Save Workflow</Button>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            nodeTypes={nodeTypes}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>

      {/* Right Sidebar - Node Properties */}
      {selectedNode && (
        <NodeOptionsSidebar
          selectedNode={selectedNode}
          selectedNodeId={selectedNodeId}
          inputNodes={inputNodes}
          outputNodes={outputNodes}
          handleUpdateNodeName={handleUpdateNodeName}
          handleUpdateNodeJson={handleUpdateNodeJson}
          setNodes={setNodes}
        />
      )}

    </div>
  )
}
