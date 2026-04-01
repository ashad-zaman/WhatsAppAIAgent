import * as Sentry from '@sentry/nextjs';
import type { SentryConfig } from './index';

export interface NextJsConfig extends SentryConfig {
  wizardStep?: number;
  projectName?: string;
  orgSlug?: string;
  projectSlug?: string;
  url?: string;
  rewriteFrames?: {
    root?: string;
    iteratee?: (frame: Sentry.Frame) => string;
  };
  tracesExtensions?: string[];
}

export function initNextSentry(config: NextJsConfig): void {
  if (!config.enabled) {
    console.log('Sentry is disabled for Next.js');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate,
    profilesSampleRate: config.profilesSampleRate,
    debug: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.feedbackIntegration({
        colorScheme: 'auto',
        backgroundOverlayColor: 'rgba(0, 0, 0, 0.5)',
        submitButtonBackground: '#000000',
        submitButtonColor: '#ffffff',
        formTitle: 'Bug Report',
        labelSubmit: 'Submit',
        labelCancel: 'Cancel',
        placeholder: 'What happened?',
        titlePlaceholder: 'Summarize the bug...',
        thankYouTitle: 'Thank you for your feedback!',
        isEmailRequired: true,
        isNameRequired: false,
      }),
      ...Sentry.autoDiscoverNodePerformanceMonitoring(),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

export async function registerInstrumentation(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerInstrumentation } = await import('@sentry/nextjs/build/commonjs/utils/instrumentServer');
    registerInstrumentation({
      instrumentDraftExportPlugin: true,
      instrumentWebpack: true,
    });
  }
}

export function withSentryServerSideProps<P extends Record<string, unknown>>(
  handler: (props: P) => Promise<{ props: P | { [key: string]: unknown } }>
): (props: P) => Promise<{ props: P | { [key: string]: unknown } }> {
  return async (props: P) => {
    try {
      const result = await handler(props);
      return result;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}

export function withSentryApiHandler<T>(
  handler: (data: T) => Promise<unknown>
): (data: T) => Promise<unknown> {
  return async (data: T) => {
    try {
      return await handler(data);
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          request: data,
        },
      });
      throw error;
    }
  };
}

export { Sentry };
export default {
  init: initNextSentry,
  registerInstrumentation,
  withSentryServerSideProps,
  withSentryApiHandler,
};
