import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Alert,
} from "@mui/material";
import {
  ErrorOutline as ErrorIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import urlStorage from "../utils/urlStorage";
import { LogInfo, LogError, LogWarn, LogDebug } from "../utils/logger";

const RedirectHandler = () => {
  const { shortcode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urlData, setUrlData] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    handleRedirect();
  }, [shortcode]);

  useEffect(() => {
    let timer;
    if (urlData && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (urlData && countdown === 0) {
      // Redirect to the original URL
      window.location.href = urlData.originalUrl;
    }
    return () => clearTimeout(timer);
  }, [countdown, urlData]);

  const handleRedirect = async () => {
    try {
      LogInfo(
        "frontend",
        "page",
        `Processing redirect for shortcode: ${shortcode}`
      ).catch(() => {});

      if (!shortcode) {
        LogError(
          "frontend",
          "page",
          "No shortcode provided for redirect"
        ).catch(() => {});
        setError("Invalid shortcode");
        setLoading(false);
        return;
      }

      const urlData = urlStorage.getUrlByShortcode(shortcode);

      if (!urlData) {
        setError("Short URL not found");
        setLoading(false);
        return;
      }

      if (urlData.isExpired) {
        setError("This short URL has expired");
        setLoading(false);
        return;
      }

      // Record the click
      const clickRecorded = urlStorage.recordClick(shortcode, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || "Direct",
      });

      if (!clickRecorded) {
        setError("Failed to record click or URL has expired");
        setLoading(false);
        return;
      }

      setUrlData(urlData);
      setLoading(false);
    } catch (error) {
      LogError(
        "frontend",
        "page",
        `Redirect processing error for ${shortcode}: ${error.message}`
      ).catch(() => {});
      setError("An error occurred while processing the redirect");
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    if (urlData) {
      window.location.href = urlData.originalUrl;
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Processing redirect...</Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we validate the short URL
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => (window.location.href = "/")}
              startIcon={<LinkIcon />}
            >
              Create New Short URL
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <LinkIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Redirecting...
        </Typography>

        {urlData && (
          <>
            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body2" gutterBottom>
                <strong>Destination:</strong> {urlData.originalUrl}
              </Typography>
              <Typography variant="body2">
                <strong>Short URL:</strong> http://localhost:3000/{shortcode}
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h3"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                {countdown}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Redirecting in {countdown} seconds...
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleManualRedirect}
                size="large"
              >
                Go Now
              </Button>
              <Button
                variant="outlined"
                onClick={() => (window.location.href = "/")}
              >
                Cancel
              </Button>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: "block" }}
            >
              Click recorded for analytics
            </Typography>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default RedirectHandler;
