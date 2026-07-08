// Single Postgres pool + one-time schema init, shared across serverless
// invocations via globalThis (a plain module var is reset between cold starts and
// can spawn many pools under load, exhausting Neon's connection limit). Pair with
// Neon's *pooled* connection string (the `-pooler` host) in DATABASE_URL.
//
// Degrades gracefully: with no DATABASE_URL, getPool() returns null and callers
// fall back (cache is skipped, tracking reports that a database is required).

import { Pool } from 'pg'

const g = globalThis as unknown as { seoPool?: Pool; seoReady?: Promise<void> }

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  if (!g.seoPool) {
    g.seoPool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return g.seoPool
}

/** Create tables once per process. Resolves immediately when there's no database. */
export function ready(): Promise<void> {
  const pool = getPool()
  if (!pool) return Promise.resolve()
  if (!g.seoReady) {
    g.seoReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS seo_cache (
          cache_key  text PRIMARY KEY,
          payload    jsonb NOT NULL,
          fetched_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS rate_limit (
          bucket     text PRIMARY KEY,
          count      integer NOT NULL DEFAULT 0,
          expires_at timestamptz NOT NULL
        );
        CREATE TABLE IF NOT EXISTS dataforseo_usage (
          id          bigserial PRIMARY KEY,
          endpoint    text NOT NULL,
          cost        numeric NOT NULL DEFAULT 0,
          task_count  integer NOT NULL DEFAULT 0,
          status_code integer,
          created_at  timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS cache_events (
          id         bigserial PRIMARY KEY,
          prefix     text NOT NULL,
          cache_key  text NOT NULL,
          hit        boolean NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS rank_tracking (
          id         serial PRIMARY KEY,
          keyword    text NOT NULL,
          domain     text NOT NULL,
          location   integer NOT NULL,
          language   text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (keyword, domain, location, language)
        );
        CREATE TABLE IF NOT EXISTS rank_history (
          id          serial PRIMARY KEY,
          tracking_id integer NOT NULL REFERENCES rank_tracking(id) ON DELETE CASCADE,
          position    integer,
          checked_at  timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS keyword_bank (
          keyword        text NOT NULL,
          location       integer NOT NULL,
          language       text NOT NULL,
          volume         integer,
          cpc            numeric,
          difficulty     integer,
          source         text,
          times_searched integer NOT NULL DEFAULT 1,
          first_seen     timestamptz NOT NULL DEFAULT now(),
          last_seen      timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (keyword, location, language)
        );
        CREATE TABLE IF NOT EXISTS users (
          id            text PRIMARY KEY,
          name          text,
          email         text UNIQUE,
          email_verified timestamptz,
          image         text,
          role          text NOT NULL DEFAULT 'user',
          password_hash text,
          created_at    timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS accounts (
          id                text PRIMARY KEY,
          user_id           text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type              text NOT NULL,
          provider          text NOT NULL,
          provider_account_id text NOT NULL,
          refresh_token     text,
          access_token      text,
          expires_at        integer,
          token_type        text,
          scope             text,
          id_token          text,
          session_state     text,
          UNIQUE(provider, provider_account_id)
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id            text PRIMARY KEY,
          session_token text UNIQUE NOT NULL,
          user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires       timestamptz NOT NULL
        );
        CREATE TABLE IF NOT EXISTS verification_tokens (
          identifier text NOT NULL,
          token      text NOT NULL,
          expires    timestamptz NOT NULL,
          PRIMARY KEY (identifier, token)
        );
        CREATE TABLE IF NOT EXISTS projects (
          id         text PRIMARY KEY,
          user_id    text NOT NULL,
          name       text NOT NULL,
          domain     text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE rank_tracking ADD COLUMN IF NOT EXISTS project_id text;
        ALTER TABLE rank_tracking ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT 'demo-user';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
        ALTER TABLE rank_tracking DROP CONSTRAINT IF EXISTS rank_tracking_project_id_fkey;
        ALTER TABLE rank_tracking DROP CONSTRAINT IF EXISTS rank_tracking_keyword_domain_location_language_key;
        CREATE UNIQUE INDEX IF NOT EXISTS rank_tracking_user_keyword_domain_location_language_idx
          ON rank_tracking (user_id, keyword, domain, location, language);
        CREATE INDEX IF NOT EXISTS rank_tracking_user_idx ON rank_tracking (user_id);
        CREATE INDEX IF NOT EXISTS rank_history_tracking_checked_idx ON rank_history (tracking_id, checked_at DESC);
        CREATE INDEX IF NOT EXISTS projects_user_idx ON projects (user_id);
        CREATE INDEX IF NOT EXISTS dataforseo_usage_created_idx ON dataforseo_usage (created_at DESC);
        CREATE INDEX IF NOT EXISTS dataforseo_usage_endpoint_idx ON dataforseo_usage (endpoint);
        CREATE INDEX IF NOT EXISTS cache_events_created_idx ON cache_events (created_at DESC);
        CREATE INDEX IF NOT EXISTS cache_events_prefix_idx ON cache_events (prefix);
      `)
      .then(() => undefined)
  }
  return g.seoReady
}
