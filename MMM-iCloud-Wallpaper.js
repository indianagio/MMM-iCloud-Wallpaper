Module.register("MMM-iCloud-Wallpaper", {
  defaults: {
    albumUrl: "",
    updateInterval: 10 * 60 * 1000, 
    slideInterval: 60 * 1000, 
    maximumEntries: 10,
    animationSpeed: 1000
  },

  start: function () {
    Log.info("MMM-iCloud-Wallpaper started!");
    this.images = [];
    this.currentIndex = 0;
    this.timer = null;
    
    // Manda SUBITO la config al backend
    this.sendSocketNotification("INIT_MODULE", this.config);

    // FIX: Periodically request new random images from the backend
    var self = this;
    // Clear any existing interval just in case
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    
    this.refreshTimer = setInterval(function() {
      self.sendSocketNotification("GET_NEW_IMAGES");
    }, this.config.updateInterval);
  },

  getStyles: function () {
    return ["MMM-iCloud-Wallpaper.css"];
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "IMAGE_LIST") {
      Log.info("MMM-iCloud-Wallpaper received " + payload.length + " images");
      this.images = payload;
      
      // Se è la prima volta o lista vuota, resetta index
      if (this.currentIndex >= this.images.length) {
          this.currentIndex = 0;
      }

      this.updateDom();
      
      // Avvia rotazione solo se abbiamo immagini
      if (this.images.length > 0 && !this.timer) {
          this.startSlideshow();
      }
    }
  },

  startSlideshow: function () {
    var self = this;
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
    var wrapper = document.createElement("div");
    wrapper.className = "mmm-icloud-wallpaper-wrapper";

    if (this.images.length === 0) {
      // Testo di debug visibile
      wrapper.innerHTML = "MMM-iCloud-Wallpaper: No images loaded yet.<br>Check logs if this persists.";
      wrapper.style.color = "white"; 
      wrapper.style.fontSize = "20px";
      wrapper.style.textAlign = "center";
      wrapper.style.paddingTop = "50vh";
      return wrapper;
    }

    // Versione semplice a singolo div (più robusta per il debug)
    var image = document.createElement("div");
    image.className = "mmm-icloud-wallpaper-image";
    image.style.backgroundImage = "url('" + this.images[this.currentIndex] + "')";
    image.style.opacity = 1;
    
    wrapper.appendChild(image);
    return wrapper;
  }
});
