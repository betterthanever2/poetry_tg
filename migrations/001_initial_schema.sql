-- Enable the pgvector extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- USERS TABLE (For Admin Authentication)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- CHANNELS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id VARCHAR(255) UNIQUE, -- Internal Telegram ID if available
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    description TEXT,
    subscribers INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- POSTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    telegram_message_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    views INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Vector embedding column for semantic search (assuming Google's text-embedding-004 768 dimensions)
    embedding vector(768),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure we don't insert duplicate messages from the same channel
    UNIQUE(channel_id, telegram_message_id)
);

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INDEXES
-- ==========================================

-- Index for faster channel lookups
CREATE INDEX idx_posts_channel_id ON posts(channel_id);

-- Index for sorting by published date (very common for feeds)
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);

-- HNSW Index for fast vector similarity search (requires pgvector 0.5.0+)
-- Using cosine distance (vector_cosine_ops) which is recommended for embeddings
CREATE INDEX idx_posts_embedding ON posts USING hnsw (embedding vector_cosine_ops);
