# MCP (Model Context Protocol) Usage Examples

This document provides examples of how to use the MCP tool calling functionality with the DeepSeek Free API.

## Basic Tool Call Example

### Weather Query

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "deepseek",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in Tokyo?"
      },
      {
        "role": "assistant", 
        "content": "I will check the weather in Tokyo for you.",
        "tool_calls": [
          {
            "id": "call_1",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"Tokyo\"}"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

### Web Search

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "deepseek",
    "messages": [
      {
        "role": "user",
        "content": "Search for information about artificial intelligence"
      },
      {
        "role": "assistant",
        "content": "I will search for information about artificial intelligence.",
        "tool_calls": [
          {
            "id": "call_2", 
            "type": "function",
            "function": {
              "name": "search_web",
              "arguments": "{\"query\": \"artificial intelligence\"}"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

### Mathematical Calculation

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "deepseek",
    "messages": [
      {
        "role": "user",
        "content": "Calculate 25 * 4 + 10"
      },
      {
        "role": "assistant",
        "content": "I will calculate that for you.",
        "tool_calls": [
          {
            "id": "call_3",
            "type": "function", 
            "function": {
              "name": "calculate",
              "arguments": "{\"expression\": \"25 * 4 + 10\"}"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

## Multiple Tool Calls

You can also make multiple tool calls in a single message:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "deepseek",
    "messages": [
      {
        "role": "user",
        "content": "Can you check the weather in Beijing and also calculate 15 * 8?"
      },
      {
        "role": "assistant",
        "content": "I will check the weather in Beijing and calculate 15 * 8 for you.",
        "tool_calls": [
          {
            "id": "call_4",
            "type": "function",
            "function": {
              "name": "get_weather", 
              "arguments": "{\"location\": \"Beijing\"}"
            }
          },
          {
            "id": "call_5",
            "type": "function",
            "function": {
              "name": "calculate",
              "arguments": "{\"expression\": \"15 * 8\"}"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

## Testing MCP Functionality

Use the dedicated test endpoint to verify MCP functionality:

```bash
curl -X POST http://localhost:8000/v1/mcp/test \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Test message without tools"
      }
    ]
  }'
```

Response for messages without tool calls:
```json
{
  "success": true,
  "data": {
    "hasMCPCalls": false,
    "originalMessagesCount": 1,
    "processedMessages": [],
    "toolResults": []
  }
}
```

Test with tool calls:
```bash
curl -X POST http://localhost:8000/v1/mcp/test \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "assistant",
        "tool_calls": [
          {
            "id": "test_1",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"Shanghai\"}"
            }
          }
        ]
      }
    ]
  }'
```

Response for messages with tool calls:
```json
{
  "success": true,
  "data": {
    "hasMCPCalls": true,
    "originalMessagesCount": 1,
    "processedMessages": 2,
    "toolResults": [
      {
        "tool_call_id": "test_1",
        "content": "{\"location\":\"Shanghai\",\"temperature\":25,\"condition\":\"sunny\",\"humidity\":65,\"wind_speed\":10}"
      }
    ]
  }
}
```

## Response Format

### Standard Chat Response (without tool calls)
```json
{
  "id": "session_id@message_id",
  "model": "deepseek",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response content here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1,
    "completion_tokens": 1,
    "total_tokens": 2
  },
  "created": 1715061432
}
```

### Tool Call Response
```json
{
  "id": "session_id@message_id",
  "model": "deepseek", 
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I will help you with that.",
        "tool_calls": [
          {
            "id": "call_1",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"Beijing\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 1,
    "completion_tokens": 1,
    "total_tokens": 2
  },
  "created": 1715061432
}
```

## Notes

- MCP tool calling is fully compatible with the existing OpenAI chat completions API
- Both streaming and non-streaming modes are supported
- Multiple tools can be called within a single message
- Tool execution happens on the server side - the actual tool implementations can be customized
- All existing functionality remains unchanged when MCP features are not used