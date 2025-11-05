"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [rollNo, setRollNo] = useState("");
  const [rollAvailable, setRollAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Removed auto-redirect to avoid getting stuck
  useEffect(() => {
    const check = async () => {
      if (role === "student" && rollNo.trim().length > 0) {
        try {
          const res = await axios.get(`${API_BASE}/auth/check-roll/${encodeURIComponent(rollNo)}`);
          setRollAvailable(res.data.available);
        } catch {
          setRollAvailable(null);
        }
      } else {
        setRollAvailable(null);
      }
    };
    const id = setTimeout(check, 400);
    return () => clearTimeout(id);
  }, [rollNo, role, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/auth/signup`, {
        name,
        email,
        password,
        role,
        roll_no: role === "student" ? rollNo : null,
      });
      
      // Store token and user data
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      document.cookie = `token=${res.data.access_token}; Path=/; Max-Age=${7*24*60*60}; SameSite=Lax`;
      router.replace('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg || JSON.stringify(e)).join(', '));
      } else {
        setError("Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign up</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          {role === "faculty" && (
            <p className="text-xs text-gray-600 mt-1">
              Faculty must use official college email domain
            </p>
          )}
        </div>
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
        {role === "student" && (
          <div>
            <input
              type="text"
              placeholder="Roll number"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            {rollAvailable === true && (
              <p className="text-green-600 text-xs mt-1">Roll number available</p>
            )}
            {rollAvailable === false && (
              <p className="text-red-600 text-xs mt-1">Already registered</p>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || (role === "student" && rollAvailable === false)}
          className="w-full bg-primary text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
        <p className="text-sm">
          Already have an account? <a className="text-primary underline" href="/login">Login</a>
        </p>
      </form>
    </main>
  );
}
