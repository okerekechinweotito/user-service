import amqp from "amqplib";
import { bunLogger } from "../utils/logger";

class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private readonly url: string;

  constructor() {
    this.url =
      process.env.RABBITMQ_URL ||
      "amqp://admin:secretpassword@rabbitmq:5672/%2F";
  }

  /**
   * Connect to RabbitMQ and create a channel
   */
  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      bunLogger.info("Connected to RabbitMQ", {
        context: {
          url: this.url.replace(/:[^:@]+@/, ":***@"), // mask password
        },
      });

      // Handle connection errors
      this.connection.on("error", (err: Error) => {
        bunLogger.error("RabbitMQ connection error", {
          context: { error: err },
        });
      });

      this.connection.on("close", () => {
        bunLogger.warn("RabbitMQ connection closed");
      });
    } catch (error) {
      bunLogger.error("Failed to connect to RabbitMQ", { context: { error } });
      throw error;
    }
  }

  /**
   * Get the current channel (creates connection if needed)
   */
  async getChannel(): Promise<any> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel!;
  }

  /**
   * Publish a message to an exchange
   */
  async publish(
    exchange: string,
    routingKey: string,
    message: object | string
  ): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      await channel.assertExchange(exchange, "topic", { durable: true });

      const messageBuffer = Buffer.from(
        typeof message === "string" ? message : JSON.stringify(message)
      );

      const published = channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        contentType: "application/json",
      });

      bunLogger.info("Published message to RabbitMQ", {
        context: { exchange, routingKey },
      });

      return published;
    } catch (error) {
      bunLogger.error("Failed to publish message", {
        context: { error, exchange, routingKey },
      });
      throw error;
    }
  }

  /**
   * Send a message to a queue
   */
  async sendToQueue(queue: string, message: object | string): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      await channel.assertQueue(queue, { durable: true });

      const messageBuffer = Buffer.from(
        typeof message === "string" ? message : JSON.stringify(message)
      );

      const sent = channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        contentType: "application/json",
      });

      bunLogger.info("Sent message to queue", { context: { queue } });

      return sent;
    } catch (error) {
      bunLogger.error("Failed to send message to queue", {
        context: { error, queue },
      });
      throw error;
    }
  }

  /**
   * Consume messages from a queue
   */
  async consume(
    queue: string,
    onMessage: (message: any) => void | Promise<void>
  ): Promise<void> {
    try {
      const channel = await this.getChannel();
      await channel.assertQueue(queue, { durable: true });

      await channel.consume(queue, async (msg: any) => {
        if (msg) {
          try {
            const content = msg.content.toString();
            const parsedMessage = JSON.parse(content);
            await onMessage(parsedMessage);
            channel.ack(msg);
          } catch (error) {
            bunLogger.error("Error processing message", {
              context: { error, queue },
            });
            channel.nack(msg, false, false);
          }
        }
      });

      bunLogger.info("Started consuming from queue", { context: { queue } });
    } catch (error) {
      bunLogger.error("Failed to consume from queue", {
        context: { error, queue },
      });
      throw error;
    }
  }

  /**
   * Check RabbitMQ connection health
   */
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.connection || !this.channel) {
        return false;
      }
      // Try to check a queue to verify channel is alive
      await this.channel.checkQueue("health-check-queue").catch(() => {
        // Queue might not exist, that's ok
      });
      return true;
    } catch (error) {
      bunLogger.error("RabbitMQ health check failed", { context: { error } });
      return false;
    }
  }

  /**
   * Close the connection gracefully
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      bunLogger.info("Closed RabbitMQ connection");
    } catch (error) {
      bunLogger.error("Error closing RabbitMQ connection", {
        context: { error },
      });
    }
  }
}

// Export a singleton instance
export const rabbitMQService = new RabbitMQService();
