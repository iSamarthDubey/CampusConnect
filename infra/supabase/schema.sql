-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections table
CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    dept_id INT REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    year INT NOT NULL CHECK (year >= 1 AND year <= 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dept_id, name, year)
);

-- Users table (auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (extended user info)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    roll_no TEXT UNIQUE,  -- for students (enforced unique, first-claim)
    dept_id INT REFERENCES departments(id),
    section_id INT REFERENCES sections(id),
    hostel TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost & Found items
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved')),
    category TEXT,  -- electronics, books, clothing, etc.
    location TEXT,  -- where found/lost
    finder_id UUID REFERENCES users(id),
    claimant_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    embedding vector(512)  -- image/text embedding for similarity search
);

-- Item claims
CREATE TABLE item_claims (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    claimant_id UUID REFERENCES users(id),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    venue TEXT,
    organizer_id UUID REFERENCES users(id),
    tags TEXT[],
    max_attendees INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVPs
CREATE TABLE rsvps (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

-- Schedules (timetable slots)
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Sun, 6=Sat
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title TEXT NOT NULL,  -- e.g., "Data Structures Lab"
    venue TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback tokens (anonymous one-time use)
CREATE TABLE feedback_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,  -- facility, course, etc.
    issued_by UUID REFERENCES users(id),
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback submissions
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    token_id UUID REFERENCES feedback_tokens(id),
    category TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_embedding ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_profiles_roll_no ON profiles(roll_no) WHERE roll_no IS NOT NULL;
CREATE INDEX idx_users_email ON users(email);

-- RLS policies (basic setup, to be refined)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_tokens ENABLE ROW LEVEL SECURITY;

-- Example RLS policy: users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Seed data for departments (example)
INSERT INTO departments (name, code) VALUES 
    ('Computer Science', 'CS'),
    ('Electronics', 'EC'),
    ('Mechanical', 'ME'),
    ('Civil', 'CE');

-- Seed sections (example: CS Year 1, Section A)
INSERT INTO sections (dept_id, name, year) VALUES 
    (1, 'A', 1),
    (1, 'B', 1),
    (1, 'A', 2);

