#!/bin/bash

# IMPORTANT: Set these variables before running
SUPABASE_PROJECT_ID="YOUR_PROJECT_ID"
SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"

# Get the content of the migration file
SQL_SCRIPT=$(cat ./supabase/migrations/20240601000000_add_challenge_procedures.sql)

# Escape JSON special characters
SQL_SCRIPT="${SQL_SCRIPT//\\/\\\\}"
SQL_SCRIPT="${SQL_SCRIPT//\"/\\\"}"
SQL_SCRIPT="${SQL_SCRIPT//	/\\t}"
SQL_SCRIPT="${SQL_SCRIPT//
/\\n}"

# Prepare the request body
JSON_BODY="{\"query\": \"$SQL_SCRIPT\"}"

# Execute the SQL script against Supabase
curl -X POST "https://$SUPABASE_PROJECT_ID.supabase.co/rest/v1/rpc/pgbouncer_exec" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_BODY"

echo -e "\n\nMigration completed. Check the response for any errors." 