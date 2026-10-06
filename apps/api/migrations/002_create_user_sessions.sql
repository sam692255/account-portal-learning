-- Stores hashed session tokens, never the original tokens.
CREATE TABLE public.user_sessions (
  token_hash TEXT PRIMARY KEY
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),

  user_id BIGINT NOT NULL
    REFERENCES public.users(id)
    ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,

  CONSTRAINT user_sessions_expiry_after_creation
    CHECK (expires_at > created_at)
);

CREATE INDEX user_sessions_user_expires_idx
  ON public.user_sessions (user_id, expires_at);

ALTER TABLE public.user_sessions OWNER TO login_app_user;