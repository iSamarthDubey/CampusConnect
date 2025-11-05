"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Removed auto-redirect to avoid UX loops

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });
      
      // Store token and user data
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      document.cookie = `token=${res.data.access_token}; Path=/; Max-Age=${7*24*60*60}; SameSite=Lax`;
      
      // Redirect to original destination or dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectTo);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg || JSON.stringify(e)).join(', '));
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm">
          No account? <a className="text-primary underline" href="/signup">Sign up</a>
        </p>
      </form>
    </main>
  );
}
