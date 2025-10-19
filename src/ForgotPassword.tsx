import React, { useState, useEffect } from "react";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false)

  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const redirectToApp = () => {
  // Try to open the app
  window.location.href = "com.fr4nc.mlvst://";
};

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Sending OTP...");

      const res = await fetch(
        "https://gycwoawekmmompvholqr.functions.supabase.co/forgot-password-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ to: email }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setMessage("✅ We sent a 6-digit verification code to your email.");
      setStep("otp");
      setTimer(120);
      setCanResend(false);
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setMessage("Resending OTP...");

      const res = await fetch(
        "https://gycwoawekmmompvholqr.functions.supabase.co/forgot-password-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ to: email }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setMessage("📩 A new code has been sent to your email.");
      setTimer(120);
      setCanResend(false);
      setOtp(Array(6).fill(""));
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      setMessage("Please enter the 6-digit code.");
      return;
    }

    if (timer === 0) {
      setMessage("❌ OTP has expired. Please request a new code.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Verifying OTP...");

      const res = await fetch(
        "https://gycwoawekmmompvholqr.functions.supabase.co/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, otp: code }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid OTP");
      }

      setMessage("✅ Verification successful! Create your new password.");
      setStep("reset");
    } catch (err) {
      setMessage(`❌ ${(err as Error).message || "Invalid OTP"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("❌ Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Updating password...");

      const res = await fetch(
        "https://gycwoawekmmompvholqr.functions.supabase.co/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            email, 
            otp: otp.join(""),
            newPassword 
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      setStep("success");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("");
    } catch (err) {
      setMessage(`❌ ${(err as Error).message || "Failed to reset password"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp(Array(6).fill(""));
      setTimer(120);
      setCanResend(false);
    } else if (step === "reset") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
    }
    setMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
          {step === "email"
            ? "Reset Password"
            : step === "otp"
            ? "Verify Your Email"
            : "Create New Password"}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {step === "email"
            ? "Enter your email to receive a verification code."
            : step === "otp"
            ? "Enter the 6-digit code we sent to your email."
            : "Must be different from your previous password."}
        </p>

        {message && (
          <div
            className={`mb-4 text-sm text-center p-3 rounded-lg ${
              message.includes("✅")
                ? "bg-green-50 text-green-700 border border-green-200"
                : message.includes("❌")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {message}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center">
              <div
                className={`text-2xl font-bold mb-2 ${
                  timer <= 30 ? "text-red-600" : "text-gray-800"
                }`}
              >
                {formatTime(timer)}
              </div>
              <p className="text-xs text-gray-500">
                {timer === 0 ? "Code expired" : "Time remaining"}
              </p>
            </div>

            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  className="w-12 h-12 text-center border rounded-lg text-lg focus:ring-2 focus:ring-black outline-none disabled:bg-gray-100"
                  disabled={loading || timer === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || timer === 0}
              className="w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full py-2 px-4 border border-black text-black rounded-full font-medium hover:bg-gray-100 transition disabled:opacity-50"
            >
              Back
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full py-2 px-4 border border-black text-black rounded-full font-medium hover:bg-gray-100 transition disabled:opacity-50"
            >
              Back
            </button>
          </form>
        )}

        {step === "email" ? (
          <p className="text-sm text-center mt-6 text-gray-600">
            Remember your password?{" "}
            <a href="/login" className="text-black hover:underline">
              Sign in
            </a>
          </p>
        ) : step === "otp" ? (
          <p className="text-sm text-center mt-6 text-gray-600">
            Didn't get a code?{" "}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              className="text-black font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
            >
              Resend
            </button>
          </p>
        ) : null}

        {step === "success" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Password Changed!
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been updated successfully. You can now log in
                with your new password.
              </p>

              <a
                onClick={redirectToApp}
                className="block w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
              >
                Continue to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;