import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json() as { email?: string; otp?: string };
    
    if (!email || !otp) {
      throw new Error("Missing email or OTP");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      throw new Error("Invalid OTP format");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get OTP from database
    const { data: otpRecord, error: fetchError } = await supabase
      .from("forgot_password_otps")
      .select("otp, expires_at")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError || !otpRecord) {
      throw new Error("OTP not found or has expired");
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    
    if (now > expiresAt) {
      // Delete expired OTP
      await supabase
        .from("forgot_password_otps")
        .delete()
        .eq("email", email.toLowerCase());
      
      throw new Error("OTP has expired");
    }

    // Verify OTP matches
    if (otpRecord.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    // Delete the OTP after successful verification
    const { error: deleteError } = await supabase
      .from("forgot_password_otps")
      .delete()
      .eq("email", email.toLowerCase());

    if (deleteError) {
      throw new Error("Failed to delete OTP after verification");
    }

    // OTP is valid
    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});