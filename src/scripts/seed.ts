import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";
import { env } from "cloudflare:workers";
import bcrypt from "bcryptjs";

export default defineScript(async () => {
  await setupDb(env);

  await db.$executeRawUnsafe(`\
    DELETE FROM User;
    DELETE FROM sqlite_sequence;
  `);

  const password = await bcrypt.hash("admin", 10);

  await db.user.create({
    data: {
      id: "1",
      username: "admin",
      role: "ADMIN",
      password: password,
      isActive: true,
      email: "admin@admin.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await db.product.create({
    data: {
      id: "1",
      name: "Chocolate Bar",
      price: 10,
      stock: 100,
    },
  });

  await db.settings.create({
    data: {
      id: "1",
      key: "currency",
      value: "R",
      description: "Currency symbol for prices",
      updatedAt: new Date(),
      updatedBy: "1",
    },
  });

  await db.settings.create({
    data: {
      id: "2",
      key: "printer_device_id",
      value: "",
      description: "Printer device ID",
      updatedAt: new Date(),
      updatedBy: "1",
    },
  });



  await db.settings.create({
    data: {
      id: "3",
      key: "receipt_footer",
      value: "Thank you for your purchase!",
      description: "Text to display at the bottom of receipts",
      updatedAt: new Date(),
      updatedBy: "1",
    },
  }); 

  await db.settings.create({
    data: {
      id: "4",
      key: "school_name",
      value: "RedwoodJS",
      description: "Name of the school",
      updatedAt: new Date(),
      updatedBy: "1",
    },
  });




  console.log("🌱 Finished seeding");
});
