"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function NewItemPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImage(file);
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
`/api/v1/upload/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setImageUrl(res.data.url);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await axios.post(
`/api/v1/items`,
        {
          title,
          description,
          category,
          location,
          image_url: imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(`/items/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-primary mb-4">
          ← Back
        </button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Report Lost or Found Item</h1>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blue backpack"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details..."
                className="w-full border rounded px-3 py-2"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select category</option>
                <option value="electronics">Electronics</option>
                <option value="books">Books</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where was it found/lost?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="mt-3 w-full h-40 object-cover rounded"
                />
              )}
            </div>

            <Button type="submit" disabled={submitting || uploading} className="w-full">
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

