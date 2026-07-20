import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Parse DATABASE_URL into connection config
function parseConnectionUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1), // remove leading /
  };
}

const connectionConfig = parseConnectionUrl(process.env.DATABASE_URL!);

const adapter = new PrismaMariaDb({
  ...connectionConfig,
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
