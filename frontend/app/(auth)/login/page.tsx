"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowRight, ArrowLeft, Home } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid university email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (response.error) {
        setServerError(response.error.message || "Invalid email or password");
        return;
      }

      // Successful login - redirect to student/organizer/admin portal based on role
      const userRole = response.data?.user?.role;
      const target =
        userRole === "admin"
          ? "/admin"
          : userRole === "organizer"
            ? "/organizer"
            : "/student";
      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Unable to connect to authentication server",
      );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in with your university account to access events and tickets
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold tracking-wide text-foreground uppercase"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="student@university.edu"
            {...register("email")}
            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Password
            </label>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full justify-center gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-5 flex flex-col items-center gap-3 text-center text-xs text-muted-foreground">
        <div>
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Register here
          </Link>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
