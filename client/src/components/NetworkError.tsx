import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, RefreshCw } from "lucide-react";

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function NetworkError({ 
  message = "Unable to connect. Please check your internet connection and try again.", 
  onRetry 
}: NetworkErrorProps) {
  return (
    <Card className="mx-4 my-8">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Connection Error</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" data-testid="button-retry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function LoadingError({ 
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.", 
  onRetry 
}: { 
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <WifiOff className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" data-testid="button-retry">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}
