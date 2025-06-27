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
  Divider,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import "./URLShortener.css";

const URLShortener = () => {
  const [urlForms, setUrlForms] = useState([
    {
      id: 1,
      originalUrl: "",
      customShortcode: "",
      validityPeriod: "",
      shortenedUrl: "",
      errors: {},
      isSubmitted: false,
    },
  ]);

  const validateUrl = (url) => {
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  };

  const validateShortcode = (shortcode) => {
    const shortcodePattern = /^[a-zA-Z0-9-_]{3,20}$/;
    return shortcodePattern.test(shortcode);
  };

  const validateValidityPeriod = (period) => {
    const num = parseInt(period);
    return !isNaN(num) && num > 0 && num <= 365;
  };

  const validateForm = (form) => {
    const errors = {};

    if (!form.originalUrl.trim()) {
      errors.originalUrl = "Original URL is required";
    } else if (!validateUrl(form.originalUrl)) {
      errors.originalUrl = "Please enter a valid URL";
    }

    if (form.customShortcode && !validateShortcode(form.customShortcode)) {
      errors.customShortcode =
        "Shortcode must be 3-20 characters, alphanumeric, hyphens, or underscores only";
    }

    if (!form.validityPeriod.trim()) {
      errors.validityPeriod = "Validity period is required";
    } else if (!validateValidityPeriod(form.validityPeriod)) {
      errors.validityPeriod = "Please enter a valid number of days (1-365)";
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
          validityPeriod: "",
          shortenedUrl: "",
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

  const generateShortUrl = (originalUrl, customShortcode) => {
    const baseUrl = "https://short.ly/";
    if (customShortcode) {
      return baseUrl + customShortcode;
    }

    // Generate random shortcode
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return baseUrl + result;
  };

  const shortenUrl = (id) => {
    const form = urlForms.find((f) => f.id === id);
    const errors = validateForm(form);

    setUrlForms((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updatedForm = { ...f, errors, isSubmitted: true };

          if (Object.keys(errors).length === 0) {
            updatedForm.shortenedUrl = generateShortUrl(
              f.originalUrl,
              f.customShortcode
            );
          }

          return updatedForm;
        }
        return f;
      })
    );
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
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
            validityPeriod: "",
            shortenedUrl: "",
            errors: {},
            isSubmitted: false,
          };
        }
        return form;
      })
    );
  };

  return (
    <Container maxWidth="lg" className="url-shortener-container">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          className="main-title"
        >
          <LinkIcon sx={{ fontSize: "inherit", mr: 2 }} />
          URL Shortener
        </Typography>

        <Typography variant="h6" color="text.secondary" gutterBottom>
          Create up to 5 shortened URLs with custom codes and validity periods
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
                      label="Validity Period (Days)"
                      type="number"
                      placeholder="30"
                      value={form.validityPeriod}
                      onChange={(e) =>
                        updateForm(form.id, "validityPeriod", e.target.value)
                      }
                      error={!!form.errors.validityPeriod}
                      helperText={form.errors.validityPeriod || "Max 365 days"}
                      variant="outlined"
                      inputProps={{ min: 1, max: 365 }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    onClick={() => shortenUrl(form.id)}
                    disabled={!form.originalUrl || !form.validityPeriod}
                    className="shorten-button"
                  >
                    Shorten URL
                  </Button>

                  <Button variant="outlined" onClick={() => resetForm(form.id)}>
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
                          label={`Expires in ${form.validityPeriod} days`}
                          size="small"
                          color="primary"
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
    </Container>
  );
};

export default URLShortener;
