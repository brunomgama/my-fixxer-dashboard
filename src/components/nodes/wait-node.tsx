import { Handle, Position } from "reactflow";
import { ClockFading, Split } from "lucide-react";

export function WaitNode({ data }: any) {
  return (
    <div className="flex items-center border rounded-md bg-white w-48 shadow-sm">
      {/* Icon section */}
      <div className="flex items-center justify-center w-10 border-r">
        <ClockFading className="h-5 w-5 text-blue-500" />
      </div>

      {/* Text section */}
      <div className="flex flex-col flex-1 px-2 py-1">
        <span className="text-xs text-gray-500">Wait state</span>
        <span className="text-sm font-semibold">{data.label || "Wait"}</span>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ background: "#555" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  );
}
