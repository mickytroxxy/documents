# South African ID Card Generator with AI Enhancement

This module generates realistic South African ID cards with multi-stage AI enhancement for authentic-looking results.

## Features

### 🎨 Three-Stage Enhancement Pipeline

1. **Base Generation** - Creates ID cards with all required information
2. **SVG Enhancement** - Adds holographic effects and water droplets using Sharp
3. **DALL-E AI Enhancement** - Applies realistic South African ID security features using OpenAI's DALL-E

## Generated Files

For each ID (e.g., `8810135016081`), the system creates 6 files:

```
src/handlers/ids/8810135016081/
├── front.png                 - Original front ID
├── back.png                  - Original back ID  
├── front_enhanced.png        - Front with hologram & water drops
├── back_enhanced.png         - Back with hologram & water drops
├── front_dalle_final.png     - ⭐ FINAL front with AI realistic features
└── back_dalle_final.png      - ⭐ FINAL back with AI realistic features
```

**Recommended:** Use the `*_dalle_final.png` files for the most realistic results.

## Setup

### 1. Install Dependencies

```bash
npm install openai sharp axios
```

### 2. Configure OpenAI API Key

Add your OpenAI API key to Firebase secrets collection:

```javascript
// In Firebase Firestore, add to 'secrets' collection:
{
  OPENAI_API_KEY: "sk-your-openai-api-key-here"
}
```

Or add to `.env` file:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Usage

### Basic Usage

```typescript
import { generateIdImage, generateBackIdImage } from './src/handlers/ids';

// The enhancement pipeline runs automatically
// Check the output folder for all generated files
```

### Manual Enhancement

```typescript
import { enhanceBothIdsWithDallE } from './src/handlers/ids/enhance-with-ai';

await enhanceBothIdsWithDallE(
    'path/to/front_enhanced.png',
    'path/to/front_dalle_final.png',
    'path/to/back_enhanced.png',
    'path/to/back_dalle_final.png'
);
```

## Enhancement Details

### SVG Enhancement (Stage 2)

- **Hologram Effects:**
  - Rainbow gradient overlay (magenta → cyan → yellow → green → red → blue)
  - Holographic spots with radial gradients
  - Diagonal light lines
  - Adjustable opacity (12-15%)

- **Water Drop Effects:**
  - 10 large realistic water droplets
  - 4 smaller droplets
  - Drop shadows using SVG filters
  - Gradient fills simulating water refraction

### DALL-E Enhancement (Stage 3)

- **Front ID Features:**
  - Subtle rainbow holographic overlay
  - Micro-printed security patterns
  - UV-reactive elements
  - Guilloche patterns
  - Metallic sheen
  - Professional lamination effect
  - Holographic dove watermark
  - Color-shifting ink effects
  - Realistic wear patterns

- **Back ID Features:**
  - Holographic stripe with rainbow effect
  - Enhanced barcode quality
  - Micro-text security patterns
  - Guilloche background patterns
  - Metallic security thread
  - Professional lamination
  - Authentic government texture

## API Reference

### `enhanceIdWithDallE(options)`

Enhance a single ID image using DALL-E.

**Parameters:**
- `options.inputPath` - Path to input image
- `options.outputPath` - Path to save enhanced image
- `options.idType` - Either `'front'` or `'back'`

**Returns:** Promise<string> - Path to enhanced image

### `enhanceBothIdsWithDallE(frontInput, frontOutput, backInput, backOutput)`

Batch enhance both front and back ID images.

**Returns:** Promise<{ front: string, back: string }>

## Error Handling

If DALL-E enhancement fails (e.g., no API key, network error), the system automatically falls back to the SVG-enhanced version without crashing.

## Cost Considerations

- DALL-E 2 image editing costs approximately $0.02 per image
- Each ID generation (front + back) costs ~$0.04
- Consider implementing caching or rate limiting for production use

## Troubleshooting

### "OpenAI API key not found"
- Add `OPENAI_API_KEY` to Firebase secrets or `.env` file
- The system will fall back to SVG enhancement only

### "DALL-E enhancement failed"
- Check your OpenAI API key is valid
- Ensure you have sufficient API credits
- Check network connectivity
- The system will use the SVG-enhanced version as fallback

## License

MIT

