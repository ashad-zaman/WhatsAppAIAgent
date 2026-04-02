import { Kafka, Producer, Consumer, Admin, EachMessagePayload, logLevel } from 'kafkajs';
import { config } from '@whatsapp-ai/config';

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;
let admin: Admin | null = null;

export const initKafka = (): Kafka => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }
  return kafka;
};

export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = initKafka().producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producer.connect();
    console.log('Kafka producer connected');
  }
  return producer;
};

export const getConsumer = async (groupId: string): Promise<Consumer> => {
  if (!consumer) {
    consumer = initKafka().consumer({ groupId });
    await consumer.connect();
    console.log('Kafka consumer connected');
  }
  return consumer;
};

export const getAdmin = async (): Promise<Admin> => {
  if (!admin) {
    admin = initKafka().admin();
    await admin.connect();
    console.log('Kafka admin connected');
  }
  return admin;
};

export const disconnectKafka = async () => {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
  }
  if (admin) {
    await admin.disconnect();
    admin = null;
  }
  kafka = null;
  console.log('Kafka disconnected');
};

export const TOPICS = {
  MESSAGES_INBOUND: 'messages.inbound',
  MESSAGES_OUTBOUND: 'messages.outbound',
  AGENT_INTENT: 'agent.intent',
  AGENT_TASK: 'agent.task',
  AGENT_RESULT: 'agent.result',
  AGENT_NOTIFY: 'agent.notify',
  REMINDER_TRIGGER: 'reminder.trigger',
  REMINDER_COMPLETE: 'reminder.complete',
  CALENDAR_SYNC: 'calendar.sync',
  CALENDAR_EVENT: 'calendar.event',
  DOCUMENT_INDEX: 'document.index',
  DOCUMENT_PROCESSED: 'document.processed',
  WORKFLOW_EVENT: 'workflow.event',
  WORKFLOW_COMPLETE: 'workflow.complete',
  NOTIFICATIONS: 'notifications',
  USER_ACTIVITY: 'user.activity',
} as const;

export const createTopics = async (): Promise<void> => {
  const adminClient = await getAdmin();
  const existingTopics = await adminClient.listTopics();
  const topicsToCreate = Object.values(TOPICS).filter((topic) => !existingTopics.includes(topic));

  if (topicsToCreate.length > 0) {
    await adminClient.createTopics({
      topics: topicsToCreate.map((topic) => ({
        topic,
        numPartitions: 3,
        replicationFactor: 1,
      })),
    });
    console.log(`Created ${topicsToCreate.length} topics`);
  }
};

export interface Event<T = unknown> {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: T;
  metadata?: Record<string, unknown>;
}

export const eventBus = {
  async publish<T>(topic: string, event: Event<T>): Promise<void> {
    const prod = await getProducer();
    await prod.send({
      topic,
      messages: [
        {
          key: event.id,
          value: JSON.stringify(event),
          headers: {
            type: event.type,
            source: event.source,
            timestamp: event.timestamp,
          },
        },
      ],
    });
  },

  async subscribe(
    topic: string,
    groupId: string,
    handler: (event: Event) => Promise<void>
  ): Promise<void> {
    const cons = await getConsumer(groupId);
    await cons.subscribe({ topic, fromBeginning: false });

    await cons.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}') as Event;
          await handler(event);
        } catch (error) {
          console.error(`Error processing message from ${topic}:`, error);
        }
      },
    });
  },

  async publishMessageInbound(data: {
    messageId: string;
    userId: string;
    conversationId: string;
    content: string;
    messageType: string;
  }): Promise<void> {
    await this.publish(TOPICS.MESSAGES_INBOUND, {
      id: data.messageId,
      type: 'message.inbound',
      source: 'whatsapp-webhook',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishMessageOutbound(data: {
    messageId: string;
    userId: string;
    conversationId: string;
    content: string;
    messageType: string;
  }): Promise<void> {
    await this.publish(TOPICS.MESSAGES_OUTBOUND, {
      id: data.messageId,
      type: 'message.outbound',
      source: 'agent-service',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishAgentIntent(data: {
    intentId: string;
    userId: string;
    conversationId: string;
    intent: string;
    entities: Record<string, unknown>;
    confidence: number;
  }): Promise<void> {
    await this.publish(TOPICS.AGENT_INTENT, {
      id: data.intentId,
      type: 'agent.intent',
      source: 'agent-router',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishAgentTask(data: {
    taskId: string;
    agentType: string;
    action: string;
    input: Record<string, unknown>;
    priority?: number;
  }): Promise<void> {
    await this.publish(TOPICS.AGENT_TASK, {
      id: data.taskId,
      type: 'agent.task',
      source: 'agent-router',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishAgentResult(data: {
    taskId: string;
    agentType: string;
    result: unknown;
    success: boolean;
    error?: string;
  }): Promise<void> {
    await this.publish(TOPICS.AGENT_RESULT, {
      id: data.taskId,
      type: 'agent.result',
      source: 'agent-service',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishReminderTrigger(data: {
    reminderId: string;
    userId: string;
    title: string;
    message: string;
  }): Promise<void> {
    await this.publish(TOPICS.REMINDER_TRIGGER, {
      id: data.reminderId,
      type: 'reminder.trigger',
      source: 'reminder-service',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishDocumentIndex(data: {
    documentId: string;
    userId: string;
    status: 'started' | 'completed' | 'failed';
    chunkCount?: number;
    error?: string;
  }): Promise<void> {
    await this.publish(TOPICS.DOCUMENT_INDEX, {
      id: data.documentId,
      type: 'document.index',
      source: 'document-service',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishWorkflowEvent(data: {
    workflowId: string;
    stepId: string;
    event: 'started' | 'completed' | 'failed';
    result?: unknown;
  }): Promise<void> {
    await this.publish(TOPICS.WORKFLOW_EVENT, {
      id: data.workflowId,
      type: 'workflow.event',
      source: 'workflow-orchestrator',
      timestamp: new Date().toISOString(),
      data,
    });
  },

  async publishNotification(data: {
    notificationId: string;
    userId: string;
    channel: 'whatsapp' | 'email' | 'push';
    type: string;
    title: string;
    message: string;
  }): Promise<void> {
    await this.publish(TOPICS.NOTIFICATIONS, {
      id: data.notificationId,
      type: 'notification',
      source: 'notification-service',
      timestamp: new Date().toISOString(),
      data,
    });
  },
};

export default eventBus;
