import { bunLogger } from "../utils/logger";
import { db } from "./db.service";
import { rabbitMQService } from "./rabbitmq.service";
import { sql } from "drizzle-orm";

interface DatabaseMetrics {
  status: "ok" | "degraded" | "down";
  responseTime: number;

  connections: {
    active: number;
    idle: number;
    total: number;
  };
}

interface RabbitMQMetrics {
  status: "ok" | "down" | "not_configured";
  connected: boolean;
}

interface ServiceMetrics {
  version: string;
  environment: string;
  startTime: string;
  uptime: number;
}

interface HealthStatus {
  status: "ok" | "degraded" | "down";
  service: ServiceMetrics;
  database: DatabaseMetrics;
  rabbitmq: RabbitMQMetrics;
  lastChecked: string;
}

const startTime = new Date();

const getDatabaseMetrics = async (): Promise<DatabaseMetrics> => {
  try {
    const startTime = Date.now();

    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - startTime;

    const poolStats = await db
      .execute(
        sql`
      SELECT 
        count(*) FILTER (WHERE state = 'active')::int as active,
        count(*) FILTER (WHERE state = 'idle')::int as idle,
        count(*)::int as total
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `
      )
      .then((result) => ({
        active: Number(result.rows[0]?.active || 0),
        idle: Number(result.rows[0]?.idle || 0),
        total: Number(result.rows[0]?.total || 0),
      }));

    return {
      status: responseTime < 500 ? "ok" : "degraded",
      responseTime,
      connections: {
        active: poolStats.active,
        idle: poolStats.idle,
        total: poolStats.total,
      },
    };
  } catch (error) {
    bunLogger.error("getDatabaseMetrics error", { context: { error } });
    return {
      status: "down",
      responseTime: -1,
      connections: {
        active: 0,
        idle: 0,
        total: 0,
      },
    };
  }
};

const getRabbitMQMetrics = async (): Promise<RabbitMQMetrics> => {
  try {
    // Only check if RABBITMQ_URL is configured
    if (!process.env.RABBITMQ_URL) {
      return {
        status: "not_configured",
        connected: false,
      };
    }

    const isHealthy = await rabbitMQService.checkHealth();
    return {
      status: isHealthy ? "ok" : "down",
      connected: isHealthy,
    };
  } catch (error) {
    bunLogger.error("getRabbitMQMetrics error", { context: { error } });
    return {
      status: "down",
      connected: false,
    };
  }
};

const getServiceMetrics = (): ServiceMetrics => {
  return {
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    startTime: startTime.toISOString(),
    uptime: Math.round((Date.now() - startTime.getTime()) / 1000),
  };
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  try {
    const dbMetrics = await getDatabaseMetrics();
    const rabbitMQMetrics = await getRabbitMQMetrics();
    const serviceMetrics = getServiceMetrics();

    let overallStatus: "ok" | "degraded" | "down" = "ok";

    if (dbMetrics.status === "down" || rabbitMQMetrics.status === "down") {
      overallStatus = "down";
    } else if (dbMetrics.status === "degraded") {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      service: serviceMetrics,
      database: dbMetrics,
      rabbitmq: rabbitMQMetrics,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    bunLogger.error("getHealthStatus error", { context: { error } });
    throw error;
  }
};
