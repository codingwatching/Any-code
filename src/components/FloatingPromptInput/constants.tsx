import { Zap, Brain, Sparkles, Crown } from "lucide-react";
import { ModelConfig, ThinkingModeConfig } from "./types";

/**
 * Available models
 */
export const MODELS: ModelConfig[] = [
  {
    id: "sonnet",
    name: "Claude Sonnet 4.6",
    description: "Fast and efficient for most coding tasks",
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: "sonnet1m",
    name: "Claude Sonnet 4.6 1M",
    description: "Sonnet with 1 million token context",
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: "opus",
    name: "Claude Opus 4.6",
    description: "Most capable model with advanced reasoning & coding",
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: "opus1m",
    name: "Claude Opus 4.6 1M",
    description: "Opus with 1 million token context",
    icon: <Crown className="h-4 w-4" />
  }
];

/**
 * Thinking modes configuration
 * Claude 4.6 Adaptive Thinking with effort levels
 * Controls thinking depth via CLAUDE_CODE_THINKING_EFFORT env var
 *
 * Note: Names and descriptions are translation keys that will be resolved at runtime
 */
export const THINKING_MODES: ThinkingModeConfig[] = [
  {
    id: "off",
    name: "promptInput.thinkingModeOff",
    description: "promptInput.normalSpeed",
    level: 0,
  },
  {
    id: "adaptive",
    effort: "low",
    name: "promptInput.thinkingEffortLow",
    description: "promptInput.thinkingEffortLowDesc",
    level: 1,
  },
  {
    id: "adaptive",
    effort: "medium",
    name: "promptInput.thinkingEffortMedium",
    description: "promptInput.thinkingEffortMediumDesc",
    level: 2,
  },
  {
    id: "adaptive",
    effort: "high",
    name: "promptInput.thinkingEffortHigh",
    description: "promptInput.thinkingEffortHighDesc",
    level: 3,
  },
  {
    id: "adaptive",
    effort: "max",
    name: "promptInput.thinkingEffortMax",
    description: "promptInput.thinkingEffortMaxDesc",
    level: 4,
  }
];
