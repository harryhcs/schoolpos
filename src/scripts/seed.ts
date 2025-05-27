import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";
import { env } from "cloudflare:workers";

export default defineScript(async () => {
  await setupDb(env);

  await db.$executeRawUnsafe(`\
    DELETE FROM User;
    DELETE FROM sqlite_sequence;
  `);

  await db.user.create({
    data: {
      id: "1",
      username: "herman",
      role: "ADMIN",
      password: "123456",
      isActive: true,
      email: "herman@gmail.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("🌱 Finished seeding");
});
