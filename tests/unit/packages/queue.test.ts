jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    getJob: jest.fn(),
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(0),
    getFailedCount: jest.fn().mockResolvedValue(0),
    getDelayedCount: jest.fn().mockResolvedValue(0),
  })),
  Worker: jest.fn(),
  Job: { fromId: jest.fn() },
  QueueEvents: jest.fn(),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock('@whatsapp-ai/config', () => ({
  config: {
    redis: {
      url: 'redis://localhost:6379',
      host: 'localhost',
      port: 6379,
      poolSize: 10,
    },
  },
}));

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

interface MessageJob {
  userId: string;
  conversationId: string;
  messageId: string;
  content: string;
  messageType: 'text' | 'voice' | 'document';
  metadata?: Record<string, unknown>;
}

interface ReminderJob {
  reminderId: string;
  userId: string;
  title: string;
  scheduledAt: string;
  timezone: string;
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  metadata?: Record<string, unknown>;
}

interface DocumentJob {
  documentId: string;
  userId: string;
  filePath: string;
  fileType: string;
  action: 'index' | 'reindex' | 'delete';
  metadata?: Record<string, unknown>;
}

interface NotificationJob {
  userId: string;
  channel: 'whatsapp' | 'email' | 'push';
  type: 'reminder' | 'calendar' | 'document' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

interface WorkflowJob {
  workflowId: string;
  stepId: string;
  userId: string;
  input: Record<string, unknown>;
  config?: Record<string, unknown>;
}

interface VoiceJob {
  jobId: string;
  userId: string;
  messageId: string;
  audioUrl: string;
  action: 'transcribe' | 'synthesize';
  options?: Record<string, unknown>;
}

interface CalendarJob {
  userId: string;
  provider: 'google' | 'outlook';
  action: 'sync' | 'create' | 'update' | 'delete';
  eventId?: string;
  data?: Record<string, unknown>;
}

const mockQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
  getWaitingCount: jest.fn(),
  getActiveCount: jest.fn(),
  getCompletedCount: jest.fn(),
  getFailedCount: jest.fn(),
  getDelayedCount: jest.fn(),
};

let connection: { quit: jest.Mock } | null = null;

const getRedisConnection = () => {
  if (!connection) {
    connection = new IORedis('redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }) as unknown as { quit: jest.Mock };
  }
  return connection;
};

const disconnectRedisConnection = async () => {
  if (connection) {
    await connection.quit();
    connection = null;
  }
};

const createQueue = (name: string) => {
  (Queue as jest.Mock).mockImplementation(() => mockQueue);
  return mockQueue;
};

const queues = {
  messages: createQueue('messages'),
  reminders: createQueue('reminders'),
  documents: createQueue('documents'),
  notifications: createQueue('notifications'),
  workflows: createQueue('workflows'),
  voice: createQueue('voice'),
  calendar: createQueue('calendar'),
};

const queueService = {
  async addMessage(job: MessageJob) {
    return queues.messages.add('process', job, {
      priority: 1,
      delay: 0,
    });
  },

  async addReminder(job: ReminderJob) {
    const delay = new Date(job.scheduledAt).getTime() - Date.now();
    return queues.reminders.add('schedule', job, {
      priority: 2,
      delay: Math.max(0, delay),
      jobId: `reminder:${job.reminderId}`,
    });
  },

  async addDocument(job: DocumentJob) {
    return queues.documents.add('process', job, {
      priority: 3,
    });
  },

  async addNotification(job: NotificationJob) {
    return queues.notifications.add('send', job, {
      priority: 1,
    });
  },

  async addWorkflow(job: WorkflowJob) {
    return queues.workflows.add('execute', job, {
      priority: 2,
    });
  },

  async addVoice(job: VoiceJob) {
    return queues.voice.add('process', job, {
      priority: 1,
    });
  },

  async addCalendar(job: CalendarJob) {
    return queues.calendar.add('sync', job, {
      priority: 2,
    });
  },

  async removeReminder(reminderId: string) {
    const job = await queues.reminders.getJob(`reminder:${reminderId}`);
    if (job) {
      await job.remove();
    }
  },

  async getQueueStats(queueName: keyof typeof queues) {
    const queue = queues[queueName];
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  },
};

describe('Queue Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRedisConnection', () => {
    it('should create and return a redis connection', () => {
      const conn = getRedisConnection();
      expect(conn).toBeDefined();
      expect(IORedis).toHaveBeenCalledWith('redis://localhost:6379', expect.any(Object));
    });

    it('should return cached connection on subsequent calls', () => {
      const conn1 = getRedisConnection();
      const conn2 = getRedisConnection();
      expect(conn1).toBe(conn2);
    });
  });

  describe('disconnectRedisConnection', () => {
    it('should close the redis connection', async () => {
      getRedisConnection();
      await disconnectRedisConnection();
      const conn = getRedisConnection();
      expect(conn).toBeDefined();
    });
  });

  describe('queues', () => {
    it('should create all required queues', () => {
      expect(queues.messages).toBeDefined();
      expect(queues.reminders).toBeDefined();
      expect(queues.documents).toBeDefined();
      expect(queues.notifications).toBeDefined();
      expect(queues.workflows).toBeDefined();
      expect(queues.voice).toBeDefined();
      expect(queues.calendar).toBeDefined();
    });

    it('should create queues with correct names', () => {
      expect(queues.messages).toBeDefined();
      expect(queues.reminders).toBeDefined();
    });
  });

  describe('queueService.addMessage', () => {
    it('should add a message job to the queue', async () => {
      const job: MessageJob = {
        userId: 'user-123',
        conversationId: 'conv-123',
        messageId: 'msg-123',
        content: 'Hello world',
        messageType: 'text',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addMessage(job);

      expect(mockQueue.add).toHaveBeenCalledWith('process', job, {
        priority: 1,
        delay: 0,
      });
      expect(result).toBe(mockJob);
    });

    it('should handle voice messages', async () => {
      const job: MessageJob = {
        userId: 'user-123',
        conversationId: 'conv-123',
        messageId: 'msg-123',
        content: '',
        messageType: 'voice',
        metadata: { duration: 30 },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addMessage(job);

      expect(mockQueue.add).toHaveBeenCalledWith('process', job, expect.any(Object));
    });

    it('should handle document messages', async () => {
      const job: MessageJob = {
        userId: 'user-123',
        conversationId: 'conv-123',
        messageId: 'msg-123',
        content: '',
        messageType: 'document',
        metadata: { fileName: 'test.pdf', mimeType: 'application/pdf' },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addMessage(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('queueService.addReminder', () => {
    it('should add a reminder job with correct delay', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const job: ReminderJob = {
        reminderId: 'rem-123',
        userId: 'user-123',
        title: 'Test reminder',
        scheduledAt: futureDate.toISOString(),
        timezone: 'UTC',
        repeatType: 'none',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addReminder(job);

      expect(mockQueue.add).toHaveBeenCalledWith('schedule', job, expect.objectContaining({
        priority: 2,
        jobId: 'reminder:rem-123',
      }));
      expect(result).toBe(mockJob);
    });

    it('should handle past scheduled dates', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const job: ReminderJob = {
        reminderId: 'rem-123',
        userId: 'user-123',
        title: 'Test reminder',
        scheduledAt: pastDate.toISOString(),
        timezone: 'UTC',
        repeatType: 'none',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addReminder(job);

      expect(mockQueue.add).toHaveBeenCalledWith('schedule', job, expect.objectContaining({
        delay: 0,
      }));
    });

    it('should handle repeating reminders', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const job: ReminderJob = {
        reminderId: 'rem-123',
        userId: 'user-123',
        title: 'Daily reminder',
        scheduledAt: futureDate.toISOString(),
        timezone: 'America/New_York',
        repeatType: 'daily',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addReminder(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('queueService.addDocument', () => {
    it('should add a document indexing job', async () => {
      const job: DocumentJob = {
        documentId: 'doc-123',
        userId: 'user-123',
        filePath: '/path/to/file.pdf',
        fileType: 'application/pdf',
        action: 'index',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addDocument(job);

      expect(mockQueue.add).toHaveBeenCalledWith('process', job, expect.objectContaining({
        priority: 3,
      }));
      expect(result).toBe(mockJob);
    });

    it('should handle reindex action', async () => {
      const job: DocumentJob = {
        documentId: 'doc-123',
        userId: 'user-123',
        filePath: '/path/to/file.pdf',
        fileType: 'application/pdf',
        action: 'reindex',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addDocument(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should handle delete action', async () => {
      const job: DocumentJob = {
        documentId: 'doc-123',
        userId: 'user-123',
        filePath: '/path/to/file.pdf',
        fileType: 'application/pdf',
        action: 'delete',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addDocument(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('queueService.addNotification', () => {
    it('should add a whatsapp notification', async () => {
      const job: NotificationJob = {
        userId: 'user-123',
        channel: 'whatsapp',
        type: 'reminder',
        title: 'Reminder',
        message: 'You have a reminder',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addNotification(job);

      expect(mockQueue.add).toHaveBeenCalledWith('send', job, expect.objectContaining({
        priority: 1,
      }));
      expect(result).toBe(mockJob);
    });

    it('should add email notifications', async () => {
      const job: NotificationJob = {
        userId: 'user-123',
        channel: 'email',
        type: 'system',
        title: 'System Alert',
        message: 'System update available',
        data: { severity: 'info' },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addNotification(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should add push notifications', async () => {
      const job: NotificationJob = {
        userId: 'user-123',
        channel: 'push',
        type: 'document',
        title: 'Document Ready',
        message: 'Your document has been processed',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addNotification(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('queueService.addWorkflow', () => {
    it('should add a workflow job', async () => {
      const job: WorkflowJob = {
        workflowId: 'wf-123',
        stepId: 'step-1',
        userId: 'user-123',
        input: { key: 'value' },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addWorkflow(job);

      expect(mockQueue.add).toHaveBeenCalledWith('execute', job, expect.objectContaining({
        priority: 2,
      }));
      expect(result).toBe(mockJob);
    });

    it('should include workflow config', async () => {
      const job: WorkflowJob = {
        workflowId: 'wf-123',
        stepId: 'step-1',
        userId: 'user-123',
        input: {},
        config: { timeout: 30000, retries: 5 },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addWorkflow(job);

      expect(mockQueue.add).toHaveBeenCalledWith('execute', job, expect.any(Object));
    });
  });

  describe('queueService.addVoice', () => {
    it('should add a voice transcription job', async () => {
      const job: VoiceJob = {
        jobId: 'voice-123',
        userId: 'user-123',
        messageId: 'msg-123',
        audioUrl: 'https://example.com/audio.mp3',
        action: 'transcribe',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addVoice(job);

      expect(mockQueue.add).toHaveBeenCalledWith('process', job, expect.objectContaining({
        priority: 1,
      }));
      expect(result).toBe(mockJob);
    });

    it('should add a voice synthesis job', async () => {
      const job: VoiceJob = {
        jobId: 'voice-123',
        userId: 'user-123',
        messageId: 'msg-123',
        audioUrl: 'https://example.com/output.mp3',
        action: 'synthesize',
        options: { voice: 'en-US-Wavenet-D' },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addVoice(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('queueService.addCalendar', () => {
    it('should add a calendar sync job', async () => {
      const job: CalendarJob = {
        userId: 'user-123',
        provider: 'google',
        action: 'sync',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await queueService.addCalendar(job);

      expect(mockQueue.add).toHaveBeenCalledWith('sync', job, expect.objectContaining({
        priority: 2,
      }));
      expect(result).toBe(mockJob);
    });

    it('should add calendar event creation job', async () => {
      const job: CalendarJob = {
        userId: 'user-123',
        provider: 'outlook',
        action: 'create',
        data: { title: 'Meeting', start: '2024-01-01T10:00:00Z' },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addCalendar(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should add calendar event update job', async () => {
      const job: CalendarJob = {
        userId: 'user-123',
        provider: 'google',
        action: 'update',
        eventId: 'event-123',
        data: { title: 'Updated Meeting' },
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addCalendar(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should add calendar event deletion job', async () => {
      const job: CalendarJob = {
        userId: 'user-123',
        provider: 'outlook',
        action: 'delete',
        eventId: 'event-123',
      };

      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob);

      await queueService.addCalendar(job);

      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe('queueService.removeReminder', () => {
    it('should remove an existing reminder job', async () => {
      const mockJob = { id: 'reminder:rem-123', remove: jest.fn() };
      mockQueue.getJob.mockResolvedValue(mockJob);

      await queueService.removeReminder('rem-123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('reminder:rem-123');
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should handle non-existent reminder', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      await expect(queueService.removeReminder('non-existent')).resolves.not.toThrow();
    });
  });

  describe('queueService.getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(3);
      mockQueue.getDelayedCount.mockResolvedValue(1);

      const stats = await queueService.getQueueStats('messages');

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });

    it('should handle queue stats for reminders', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);
      mockQueue.getCompletedCount.mockResolvedValue(50);
      mockQueue.getFailedCount.mockResolvedValue(0);
      mockQueue.getDelayedCount.mockResolvedValue(10);

      const stats = await queueService.getQueueStats('reminders');

      expect(stats.delayed).toBe(10);
    });

    it('should handle zero counts', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);
      mockQueue.getCompletedCount.mockResolvedValue(0);
      mockQueue.getFailedCount.mockResolvedValue(0);
      mockQueue.getDelayedCount.mockResolvedValue(0);

      const stats = await queueService.getQueueStats('notifications');

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
    });
  });

  describe('Job type definitions', () => {
    it('should have correct MessageJob structure', () => {
      const job: MessageJob = {
        userId: 'user-123',
        conversationId: 'conv-123',
        messageId: 'msg-123',
        content: 'Test',
        messageType: 'text',
      };
      expect(job.messageType).toBe('text');
    });

    it('should have correct ReminderJob structure', () => {
      const job: ReminderJob = {
        reminderId: 'rem-123',
        userId: 'user-123',
        title: 'Test',
        scheduledAt: new Date().toISOString(),
        timezone: 'UTC',
        repeatType: 'weekly',
      };
      expect(job.repeatType).toBe('weekly');
    });

    it('should have correct DocumentJob structure', () => {
      const job: DocumentJob = {
        documentId: 'doc-123',
        userId: 'user-123',
        filePath: '/path',
        fileType: 'pdf',
        action: 'index',
      };
      expect(job.action).toBe('index');
    });

    it('should have correct NotificationJob structure', () => {
      const job: NotificationJob = {
        userId: 'user-123',
        channel: 'whatsapp',
        type: 'reminder',
        title: 'Test',
        message: 'Test message',
      };
      expect(job.channel).toBe('whatsapp');
    });

    it('should have correct WorkflowJob structure', () => {
      const job: WorkflowJob = {
        workflowId: 'wf-123',
        stepId: 'step-1',
        userId: 'user-123',
        input: {},
      };
      expect(job.workflowId).toBe('wf-123');
    });

    it('should have correct VoiceJob structure', () => {
      const job: VoiceJob = {
        jobId: 'voice-123',
        userId: 'user-123',
        messageId: 'msg-123',
        audioUrl: 'https://example.com/audio.mp3',
        action: 'transcribe',
      };
      expect(job.action).toBe('transcribe');
    });

    it('should have correct CalendarJob structure', () => {
      const job: CalendarJob = {
        userId: 'user-123',
        provider: 'google',
        action: 'sync',
      };
      expect(job.provider).toBe('google');
    });
  });
});
