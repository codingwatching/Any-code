/**
 * Task Management Widgets - Claude Code 任务管理工具
 *
 * 核心组件：TaskListAggregateWidget
 * 从同一消息中的多个 TaskCreate/TaskUpdate 工具调用
 * 聚合重建完整的任务列表状态，渲染为统一的任务面板
 *
 * 数据流：
 * - TaskCreate input: { subject, description, activeForm }
 *   result.content: "Task #1 created successfully: ..."
 *   result.sourceMessage.toolUseResult: { task: { id: "1", subject: "..." } }
 *
 * - TaskUpdate input: { taskId: "1", status: "completed" }
 *   result.content: "Updated task #1 status to completed"
 *
 * taskId 来源优先级：
 * 1. result.sourceMessage.toolUseResult.task.id
 * 2. result.content 中的 "Task #N" 正则匹配
 * 3. 按 TaskCreate 出现顺序自增分配
 */

import React from "react";
import { CheckCircle2, Clock, Circle, Trash2, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  in_progress: <Clock className="h-4 w-4 text-info animate-pulse" />,
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  deleted: <Trash2 className="h-4 w-4 text-destructive" />,
};

const statusLabels: Record<string, string> = {
  completed: "已完成",
  in_progress: "进行中",
  pending: "待处理",
  deleted: "已删除",
};

interface TaskItem {
  id: string;
  subject: string;
  status: string;
  description?: string;
}

// 模块级任务状态表，跨消息持久化
const globalTaskStore = new Map<string, TaskItem>();
// 自增 ID 计数器（当无法从 result 获取 taskId 时使用）
let autoIncrementId = 0;

export interface TaskToolCall {
  name: string;
  input: any;
  result?: any;
  id?: string;
}

export interface TaskListAggregateWidgetProps {
  toolCalls: TaskToolCall[];
}

/**
 * 从 result 中提取 taskId
 */
function extractTaskId(result: any): string | null {
  // 1. 从 toolUseResult.task.id
  const fromToolUseResult = result?.sourceMessage?.toolUseResult?.task?.id;
  if (fromToolUseResult) return String(fromToolUseResult);

  // 2. 从 content 字符串 "Task #N"
  if (typeof result?.content === 'string') {
    const match = result.content.match(/Task #(\d+)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * 从 tool_use 和 tool_result 中重建任务列表状态
 */
function buildTaskList(toolCalls: TaskToolCall[]): TaskItem[] {
  const creates = toolCalls.filter(t => /^TaskCreate$/i.test(t.name));
  const updates = toolCalls.filter(t => /^TaskUpdate$/i.test(t.name));

  // 处理 TaskCreate
  for (const tc of creates) {
    const subject = tc.input?.subject || '未命名任务';
    const description = tc.input?.description;

    // 尝试从 result 获取 taskId
    let taskId = extractTaskId(tc.result);

    // 如果没有 result（还在执行中），用自增 ID
    if (!taskId) {
      autoIncrementId++;
      taskId = String(autoIncrementId);
    }

    // 只有当 globalTaskStore 中没有这个 ID 时才写入
    // （避免重复渲染时覆盖已更新的状态）
    if (!globalTaskStore.has(taskId)) {
      globalTaskStore.set(taskId, {
        id: taskId,
        subject,
        status: 'pending',
        description,
      });
    }
  }

  // 处理 TaskUpdate
  for (const tc of updates) {
    const taskId = tc.input?.taskId ? String(tc.input.taskId) : '';
    const newStatus = tc.input?.status;
    const newSubject = tc.input?.subject;

    if (taskId) {
      const existing = globalTaskStore.get(taskId);
      if (existing) {
        if (newStatus) existing.status = newStatus;
        if (newSubject) existing.subject = newSubject;
        globalTaskStore.set(taskId, existing);
      } else {
        // 之前的消息中创建的任务，但 globalTaskStore 被清空了
        globalTaskStore.set(taskId, {
          id: taskId,
          subject: newSubject || `任务 #${taskId}`,
          status: newStatus || 'pending',
        });
      }
    }
  }

  return Array.from(globalTaskStore.values())
    .sort((a, b) => Number(a.id) - Number(b.id));
}

export const TaskListAggregateWidget: React.FC<TaskListAggregateWidgetProps> = ({
  toolCalls,
}) => {
  const tasks = React.useMemo(() => buildTaskList(toolCalls), [toolCalls]);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const totalCount = tasks.length;

  if (totalCount === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ListTodo className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">任务列表</span>
        <Badge variant="outline" className="text-xs">
          {completedCount}/{totalCount}
        </Badge>
        {inProgressCount > 0 && (
          <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/20">
            {inProgressCount} 进行中
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-2.5 px-3 py-2 rounded-md border bg-card/50",
              task.status === "completed" && "opacity-60",
              task.status === "deleted" && "opacity-40"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {statusIcons[task.status] || statusIcons.pending}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm leading-snug",
                task.status === "completed" && "line-through text-muted-foreground"
              )}>
                {task.subject}
              </p>
              {task.description && task.status === 'pending' && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {task.description}
                </p>
              )}
            </div>
            <span className={cn(
              "text-xs shrink-0 mt-0.5",
              task.status === "completed" ? "text-success" :
              task.status === "in_progress" ? "text-info" :
              "text-muted-foreground"
            )}>
              {statusLabels[task.status] || task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 单独的 Widget 导出（兼容 toolRegistryInit 注册）
// 实际渲染由 TaskListAggregateWidget 在 ToolCallsGroup 中接管
// ============================================================================

export interface TaskCreateWidgetProps {
  subject?: string; description?: string; activeForm?: string; result?: any;
}
export const TaskCreateWidget: React.FC<TaskCreateWidgetProps> = () => null;

export interface TaskUpdateWidgetProps {
  taskId?: string; status?: string; subject?: string;
  description?: string; activeForm?: string; result?: any;
}
export const TaskUpdateWidget: React.FC<TaskUpdateWidgetProps> = () => null;

export interface TaskListWidgetProps { result?: any; }
export const TaskListWidget: React.FC<TaskListWidgetProps> = () => null;

export interface TaskGetWidgetProps { taskId?: string; result?: any; }
export const TaskGetWidget: React.FC<TaskGetWidgetProps> = () => null;
