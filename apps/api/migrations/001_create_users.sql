CREATE TABLE public.users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name TEXT NOT NULL CHECK (length(trim(first_name)) > 0),
  last_name TEXT NOT NULL CHECK (length(trim(last_name)) > 0),
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX users_email_lower_unique
  ON public.users (LOWER(email));

CREATE UNIQUE INDEX users_mobile_unique
  ON public.users (mobile_number);

GRANT USAGE ON SCHEMA public TO login_app_user;
GRANT SELECT, INSERT ON TABLE public.users TO login_app_user;
GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq TO login_app_user;