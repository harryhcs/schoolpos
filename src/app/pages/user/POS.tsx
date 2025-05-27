"use client";

import { useState, useTransition, useEffect } from "react";
import { getProducts, createSale, getSettings, getTodaysSales } from "./functions";
import { printReceipt, reprintLastReceipt } from "@/app/utils/printer";
import MainLayout from "@/app/layouts/MainLayout";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

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

const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaid, setAmountPaid] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [printError, setPrintError] = useState("");
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [todaysSales, setTodaysSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Load products and settings on mount
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Load products first
        const productsResponse = await getProducts();
        if (!isMounted) return;

        if (productsResponse.success && productsResponse.products) {
          setProducts(productsResponse.products);
        } else {
          setError(productsResponse.error || "Failed to load products");
        }

        // Then load settings
        const settingsResponse = await getSettings();
        if (!isMounted) return;

        if (settingsResponse.success && settingsResponse.settings) {
          setSettings(settingsResponse.settings);
        }
      } catch (error) {
        if (!isMounted) return;
        setError("Failed to load initial data");
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadProducts = async () => {
    const response = await getProducts();
    if (response.success && response.products) {
      setProducts(response.products);
    } else {
      setError(response.error || "Failed to load products");
    }
  };

  // Get settings values
  const getSetting = (key: string, defaultValue: string = "") => {
    return settings.find(s => s.key === key)?.value || defaultValue;
  };

  // Get currency symbol from settings
  const getCurrencySymbol = () => {
    return getSetting('currency', '$');
  };

  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return `${getCurrencySymbol()}${price.toFixed(2)}`;
  };

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setError("Not enough stock available");
          return currentCart;
        }
        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...currentCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, Math.min(quantity, item.product.stock)) }
          : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getChange = () => {
    const total = getTotal();
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - total);
  };

  const loadTodaysSales = async () => {
    setIsLoadingSales(true);
    try {
      const response = await getTodaysSales();
      if (response.success && response.sales) {
        setTodaysSales(response.sales);
      }
    } catch (error) {
      setError("Failed to load today's sales");
    } finally {
      setIsLoadingSales(false);
    }
  };

  const handleReprint = async (sale: Sale) => {
    setPrintError("");
    
    // Format receipt data
    const receiptItems = sale.items.map(item => ({
      name: item.product.name,
      price: `${formatPrice(item.price * item.quantity)}`
    }));

    // Get printer device ID and receipt details from settings
    const printerDeviceId = getSetting('printer_device_id', 'default');
    const schoolName = getSetting('school_name', 'School POS');
    const receiptTitle = getSetting('receipt_title', 'SALES RECEIPT');
    const receiptFooter = getSetting('receipt_footer', 'Thank you for your purchase!');

    // Print receipt
    const printResult = await printReceipt({
      deviceId: printerDeviceId,
      schoolName,
      title: receiptTitle,
      items: receiptItems,
      total: sale.total,
      footer: receiptFooter,
      saleDate: sale.createdAt
    });

    if (!printResult.success) {
      setPrintError(`Failed to print receipt: ${printResult.error}`);
    } else {
      setSuccess("Receipt printed successfully");
      setShowReprintModal(false);
    }
  };

  const handleSale = async () => {
    setError("");
    setSuccess("");
    setPrintError("");

    const total = getTotal();
    const paid = parseFloat(amountPaid);

    if (isNaN(paid) || paid < total) {
      setError("Insufficient payment");
      return;
    }

    const saleItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const response = await createSale(saleItems, paid);

    if (response.success && response.sale) {
      setLastSaleId(response.sale.id);
      // Format receipt data
      const receiptItems = cart.map(item => ({
        name: item.product.name,
        price: `${formatPrice(item.product.price * item.quantity)}`
      }));

      // Get printer device ID and receipt details from settings
      const printerDeviceId = getSetting('printer_device_id', 'default');
      const schoolName = getSetting('school_name', 'School POS');
      const receiptTitle = getSetting('receipt_title', 'SALES RECEIPT');
      const receiptFooter = getSetting('receipt_footer', 'Thank you for your purchase!');

      // Print receipt
      const printResult = await printReceipt({
        deviceId: printerDeviceId,
        schoolName,
        title: receiptTitle,
        items: receiptItems,
        total: total,
        footer: receiptFooter,
        saleDate: response.sale.createdAt
      });

      if (!printResult.success) {
        setPrintError(`Sale completed but failed to print receipt: ${printResult.error}`);
      }

      setSuccess("Sale completed successfully!");
      setCart([]);
      setAmountPaid("");
      loadProducts(); // Refresh product stock
      loadTodaysSales(); // Refresh today's sales
    } else {
      setError(response.error || "Failed to complete sale");
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <button
          onClick={() => {
            loadTodaysSales();
            setShowReprintModal(true);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reprint Receipt
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className={`p-3 border rounded-lg text-left ${
                  product.stock === 0
                    ? "bg-gray-100 text-gray-400"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium truncate">{product.name}</div>
                <div className="text-sm">{formatPrice(product.price)}</div>
                <div className="text-sm text-gray-500">
                  Stock: {product.stock}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Current Sale</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">No items in cart</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.product.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.product.price)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="px-2 py-1 bg-gray-100 rounded"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="px-2 py-1 bg-gray-100 rounded"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-2 text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold mb-4">
                  <span>Total:</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full p-2 border rounded"
                  />
                  {amountPaid && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Change:</span>
                      <span className={`ml-2 font-medium ${getChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPrice(getChange())}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSale}
                  disabled={isPending || cart.length === 0}
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Complete Sale"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {printError && (
        <div className="mt-4 p-2 bg-yellow-100 text-yellow-700 rounded flex justify-between items-center">
          <span>{printError}</span>
          {lastSaleId && (
            <button
              onClick={() => {
                const sale = todaysSales.find(s => s.id === lastSaleId);
                if (sale) handleReprint(sale);
              }}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Reprint Last Receipt
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Reprint Modal */}
      {showReprintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Today's Receipts</h2>
            </div>
            
            <div className="p-4">
              {isLoadingSales ? (
                <div className="text-center py-4">Loading receipts...</div>
              ) : todaysSales.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No sales today</div>
              ) : (
                <div className="space-y-2">
                  {todaysSales.map((sale) => (
                    <div key={sale.id}>
                      <div
                        onClick={() => setSelectedSale(selectedSale?.id === sale.id ? null : sale)}
                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">
                            {formatDateTime(sale.createdAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.items.length} items • {formatPrice(sale.total)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReprint(sale);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Print
                          </button>
                          <span className="text-gray-400">
                            {selectedSale?.id === sale.id ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      
                      {selectedSale?.id === sale.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                          <div className="space-y-2">
                            {sale.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.product.name}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                              <span>Total</span>
                              <span>{formatPrice(sale.total)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Cashier: {sale.user.username}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowReprintModal(false);
                  setSelectedSale(null);
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 