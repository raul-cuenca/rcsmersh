// Configuración de Supabase
const SUPABASE_URL = 'https://udkezujcpldpnjyjuium.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka2V6dWpjcGxkcG5qeWp1aXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTUwNzIsImV4cCI6MjEwMjc3MTA3Mn0.fduzmP4xBaUQfAlmbik1veoU0LirDO2LANkc2W8HPgw';

// Inicializar y exportar globalmente el cliente
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
