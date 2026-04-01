import { StateGraph, END, START } from '@langchain/langgraph';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { llmService } from './openai';

export interface AgentState {
  messages: (AIMessage | HumanMessage | SystemMessage | ToolMessage)[];
  context: Record<string, unknown>;
  intent?: string;
  entities?: Record<string, unknown>;
  tools?: AgentTool[];
  toolResults?: Record<string, unknown>;
  response?: string;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  handler: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<unknown>;
}

export const createAgentNode = (
  name: string,
  systemPrompt: string,
  tools: AgentTool[] = []
) => {
  const node = async (state: AgentState): Promise<Partial<AgentState>> => {
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
            const args = JSON.parse(call.function.arguments);
            const result = await tool.handler(args, state.context);
            toolResults[call.id!] = result;
          }
        }

        return {
          messages: [...state.messages, new AIMessage({ content: message.content || '' })],
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

  return node;
};

export const createRouterNode = (
  intentClassifier: (message: string) => Promise<{ intent: string; entities: Record<string, unknown>; confidence: number }>
) => {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!(lastMessage instanceof HumanMessage)) {
      return { intent: 'unknown', entities: {} };
    }

    const { intent, entities, confidence } = await intentClassifier(lastMessage.content as string);
    return { intent, entities, context: { ...state.context, confidence } };
  };
};

export const createResponseNode = () => {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage instanceof AIMessage) {
      return { response: lastMessage.content as string };
    }
    return { response: 'No response generated' };
  };
};

export const createSupervisorAgent = (
  subAgents: { name: string; description: string; endpoint: string }[],
  systemPrompt: string
) => {
  const supervisorNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    const messageHistory = state.messages.map((m) => ({
      role: m.getType() === 'ai' ? 'assistant' : m.getType() === 'human' ? 'user' : 'system',
      content: m.content as string,
    }));

    const agentList = subAgents.map((a) => `- ${a.name}: ${a.description}`).join('\n');

    const supervisorPrompt = `${systemPrompt}

Available agents:
${agentList}

Based on the user's request, determine which agent(s) should handle the task.
If multiple agents are needed, you can call them in sequence.
Always provide a clear response to the user after agents complete their tasks.`;

    try {
      const completion = await llmService.chatCompletion({
        messages: [
          new SystemMessage(supervisorPrompt),
          ...messageHistory.map((m) => ({ role: m.role, content: m.content })),
        ] as Parameters<typeof llmService.chatCompletion>[0]['messages'],
      });

      return {
        messages: [...state.messages, new AIMessage({ content: completion.choices[0].message.content || '' })],
        response: completion.choices[0].message.content,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Supervisor failed' };
    }
  };

  return supervisorNode;
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
) => {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: { default: () => [] },
      context: { default: () => ({}) },
      intent: { default: () => undefined },
      entities: { default: () => ({}) },
      toolResults: { default: () => ({}) },
      response: { default: () => undefined },
      error: { default: () => undefined },
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

export default {
  createAgentNode,
  createRouterNode,
  createResponseNode,
  createSupervisorAgent,
  buildAgentGraph,
};
