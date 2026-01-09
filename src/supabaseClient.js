// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ⚠️ เอาค่าจากหน้า API ของ Supabase มาใส่ตรงนี้
const supabaseUrl = 'https://mvespkpgzmgwomyrbomy.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZXNwa3Bnem1nd29teXJib215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODI3MjAsImV4cCI6MjA4MzI1ODcyMH0.obWISvXlhzZ044oW2MGrZcaL1sFTPUVxjsY-4UuGXcY'

export const supabase = createClient(supabaseUrl, supabaseKey)