import React, { useState, useEffect } from "react";
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Loader2, AlertCircle, BrainCircuit, Bot, Code2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type ProcessInfo } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnifiedEngineStatusProps {
  className?: string;
  compact?: boolean;
}

interface EngineStatus {
  type: 'claude' | 'codex' | 'gemini';
  count: number;
  label: string;
  icon: React.ElementType;
  color: string;
}

export const UnifiedEngineStatus: React.FC<UnifiedEngineStatusProps> = ({
  className,
  compact = false,
}) => {
  const [claudeCount, setClaudeCount] = useState(0);
  const [codexCount, setCodexCount] = useState(0);
  const [geminiCount, setGeminiCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load status function
  const loadStatus = async () => {
    try {
      // Load Claude sessions
      const claudeSessions = await api.listRunningClaudeSessions();
      setClaudeCount(claudeSessions.length);

      // For now, we'll use placeholder logic for Codex/Gemini running status
      // Since we don't have explicit "listRunningCodexSessions" yet, 
      // we can assume 0 or implement similar logic if backend supports it.
      // If backend adds support later, we update this.
      // Current architecture might not track them as "running processes" in the same registry.
      // But let's prepare the UI structure.
      
      setCodexCount(0); 
      setGeminiCount(0);

    } catch (err) {
      console.error("Failed to load engine status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for state changes
  useEffect(() => {
    let unlistenFn: UnlistenFn | null = null;

    const setupListener = async () => {
      await loadStatus();
      unlistenFn = await listen<any>('claude-session-state', async () => {
        await loadStatus();
      });
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  const engines: EngineStatus[] = [
    { type: 'claude', count: claudeCount, label: 'Claude Code', icon: Bot, color: 'text-orange-500' },
    { type: 'codex', count: codexCount, label: 'OpenAI Codex', icon: Code2, color: 'text-blue-500' },
    { type: 'gemini', count: geminiCount, label: 'Google Gemini', icon: Sparkles, color: 'text-purple-500' },
  ];

  const activeEngines = engines.filter(e => e.count > 0);
  const totalActive = activeEngines.reduce((acc, curr) => acc + curr.count, 0);

  if (loading) {
    return (
      <div className={cn("flex justify-center py-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  if (totalActive === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground/50 text-xs select-none px-2 py-1", className)}>
        <BrainCircuit className="h-3.5 w-3.5" />
        {!compact && <span>无运行任务</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {compact ? (
        // Compact view (collapsed sidebar)
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 relative group cursor-help">
                <div className="relative">
                  <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 text-[8px] text-white font-bold">
                    {totalActive}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="p-3 min-w-[160px]">
              <div className="space-y-2">
                <p className="text-xs font-semibold border-b pb-1">运行中的任务</p>
                {activeEngines.map((engine) => (
                  <div key={engine.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <engine.icon className={cn("h-3.5 w-3.5", engine.color)} />
                      <span>{engine.label}</span>
                    </div>
                    <span className="font-mono bg-muted px-1.5 rounded text-[10px]">
                      {engine.count}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        // Expanded view
        <div className="space-y-2 px-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">运行状态</span>
            <span className="bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded text-[10px]">
              {totalActive} 活跃
            </span>
          </div>
          
          <div className="grid gap-1.5">
            {activeEngines.map((engine) => (
              <div 
                key={engine.type} 
                className="flex items-center justify-between bg-muted/30 hover:bg-muted/50 rounded px-2 py-1.5 transition-colors border border-transparent hover:border-border/50"
              >
                <div className="flex items-center gap-2">
                  <engine.icon className={cn("h-3.5 w-3.5", engine.color)} />
                  <span className="text-xs">{engine.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono">{engine.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
