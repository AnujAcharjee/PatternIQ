"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Loader2, AlertCircle, Lock } from "lucide-react";

function formatAuthError(rawError: string | null | undefined): string | null {
  if (!rawError) return null;
  const lower = rawError.toLowerCase();
  if (
    lower.includes("prisma") ||
    lower.includes("database") ||
    lower.includes("invocation") ||
    lower.includes("econnrefused") ||
    lower.includes("failed") ||
    rawError.length > 100
  ) {
    return "Authentication failed. Please try again later.";
  }
  return rawError;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(formatAuthError(searchParams?.get("error")));
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push(redirect);
    } else {
      setError(res.error || "Failed to sign in. Please verify your credentials.");
    }
  };

  const registerHref =
    redirect && redirect !== "/dashboard"
      ? `/register?redirect=${encodeURIComponent(redirect)}`
      : "/register";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-2">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue your DSA pattern mastery journey
          </p>
        </div>

        <Card className="border-border/80 shadow-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Enter your email and password to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {redirect && redirect !== "/dashboard" && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Please sign in to access that page</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-base font-semibold rounded-xl shadow-sm transition-all hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1 pt-2 text-center text-xs text-muted-foreground">
                <span>Don&apos;t have an account?</span>
                <Link href={registerHref} className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
            <CardFooter className="pt-0" />
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
