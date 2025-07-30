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
import { ChoiceNode } from "@/components/nodes/choice-node"
import { ParallelNode } from "@/components/nodes/parallel-node"
import { StartNode } from "@/components/nodes/start-node"
import { PassNode } from "@/components/nodes/pass-node"
import { TaskNode } from "@/components/nodes/task-node"
import { SuccessNode } from "@/components/nodes/success-node"
import { FailureNode } from "@/components/nodes/failure-node"
import { WorkflowSidebar } from "@/components/workflow-sidebar"
import { NodeOptionsSidebar } from "@/components/node-options-sidebar"
import { WaitNode } from "@/components/nodes/wait-node"

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
  wait: WaitNode,
};

function CreateWorkflowPage() {
  const { env } = useEnvironment()
  const router = useRouter()
  const api = new WorkflowApi(env)

  const { project } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const initialNodes: Node[] = [
    {
      id: "1",
      type: "start",
      data: { label: "Start", nodeType: "start", inputJson: "{}" },
      position: { x: 900, y: 150 },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState("")

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
          : type === "Wait" ? "wait"
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

  const handleUpdateNodeJson = (json: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNodeId ? { ...node, data: { ...node.data, inputJson: json } } : node
      )
    )
  }

  const handleConnectNodes = (sourceLabel: string, targetId: string) => {
    const sourceNode = nodes.find((n) => n.data.label === sourceLabel);
    if (!sourceNode) return;
  
    const newEdge: Edge = {
      id: `e${sourceNode.id}-${targetId}`,
      source: sourceNode.id,
      target: targetId,
    };
  
    setEdges((eds) => addEdge(newEdge, eds));
  };
  

  const buildStepsFromFlow = () => {
    return nodes
      .filter((node) => node.type !== "start")
      .map((node) => {
        const { label, nodeType, inputJson } = node.data;
        const outgoing = edges.find((e) => e.source === node.id);
  
        const typeMapping: Record<string, string> = {
          task: "Task",
          pass: "Pass",
          choice: "Choice",
          parallel: "Parallel",
          success: "Success",
          wait: "Wait",
          failure: "Fail",
        };
  
        const step: any = {
          name: label,
          action: typeMapping[nodeType] || "Task",
        };
  
        if (nodeType === "task") {
          try {
            const parsedInput = JSON.parse(inputJson || "{}");
  
            if (parsedInput.resource) {
              step.resource = parsedInput.resource;
              const { resource, ...parameters } = parsedInput;
              step.parameters = parameters;
            } else {
              console.warn(`⚠️ Missing 'resource' in task node "${label}"`);
            }
          } catch (err) {
            console.warn(`❌ Invalid JSON for task node "${label}":`, err);
          }
        }

        if (nodeType === "choice") {
          try {
            const parsedChoices = JSON.parse(inputJson || "[]");
            if (Array.isArray(parsedChoices)) {
              step.choices = parsedChoices;
            } else {
              console.warn(`⚠️ Choice node "${label}" JSON must be an array`);
            }
        
            const outgoingTargets = edges
              .filter((e) => e.source === node.id)
              .map((e) => nodes.find((n) => n.id === e.target)?.data.label)
              .filter(Boolean);
        
            if (outgoingTargets.length > 0) {
              step.default = outgoingTargets[0];
            }
          } catch (err) {
            console.warn(`❌ Invalid input JSON for choice node "${label}":`, err);
          }
        }

        if (nodeType === "parallel") {
          try {
            const parsedBranches = JSON.parse(inputJson || "[]");
            if (Array.isArray(parsedBranches)) {
              step.branches = parsedBranches;
            } else {
              console.warn(`⚠️ Parallel node "${label}" input must be an array`);
            }
          } catch (err) {
            console.warn(`❌ Invalid input JSON for parallel node "${label}":`, err);
          }
        }

        if (nodeType === "wait") {
          try {
            const parsed = JSON.parse(inputJson || "{}");
            if (typeof parsed.seconds === "number") {
              step.seconds = parsed.seconds;
            } else if (typeof parsed.timestamp === "string") {
              step.timestamp = parsed.timestamp;
            } else {
              console.warn(`⚠️ Wait node "${label}" is missing valid 'seconds' or 'timestamp'`);
            }
          } catch (err) {
            console.warn(`❌ Invalid input JSON for wait node "${label}":`, err);
          }
        }
        
        const isTerminal = nodeType === "success" || nodeType === "failure";
  
        return isTerminal || !outgoing
          ? step
          : {
              ...step,
              next: nodes.find((n) => n.id === outgoing.target)?.data.label,
            };
      });
  };  

  const handleSave = async () => {
    try {
      const steps = buildStepsFromFlow()
      const inputNode = nodes.find((n) => n.type === "start")
      const inputJson = inputNode?.data.inputJson || "{}"
  
      const payload = {
        name: workflowName,
        version: 1,
        active: true,
        steps,
        input: JSON.parse(inputJson),
        createdBy: "test@fixxer.eu",
      }

      console.log("🚀 Submitting workflow payload:", JSON.stringify(payload, null, 2));
  
      await api.create(payload)
  
      toast.success("Workflow created successfully")
      router.push(`/${env}/workflows`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to save workflow")
    }
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
        <div className="flex justify-between items-center gap-4 pb-4 border-b bg-background">
        {/* Workflow name input */}
        <div className="flex items-center gap-2">
          <label htmlFor="workflow-name" className="text-sm font-medium">
            Workflow Name:
          </label>
          <Input
            id="workflow-name"
            placeholder="Enter workflow name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-[300px]"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!workflowName.trim()}>
            Save Workflow
          </Button>
        </div>
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
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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
          allNodes={nodes}
          handleConnectNodes={handleConnectNodes}
        />
      )}

    </div>
  )
}
