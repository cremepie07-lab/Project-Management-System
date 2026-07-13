import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma 7 dùng URL này (không phải pooled) khi chạy migrate/generate.
    // Nếu bạn có DIRECT_URL riêng (không qua pooler), dùng nó ở đây để migrate ổn định hơn.
    url: env("DIRECT_URL") ?? env("DATABASE_URL"),
  },
});