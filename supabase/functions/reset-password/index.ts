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
    // Verify authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    
    if (token !== SUPABASE_ANON_KEY && token !== SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Invalid authorization token");
    }

    const { email, otp, newPassword } = await req.json() as { 
      email?: string; 
      otp?: string; 
      newPassword?: string 
    };
    
    if (!email || !otp || !newPassword) {
      throw new Error("Missing required fields: email, otp, or newPassword");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate password length
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      throw new Error("Invalid OTP format");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify OTP one more time
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

    // Get user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      throw new Error("Failed to fetch user");
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error("User not found");
    }

    // Update user password using Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    // Delete the OTP after successful password reset
    await supabase
      .from("forgot_password_otps")
      .delete()
      .eq("email", email.toLowerCase());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset successfully" 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("authorization") ? 401 : 400;
    
    return new Response(
      JSON.stringify({ success: false, error: message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      }
    );
  }
});