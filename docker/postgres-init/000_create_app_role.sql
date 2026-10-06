\getenv app_user DB_USER
\getenv app_password DB_PASSWORD

SELECT format(
  'CREATE ROLE %I WITH LOGIN PASSWORD %L',
  :'app_user',
  :'app_password'
)
\gexec