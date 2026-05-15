'use client';

import { Handle, Position } from '@xyflow/react';

export function FlowHandles() {
  return (
    <>
      <Handle id="top" className="opacity-0" type="target" position={Position.Top} />
      <Handle id="bottom" className="opacity-0" type="source" position={Position.Bottom} />
      <Handle id="left-source" className="opacity-0" type="source" position={Position.Left} />
      <Handle id="left-target" className="opacity-0" type="target" position={Position.Left} />
      <Handle id="right-source" className="opacity-0" type="source" position={Position.Right} />
      <Handle id="right-target" className="opacity-0" type="target" position={Position.Right} />
    </>
  );
}
