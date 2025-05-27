"use server";
import { sessions } from "@/session/store";
import { requestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { env } from "cloudflare:workers";
import * as bcrypt from "bcryptjs";

export async function registerUser(username: string, password: string) {
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { success: false, error: "Username already exists" };
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user
  const user = await db.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  return { success: true, userId: user.id };
}

export async function loginUser(username: string, password: string) {
  const { headers } = requestInfo;

  // Find the user
  const user = await db.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return { success: false, error: "Invalid username or password" };
  }

  // Save user session
  await sessions.save(headers, {
    userId: user.id,
  });

  return { success: true, userId: user.id };
}

export async function logoutUser() {
  const { headers } = requestInfo;
  await sessions.save(headers, { userId: null });
  return { success: true };
}

export async function createProduct(name: string, price: number, stock: number) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const product = await db.product.create({
      data: {
        name,
        price,
        stock,
      },
    });
    return { success: true, product };
  } catch (error) {
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(id: string, data: { name?: string; price?: number; stock?: number }) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const product = await db.product.update({
      where: { id },
      data,
    });
    return { success: true, product };
  } catch (error) {
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    await db.product.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete product" };
  }
}

export async function getProducts() {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const products = await db.product.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, products };
  } catch (error) {
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function createSale(items: { productId: string; quantity: number }[], amountPaid: number) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || !["ADMIN", "MANAGER", "WORKER"].includes(ctx.user.role)) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // First, validate all products and calculate total
    const products = await db.product.findMany({
      where: {
        id: {
          in: items.map(item => item.productId)
        }
      }
    });

    // Validate all products exist
    if (products.length !== items.length) {
      return { success: false, error: "One or more products not found" };
    }

    // Calculate total and validate stock
    let total = 0;
    const saleItems = [];
    const stockUpdates = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        return { success: false, error: `Not enough stock for ${product.name}` };
      }

      total += product.price * item.quantity;
      saleItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });

      stockUpdates.push(
        db.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        })
      );
    }

    if (amountPaid < total) {
      return { success: false, error: "Insufficient payment" };
    }

    const change = amountPaid - total;

    // Create the sale and update stock in a batch transaction
    const [sale] = await db.$transaction([
      db.sale.create({
        data: {
          total,
          amountPaid,
          change,
          userId: ctx.user.id,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      ...stockUpdates
    ]);

    return { success: true, sale };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create sale" };
  }
}

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || !["ADMIN", "MANAGER"].includes(ctx.user.role)) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const where = {
      ...(startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    };

    const sales = await db.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    return {
      success: true,
      report: {
        sales,
        totalSales,
        totalItems,
        period: {
          start: startDate,
          end: endDate,
        },
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to generate sales report" };
  }
}

// Settings Management
export async function getSettings() {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const settings = await db.settings.findMany({
      orderBy: { key: 'asc' },
    });
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: "Failed to fetch settings" };
  }
}

export async function updateSetting(key: string, value: string, description?: string) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const setting = await db.settings.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedBy: ctx.user.id,
      },
      create: {
        key,
        value,
        description,
        updatedBy: ctx.user.id,
      },
    });
    return { success: true, setting };
  } catch (error) {
    return { success: false, error: "Failed to update setting" };
  }
}

// User Management
export async function getUsers() {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { username: 'asc' },
    });
    return { success: true, users };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createUser(username: string, password: string, role: "ADMIN" | "MANAGER" | "WORKER", email?: string) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        email,
      },
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(id: string, data: { email?: string; role?: "ADMIN" | "MANAGER" | "WORKER"; isActive?: boolean; password?: string }) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || ctx.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const updateData: any = { ...data };
    
    // If password is provided, hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

export async function getSaleDetails(saleId: string) {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || !["ADMIN", "MANAGER", "WORKER"].includes(ctx.user.role)) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!sale) {
      return { success: false, error: "Sale not found" };
    }

    return { success: true, sale };
  } catch (error) {
    return { success: false, error: "Failed to get sale details" };
  }
}

export async function getTodaysSales() {
  const { ctx } = requestInfo;
  
  if (!ctx.user?.id || !["ADMIN", "MANAGER", "WORKER"].includes(ctx.user.role)) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await db.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, sales };
  } catch (error) {
    return { success: false, error: "Failed to fetch today's sales" };
  }
}
