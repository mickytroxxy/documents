# OpenAI DALL-E Setup Guide

This guide will help you set up OpenAI's DALL-E API for realistic South African ID enhancement.

## Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

## Step 2: Add API Key to Project

### Option A: Firebase (Recommended for Production)

1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Find or create the `secrets` collection
4. Add a new document or update existing with:

```json
{
  "OPENAI_API_KEY": "sk-your-actual-api-key-here",
  "DEEP_SEEK_API": "sk-aee53cdb70a04ea7baa613ddc897ade0"
}
```

### Option B: Environment Variable (For Development)

Create or update `.env` file in project root:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
DEEP_SEEK_API=sk-aee53cdb70a04ea7baa613ddc897ade0
```

## Step 3: Verify Setup

Run the ID generation:

```bash
npm start
# or
nodemon
```

You should see:

```
✓ Front ID generated
✓ Back ID generated

🎨 Step 1: Applying basic enhancements (hologram + water drops)...

✓ Front ID enhanced with basic effects
✓ Back ID enhanced with basic effects

🤖 Step 2: Applying DALL-E AI enhancement for realistic South African ID features...

🤖 Starting DALL-E enhancement for front ID...
📤 Sending image to DALL-E for enhancement...
📥 Downloading enhanced image from DALL-E...
✅ DALL-E enhancement complete

🤖 Starting DALL-E enhancement for back ID...
📤 Sending image to DALL-E for enhancement...
📥 Downloading enhanced image from DALL-E...
✅ DALL-E enhancement complete

✅ All ID images generated and enhanced successfully!
```

## Cost Information

- **DALL-E 2 Image Editing**: ~$0.02 per image
- **Per ID (front + back)**: ~$0.04
- **Monthly estimate** (100 IDs): ~$4.00

## Troubleshooting

### "OpenAI API key not found"

**Solution:** The system will automatically fall back to SVG enhancement only. Add the API key using Option A or B above.

### "Insufficient credits"

**Solution:** Add credits to your OpenAI account at [OpenAI Billing](https://platform.openai.com/account/billing)

### "Rate limit exceeded"

**Solution:** 
- Wait a few minutes and try again
- Upgrade your OpenAI plan for higher rate limits
- Implement request queuing in production

## Without OpenAI API Key

The system works perfectly fine without DALL-E enhancement! You'll still get:

- ✅ Original ID images (front.png, back.png)
- ✅ SVG-enhanced images with holograms and water drops (front_enhanced.png, back_enhanced.png)

The DALL-E enhancement is an **optional final touch** for maximum realism.

## Security Best Practices

1. **Never commit API keys** to version control
2. Use environment variables or Firebase for key storage
3. Rotate API keys regularly
4. Monitor API usage in OpenAI dashboard
5. Set spending limits in OpenAI account settings

## Next Steps

Once set up, the enhancement runs automatically. Check the output folder:

```
src/handlers/ids/8810135016081/
├── front.png                 - Original
├── back.png                  - Original
├── front_enhanced.png        - SVG enhanced
├── back_enhanced.png         - SVG enhanced
├── front_dalle_final.png     - ⭐ AI enhanced (best quality)
└── back_dalle_final.png      - ⭐ AI enhanced (best quality)
```

Use the `*_dalle_final.png` files for production use!

## Support

For issues or questions:
- OpenAI API Docs: https://platform.openai.com/docs
- OpenAI Community: https://community.openai.com/

