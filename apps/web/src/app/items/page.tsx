"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Item = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  category: string | null;
  location: string | null;
  created_at: string;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [search, category]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);
      params.set("status", "active");
      
const res = await axios.get(`/api/v1/items?${params}`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Lost & Found</h1>
          <Link href="/items/new">
            <Button>Report Item</Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All categories</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books</option>
            <option value="clothing">Clothing</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="hover:shadow-md transition cursor-pointer h-full">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-40 object-cover rounded-t-xl mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {item.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    {item.category && <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>}
                    {item.location && <span>📍 {item.location}</span>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

