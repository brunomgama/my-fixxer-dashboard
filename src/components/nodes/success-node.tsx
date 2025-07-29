import { Handle, Position } from "reactflow";
import { CheckCircle2 } from "lucide-react";

export function SuccessNode({ data }: any) {
  return (
    <div className="flex items-center border rounded-md bg-green-400 w-48 shadow-sm">
      {/* Icon section */}
      <div className="flex items-center justify-center w-10 border-r">
        <CheckCircle2 className="h-5 w-5 text-white" />
      </div>

      {/* Text section */}
      <div className="flex flex-col flex-1 px-2 py-1">
        <span className="text-xs text-white">Success state</span>
        <span className="text-sm text-white font-semibold">{data.label || "Success"}</span>
      </div>

      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-700" />
    </div>
  );
}
