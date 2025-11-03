"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Nav() {
  const [authed, setAuthed] = useState(false)
  useEffect(() => {
    setAuthed(!!localStorage.getItem('token'))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <nav className="w-full flex items-center justify-between p-4 border-b">
      <Link href="/" className="font-semibold">CampusConnect</Link>
      <div className="space-x-3">
        {!authed ? (
          <>
            <Link href="/login" className="text-primary">Login</Link>
            <Link href="/signup" className="bg-primary text-white px-3 py-1 rounded">Sign up</Link>
          </>
        ) : (
          <button onClick={logout} className="text-red-600">Logout</button>
        )}
      </div>
    </nav>
  )
}
