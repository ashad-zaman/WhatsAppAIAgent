import { StateGraph, END, START, CompiledStateGraph } from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { llmService, embeddingService } from '@whatsapp-ai/ai';
import { prisma } from '@whatsapp-ai/database';
import { generateId } from '@whatsapp-ai/common';

export interface AgentState {
  messages: (AIMessage | HumanMessage | SystemMessage | ToolMessage)[];
  context: Record<string, unknown>;
  intent?: string;
  entities?: Record<string, unknown>;
  tools?: AgentTool[];
  toolResults?: Record<string, unknown>;
  response?: string;
  error?: string;
  userId?: string;
  agentType?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  handler: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<unknown>;
}

export const INTENT_CLASSIFICATION_PROMPT = `You are an intent classification assistant for a WhatsApp AI agent platform.

Classify the user's message into one of the following intents:
- create_reminder: User wants to create a reminder or alarm
- update_reminder: User wants to modify an existing reminder
- delete_reminder: User wants to remove a reminder
- list_reminders: User wants to see their reminders
- share_reminder: User wants to share a reminder with someone
- create_calendar_event: User wants to create a calendar event
- sync_calendar: User wants to sync their calendar
- query_document: User wants to find information in documents
- upload_document: User wants to upload a document
- summarize_document: User wants a summary of a document
- general_conversation: General chat or questions
- unknown: Cannot determine intent

Return your response as a JSON object with the following structure:
{
  "intent": "the classified intent",
  "confidence": 0.95,
  "entities": {
    "title": "optional title extracted",
    "datetime": "optional datetime extracted",
    "recipient": "optional recipient extracted",
    ...
  }
}

User message: {message}`;

export const classifyIntent = async (message: string): Promise<{
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
}> => {
  const response = await llmService.chatCompletion({
    messages: [
      {
        role: 'user',
        content: INTENT_CLASSIFICATION_PROMPT.replace('{message}', message),
      },
    ],
  });

  const content = response.choices[0].message?.content || '{}';
  
  try {
    const parsed = JSON.parse(content);
    return {
      intent: parsed.intent || 'unknown',
      confidence: parsed.confidence || 0.5,
      entities: parsed.entities || {},
    };
  } catch {
    return { intent: 'unknown', confidence: 0, entities: {} };
  }
};

export const reminderTools = {
  createReminder: {
    name: 'create_reminder',
    description: 'Create a new reminder for the user',
    schema: z.object({
      title: z.string().describe('The reminder title'),
      scheduledAt: z.string().describe('ISO date string for when to remind'),
      timezone: z.string().describe('User timezone'),
      repeatType: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
      description: z.string().optional(),
    }),
    handler: async (input: Record<string, unknown>, context: Record<string, unknown>) => {
      const reminder = await prisma.reminder.create({
        data: {
          id: generateId(),
          userId: context.userId as string,
          title: input.title as string,
          scheduledAt: new Date(input.scheduledAt as string),
          timezone: (input.timezone as string) || 'UTC',
          repeatType: ((input.repeatType as string) || 'NONE').toUpperCase() as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
          description: input.description as string,
          source: 'WHATSAPP',
        },
      });
      return { success: true, reminderId: reminder.id, message: `Reminder "${reminder.title}" created for ${reminder.scheduledAt}` };
    },
  },
  listReminders: {
    name: 'list_reminders',
    description: 'List all reminders for the user',
    schema: z.object({
      status: z.enum(['pending', 'completed', 'cancelled']).optional(),
      limit: z.number().optional(),
    }),
    handler: async (input: Record<string, unknown>, context: Record<string, unknown>) => {
      const reminders = await prisma.reminder.findMany({
        where: {
          userId: context.userId as string,
          ...(input.status && { status: (input.status as string).toUpperCase() }),
        },
        orderBy: { scheduledAt: 'asc' },
        take: (input.limit as number) || 10,
      });
      return { reminders, count: reminders.length };
    },
  },
  updateReminder: {
    name: 'update_reminder',
    description: 'Update an existing reminder',
    schema: z.object({
      reminderId: z.string().describe('The reminder ID to update'),
      title: z.string().optional(),
      scheduledAt: z.string().optional(),
      description: z.string().optional(),
    }),
    handler: async (input: Record<string, unknown>, context: Record<string, unknown>) => {
      const updateData: Record<string, unknown> = {};
      if (input.title) updateData.title = input.title;
      if (input.scheduledAt) updateData.scheduledAt = new Date(input.scheduledAt as string);
      if (input.description !== undefined) updateData.description = input.description;

      const reminder = await prisma.reminder.update({
        where: { id: input.reminderId },
        data: updateData,
      });
      return { success: true, reminder };
    },
  },
  deleteReminder: {
    name: 'delete_reminder',
    description: 'Delete a reminder',
    schema: z.object({
      reminderId: z.string().describe('The reminder ID to delete'),
    }),
    handler: async (input: Record<string, unknown>, context: Record<string, unknown>) => {
      await prisma.reminder.delete({
        where: { id: input.reminderId },
      });
      return { success: true, message: 'Reminder deleted' };
    },
  },
};

export const createAgentNode = (
  name: string,
  systemPrompt: string,
  tools: AgentTool[] = []
) => {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const messages = [
      new SystemMessage(systemPrompt),
      ...state.messages,
    ];

    try {
      const toolSchemas = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.schema.shape,
        },
      }));

      const completion = await llmService.chatCompletion({
        messages: messages.map((m) => ({
          role: m.getType() === 'ai' ? 'assistant' : m.getType() === 'human' ? 'user' : 'system',
          content: m.content as string,
        })),
        tools: toolSchemas.length > 0 ? toolSchemas : undefined,
        toolChoice: tools.length > 0 ? 'auto' : undefined,
      });

      const message = completion.choices[0].message;
      const toolCalls = message.tool_calls || [];

      if (toolCalls.length > 0) {
        const toolResults: Record<string, unknown> = {};
        
        for (const call of toolCalls) {
          const tool = tools.find((t) => t.name === call.function.name);
          if (tool) {
            try {
              const args = JSON.parse(call.function.arguments);
              const result = await tool.handler(args, {
                ...state.context,
                userId: state.userId,
              });
              toolResults[call.id!] = result;
            } catch (error) {
              toolResults[call.id!] = { error: error instanceof Error ? error.message : 'Tool execution failed' };
            }
          }
        }

        return {
          messages: [
            ...state.messages,
            new AIMessage({ content: message.content || '' }),
            ...Object.entries(toolResults).map(([callId, result]) => 
              new ToolMessage({ content: JSON.stringify(result), tool_call_id: callId })
            ),
          ],
          toolResults,
        };
      }

      return {
        messages: [...state.messages, new AIMessage({ content: message.content || '' })],
        response: message.content || '',
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Agent execution failed',
      };
    }
  };
};

export const createRouterNode = () => {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!(lastMessage instanceof HumanMessage)) {
      return { intent: 'unknown', entities: {} };
    }

    const { intent, entities, confidence } = await classifyIntent(lastMessage.content as string);
    
    return {
      intent,
      entities,
      context: { ...state.context, confidence, originalMessage: lastMessage.content },
    };
  };
};

export const createResponseFormatterNode = () => {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage instanceof AIMessage) {
      let response = lastMessage.content as string;

      if (state.toolResults && Object.keys(state.toolResults).length > 0) {
        const toolMessages = state.messages.filter((m) => m instanceof ToolMessage);
        for (const toolMsg of toolMessages) {
          const content = toolMsg.content as string;
          try {
            const result = JSON.parse(content);
            if (result.message) {
              response = result.message;
            } else if (result.reminders) {
              response = `You have ${result.count} reminders:\n`;
              response += result.reminders.map((r: { title: string; scheduledAt: Date }) => 
                `- ${r.title} at ${new Date(r.scheduledAt).toLocaleString()}`
              ).join('\n');
            }
          } catch {
            // Use default response
          }
        }
      }

      return { response };
    }
    return { response: 'I\'m not sure how to respond to that.' };
  };
};

export const createConditionalEdge = (
  conditions: { name: string; condition: (state: AgentState) => boolean }[]
) => {
  return (state: AgentState): string => {
    for (const { name, condition } of conditions) {
      if (condition(state)) {
        return name;
      }
    }
    return END;
  };
};

export const buildAgentGraph = (
  nodes: Record<string, (state: AgentState) => Promise<Partial<AgentState>>>,
  edges: { from: string; to: string }[],
  conditionalEdges?: { from: string; conditions: { name: string; condition: (state: AgentState) => boolean }[] }[]
): CompiledStateGraph<AgentState, any> => {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: { default: () => [] },
      context: { default: () => ({}) },
      intent: { default: () => undefined },
      entities: { default: () => ({}) },
      toolResults: { default: () => ({}) },
      response: { default: () => undefined },
      error: { default: () => undefined },
      userId: { default: () => undefined },
      agentType: { default: () => undefined },
    },
  });

  for (const [name, node] of Object.entries(nodes)) {
    workflow.addNode(name, node);
  }

  for (const edge of edges) {
    workflow.addEdge(edge.from, edge.to);
  }

  if (conditionalEdges) {
    for (const { from, conditions } of conditionalEdges) {
      workflow.addConditionalEdges(
        from,
        createConditionalEdge(conditions),
        conditions.map((c) => c.name)
      );
    }
  }

  workflow.addEdge(START, Object.keys(nodes)[0]);
  workflow.addEdge(Object.keys(nodes)[Object.keys(nodes).length - 1], END);

  return workflow.compile();
};

export const CONVERSATION_AGENT_PROMPT = `You are a friendly WhatsApp AI assistant. Your role is to:
1. Help users manage reminders, calendars, and documents
2. Have natural conversations and provide helpful information
3. Guide users through the platform's features
4. Be concise, friendly, and helpful in your responses

Current context:
- User timezone: {timezone}
- User preferences: {preferences}

Remember to:
- Keep responses short and conversational (WhatsApp style)
- Confirm actions before executing them
- Ask clarifying questions when needed
- Use emojis sparingly but appropriately
- Provide clear next steps when relevant`;

export const REMINDER_AGENT_PROMPT = `You are a reminder management specialist. Help users:
1. Create one-time and recurring reminders
2. Update or cancel existing reminders
3. Share reminders with friends and family
4. Set reminders based on natural language descriptions

When creating reminders:
- Extract the title, datetime, and any description
- Default to the user's timezone
- Ask for confirmation before creating
- Mention the repeat options if applicable

Available actions via tools:
- create_reminder: Create a new reminder
- list_reminders: Show user's reminders
- update_reminder: Modify existing reminder
- delete_reminder: Remove a reminder`;

export const CALENDAR_AGENT_PROMPT = `You are a calendar management specialist. Help users:
1. Create and manage calendar events
2. Sync with Google Calendar and Outlook
3. Detect scheduling conflicts
4. Provide agenda summaries

When managing events:
- Extract event details from natural language
- Handle timezone conversions properly
- Check for conflicts before creating events
- Sync changes across all connected calendars`;

export const DOCUMENT_AGENT_PROMPT = `You are a document intelligence specialist. Help users:
1. Upload and organize documents
2. Search document content semantically
3. Summarize and extract key information
4. Answer questions about document content

When processing documents:
- Support PDF, DOCX, TXT, and Markdown formats
- Chunk large documents for efficient processing
- Provide citations when referencing specific content
- Maintain document hierarchy and relationships`;

export const createConversationAgent = () => {
  const nodes = {
    router: createRouterNode(),
    conversation: createAgentNode('conversation', CONVERSATION_AGENT_PROMPT),
    formatter: createResponseFormatterNode(),
  };

  const edges: { from: string; to: string }[] = [
    { from: 'router', to: 'conversation' },
    { from: 'conversation', to: 'formatter' },
  ];

  const conditionalEdges = [
    {
      from: 'router',
      conditions: [
        { name: 'conversation', condition: (state) => state.intent === 'general_conversation' || state.intent === 'unknown' },
        { name: 'conversation', condition: (state) => !state.intent },
      ],
    },
  ];

  return buildAgentGraph(nodes, edges, conditionalEdges);
};

export const createReminderAgent = () => {
  const nodes = {
    router: createRouterNode(),
    reminder: createAgentNode('reminder', REMINDER_AGENT_PROMPT, Object.values(reminderTools)),
    formatter: createResponseFormatterNode(),
  };

  const edges = [
    { from: 'router', to: 'reminder' },
    { from: 'reminder', to: 'formatter' },
  ];

  return buildAgentGraph(nodes, edges);
};

export const createCalendarAgent = () => {
  const nodes = {
    router: createRouterNode(),
    calendar: createAgentNode('calendar', CALENDAR_AGENT_PROMPT),
    formatter: createResponseFormatterNode(),
  };

  const edges = [
    { from: 'router', to: 'calendar' },
    { from: 'calendar', to: 'formatter' },
  ];

  return buildAgentGraph(nodes, edges);
};

export const createDocumentAgent = () => {
  const nodes = {
    router: createRouterNode(),
    document: createAgentNode('document', DOCUMENT_AGENT_PROMPT),
    formatter: createResponseFormatterNode(),
  };

  const edges = [
    { from: 'router', to: 'document' },
    { from: 'document', to: 'formatter' },
  ];

  return buildAgentGraph(nodes, edges);
};

export const agentRegistry = {
  conversation: createConversationAgent(),
  reminder: createReminderAgent(),
  calendar: createCalendarAgent(),
  document: createDocumentAgent(),
};

export const executeAgent = async (
  agentType: string,
  userId: string,
  message: string,
  context: Record<string, unknown> = {}
): Promise<{ response: string; intent: string; entities: Record<string, unknown> }> => {
  const agent = agentRegistry[agentType as keyof typeof agentRegistry];
  
  if (!agent) {
    return {
      response: 'I\'m not sure how to help with that.',
      intent: 'unknown',
      entities: {},
    };
  }

  const initialState: AgentState = {
    messages: [new HumanMessage({ content: message })],
    context,
    userId,
    agentType,
  };

  const result = await agent.invoke(initialState);

  return {
    response: result.response || 'No response generated',
    intent: result.intent || 'unknown',
    entities: result.entities || {},
  };
};

export default {
  classifyIntent,
  executeAgent,
  createAgentNode,
  createRouterNode,
  buildAgentGraph,
  agentRegistry,
  REMINDER_AGENT_PROMPT,
  CALENDAR_AGENT_PROMPT,
  DOCUMENT_AGENT_PROMPT,
  CONVERSATION_AGENT_PROMPT,
};
