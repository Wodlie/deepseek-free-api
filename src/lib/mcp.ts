import logger from '@/lib/logger.ts';

// MCP (Model Context Protocol) related types and interfaces
export interface MCPToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface MCPMessage {
  role: string;
  content?: string | any[];
  tool_calls?: MCPToolCall[];
  tool_call_id?: string;
}

export interface MCPToolResult {
  tool_call_id: string;
  content: string;
  error?: string;
}

/**
 * 检测消息中是否包含MCP工具调用
 */
export function hasMCPToolCalls(messages: MCPMessage[]): boolean {
  return messages.some(message => 
    message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0
  );
}

/**
 * 提取所有的工具调用
 */
export function extractToolCalls(messages: MCPMessage[]): MCPToolCall[] {
  const toolCalls: MCPToolCall[] = [];
  for (const message of messages) {
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      toolCalls.push(...message.tool_calls);
    }
  }
  return toolCalls;
}

/**
 * 执行MCP工具调用
 * 这里实现一个基础的工具执行器，可以根据需要扩展
 */
export async function executeMCPToolCall(toolCall: MCPToolCall): Promise<MCPToolResult> {
  logger.info(`Executing MCP tool call: ${toolCall.function.name}`);
  
  try {
    const { name, arguments: args } = toolCall.function;
    let parsedArgs;
    
    try {
      parsedArgs = JSON.parse(args);
    } catch (e) {
      return {
        tool_call_id: toolCall.id,
        content: '',
        error: `Invalid JSON arguments: ${args}`
      };
    }

    // 根据工具名称执行不同的操作
    switch (name) {
      case 'get_weather':
        return await handleWeatherTool(toolCall.id, parsedArgs);
      case 'search_web':
        return await handleWebSearchTool(toolCall.id, parsedArgs);
      case 'calculate':
        return await handleCalculatorTool(toolCall.id, parsedArgs);
      default:
        return {
          tool_call_id: toolCall.id,
          content: '',
          error: `Unknown tool: ${name}`
        };
    }
  } catch (error) {
    logger.error(`Error executing tool call ${toolCall.id}:`, error);
    return {
      tool_call_id: toolCall.id,
      content: '',
      error: `Tool execution failed: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * 天气工具处理器
 */
async function handleWeatherTool(toolCallId: string, args: any): Promise<MCPToolResult> {
  const { location } = args;
  if (!location) {
    return {
      tool_call_id: toolCallId,
      content: '',
      error: 'Missing required parameter: location'
    };
  }

  // 模拟天气查询结果
  const weatherData = {
    location: location,
    temperature: Math.floor(Math.random() * 30) + 10,
    condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 100),
    wind_speed: Math.floor(Math.random() * 20) + 5
  };

  return {
    tool_call_id: toolCallId,
    content: JSON.stringify(weatherData)
  };
}

/**
 * 网络搜索工具处理器
 */
async function handleWebSearchTool(toolCallId: string, args: any): Promise<MCPToolResult> {
  const { query } = args;
  if (!query) {
    return {
      tool_call_id: toolCallId,
      content: '',
      error: 'Missing required parameter: query'
    };
  }

  // 模拟搜索结果
  const searchResults = {
    query: query,
    results: [
      {
        title: `搜索结果：${query}`,
        url: 'https://example.com/1',
        snippet: `这是关于"${query}"的搜索结果摘要。`
      },
      {
        title: `更多关于${query}的信息`,
        url: 'https://example.com/2',
        snippet: `详细信息和相关内容。`
      }
    ]
  };

  return {
    tool_call_id: toolCallId,
    content: JSON.stringify(searchResults)
  };
}

/**
 * 计算器工具处理器
 */
async function handleCalculatorTool(toolCallId: string, args: any): Promise<MCPToolResult> {
  const { expression } = args;
  if (!expression) {
    return {
      tool_call_id: toolCallId,
      content: '',
      error: 'Missing required parameter: expression'
    };
  }

  try {
    // 简单的数学表达式计算（仅支持基础运算）
    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitizedExpression !== expression) {
      throw new Error('Invalid characters in expression');
    }
    
    const result = Function('"use strict"; return (' + sanitizedExpression + ')')();
    
    return {
      tool_call_id: toolCallId,
      content: JSON.stringify({ expression, result })
    };
  } catch (error) {
    return {
      tool_call_id: toolCallId,
      content: '',
      error: `Calculation failed: ${error.message}`
    };
  }
}

/**
 * 处理包含MCP工具调用的消息序列
 * 返回处理后的消息和工具执行结果
 */
export async function processMCPMessages(messages: MCPMessage[]): Promise<{
  processedMessages: MCPMessage[];
  toolResults: MCPToolResult[];
}> {
  const processedMessages: MCPMessage[] = [];
  const toolResults: MCPToolResult[] = [];

  for (const message of messages) {
    processedMessages.push(message);

    // 如果消息包含工具调用，执行工具并添加结果消息
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      for (const toolCall of message.tool_calls) {
        const result = await executeMCPToolCall(toolCall);
        toolResults.push(result);

        // 添加工具执行结果消息
        processedMessages.push({
          role: 'tool',
          content: result.error ? `Error: ${result.error}` : result.content,
          tool_call_id: result.tool_call_id
        });
      }
    }
  }

  return { processedMessages, toolResults };
}

/**
 * 将MCP消息转换为适合DeepSeek API的格式
 */
export function convertMCPMessagesToPrompt(messages: MCPMessage[]): string {
  const processedMessages = messages.map(message => {
    let text: string;
    
    if (message.role === 'tool') {
      // 工具结果消息
      text = `Tool Result (${message.tool_call_id}): ${message.content}`;
    } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
      // 包含工具调用的消息
      let content = '';
      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        const texts = message.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text);
        content = texts.join('\n');
      }
      
      const toolCallsText = message.tool_calls.map(tc => 
        `Tool Call: ${tc.function.name}(${tc.function.arguments})`
      ).join('\n');
      
      text = content ? `${content}\n${toolCallsText}` : toolCallsText;
    } else {
      // 普通消息
      if (Array.isArray(message.content)) {
        const texts = message.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text);
        text = texts.join('\n');
      } else {
        text = String(message.content || '');
      }
    }
    
    return { role: message.role, text };
  });

  if (processedMessages.length === 0) return '';

  // 合并连续相同角色的消息
  const mergedBlocks: { role: string; text: string }[] = [];
  let currentBlock = { ...processedMessages[0] };

  for (let i = 1; i < processedMessages.length; i++) {
    const msg = processedMessages[i];
    if (msg.role === currentBlock.role) {
      currentBlock.text += `\n\n${msg.text}`;
    } else {
      mergedBlocks.push(currentBlock);
      currentBlock = { ...msg };
    }
  }
  mergedBlocks.push(currentBlock);

  // 添加标签并连接结果
  return mergedBlocks
    .map((block, index) => {
      if (block.role === "assistant") {
        return `<｜Assistant｜>${block.text}<｜end of sentence｜>`;
      }
      
      if (block.role === "user" || block.role === "system") {
        return index > 0 ? `<｜User｜>${block.text}` : block.text;
      }

      if (block.role === "tool") {
        return `<｜Tool｜>${block.text}<｜end of tool｜>`;
      }

      return block.text;
    })
    .join('')
    .replace(/\!\[.+\]\(.+\)/g, "");
}