# Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys to `.env` files
3. Run the schema:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `schema.sql` and execute
4. Enable pgvector extension (already in schema)
5. Configure Storage bucket:
   - Create bucket: `lost_items` (public read, authenticated write)
   - Create bucket: `avatars` (public read, authenticated write)
6. Configure Auth:
   - Enable Email provider
   - Enable Google OAuth (optional, add client ID/secret)
   - Set site URL to your frontend URL

## RLS Policies
The schema includes basic RLS policies. You'll need to add more as you implement features:
- Students can CRUD their own items, claims, schedules
- Faculty can moderate items, create events
- Admin can manage users, departments, sections

## Storage Policies
Add policies in Supabase Storage settings:
```sql
-- Allow authenticated users to upload to lost_items
CREATE POLICY "Authenticated users can upload items"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lost_items');

-- Allow public read
CREATE POLICY "Public can view items"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lost_items');
```

