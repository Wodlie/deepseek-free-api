/**
 * MCP (Model Context Protocol) type definitions
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * OpenAI Function Calling format
 */
export interface OpenAIFunction {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * Union type for tools that supports both MCP and OpenAI formats
 */
export type ToolInput = MCPTool | OpenAIFunction;

export interface MCPToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface MCPToolResult {
  tool_call_id: string;
  content: string;
  error?: string;
}

export interface MCPContext {
  tools?: MCPTool[];
  toolResults?: MCPToolResult[];
}

export interface MCPMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: MCPToolCall[];
  tool_call_id?: string;
}