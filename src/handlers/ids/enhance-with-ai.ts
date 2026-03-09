import fs from 'fs';
import sharp from 'sharp';
import axios from 'axios';
import { getSecretKeys } from '../../helpers/api';
const FormData = require('form-data');

interface EnhancementOptions {
    inputPath: string;
    outputPath: string;
    idType: 'front' | 'back';
}

/**
 * Enhance ID image using DALL-E 3 with realistic South African ID features
 */
export const enhanceIdWithDallE = async (options: EnhancementOptions): Promise<string> => {
    const { inputPath, outputPath, idType } = options;

    try {
        const keys = await getSecretKeys();
        let openaiApiKey = keys?.[0]?.OPENAI_API_KEY;

        // Fallback to environment variable if not in Firebase
        if (!openaiApiKey) {
            openaiApiKey = process.env.OPENAI_API_KEY;
        }

        if (!openaiApiKey) {
            console.warn('⚠️  OpenAI API key not found. Skipping DALL-E enhancement.');
            console.log('   Add OPENAI_API_KEY to Firebase secrets collection or .env file');
            // Copy original to output
            await fs.promises.copyFile(inputPath, outputPath);
            return outputPath;
        }

        // Prepare the image - DALL-E requires PNG format and specific size constraints
        const preparedImagePath = await prepareImageForDallE(inputPath);

        // Create detailed prompt for realistic South African ID enhancement
        const prompt = createEnhancementPrompt(idType);

        console.log('🤖 Starting DALL-E enhancement for ' + idType + ' ID...');
        console.log('📤 Sending image to DALL-E for enhancement...');
        console.log('   Input: ' + inputPath);
        console.log('   Output: ' + outputPath);
        console.log('   Prompt: ' + prompt.substring(0, 100) + '...');

        const formData = new FormData();

        // Read the image file and append to form data
        const imageBuffer = await fs.promises.readFile(preparedImagePath);
        formData.append('image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
        formData.append('prompt', prompt); // Use the actual enhancement prompt
        formData.append('model', 'dall-e-2');
        formData.append('n', '1');
        formData.append('size', '1024x1024');
        formData.append('response_format', 'url');

        // Make the API call directly using axios with proper headers
        const openaiEndpoint = 'https://api.openai.com/v1/images/edits';
        const response = await axios.post(openaiEndpoint, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${openaiApiKey}`
            },
            maxBodyLength: Infinity
        });

        const enhancedImageUrl = response.data?.data?.[0]?.url;

        if (!enhancedImageUrl) {
            throw new Error('No image URL returned from DALL-E');
        }

        console.log('📥 Downloading enhanced image from DALL-E...');

        // Download the enhanced image
        const imageResponse = await axios.get(enhancedImageUrl, {
            responseType: 'arraybuffer'
        });

        // Save the DALL-E enhanced image directly
        await fs.promises.writeFile(outputPath, imageResponse.data);

        // Get file sizes for comparison
        const inputStats = await fs.promises.stat(inputPath);
        const outputStats = await fs.promises.stat(outputPath);

        console.log(`✅ DALL-E enhancement complete: ${outputPath}`);
        console.log(`   Input size: ${(inputStats.size / 1024).toFixed(2)} KB`);
        console.log(`   Output size: ${(outputStats.size / 1024).toFixed(2)} KB`);
        console.log(`   Size difference: ${((outputStats.size - inputStats.size) / 1024).toFixed(2)} KB`);

        // Clean up prepared image
        if (preparedImagePath !== inputPath) {
            await fs.promises.unlink(preparedImagePath);
        }

        return outputPath;
    } catch (error: any) {
        console.error('❌ DALL-E enhancement failed:', error.message);

        // If DALL-E fails, fall back to copying the original
        console.log('   Falling back to original image...');
        await fs.promises.copyFile(inputPath, outputPath);

        return outputPath;
    }
};

/**
 * Prepare image for DALL-E (must be PNG, square, and under 4MB)
 */
async function prepareImageForDallE(inputPath: string): Promise<string> {
    // DALL-E requires square images
    const tempPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '_dalle_prep.png');

    await sharp(inputPath)
        .resize(1024, 1024, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(tempPath);

    return tempPath;
}

/**
 * Create enhancement prompt based on ID type
 */
function createEnhancementPrompt(idType: 'front' | 'back'): string {
    if (idType === 'front') {
        return `Add these security features to this South African ID card:

1. TRIANGLE RAYS: Add bright holographic triangle rays radiating 360° from the photo center (right side) in rainbow colors (cyan, magenta, yellow). Make them VERY VISIBLE.

2. WATERMARK: Add large "✨ DALL-E ENHANCED ✨" text in bottom right corner with rainbow holographic colors and white outline. Make it OBVIOUS.

3. Add rainbow holographic overlay, dove watermark, metallic strips, and lamination effects.

Keep all text, photo, and barcodes readable. Only add visual effects on top.`;
    } else {
        return `Add these security features to this South African ID card back:

1. WATERMARK: Add large "✨ DALL-E ENHANCED ✨" text at bottom with rainbow holographic colors and white outline. Make it OBVIOUS.

2. Add bright holographic stripe across top, metallic security thread, guilloche patterns, and lens flare.

Keep all barcodes and text readable. Only add visual effects on top.`;
    }
}

/**
 * Batch enhance both front and back ID images
 */
export const enhanceBothIdsWithDallE = async (
    frontInputPath: string,
    frontOutputPath: string,
    backInputPath: string,
    backOutputPath: string
): Promise<{ front: string; back: string }> => {
    console.log('\n🎨 Starting DALL-E batch enhancement for ID cards...\n');

    const [frontResult, backResult] = await Promise.all([
        enhanceIdWithDallE({
            inputPath: frontInputPath,
            outputPath: frontOutputPath,
            idType: 'front'
        }),
        enhanceIdWithDallE({
            inputPath: backInputPath,
            outputPath: backOutputPath,
            idType: 'back'
        })
    ]);

    return {
        front: frontResult,
        back: backResult
    };
};
