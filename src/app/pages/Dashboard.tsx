import { RequestInfo } from "rwsdk/worker";
import MainLayout from "../layouts/MainLayout";
import { getTodaysSales, getSettings } from "./user/functions";

type UserWithRole = {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
  role?: "ADMIN" | "MANAGER" | "WORKER";
};

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface Sale {
  id: string;
  total: number;
  amountPaid: number;
  change: number;
  createdAt: Date;
  items: {
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
  user: {
    username: string;
  };
}

export async function Dashboard({ ctx }: RequestInfo) {
  const user = ctx.user as UserWithRole | null;
  const role = user?.role || "WORKER";

  // Fetch sales data and settings on the server
  let sales: Sale[] = [];
  let settings: Setting[] = [];
  let error = "";
  
  if (user) {
    try {
      const [salesResponse, settingsResponse] = await Promise.all([
        getTodaysSales(),
        getSettings()
      ]);

      if (salesResponse.success && salesResponse.sales) {
        sales = salesResponse.sales;
      } else {
        error = salesResponse.error || "Failed to load sales data";
      }

      if (settingsResponse.success && settingsResponse.settings) {
        settings = settingsResponse.settings;
      }
    } catch (err) {
      error = "Failed to load data";
    }
  }

  const getWelcomeMessage = () => {
    if (!user) return "Welcome to School POS";
    return `Welcome, ${user.username}!`;
  };

  const getRoleDescription = () => {
    switch (role) {
      case "ADMIN":
        return "You have full access to manage products, users, and view reports.";
      case "MANAGER":
        return "You can process sales and view reports.";
      case "WORKER":
        return "You can process sales.";
      default:
        return "";
    }
  };

  // Get currency symbol from settings
  const getCurrencySymbol = () => {
    return settings.find(s => s.key === 'currency')?.value || '$';
  };

  // Format price with currency symbol from settings
  const formatPrice = (price: number) => {
    return `${getCurrencySymbol()}${price.toFixed(2)}`;
  };

  // Calculate metrics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalItems = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{getWelcomeMessage()}</h1>
          <p className="text-gray-600">{getRoleDescription()}</p>
        </div>

        {user && (
          <>
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Sales Today</h3>
                <p className="text-2xl font-bold mt-1">{formatPrice(totalSales)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                <p className="text-2xl font-bold mt-1">{totalTransactions}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Average Transaction</h3>
                <p className="text-2xl font-bold mt-1">{formatPrice(averageTransaction)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Items Sold</h3>
                <p className="text-2xl font-bold mt-1">{totalItems}</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
              </div>
              <div className="p-4">
                {error ? (
                  <div className="text-center py-4 text-red-600">{error}</div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No transactions today</div>
                ) : (
                  <div className="space-y-4">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.items.length} items • Cashier: {sale.user.username}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatPrice(sale.total)}</div>
                          <div className="text-sm text-gray-500">
                            Paid: {formatPrice(sale.amountPaid)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* POS Link - Available to all roles */}
          <a
            href="/user/pos"
            className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow block"
          >
            <h2 className="text-xl font-semibold mb-2">Point of Sale</h2>
            <p className="text-gray-600">Process sales and manage transactions</p>
          </a>

          {/* Products Link - Admin only */}
          {role === "ADMIN" && (
            <a
              href="/user/products"
              className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold mb-2">Products</h2>
              <p className="text-gray-600">Manage inventory and product details</p>
            </a>
          )}

          {/* Reports Link - Admin and Manager */}
          {(role === "ADMIN" || role === "MANAGER") && (
            <a
              href="/user/reports"
              className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold mb-2">Reports</h2>
              <p className="text-gray-600">View sales reports and analytics</p>
            </a>
          )}

          {/* Settings Link - Admin only */}
          {role === "ADMIN" && (
            <a
              href="/user/settings"
              className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold mb-2">Settings</h2>
              <p className="text-gray-600">Configure system settings and preferences</p>
            </a>
          )}

          {/* Users Link - Admin only */}
          {role === "ADMIN" && (
            <a
              href="/user/users"
              className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow block"
            >
              <h2 className="text-xl font-semibold mb-2">Users</h2>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </a>
          )}
        </div>

        {!user && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Please log in to access the system</p>
            <a
              href="/user/login"
              className="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
