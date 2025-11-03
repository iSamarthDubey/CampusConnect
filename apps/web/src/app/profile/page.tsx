"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  role: string;
  verified: boolean;
};

type Profile = {
  name: string;
  roll_no: string | null;
  dept_id: number | null;
  phone: string | null;
  hostel: string | null;
  avatar_url: string | null;
};

type Item = {
  id: number;
  title: string;
  status: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    roll_no: "",
    dept_id: null as number | null,
    phone: "",
    hostel: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchMyItems();
    fetchMyClaims();
    fetchDepartments();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [userRes, profileRes] = await Promise.all([
        axios.get(`/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUser(userRes.data);
      setProfile(profileRes.data);
      setFormData({
        name: profileRes.data.name || "",
        roll_no: profileRes.data.roll_no || "",
        dept_id: profileRes.data.dept_id || null,
        phone: profileRes.data.phone || "",
        hostel: profileRes.data.hostel || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyItems = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = res.data.id;
      const itemsRes = await axios.get(`/api/v1/items`);
      const userItems = itemsRes.data.filter(
        (item: any) => item.finder_id === userId
      );
      setMyItems(userItems);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyClaims = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // Get all items and filter those with user's claims
      const res = await axios.get(`/api/v1/items`);
      const userId = user?.id;
      // This is a placeholder - ideally you'd have an endpoint for user's claims
      setMyClaims([]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`/api/v1/users/departments`);
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.patch(`/api/v1/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditing(false);
      fetchProfile();
      alert("Profile updated!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`/api/v1/upload/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update profile with new avatar URL
      await axios.patch(
        `/api/v1/users/profile`,
        { avatar_url: res.data.url },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchProfile();
      alert("Profile picture updated!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return <main className="min-h-screen p-8"><p>Loading...</p></main>;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Info Card */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {profile?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer hover:bg-primary-dark"
                >
                  📷
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile?.name || "Your Profile"}</h1>
                {uploadingAvatar && <p className="text-xs text-gray-500">Uploading...</p>}
              </div>
            </div>
            {!editing && (
              <Button onClick={() => setEditing(true)} className="text-sm">
                Edit Profile
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Roll Number</label>
                <input
                  type="text"
                  value={formData.roll_no}
                  onChange={(e) =>
                    setFormData({ ...formData, roll_no: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={formData.dept_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dept_id: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hostel</label>
                <input
                  type="text"
                  value={formData.hostel}
                  onChange={(e) =>
                    setFormData({ ...formData, hostel: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button
                  onClick={() => setEditing(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium">{profile?.name || "Not set"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Role:</span>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
              {profile?.roll_no && (
                <div>
                  <span className="text-sm text-gray-600">Roll Number:</span>
                  <p className="font-medium">{profile.roll_no}</p>
                </div>
              )}
              {profile?.phone && (
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
              {profile?.hostel && (
                <div>
                  <span className="text-sm text-gray-600">Hostel:</span>
                  <p className="font-medium">{profile.hostel}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* My Items */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Items ({myItems.length})</h2>
            <Link href="/items/new">
              <Button className="text-sm">+ New Item</Button>
            </Link>
          </div>
          {myItems.length === 0 ? (
            <p className="text-gray-500 text-sm">No items posted yet.</p>
          ) : (
            <div className="space-y-2">
              {myItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block p-3 border rounded hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* My Claims */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Claims ({myClaims.length})</h2>
          {myClaims.length === 0 ? (
            <p className="text-gray-500 text-sm">No claims submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {myClaims.map((claim: any) => (
                <div key={claim.id} className="p-3 border rounded">
                  <p className="font-medium">{claim.item_title}</p>
                  <p className="text-xs text-gray-500">
                    Status: {claim.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

