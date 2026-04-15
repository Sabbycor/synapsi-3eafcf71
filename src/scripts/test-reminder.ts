
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env file
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(line => line.includes("="))
    .map(line => {
      const [key, ...valueParts] = line.split("=");
      let value = valueParts.join("=").trim();
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      return [key.trim(), value];
    })
);

const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReminderFlow() {
  console.log("Checking for existing data...");
  
  // 1. Get a practice profile
  const { data: profiles } = await supabase.from('practice_profiles').select('id').limit(1);
  if (!profiles || profiles.length === 0) {
    console.error("No practice profiles found.");
    return;
  }
  const practiceProfileId = profiles[0].id;

  // 2. Get a patient with email
  const { data: patients } = await supabase.from('patients').select('id, email, first_name').not('email', 'is', null).limit(1);
  if (!patients || patients.length === 0) {
    console.error("No patients with email found.");
    return;
  }
  const patient = patients[0];

  console.log(`Using Profile: ${practiceProfileId}, Patient: ${patient.id} (${patient.email})`);

  // 3. Create an appointment starting EXACTLY 60 minutes from now
  const now = new Date();
  const startsAt = new Date(now.getTime() + 60 * 60_000);
  const endsAt = new Date(startsAt.getTime() + 50 * 60_000);

  console.log(`Creating test appointment at ${startsAt.toISOString()}...`);

  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .insert({
      practice_profile_id: practiceProfileId,
      patient_id: patient.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
      reminder_sent: false
    })
    .select()
    .single();

  if (apptError) {
    console.error("Error creating appointment:", apptError.message);
    return;
  }

  console.log(`Appointment created with ID: ${appt.id}`);
  console.log("-----------------------------------------");
  console.log("Now calling send-appointment-reminders...");

  // 4. Trigger the Edge Function
  const functionUrl = `${supabaseUrl}/functions/v1/send-appointment-reminders`;
  
  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status !== 200) {
        console.error(`Request failed with status ${response.status}`);
        const text = await response.text();
        console.error("Response:", text);
    } else {
        const result = await response.json();
        console.log("Function Response:", JSON.stringify(result, null, 2));

        if (result.sent > 0) {
          console.log("SUCCESS: Reminder was triggered successfully!");
        } else {
          console.log("WARNING: Function returned 0 sent count. This might happen if the time window (55-65 mins) is very tight and the server time differs.");
        }
    }
  } catch (err) {
    console.error("Error triggering function:", err);
  } finally {
    // 5. Cleanup
    console.log("Cleaning up test data...");
    await supabase.from('appointments').delete().eq('id', appt.id);
  }
}

testReminderFlow();
