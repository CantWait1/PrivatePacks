"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Edit, Trash2, Search, ArrowLeft } from "lucide-react";
import { nexaLight } from "@/fonts/fonts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Pack {
  id: number;
  name: string;
  author: string;
  resolution: string;
  iconImage: string;
  tags: string[];
  downloadUrl: string;
  additionalImages: string[];
  downloadCount: number;
  viewCount: number;
  createdAt: string;
}

export default function AdminPacksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    resolution: "16x",
    iconImage: "",
    tags: "",
    downloadUrl: "",
    additionalImages: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !isAdmin) {
      router.push("/");
      return;
    }

    fetchPacks();
  }, [status, isAdmin, router]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/packs");

      if (!res.ok) {
        throw new Error("Failed to fetch packs");
      }

      const data = await res.json();
      setPacks(data.packs);
    } catch (error) {
      console.error("Error fetching packs:", error);
      setError("Failed to load packs");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      author: "",
      resolution: "16x",
      iconImage: "",
      tags: "",
      downloadUrl: "",
      additionalImages: "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const openEditDialog = (pack: Pack) => {
    setCurrentPack(pack);
    setFormData({
      name: pack.name,
      author: pack.author,
      resolution: pack.resolution,
      iconImage: pack.iconImage,
      tags: pack.tags.join(", "),
      downloadUrl: pack.downloadUrl,
      additionalImages: pack.additionalImages.join("\n"),
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (pack: Pack) => {
    setCurrentPack(pack);
    setShowDeleteDialog(true);
  };

  const handleAddPack = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      // Validate form
      if (
        !formData.name ||
        !formData.author ||
        !formData.resolution ||
        !formData.iconImage ||
        !formData.downloadUrl
      ) {
        setFormError("Please fill in all required fields");
        return;
      }

      // Process tags and additional images
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const additionalImages = formData.additionalImages
        ? formData.additionalImages
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/admin/packs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          author: formData.author,
          resolution: formData.resolution,
          iconImage: formData.iconImage,
          tags,
          downloadUrl: formData.downloadUrl,
          additionalImages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create pack");
      }

      setFormSuccess("Pack created successfully");
      resetForm();
      fetchPacks();

      // Close dialog after a short delay
      setTimeout(() => {
        setShowAddDialog(false);
        setFormSuccess(null);
      }, 1500);
    } catch (error) {
      console.error("Error creating pack:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to create pack"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPack = async () => {
    if (!currentPack) return;

    try {
      setFormLoading(true);
      setFormError(null);

      // Validate form
      if (
        !formData.name ||
        !formData.author ||
        !formData.resolution ||
        !formData.iconImage ||
        !formData.downloadUrl
      ) {
        setFormError("Please fill in all required fields");
        return;
      }

      // Process tags and additional images
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const additionalImages = formData.additionalImages
        ? formData.additionalImages
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean)
        : [];

      const res = await fetch(`/api/admin/packs/${currentPack.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          author: formData.author,
          resolution: formData.resolution,
          iconImage: formData.iconImage,
          tags,
          downloadUrl: formData.downloadUrl,
          additionalImages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update pack");
      }

      setFormSuccess("Pack updated successfully");
      fetchPacks();

      // Close dialog after a short delay
      setTimeout(() => {
        setShowEditDialog(false);
        setFormSuccess(null);
      }, 1500);
    } catch (error) {
      console.error("Error updating pack:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to update pack"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePack = async () => {
    if (!currentPack) return;

    try {
      setFormLoading(true);

      const res = await fetch(`/api/admin/packs/${currentPack.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete pack");
      }

      fetchPacks();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting pack:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to delete pack"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const filteredPacks = packs.filter(
    (pack) =>
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${nexaLight.className}`}>
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push("/admin")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
      </Button>

      <div className="bg-neutral-800/40 border-white border-solid border-[1px] text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Manage Packs</h1>

          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search packs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-neutral-700 border-neutral-600"
              />
            </div>

            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Pack
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-700">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Author</th>
                  <th className="p-3 text-left">Resolution</th>
                  <th className="p-3 text-left">Downloads</th>
                  <th className="p-3 text-left">Views</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-400">
                      No packs found
                    </td>
                  </tr>
                ) : (
                  filteredPacks.map((pack) => (
                    <tr
                      key={pack.id}
                      className="border-t border-neutral-700 hover:bg-neutral-700/50"
                    >
                      <td className="p-3">{pack.name}</td>
                      <td className="p-3">{pack.author}</td>
                      <td className="p-3">{pack.resolution}</td>
                      <td className="p-3">{pack.downloadCount}</td>
                      <td className="p-3">{pack.viewCount}</td>
                      <td className="p-3">
                        {new Date(pack.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(pack)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(pack)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Pack Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-neutral-900 text-white border-neutral-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Pack</DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {formSuccess && (
            <Alert className="mb-4 bg-green-900 border-green-800">
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="media">Media & Tags</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pack Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution *</Label>
                    <select
                      id="resolution"
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded-md"
                      required
                    >
                      <option value="16x">16x</option>
                      <option value="32x">32x</option>
                      <option value="64x">64x</option>
                      <option value="128x">128x</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downloadUrl">Download URL *</Label>
                    <Input
                      id="downloadUrl"
                      name="downloadUrl"
                      value={formData.downloadUrl}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iconImage">Icon Image URL *</Label>
                    <Input
                      id="iconImage"
                      name="iconImage"
                      value={formData.iconImage}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalImages">
                      Additional Images (one URL per line)
                    </Label>
                    <Textarea
                      id="additionalImages"
                      name="additionalImages"
                      value={formData.additionalImages}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      rows={4}
                      placeholder="https://example.com/image1.png&#10;https://example.com/image2.png"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      placeholder="PvP, Bedwars, UHC"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags.split(",").map((tag, index) => {
                        const trimmedTag = tag.trim();
                        if (!trimmedTag) return null;
                        return (
                          <Badge key={index} variant="secondary">
                            {trimmedTag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPack} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Pack"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pack Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-neutral-900 text-white border-neutral-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pack</DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {formSuccess && (
            <Alert className="mb-4 bg-green-900 border-green-800">
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="media">Media & Tags</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Pack Name *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-author">Author *</Label>
                    <Input
                      id="edit-author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-resolution">Resolution *</Label>
                    <select
                      id="edit-resolution"
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded-md"
                      required
                    >
                      <option value="16x">16x</option>
                      <option value="32x">32x</option>
                      <option value="64x">64x</option>
                      <option value="128x">128x</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-downloadUrl">Download URL *</Label>
                    <Input
                      id="edit-downloadUrl"
                      name="downloadUrl"
                      value={formData.downloadUrl}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-iconImage">Icon Image URL *</Label>
                    <Input
                      id="edit-iconImage"
                      name="iconImage"
                      value={formData.iconImage}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-additionalImages">
                      Additional Images (one URL per line)
                    </Label>
                    <Textarea
                      id="edit-additionalImages"
                      name="additionalImages"
                      value={formData.additionalImages}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                    <Input
                      id="edit-tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="bg-neutral-800 border-neutral-700"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags.split(",").map((tag, index) => {
                        const trimmedTag = tag.trim();
                        if (!trimmedTag) return null;
                        return (
                          <Badge key={index} variant="secondary">
                            {trimmedTag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPack} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Pack"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pack Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-neutral-900 text-white border-neutral-700">
          <DialogHeader>
            <DialogTitle>Delete Pack</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              Are you sure you want to delete{" "}
              <strong>{currentPack?.name}</strong>?
            </p>
            <p className="text-red-400 mt-2">This action cannot be undone.</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePack}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Pack"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
