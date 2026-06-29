const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zndniherjshrerioqodx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZG5paGVyanNocmVyaW9xb2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTE4MTgsImV4cCI6MjA5Nzg2NzgxOH0.WM0zBNAKI9vniV174I99FmEBQ25gB8hti2ZeoshUMTo'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function handlePhysicalCardHardwareTap(rawScannedUid) {
    console.log(`\n📡 [NFC Hardware Signal] Vector scanned! Payload ID: ${rawScannedUid}`);
    try {
        const { data: cardRegistry, error: lookupError } = await supabase
            .from('user_cards')
            .select('user_id')
            .eq('card_id', rawScannedUid)
            .maybeSingle();

        if (lookupError) {
            console.error(`❌ [Database Error]:`, lookupError.message);
            return;
        }

        if (!cardRegistry) {
            console.warn(`⚠️ [Access Denied] Card ${rawScannedUid} has no active database owner.`);
            return;
        }

        const exactOwnerUuid = cardRegistry.user_id;
        console.log(`🔗 [Identity Resolved] Linked to User: ${exactOwnerUuid}`);

        const { data: scanLog, error: logError } = await supabase
            .from('nfc_scans')
            .insert([{ claimed_by: exactOwnerUuid, claimed_at: new Date().toISOString(), claimed: true }])
            .select();

        if (logError) console.error(`❌ [Write Error]:`, logError.message);
        else console.log(`✅ [Pipeline Completed] Tap logged! Row ID: ${scanLog[0].id}`);

    } catch (unexpectedError) {
        console.error(`💥 Unexpected exception:`, unexpectedError);
    }
}

// Simulated Testing Loop
setTimeout(() => {
    handlePhysicalCardHardwareTap("UNKNOWN_CHIP_9999");
}, 1000);