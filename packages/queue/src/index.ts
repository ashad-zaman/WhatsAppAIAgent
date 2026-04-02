import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@whatsapp-ai/config';

let connection: IORedis | null = null;

export const getRedisConnection = (): IORedis => {
  if (!connection) {
    connection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
};

export const disconnectRedisConnection = async () => {
  if (connection) {
    await connection.quit();
    connection = null;
  }
};

export const queues = {
  messages: createQueue('messages'),
  reminders: createQueue('reminders'),
  documents: createQueue('documents'),
  notifications: createQueue('notifications'),
  workflows: createQueue('workflows'),
  voice: createQueue('voice'),
  calendar: createQueue('calendar'),
};

function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
        age: 3600,
      },
      removeOnFail: {
        count: 500,
      },
    },
  });
}

export interface MessageJob {
  userId: string;
  conversationId: string;
  messageId: string;
  content: string;
  messageType: 'text' | 'voice' | 'document';
  metadata?: Record<string, unknown>;
}

export interface ReminderJob {
  reminderId: string;
  userId: string;
  title: string;
  scheduledAt: string;
  timezone: string;
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  metadata?: Record<string, unknown>;
}

export interface DocumentJob {
  documentId: string;
  userId: string;
  filePath: string;
  fileType: string;
  action: 'index' | 'reindex' | 'delete';
  metadata?: Record<string, unknown>;
}

export interface NotificationJob {
  userId: string;
  channel: 'whatsapp' | 'email' | 'push';
  type: 'reminder' | 'calendar' | 'document' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface WorkflowJob {
  workflowId: string;
  stepId: string;
  userId: string;
  input: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface VoiceJob {
  jobId: string;
  userId: string;
  messageId: string;
  audioUrl: string;
  action: 'transcribe' | 'synthesize';
  options?: Record<string, unknown>;
}

export interface CalendarJob {
  userId: string;
  provider: 'google' | 'outlook';
  action: 'sync' | 'create' | 'update' | 'delete';
  eventId?: string;
  data?: Record<string, unknown>;
}

export const queueService = {
  async addMessage(job: MessageJob): Promise<Job> {
    return queues.messages.add('process', job, {
      priority: 1,
      delay: 0,
    });
  },

  async addReminder(job: ReminderJob): Promise<Job> {
    const delay = new Date(job.scheduledAt).getTime() - Date.now();
    return queues.reminders.add('schedule', job, {
      priority: 2,
      delay: Math.max(0, delay),
      jobId: `reminder:${job.reminderId}`,
    });
  },

  async addDocument(job: DocumentJob): Promise<Job> {
    return queues.documents.add('process', job, {
      priority: 3,
    });
  },

  async addNotification(job: NotificationJob): Promise<Job> {
    return queues.notifications.add('send', job, {
      priority: 1,
    });
  },

  async addWorkflow(job: WorkflowJob): Promise<Job> {
    return queues.workflows.add('execute', job, {
      priority: 2,
    });
  },

  async addVoice(job: VoiceJob): Promise<Job> {
    return queues.voice.add('process', job, {
      priority: 1,
    });
  },

  async addCalendar(job: CalendarJob): Promise<Job> {
    return queues.calendar.add('sync', job, {
      priority: 2,
    });
  },

  async removeReminder(reminderId: string): Promise<void> {
    const job = await queues.reminders.getJob(`reminder:${reminderId}`);
    if (job) {
      await job.remove();
    }
  },

  async getQueueStats(queueName: keyof typeof queues): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
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

export { Queue, Worker, Job, QueueEvents };
export default queueService;
