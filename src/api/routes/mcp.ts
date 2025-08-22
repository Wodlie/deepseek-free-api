import _ from 'lodash';

import Request from '@/lib/request/Request.ts';
import Response from '@/lib/response/Response.ts';
import { hasMCPToolCalls, processMCPMessages, MCPMessage } from '@/lib/mcp.ts';

export default {
    prefix: '/v1/mcp',

    post: {
        '/test': async (request: Request) => {
            request
                .validate('body.messages', _.isArray);

            const { messages } = request.body;

            try {
                // Test MCP detection
                const hasMCP = hasMCPToolCalls(messages);
                
                let result = {
                    hasMCPCalls: hasMCP,
                    originalMessagesCount: messages.length,
                    processedMessages: [],
                    toolResults: []
                };

                if (hasMCP) {
                    // Process MCP messages
                    const { processedMessages, toolResults } = await processMCPMessages(messages);
                    result.processedMessages = processedMessages;
                    result.toolResults = toolResults;
                }

                return {
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    data: null
                };
            }
        }
    }
};