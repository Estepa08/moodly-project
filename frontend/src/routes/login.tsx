import { useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface Props {
  onLogin: (token: string) => void;
  navigate: (page: string) => void;
}

export default function LoginPage({ onLogin, navigate }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.auth.login({ email, password });
      onLogin(res.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  // DEMO-ONLY: remove before production
  const handleDemo = async () => {
    setDemoLoading(true);
    setError("");
    try {
      const res = await api.auth.demo();
      onLogin(res.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-moodly-700">Moodly</CardTitle>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full">Sign In</Button>
            {/* DEMO-ONLY: remove before production */}
            <Button type="button" variant="secondary" className="w-full" onClick={handleDemo} disabled={demoLoading}>
              {demoLoading ? "Starting..." : "Quick Demo"}
            </Button>
            <p className="text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <button type="button" className="text-moodly-600 hover:underline" onClick={() => navigate("register")}>
                Sign Up
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
