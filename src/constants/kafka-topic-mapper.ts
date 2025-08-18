// kafka/topic-mapper.ts
import { EventType } from '@prisma/client';

export const EVENT_TO_TOPIC: Record<EventType, string> = {
  VIDEO_JOB_CREATED: 'video.jobs.created.v1',
  VIDEO_SCRIPT_GENERATED: 'video.script.generated.v1',
  VIDEO_JOB_PROCESSING: 'video.jobs.processing.v1',
  VIDEO_JOB_COMPLETED: 'video.jobs.completed.v1',
  VIDEO_JOB_FAILED: 'video.jobs.failed.v1',
  VIDEO_ASSETS_GENERATED: 'video.assets.generated',
};

// kafka-events.ts
type TopicPayloadType = {
  topic: string;
  payload: object;
};

export const KafkaTopics: Record<EventType, TopicPayloadType> = {
  VIDEO_JOB_CREATED: {
    topic: EVENT_TO_TOPIC.VIDEO_JOB_CREATED,
    payload: {} as { jobId: string; userId: string },
  },
  VIDEO_SCRIPT_GENERATED: {
    topic: EVENT_TO_TOPIC.VIDEO_SCRIPT_GENERATED,
    payload: {} as { jobId: string; script: string }, // Type template
  },
  VIDEO_JOB_PROCESSING: {
    topic: EVENT_TO_TOPIC.VIDEO_JOB_PROCESSING,
    payload: {} as { jobId: string; script: string }, // Type template
  },
  VIDEO_JOB_COMPLETED: {
    topic: EVENT_TO_TOPIC.VIDEO_JOB_COMPLETED,
    payload: {} as { jobId: string; script: string }, // Type template
  },
  VIDEO_JOB_FAILED: {
    topic: EVENT_TO_TOPIC.VIDEO_JOB_FAILED,
    payload: {} as { jobId: string; script: string }, // Type template
  },

  VIDEO_ASSETS_GENERATED: {
    topic: EVENT_TO_TOPIC.VIDEO_ASSETS_GENERATED,
    payload: {} as { jobId: string; script: string }, // Type template
  },
} as const;
