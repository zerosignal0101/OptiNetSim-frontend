// 右键菜单请求
export interface ContextMenuRequest {
  menu_type: string
  position: [number, number]
  world_position: [number, number]
  target_element_id: string | null
  selected_elements: string[]
}

// 节点移动批次数据
export interface NodeMovementBatch {
  timestamp: number
  moved_nodes: NodeMoveData[]
}

export interface NodeMoveData {
  node_id: string
  old_position: Position
  new_position: Position
}

// 位置坐标
export interface Position {
  x: number
  y: number
}
