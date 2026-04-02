import { Client, Connection, WorkflowHandle } from '@temporalio/client';
import { config } from '@whatsapp-ai/config';
import { generateId } from '@whatsapp-ai/common';
import { eventBus, TOPICS } from '@whatsapp-ai/events';

let temporalClient: Client | null = null;

export const connectTemporal = async (): Promise<Client> => {
  if (temporalClient) return temporalClient;

  const connection = await Connection.connect({
    address: config.temporal.host,
  });

  temporalClient = new Client({
    connection,
    namespace: config.temporal.namespace,
  });

  console.log('Temporal client connected');
  return temporalClient;
};

export interface WorkflowDefinition {
  id: string;
  name: string;
  type: 'scheduled' | 'event' | 'manual';
  config: {
    schedule?: string;
    eventType?: string;
  };
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: 'reminder' | 'calendar' | 'document' | 'conversation';
  action: string;
  input: Record<string, unknown>;
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: unknown;
  };
  onSuccess?: string;
  onFailure?: string;
}

export const workflows = {
  dailyReminderSummary: async (userId: string): Promise<void> => {
    const client = await connectTemporal();
    
    await client.workflow.start('daily-reminder-summary', {
      taskQueue: 'workflow-tasks',
      args: [{ userId }],
      workflowId: `daily-summary-${userId}-${Date.now()}`,
    });
  },

  proactiveCalendarCheck: async (userId: string): Promise<void> => {
    const client = await connectTemporal();
    
    await client.workflow.start('proactive-calendar-check', {
      taskQueue: 'workflow-tasks',
      args: [{ userId }],
      workflowId: `calendar-check-${userId}-${Date.now()}`,
    });
  },

  documentDigest: async (userId: string, documentIds: string[]): Promise<void> => {
    const client = await connectTemporal();
    
    await client.workflow.start('document-digest', {
      taskQueue: 'workflow-tasks',
      args: [{ userId, documentIds }],
      workflowId: `doc-digest-${userId}-${Date.now()}`,
    });
  },

  suggestRemindersFromContext: async (userId: string, context: Record<string, unknown>): Promise<void> => {
    const client = await connectTemporal();
    
    await client.workflow.start('suggest-reminders-from-context', {
      taskQueue: 'workflow-tasks',
      args: [{ userId, context }],
      workflowId: `suggest-reminders-${userId}-${Date.now()}`,
    });
  },

  conflictDetection: async (userId: string, eventId: string): Promise<void> => {
    const client = await connectTemporal();
    
    await client.workflow.start('conflict-detection', {
      taskQueue: 'workflow-tasks',
      args: [{ userId, eventId }],
      workflowId: `conflict-${eventId}`,
    });
  },
};

export const createCustomWorkflow = async (
  definition: WorkflowDefinition,
  input: Record<string, unknown>
): Promise<string> => {
  const workflowId = `custom-${definition.id}-${Date.now()}`;
  
  await eventBus.publish(TOPICS.WORKFLOW_EVENT, {
    id: workflowId,
    type: 'workflow.started',
    source: 'workflow-orchestrator',
    timestamp: new Date().toISOString(),
    data: {
      workflowId,
      definition,
      input,
    },
  });

  return workflowId;
};

export const executeWorkflowStep = async (
  step: WorkflowStep,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> => {
  try {
    switch (step.agentType) {
      case 'reminder':
        return await executeReminderStep(step, context);
      case 'calendar':
        return await executeCalendarStep(step, context);
      case 'document':
        return await executeDocumentStep(step, context);
      case 'conversation':
        return await executeConversationStep(step, context);
      default:
        return { success: false, error: `Unknown agent type: ${step.agentType}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Step execution failed',
    };
  }
};

const executeReminderStep = async (
  step: WorkflowStep,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown }> => {
  switch (step.action) {
    case 'create':
      return { success: true, result: { reminderId: generateId() } };
    case 'list':
      return { success: true, result: { reminders: [] } };
    case 'notify':
      return { success: true, result: { notified: true } };
    default:
      return { success: false, error: `Unknown reminder action: ${step.action}` };
  }
};

const executeCalendarStep = async (
  step: WorkflowStep,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown }> => {
  switch (step.action) {
    case 'sync':
      return { success: true, result: { synced: true } };
    case 'create_event':
      return { success: true, result: { eventId: generateId() } };
    case 'check_conflicts':
      return { success: true, result: { conflicts: [] } };
    default:
      return { success: false, error: `Unknown calendar action: ${step.action}` };
  }
};

const executeDocumentStep = async (
  step: WorkflowStep,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown }> => {
  switch (step.action) {
    case 'summarize':
      return { success: true, result: { summary: 'Document summary' } };
    case 'index':
      return { success: true, result: { indexed: true } };
    case 'search':
      return { success: true, result: { results: [] } };
    default:
      return { success: false, error: `Unknown document action: ${step.action}` };
  }
};

const executeConversationStep = async (
  step: WorkflowStep,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown }> => {
  switch (step.action) {
    case 'send_message':
      return { success: true, result: { messageId: generateId() } };
    case 'get_history':
      return { success: true, result: { messages: [] } };
    default:
      return { success: false, error: `Unknown conversation action: ${step.action}` };
  }
};

export const checkWorkflowCondition = (
  condition: WorkflowStep['condition'],
  context: Record<string, unknown>
): boolean => {
  if (!condition) return true;

  const value = context[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'contains':
      return String(value).includes(String(condition.value));
    case 'greater_than':
      return Number(value) > Number(condition.value);
    case 'less_than':
      return Number(value) < Number(condition.value);
    default:
      return false;
  }
};

export const getWorkflowStatus = async (workflowId: string): Promise<{
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: { id: string; status: string; result?: unknown }[];
}> => {
  return {
    status: 'completed',
    steps: [],
  };
};

export const cancelWorkflow = async (workflowId: string): Promise<boolean> => {
  try {
    const client = await connectTemporal();
    const handle = client.workflow.getHandle(workflowId);
    await handle.cancel();
    return true;
  } catch {
    return false;
  }
};

export default {
  connectTemporal,
  workflows,
  createCustomWorkflow,
  executeWorkflowStep,
  checkWorkflowCondition,
  getWorkflowStatus,
  cancelWorkflow,
};
