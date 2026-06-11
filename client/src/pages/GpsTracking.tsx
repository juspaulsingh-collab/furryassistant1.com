import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Play,
  Square,
  MapPin,
  Clock,
  Navigation,
  Loader2,
  AlertCircle,
} from "lucide-react";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import type { Pet } from "@shared/schema";

interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

function calculateDistance(points: GpsPoint[]): number {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    totalDistance += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  return totalDistance;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GpsTracking() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [activityType, setActivityType] = useState<string>("walk");
  const [isTracking, setIsTracking] = useState(false);
  const [routePoints, setRoutePoints] = useState<GpsPoint[]>([]);
  const [duration, setDuration] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: pets, isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      petId: number;
      activityType: string;
      duration: number;
      distance: string;
      date: string;
      routeData: GpsPoint[];
      startTime: string;
      endTime: string;
    }) => {
      const response = await apiRequest("POST", "/api/activities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity saved with GPS route!" });
      navigate("/activities");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save activity", description: error.message, variant: "destructive" });
    },
  });

  const startTracking = useCallback(() => {
    if (!selectedPetId) {
      toast({ title: "Please select a pet", variant: "destructive" });
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsError(null);
    setRoutePoints([]);
    setDuration(0);
    startTimeRef.current = new Date();
    setIsTracking(true);

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
        const point: GpsPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        setRoutePoints((prev) => [...prev, point]);
        setGpsError(null);
      },
      (error) => {
        let errorMessage = "GPS error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Try moving to a better spot.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setGpsError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }, [selectedPetId, toast]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTracking(false);

    if (routePoints.length > 0 && selectedPetId && startTimeRef.current) {
      const distance = calculateDistance(routePoints);
      const endTime = new Date();

      saveMutation.mutate({
        petId: selectedPetId,
        activityType,
        duration: Math.max(1, Math.ceil(duration / 60)),
        distance: distance.toFixed(2),
        date: new Date().toISOString().split("T")[0],
        routeData: routePoints,
        startTime: startTimeRef.current.toISOString(),
        endTime: endTime.toISOString(),
      });
    } else if (routePoints.length === 0) {
      toast({ title: "No GPS points recorded", description: "The activity was not saved.", variant: "destructive" });
    }
  }, [routePoints, selectedPetId, activityType, duration, saveMutation, toast]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const distance = calculateDistance(routePoints);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/activities")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">GPS Tracking</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!isTracking && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Pet</label>
                <Select
                  value={selectedPetId?.toString() || ""}
                  onValueChange={(v) => setSelectedPetId(parseInt(v))}
                  disabled={petsLoading}
                >
                  <SelectTrigger data-testid="select-pet">
                    <SelectValue placeholder="Choose a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets?.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id.toString()}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Activity Type</label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger data-testid="select-activity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk">Walk</SelectItem>
                    <SelectItem value="run">Run</SelectItem>
                    <SelectItem value="hike">Hike</SelectItem>
                    <SelectItem value="play">Play</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Duration</span>
                </div>
                <p className="text-2xl font-bold font-mono" data-testid="text-duration">
                  {formatDuration(duration)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Navigation className="w-4 h-4" />
                  <span className="text-xs">Distance</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-distance">
                  {distance.toFixed(2)} <span className="text-sm font-normal">km</span>
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs">Points</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-points">
                  {routePoints.length}
                </p>
              </div>
            </div>

            {currentPosition && isTracking && (
              <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-chart-3" />
                  <span>
                    {currentPosition.coords.latitude.toFixed(6)},{" "}
                    {currentPosition.coords.longitude.toFixed(6)}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {currentPosition.coords.accuracy.toFixed(0)}m accuracy
                  </Badge>
                </div>
              </div>
            )}

            {routePoints.length > 0 && (
              <div className="mb-4">
                <GoogleMapComponent
                  center={routePoints[routePoints.length - 1]}
                  zoom={16}
                  height="250px"
                  routePoints={routePoints}
                />
              </div>
            )}

            {gpsError && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm">{gpsError}</p>
              </div>
            )}

            {!isTracking && (
              <p className="text-xs text-muted-foreground text-center mb-4">
                GPS tracking records your route to save with the activity. Location data is stored only in your account.{" "}
                <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>
              </p>
            )}

            <div className="flex justify-center">
              {!isTracking ? (
                <Button
                  size="lg"
                  onClick={startTracking}
                  disabled={!selectedPetId}
                  className="w-32 h-32 rounded-full"
                  data-testid="button-start-tracking"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Play className="w-8 h-8" />
                    <span>Start</span>
                  </div>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopTracking}
                  disabled={saveMutation.isPending}
                  className="w-32 h-32 rounded-full"
                  data-testid="button-stop-tracking"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Square className="w-8 h-8" />
                      <span>Stop</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isTracking && (
          <p className="text-center text-sm text-muted-foreground">
            Keep this page open while tracking. GPS updates every few seconds.
          </p>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
