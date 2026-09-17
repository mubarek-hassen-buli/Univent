"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid university email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "organizer"]),
  studentId: z.string().optional(),
  department: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
      studentId: "",
      department: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const response = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        studentId: values.studentId || "",
        department: values.department || "",
      });

      if (response.error) {
        setServerError(response.error.message || "Failed to create account");
        return;
      }

      // Redirect to appropriate portal based on role
      const redirectTarget = values.role === "organizer" ? "/organizer" : "/student";
      router.push(redirectTarget);
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
          Create an Account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join the Univent platform to register for events or organize them
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role Selector Segmented Control */}
        <div>
          <label className="block text-xs font-semibold tracking-wide text-foreground uppercase">
            Account Type
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/50 p-1">
            <label
              className={`flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-xs font-medium transition ${
                selectedRole === "student"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                value="student"
                {...register("role")}
                className="sr-only"
              />
              Student
            </label>
            <label
              className={`flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-xs font-medium transition ${
                selectedRole === "organizer"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                value="organizer"
                {...register("role")}
                className="sr-only"
              />
              Event Organizer
            </label>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold tracking-wide text-foreground uppercase"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Jane Doe"
            {...register("name")}
            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold tracking-wide text-foreground uppercase"
          >
            University Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="jane@university.edu"
            {...register("email")}
            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Student ID or Department */}
        {selectedRole === "student" ? (
          <div>
            <label
              htmlFor="studentId"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Student ID (Optional)
            </label>
            <input
              id="studentId"
              type="text"
              placeholder="e.g. UGR/1234/15"
              {...register("studentId")}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="department"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Department or Club Name
            </label>
            <input
              id="department"
              type="text"
              placeholder="e.g. ICT Club / CS Department"
              {...register("department")}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold tracking-wide text-foreground uppercase"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
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
          className="mt-3 w-full justify-center gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
