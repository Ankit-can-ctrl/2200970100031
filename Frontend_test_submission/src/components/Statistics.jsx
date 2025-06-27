import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";
import {
  Link as LinkIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationOnIcon,
  Source as SourceIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import urlStorage from "../utils/urlStorage";
import "./Statistics.css";

const Statistics = () => {
  const navigate = useNavigate();
  const [urls, setUrls] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, url: null });
  const [statsDialog, setStatsDialog] = useState({ open: false, stats: null });

  useEffect(() => {
    loadUrls();
    // Clean up expired URLs
    urlStorage.clearExpiredUrls();
  }, []);

  const loadUrls = () => {
    const allUrls = urlStorage.getAllUrls();
    setUrls(allUrls);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const handleRowExpand = (urlId) => {
    setExpandedRow(expandedRow === urlId ? null : urlId);
  };

  const handleDelete = (url) => {
    setDeleteDialog({ open: true, url });
  };

  const confirmDelete = () => {
    if (deleteDialog.url) {
      urlStorage.deleteUrl(deleteDialog.url.shortcode);
      loadUrls();
      setDeleteDialog({ open: false, url: null });
    }
  };

  const handleViewStats = (url) => {
    const stats = urlStorage.getUrlStats(url.shortcode);
    setStatsDialog({ open: true, stats });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getStatusChip = (url) => {
    if (url.isExpired) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const renderClickDetails = (clicks) => {
    if (clicks.length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          style={{ padding: "16px" }}
        >
          No clicks yet
        </Typography>
      );
    }

    return (
      <List dense>
        {clicks
          .slice(-10)
          .reverse()
          .map((click, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {formatDate(click.timestamp)}
                    </Typography>
                    <Chip
                      label={click.source}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location: {click.location}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      Referrer: {click.referrer}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        {clicks.length > 10 && (
          <ListItem>
            <ListItemText>
              <Typography variant="caption" color="text.secondary">
                Showing last 10 clicks. Total: {clicks.length}
              </Typography>
            </ListItemText>
          </ListItem>
        )}
      </List>
    );
  };

  return (
    <>
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <LinkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          <Tabs value={1} textColor="inherit">
            <Tab label="Shortener" onClick={() => navigate("/")} />
            <Tab label="Statistics" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" className="statistics-container">
        <Box sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <TimelineIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
            <Typography variant="h3" component="h1" className="main-title">
              URL Statistics
            </Typography>
          </Box>

          <Typography variant="h6" color="text.secondary" gutterBottom>
            Analytics for all your shortened URLs
          </Typography>

          {urls.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", mt: 4 }}>
              <TimelineIcon
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No URLs yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Create some shortened URLs to see statistics here
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/")}
                startIcon={<LinkIcon />}
              >
                Create Short URL
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>
                      <strong>Short URL</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Original URL</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Created</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Expires</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Clicks</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {urls.map((url) => (
                    <React.Fragment key={url.id}>
                      <TableRow>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRowExpand(url.id)}
                          >
                            {expandedRow === url.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {url.shortUrl}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(url.shortUrl)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {url.originalUrl}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getTimeAgo(url.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(url.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {url.isExpired
                              ? "Expired"
                              : getTimeAgo(url.expiresAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(url.expiresAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TrendingUpIcon fontSize="small" color="primary" />
                            <Typography variant="h6">
                              {url.clickCount}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{getStatusChip(url)}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewStats(url)}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(url)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={8}
                        >
                          <Collapse
                            in={expandedRow === url.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 1 }}>
                              <Typography
                                variant="h6"
                                gutterBottom
                                component="div"
                              >
                                Click Details
                              </Typography>
                              {renderClickDetails(url.clicks)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, url: null })}
      >
        <DialogTitle>Delete URL</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this shortened URL?
          </Typography>
          {deleteDialog.url && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {deleteDialog.url.shortUrl}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, url: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detailed Statistics Dialog */}
      <Dialog
        open={statsDialog.open}
        onClose={() => setStatsDialog({ open: false, stats: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detailed Statistics</DialogTitle>
        <DialogContent>
          {statsDialog.stats && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {statsDialog.stats.clickCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Clicks
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {Object.keys(statsDialog.stats.clicksBySource).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unique Sources
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {Object.keys(statsDialog.stats.clicksByDate).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Clicks by Source
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(statsDialog.stats.clicksBySource).map(
                  ([source, count]) => (
                    <Grid item key={source}>
                      <Chip
                        icon={<SourceIcon />}
                        label={`${source}: ${count}`}
                        variant="outlined"
                      />
                    </Grid>
                  )
                )}
              </Grid>

              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {renderClickDetails(statsDialog.stats.clicks)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog({ open: false, stats: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Statistics;
