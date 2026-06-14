"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type FormValues = { email: string };

export function LoginForm({ next }: { next?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: "" } });

  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit({ email }: FormValues) {
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", env.NEXT_PUBLIC_SITE_URL);
    if (next) redirectTo.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo.toString() },
    });

    if (error) {
      toast.error("Could not send the link", { description: error.message });
      return;
    }
    setSent(email);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-primary/10 text-primary mx-auto grid h-12 w-12 place-items-center rounded-full">
          <Mail className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Check your inbox</h2>
          <p className="text-muted-foreground text-sm">
            We sent a magic link to{" "}
            <span className="text-foreground font-medium">{sent}</span>. Click it
            to finish signing in.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setSent(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@domain.com"
          aria-invalid={!!errors.email}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Looks invalid",
            },
          })}
        />
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send magic link"
        )}
      </Button>
    </form>
  );
}
