"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Item = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  category: string | null;
  location: string | null;
  finder_id: string | null;
  created_at: string;
};

type Claim = {
  id: number;
  claimant_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingClaim, setUpdatingClaim] = useState<number | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchItem();
      fetchCurrentUser();
    }
  }, [params.id]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItem = async () => {
    try {
      const res = await axios.get(`/api/v1/items/${params.id}`);
      setItem(res.data);
      
      // Check if current user is the finder
      const token = localStorage.getItem("token");
      if (token && res.data.finder_id) {
        const userRes = await axios.get(`/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.data.id === res.data.finder_id) {
          setIsOwner(true);
          fetchClaims();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`/api/v1/items/${params.id}/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClaims(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setClaiming(true);
    try {
      await axios.post(
`/api/v1/items/${params.id}/claim`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Claim submitted!");
      setMessage("");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimUpdate = async (claimId: number, status: 'approved' | 'rejected' | 'pending') => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Confirmation for approve/reject
    if (status === 'approved' || status === 'rejected') {
      const action = status === 'approved' ? 'APPROVE' : 'REJECT';
      const warning = status === 'approved' 
        ? 'This will mark the item as claimed and auto-reject other pending claims. Continue?' 
        : 'Are you sure you want to reject this claim?';
      
      if (!confirm(`${action} this claim?\n\n${warning}`)) {
        return;
      }
    }
    
    setUpdatingClaim(claimId);
    try {
      await axios.patch(
        `/api/v1/items/${params.id}/claims/${claimId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh claims and item data
      fetchClaims();
      fetchItem();
      if (status !== 'pending') {
        alert(`Claim ${status}!`);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${status} claim`);
    } finally {
      setUpdatingClaim(null);
    }
  };

  if (loading) return <main className="min-h-screen p-8"><p>Loading...</p></main>;
  if (!item) return <main className="min-h-screen p-8"><p>Item not found</p></main>;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-primary mb-4">← Back</button>
        
        <Card className="p-6">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
            />
          )}
          
          <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {item.status}
            </span>
            {item.category && <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">{item.category}</span>}
          </div>

          {item.location && (
            <p className="text-gray-600 mb-4">📍 {item.location}</p>
          )}

          <p className="text-gray-700 mb-4 whitespace-pre-wrap">
            {item.description || "No description provided."}
          </p>

          <div className="text-sm text-gray-600 space-y-1 mb-6">
            <p>Posted by: <span className="font-medium">{(item as any).finder_name || "Anonymous"}</span></p>
            <p className="text-xs text-gray-400">on {new Date(item.created_at).toLocaleDateString()}</p>
          </div>

          {isOwner && claims.length > 0 && (
            <div className="border-t pt-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Claims ({claims.length})</h2>
              <div className="space-y-3">
                {claims.map((claim) => (
                  <Card key={claim.id} className="p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{(claim as any).claimant_name || `User ${claim.claimant_id.slice(0, 8)}`}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        claim.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    {claim.message && <p className="text-sm text-gray-700 mb-2">{claim.message}</p>}
                    <p className="text-xs text-gray-400 mb-3">{new Date(claim.created_at).toLocaleDateString()}</p>
                    
                    {claim.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleClaimUpdate(claim.id, 'approved')}
                          disabled={updatingClaim === claim.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleClaimUpdate(claim.id, 'rejected')}
                          disabled={updatingClaim === claim.id}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {(claim.status === 'approved' || claim.status === 'rejected') && (
                      <Button
                        onClick={() => handleClaimUpdate(claim.id, 'pending')}
                        disabled={updatingClaim === claim.id}
                        className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3"
                      >
                        ↺ Undo
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {item.status === "active" && !isOwner && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Claim this item</h2>
              <textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-3"
                rows={3}
              />
              <Button onClick={handleClaim} disabled={claiming}>
                {claiming ? "Submitting..." : "Submit Claim"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

