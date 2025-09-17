-- Complete PostgreSQL initialization script for INNKT Platform
-- This script creates all required users, databases, and schemas

-- Create the admin_officer user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin_officer') THEN
        CREATE ROLE admin_officer WITH LOGIN PASSWORD 'CAvp57rt26' SUPERUSER CREATEDB CREATEROLE;
    END IF;
END
$$;

-- Create the innkt_user for Social service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'innkt_user') THEN
        CREATE ROLE innkt_user WITH LOGIN PASSWORD 'CAvp57rt26' CREATEDB;
    END IF;
END
$$;

-- Create the innkt_groups_user for Groups service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'innkt_groups_user') THEN
        CREATE ROLE innkt_groups_user WITH LOGIN PASSWORD 'CAvp57rt26' CREATEDB;
    END IF;
END
$$;

-- Create the innkt_follow_user for Follow service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'innkt_follow_user') THEN
        CREATE ROLE innkt_follow_user WITH LOGIN PASSWORD 'CAvp57rt26' CREATEDB;
    END IF;
END
$$;

-- Create databases
SELECT 'CREATE DATABASE innkt_officer OWNER admin_officer' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'innkt_officer')\gexec

SELECT 'CREATE DATABASE innkt_social OWNER innkt_user' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'innkt_social')\gexec

SELECT 'CREATE DATABASE innkt_groups OWNER innkt_groups_user' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'innkt_groups')\gexec

SELECT 'CREATE DATABASE innkt_follow OWNER innkt_follow_user' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'innkt_follow')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE innkt_officer TO admin_officer;
GRANT ALL PRIVILEGES ON DATABASE innkt_social TO innkt_user;
GRANT ALL PRIVILEGES ON DATABASE innkt_groups TO innkt_groups_user;
GRANT ALL PRIVILEGES ON DATABASE innkt_follow TO innkt_follow_user;

-- Connect to innkt_officer database and create schema
\c innkt_officer;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create users table (Identity only)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    location VARCHAR(100),
    website VARCHAR(255),
    birth_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_private BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user profiles table (Extended identity information)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    country VARCHAR(100),
    timezone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(10) DEFAULT '12h',
    notification_preferences JSONB,
    privacy_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create kid accounts table (Parental controls)
CREATE TABLE IF NOT EXISTS kid_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kid_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    restrictions JSONB, -- Age-appropriate content restrictions
    allowed_features TEXT[], -- Features the kid can access
    blocked_features TEXT[], -- Features blocked for the kid
    daily_time_limit INTEGER DEFAULT 0, -- Minutes per day
    bedtime_start TIME,
    bedtime_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kid_user_id)
);

-- Create joint accounts table (Family accounts)
CREATE TABLE IF NOT EXISTS joint_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(100) NOT NULL,
    primary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create joint account members table
CREATE TABLE IF NOT EXISTS joint_account_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    joint_account_id UUID NOT NULL REFERENCES joint_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(joint_account_id, user_id)
);

-- Create user verification table
CREATE TABLE IF NOT EXISTS user_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'identity', 'address'
    verification_token VARCHAR(255),
    verification_code VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user login attempts table (Security)
CREATE TABLE IF NOT EXISTS user_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user security events table (Audit log)
CREATE TABLE IF NOT EXISTS user_security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'password_change', '2fa_enabled', etc.
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_language ON user_profiles(language);

CREATE INDEX IF NOT EXISTS idx_kid_accounts_kid_user_id ON kid_accounts(kid_user_id);
CREATE INDEX IF NOT EXISTS idx_kid_accounts_parent_user_id ON kid_accounts(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_kid_accounts_is_active ON kid_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_joint_accounts_primary_user_id ON joint_accounts(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_joint_accounts_is_active ON joint_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_joint_account_members_joint_account_id ON joint_account_members(joint_account_id);
CREATE INDEX IF NOT EXISTS idx_joint_account_members_user_id ON joint_account_members(user_id);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON user_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_token ON user_verifications(verification_token);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_login_attempts_user_id ON user_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_attempts_email ON user_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_user_login_attempts_ip ON user_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_login_attempts_created_at ON user_login_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_security_events_user_id ON user_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_events_type ON user_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_security_events_created_at ON user_security_events(created_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kid_accounts_updated_at BEFORE UPDATE ON kid_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_joint_accounts_updated_at BEFORE UPDATE ON joint_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON user_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Create function to clean up expired verification tokens
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM user_verifications WHERE expires_at < CURRENT_TIMESTAMP AND status = 'pending';
END;
$$ language 'plpgsql';

-- Insert sample data for development
INSERT INTO users (id, username, email, password_hash, display_name, bio, is_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@innkt.com', '$2a$11$example_hash', 'Admin User', 'Platform administrator', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'testuser', 'test@innkt.com', '$2a$11$example_hash', 'Test User', 'Test user account', false),
    ('2b8c0ad7-dc09-4905-a8a3-9fcdf9b98cf9', 'junior11', 'junior11@innkt.com', '$2a$11$example_hash', 'Junior Eleven', 'Test user account', false),
    ('3c9d1be8-ed1a-5016-b9b4-afddf0c98cf0', 'lisobn.teresa', 'lisobn.teresa@innkt.com', '$2a$11$example_hash', 'Lisobn Teresa', 'Test user account', false)
ON CONFLICT (username) DO NOTHING;

-- Insert sample user profiles
INSERT INTO user_profiles (user_id, first_name, last_name, country, language) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Admin', 'User', 'United States', 'en'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Test', 'User', 'United States', 'en'),
    ('2b8c0ad7-dc09-4905-a8a3-9fcdf9b98cf9', 'Junior', 'Eleven', 'United States', 'en'),
    ('3c9d1be8-ed1a-5016-b9b4-afddf0c98cf0', 'Lisobn', 'Teresa', 'United States', 'en')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample joint account
INSERT INTO joint_accounts (id, account_name, primary_user_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', 'Smith Family', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Add sample users to the joint account
INSERT INTO joint_account_members (joint_account_id, user_id, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'owner'),
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'member')
ON CONFLICT DO NOTHING;

-- Connect to innkt_social database and create schema
\c innkt_social;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create the update_updated_at_column function for this database
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Posts table
CREATE TABLE IF NOT EXISTS "Posts" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "Content" TEXT NOT NULL,
    "PostType" VARCHAR(50) NOT NULL DEFAULT 'text',
    "PollOptions" TEXT[],
    "PollDuration" INTEGER,
    "PollExpiresAt" TIMESTAMP WITH TIME ZONE,
    "ImageUrl" VARCHAR(500),
    "VideoUrl" VARCHAR(500),
    "LinkUrl" VARCHAR(500),
    "LinkTitle" VARCHAR(255),
    "LinkDescription" TEXT,
    "LinkImage" VARCHAR(500),
    "Location" VARCHAR(255),
    "IsPublic" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS "Comments" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "PostId" UUID NOT NULL REFERENCES "Posts"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL,
    "Content" TEXT NOT NULL,
    "ParentCommentId" UUID REFERENCES "Comments"("Id") ON DELETE CASCADE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Likes table
CREATE TABLE IF NOT EXISTS "Likes" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "PostId" UUID REFERENCES "Posts"("Id") ON DELETE CASCADE,
    "CommentId" UUID REFERENCES "Comments"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CK_Likes_PostOrComment" CHECK (
        ("PostId" IS NOT NULL AND "CommentId" IS NULL) OR 
        ("PostId" IS NULL AND "CommentId" IS NOT NULL)
    )
);

-- Create Follows table
CREATE TABLE IF NOT EXISTS "Follows" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "FollowerId" UUID NOT NULL,
    "FollowingId" UUID NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("FollowerId", "FollowingId")
);

-- Create Groups table
CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Name" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "ImageUrl" VARCHAR(500),
    "IsPublic" BOOLEAN DEFAULT TRUE,
    "CreatedBy" UUID NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create GroupMembers table
CREATE TABLE IF NOT EXISTS "GroupMembers" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL REFERENCES "Groups"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL,
    "Role" VARCHAR(50) DEFAULT 'member',
    "JoinedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("GroupId", "UserId")
);

-- Create GroupPosts table
CREATE TABLE IF NOT EXISTS "GroupPosts" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL REFERENCES "Groups"("Id") ON DELETE CASCADE,
    "PostId" UUID NOT NULL REFERENCES "Posts"("Id") ON DELETE CASCADE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("GroupId", "PostId")
);

-- Create UserReports table
CREATE TABLE IF NOT EXISTS "UserReports" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ReportedUserId" UUID NOT NULL,
    "ReporterId" UUID NOT NULL,
    "Reason" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "Status" VARCHAR(50) DEFAULT 'pending',
    "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "ResolvedAt" TIMESTAMP WITH TIME ZONE
);

-- Create indexes for Social database
CREATE INDEX IF NOT EXISTS "IX_Posts_UserId" ON "Posts"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Posts_CreatedAt" ON "Posts"("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_PostType" ON "Posts"("PostType");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollExpiresAt" ON "Posts"("PollExpiresAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollOptions" ON "Posts" USING GIN("PollOptions");

CREATE INDEX IF NOT EXISTS "IX_Comments_PostId" ON "Comments"("PostId");
CREATE INDEX IF NOT EXISTS "IX_Comments_UserId" ON "Comments"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Comments_ParentCommentId" ON "Comments"("ParentCommentId");

CREATE INDEX IF NOT EXISTS "IX_Likes_PostId" ON "Likes"("PostId");
CREATE INDEX IF NOT EXISTS "IX_Likes_CommentId" ON "Likes"("CommentId");
CREATE INDEX IF NOT EXISTS "IX_Likes_UserId" ON "Likes"("UserId");

CREATE INDEX IF NOT EXISTS "IX_Follows_FollowerId" ON "Follows"("FollowerId");
CREATE INDEX IF NOT EXISTS "IX_Follows_FollowingId" ON "Follows"("FollowingId");

CREATE INDEX IF NOT EXISTS "IX_Groups_CreatedBy" ON "Groups"("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_Groups_IsPublic" ON "Groups"("IsPublic");

CREATE INDEX IF NOT EXISTS "IX_GroupMembers_GroupId" ON "GroupMembers"("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupMembers_UserId" ON "GroupMembers"("UserId");

CREATE INDEX IF NOT EXISTS "IX_GroupPosts_GroupId" ON "GroupPosts"("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupPosts_PostId" ON "GroupPosts"("PostId");

CREATE INDEX IF NOT EXISTS "IX_UserReports_ReportedUserId" ON "UserReports"("ReportedUserId");
CREATE INDEX IF NOT EXISTS "IX_UserReports_ReporterId" ON "UserReports"("ReporterId");
CREATE INDEX IF NOT EXISTS "IX_UserReports_Status" ON "UserReports"("Status");

-- Create triggers for updated_at
CREATE TRIGGER "UpdatePostsUpdatedAt" BEFORE UPDATE ON "Posts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "UpdateCommentsUpdatedAt" BEFORE UPDATE ON "Comments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "UpdateGroupsUpdatedAt" BEFORE UPDATE ON "Groups" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to innkt_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO innkt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO innkt_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO innkt_user;
