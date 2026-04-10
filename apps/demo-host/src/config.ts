export interface DemoHostConfig {
  host: string;
  port: number;
  serviceName: string;
  defaultServiceBaseUrl: string;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfig(): DemoHostConfig {
  return {
    host: process.env.DEMO_HOST_HOST ?? "0.0.0.0",
    port: readPort(process.env.DEMO_HOST_PORT, 3032),
    serviceName: "ed-support-ai-plug-demo-host",
    defaultServiceBaseUrl: process.env.DEMO_SERVICE_BASE_URL ?? "http://127.0.0.1:3031",
  };
}
