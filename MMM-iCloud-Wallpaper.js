Module.register("MMM-iCloud-Wallpaper", {
  defaults: {
    albumUrl: "", // Required
    downloadInterval: 24 * 60 * 60 * 1000, // Every 24 hours
    updateInterval: 10 * 60 * 1000, // New playlist every 10 mins
    slideInterval: 60 * 1000, // Change photo every 1 min
    maximumEntries: 10, // Number of photos to fetch per playlist cycle
    animationSpeed: 1000,
  },

  start: function () {
    this.images = [];
    this.currentIndex = 0;
    this.timer = null;
    this.refreshTimer = null;

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
      this.images = payload;
      this.currentIndex = 0;
      
      // If this is the first load or we ran out of images, start slideshow logic
      if (this.images.length > 0) {
        this.updateDom(this.config.animationSpeed);
        this.startSlideshow();
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
      self.updateDom(self.config.animationSpeed);
    }, this.config.slideInterval);
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
      wrapper.innerHTML = "Loading photos...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    const imageUrl = this.images[this.currentIndex];
    const image = document.createElement("div");
    image.className = "mmm-icloud-wallpaper-image";
    image.style.backgroundImage = `url('${imageUrl}')`;
    
    wrapper.appendChild(image);
    return wrapper;
  }
});
