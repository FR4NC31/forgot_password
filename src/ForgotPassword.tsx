import React, { useState } from "react";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Enter your email address.");
      return;
    }

    // Simulate sending email
    setTimeout(() => {
      setMessage("We sent a 6-digit verification code to your email.");
      setStep("otp");
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // auto move to next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      setMessage("Please enter the 6-digit code.");
      return;
    }

    // Mock verification
    if (code === "123456") {
      setMessage("✅ Verification successful! Create your new password.");
      setStep("reset");
    } else {
      setMessage("❌ Invalid code. Please try again.");
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp(Array(6).fill(""));
    } else if (step === "reset") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
    }
    setMessage("");
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    // Mock reset success
    setTimeout(() => {
      setStep("success");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
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
          <div className="mb-4 text-sm text-center text-gray-700">{message}</div>
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
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
            >
              Send Verification Code
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  className="w-12 h-12 text-center border rounded-lg text-lg focus:ring-2 focus:ring-black outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
            >
              Verify Code
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2 px-4 -mt-10 border border-black text-black rounded-full font-medium hover:bg-gray-100 transition"
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
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
            >
              Reset Password
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2 px-4 border border-black text-black rounded-full font-medium hover:bg-gray-100 transition"
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
            Didn’t get a code?{" "}
            <button
              type="button"
              onClick={() =>
                setMessage("📩 A new code has been sent to your email.")
              }
              className="text-black font-medium hover:underline"
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
                    Your password has been updated successfully. You can now log in with your new password.
                </p>

                <a
                    href="/login"
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
