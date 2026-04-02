const mockProducer = {
  connect: jest.fn(),
  send: jest.fn(),
  disconnect: jest.fn(),
};

const mockConsumer = {
  connect: jest.fn(),
  subscribe: jest.fn(),
  run: jest.fn(),
  disconnect: jest.fn(),
};

const mockAdmin = {
  connect: jest.fn(),
  listTopics: jest.fn(),
  createTopics: jest.fn(),
  disconnect: jest.fn(),
};

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
  consumer: jest.fn().mockReturnValue(mockConsumer),
  admin: jest.fn().mockReturnValue(mockAdmin),
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => mockKafka),
  logLevel: {
    WARN: 4,
  },
}));

jest.mock('@whatsapp-ai/config', () => ({
  config: {
    kafka: {
      brokers: ['localhost:9092'],
      clientId: 'test-client',
    },
  },
}));

interface Event<T = unknown> {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: T;
  metadata?: Record<string, unknown>;
}

const TOPICS = {
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

const initKafka = () => mockKafka;

const getProducer = async () => {
  await mockProducer.connect();
  return mockProducer;
};

const getConsumer = async (_groupId: string) => {
  await mockConsumer.connect();
  return mockConsumer;
};

const getAdmin = async () => {
  await mockAdmin.connect();
  return mockAdmin;
};

const disconnectKafka = async () => {
  await mockProducer.disconnect();
  await mockConsumer.disconnect();
  await mockAdmin.disconnect();
};

const createTopics = async () => {
  const existingTopics = await mockAdmin.listTopics();
  const topicsToCreate = Object.values(TOPICS).filter((topic) => !existingTopics.includes(topic));

  if (topicsToCreate.length > 0) {
    await mockAdmin.createTopics({
      topics: topicsToCreate.map((topic) => ({
        topic,
        numPartitions: 3,
        replicationFactor: 1,
      })),
    });
  }
};

const eventBus = {
  async publish<T>(topic: string, event: Event<T>) {
    await mockProducer.send({
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
    _groupId: string,
    handler: (event: Event) => Promise<void>
  ) {
    await mockConsumer.subscribe({ topic, fromBeginning: false });

    await mockConsumer.run({
      eachMessage: async ({ message }: { topic: string; partition: number; message: { value?: Buffer } }) => {
        try {
          const event = JSON.parse(message.value?.toString() || '{}') as Event;
          await handler(event);
        } catch (error) {
          console.error('Error processing message:', error);
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
  }) {
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
  }) {
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
  }) {
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
  }) {
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
  }) {
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
  }) {
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
  }) {
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
  }) {
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
  }) {
    await this.publish(TOPICS.NOTIFICATIONS, {
      id: data.notificationId,
      type: 'notification',
      source: 'notification-service',
      timestamp: new Date().toISOString(),
      data,
    });
  },
};

describe('Events Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await disconnectKafka();
  });

  describe('initKafka', () => {
    it('should create and return kafka instance', () => {
      const kafka = initKafka();
      expect(kafka).toBeDefined();
      expect(mockKafka.producer).toBeDefined();
      expect(mockKafka.consumer).toBeDefined();
    });

    it('should return cached instance on subsequent calls', () => {
      const kafka1 = initKafka();
      const kafka2 = initKafka();
      expect(kafka1).toBe(kafka2);
    });
  });

  describe('getProducer', () => {
    it('should create and connect producer', async () => {
      const producer = await getProducer();
      expect(producer).toBeDefined();
      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('should return cached producer', async () => {
      const producer1 = await getProducer();
      const producer2 = await getProducer();
      expect(producer1).toBe(producer2);
      expect(mockProducer.connect).toHaveBeenCalled();
    });
  });

  describe('getConsumer', () => {
    it('should create and connect consumer with group id', async () => {
      const consumer = await getConsumer('test-group');
      expect(consumer).toBeDefined();
      expect(mockConsumer.connect).toHaveBeenCalled();
    });

    it('should return cached consumer', async () => {
      const consumer1 = await getConsumer('group-1');
      const consumer2 = await getConsumer('group-1');
      expect(consumer1).toBe(consumer2);
    });
  });

  describe('getAdmin', () => {
    it('should create and connect admin', async () => {
      const admin = await getAdmin();
      expect(admin).toBeDefined();
      expect(mockAdmin.connect).toHaveBeenCalled();
    });
  });

  describe('disconnectKafka', () => {
    it('should disconnect all kafka clients', async () => {
      await getProducer();
      await getConsumer('test-group');
      await getAdmin();

      await disconnectKafka();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
      expect(mockAdmin.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', async () => {
      await expect(disconnectKafka()).resolves.not.toThrow();
    });
  });

  describe('TOPICS', () => {
    it('should have all required topics', () => {
      expect(TOPICS.MESSAGES_INBOUND).toBe('messages.inbound');
      expect(TOPICS.MESSAGES_OUTBOUND).toBe('messages.outbound');
      expect(TOPICS.AGENT_INTENT).toBe('agent.intent');
      expect(TOPICS.AGENT_TASK).toBe('agent.task');
      expect(TOPICS.AGENT_RESULT).toBe('agent.result');
      expect(TOPICS.AGENT_NOTIFY).toBe('agent.notify');
      expect(TOPICS.REMINDER_TRIGGER).toBe('reminder.trigger');
      expect(TOPICS.REMINDER_COMPLETE).toBe('reminder.complete');
      expect(TOPICS.CALENDAR_SYNC).toBe('calendar.sync');
      expect(TOPICS.CALENDAR_EVENT).toBe('calendar.event');
      expect(TOPICS.DOCUMENT_INDEX).toBe('document.index');
      expect(TOPICS.DOCUMENT_PROCESSED).toBe('document.processed');
      expect(TOPICS.WORKFLOW_EVENT).toBe('workflow.event');
      expect(TOPICS.WORKFLOW_COMPLETE).toBe('workflow.complete');
      expect(TOPICS.NOTIFICATIONS).toBe('notifications');
      expect(TOPICS.USER_ACTIVITY).toBe('user.activity');
    });

    it('should have correct topic naming convention', () => {
      Object.values(TOPICS).forEach(topic => {
        expect(topic).toMatch(/^[a-z]+(\.[a-z.]+)*$/);
      });
    });
  });

  describe('createTopics', () => {
    it('should create missing topics', async () => {
      mockAdmin.listTopics.mockResolvedValue(['existing-topic']);

      await createTopics();

      expect(mockAdmin.createTopics).toHaveBeenCalled();
    });

    it('should not create topics if all exist', async () => {
      const allTopics = Object.values(TOPICS);
      mockAdmin.listTopics.mockResolvedValue(allTopics);

      await createTopics();

      expect(mockAdmin.createTopics).not.toHaveBeenCalled();
    });

    it('should create topics with correct configuration', async () => {
      mockAdmin.listTopics.mockResolvedValue([]);

      await createTopics();

      expect(mockAdmin.createTopics).toHaveBeenCalledWith({
        topics: expect.arrayContaining([
          expect.objectContaining({
            topic: expect.any(String),
            numPartitions: 3,
            replicationFactor: 1,
          }),
        ]),
      });
    });
  });

  describe('eventBus.publish', () => {
    it('should publish event to topic', async () => {
      const event: Event = {
        id: 'event-123',
        type: 'test.event',
        source: 'test-source',
        timestamp: new Date().toISOString(),
        data: { key: 'value' },
      };

      await eventBus.publish('test.topic', event);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test.topic',
        messages: expect.arrayContaining([
          expect.objectContaining({
            key: event.id,
            value: JSON.stringify(event),
            headers: expect.objectContaining({
              type: event.type,
              source: event.source,
            }),
          }),
        ]),
      });
    });

    it('should include metadata in headers', async () => {
      const event: Event = {
        id: 'event-123',
        type: 'test.event',
        source: 'test-source',
        timestamp: new Date().toISOString(),
        data: {},
        metadata: { correlationId: 'corr-123' },
      };

      await eventBus.publish('test.topic', event);

      expect(mockProducer.send).toHaveBeenCalled();
    });
  });

  describe('eventBus.subscribe', () => {
    it('should subscribe to topic with handler', async () => {
      const handler = jest.fn();
      const messagePayload = {
        topic: 'test.topic',
        partition: 0,
        message: {
          value: Buffer.from(JSON.stringify({ id: 'msg-123', data: {} })),
        },
      };

      await eventBus.subscribe('test.topic', 'test-group', handler);

      const runConfig = mockConsumer.run.mock.calls[0]?.[0];
      if (runConfig) {
        await runConfig.eachMessage(messagePayload);
      }

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: 'test.topic',
        fromBeginning: false,
      });
    });

    it('should handle message processing errors', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Processing error'));

      await eventBus.subscribe('test.topic', 'test-group', handler);

      const runConfig = mockConsumer.run.mock.calls[0]?.[0];
      if (runConfig) {
        await runConfig.eachMessage({
          topic: 'test.topic',
          partition: 0,
          message: {
            value: Buffer.from('invalid json'),
          },
        });
      }

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('eventBus.publishMessageInbound', () => {
    it('should publish inbound message event', async () => {
      await eventBus.publishMessageInbound({
        messageId: 'msg-123',
        userId: 'user-123',
        conversationId: 'conv-123',
        content: 'Hello',
        messageType: 'text',
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.MESSAGES_INBOUND,
        })
      );
    });
  });

  describe('eventBus.publishMessageOutbound', () => {
    it('should publish outbound message event', async () => {
      await eventBus.publishMessageOutbound({
        messageId: 'msg-123',
        userId: 'user-123',
        conversationId: 'conv-123',
        content: 'Hello',
        messageType: 'text',
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.MESSAGES_OUTBOUND,
        })
      );
    });
  });

  describe('eventBus.publishAgentIntent', () => {
    it('should publish agent intent event', async () => {
      await eventBus.publishAgentIntent({
        intentId: 'intent-123',
        userId: 'user-123',
        conversationId: 'conv-123',
        intent: 'book_appointment',
        entities: { date: '2024-01-01' },
        confidence: 0.95,
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.AGENT_INTENT,
        })
      );
    });
  });

  describe('eventBus.publishAgentTask', () => {
    it('should publish agent task event', async () => {
      await eventBus.publishAgentTask({
        taskId: 'task-123',
        agentType: 'calendar',
        action: 'create_event',
        input: {},
        priority: 1,
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.AGENT_TASK,
        })
      );
    });

    it('should publish task without priority', async () => {
      await eventBus.publishAgentTask({
        taskId: 'task-123',
        agentType: 'reminder',
        action: 'create_reminder',
        input: {},
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });
  });

  describe('eventBus.publishAgentResult', () => {
    it('should publish successful agent result', async () => {
      await eventBus.publishAgentResult({
        taskId: 'task-123',
        agentType: 'calendar',
        result: { eventId: 'event-123' },
        success: true,
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.AGENT_RESULT,
        })
      );
    });

    it('should publish failed agent result with error', async () => {
      await eventBus.publishAgentResult({
        taskId: 'task-123',
        agentType: 'calendar',
        result: null,
        success: false,
        error: 'Calendar API unavailable',
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });
  });

  describe('eventBus.publishReminderTrigger', () => {
    it('should publish reminder trigger event', async () => {
      await eventBus.publishReminderTrigger({
        reminderId: 'rem-123',
        userId: 'user-123',
        title: 'Test Reminder',
        message: 'This is a reminder',
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.REMINDER_TRIGGER,
        })
      );
    });
  });

  describe('eventBus.publishDocumentIndex', () => {
    it('should publish document index started event', async () => {
      await eventBus.publishDocumentIndex({
        documentId: 'doc-123',
        userId: 'user-123',
        status: 'started',
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.DOCUMENT_INDEX,
        })
      );
    });

    it('should publish document index completed event', async () => {
      await eventBus.publishDocumentIndex({
        documentId: 'doc-123',
        userId: 'user-123',
        status: 'completed',
        chunkCount: 150,
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });

    it('should publish document index failed event', async () => {
      await eventBus.publishDocumentIndex({
        documentId: 'doc-123',
        userId: 'user-123',
        status: 'failed',
        error: 'Unsupported file format',
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });
  });

  describe('eventBus.publishWorkflowEvent', () => {
    it('should publish workflow started event', async () => {
      await eventBus.publishWorkflowEvent({
        workflowId: 'wf-123',
        stepId: 'step-1',
        event: 'started',
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.WORKFLOW_EVENT,
        })
      );
    });

    it('should publish workflow completed event with result', async () => {
      await eventBus.publishWorkflowEvent({
        workflowId: 'wf-123',
        stepId: 'step-1',
        event: 'completed',
        result: { output: 'data' },
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });

    it('should publish workflow failed event', async () => {
      await eventBus.publishWorkflowEvent({
        workflowId: 'wf-123',
        stepId: 'step-1',
        event: 'failed',
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });
  });

  describe('eventBus.publishNotification', () => {
    it('should publish whatsapp notification', async () => {
      await eventBus.publishNotification({
        notificationId: 'notif-123',
        userId: 'user-123',
        channel: 'whatsapp',
        type: 'reminder',
        title: 'Reminder',
        message: 'You have a reminder',
      });

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: TOPICS.NOTIFICATIONS,
        })
      );
    });

    it('should publish email notification', async () => {
      await eventBus.publishNotification({
        notificationId: 'notif-123',
        userId: 'user-123',
        channel: 'email',
        type: 'system',
        title: 'System Alert',
        message: 'System update available',
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });

    it('should publish push notification', async () => {
      await eventBus.publishNotification({
        notificationId: 'notif-123',
        userId: 'user-123',
        channel: 'push',
        type: 'document',
        title: 'Document Ready',
        message: 'Your document has been processed',
      });

      expect(mockProducer.send).toHaveBeenCalled();
    });
  });

  describe('Event type', () => {
    it('should have correct structure', () => {
      const event: Event = {
        id: 'event-123',
        type: 'test.event',
        source: 'test-source',
        timestamp: new Date().toISOString(),
        data: { key: 'value' },
      };

      expect(event.id).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.source).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.data).toBeDefined();
    });

    it('should allow optional metadata', () => {
      const event: Event = {
        id: 'event-123',
        type: 'test.event',
        source: 'test-source',
        timestamp: new Date().toISOString(),
        data: {},
      };

      expect(event.metadata).toBeUndefined();

      event.metadata = { key: 'value' };
      expect(event.metadata).toEqual({ key: 'value' });
    });

    it('should support complex data structures', () => {
      const event: Event<{
        userId: string;
        nested: { deep: { value: number } };
        array: string[];
      }> = {
        id: 'event-123',
        type: 'complex.event',
        source: 'test-source',
        timestamp: new Date().toISOString(),
        data: {
          userId: 'user-123',
          nested: { deep: { value: 42 } },
          array: ['a', 'b', 'c'],
        },
      };

      expect(event.data.nested.deep.value).toBe(42);
      expect(event.data.array).toHaveLength(3);
    });
  });
});
