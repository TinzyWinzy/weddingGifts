
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing connection to:", supabaseUrl);

    // 1. Try to select from weddings
    const { data, error } = await supabase.from('weddings').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("FAILED to connect or query 'weddings':", error.message);
        return;
    }

    console.log("SUCCESS: Connected to 'weddings' table. Row count:", data); // valid response means table exists

    // 2. Try to insert a test wedding
    const { data: insertData, error: insertError } = await supabase
        .from('weddings')
        .insert([{ couple_name: 'Test Couple', created_at: new Date() }])
        .select()
        .single();

    if (insertError) {
        console.error("FAILED to insert into 'weddings':", insertError.message);
    } else {
        console.log("SUCCESS: Inserted test wedding with ID:", insertData.id);

        // Cleanup
        await supabase.from('weddings').delete().eq('id', insertData.id);
        console.log("SUCCESS: Cleaned up test record.");
    }
}

testConnection();
