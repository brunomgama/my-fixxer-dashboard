import { Handle, Position } from "reactflow";

export function StartNode({ data }: any) {
  return (
    <div
      className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 border border-gray-400 text-sm font-medium"
      style={{ boxShadow: "0 0 4px rgba(0,0,0,0.1)" }}
    >
      {data.label || "Start"}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#333" }}
      />
    </div>
  );
}
