Module.register("MMM-iCloud-Wallpaper", {
  defaults: {
    albumUrl: "", // Required
    downloadInterval: 24 * 60 * 60 * 1000, // Every 24 hours
    updateInterval: 10 * 60 * 1000, // New playlist every 10 mins
    slideInterval: 60 * 1000, // Change photo every 1 min
    maximumEntries: 10, // Number of photos to fetch per playlist cycle
    animationSpeed: 2000, // Slower for smoother cross-fade (2s)
  },

  start: function () {
    this.images = [];
    this.currentIndex = 0;
    this.timer = null;
    this.refreshTimer = null;
    this.activeDiv = 0; // 0 or 1, tracking which div is currently visible

    // Validate config
    if (!this.config.albumUrl) {
      this.error = "Please set 'albumUrl' in configuration!";
      this.updateDom();
      return;
    }

    this.sendSocketNotification("INIT_MODULE", this.config);

    // Schedule playlist refresh
    const self = this;
    this.refreshTimer = setInterval(function() {
        self.sendSocketNotification("GET_NEW_IMAGES");
    }, this.config.updateInterval);
  },

  getStyles: function () {
    return ["MMM-iCloud-Wallpaper.css"];
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "IMAGE_LIST") {
      // Check if we actually have new images to avoid restarting if list is identical
      // (Simple check by length or first item could be enough, or just always update)
      if (payload.length > 0) {
        this.images = payload;
        this.currentIndex = 0;
        
        // Start slideshow if not already running
        if (!this.timer) {
          this.updateImage(); // Show first image immediately
          this.startSlideshow();
        }
      }
    }
  },

  startSlideshow: function () {
    const self = this;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(function () {
      self.currentIndex++;
      if (self.currentIndex >= self.images.length) {
        self.currentIndex = 0; 
      }
      self.updateImage();
    }, this.config.slideInterval);
  },

  updateImage: function() {
      // We don't use updateDom() here because it redraws the whole DOM, causing flickering.
      // Instead we manipulate the existing DOM elements for smooth cross-fade.
      
      const bg1 = document.getElementById("mmm-icloud-bg-1");
      const bg2 = document.getElementById("mmm-icloud-bg-2");
      
      if (!bg1 || !bg2 || this.images.length === 0) return;

      const nextImage = `url('${this.images[this.currentIndex]}')`;

      // Logic: Load image into the HIDDEN div, then swap opacity
      if (this.activeDiv === 0) {
          // Div 1 is active (visible), Div 2 is hidden.
          // Load next image into Div 2
          bg2.style.backgroundImage = nextImage;
          // Fade Div 2 IN, Div 1 OUT
          bg2.style.opacity = 1;
          bg1.style.opacity = 0;
          this.activeDiv = 1;
      } else {
          // Div 2 is active, Div 1 is hidden.
          // Load next image into Div 1
          bg1.style.backgroundImage = nextImage;
          // Fade Div 1 IN, Div 2 OUT
          bg1.style.opacity = 1;
          bg2.style.opacity = 0;
          this.activeDiv = 0;
      }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-icloud-wallpaper-wrapper";

    if (this.error) {
      wrapper.innerHTML = this.error;
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (this.images.length === 0) {
        // Initial loading state
        wrapper.innerHTML = ""; 
        return wrapper;
    }

    // Create TWO background divs for cross-fading
    const bg1 = document.createElement("div");
    bg1.id = "mmm-icloud-bg-1";
    bg1.className = "mmm-icloud-wallpaper-image";
    // Initialize first image
    bg1.style.backgroundImage = `url('${this.images[0]}')`;
    bg1.style.opacity = 1;

    const bg2 = document.createElement("div");
    bg2.id = "mmm-icloud-bg-2";
    bg2.className = "mmm-icloud-wallpaper-image";
    bg2.style.opacity = 0; // Start hidden

    wrapper.appendChild(bg1);
    wrapper.appendChild(bg2);
    
    return wrapper;
  }
});
