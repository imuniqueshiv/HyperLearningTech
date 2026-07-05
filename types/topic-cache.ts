// types/topic-cache.ts

/**
 * Permanent cached answer for a syllabus topic.
 *
 * This cache represents the official Hyper AI response
 * for a specific topic and is stored in Redis.
 */
export interface TopicCache {
  /**
   * Stable syllabus topic identifier.
   * Example:
   * bt201-u4-v-number
   */
  topicId: string;

  /**
   * Generated markdown answer.
   */
  answer: string;

  /**
   * AI model used to generate the answer.
   */
  model: string;

  /**
   * ISO timestamp when this answer was generated.
   */
  generatedAt: string;

  /**
   * Cache schema/content version.
   *
   * Increment whenever prompt format changes
   * so old cache entries can be regenerated.
   */
  version: number;
}
