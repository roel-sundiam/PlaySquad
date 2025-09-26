#!/bin/bash

# Create PWA icons for PlaySquad
# This script creates basic square icons with PlaySquad branding

ICON_DIR="/mnt/c/Projects2/PlaySquad/frontend/src/assets/icons"
BASE_COLOR="#00C853"  # PlaySquad green

# Icon sizes needed for PWA
SIZES=(72 96 128 144 152 192 384 512)

echo "Creating PWA icons for PlaySquad..."

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to create icons..."

    # Create a base SVG-like icon using ImageMagick
    for size in "${SIZES[@]}"; do
        echo "Creating ${size}x${size} icon..."
        convert -size ${size}x${size} xc:"$BASE_COLOR" \
                -fill white \
                -pointsize $((size/4)) \
                -gravity center \
                -annotate +0+0 "PS" \
                -format PNG \
                "$ICON_DIR/icon-${size}x${size}.png"
    done
else
    echo "ImageMagick not available, creating placeholder icon files..."

    # Create placeholder files (these would need to be replaced with real icons)
    for size in "${SIZES[@]}"; do
        echo "Creating placeholder ${size}x${size} icon..."
        # Create a simple colored square (you would replace this with actual icon generation)
        cat > "$ICON_DIR/icon-${size}x${size}.png.placeholder" << EOF
This is a placeholder for icon-${size}x${size}.png
You can replace this with actual PNG icon files.
Icon should be ${size}x${size} pixels.
Recommended: Square icon with PlaySquad logo on #00C853 background.
EOF
    done

    echo "Note: Placeholder files created. Replace with actual PNG icons for production."
fi

echo "PWA icons setup completed!"
echo "Icons location: $ICON_DIR"