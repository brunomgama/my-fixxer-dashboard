import { Handle, Position } from "reactflow";
import { Code } from "lucide-react";

// {
//   "resource": "arn:aws:states:::states:startExecution.sync:2",
//   "StateMachineArn": "arn:aws:iam::323069970350:role/launcher-test-workflow-role-staging-asr",
//   "Input": {
//     "StatePayload": "Hello from Step Functions!",
//     "AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID.$": "$$.Execution.Id"
//   }
// }

export function TaskNode({ data }: any) {
  return (
    <div className="flex items-center border rounded-md bg-white w-48 shadow-sm">
      {/* Icon section */}
      <div className="flex items-center justify-center w-10 border-r">
        <Code className="h-5 w-5 text-blue-500" />
      </div>

      {/* Text section */}
      <div className="flex flex-col flex-1 px-2 py-1">
        <span className="text-xs text-gray-500">Task state</span>
        <span className="text-sm font-semibold">{data.label || "Task"}</span>
      </div>

      {/* Input handle (top) */}
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-700" />

      {/* Output handle (bottom) */}
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-gray-700" />
    </div>
  );
}
