import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">CampusConnect</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your all-in-one smart campus assistant for managing lost items, events, timetables, and feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition shadow-lg hover:shadow-xl"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Everything You Need in One Place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Lost & Found</h3>
              <p className="text-gray-600">
                Report lost items or help others find theirs. Upload images and track claims easily.
              </p>
            </div>

            <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Campus Events</h3>
              <p className="text-gray-600">
                Stay updated with all campus events, RSVP, and export to your calendar.
              </p>
            </div>

            <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Timetable</h3>
              <p className="text-gray-600">
                Organize your classes and schedule with our smart timetable optimizer.
              </p>
            </div>

            <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Feedback</h3>
              <p className="text-gray-600">
                Share your thoughts anonymously and help improve campus life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join your campus community today and experience seamless campus management.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </main>
  );
}

