"use client";

import { useState, useTransition, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct, getProducts } from "./functions";
import MainLayout from "@/app/layouts/MainLayout";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
  });
  const [isImporting, setIsImporting] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const response = await getProducts();
    if (response.success) {
      setProducts(response.products);
    } else {
      setError(response.error || "Failed to load products");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);

    if (isNaN(price) || isNaN(stock)) {
      setError("Please enter valid numbers for price and stock");
      return;
    }

    if (editingProduct) {
      const response = await updateProduct(editingProduct.id, {
        name: formData.name,
        price,
        stock,
      });
      if (response.success) {
        setEditingProduct(null);
        loadProducts();
        setSuccess("Product updated successfully");
      } else {
        setError(response.error || "Failed to update product");
      }
    } else {
      const response = await createProduct(formData.name, price, stock);
      if (response.success) {
        loadProducts();
        setSuccess("Product created successfully");
      } else {
        setError(response.error || "Failed to create product");
      }
    }

    setFormData({ name: "", price: "", stock: "" });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
  };

  const handleDelete = async (id: string) => {
    const response = await deleteProduct(id);
    if (response.success) {
      loadProducts();
      setSuccess("Product deleted successfully");
    } else {
      setError(response.error || "Failed to delete product");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      
      // Skip header row
      const dataRows = rows.slice(1);
      
      let successCount = 0;
      let errorCount = 0;

      for (const row of dataRows) {
        const [name, price, stock] = row.split(',').map(field => field.trim());
        
        if (!name || !price || !stock) {
          errorCount++;
          continue;
        }

        const priceNum = parseFloat(price);
        const stockNum = parseInt(stock);

        if (isNaN(priceNum) || isNaN(stockNum)) {
          errorCount++;
          continue;
        }

        const response = await createProduct(name, priceNum, stockNum);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      await loadProducts();
      
      if (successCount > 0) {
        setSuccess(`Successfully imported ${successCount} products${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        setError(`Failed to import products. Please check your CSV format.`);
      }
    } catch (err) {
      setError("Failed to process CSV file. Please ensure it's properly formatted.");
    } finally {
      setIsImporting(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Product Management</h1>
          <div className="flex gap-2">
            <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
            </label>
            <a
              href="/sample-products.csv"
              download
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Download Sample CSV
            </a>
          </div>
        </div>
      
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Product Name"
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Price"
              className="p-2 border rounded"
              step="0.01"
              required
            />
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="Stock"
              className="p-2 border rounded"
              required
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isPending}
            >
              {editingProduct ? "Update Product" : "Add Product"}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({ name: "", price: "", stock: "" });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        {isImporting && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">
            Importing products...
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-2">{product.name}</td>
                  <td className="px-4 py-2 text-right">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{product.stock}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
} 