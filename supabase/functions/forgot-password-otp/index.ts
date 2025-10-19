import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const htmlContent = (otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OTP Verification</title>
<style>
  body { font-family: Arial, sans-serif; background: #fff; color: #000; }
  .container { max-width: 500px; margin: 30px auto; padding: 20px; border: 1px solid #000; border-radius: 5px; }
  h2 { margin-bottom: 20px; }
  p { margin-bottom: 10px; }
  .otp { font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; }
</style>
</head>
<body>
  <div class="container">
    <h2>Password Reset OTP</h2>
    <p>Hello,</p>
    <p>Your 6-digit OTP code for password reset is:</p>
    <div class="otp">${otp}</div>
    <p>This code is valid for 2 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
`;

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

    const { to } = await req.json() as { to?: string };
    if (!to) throw new Error("Missing 'to' email field");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error("Invalid email format");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user exists
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      throw new Error("Failed to verify user");
    }

    const user = users.find(u => u.email?.toLowerCase() === to.toLowerCase());

    if (!user) {
      throw new Error("Email not registered");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes

    // Save OTP to Supabase with expiration
    const { error: dbError } = await supabase
      .from("forgot_password_otps")
      .upsert({ 
        email: to.toLowerCase(), 
        otp, 
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      });
    
    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // Send OTP via Brevo
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Molave Street Barbers", email: "xprojectdevelopers2025@gmail.com" },
        to: [{ email: to }],
        subject: "🔑 Your 6-digit OTP Code",
        htmlContent: htmlContent(otp),
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      throw new Error(`Email service error: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }), 
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