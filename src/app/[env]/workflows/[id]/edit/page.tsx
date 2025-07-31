"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import ReactFlow, {
  addEdge, Background, Controls, useNodesState,
  useEdgesState, Connection, Edge,
  Node, useReactFlow, ReactFlowProvider} from "reactflow"
import { WorkflowSidebar } from "@/components/workflow-sidebar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { WorkflowApi } from "@/lib/api/workflow"
import "reactflow/dist/style.css"
import { useEnvironment } from "@/lib/context/environment"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import { PassNode } from "@/components/nodes/pass-node"
import { SuccessNode } from "@/components/nodes/success-node"
import { TaskNode } from "@/components/nodes/task-node"
import { FailureNode } from "@/components/nodes/failure-node"
import { WaitNode } from "@/components/nodes/wait-node"
import { ParallelNode } from "@/components/nodes/parallel-node"
import { ChoiceNode } from "@/components/nodes/choice-node"
import { StartNode } from "@/components/nodes/start-node"
import { NodeOptionsSidebar } from "@/components/node-options-sidebar"

const nodeTypes = {
  start: StartNode,
  choice: ChoiceNode,
  parallel: ParallelNode,
  pass: PassNode,
  task: TaskNode,
  succeed: SuccessNode,
  failure: FailureNode,
  wait: WaitNode,
};

export default function WorkflowEditPageWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowEditPage />
    </ReactFlowProvider>
  )
}

function WorkflowEditPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState("")
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const router = useRouter()
  const { id } = useParams()

  const { project } = useReactFlow()

  const { env } = useEnvironment()
  const api = new WorkflowApi(env)

  const workflowIdStr = Array.isArray(id) ? id[0] : id

  useEffect(() => {
    if (!workflowIdStr || workflow) return;
  
    const fetchWorkflow = async () => {
      try {
        const data = await api.getOne(workflowIdStr);
        setWorkflow(data);
        console.log("Fetched workflow:", data);
  
        const map = await api.getMap(workflowIdStr);
        console.log("Fetched workflow map:", map);
  
        setWorkflowName(data.name || "");
  
        const startNode = {
          id: "start",
          type: "start",
          position: { x: 0, y: 100 },
          data: { label: "Start", nodeType: "start" },
        };
  
        const initialNodes = [
          startNode,
          ...map.steps.map((step: any, index: number) => {
            // Ensure to handle Wait node seconds properly
            const inputJson = step.inputJson || "{}"; // Default empty JSON if undefined
            const parsedInput = JSON.parse(inputJson);
  
            // Special handling for Wait nodes to extract the seconds value
            if (step.action === "Wait" && parsedInput.seconds) {
              parsedInput.seconds = parsedInput.seconds; // Make sure seconds is preserved
            }
  
            return {
              id: `${index + 1}`,
              type: step.action.toLowerCase(),
              position: { x: (index + 1) * 200, y: 100 },
              data: {
                label: step.name,
                nodeType: step.action.toLowerCase(),
                inputJson: JSON.stringify(parsedInput), // Preserve the inputJson with seconds if available
              },
            };
          }),
        ];
  
        console.log("Initial nodes:", initialNodes);
  
        const test = initialNodes.find((node: any) => node.data.label === map.startAt);
  
        const initialEdges: Edge[] = [];
  
        initialEdges.push({
          id: "e-start-1",
          source: "start",
          target: test!.id,
        });
  
        map.steps.forEach((step: any, index: number) => {
          const nextNode = map.steps.find((s: any) => s.name === step.Next);
          if (nextNode) {
            initialEdges.push({
              id: `e${index + 1}-${nextNode.name}`,
              source: `${index + 1}`,
              target: `${map.steps.findIndex((s: any) => s.name === nextNode.name) + 1}`,
            });
          }
        });
  
        setNodes(initialNodes);
        setEdges(initialEdges);
      } catch (err) {
        console.error("Error fetching workflow:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [workflowIdStr, api, workflow]);
  

  const inputNodes = edges
  .filter((edge) => edge.target === selectedNodeId)
  .map((edge) => nodes.find((n) => n.id === edge.source)?.data.label || edge.source)

  const outputNodes = edges
  .filter((edge) => edge.source === selectedNodeId)
  .map((edge) => nodes.find((n) => n.id === edge.target)?.data.label || edge.target)

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

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [])

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }  

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
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
  

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }

  const handlePaneClick = () => {
    setSelectedNodeId(null)
  }

  const handleSave = async () => {
    try {
      const steps = nodes.map((node: any) => {
        const inputJson = node.data.inputJson || "{}"
        return {
          name: node.data.label,
          action: node.data.nodeType,
          parameters: JSON.parse(inputJson),
        }
      })
      
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
            nodes={nodes}
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