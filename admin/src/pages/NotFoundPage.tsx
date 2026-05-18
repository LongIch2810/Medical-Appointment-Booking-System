import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl rounded-[22px] border-[#d9d9dd]">
        <CardContent className="space-y-5 text-center">
          <div className="font-display text-6xl font-medium text-[#212121]">404</div>
          <h1 className="text-2xl font-medium text-[#212121]">
            Page not found
          </h1>
          <p className="text-sm text-[#75758a]">
            This route is not configured in the `admin` app, or the URL is incorrect.
          </p>
          <Button asChild>
            <Link to="/">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
