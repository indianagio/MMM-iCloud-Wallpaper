#!/bin/bash

# Arguments
ALBUM_URL="$1"
TARGET_DIR="$2"

# Extract Album ID from URL (everything after the #)
ALBUM_ID=$(echo "$ALBUM_URL" | cut -d# -f2)

if [ -z "$ALBUM_ID" ]; then
  echo "Error: Invalid Album URL"
  exit 1
fi

mkdir -p "$TARGET_DIR"

# Base API URL
BASE_API="https://p23-sharedstreams.icloud.com/$ALBUM_ID/sharedstreams"

# 1. Get Stream Info
STREAM=$(curl -s -X POST -d '{"streamCtag":null}' "$BASE_API/webstream")

# 2. Check for redirect host (X-Apple-MMe-Host)
HOST=$(echo "$STREAM" | jq -r '.["X-Apple-MMe-Host"]' 2>/dev/null)
if [ "$HOST" != "null" ] && [ -n "$HOST" ]; then
   BASE_API="https://$HOST/$ALBUM_ID/sharedstreams"
   STREAM=$(curl -s -X POST -d '{"streamCtag":null}' "$BASE_API/webstream")
fi

# 3. Extract GUIDs
GUIDS=$(echo "$STREAM" | jq -c "{photoGuids: [.photos[].photoGuid]}")

# 4. Get Download URLs
# We request the '720p' derivative (or similar) typically, but webasseturls gives us standard web accessible ones.
ASSETS=$(curl -s -X POST -d "$GUIDS" "$BASE_API/webasseturls")

# 5. Download Files
# We iterate through the assets and download them.
# We will use the photoGuid as the filename to avoid duplicates and overwrites.

echo "$ASSETS" | jq -r '.items | to_entries[] | .value.url_location + .value.url_path + " " + .key' | while read -r URL_PART GUID; do
    FULL_URL="https://${URL_PART}"
    FILE_PATH="${TARGET_DIR}/${GUID}.jpeg"
    
    if [ ! -f "$FILE_PATH" ]; then
        echo "Downloading $GUID..."
        curl -s -o "$FILE_PATH" "$FULL_URL"
    else
        # Optional: Check file size or touch file
        :
    fi
done

echo "Download sync complete. Starting optimization..."

# Optimize and Resize for Portrait 1080x1920
# Requires ImageMagick
if command -v mogrify &> /dev/null; then
    echo "Resizing images to 1080x1920 (Center Crop) with High Quality..."
    # -resize 1080x1920^ : Resize minimal dimension to cover the area
    # -gravity center    : Center the crop
    # -extent 1080x1920  : Crop to exact size
    # -quality 92        : High JPEG quality
    # -interlace Plane   : Progressive JPEG for smoother loading
    mogrify -resize 1080x1920^ -gravity center -extent 1080x1920 -quality 92 -interlace Plane "$TARGET_DIR"/*.jpeg
    echo "Optimization complete."
else
    echo "ImageMagick (mogrify) not found. Skipping resize."
    echo "Please install it: sudo apt-get install imagemagick"
fi
