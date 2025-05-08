"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DragDropUpload from "@/app/components/DragDropUpload"; // Import the improved component
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Add,
  Edit,
  Delete,
  Search,
  ArrowBack,
  Link as LinkIcon,
  Clear,
  Refresh,
  FilterList,
  Download,
  Visibility,
  Help,
} from "@mui/icons-material";

// Create a light theme with white/neutral colors and improved accessibility
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#9c27b0",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    error: {
      main: "#d32f2f",
    },
    success: {
      main: "#2e7d32",
    },
  },
  components: {
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        disablePortal: true,
        TransitionProps: { timeout: 100 },
      },
      styleOverrides: {
        paper: {
          overflow: "hidden",
          willChange: "transform",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
  },
  typography: {
    button: {
      fontWeight: 500,
    },
  },
});

// Interface for Pack type
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

// TabPanel component for tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPacksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";

  // States
  const [packs, setPacks] = useState<Pack[]>([]);
  const [displayedPacks, setDisplayedPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);

  // Dialog states
  const [dialogAction, setDialogAction] = useState<
    "add" | "edit" | "delete" | null
  >(null);
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);

  // Upload states
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [optimizeImages, setOptimizeImages] = useState(true);

  // Local file states for previews
  const [localAdditionalFiles, setLocalAdditionalFiles] = useState<File[]>([]);
  const [localIconFile, setLocalIconFile] = useState<File | null>(null);

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

  // Fetch packs on component mount
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isAdmin) {
      router.push("/");
      return;
    }
    fetchPacks();
  }, [status, isAdmin, router]);

  // Update displayed packs when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayedPacks([]);
    } else {
      const filtered = packs.filter(
        (pack) =>
          pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pack.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pack.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setDisplayedPacks(filtered);
    }
  }, [searchTerm, packs]);

  // Fetch packs from API
  const fetchPacks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/packs");
      if (!res.ok) throw new Error("Failed to fetch packs");
      const data = await res.json();
      setPacks(data.packs);
      // Initially don't display any packs until search
      setDisplayedPacks([]);
    } catch (error) {
      console.error("Error fetching packs:", error);
      setError("Failed to load packs");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form fields
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
    setLocalIconFile(null);
    setLocalAdditionalFiles([]);
  };

  // Dialog actions
  const openDialog = (
    action: "add" | "edit" | "delete",
    pack: Pack | null = null
  ) => {
    if (action === "add") {
      resetForm();
    } else if (pack && action === "edit") {
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
    } else if (pack && action === "delete") {
      setCurrentPack(pack);
    }
    setDialogAction(action);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogAction(null);
    setCurrentPack(null);
    setLocalIconFile(null);
    setLocalAdditionalFiles([]);
  };

  // Handle icon file selection
  const handleIconSelected = async (file: File) => {
    setLocalIconFile(file);
    await handleFileUpload(file, "icon");
  };

  // Handle additional images selection
  const handleAdditionalImagesSelected = async (files: File[]) => {
    setLocalAdditionalFiles((prev) => [...prev, ...files]);

    // Upload each file sequentially
    for (const file of files) {
      await handleFileUpload(file, "additional");
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File, type: "icon" | "additional") => {
    try {
      if (type === "icon") setUploadingIcon(true);
      else setUploadingAdditional(true);

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", type);
      if (formData.name) uploadFormData.append("packName", formData.name);
      uploadFormData.append("optimize", optimizeImages.toString());
      uploadFormData.append("maxWidth", "1024");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();

      if (type === "icon") {
        setFormData((prev) => ({ ...prev, iconImage: data.url }));
      } else {
        // For additional images, append to existing ones
        setFormData((prev) => ({
          ...prev,
          additionalImages: [
            ...(prev.additionalImages
              ? prev.additionalImages.split("\n").filter(Boolean)
              : []),
            data.url,
          ].join("\n"),
        }));
      }

      return data.url;
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      setFormError(
        error instanceof Error
          ? error.message
          : `Failed to upload ${type} image`
      );
      return null;
    } finally {
      if (type === "icon") setUploadingIcon(false);
      else setUploadingAdditional(false);
    }
  };

  // Clear image states
  const clearIconImage = () => {
    setFormData((prev) => ({ ...prev, iconImage: "" }));
    setLocalIconFile(null);
  };

  const clearAdditionalImage = (index: number) => {
    setFormData((prev) => {
      const images = prev.additionalImages.split("\n").filter(Boolean);
      images.splice(index, 1);
      return { ...prev, additionalImages: images.join("\n") };
    });

    // Also remove from local files
    setLocalAdditionalFiles((prev) => {
      const newFiles = [...prev];
      // Only remove if index is valid
      if (index < newFiles.length) {
        newFiles.splice(index, 1);
      }
      return newFiles;
    });
  };

  // Handle pack operations (add, edit, delete)
  const handlePackOperation = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      // Validate form for add/edit
      if (
        dialogAction !== "delete" &&
        (!formData.name ||
          !formData.author ||
          !formData.resolution ||
          !formData.iconImage ||
          !formData.downloadUrl)
      ) {
        setFormError("Please fill in all required fields");
        return;
      }

      let url, method, body;

      // Process additional images properly
      const additionalImagesArray = formData.additionalImages
        ? formData.additionalImages
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean)
        : [];

      if (dialogAction === "add") {
        url = "/api/admin/packs";
        method = "POST";
        body = {
          name: formData.name,
          author: formData.author,
          resolution: formData.resolution,
          iconImage: formData.iconImage,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          downloadUrl: formData.downloadUrl,
          additionalImages: additionalImagesArray,
        };
      } else if (dialogAction === "edit" && currentPack) {
        url = `/api/admin/packs/${currentPack.id}`;
        method = "PATCH";
        body = {
          name: formData.name,
          author: formData.author,
          resolution: formData.resolution,
          iconImage: formData.iconImage,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          downloadUrl: formData.downloadUrl,
          additionalImages: additionalImagesArray,
        };
      } else if (dialogAction === "delete" && currentPack) {
        url = `/api/admin/packs/${currentPack.id}`;
        method = "DELETE";
      }

      const res = await fetch(url, {
        method,
        ...(body && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${dialogAction} pack`);
      }

      if (dialogAction !== "delete") {
        setFormSuccess(
          `Pack ${dialogAction === "add" ? "created" : "updated"} successfully`
        );
        setTimeout(() => {
          closeDialog();
          setFormSuccess(null);
        }, 1500);
      } else {
        closeDialog();
      }

      fetchPacks();
    } catch (error) {
      console.error(`Error ${dialogAction}ing pack:`, error);
      setFormError(
        error instanceof Error
          ? error.message
          : `Failed to ${dialogAction} pack`
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    setDisplayedPacks([]);
  };

  // Refresh packs list
  const handleRefresh = () => {
    fetchPacks();
  };

  // Toggle stats visibility
  const toggleStats = () => {
    setStatsVisible(!statsVisible);
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Loading state
  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Unauthorized state
  if (!isAdmin) return null;

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
          onClick={() => router.push("/admin")}
        >
          Back to Admin Panel
        </Button>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              mb: 3,
              gap: 2,
            }}
          >
            <Typography variant="h4" component="h1" fontWeight="bold">
              Manage Packs
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <TextField
                placeholder="Search packs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                        size="small"
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Tooltip title="Show/Hide Stats">
                <IconButton
                  onClick={toggleStats}
                  color={statsVisible ? "primary" : "default"}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>

              <Tooltip title="Refresh List">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openDialog("add")}
              >
                Add Pack
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : (
            <>
              {searchTerm.trim() === "" ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary" paragraph>
                    Enter a search term to display packs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You can search by name, author, or tags
                  </Typography>
                </Box>
              ) : displayedPacks.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary">
                    No packs found matching "{searchTerm}"
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Author</TableCell>
                        <TableCell>Resolution</TableCell>
                        {statsVisible && (
                          <>
                            <TableCell>Downloads</TableCell>
                            <TableCell>Views</TableCell>
                          </>
                        )}
                        <TableCell>Created</TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedPacks.map((pack) => (
                        <TableRow key={pack.id}>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                component="img"
                                src={pack.iconImage}
                                alt={pack.name}
                                sx={{ width: 32, height: 32, borderRadius: 1 }}
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                              {pack.name}
                            </Box>
                          </TableCell>
                          <TableCell>{pack.author}</TableCell>
                          <TableCell>{pack.resolution}</TableCell>
                          {statsVisible && (
                            <>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Download fontSize="small" color="action" />
                                  {pack.downloadCount}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Visibility fontSize="small" color="action" />
                                  {pack.viewCount}
                                </Box>
                              </TableCell>
                            </>
                          )}
                          <TableCell>{formatDate(pack.createdAt)}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {pack.tags.slice(0, 3).map((tag, i) => (
                                <Chip
                                  key={i}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                              {pack.tags.length > 3 && (
                                <Chip
                                  label={`+${pack.tags.length - 3}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "flex-end",
                              }}
                            >
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openDialog("edit", pack)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDialog("delete", pack)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog
          open={dialogAction === "add" || dialogAction === "edit"}
          onClose={closeDialog}
          maxWidth="md"
          fullWidth
          keepMounted={false}
          disableEscapeKeyDown={false}
          disableAutoFocus={true}
        >
          <DialogTitle>
            {dialogAction === "add" ? "Add New Pack" : "Edit Pack"}
          </DialogTitle>

          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            {formSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {formSuccess}
              </Alert>
            )}

            <Box sx={{ mt: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
              >
                <Tab label="Basic Info" />
                <Tab label="Media & Tags" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Pack Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    fullWidth
                  />

                  <FormControl fullWidth>
                    <InputLabel>Resolution</InputLabel>
                    <Select
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleInputChange}
                      label="Resolution"
                    >
                      <MenuItem value="16x">16x</MenuItem>
                      <MenuItem value="32x">32x</MenuItem>
                      <MenuItem value="64x">64x</MenuItem>
                      <MenuItem value="128x">128x</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Download URL"
                    name="downloadUrl"
                    value={formData.downloadUrl}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Icon Image *
                    </Typography>

                    <DragDropUpload
                      onFileSelected={handleIconSelected}
                      currentImageUrl={formData.iconImage}
                      onClearCurrentImage={clearIconImage}
                    />

                    {uploadingIcon && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2">Uploading...</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Additional Images
                    </Typography>

                    <DragDropUpload
                      onFileSelected={(file) =>
                        handleAdditionalImagesSelected([file])
                      }
                      onAdditionalImagesSelected={
                        handleAdditionalImagesSelected
                      }
                      additionalImages={
                        formData.additionalImages
                          ? formData.additionalImages.split("\n")
                          : []
                      }
                      onClearAdditionalImage={clearAdditionalImage}
                      multiple={true}
                    />

                    {uploadingAdditional && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2">Uploading...</Typography>
                      </Box>
                    )}
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={optimizeImages}
                        onChange={(e) => setOptimizeImages(e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                          Optimize images (reduce file size)
                        </Typography>
                        <Tooltip title="Optimizes image file size without significant quality loss">
                          <Help fontSize="small" color="action" />
                        </Tooltip>
                      </Box>
                    }
                  />

                  <Box>
                    <TextField
                      label="Tags (comma separated)"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="PvP, Bedwars, UHC"
                      fullWidth
                      helperText="Add descriptive tags to help users find your pack"
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      {formData.tags.split(",").map((tag, index) => {
                        const trimmedTag = tag.trim();
                        if (!trimmedTag) return null;
                        return (
                          <Chip key={index} label={trimmedTag} size="small" />
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handlePackOperation}
              variant="contained"
              disabled={formLoading}
              startIcon={
                formLoading && <CircularProgress size={16} color="inherit" />
              }
            >
              {formLoading
                ? dialogAction === "add"
                  ? "Creating..."
                  : "Updating..."
                : dialogAction === "add"
                ? "Create Pack"
                : "Update Pack"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={dialogAction === "delete"}
          onClose={closeDialog}
          keepMounted={false}
        >
          <DialogTitle>Delete Pack</DialogTitle>
          <DialogContent>
            {currentPack && (
              <Box
                sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}
              >
                <Box
                  component="img"
                  src={currentPack.iconImage}
                  alt={currentPack.name}
                  sx={{ width: 40, height: 40, borderRadius: 1 }}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <Box>
                  <Typography variant="h6">{currentPack.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    By {currentPack.author}
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography paragraph>
              Are you sure you want to delete this pack? This will also remove
              all associated images.
            </Typography>
            <Alert severity="warning">This action cannot be undone.</Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handlePackOperation}
              variant="contained"
              color="error"
              disabled={formLoading}
              startIcon={
                formLoading && <CircularProgress size={16} color="inherit" />
              }
            >
              {formLoading ? "Deleting..." : "Delete Pack"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
