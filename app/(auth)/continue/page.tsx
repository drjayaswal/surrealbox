"use client";

import { authClient } from "@/app/lib/auth-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon as ArrowRight,
  GoogleLogoIcon,
  SealCheckIcon as CheckCircle,
  CircleNotchIcon,
  ArrowCircleLeftIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { authImages } from "@/images_name";
import { AuthSidebar } from "@/components/app/AuthSidebar";

type Step = "contact" | "otp" | "done";
type OtpStatus =
  | "idle"
  | "sending"
  | "sent"
  | "resending"
  | "verifying"
  | "verified"
  | "error"
  | "social";

function ErrBanner({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Alert variant="destructive" className="max-w-md border-0 bg-red-500/10">
        <AlertDescription className="text-[13px]">{msg}</AlertDescription>
      </Alert>
    </motion.div>
  );
}


function BackBtn({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-[12px] text-primary! hover:text-secondary! mb-5 cursor-pointer disabled:opacity-40 transition-colors"
    >
      <ArrowCircleLeftIcon size={13} /> Back
    </button>
  );
}

const stepVariants = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d > 0 ? -28 : 28 }),
};

const STEPS: Step[] = ["contact", "otp", "done"];

export default function ContinuePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("contact");
  const [dir, setDir] = useState<1 | -1>(1);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const stepIndex = STEPS.indexOf(step);

  const goTo = (next: Step, d: 1 | -1 = 1) => {
    setDir(d);
    setError("");
    setStep(next);
    if (next === "otp") {
      setOtp("");
    }
  };

  const goBack = () => {
    setDir(-1);
    setError("");
    setStep("contact");
    setOtp("");
    setOtpStatus("idle");
  };

  const signinWithGoogle = async () => {
    setOtpStatus("social");
    setError("");
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    } catch {
      setOtpStatus("error");
      setError("Social sign-in failed. Please try again.");
      setTimeout(() => setOtpStatus("idle"), 3000);
    }
  };

  const sendOTP = async (isResend = false) => {
    setError("");

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (mobile && !/^\d{10}$/.test(mobile.trim())) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!email && !mobile) return;

    setOtpStatus(isResend ? "resending" : "sending");

    const contactVal = email ? email.trim() : `+91${mobile.trim()}`;

    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          email ? { email: contactVal } : { phoneNumber: contactVal }
        ),
      });
      const checkData = await checkRes.json().catch(() => ({}));
      if (!checkData.exists) {
        setOtpStatus("error");
        setError(`No account found with this ${email ? "email" : "mobile number"}. Please create account first.`);
        setTimeout(() => setOtpStatus("idle"), 4000);
        return;
      }
    } catch {
      setOtpStatus("error");
      setError("Failed to check user. Please try again.");
      setTimeout(() => setOtpStatus("idle"), 3000);
      return;
    }

    try {
      const { error: sendErr } = email
        ? await authClient.emailOtp.sendVerificationOtp({ email: contactVal, type: "sign-in" })
        : await (authClient as any).phoneNumber.sendOtp({ phoneNumber: contactVal });

      if (sendErr) throw new Error(sendErr.message ?? "Failed to send code");

      setOtpStatus("sent");
      if (!isResend) goTo("otp");
    } catch (e: any) {
      setOtpStatus("error");
      setError(e.message ?? "Failed to send code. Please try again.");
      setTimeout(() => setOtpStatus(isResend ? "sent" : "idle"), 3000);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 8) return;
    setOtpStatus("verifying");
    setError("");

    const contactVal = email ? email.trim() : `+91${mobile.trim()}`;

    try {
      const { error: verifyErr } = email
        ? await authClient.signIn.emailOtp({ email: contactVal, otp, callbackURL: "/" })
        : await (authClient as any).phoneNumber.verify({ phoneNumber: contactVal, code: otp });

      if (verifyErr) throw new Error(verifyErr.message ?? "Invalid or expired code");

      setOtpStatus("verified");
      goTo("done");
      setTimeout(() => router.push("/"), 1200);
    } catch (e: any) {
      setOtpStatus("error");
      setError(e.message ?? "Invalid or expired code.");
      setTimeout(() => {
        setOtpStatus("sent");
        setOtp("");
      }, 2200);
    }
  };

  const isLoading =
    otpStatus === "sending" ||
    otpStatus === "verifying" ||
    otpStatus === "social" ||
    otpStatus === "resending";

  const otpComplete = otp.length === 8;
  const otpDisabled = otpStatus === "verifying" || otpStatus === "verified";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans overflow-hidden relative">
      <div className="flex-1 flex bg-white items-center lg:justify-start justify-center p-6 sm:p-10 z-20 min-h-screen lg:min-h-0 relative lg:ml-[2%]">
        <div className="w-full relative max-w-md p-4 z-10">
          <motion.div
            layout
            className="flex absolute -top-[60px] right-0 translate-y-5 gap-2 z-9 p-2 items-center justify-center"
            transition={{ layout: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
          >
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full">
              {STEPS.map((s, i) => {
                const isCompleted = i < stepIndex;
                const isActive = i === stepIndex;
                return (
                  <div key={s} className="relative flex items-center justify-center">
                    <motion.div
                      layout
                      initial={false}
                      animate={{ width: isActive ? 24 : 6 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className={cn(
                        "h-1.5  transition-all rounded-4xl duration-500",
                        isActive || isCompleted ? "bg-primary" : "bg-primary/30",
                        isActive ? "w-4" : "w-2"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
          <div className="absolute left-0 -top-[35.5px] p-1 rounded-t-lg">
            <p className="text-[13px] text-primary px-2 py-1">
              New here?{" "}
              <button
                type="button"
                onClick={() => router.push("/create-account")}
                className="text-main  underline underline-offset-4 hover:text-secondary transition-colors cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {step === "contact" && (
                <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }}>
                  <h2 className="text-[36px] sm:text-[40px] font-normal text-foreground leading-[1.1] mb-2">
                    Continue session
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-[1.6] mb-4">
                    Sign in to ask questions, post answers, and vote.
                  </p>
                  <div className="grid grid-cols-1 gap-1 mb-4">
                    <InputGroup className="h-auto rounded-md! sm:bg-transparent! bg-white! border-0!">
                      <InputGroupAddon align="block-start">
                        <InputGroupText className=" text-[11px] uppercase ">Email Address</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (e.target.value) setMobile(""); }}
                        className="h-10 px-4 text-[14px] text-primary placeholder:text-primary/30 focus-within:text-secondary"
                        disabled={isLoading}
                      />
                    </InputGroup>
                  </div>

                  {error && <ErrBanner msg={error} />}

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      type="submit"
                      variant="custom"
                      disabled={(!email && !mobile) || isLoading}
                      className="w-full sm:w-auto"
                    >
                      {otpStatus === "sending" ? (
                        <>
                          <CircleNotchIcon className="animate-spin" size={18} />
                          Sending code...
                        </>
                      ) : (
                        <>
                          Send verification code
                          <ArrowRight size={16} />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      onClick={signinWithGoogle}
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      {otpStatus === "social" ? (
                        <CircleNotchIcon className="animate-spin" size={18} />
                      ) : (
                        <GoogleLogoIcon size={18} weight="bold" className="text-black" />
                      )}
                      {otpStatus === "social" ? "Connecting..." : "Continue with Google"}
                    </Button>
                  </div>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={(e) => { e.preventDefault(); verifyOTP(); }}>
                  <BackBtn onClick={goBack} disabled={otpDisabled} />
                  <h2 className="text-[36px] sm:text-[38px] font-normal text-foreground leading-[1.1] mb-2">
                    {email ? "Check your inbox" : "Check your phone"}
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-[1.6] mb-4">
                    We sent a 8-digit code to{" "}
                    <strong className="text-foreground font-medium">
                      {email || `+91${mobile}`}
                    </strong>
                  </p>

                  <Field className="mb-4">
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="otp-verification" className="text-sm  text-primary">
                        Verification OTP
                      </FieldLabel>
                      {!otpDisabled && (
                        <Button
                          variant="light"
                          size="sm"
                          type="button"
                          onClick={() => sendOTP(true)}
                          disabled={otpStatus === "resending"}
                        >
                          <ArrowsClockwiseIcon size={12} className={cn(otpStatus === "resending" && "animate-spin")} />
                          {otpStatus === "resending" ? "Sending..." : "Resend Code"}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-4">
                      <InputOTP
                        maxLength={8}
                        id="otp-verification"
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        disabled={otpDisabled}
                        pattern={REGEXP_ONLY_DIGITS}
                        required
                        containerClassName="group flex items-center justify-center has-[:disabled]:opacity-50"
                      >
                        <div className="flex items-center gap-1">
                          <InputOTPGroup className="gap-1">
                            {[0, 1, 2, 3].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className={cn(
                                  "h-7 w-7 sm:h-9 sm:w-9 text-2xl font-medium transition-all duration-300 rounded-full!",
                                  "bg-white border-gray-200 border ring-0 outline-none",
                                  "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                                )}
                              />
                            ))}
                          </InputOTPGroup>

                          <div className="h-0.5 w-5 bg-black  hidden sm:block" />

                          <InputOTPGroup className="gap-1">
                            {[4, 5, 6, 7].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className={cn(
                                  "h-7 w-7 sm:h-9 sm:w-9 text-2xl font-medium transition-all duration-300 rounded-full!",
                                  "bg-white border-gray-200 border ring-0 outline-none",
                                  "focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20"
                                )}
                              />
                            ))}
                          </InputOTPGroup>
                        </div>
                      </InputOTP>
                    </div>
                    {!otpDisabled && (
                      <FieldDescription className="text-[11px] text-primary/50 text-center">
                        Entered wrong {email ? "email" : "number"}?{" "}
                        <button type="button" onClick={goBack} className="underline text-primary hover:text-secondary">
                          Change
                        </button>
                      </FieldDescription>
                    )}
                  </Field>

                  {error && <ErrBanner msg={error} />}

                  <Button
                    type="submit"
                    variant="custom"
                    disabled={!otpComplete || otpDisabled}
                  >
                    {otpStatus === "verifying" ? (
                      <>
                        Verifying…
                        <CircleNotchIcon className="animate-spin" size={18} />
                      </>
                    ) : otpStatus === "verified" ? (
                      <>
                        Verified! Continuing…
                        <CheckCircle size={17} weight="fill" />
                      </>
                    ) : (
                      <>
                        Verify &amp; continue
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {step === "done" && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle size={70} weight="fill" className="text-main" />
                  </motion.div>
                  <h2 className="text-[32px] font-normal text-foreground mb-2">
                    Welcome back!
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-[1.7] max-w-xs mx-auto">
                    Taking you back to the discussions...
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-primary">
                    <CircleNotchIcon className="animate-spin" size={18} />
                    Redirecting…
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AuthSidebar
        imageSrc={authImages[0]}
        side="right"
        title="Welcome Back"
        subtitle="Continue your journey into the deepest discussions"
      />
    </div>
  );
}