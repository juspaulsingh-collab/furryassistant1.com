import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, Clock, User, Send, Trash2, MessageCircle, Share2
} from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import { Link } from "wouter";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ForumPost, ForumComment, User as UserType } from "@shared/schema";

const APP_DOWNLOAD_URL = "https://furry-assistant-1--juspaulsingh.replit.app";

type PostWithUser = ForumPost & { user?: { firstName: string | null; lastName: string | null } };
type CommentWithUser = ForumComment & { user?: { firstName: string | null; lastName: string | null } };

export default function ForumPostPage() {
  const [, params] = useRoute("/forum/post/:id");
  const [, navigate] = useLocation();
  const postId = params?.id ? parseInt(params.id) : null;
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const { data: post, isLoading: postLoading } = useQuery<PostWithUser>({
    queryKey: ["/api/forum/posts", postId],
    queryFn: async () => {
      const res = await fetch(`/api/forum/posts/${postId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/forum/posts", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/forum/posts/${postId}/comments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!postId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/forum/comments", { postId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      setNewComment("");
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/forum/posts/${postId}`);
    },
    onSuccess: () => {
      toast({ title: "Post deleted" });
      navigate("/forum");
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("DELETE", `/api/forum/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", postId, "comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast({ title: "Please enter a comment", variant: "destructive" });
      return;
    }
    createCommentMutation.mutate(newComment);
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/forum">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-heading font-semibold text-lg">Post</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/forum">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-heading font-semibold text-lg">Post</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-1">Post not found</h3>
              <p className="text-sm text-muted-foreground">This post may have been deleted.</p>
              <Link href="/forum">
                <Button className="mt-4" variant="outline">
                  Back to Forum
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  const isOwner = user?.id === post.userId;
  
  const getShareMessage = () => {
    const message = `Check out my pet on Furry Assistant 1! "${post.title}" - Download the app: ${APP_DOWNLOAD_URL}`;
    return encodeURIComponent(message);
  };

  const getPostUrl = () => {
    return encodeURIComponent(window.location.href);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${getPostUrl()}&quote=${getShareMessage()}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${getShareMessage()}&url=${getPostUrl()}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToLinkedIn = () => {
    const postUrlWithApp = encodeURIComponent(`${window.location.href}\n\nDownload Furry Assistant 1: ${APP_DOWNLOAD_URL}`);
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${getPostUrl()}&summary=${getShareMessage()}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out my pet on Furry Assistant 1! Download the app: ${APP_DOWNLOAD_URL}`,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast({ title: "Failed to share", variant: "destructive" });
        }
      }
    } else {
      navigator.clipboard.writeText(`${post.title} - ${window.location.href}\n\nDownload Furry Assistant 1: ${APP_DOWNLOAD_URL}`);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/forum">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-heading font-semibold text-lg truncate">Post</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deletePostMutation.mutate()}
                disabled={deletePostMutation.isPending}
                data-testid="button-delete-post"
              >
                <Trash2 className="w-5 h-5 text-destructive" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Card data-testid="card-post-detail">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="capitalize">
                {post.category}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold mb-3" data-testid="text-post-title">
              {post.title}
            </h2>
            {post.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt="Post image"
                  className="w-full h-auto max-h-80 object-cover"
                  data-testid="img-post"
                />
              </div>
            )}
            <p className="text-foreground whitespace-pre-wrap" data-testid="text-post-content">
              {post.content}
            </p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.user?.firstName 
                  ? `${post.user.firstName} ${post.user.lastName || ""}`.trim() 
                  : "Anonymous"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a") : "Unknown"}
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share this post
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToFacebook}
                  data-testid="button-share-facebook"
                >
                  <SiFacebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToTwitter}
                  data-testid="button-share-twitter"
                >
                  <SiX className="w-4 h-4 mr-2" />
                  X
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToLinkedIn}
                  data-testid="button-share-linkedin"
                >
                  <SiLinkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNativeShare}
                  data-testid="button-share-copy"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Shared posts include a link to download Furry Assistant 1
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({comments.length})
          </h3>

          {user ? (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  data-testid="input-comment"
                />
                <Button
                  className="w-full mt-3"
                  onClick={handleSubmitComment}
                  disabled={createCommentMutation.isPending}
                  data-testid="button-submit-comment"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Sign in to comment on this post</p>
              </CardContent>
            </Card>
          )}

          {commentsLoading ? (
            <Card>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : comments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => {
                const commentOwner = user?.id === comment.userId;
                return (
                  <Card key={comment.id} data-testid={`card-comment-${comment.id}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {comment.user?.firstName?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {comment.user?.firstName 
                                ? `${comment.user.firstName} ${comment.user.lastName || ""}`.trim() 
                                : "Anonymous"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, h:mm a") : ""}
                              </span>
                              {commentOwner && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  disabled={deleteCommentMutation.isPending}
                                  data-testid={`button-delete-comment-${comment.id}`}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap" data-testid={`text-comment-${comment.id}`}>
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
