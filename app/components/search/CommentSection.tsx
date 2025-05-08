"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Reply,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { Filter } from "bad-words";
import { motion, AnimatePresence } from "framer-motion";
import { USERNAME_COLORS } from "@/app/constants/colors";
import {
  CustomDialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogButton,
} from "@/components/ui/custom-dialog";

interface Comment {
  id: number;
  packId: number;
  parentId: number | null;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  userVote: "up" | "down" | null;
  userRole: string;
  isVerified: boolean;
  colorPreference?: number;
  profileImage?: string;
}

interface CommentSectionProps {
  packId: number;
}

export default function CommentSection({ packId }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<
    Record<number, boolean>
  >({});
  const [replies, setReplies] = useState<Record<number, Comment[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [commentsPerPage] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Add a bad words filter instance
  const [filter] = useState(() => {
    const badWordsFilter = new Filter();
    badWordsFilter.addWords("badword1", "badword2");
    return badWordsFilter;
  });

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/comments?packId=${packId}&sort=${sortBy}&page=${currentPage}&limit=${commentsPerPage}`
      );
      if (!res.ok) throw new Error("Failed to fetch comments");

      const data = await res.json();
      setComments(data.comments || []);
      setTotalPages(Math.ceil(data.total / commentsPerPage));
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [packId, sortBy, currentPage]);

  const fetchReplies = async (commentId: number) => {
    try {
      const res = await fetch(
        `/api/comments?packId=${packId}&parentId=${commentId}`
      );
      if (!res.ok) throw new Error("Failed to fetch replies");

      const data = await res.json();
      setReplies((prev) => ({
        ...prev,
        [commentId]: data.comments || [],
      }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const toggleReplies = (commentId: number) => {
    const isExpanded = expandedReplies[commentId];

    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !isExpanded,
    }));

    if (!isExpanded && !replies[commentId]) {
      fetchReplies(commentId);
    }
  };

  const postComment = async (parentId: number | null = null) => {
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    const content = parentId === null ? newComment : replyContent;

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (content.length > 500) {
      setError("Comment is too long (max 500 characters)");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Clean the content with the bad words filter
      let cleanContent = content;
      try {
        cleanContent = filter.clean(content);
      } catch (e) {
        console.error("Error cleaning content:", e);
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          content: cleanContent,
          parentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      if (parentId === null) {
        // Add new top-level comment
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      } else {
        // Add new reply
        setReplies((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] || []), data.comment],
        }));
        setReplyContent("");
        setReplyingTo(null);

        // Update reply count
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parentId
              ? { ...comment, replyCount: comment.replyCount + 1 }
              : comment
          )
        );
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to post comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (
    commentId: number,
    voteType: "up" | "down" | "none"
  ) => {
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }

    try {
      const res = await fetch("/api/comments/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          voteType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to vote");
      }

      const data = await res.json();

      // Update the comment in state
      const updateComment = (commentList: Comment[]) =>
        commentList.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                upvoteCount: data.upvoteCount,
                downvoteCount: data.downvoteCount,
                userVote: data.userVote,
              }
            : comment
        );

      setComments(updateComment);

      // Also update in replies if needed
      setReplies((prev) => {
        const newReplies = { ...prev };

        for (const parentId in newReplies) {
          newReplies[parentId] = updateComment(newReplies[parentId]);
        }

        return newReplies;
      });
    } catch (error) {
      console.error("Error voting:", error);
      setError(error instanceof Error ? error.message : "Failed to vote");
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    // Check if user can delete this comment
    if (!session?.user) return;

    // Only allow users to delete their own comments or admins to delete any comment
    if (session.user.id !== comment.userId && session.user.role !== "ADMIN") {
      setError("You can only delete your own comments");
      return;
    }

    setCommentToDelete(comment);
    setShowDeleteDialog(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !session?.user) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/comments/${commentToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete comment");
      }

      // If it's a reply, update the parent comment's reply count
      if (commentToDelete.parentId) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentToDelete.parentId
              ? { ...comment, replyCount: Math.max(0, comment.replyCount - 1) }
              : comment
          )
        );

        // Remove from replies
        setReplies((prev) => {
          const newReplies = { ...prev };
          if (newReplies[commentToDelete.parentId!]) {
            newReplies[commentToDelete.parentId!] = newReplies[
              commentToDelete.parentId!
            ].filter((reply) => reply.id !== commentToDelete.id);
          }
          return newReplies;
        });
      } else {
        // Remove top-level comment
        setComments((prev) =>
          prev.filter((comment) => comment.id !== commentToDelete.id)
        );
      }

      setShowDeleteDialog(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete comment"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const score = comment.upvoteCount - comment.downvoteCount;
    const scoreColor =
      score > 0
        ? "text-green-500"
        : score < 0
        ? "text-red-500"
        : "text-gray-400";

    // Get the color class based on user preference
    const colorClass =
      comment.colorPreference !== undefined &&
      comment.colorPreference >= 0 &&
      comment.colorPreference < USERNAME_COLORS.length
        ? USERNAME_COLORS[comment.colorPreference]
        : USERNAME_COLORS[0];

    // Check if the current user is the comment author or an admin
    const canDelete =
      session?.user &&
      (session.user.id === comment.userId || session.user.role === "ADMIN");

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative ${isReply ? "mt-3" : "mb-5"}`}
      >
        {/* Reply line connector */}
        {isReply && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#333] -translate-y-3 h-[calc(100%+12px)]" />
        )}

        <div
          className={`relative bg-[#1a1a1a] border border-[#333] rounded-md p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-[#444] ${
            isReply ? "ml-8" : ""
          }`}
        >
          {/* Comment header with avatar and username */}
          <div className="flex items-start gap-4 mb-3">
            <Avatar
              className={`flex-shrink-0 transition-all duration-300 ${
                isReply
                  ? "h-8 w-8 rounded-full ring-1 ring-offset-1 ring-offset-[#121212] ring-blue-500/30 shadow-md shadow-blue-500/5 hover:ring-blue-500/50"
                  : "h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-[#121212] ring-blue-500/40 shadow-lg shadow-blue-500/10 hover:ring-blue-500/70 hover:scale-105"
              }`}
            >
              {comment.profileImage && (
                <AvatarImage
                  src={comment.profileImage || "/placeholder.svg"}
                  alt={comment.username}
                />
              )}
              <AvatarFallback
                className={`${
                  isReply
                    ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-semibold text-xs"
                    : "bg-gradient-to-br from-blue-600 to-purple-700 text-white font-semibold text-sm"
                }`}
              >
                {comment.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`font-semibold hover:underline transition-colors truncate max-w-[180px] ${colorClass}`}
                  onClick={() => router.push(`/profile/${comment.username}`)}
                >
                  {comment.username}
                </button>

                {comment.userRole === "ADMIN" && (
                  <Badge
                    variant="destructive"
                    className="text-xs px-1.5 py-0.5 h-5 bg-red-500/80"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}

                {comment.isVerified && (
                  <Badge
                    variant="default"
                    className="text-xs px-1.5 py-0.5 h-5 bg-green-500/80"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}

                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Comment content */}
          <div className="markdown-content pl-0 sm:pl-14 prose prose-sm prose-invert max-w-none prose-pre:bg-[#111] prose-pre:border prose-pre:border-[#333] prose-code:text-blue-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
            >
              {comment.content}
            </ReactMarkdown>
          </div>

          {/* Comment actions */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pl-0 sm:pl-14">
            <div className="flex items-center gap-1 bg-[#111] rounded-md p-1 border border-[#333]">
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 py-0 h-7 rounded-md transition-all duration-200 ${
                  comment.userVote === "up"
                    ? "bg-green-900/70 text-green-400 hover:bg-green-900/90"
                    : "hover:bg-[#222]"
                }`}
                onClick={() =>
                  handleVote(
                    comment.id,
                    comment.userVote === "up" ? "none" : "up"
                  )
                }
              >
                <ThumbsUp
                  className={`h-4 w-4 ${
                    comment.userVote === "up" ? "fill-green-400" : ""
                  }`}
                />
                <span className="ml-1">{comment.upvoteCount}</span>
              </Button>

              <div className="h-4 w-px bg-[#333] mx-0.5"></div>

              <Button
                variant="ghost"
                size="sm"
                className={`px-2 py-0 h-7 rounded-md transition-all duration-200 ${
                  comment.userVote === "down"
                    ? "bg-red-900/70 text-red-400 hover:bg-red-900/90"
                    : "hover:bg-[#222]"
                }`}
                onClick={() =>
                  handleVote(
                    comment.id,
                    comment.userVote === "down" ? "none" : "down"
                  )
                }
              >
                <ThumbsDown
                  className={`h-4 w-4 ${
                    comment.userVote === "down" ? "fill-red-400" : ""
                  }`}
                />
                <span className="ml-1">{comment.downvoteCount}</span>
              </Button>
            </div>

            <span className={`text-sm font-medium ${scoreColor}`}>
              {score !== 0 && (score > 0 ? `+${score}` : score)}
            </span>

            {!isReply && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 h-8 rounded-md transition-all duration-200 hover:bg-[#222] ${
                    replyingTo === comment.id
                      ? "bg-blue-900/50 text-blue-400"
                      : ""
                  }`}
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                >
                  <Reply className="h-4 w-4 mr-1.5" />
                  <span>Reply</span>
                </Button>

                {comment.replyCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-3 py-1 h-8 rounded-md transition-all duration-200 hover:bg-[#222]"
                    onClick={() => toggleReplies(comment.id)}
                  >
                    {expandedReplies[comment.id] ? (
                      <ChevronUp className="h-4 w-4 mr-1.5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1.5" />
                    )}
                    <span>
                      {comment.replyCount}{" "}
                      {comment.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  </Button>
                )}
              </>
            )}

            {/* Delete button - only visible to comment author or admin */}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="px-3 py-1 h-8 rounded-md transition-all duration-200 hover:bg-red-900/30 text-red-400 hover:text-red-300 ml-auto"
                onClick={() => handleDeleteComment(comment)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>

          {/* Reply form */}
          <AnimatePresence>
            {replyingTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pl-0 sm:pl-14 overflow-hidden"
              >
                <div className="bg-[#111] border border-[#333] rounded-md p-3">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="bg-[#1a1a1a] border-[#333] focus:border-[#444] focus:ring-1 focus:ring-blue-500 mb-2 resize-none"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {replyContent.length}/500 characters
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md border-[#333] hover:bg-[#222]"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-md bg-blue-600 hover:bg-blue-700"
                        onClick={() => postComment(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Replies section */}
        <AnimatePresence>
          {expandedReplies[comment.id] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-1 pl-8"
            >
              {replies[comment.id] ? (
                replies[comment.id].length > 0 ? (
                  <div className="space-y-0">
                    {replies[comment.id].map((reply) =>
                      renderComment(reply, true)
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-2">No replies yet</p>
                )
              ) : (
                <div className="flex justify-center py-3">
                  <Loader2 className="animate-spin text-gray-400" size={20} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Pagination controls
  const renderPagination = () => (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        className="rounded-md border-[#333] hover:bg-[#222] transition-all duration-200"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || loading}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-md px-4 py-1.5 text-sm">
        Page {currentPage} of {totalPages || 1}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="rounded-md border-[#333] hover:bg-[#222] transition-all duration-200"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0 || loading}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with title and sort controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-white">Comments</h3>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-sm text-gray-400">Sort by:</span>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-md p-1 flex">
            <Button
              variant="ghost"
              size="sm"
              className={`px-3 py-1 rounded-md transition-all duration-200 ${
                sortBy === "recent"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#222]"
              }`}
              onClick={() => {
                setSortBy("recent");
                setCurrentPage(1);
              }}
            >
              Recent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`px-3 py-1 rounded-md transition-all duration-200 ${
                sortBy === "popular"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#222]"
              }`}
              onClick={() => {
                setSortBy("popular");
                setCurrentPage(1);
              }}
            >
              Popular
            </Button>
          </div>
        </div>
      </div>

      {/* Comment input area */}
      {session?.user ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1a1a1a] border border-[#333] rounded-md p-4 shadow-lg"
        >
          <Textarea
            ref={commentInputRef}
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={500}
            className="bg-[#111] border-[#333] focus:border-[#444] focus:ring-1 focus:ring-blue-500 rounded-md resize-none transition-all duration-200"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">
              {newComment.length}/500 characters
            </span>
            <Button
              onClick={() => postComment()}
              disabled={isSubmitting || !newComment.trim()}
              className="rounded-md bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mt-2 bg-red-900/20 p-2 rounded-md border border-red-900/30"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1a1a1a] border border-[#333] rounded-md p-5 text-center shadow-lg"
        >
          <p className="text-gray-300">
            <a
              href="/sign-in"
              className="text-blue-400 hover:text-blue-300 underline decoration-dotted underline-offset-4 font-medium"
            >
              Sign in
            </a>{" "}
            to join the conversation
          </p>
        </motion.div>
      )}

      {/* Comments list */}
      <div className="space-y-0 mt-8">
        {loading && comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-white mb-4" size={32} />
            <p className="text-gray-400">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1a1a1a] border border-[#333] rounded-md p-8 text-center"
          >
            <p className="text-gray-400 text-lg">No comments yet</p>
            <p className="text-gray-500 mt-2">
              Be the first to share your thoughts!
            </p>
          </motion.div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && renderPagination()}

      {/* Delete Comment Confirmation Dialog */}
      <CustomDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        className="w-full max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Delete Comment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this comment? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogButton
            variant="outline"
            onClick={() => setShowDeleteDialog(false)}
          >
            Cancel
          </DialogButton>
          <DialogButton
            variant="destructive"
            onClick={confirmDeleteComment}
            disabled={isDeleting}
            className="flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </DialogButton>
        </DialogFooter>
      </CustomDialog>
    </div>
  );
}
