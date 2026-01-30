const NodeHelper = require("node_helper");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const glob = require("glob");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-iCloud-Wallpaper helper started...");
    this.config = null;
    this.downloadTimer = null;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "INIT_MODULE") {
      this.config = payload;
      this.scheduleDownload();
      // Also send an initial list of images immediately if any exist
      this.sendRandomImages();
    } else if (notification === "GET_NEW_IMAGES") {
      this.sendRandomImages();
    }
  },

  scheduleDownload: function () {
    const self = this;
    // Perform immediate download on start
    this.performDownload();

    // Schedule periodic download (default: every 24 hours if not set)
    // The user wants "every night", so a long interval like 24h is appropriate, 
    // or we can use the config.downloadInterval (ms).
    const interval = this.config.downloadInterval || 24 * 60 * 60 * 1000;
    
    if (this.downloadTimer) clearInterval(this.downloadTimer);
    
    this.downloadTimer = setInterval(() => {
      self.performDownload();
    }, interval);
  },

  performDownload: function () {
    if (!this.config || !this.config.albumUrl) {
      console.error("MMM-iCloud-Wallpaper: Missing albumUrl in config.");
      return;
    }

    const scriptPath = path.join(__dirname, "scripts", "download_album.sh");
    // Default download folder is 'photos' inside the module directory
    const downloadDir = path.join(__dirname, "photos");

    console.log(`[MMM-iCloud-Wallpaper] Starting sync for album: ${this.config.albumUrl}`);

    exec(`bash "${scriptPath}" "${this.config.albumUrl}" "${downloadDir}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[MMM-iCloud-Wallpaper] Download Error: ${error.message}`);
        return;
      }
      if (stderr) {
         // curl usually writes progress to stderr, so we might not want to log everything as error
         // console.log(`[MMM-iCloud-Wallpaper] Sync Output: ${stderr}`);
      }
      console.log(`[MMM-iCloud-Wallpaper] Sync complete.`);
      
      // Refresh the frontend with new images if needed, or just let the next cycle pick them up
    });
  },

  sendRandomImages: function () {
    const downloadDir = path.join(__dirname, "photos");
    const self = this;

    // Use glob to find jpg/jpeg files
    glob(downloadDir + "/*.{jpg,jpeg,png,JPG,JPEG,PNG}", function (err, files) {
      if (err) {
        console.error(err);
        return;
      }

      if (!files || files.length === 0) {
        console.log("[MMM-iCloud-Wallpaper] No photos found yet.");
        self.sendSocketNotification("IMAGE_LIST", []);
        return;
      }

      // Shuffle logic
      const shuffled = files.sort(() => 0.5 - Math.random());
      
      // Get max entries from config or default to 10
      const limit = self.config && self.config.maximumEntries ? self.config.maximumEntries : 10;
      const selected = shuffled.slice(0, limit);

      // Convert absolute paths to relative URLs for the frontend
      // MagicMirror modules serve files from /modules/Module Name/...
      const moduleName = "MMM-iCloud-Wallpaper";
      const imageList = selected.map(f => {
          const filename = path.basename(f);
          return path.join("/modules", moduleName, "photos", filename);
      });

      self.sendSocketNotification("IMAGE_LIST", imageList);
    });
  }
});
