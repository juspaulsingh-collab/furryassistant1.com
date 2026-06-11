import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  BookOpen, Play, Clock, ArrowLeft, ExternalLink,
  Star, Filter
} from "lucide-react";
import { useLocation } from "wouter";
import type { TrainingResource } from "@shared/schema";

const difficultyColors: Record<string, string> = {
  beginner: "bg-chart-3/20 text-chart-3",
  intermediate: "bg-chart-5/20 text-chart-5",
  advanced: "bg-chart-4/20 text-chart-4",
};

function TrainingResourceCard({ resource }: { resource: TrainingResource }) {
  return (
    <Card className="hover-elevate" data-testid={`training-resource-${resource.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {resource.thumbnailUrl ? (
            <div className="w-24 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
              <img 
                src={resource.thumbnailUrl} 
                alt={resource.title} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs">{resource.category}</Badge>
              {resource.difficulty && (
                <Badge className={difficultyColors[resource.difficulty] || ""}>
                  {resource.difficulty}
                </Badge>
              )}
            </div>
            <h3 className="font-medium line-clamp-1">{resource.title}</h3>
            {resource.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {resource.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 capitalize">
                <Play className="w-3 h-3" />
                {resource.contentType}
              </span>
              {resource.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {resource.duration} min
                </span>
              )}
            </div>
          </div>
        </div>
        {resource.contentUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            asChild
          >
            <a href={resource.contentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Resource
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const categories = [
  "All",
  "Obedience",
  "Tricks",
  "Behavior",
  "Socialization",
  "House Training",
  "Leash Training",
];

export default function Training() {
  const [, navigate] = useLocation();

  const { data: resources, isLoading } = useQuery<TrainingResource[]>({
    queryKey: ["/api/training-resources"],
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Training Resources</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => (
            <Button 
              key={category}
              variant="outline" 
              size="sm"
              className="shrink-0"
              data-testid={`filter-${category.toLowerCase().replace(/\s/g, '-')}`}
            >
              {category}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource) => (
              <TrainingResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed" data-testid="empty-training">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No training resources</h3>
              <p className="text-sm text-muted-foreground">
                Training resources will appear here once available
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
