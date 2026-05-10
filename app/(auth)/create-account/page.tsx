"use client";

import { authClient } from "@/app/lib/auth-client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon as ArrowRight,
  SealCheckIcon as CheckCircle,
  SpinnerIcon,
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { authImages } from "@/images_name";
import { AuthSidebar } from "@/components/app/AuthSidebar";

type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified" | "error";
type Step = "contact_email" | "otp_email" | "done";

function ErrBanner({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <Alert variant="destructive" className="max-w-md border-0">
        <AlertDescription className="text-[13px]">{msg}</AlertDescription>
      </Alert>
    </motion.div>
  );
}


function BackBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-[12px] text-primary hover:text-secondary mb-5 cursor-pointer disabled:opacity-40 transition-colors"
    >
      <ArrowCircleLeftIcon size={13} /> Back
    </button>
  );
}

export default function CreateAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("contact_email");
  const [dir, setDir] = useState<1 | -1>(1);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [email, setEmail] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otp, setOtp] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus("checking");
      try {
        const res = await fetch("/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim().toLowerCase() }),
        });
        const data = await res.json();
        if (data.exists) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      } catch (err) {
        console.error(err);
        setUsernameStatus("idle");
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const steps: Step[] = ["contact_email", "otp_email", "done"];
  const stepIndex = steps.indexOf(step);

  const goTo = useCallback((next: Step, d: 1 | -1 = 1) => {
    setDir(d);
    setError("");
    setStep(next);
    if (next === "otp_email") {
      setOtpStatus("idle");
      setOtp("");
    }
  }, []);

  const goBack = useCallback(() => {
    setDir(-1);
    setError("");
    if (step === "otp_email") setStep("contact_email");
  }, [step]);

  const sendOTP = async (isResend = false) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setOtpStatus("sending");
    setError("");

    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), username: username.trim() }),
      });
      const checkData = await checkRes.json().catch(() => ({}));
      if (checkData.exists) {
        throw new Error("Email or Username already taken. Please try again.");
      }

      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (error) throw new Error(error.message ?? "Failed to send code");

      setOtpStatus("sent");
      if (!isResend) goTo("otp_email");
    } catch (e: any) {
      setOtpStatus("error");
      setError(e.message ?? "Something went wrong. Please try again.");
      setTimeout(() => setOtpStatus("idle"), 3500);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 8) return;
    setOtpStatus("verifying");
    setError("");

    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp,
      } as any);
      if (error) throw new Error(error.message ?? "Invalid or expired code");
      if (!data) throw new Error("Authentication failed. Please try again.");

      const createRes = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          username: username.trim(),
          gender: String(gender),
          bio: bio.trim(),
        }),
      });

      if (!createRes.ok) {
        const createData = await createRes.json().catch(() => ({}));
        throw new Error(createData.error || "Failed to save profile information");
      }

      setOtpStatus("verified");
      goTo("done");
      setTimeout(() => router.push("/"), 1200);
    } catch (e: any) {
      setOtpStatus("error");
      setError(e.message ?? "Verification failed. Please try again.");
      setTimeout(() => {
        setOtpStatus("sent");
        setOtp("");
      }, 2200);
    }
  };



  const stepVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 28 : -28 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -28 : 28 }),
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen overflow-hidden">
      <AuthSidebar
        imageSrc={authImages[1]}
        side="left"
        title="Start Your Legacy"
        subtitle="Join the most focused community"
      />
      <div className="flex-1 flex bg-white items-center lg:justify-end justify-center p-6 sm:p-10 z-20 relative lg:mr-[2%]">
        <div className="w-full relative max-w-md p-4 z-10">
          <motion.div
            layout
            className="flex absolute -top-[60px] right-0 translate-y-5 gap-2 z-9 p-2 items-center justify-center"
            transition={{ layout: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
          >
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full">
              {steps.map((s, i) => {
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
                        "h-1.5 transition-all rounded-4xl duration-500",
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
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/continue")}
                className="text-main underline underline-offset-4 hover:text-secondary transition-colors cursor-pointer"
              >
                Continue
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
              {step === "contact_email" && (
                <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }}>
                  <h2 className="text-[36px] sm:text-[40px] font-normal text-foreground leading-[1.1] mb-2">
                    Join Surrealbox
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-[1.6] mb-4">
                    Ask questions, debate answers, and build your reputation.
                  </p>

                  <div className="grid grid-cols-1 gap-1 mb-4">
                    <InputGroup className="h-auto rounded-md! sm:bg-transparent! bg-white! border-0!">
                      <InputGroupAddon align="block-start">
                        <InputGroupText className="text-[11px] uppercase">Full Name</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="h-10 px-4 text-[14px] text-primary placeholder:text-primary/30 focus-within:text-secondary"
                        disabled={otpStatus === "sending"}
                      />
                    </InputGroup>

                    <div className="relative">
                      <InputGroup className={cn(
                        "h-auto sm:bg-transparent! bg-white! border-0! transition-all duration-300 rounded-none!",
                        usernameStatus === "taken" && "border-b! border-red-500!",
                        usernameStatus === "available" && "border-b! border-green-500!"
                      )}>
                        <InputGroupAddon align="block-start">
                          <InputGroupText className="text-[11px] uppercase">Username</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                          placeholder="janedoe"
                          className="h-10 px-4 text-[14px] text-primary placeholder:text-primary/30 focus-within:text-secondary"
                          disabled={otpStatus === "sending"}
                        />
                      </InputGroup>
                      <div className="absolute top-10 right-0 h-4 flex items-center">
                        <AnimatePresence>
                          {usernameStatus === "checking" && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <SpinnerIcon className="animate-spin" size={14} /> Checking availability...
                            </motion.span>
                          )}
                          {usernameStatus === "taken" && (
                            <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] text-red-500">
                              Username is already taken
                            </motion.span>
                          )}
                          {usernameStatus === "available" && (
                            <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] text-green-600">
                              Username is available
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-2 mb-2">
                      <FieldLabel className="text-[11px] uppercase text-primary mb-2 block pl-1">Gender</FieldLabel>
                      <ToggleGroup
                        disabled={otpStatus === "sending"}
                        value={[gender]}
                        onValueChange={(v) => {
                          if (v && v.length > 0) {
                            const val = v[v.length - 1];
                            if (val === "male" || val === "female") setGender(val);
                            console.log(val)
                          }
                        }}
                        className="justify-start"
                      >
                        <ToggleGroupItem variant="custom" value="male">Male</ToggleGroupItem>
                        <ToggleGroupItem variant="custom" value="female">Female</ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    <InputGroup className="h-auto rounded-md! sm:bg-transparent! bg-white! border-0!">
                      <InputGroupAddon align="block-start">
                        <InputGroupText className="text-[11px] uppercase ">Email Address</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-10 px-4 text-[14px] text-primary placeholder:text-primary/30 focus-within:text-secondary"
                        disabled={otpStatus === "sending"}
                      />
                    </InputGroup>

                    <InputGroup className="h-auto rounded-md! sm:bg-transparent! bg-white! border-0!">
                      <InputGroupAddon align="block-start">
                        <InputGroupText className="text-[11px] uppercase">Short Bio</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="h-10 px-4 text-[14px] text-primary placeholder:text-primary/30 focus-within:text-secondary"
                        disabled={otpStatus === "sending"}
                      />
                    </InputGroup>
                  </div>

                  {error && <ErrBanner msg={error} />}

                  <Button
                    type="submit"
                    variant="custom"
                    disabled={!name.trim() || !username.trim() || !email.trim() || otpStatus === "sending" || otpStatus === "verifying" || usernameStatus === "taken" || usernameStatus === "checking"}
                  >
                    {otpStatus === "sending" ? (
                      <>
                        <SpinnerIcon className="animate-spin" size={18} />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Verify Email
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {step === "otp_email" && (
                <form onSubmit={(e) => { e.preventDefault(); verifyOTP(); }}>
                  <BackBtn onClick={goBack} disabled={otpStatus === "verifying"} />
                  <h2 className="text-[36px] sm:text-[38px] font-normal text-foreground leading-[1.1] mb-2">
                    Check your inbox
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-[1.6] mb-4">
                    We sent an 8-digit code to{" "}
                    <strong className="text-foreground font-medium">{email}</strong>
                  </p>

                  <Field className="mb-4">
                    <div className="flex items-center justify-between">
                      <FieldLabel className="text-sm text-primary">
                        Verification OTP
                      </FieldLabel>
                      {otpStatus !== "verified" && (
                        <Button
                          variant="light"
                          size="sm"
                          type="button"
                          onClick={() => sendOTP(true)}
                          disabled={otpStatus === "sending"}
                        >
                          <ArrowsClockwiseIcon size={12} className={cn(otpStatus === "sending" && "animate-spin")} />
                          {otpStatus === "sending" ? "Sending..." : "Resend Code"}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-4">
                      <InputOTP
                        maxLength={8}
                        value={otp}
                        onChange={setOtp}
                        disabled={otpStatus === "verifying" || otpStatus === "verified"}
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

                          <div className="h-0.5 w-5 bg-black hidden sm:block" />

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
                  </Field>

                  {error && <ErrBanner msg={error} />}

                  <Button
                    type="submit"
                    variant="custom"
                    disabled={otp.length !== 8 || otpStatus === "verifying" || otpStatus === "verified"}
                  >
                    {otpStatus === "verifying" ? (
                      <>
                        Verifying...
                        <SpinnerIcon className="animate-spin" size={18} />
                      </>
                    ) : otpStatus === "verified" ? (
                      <>
                        Verified! Continuing...
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
                    Welcome to Surrealbox!
                  </h2>
                  <p className="text-[14px] text-muted-foreground leading-[1.7] max-w-xs mx-auto">
                    Your account has been created
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-primary">
                    <SpinnerIcon className="animate-spin" size={18} />
                    Redirecting…
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
