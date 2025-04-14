import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface AuthCardProps {
  onAuthenticate: (token: string) => void;
}

export function AuthCard({ onAuthenticate }: AuthCardProps) {
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onAuthenticate(password);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch (error) {
      setHasError(true);
      console.error("Error:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md min-h-screen flex items-center justify-center">
      <Button
        variant="ghost"
        size="sm"
        className="fixed text-lg top-4 left-4 text-muted-foreground hover:text-foreground flex items-center gap-2"
        asChild
      >
        <Link href="/">🏠</Link>
      </Button>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">StollerBot Manager</CardTitle>
          <CardDescription className="text-center">
            Knowledge Base Administration Tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
              />
            </div>

            {hasError && (
              <p className="text-sm text-destructive">
                Incorrect password. Please try again.
              </p>
            )}

            <Button type="submit" className="w-full">
              Access Tool
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
