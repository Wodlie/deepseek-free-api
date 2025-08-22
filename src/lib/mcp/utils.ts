import { MCPTool, MCPToolCall, MCPToolResult, MCPContext } from './types.ts';
import logger from '@/lib/logger.ts';

/**
 * Generate MCP tools context for injection into prompts
 */
export function generateMCPContext(tools: MCPTool[]): string {
  if (!tools || tools.length === 0) return '';
  
  const toolsDescription = tools.map(tool => {
    const schema = JSON.stringify(tool.inputSchema, null, 2);
    return `Tool: ${tool.name}
Description: ${tool.description}
Input Schema: ${schema}`;
  }).join('\n\n');

  return `

You have access to the following tools that can be executed by the client. When you need to use a tool, format your response with the tool call in the following JSON format:

<tool_call>
{
  "id": "call_<unique_id>",
  "type": "function", 
  "function": {
    "name": "<tool_name>",
    "arguments": "<json_string_of_arguments>"
  }
}
</tool_call>

Available tools:
${toolsDescription}

When using tools:
1. Always provide a unique ID for each tool call
2. Ensure arguments match the tool's input schema
3. Wait for tool execution results before proceeding
4. You can use multiple tools in sequence if needed

`;
}

/**
 * Parse MCP tool calls from LLM response
 */
export function parseMCPToolCalls(content: string): MCPToolCall[] {
  const toolCalls: MCPToolCall[] = [];
  const toolCallRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  
  let match;
  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const toolCall = JSON.parse(match[1]);
      if (isValidToolCall(toolCall)) {
        toolCalls.push(toolCall);
      } else {
        logger.warn(`Invalid tool call format: ${match[1]}`);
      }
    } catch (error) {
      logger.error(`Failed to parse tool call: ${match[1]}, error: ${error}`);
    }
  }
  
  return toolCalls;
}

/**
 * Validate tool call format
 */
function isValidToolCall(obj: any): obj is MCPToolCall {
  return obj &&
    typeof obj.id === 'string' &&
    obj.type === 'function' &&
    obj.function &&
    typeof obj.function.name === 'string' &&
    typeof obj.function.arguments === 'string';
}

/**
 * Generate MCP tool results context for injection into prompts
 */
export function generateMCPToolResultsContext(toolResults: MCPToolResult[]): string {
  if (!toolResults || toolResults.length === 0) return '';
  
  const resultsDescription = toolResults.map(result => {
    return `Tool Result (ID: ${result.tool_call_id}):
${result.error ? `Error: ${result.error}` : result.content}`;
  }).join('\n\n');

  return `

Previous tool execution results:
${resultsDescription}

Please continue the conversation considering these tool results.

`;
}

/**
 * Remove tool call tags from content for clean display
 */
export function cleanMCPContent(content: string): string {
  return content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim();
}

/**
 * Check if content contains MCP tool calls
 */
export function hasMCPToolCalls(content: string): boolean {
  return /<tool_call>[\s\S]*?<\/tool_call>/.test(content);
}