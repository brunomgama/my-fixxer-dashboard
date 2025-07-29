import { Handle, Position } from "reactflow";
import { XCircle } from "lucide-react";

export function FailureNode({ data }: any) {
  return (
    <div className="flex items-center border rounded-md bg-red-400 w-48 shadow-sm">
      {/* Icon section */}
      <div className="flex items-center justify-center w-10 border-r">
        <XCircle className="h-5 w-5 text-white" />
      </div>

      {/* Text section */}
      <div className="flex flex-col flex-1 px-2 py-1">
        <span className="text-xs text-white">Failure state</span>
        <span className="text-sm text-white font-semibold">{data.label || "Failure"}</span>
      </div>

      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-700" />
    </div>
  );
}
