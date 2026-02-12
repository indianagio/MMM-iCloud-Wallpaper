
# MMM-iCloud-Wallpaper

A dedicated MagicMirror² module that downloads photos from a public iCloud Shared Album to local storage and displays them in a shuffled slideshow.

This module is designed to replace `MMM-Wallpaper` for users who want to reliably sync hundreds of photos from an iCloud Shared Album without hitting memory limits or "infinite scroll" loading issues.

## Features

- **Robust Sync**: Automatically downloads new photos from a public iCloud Shared Album to a local folder every night (or custom interval).
- **Memory Efficient**: Only loads a small batch (e.g., 10) of photos into the browser memory at a time.
- **Random Cycles**: Every few minutes (configurable), it fetches a *new* random batch of photos from the local storage, ensuring you see your entire collection over time.
- **Fullscreen**: Designed to be used as a background wallpaper.

## Requirements

- **MagicMirror²** instance
- **System packages**: `jq` and `curl` (for the download script)

## Installation

1. Navigate to your MagicMirror modules folder:
   ```bash
   cd ~/MagicMirror/modules
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/indianagio/MMM-iCloud-Wallpaper.git
   ```

3. Install dependencies:
   ```bash
   cd MMM-iCloud-Wallpaper
   npm install
   ```

4. **Crucial**: Install system requirements (`jq` is needed to parse iCloud data):
   ```bash
   sudo apt-get install jq curl
   ```

5. Ensure the scripts are executable:
   ```bash
   chmod +x scripts/download_album.sh
   ```

## Configuration

Add the module to your `config/config.js` file.

```javascript
{
    module: "MMM-iCloud-Wallpaper",
    position: "fullscreen_below",
    config: {
        // The PUBLIC URL of your iCloud Shared Album
        // (Must be a public website link, e.g. https://www.icloud.com/sharedalbum/#B0NGi...)
        albumUrl: "https://www.icloud.com/sharedalbum/#YOUR_ALBUM_ID",
        
        // How often to download NEW photos from iCloud (in ms)
        // Default: 24 hours (86400000 ms). 
        downloadInterval: 24 * 60 * 60 * 1000, 

        // How often to change the displayed photo (in ms)
        // Default: 1 minute
        slideInterval: 60 * 1000,

        // How many photos to keep in the browser "playlist" at once
        // Lower = less RAM usage.
        // Default: 10
        maximumEntries: 10,

        // How often to refresh the "playlist" with new random photos from storage
        // Default: 10 minutes
        updateInterval: 10 * 60 * 1000 
    }
}
```

## How it works

1. **Backend**: The `node_helper` runs a bash script (`scripts/download_album.sh`) that scrapes the iCloud public album API and downloads new JPEGs to `modules/MMM-iCloud-Wallpaper/photos`.
2. **Frontend**: The module asks the backend for a list of `maximumEntries` (e.g., 10) random photos from that folder.
3. **Display**: It cycles through these 10 photos. When `updateInterval` is reached, it asks for a *new* set of 10 random photos, ensuring variety without crashing the browser.

## Troubleshooting

- **No photos appearing?** Check the logs: `pm2 logs mm`. You should see `[MMM-iCloud-Wallpaper] Sync complete`.
- **Download failed?** Ensure you have `jq` installed (`sudo apt-get install jq`) and that the `albumUrl` is correct and public.
