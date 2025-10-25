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

// 🖤 Branded HTML Email Template for MLV ST.
const htmlContent = (otp: string, displayName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MLV ST. Password Reset OTP</title>
  <style>
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 480px;
      margin: 40px auto;
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #000000;
      text-align: center;
      padding: 24px;
    }
    
    .header h1 {
      font-family: 'Oswald', sans-serif;
      color: #ffffff;
    }

    .logo {
      width: 150px;
      height: auto;
    }
    .content {
      padding: 30px;
      text-align: left;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #000000;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      margin-bottom: 20px;
    }
    .otp-box {
      display: block;
      text-align: center;
      font-size: 26px;
      font-weight: bold;
      background-color: #000000;
      color: #ffffff;
      letter-spacing: 4px;
      padding: 16px;
      border-radius: 8px;
      margin: 20px auto;
      width: fit-content;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #777777;
      padding: 20px;
      border-top: 1px solid #ddd;
    }
    a {
      color: #000000;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MOLAVE STREET BARBERS</h1>
    </div>
    <div class="content">
      <h1>Password Reset Request</h1>
      <p>Hello ${displayName},</p>
      <p>We received a request to reset your <strong>MLV ST.</strong> account password. Please use the One-Time Password (OTP) below to verify your identity and continue the reset process:</p>
      
      <div class="otp-box">${otp}</div>

      <p>⚠️ This code will expire in <strong>2 minutes</strong> for your security.</p>
      <p>If you didn’t request a password reset, please ignore this email — your account will remain safe.</p>

      <p>Thank you for being part of the <strong>Molave Street Barbers</strong> community.</p>
    </div>
    <div class="footer">
      💈 MLV ST. | <a href="https://molavestreetbarbers.vercel.app">molavestreetbarbers.vercel.app</a><br/>
      &copy; 2025 Molave Street Barbers. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1️⃣ Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    if (token !== SUPABASE_ANON_KEY) throw new Error("Invalid authorization token");

    // 2️⃣ Parse request
    const { to } = await req.json() as { to?: string };
    if (!to) throw new Error("Missing 'to' email field");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) throw new Error("Invalid email format");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3️⃣ Check user
    const { data: user, error: userError } = await supabase
      .from("customer_profiles")
      .select("email, display_name")
      .eq("email", to.toLowerCase())
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Email not registered" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 4️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // 5️⃣ Save OTP
    const { error: dbError } = await supabase
      .from("forgot_password_otps")
      .upsert({
        email: to.toLowerCase(),
        otp,
        created_at: new Date().toISOString(),
        expires_at: expiresAt
      });

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 6️⃣ Send Email
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "MLV ST.", email: "xprojectdevelopers2025@gmail.com" },
        to: [{ email: to }],
        subject: "🖤 MLV ST. – Your 2-Minute Password Reset OTP Code",
        htmlContent: htmlContent(otp, user.display_name || "User"),
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      throw new Error(`Email service error: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("authorization") ? 401 : 400;

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
    );
  }
});
