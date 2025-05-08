"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Edit,
  Save,
  X,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Plus,
  Calendar,
} from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  id: number;
  title: string;
  content: string;
  category: string;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
  };
};

const Announcements = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [category, setCategory] = useState<string>("General");
  const [isImportant, setIsImportant] = useState<boolean>(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchAnnouncements = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await res.json();
      setAnnouncements(data.announcements);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("General");
    setIsImportant(false);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          isImportant,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create announcement");
      }

      await fetchAnnouncements();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnnouncement = async () => {
    if (!editingId) return;

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/announcements/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          isImportant,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update announcement");
      }

      await fetchAnnouncements();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete announcement");
      }

      await fetchAnnouncements();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategory(announcement.category);
    setIsImportant(announcement.isImportant);
    setIsFormOpen(true);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-neutral-900/95 border-neutral-700 border-solid border-[1px] text-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm mt-10 max-w-7xl mx-auto ${nexaLight.className}`}
      style={{
        boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.7)",
      }}
    >
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-center flex-grow bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Announcements & Changelog
        </h1>
        <div className="flex gap-3">
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl transition-all duration-300 shadow-md"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAnnouncements}
            className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded-xl transition-all duration-300 shadow-md"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/80 text-white p-4 rounded-xl mb-6 border border-red-700 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-4 bg-red-700 hover:bg-red-800 text-white py-1 px-3 rounded-xl text-sm transition-colors duration-300"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdmin && isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-800/90 p-6 rounded-xl mb-8 border border-neutral-700 shadow-lg backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {editingId ? "Edit Announcement" : "Create New Announcement"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title"
                    className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  >
                    <option value="General">General</option>
                    <option value="Update">Update</option>
                    <option value="Feature">New Feature</option>
                    <option value="Fix">Bug Fix</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isImportant"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="mr-2 h-4 w-4 accent-amber-500 transition-all duration-300"
                  />
                  <label
                    htmlFor="isImportant"
                    className="text-sm font-medium text-gray-300"
                  >
                    Mark as Important
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Content (Markdown supported)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Announcement content..."
                    rows={6}
                    className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetForm}
                    className="flex items-center gap-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded-xl transition-all duration-300 shadow-md"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={
                      editingId
                        ? handleEditAnnouncement
                        : handleCreateAnnouncement
                    }
                    disabled={loading}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-4 rounded-xl transition-all duration-300 shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : editingId ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editingId ? "Update" : "Publish"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {announcements.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-16 text-gray-400"
          >
            <p className="text-lg">No announcements yet.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
                  announcement.isImportant
                    ? "bg-amber-950/30 border-amber-700/70 hover:border-amber-600"
                    : "bg-neutral-800/70 border-neutral-700/70 hover:border-neutral-500"
                }`}
                whileHover={{
                  y: -2,
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {announcement.isImportant && (
                      <motion.div
                        initial={{ rotate: -15 }}
                        animate={{ rotate: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <AlertTriangle className="text-amber-400 h-5 w-5" />
                      </motion.div>
                    )}
                    <h3 className="text-xl font-bold">{announcement.title}</h3>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-full transition-colors duration-300 ${getCategoryStyles(
                      announcement.category
                    )}`}
                  >
                    {announcement.category}
                  </span>
                </div>

                <div className="prose prose-invert max-w-none mt-4 markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                          <pre className="bg-neutral-900 p-4 rounded-lg overflow-auto border border-neutral-800">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code
                            className="bg-neutral-900 px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-6 mb-4" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-6 mb-4" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-blue-500 pl-4 italic bg-neutral-800/50 py-1 rounded-r"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {announcement.content}
                  </ReactMarkdown>
                </div>

                <motion.div
                  className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-700 text-sm text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(announcement.createdAt).toLocaleDateString()} by{" "}
                      {announcement.author.username}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startEditing(announcement)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg text-sm transition-colors duration-300"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleDeleteAnnouncement(announcement.id)
                        }
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg text-sm transition-colors duration-300"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {loading && !error && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      )}
    </motion.div>
  );
};

// Helper function to get the appropriate styling for each category
const getCategoryStyles = (category) => {
  switch (category) {
    case "Update":
      return "bg-blue-900/50 text-blue-300 border border-blue-700/50";
    case "Feature":
      return "bg-green-900/50 text-green-300 border border-green-700/50";
    case "Fix":
      return "bg-amber-900/50 text-amber-300 border border-amber-700/50";
    case "Maintenance":
      return "bg-purple-900/50 text-purple-300 border border-purple-700/50";
    default:
      return "bg-neutral-800 text-neutral-300 border border-neutral-700/50";
  }
};

export default Announcements;
