# MCP Integration Example

This example demonstrates how to use the MCP (Model Context Protocol) support in the deepseek-free-api.

## API Usage

### 1. Send chat request with MCP tools

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "deepseek",
    "messages": [
      {
        "role": "user", 
        "content": "What is the current weather in Beijing?"
      }
    ],
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather information for a city",
        "inputSchema": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "Name of the city"
            },
            "units": {
              "type": "string", 
              "enum": ["celsius", "fahrenheit"],
              "description": "Temperature units"
            }
          },
          "required": ["city"]
        }
      }
    ]
  }'
```

### 2. Example response with tool call

```json
{
  "id": "chat-123@456",
  "model": "deepseek",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'll help you get the current weather in Beijing.",
        "tool_calls": [
          {
            "id": "call_weather_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"city\": \"Beijing\", \"units\": \"celsius\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "created": 1703123456
}
```

### 3. Send tool results back

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "deepseek",
    "messages": [
      {
        "role": "user", 
        "content": "What is the current weather in Beijing?"
      },
      {
        "role": "assistant",
        "content": "I'\''ll help you get the current weather in Beijing.",
        "tool_calls": [
          {
            "id": "call_weather_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"city\": \"Beijing\", \"units\": \"celsius\"}"
            }
          }
        ]
      },
      {
        "role": "tool",
        "content": "The current weather in Beijing is 15°C, partly cloudy with light winds.",
        "tool_call_id": "call_weather_123"
      }
    ],
    "tool_results": [
      {
        "tool_call_id": "call_weather_123",
        "content": "The current weather in Beijing is 15°C, partly cloudy with light winds."
      }
    ]
  }'
```

### 4. Final response

```json
{
  "id": "chat-123@789",
  "model": "deepseek", 
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Based on the weather data, the current weather in Beijing is 15°C and partly cloudy with light winds. It's a pleasant day with moderate temperatures!"
      },
      "finish_reason": "stop"
    }
  ],
  "created": 1703123500
}
```

## Key Features

1. **Tool Context Injection**: Available tools are automatically described to the LLM
2. **Tool Call Detection**: Responses are parsed for `<tool_call>` tags  
3. **Clean Streaming**: Tool call tags are removed from streamed content
4. **Result Integration**: Tool execution results are injected into follow-up prompts
5. **Standard Format**: Compatible with OpenAI's tool calling format

## Implementation Notes

- The backend (DeepSeek) doesn't natively support MCP, so tool calls are detected from natural language responses
- Tool calls are formatted in `<tool_call>` XML tags in the prompt context
- The LLM learns to generate properly formatted tool calls through prompt engineering
- Clients handle actual tool execution locally, then send results back
- Supports both streaming and non-streaming responses