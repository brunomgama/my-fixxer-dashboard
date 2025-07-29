import { Handle, Position } from "reactflow";
import { Split } from "lucide-react";

export function ChoiceNode({ data }: any) {
  return (
    <div className="flex items-center border rounded-md bg-white w-48 shadow-sm">
      {/* Icon section */}
      <div className="flex items-center justify-center w-10 border-r">
        <Split className="h-5 w-5 text-blue-500" />
      </div>

      {/* Text section */}
      <div className="flex flex-col flex-1 px-2 py-1">
        <span className="text-xs text-gray-500">Choice state</span>
        <span className="text-sm font-semibold">{data.label || "Choice"}</span>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ background: "#555" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  );
}
