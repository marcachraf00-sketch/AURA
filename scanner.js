// Install required module: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zndniherjshrerioqodx.supabase.co';
// WARNING: Best security practice is using a Service Role Key here if running in a private backend environment
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZG5paGVyanNocmVyaW9xb2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTE4MTgsImV4cCI6MjA5Nzg2NzgxOH0.WM0zBNAKI9vniV174I99FmEBQ25gB8hti2ZeoshUMTo'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Core event handler triggered immediately upon a hardware NFC tap discovery loop.
 * @param {string} rawScannedUid - The unique hex/string value extracted straight from the physical microchip.
 */
async function handlePhysicalCardHardwareTap(rawScannedUid) {
    console.log(`\n📡 [NFC Hardware Signal] Vector scanned! Payload ID: ${rawScannedUid}`);

    try {
        // 1. Query the map registry table to resolve ownership dynamically
        const { data: cardRegistry, error: lookupError } = await supabase
            .from('user_cards')
            .select('user_id')
            .eq('card_id', rawScannedUid)
            .maybeSingle();

        if (lookupError) {
            console.error(`❌ [Database Error] Verification query aborted:`, lookupError.message);
            return;
        }

        if (!cardRegistry) {
            console.warn(`⚠️ [Access Denied] Unassigned Vector. Card ${rawScannedUid} has no active database owner profile mapping.`);
            return;
        }

        const exactOwnerUuid = cardRegistry.user_id;
        console.log(`🔗 [Identity Resolved] Card linked directly to User UUID: ${exactOwnerUuid}`);

        // 2. Insert the verified live log row targeted directly at that profile
        const { data: scanLog, error: logError } = await supabase
            .from('nfc_scans')
            .insert([
                {
                    claimed_by: exactOwnerUuid, // Dynamically maps directly to the verified owner
                    claimed_at: new Date().toISOString(),
                    claimed: true
                }
            ])
            .select();

        if (logError) {
            console.error(`❌ [Write Error] Failed to commit scan record to matrix table:`, logError.message);
        } else {
            console.log(`✅ [Pipeline Completed] Tap successfully logged for owner! Row Reference ID: ${scanLog[0].id}`);
        }

    } catch (unexpectedError) {
        console.error(`💥 [System Crash Context] Unexpected exception caught inside scanning pipeline:`, unexpectedError);
    }
}

// =========================================================================
// SIMULATED TESTING HARNESS
// =========================================================================
// Test 1: Simulating an unregistered card tap
setTimeout(() => {
    handlePhysicalCardHardwareTap("UNKNOWN_CHIP_9999");
}, 1000);

// Test 2: Simulating an operational tap sequence (Pass a card token you register in Step 2 here)
// setTimeout(() => {
//     handlePhysicalCardHardwareTap("04:A3:2B:1C"); 
// }, 3000);
