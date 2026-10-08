const SUPABASE_URL = "https://zmuefqdfgtnflcawwqko.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWVmcWRmZ3RuZmxjYXd3cWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODU3MDcsImV4cCI6MjEwNzA2MTcwN30.UEShmQnUTg4qPRyyNQMnhh35gRmx7c6MuZwS4Qi_ksE";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );