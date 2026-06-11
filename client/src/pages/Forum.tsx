import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  MessageSquare, Plus, ArrowLeft, Clock, User, 
  Heart, Activity, Brain, Utensils, HelpCircle, MessageCircle,
  ImagePlus, X, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ForumPost, User as UserType } from "@shared/schema";

const CATEGORIES = [
  { value: "all", label: "All Posts", icon: MessageSquare },
  { value: "general", label: "General", icon: MessageCircle },
  { value: "health", label: "Health", icon: Heart },
  { value: "training", label: "Training", icon: Activity },
  { value: "nutrition", label: "Nutrition", icon: Utensils },
  { value: "behavior", label: "Behavior", icon: Brain },
  { value: "activities", label: "Activities", icon: HelpCircle },
];

function getCategoryIcon(category: string) {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.icon || MessageSquare;
}

function getCategoryColor(category: string) {
  switch (category) {
    case "health": return "bg-destructive/10 text-destructive";
    case "training": return "bg-primary/10 text-primary";
    case "nutrition": return "bg-accent text-accent-foreground";
    case "behavior": return "bg-secondary text-secondary-foreground";
    case "activities": return "bg-muted text-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

type PostWithUser = ForumPost & { user?: { firstName: string | null; lastName: string | null } };

export default function Forum() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("general");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image must be less than 5MB", variant: "destructive" });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to get upload URL");
      
      const { uploadURL, objectPath } = await response.json();
      
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      
      if (!uploadResponse.ok) throw new Error("Failed to upload image");
      
      return objectPath;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const { data: posts = [], isLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/forum/posts", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/forum/posts" 
        : `/api/forum/posts?category=${selectedCategory}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; imageUrl?: string }) => {
      return apiRequest("POST", "/api/forum/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setIsDialogOpen(false);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCategory("general");
      removeImage();
      toast({ title: "Post created successfully" });
    },
    onError: () => {
      setIsUploading(false);
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    let imageUrl: string | undefined;
    
    if (selectedImage) {
      const uploadedPath = await uploadImage(selectedImage);
      if (uploadedPath) {
        imageUrl = uploadedPath;
      } else {
        toast({ title: "Failed to upload image", variant: "destructive" });
        setIsUploading(false);
        return;
      }
    }
    
    setIsUploading(false);
    createPostMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
      imageUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/more">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-heading font-semibold text-lg">Community Forum</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.value;
            return (
              <Button
                key={cat.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className="shrink-0"
                data-testid={`filter-${cat.value}`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" data-testid="button-create-post">
                <Plus className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.value !== "all").map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Enter your post title"
                    data-testid="input-post-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Write your post content..."
                    rows={5}
                    data-testid="input-post-content"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Pet Photo (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    data-testid="input-image"
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        data-testid="button-remove-image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-add-image"
                    >
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Add Pet Photo
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleCreatePost} 
                  className="w-full"
                  disabled={createPostMutation.isPending || isUploading}
                  data-testid="button-submit-post"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : createPostMutation.isPending ? (
                    "Creating..."
                  ) : (
                    "Create Post"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!user && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sign in to create posts and join the discussion</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-1">No posts yet</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCategory === "all"
                  ? "Be the first to start a discussion!"
                  : `No posts in ${selectedCategory} category yet.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const CategoryIcon = getCategoryIcon(post.category);
              return (
                <Link href={`/forum/post/${post.id}`} key={post.id}>
                <Card
                  className="hover-elevate cursor-pointer"
                  data-testid={`link-post-${post.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {post.imageUrl ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColor(post.category)}`}>
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {post.category}
                          </Badge>
                          {post.imageUrl && (
                            <Badge variant="outline" className="text-xs">
                              <ImagePlus className="w-3 h-3 mr-1" />
                              Photo
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium line-clamp-2" data-testid={`text-title-${post.id}`}>
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.user?.firstName 
                              ? `${post.user.firstName} ${post.user.lastName || ""}`.trim() 
                              : "Anonymous"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
