import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  Chip,
  Grid,
  Snackbar,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Timeline as TimelineIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import urlStorage from "../utils/urlStorage";
import "./URLShortener.css";

const URLShortener = () => {
  const navigate = useNavigate();
  const [urlForms, setUrlForms] = useState([
    {
      id: 1,
      originalUrl: "",
      customShortcode: "",
      validityPeriod: "30", // Default 30 minutes
      shortenedUrl: "",
      expiresAt: "",
      errors: {},
      isSubmitted: false,
    },
  ]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const validateForm = (form) => {
    const errors = {};

    if (!form.originalUrl.trim()) {
      errors.originalUrl = "Original URL is required";
    }

    if (
      form.customShortcode &&
      !urlStorage.validateShortcode(form.customShortcode)
    ) {
      errors.customShortcode =
        "Shortcode must be 3-20 characters, alphanumeric, hyphens, or underscores only";
    }

    if (!form.validityPeriod.trim()) {
      errors.validityPeriod = "Validity period is required";
    } else {
      const minutes = parseInt(form.validityPeriod);
      if (isNaN(minutes) || minutes < 1 || minutes > 43200) {
        // Max 30 days in minutes
        errors.validityPeriod =
          "Please enter a valid number of minutes (1-43200)";
      }
    }

    return errors;
  };

  const updateForm = (id, field, value) => {
    setUrlForms((prev) =>
      prev.map((form) => {
        if (form.id === id) {
          const updatedForm = { ...form, [field]: value };

          // Real-time validation
          if (updatedForm.isSubmitted) {
            updatedForm.errors = validateForm(updatedForm);
          }

          return updatedForm;
        }
        return form;
      })
    );
  };

  const addForm = () => {
    if (urlForms.length < 5) {
      const newId = Math.max(...urlForms.map((f) => f.id)) + 1;
      setUrlForms((prev) => [
        ...prev,
        {
          id: newId,
          originalUrl: "",
          customShortcode: "",
          validityPeriod: "30",
          shortenedUrl: "",
          expiresAt: "",
          errors: {},
          isSubmitted: false,
        },
      ]);
    }
  };

  const removeForm = (id) => {
    if (urlForms.length > 1) {
      setUrlForms((prev) => prev.filter((form) => form.id !== id));
    }
  };

  const shortenUrl = async (id) => {
    const form = urlForms.find((f) => f.id === id);
    const errors = validateForm(form);

    if (Object.keys(errors).length > 0) {
      setUrlForms((prev) =>
        prev.map((f) => (f.id === id ? { ...f, errors, isSubmitted: true } : f))
      );
      return;
    }

    try {
      const result = urlStorage.createShortUrl(
        form.originalUrl,
        form.customShortcode || null,
        parseInt(form.validityPeriod)
      );

      setUrlForms((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                shortenedUrl: result.shortUrl,
                expiresAt: result.expiresAt,
                errors: {},
                isSubmitted: true,
              }
            : f
        )
      );

      showSnackbar("URL shortened successfully!", "success");
    } catch (error) {
      const newErrors = { customShortcode: error.message };
      setUrlForms((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, errors: newErrors, isSubmitted: true } : f
        )
      );
      showSnackbar(error.message, "error");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar("Copied to clipboard!", "success");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      showSnackbar("Failed to copy text", "error");
    }
  };

  const resetForm = (id) => {
    setUrlForms((prev) =>
      prev.map((form) => {
        if (form.id === id) {
          return {
            ...form,
            originalUrl: "",
            customShortcode: "",
            validityPeriod: "30",
            shortenedUrl: "",
            expiresAt: "",
            errors: {},
            isSubmitted: false,
          };
        }
        return form;
      })
    );
  };

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
  };

  const formatExpiryTime = (expiresAt) => {
    if (!expiresAt) return "";
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry - now;

    if (diffMs <= 0) return "Expired";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0)
      return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    if (diffHours > 0)
      return `Expires in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    return `Expires in ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  };

  return (
    <>
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <LinkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          <Tabs value={0} textColor="inherit">
            <Tab label="Shortener" />
            <Tab label="Statistics" onClick={() => navigate("/statistics")} />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" className="url-shortener-container">
        <Box sx={{ py: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            className="main-title"
          >
            Create Short Links
          </Typography>

          <Typography variant="h6" color="text.secondary" gutterBottom>
            Create up to 5 shortened URLs with custom codes and validity periods
            (in minutes)
          </Typography>

          <Box sx={{ mt: 4 }}>
            {urlForms.map((form, index) => (
              <Paper key={form.id} elevation={3} className="url-form-paper">
                <Box sx={{ p: 3 }}>
                  <Box className="form-header">
                    <Typography variant="h6" component="h2">
                      URL #{index + 1}
                    </Typography>

                    <Box>
                      {urlForms.length > 1 && (
                        <IconButton
                          onClick={() => removeForm(form.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Original URL"
                        placeholder="https://example.com/very-long-url"
                        value={form.originalUrl}
                        onChange={(e) =>
                          updateForm(form.id, "originalUrl", e.target.value)
                        }
                        error={!!form.errors.originalUrl}
                        helperText={form.errors.originalUrl}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Custom Shortcode (Optional)"
                        placeholder="my-custom-code"
                        value={form.customShortcode}
                        onChange={(e) =>
                          updateForm(form.id, "customShortcode", e.target.value)
                        }
                        error={!!form.errors.customShortcode}
                        helperText={
                          form.errors.customShortcode ||
                          "Leave empty for random shortcode"
                        }
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Validity Period (Minutes)"
                        type="number"
                        placeholder="30"
                        value={form.validityPeriod}
                        onChange={(e) =>
                          updateForm(form.id, "validityPeriod", e.target.value)
                        }
                        error={!!form.errors.validityPeriod}
                        helperText={
                          form.errors.validityPeriod ||
                          "Default: 30 minutes, Max: 43200 (30 days)"
                        }
                        variant="outlined"
                        inputProps={{ min: 1, max: 43200 }}
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => shortenUrl(form.id)}
                      disabled={!form.originalUrl || !form.validityPeriod}
                      className="shorten-button"
                    >
                      Shorten URL
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => resetForm(form.id)}
                    >
                      Reset
                    </Button>
                  </Box>

                  {form.shortenedUrl && (
                    <Box sx={{ mt: 3 }}>
                      <Alert severity="success" className="success-alert">
                        <Box className="shortened-url-container">
                          <Typography variant="body2" color="text.secondary">
                            Shortened URL:
                          </Typography>
                          <Box className="shortened-url-display">
                            <Typography
                              variant="body1"
                              className="shortened-url-text"
                            >
                              {form.shortenedUrl}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(form.shortenedUrl)}
                              className="copy-button"
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Chip
                            label={formatExpiryTime(form.expiresAt)}
                            size="small"
                            color={
                              form.expiresAt &&
                              new Date(form.expiresAt) > new Date()
                                ? "primary"
                                : "error"
                            }
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Alert>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}

            {urlForms.length < 5 && (
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addForm}
                  size="large"
                  className="add-form-button"
                >
                  Add Another URL ({urlForms.length}/5)
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Container>
    </>
  );
};

export default URLShortener;
