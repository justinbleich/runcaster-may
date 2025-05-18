#!/bin/bash

# IMPORTANT: Set these variables before running
SUPABASE_PROJECT_ID="YOUR_PROJECT_ID"
SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"

# Get the content of the policy file
SQL_SCRIPT=$(cat ./scripts/fix_rls_policies.sql)

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

echo -e "\n\nRLS policy configuration completed. Check the response for any errors." 