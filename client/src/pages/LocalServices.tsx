import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  MapPin, ArrowLeft, Phone, Star, ExternalLink,
  Stethoscope, Scissors, ShoppingBag, Home, Loader2,
  MessageSquare, X, Send, Map, List
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import type { LocalService as LocalServiceType, ServiceReview, User } from "@shared/schema";

const categories = [
  { id: "all", label: "All", icon: MapPin },
  { id: "veterinary", label: "Vets", icon: Stethoscope },
  { id: "groomer", label: "Groomers", icon: Scissors },
  { id: "pet_store", label: "Pet Stores", icon: ShoppingBag },
  { id: "boarding", label: "Boarding", icon: Home },
];

interface ServiceWithRating extends LocalServiceType {
  rating: number | null;
  reviewCount: number;
  distance?: string;
  distanceKm?: number;
  googlePlaceId?: string;
}

interface ServiceReviewWithUser extends ServiceReview {
  userName?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: { 
  rating: number; 
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-5 h-5";
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onClick={() => onRatingChange?.(star)}
          data-testid={`star-${star}`}
        >
          <Star 
            className={`${sizeClass} ${
              (hoverRating || rating) >= star 
                ? 'text-amber-500 fill-amber-500' 
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ServiceReviewWithUser }) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {review.userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium">{review.userName || 'Anonymous'}</span>
        </div>
        <StarRating rating={review.rating} readonly size="sm" />
      </div>
      {review.comment && (
        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        {new Date(review.createdAt!).toLocaleDateString()}
      </p>
    </div>
  );
}

function ServiceDetailDialog({ 
  service, 
  open, 
  onOpenChange 
}: { 
  service: ServiceWithRating | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<ServiceReviewWithUser[]>({
    queryKey: ['/api/local-services', service?.id, 'reviews'],
    enabled: !!service?.id && open,
  });

  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { serviceId: number; rating: number; comment: string }) => {
      const res = await apiRequest('POST', '/api/service-reviews', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thank you for your feedback!" });
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/local-services', service?.id, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/local-services'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to submit review", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmitReview = () => {
    if (!service) return;
    submitReviewMutation.mutate({
      serviceId: service.id,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  const categoryIcon = categories.find(c => c.id === service?.category)?.icon || MapPin;
  const Icon = categoryIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left truncate">{service?.name}</DialogTitle>
              <DialogDescription className="text-left">
                <Badge variant="secondary" className="text-xs capitalize mt-1">
                  {service?.category?.replace(/_/g, ' ')}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {service?.rating ? (
                  <>
                    <StarRating rating={Math.round(service.rating)} readonly size="sm" />
                    <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No ratings yet</span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {service?.reviewCount || 0} review{service?.reviewCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                {service?.address}
              </p>
              {service?.phone && (
                <p className="text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${service.phone}`} className="text-primary hover:underline">
                    {service.phone}
                  </a>
                </p>
              )}
              {service?.description && (
                <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              {service?.phone && (
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a href={`tel:${service.phone}`} data-testid="detail-call">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((service?.name || '') + ' ' + (service?.address || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="detail-directions"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Directions
                </a>
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Reviews
                </h3>
                {user && !showReviewForm && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowReviewForm(true)}
                    data-testid="button-write-review"
                  >
                    Write Review
                  </Button>
                )}
              </div>

              {showReviewForm && (
                <Card className="mb-4">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Your Rating</Label>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowReviewForm(false)}
                        data-testid="button-cancel-review"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <StarRating 
                      rating={reviewRating} 
                      onRatingChange={setReviewRating} 
                    />
                    <div>
                      <Label>Comment (optional)</Label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="mt-1"
                        data-testid="input-review-comment"
                      />
                    </div>
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={submitReviewMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-review"
                    >
                      {submitReviewMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      Submit Review
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!user && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sign in to write a review
                </p>
              )}

              {reviewsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length > 0 ? (
                <div>
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ServiceCard({ 
  service, 
  onClick 
}: { 
  service: ServiceWithRating; 
  onClick: () => void;
}) {
  const categoryIcon = categories.find(c => c.id === service.category)?.icon || MapPin;
  const Icon = categoryIcon;
  
  return (
    <Card 
      data-testid={`service-${service.id}`}
      className="cursor-pointer hover-elevate"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium truncate">{service.name}</h3>
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{service.rating?.toFixed(1) || 'New'}</span>
                <span className="text-muted-foreground">({service.reviewCount})</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs capitalize mt-1">
              {service.category.replace(/_/g, ' ')}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              {service.address}
            </p>
            {service.distance && (
              <p className="text-xs text-muted-foreground mt-1">{service.distance} away</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {service.phone && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a href={`tel:${service.phone}`} data-testid={`call-${service.id}`}>
                <Phone className="w-4 h-4 mr-1" />
                Call
              </a>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.name + ' ' + service.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`directions-${service.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Directions
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface GooglePlaceService {
  id: string;
  googlePlaceId: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviewCount: number;
  isOpen: boolean;
}

export default function LocalServices() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceWithRating | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMapMarker, setSelectedMapMarker] = useState<string | number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Use Google Places API when location is available
  const { data: googlePlaces = [], isLoading: googleLoading, error: googleError } = useQuery<GooglePlaceService[]>({
    queryKey: ['/api/places/nearby', userLocation?.lat, userLocation?.lng, selectedCategory],
    queryFn: async () => {
      if (!userLocation) return [];
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        type: selectedCategory,
      });
      const res = await fetch(`/api/places/nearby?${params}`);
      if (!res.ok) throw new Error('Failed to fetch places');
      return res.json();
    },
    enabled: locationEnabled && !!userLocation,
  });

  // Transform Google Places data to match existing ServiceWithRating format
  const servicesData: ServiceWithRating[] = googlePlaces.map((place) => ({
    id: 0, // Not used for Google places
    name: place.name,
    category: place.category,
    address: place.address,
    phone: place.phone,
    website: place.website,
    lat: place.lat ? String(place.lat) : null,
    lng: place.lng ? String(place.lng) : null,
    description: null,
    hours: null,
    imageUrl: null,
    createdAt: null,
    rating: place.rating,
    reviewCount: place.reviewCount,
    googlePlaceId: place.googlePlaceId,
  }));

  const servicesLoading = googleLoading;

  const servicesWithDistance = userLocation 
    ? servicesData.map((service) => {
        if (!service.lat || !service.lng) {
          return { ...service, distance: undefined, distanceKm: undefined };
        }
        const distKm = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(service.lat), parseFloat(service.lng));
        return {
          ...service,
          distanceKm: distKm,
          distance: distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`,
        };
      }).sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999))
    : servicesData;

  const enableLocation = () => {
    setLoading(true);
    setLocationError(null);
    
    if (!("geolocation" in navigator)) {
      setLoading(false);
      setLocationError("Location services are not available on this device.");
      toast({
        title: "Location Unavailable",
        description: "Your device does not support location services.",
        variant: "destructive",
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationEnabled(true);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        let errorMessage = "Unable to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your device settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please try again later.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        setLocationError(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleServiceClick = (service: ServiceWithRating) => {
    setSelectedService(service);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Local Services</h1>
          {locationEnabled && userLocation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              data-testid="button-toggle-view"
            >
              {viewMode === "list" ? <Map className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => (
            <Button 
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`filter-${category.id}`}
            >
              <category.icon className="w-4 h-4 mr-1" />
              {category.label}
            </Button>
          ))}
        </div>

        {!locationEnabled && (
          <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-medium">Find Pet Services Near You</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Discover veterinarians, groomers, pet stores, and boarding facilities in your area.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Your location is used only to find nearby services and is not stored or shared. 
                See our <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a> for details.
              </p>
              {locationError && (
                <p className="text-sm text-destructive mb-3">{locationError}</p>
              )}
              <Button size="sm" onClick={enableLocation} disabled={loading} data-testid="button-enable-location">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Finding services...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-1" />
                    Enable Location
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {locationEnabled && userLocation && (
          <Card className="mb-4 bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Showing services near your location</span>
              </div>
            </CardContent>
          </Card>
        )}

        {locationEnabled && servicesLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {locationEnabled && googleError && (
          <Card className="mb-4 border-destructive">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">
                Unable to load nearby services. Please try again later.
              </p>
            </CardContent>
          </Card>
        )}

        {locationEnabled && !servicesLoading && !googleError && servicesWithDistance.length > 0 ? (
          viewMode === "map" && userLocation ? (
            <div className="space-y-4">
              <GoogleMapComponent
                center={userLocation}
                zoom={14}
                height="400px"
                showCurrentLocation
                markers={servicesWithDistance
                  .filter(s => s.lat && s.lng)
                  .map((service, index) => ({
                    id: service.googlePlaceId || index,
                    position: { lat: parseFloat(service.lat!), lng: parseFloat(service.lng!) },
                    title: service.name,
                    onClick: () => handleServiceClick(service),
                  }))}
                selectedMarkerId={selectedMapMarker}
                onMarkerSelect={(id) => {
                  setSelectedMapMarker(id);
                  if (id) {
                    const service = servicesWithDistance.find(
                      (s, index) => (s.googlePlaceId || index) === id
                    );
                    if (service) handleServiceClick(service);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground text-center">
                Tap a marker to view details
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {servicesWithDistance.map((service, index) => (
                <ServiceCard 
                  key={service.googlePlaceId || index} 
                  service={service} 
                  onClick={() => handleServiceClick(service)}
                />
              ))}
            </div>
          )
        ) : locationEnabled && !servicesLoading ? (
          <Card className="border-dashed" data-testid="empty-services">
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No services found</h3>
              <p className="text-sm text-muted-foreground">
                No {selectedCategory !== "all" ? selectedCategory.replace(/_/g, ' ') + " " : ""}services found in this area
              </p>
            </CardContent>
          </Card>
        ) : null}
      </main>

      <ServiceDetailDialog 
        service={selectedService}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <BottomNavigation />
    </div>
  );
}
