/**
 * Task Management Widgets - Claude Code 任务管理工具
 *
 * 支持 TaskCreate, TaskUpdate, TaskList, TaskGet 工具的渲染
 * 使用模块级 Map 关联 taskId → subject，使 TaskUpdate 能显示任务标题
 */

import React from "react";
import { CheckCircle2, Clock, Circle, Plus, List, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 模块级 taskId → subject 映射表
// TaskCreate 渲染时写入，TaskUpdate 渲染时读取
const taskSubjectMap = new Map<string, string>();

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

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  in_progress: "bg-info/10 text-info border-info/20",
  pending: "bg-muted/10 text-muted-foreground border-muted/20",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
};

// ============================================================================
// TaskCreate Widget
// ============================================================================

export interface TaskCreateWidgetProps {
  subject?: string;
  description?: string;
  activeForm?: string;
  result?: any;
}

export const TaskCreateWidget: React.FC<TaskCreateWidgetProps> = ({
  subject,
  description,
  result,
}) => {
  // 从 result 中提取 taskId 并注册到映射表
  const taskId = result?.sourceMessage?.toolUseResult?.task?.id;
  const resultSubject = result?.sourceMessage?.toolUseResult?.task?.subject;
  const displaySubject = subject || resultSubject || description;

  if (taskId && displaySubject) {
    taskSubjectMap.set(taskId, displaySubject);
  }

  // 也尝试从 result.content 字符串中提取 taskId
  // 格式: "Task #1 created successfully: 更新 Claude 4.6 系列模型..."
  if (!taskId && result?.content && displaySubject) {
    const match = typeof result.content === 'string'
      ? result.content.match(/Task #(\d+)/)
      : null;
    if (match) {
      taskSubjectMap.set(match[1], displaySubject);
    }
  }

  return (
    <div className="flex items-center gap-2 py-0.5">
      <Plus className="h-4 w-4 text-primary" />
      {taskId && (
        <span className="text-xs font-mono text-muted-foreground">#{taskId}</span>
      )}
      {displaySubject ? (
        <span className="text-sm truncate max-w-[400px]">{displaySubject}</span>
      ) : (
        <span className="text-xs text-muted-foreground">新任务</span>
      )}
    </div>
  );
};

// ============================================================================
// TaskUpdate Widget
// ============================================================================

export interface TaskUpdateWidgetProps {
  taskId?: string;
  status?: string;
  subject?: string;
  description?: string;
  activeForm?: string;
  result?: any;
}

export const TaskUpdateWidget: React.FC<TaskUpdateWidgetProps> = ({
  taskId,
  status,
  subject,
  activeForm,
  result,
}) => {
  const displayStatus = status || "pending";

  // 从多个来源尝试获取任务标题
  // 1. input 中的 subject/activeForm
  // 2. toolUseResult 中的信息
  // 3. 从 taskSubjectMap 中查找（由 TaskCreate 注册）
  const toolUseResult = result?.sourceMessage?.toolUseResult;
  const displaySubject = subject
    || activeForm
    || toolUseResult?.subject
    || (taskId ? taskSubjectMap.get(taskId) : undefined);

  return (
    <div className="flex items-center gap-2 py-0.5">
      <div>{statusIcons[displayStatus] || statusIcons.pending}</div>
      {taskId && (
        <span className="text-xs font-mono text-muted-foreground">#{taskId}</span>
      )}
      {displaySubject && (
        <span className="text-sm truncate max-w-[400px]">{displaySubject}</span>
      )}
      <Badge
        variant="outline"
        className={cn("text-xs shrink-0", statusColors[displayStatus])}
      >
        {statusLabels[displayStatus] || displayStatus}
      </Badge>
    </div>
  );
};

// ============================================================================
// TaskList Widget
// ============================================================================

export interface TaskListWidgetProps {
  result?: any;
}

export const TaskListWidget: React.FC<TaskListWidgetProps> = () => {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <List className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">查看任务列表</span>
    </div>
  );
};

// ============================================================================
// TaskGet Widget
// ============================================================================

export interface TaskGetWidgetProps {
  taskId?: string;
  result?: any;
}

export const TaskGetWidget: React.FC<TaskGetWidgetProps> = ({ taskId }) => {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Eye className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">查看任务</span>
      {taskId && (
        <span className="text-xs font-mono text-muted-foreground">#{taskId}</span>
      )}
    </div>
  );
};
