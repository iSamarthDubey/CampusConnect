"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Schedule {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  venue?: string;
  created_at: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

export default function TimetablePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this class?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const renderScheduleBlock = (schedule: Schedule, dayIndex: number) => {
    const startMinutes = timeToMinutes(schedule.start_time);
    const endMinutes = timeToMinutes(schedule.end_time);
    const duration = endMinutes - startMinutes;

    // Position from 8 AM (480 minutes)
    const top = ((startMinutes - 480) / 60) * 60; // 60px per hour
    const height = (duration / 60) * 60;

    return (
      <div
        key={schedule.id}
        className="absolute left-0 right-0 mx-1 bg-blue-500 text-white rounded p-2 overflow-hidden cursor-pointer hover:bg-blue-600 transition"
        style={{
          top: `${top}px`,
          height: `${height}px`,
          minHeight: "40px",
        }}
        onClick={() => setEditingSchedule(schedule)}
      >
        <div className="text-xs font-semibold">{schedule.title}</div>
        <div className="text-xs opacity-90">
          {schedule.start_time} - {schedule.end_time}
        </div>
        {schedule.venue && <div className="text-xs opacity-75">{schedule.venue}</div>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading timetable...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">My Timetable</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingSchedule(null);
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Add Class
            </button>
            <Link
              href="/timetable/free-slots"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-center"
            >
              🔍 Find Free Slots
            </Link>
          </div>
        </div>

        {/* Weekly Grid View */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header Row */}
              <div className="flex border-b bg-gray-50">
                <div className="w-16 flex-shrink-0 p-2 text-xs font-semibold text-gray-600">
                  Time
                </div>
                {DAYS.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex-1 min-w-[120px] p-2 text-center text-sm font-semibold text-gray-700 border-l"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="flex">
                {/* Time Column */}
                <div className="w-16 flex-shrink-0">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-[60px] border-b p-1 text-xs text-gray-500">
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {DAYS.map((day, dayIndex) => {
                  const daySchedules = schedules.filter((s) => s.day_of_week === dayIndex);

                  return (
                    <div
                      key={dayIndex}
                      className="flex-1 min-w-[120px] border-l relative"
                    >
                      {HOURS.map((hour) => (
                        <div key={hour} className="h-[60px] border-b" />
                      ))}
                      {/* Schedule Blocks */}
                      <div className="absolute top-0 left-0 right-0">
                        {daySchedules.map((schedule) =>
                          renderScheduleBlock(schedule, dayIndex)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {schedules.length === 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No classes scheduled
            </h3>
            <p className="text-gray-600 mb-6">
              Add your classes to see them on the timetable
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Add Your First Class
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingSchedule) && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => {
            setShowAddModal(false);
            setEditingSchedule(null);
          }}
          onSave={() => {
            fetchSchedules();
            setShowAddModal(false);
            setEditingSchedule(null);
          }}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

// Modal Component
interface ScheduleModalProps {
  schedule: Schedule | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: number) => void;
}

function ScheduleModal({ schedule, onClose, onSave, onDelete }: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    day_of_week: schedule?.day_of_week ?? 1,
    start_time: schedule?.start_time ?? "09:00",
    end_time: schedule?.end_time ?? "10:00",
    title: schedule?.title ?? "",
    venue: schedule?.venue ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const url = schedule
        ? `${process.env.NEXT_PUBLIC_API_URL}/schedules/${schedule.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/schedules`;

      const method = schedule ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to save schedule");
      }
    } catch (error) {
      setError("Failed to save schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {schedule ? "Edit Class" : "Add Class"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Day *
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) =>
                setFormData({ ...formData, day_of_week: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Data Structures Lab"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Venue
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Room 101"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            {schedule && (
              <button
                type="button"
                onClick={() => onDelete(schedule.id)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

