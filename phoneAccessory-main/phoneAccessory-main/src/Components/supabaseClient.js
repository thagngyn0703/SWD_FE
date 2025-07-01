import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eaihherdrlatfziwvgch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaWhoZXJkcmxhdGZ6aXd2Z2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTY1MzEsImV4cCI6MjA2NTg5MjUzMX0.1vAkHoq18rhqeup0Gv4WkYgTBom3tbgWrqSyO_Z6ySQ';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
