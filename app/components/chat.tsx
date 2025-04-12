"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Edit,
  Save,
  X,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import { Filter } from "bad-words";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Chat = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter] = useState(new Filter());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [isUserMessagesOpen, setIsUserMessagesOpen] = useState<boolean>(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    reset: number;
  } | null>(null);

  const fetchMessages = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await res.json();
      setMessages(data.messages);

      const myMessages = data.messages.filter(
        (msg: any) => msg.author === session?.user?.username
      );
      setUserMessages(myMessages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMessages();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session) {
        fetchMessages();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [session]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleEditTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  };

  const handlePostMessage = async () => {
    const cleanedMessage = filter.clean(message);

    if (cleanedMessage.trim() === "") {
      setError("Message cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanedMessage,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setRateLimitInfo({
          remaining: data.remaining,
          reset: data.reset,
        });
        setError("You're sending messages too quickly. Please wait a moment.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post message");
      }

      setMessage("");

      await fetchMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (id: number, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditMessage = async () => {
    if (!editingId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/messages/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit message");
      }

      setEditingId(null);
      setEditText("");

      await fetchMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete message");
      }

      await fetchMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleUserMessages = () => {
    setIsUserMessagesOpen(!isUserMessagesOpen);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div
      className={`bg-neutral-800/40 border-white border-solid border-[1px] text-white p-10 rounded-2xl shadow-lg mt-10 max-w-7xl mx-auto ${nexaLight.className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-center flex-grow">Chat</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-green-400">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Protected</span>
          </div>
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded-xl transition-colors"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {rateLimitInfo && (
        <Alert className="mb-4 bg-yellow-900 border-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Rate Limit Warning</AlertTitle>
          <AlertDescription>
            You have {rateLimitInfo.remaining} messages remaining. Rate limit
            resets in {Math.ceil((rateLimitInfo.reset - Date.now()) / 1000)}{" "}
            seconds.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto p-2 bg-neutral-900/50 rounded-xl">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="p-4 bg-neutral-700 rounded-xl">
              <p className="font-semibold">{msg.author}</p>
              <p className="my-2">{msg.message}</p>
              <p className="text-sm text-gray-400">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-900 text-white p-4 rounded-xl mb-6">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 bg-red-700 hover:bg-red-800 text-white py-1 px-3 rounded-xl text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 mb-8 bg-neutral-700/30 p-6 rounded-xl">
        <div className="flex items-center gap-2 w-full max-w-xl">
          <MessageSquare className="text-gray-400" />
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Type a message"
            className="bg-neutral-800 border border-neutral-700 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePostMessage();
              }
            }}
          />
        </div>
        <button
          onClick={handlePostMessage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-center transition-colors duration-200 disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Posting...
            </span>
          ) : (
            "Post Message"
          )}
        </button>
      </div>

      <div className="border border-neutral-700 rounded-xl overflow-hidden mb-6">
        <button
          onClick={toggleUserMessages}
          className="flex justify-between items-center w-full p-4 bg-neutral-700 hover:bg-neutral-600 transition-colors"
        >
          <h2 className="text-2xl font-bold">Your Messages</h2>
          {isUserMessagesOpen ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <ChevronDown className="h-6 w-6" />
          )}
        </button>

        {isUserMessagesOpen && (
          <div className="space-y-4 p-4 max-h-[30vh] overflow-y-auto">
            {userMessages.length === 0 ? (
              <p className="text-center text-gray-400 py-4">
                You haven't posted any messages yet
              </p>
            ) : (
              userMessages.map((msg, index) => (
                <div key={index} className="p-4 bg-neutral-700 rounded-xl">
                  <p className="font-semibold">{msg.author}</p>

                  {editingId === msg.id ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={handleEditTextChange}
                        className="bg-neutral-800 border border-neutral-700 p-3 rounded-xl w-full max-w-xl mb-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleEditMessage();
                          }
                        }}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleEditMessage}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl"
                        >
                          <Save className="h-4 w-4" /> Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 bg-neutral-600 hover:bg-neutral-700 text-white py-2 px-4 rounded-xl"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="my-2">{msg.message}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => startEditing(msg.id, msg.message)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {loading && !error && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}
    </div>
  );
};

export default Chat;
