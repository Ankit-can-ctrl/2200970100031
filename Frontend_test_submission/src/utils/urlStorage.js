// URL Storage and Management System
class URLStorage {
  constructor() {
    this.storageKey = "urlShortenerData";
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored
        ? JSON.parse(stored)
        : {
            urls: {},
            clicks: {},
            shortcodes: new Set(),
          };
    } catch (error) {
      console.error("Error loading data:", error);
      return {
        urls: {},
        clicks: {},
        shortcodes: new Set(),
      };
    }
  }

  saveData() {
    try {
      const dataToSave = {
        ...this.data,
        shortcodes: Array.from(this.data.shortcodes),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  generateUniqueShortcode(length = 6) {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      if (!this.isShortcodeExists(result)) {
        return result;
      }
      attempts++;
    }

    // Fallback with timestamp
    const timestamp = Date.now().toString(36);
    return timestamp.slice(-6);
  }

  isShortcodeExists(shortcode) {
    return this.data.shortcodes.has(shortcode) || this.data.urls[shortcode];
  }

  validateShortcode(shortcode) {
    const shortcodePattern = /^[a-zA-Z0-9-_]{3,20}$/;
    return shortcodePattern.test(shortcode);
  }

  validateUrl(url) {
    try {
      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      new URL(url);
      return { isValid: true, normalizedUrl: url };
    } catch {
      return { isValid: false, normalizedUrl: url };
    }
  }

  createShortUrl(originalUrl, customShortcode = null, validityMinutes = 30) {
    const urlValidation = this.validateUrl(originalUrl);
    if (!urlValidation.isValid) {
      throw new Error("Invalid URL format");
    }

    let shortcode;
    if (customShortcode) {
      if (!this.validateShortcode(customShortcode)) {
        throw new Error(
          "Invalid shortcode format. Use 3-20 alphanumeric characters, hyphens, or underscores."
        );
      }
      if (this.isShortcodeExists(customShortcode)) {
        throw new Error(
          "Shortcode already exists. Please choose a different one."
        );
      }
      shortcode = customShortcode;
    } else {
      shortcode = this.generateUniqueShortcode();
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + validityMinutes * 60 * 1000);

    const urlData = {
      id: Date.now() + Math.random(),
      originalUrl: urlValidation.normalizedUrl,
      shortcode,
      createdAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      validityMinutes,
      clickCount: 0,
      isActive: true,
    };

    this.data.urls[shortcode] = urlData;
    this.data.shortcodes.add(shortcode);
    this.data.clicks[shortcode] = [];
    this.saveData();

    return {
      ...urlData,
      shortUrl: `http://localhost:3000/${shortcode}`,
    };
  }

  getUrlByShortcode(shortcode) {
    const urlData = this.data.urls[shortcode];
    if (!urlData) {
      return null;
    }

    // Check if URL has expired
    if (new Date() > new Date(urlData.expiresAt)) {
      urlData.isActive = false;
      this.saveData();
      return { ...urlData, isExpired: true };
    }

    return urlData;
  }

  recordClick(shortcode, clickData = {}) {
    const urlData = this.data.urls[shortcode];
    if (!urlData) return false;

    // Check if URL has expired
    if (new Date() > new Date(urlData.expiresAt)) {
      return false;
    }

    const click = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || "Direct",
      source: this.getClickSource(),
      location: this.getApproximateLocation(),
      ...clickData,
    };

    this.data.clicks[shortcode].push(click);
    this.data.urls[shortcode].clickCount++;
    this.saveData();

    return true;
  }

  getClickSource() {
    const referrer = document.referrer;
    if (!referrer) return "Direct";

    try {
      const hostname = new URL(referrer).hostname;
      if (hostname.includes("google")) return "Google";
      if (hostname.includes("facebook")) return "Facebook";
      if (hostname.includes("twitter")) return "Twitter";
      if (hostname.includes("linkedin")) return "LinkedIn";
      return hostname;
    } catch {
      return "Unknown";
    }
  }

  getApproximateLocation() {
    // Simulated location detection (in real app, use geolocation API or IP service)
    const timezoneOffset = new Date().getTimezoneOffset();
    const locations = {
      "-480": "Pacific Time (US)",
      "-420": "Mountain Time (US)",
      "-360": "Central Time (US)",
      "-300": "Eastern Time (US)",
      0: "Greenwich Mean Time",
      60: "Central European Time",
      330: "India Standard Time",
      540: "Japan Standard Time",
    };

    return (
      locations[timezoneOffset.toString()] ||
      `UTC${timezoneOffset > 0 ? "-" : "+"}${Math.abs(timezoneOffset / 60)}`
    );
  }

  getAllUrls() {
    return Object.values(this.data.urls)
      .map((url) => ({
        ...url,
        shortUrl: `http://localhost:3000/${url.shortcode}`,
        clicks: this.data.clicks[url.shortcode] || [],
        isExpired: new Date() > new Date(url.expiresAt),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUrlStats(shortcode) {
    const urlData = this.data.urls[shortcode];
    const clicks = this.data.clicks[shortcode] || [];

    if (!urlData) return null;

    return {
      ...urlData,
      shortUrl: `http://localhost:3000/${shortcode}`,
      clicks,
      clicksBySource: this.groupClicksBySource(clicks),
      clicksByDate: this.groupClicksByDate(clicks),
      isExpired: new Date() > new Date(urlData.expiresAt),
    };
  }

  groupClicksBySource(clicks) {
    const grouped = {};
    clicks.forEach((click) => {
      const source = click.source || "Unknown";
      grouped[source] = (grouped[source] || 0) + 1;
    });
    return grouped;
  }

  groupClicksByDate(clicks) {
    const grouped = {};
    clicks.forEach((click) => {
      const date = new Date(click.timestamp).toDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  }

  deleteUrl(shortcode) {
    if (this.data.urls[shortcode]) {
      delete this.data.urls[shortcode];
      delete this.data.clicks[shortcode];
      this.data.shortcodes.delete(shortcode);
      this.saveData();
      return true;
    }
    return false;
  }

  clearExpiredUrls() {
    const now = new Date();
    let deletedCount = 0;

    Object.keys(this.data.urls).forEach((shortcode) => {
      const urlData = this.data.urls[shortcode];
      if (new Date(urlData.expiresAt) < now) {
        this.deleteUrl(shortcode);
        deletedCount++;
      }
    });

    return deletedCount;
  }
}

// Create singleton instance
const urlStorage = new URLStorage();

export default urlStorage;
