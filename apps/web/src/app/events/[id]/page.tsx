"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Event {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  venue?: string;
  organizer_id?: string;
  organizer_name?: string;
  tags?: string[];
  max_attendees?: number;
  attendee_count: number;
  is_rsvped: boolean;
  created_at: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchEvent();
  }, [eventId]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUserId(user.id);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
    }
  };

  const fetchEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      } else if (res.status === 404) {
        setError("Event not found");
      } else {
        setError("Failed to load event");
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setRsvping(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/rsvp`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        fetchEvent(); // Refresh event data
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to RSVP");
      }
    } catch (error) {
      setError("Failed to RSVP");
    } finally {
      setRsvping(false);
    }
  };

  const handleCancelRSVP = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setRsvping(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/rsvp`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        fetchEvent(); // Refresh event data
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to cancel RSVP");
      }
    } catch (error) {
      setError("Failed to cancel RSVP");
    } finally {
      setRsvping(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        router.push("/events");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to delete event");
      }
    } catch (error) {
      setError("Failed to delete event");
    }
  };

  const downloadICS = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/ics`,
      "_blank"
    );
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <Link
            href="/events"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const canEdit =
    currentUserId &&
    (event.organizer_id === currentUserId || userRole === "admin");
  const isFull = event.max_attendees && event.attendee_count >= event.max_attendees;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          ← Back to Events
        </Link>

        {/* Event Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            {event.is_rsvped && (
              <div className="inline-block px-3 py-1 bg-white text-blue-600 text-sm font-semibold rounded-full mb-4">
                ✓ You're Attending
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {event.title}
            </h1>
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Event Details */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <span className="text-3xl">📅</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Date & Time</h3>
                  <p className="text-gray-700">{formatDateTime(event.start_time)}</p>
                  {event.end_time && (
                    <p className="text-gray-600 text-sm">
                      Ends: {formatDateTime(event.end_time)}
                    </p>
                  )}
                </div>
              </div>

              {event.venue && (
                <div className="flex items-start gap-4">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Venue</h3>
                    <p className="text-gray-700">{event.venue}</p>
                  </div>
                </div>
              )}

              {event.organizer_name && (
                <div className="flex items-start gap-4">
                  <span className="text-3xl">👤</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Organized By</h3>
                    <p className="text-gray-700">{event.organizer_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <span className="text-3xl">👥</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Attendees</h3>
                  <p className="text-gray-700">
                    {event.attendee_count}
                    {event.max_attendees && ` / ${event.max_attendees}`} attending
                  </p>
                  {isFull && !event.is_rsvped && (
                    <p className="text-red-600 text-sm mt-1">Event is full</p>
                  )}
                </div>
              </div>

              {event.description && (
                <div className="flex items-start gap-4">
                  <span className="text-3xl">📝</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {event.is_rsvped ? (
                <button
                  onClick={handleCancelRSVP}
                  disabled={rsvping}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {rsvping ? "Cancelling..." : "Cancel RSVP"}
                </button>
              ) : (
                <button
                  onClick={handleRSVP}
                  disabled={rsvping || isFull}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rsvping
                    ? "RSVPing..."
                    : isFull
                    ? "Event Full"
                    : "RSVP to Event"}
                </button>
              )}

              <button
                onClick={downloadICS}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                📥 Add to Calendar
              </button>

              {canEdit && (
                <>
                  <Link
                    href={`/events/${eventId}/edit`}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

