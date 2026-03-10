import sharp from 'sharp';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import * as bwipjs from 'bwip-js';
import { Jimp, JimpMime } from 'jimp';
import { Request, Response } from 'express';
import { secrets } from '../../server';
import { authenticateUser, updateData } from '../../helpers/api';
import { countries } from '../method';
const CONFIG = {
    color: '#3b3a3a',
    x: 23.9,
    y: 40,
    fontSize: 35,
    lineColor: '#bcbcbc',
    lineWidth: 0.5,
    smallCircleRadius: 11.2,
    smallCircleColor: '#000000',
    smallCircleOpacity: 0.7,
    backColor: '#716b6b'
};
const { color, x, y, fontSize, lineColor, lineWidth, smallCircleRadius, smallCircleColor, smallCircleOpacity } = CONFIG;
export interface IdInfo {
    first_name: string;
    last_name: string;
    id: string;
    gender: string;
    dob: string;
    issuing_date: string;
    documentId: string;
}

const createSvgText = (text: string, posX: number = x, posY: number = y) => {
    return `
  <svg width="1200" height="630">
    <style>
      .title { fill: ${color}; font-size: ${fontSize}px; font-weight: bold; font-family: Arial; }
    </style>
    <text x="${posX}%" y="${posY}%" text-anchor="start" class="title">
      ${text}
    </text>
  </svg>
`;
};

export const generateIdImage = async (idInfo: IdInfo, outputPath: string, photoBuffer?: Buffer, signatureBuffer?: Buffer) => {
    const imagePath = path.join(process.cwd(), 'src', 'handlers', 'ids', 'front1.png');

    let usedPhotoBuffer: Buffer;
    if (photoBuffer) {
        usedPhotoBuffer = photoBuffer;
    } else {
        const defaultPhotoPath = path.join(process.cwd(), 'src', 'handlers', 'ids', 'floris.png');
        usedPhotoBuffer = fs.readFileSync(defaultPhotoPath);
    }

    const signPath = path.join(process.cwd(), 'src', 'handlers', 'ids', 'signatures', '1.png');
    const holoPath = path.join(process.cwd(), 'src', 'handlers', 'ids', 'vholo.png');

    const first_name = createSvgText(idInfo.last_name);
    const second_name = createSvgText(idInfo.first_name);
    const gender = createSvgText(idInfo.gender);
    const nationality = createSvgText('RSA');
    const id_number = createSvgText(idInfo.id);
    const date_of_birth = createSvgText(idInfo.dob);
    const country_of_birth = createSvgText('RSA');
    const status = createSvgText('CITIZEN');

    const circleSvg = `
  <svg width="1200" height="700">
    <circle cx="890" cy="570" r="100" fill="gold" fill-opacity="0.1"/>
    <text x="870" y="580" text-anchor="middle" fill="lightgray" fill-opacity="0.1" font-size="130" font-weight="bold" font-family="Arial">S</text>
    <text x="920" y="580" text-anchor="middle" fill="lightgray" fill-opacity="0.1" font-size="130" font-weight="bold" font-family="Arial">A</text>
    <text x="870" y="620" text-anchor="middle" fill="lightgray" fill-opacity="0.1" font-size="130" font-weight="bold" font-family="Arial">R</text>
    <text x="940" y="620" text-anchor="middle" fill="lightgray" fill-opacity="0.1" font-size="70" font-weight="bold" font-family="Arial">ID</text>
  </svg>
`;

    // Resize base image to required minimum dimensions (1220x790) before compositing
    const baseImageBuffer = await sharp(imagePath)
        .resize(1280, 832, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .toBuffer();
    const mask = Buffer.from(
        `<svg width="340" height="450">
           <rect x="0" y="0" width="340" height="450" rx="5" ry="5" />
         </svg>`
    );
    const photoBufferProcessed = await sharp(usedPhotoBuffer)
        .resize(340, 450)
        .composite([{ input: mask, blend: 'dest-in' }])
        .tint('#000000')
        .ensureAlpha()
        .modulate({ brightness: 1.2, saturation: 3 })
        .png()
        .toBuffer();
    const usedSignatureBuffer = signatureBuffer ? signatureBuffer : fs.readFileSync(signPath);
    const signBuffer = await sharp(usedSignatureBuffer).resize(320, 90).png().toBuffer();
    const holoBuffer = await sharp(holoPath)
        .resize(20, 360)
        .tint('#aeaeae')
        .ensureAlpha()
        .modulate({ brightness: 0.5, saturation: 0 })
        .png()
        .toBuffer();
    await sharp(baseImageBuffer)
        .composite([
            { input: Buffer.from(first_name), top: 4, left: 63 },
            { input: Buffer.from(second_name), top: 77, left: 64 },
            { input: Buffer.from(gender), top: 144, left: 65 },
            { input: Buffer.from(nationality), top: 214, left: 63 },
            { input: Buffer.from(id_number), top: 285, left: 65 },
            { input: Buffer.from(date_of_birth), top: 355, left: 63 + 4 },
            { input: Buffer.from(country_of_birth), top: 425, left: 63 + 6 },
            { input: Buffer.from(status), top: 495, left: 63 + 7 },
            { input: photoBufferProcessed, top: 150, left: 875 },
            { input: signBuffer, top: 700, left: 900 },
            //{ input: holoBuffer, top: 235, left: 1120 },
            { input: Buffer.from(circleSvg), top: 0, left: 0 },
            {
                input: Buffer.from(`
                  <svg width="1200" height="700">
                    <circle cx="55" cy="15" r="${smallCircleRadius}" fill="${smallCircleColor}" fill-opacity="${smallCircleOpacity}"/>
                    <circle cx="95" cy="15" r="${smallCircleRadius}" fill="${smallCircleColor}" fill-opacity="${smallCircleOpacity}"/>
                    <circle cx="135" cy="15" r="${smallCircleRadius}" fill="${smallCircleColor}" fill-opacity="${smallCircleOpacity}"/>
                    <circle cx="20" cy="55" r="${smallCircleRadius}" fill="${smallCircleColor}" fill-opacity="${smallCircleOpacity}"/>
                    <circle cx="135" cy="55" r="${smallCircleRadius}" fill="${smallCircleColor}" fill-opacity="${smallCircleOpacity}"/>
                  </svg>
                `),
                top: 440,
                left: 100
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="820" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(25 650 300)"/>
                    </svg>`
                ),
                top: -7,
                left: 315
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="800" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(-27 650 300)"/>
                    </svg>`
                ),
                top: -50,
                left: 315
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="750" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(-27 650 300)"/>
                    </svg>`
                ),
                top: -55,
                left: 370
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="750" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(27 650 300)"/>
                    </svg>`
                ),
                top: -10,
                left: 370
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="700" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(27 650 300)"/>
                    </svg>`
                ),
                top: -5,
                left: 420
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="700" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(-30 650 300)"/>
                    </svg>`
                ),
                top: -50,
                left: 420
            },

            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="850" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(26 650 300)"/>
                    </svg>`
                ),
                top: 65,
                left: 330
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="850" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(26 650 300)"/>
                    </svg>`
                ),
                top: 84,
                left: 320
            },
            {
                input: Buffer.from(
                    `<svg width="1200" height="630">
                      <line x1="600" y1="300" x2="850" y2="300" stroke="${lineColor}" stroke-width="${lineWidth}" transform="rotate(26 650 300)"/>
                    </svg>`
                ),
                top: 105,
                left: 320
            }
        ])
        .png()
        .toFile(outputPath);
};

export const generateBackIdImage = async (idInfo: IdInfo, outputPath: string, photoBuffer?: Buffer) => {
    const imagePath = path.join(process.cwd(), 'src', 'handlers', 'ids', 'back1.png');

    let usedPhotoBuffer: Buffer;
    if (photoBuffer) {
        usedPhotoBuffer = photoBuffer;
    } else {
        const defaultPhotoPath = path.join(process.cwd(), 'src', 'handlers', 'ids', 'floris.png');
        usedPhotoBuffer = fs.readFileSync(defaultPhotoPath);
    }

    const jimpImage = await Jimp.read(usedPhotoBuffer);
    jimpImage.resize({ w: 80, h: 100 });
    jimpImage.greyscale();
    //jimpImage.invert();
    jimpImage.brightness(0.8);
    const photoBufferResult = await jimpImage.getBuffer(JimpMime.png);
    const barcodeSvgRaw = bwipjs.toSVG({ bcid: 'code128', text: idInfo.id, width: 700, height: 90, includetext: false, barcolor: CONFIG?.backColor });
    const barcodeSvg = barcodeSvgRaw.replace('<svg', '<svg width="700" height="90"');

    const pdf417_text = `${idInfo?.last_name}|${idInfo?.first_name}|${idInfo?.gender}|RSA|${idInfo?.id}|${idInfo?.dob}|RSA|CITIZEN|${idInfo?.issuing_date}|18718|${idInfo?.documentId}|123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678`;
    const barcodepdf14SVGRAW = bwipjs.toSVG({
        bcid: 'pdf417',
        text: pdf417_text,
        width: 909,
        height: 198,
        includetext: false,
        barcolor: CONFIG?.backColor
    });
    const barcodePD14Svg = barcodepdf14SVGRAW.replace('<svg', '<svg width="909" height="198"');

    const issuingDate = `
  <svg width="1200" height="100">
    <style>
      .title { fill: ${CONFIG.backColor}; font-size: ${fontSize + 2}px; font-weight: bold; font-family: Arial; letter-spacing:4px }
    </style>
    <text x="50%" y="50%" text-anchor="middle" class="title">
      ${idInfo.issuing_date}
    </text>
  </svg>
`;

    await sharp(imagePath)
        .composite([
            { input: Buffer.from(issuingDate), top: 85, left: 310 },
            {
                input: Buffer.from(`
                  <svg width="1200" height="100">
                    <style>
                      .title { fill: ${CONFIG.backColor}; font-size: ${fontSize + 2}px; font-weight: bold; font-family: Arial; letter-spacing:4px }
                    </style>
                    <text x="50%" y="50%" text-anchor="middle" class="title">
                      ${idInfo?.documentId}
                    </text>
                  </svg>
                `),
                top: 360,
                left: 310
            },
            { input: Buffer.from(barcodeSvg), top: 440, left: 500 },
            { input: Buffer.from(barcodePD14Svg), top: 550, left: 198 },
            { input: photoBufferResult, top: 400, left: 200 }
        ])
        .png()
        .toFile(outputPath);
};

/**
 * AI-Enhanced Image Processing: Add hologram and water drop effects
 * This function enhances the ID images with realistic holographic overlays and water droplets
 */
export const enhanceIdImageWithEffects = async (inputPath: string, outputPath: string) => {
    try {
        console.log(`Enhancing image: ${inputPath}`);

        // Read the original image
        const imageBuffer = await sharp(inputPath).toBuffer();
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 1200;
        const height = metadata.height || 800;

        // Create hologram effect overlay (rainbow gradient with transparency)
        const hologramSvg = `
            <svg width="${width}" height="${height}">
                <defs>
                    <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ff00ff;stop-opacity:0.15" />
                        <stop offset="20%" style="stop-color:#00ffff;stop-opacity:0.12" />
                        <stop offset="40%" style="stop-color:#ffff00;stop-opacity:0.15" />
                        <stop offset="60%" style="stop-color:#00ff00;stop-opacity:0.12" />
                        <stop offset="80%" style="stop-color:#ff0000;stop-opacity:0.15" />
                        <stop offset="100%" style="stop-color:#0000ff;stop-opacity:0.12" />
                    </linearGradient>
                    <radialGradient id="hologramSpot1">
                        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#00ffff;stop-opacity:0" />
                    </radialGradient>
                    <radialGradient id="hologramSpot2">
                        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.25" />
                        <stop offset="100%" style="stop-color:#ff00ff;stop-opacity:0" />
                    </radialGradient>
                </defs>

                <!-- Diagonal hologram stripes -->
                <rect x="0" y="0" width="${width}" height="${height}" fill="url(#hologramGradient)" opacity="0.3"/>

                <!-- Hologram spots for depth -->
                <circle cx="${width * 0.3}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.15}" fill="url(#hologramSpot1)" />
                <circle cx="${width * 0.7}" cy="${height * 0.6}" r="${Math.min(width, height) * 0.12}" fill="url(#hologramSpot2)" />
                <circle cx="${width * 0.5}" cy="${height * 0.8}" r="${Math.min(width, height) * 0.1}" fill="url(#hologramSpot1)" />

                <!-- Diagonal lines for holographic effect -->
                
            </svg>
        `;

        // Create water droplets effect
        const waterDropsSvg = `
            <svg width="${width}" height="${height}">
                <defs>
                    <radialGradient id="waterDrop">
                        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
                        <stop offset="40%" style="stop-color:#e0f7ff;stop-opacity:0.6" />
                        <stop offset="100%" style="stop-color:#b3e5fc;stop-opacity:0.2" />
                    </radialGradient>
                    <filter id="dropShadow">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                        <feOffset dx="1" dy="2" result="offsetblur"/>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3"/>
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <!-- Random water droplets -->
                <ellipse cx="${width * 0.15}" cy="${height * 0.12}" rx="8" ry="10" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.7"/>
                <ellipse cx="${width * 0.82}" cy="${height * 0.18}" rx="6" ry="8" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.6"/>
                <ellipse cx="${width * 0.45}" cy="${height * 0.25}" rx="5" ry="7" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.65"/>
                <ellipse cx="${width * 0.68}" cy="${height * 0.35}" rx="7" ry="9" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.7"/>
                <ellipse cx="${width * 0.25}" cy="${height * 0.48}" rx="4" ry="6" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.55"/>
                <ellipse cx="${width * 0.88}" cy="${height * 0.52}" rx="6" ry="8" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.6"/>
                <ellipse cx="${width * 0.35}" cy="${height * 0.65}" rx="5" ry="7" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.65"/>
                <ellipse cx="${width * 0.72}" cy="${height * 0.75}" rx="7" ry="9" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.7"/>
                <ellipse cx="${width * 0.18}" cy="${height * 0.82}" rx="4" ry="6" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.6"/>
                <ellipse cx="${width * 0.55}" cy="${height * 0.88}" rx="6" ry="8" fill="url(#waterDrop)" filter="url(#dropShadow)" opacity="0.65"/>

                <!-- Smaller droplets for realism -->
                <circle cx="${width * 0.42}" cy="${height * 0.15}" r="3" fill="url(#waterDrop)" opacity="0.5"/>
                <circle cx="${width * 0.78}" cy="${height * 0.42}" r="2.5" fill="url(#waterDrop)" opacity="0.45"/>
                <circle cx="${width * 0.12}" cy="${height * 0.58}" r="3" fill="url(#waterDrop)" opacity="0.5"/>
                <circle cx="${width * 0.92}" cy="${height * 0.72}" r="2" fill="url(#waterDrop)" opacity="0.4"/>
            </svg>
        `;

        // Apply effects to the image
        await sharp(imageBuffer)
            .composite([
                {
                    input: Buffer.from(hologramSvg),
                    blend: 'over'
                },
                {
                    input: Buffer.from(waterDropsSvg),
                    blend: 'over'
                }
            ])
            .png()
            .toFile(outputPath);

        console.log(`✓ Enhanced image saved: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error enhancing image:', error);
        throw error;
    }
};


/**
 * Generate a PDF with the front ID image in black & white, centered on the page
 */
export const generateFrontIdPdf = async (imagePath: string, outputPath: string) => {
    try {
        // Read the image and convert to black & white
        const imageBuffer = await sharp(imagePath).grayscale().png().toBuffer();

        // Convert to base64 data URL
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        // Create HTML with centered image
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8"/>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: white;
                    }
                    img {
                        max-width: 60%;
                        max-height: 100vh;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <img src="${base64Image}" alt="Front ID"/>
            </body>
            </html>
        `;

        // Launch puppeteer and create PDF
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            protocolTimeout: 60000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-crash-upload',
                '--no-pings',
                '--hide-scrollbars',
                '--dump-dom',
                '--disable-font-subsetting',
            ]
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(120000);
        page.setDefaultTimeout(120000);

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });

        await browser.close();

        console.log(`✓ PDF generated: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

/**
 * Generate a PDF with the back ID image in black & white, centered on the page
 */
export const generateBackIdPdf = async (imagePath: string, outputPath: string) => {
    try {
        // Read the image and convert to black & white
        const imageBuffer = await sharp(imagePath).grayscale().png().toBuffer();

        // Convert to base64 data URL
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        // Create HTML with centered image
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8"/>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: white;
                    }
                    img {
                        max-width: 60%;
                        max-height: 100vh;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <img src="${base64Image}" alt="Back ID"/>
            </body>
            </html>
        `;

        // Launch puppeteer and create PDF
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            protocolTimeout: 60000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-crash-upload',
                '--no-pings',
                '--hide-scrollbars',
                '--dump-dom',
                '--disable-font-subsetting',
            ]
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(120000);
        page.setDefaultTimeout(120000);

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });

        await browser.close();

        console.log(`✓ PDF generated: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

/**
 * Generate a combined PDF with both front and back ID images on the same page
 */
export const generateCombinedIdPdf = async (frontImagePath: string, backImagePath: string, outputPath: string) => {
    try {
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const frontRotation = randomInRange(20, 45); // keep similar to original -75 but varied
        const backRotation = randomInRange(20, 45); // keep similar to original 40 but varied

        // Read both images and convert to black & white
        const frontBuffer = await sharp(frontImagePath).grayscale().png().toBuffer();
        const backBuffer = await sharp(backImagePath).grayscale().png().toBuffer();

        // Convert to base64 data URLs
        const frontBase64 = `data:image/png;base64,${frontBuffer.toString('base64')}`;
        const backBase64 = `data:image/png;base64,${backBuffer.toString('base64')}`;

        // Create HTML with both images - front on top, back below with rotations
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8"/>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    .container {
                        display: flex;
                        flex-direction: column;
                        padding: 10mm;
                        width: 100%;
                        min-height: 100vh;
                        background: white;
                    }
                    .id-container {
                        margin: 10mm 0;
                        display: flex;
                        flex-direction: column;
                    }
                    .id-container h3 {
                        margin-bottom: 8px;
                        color: #333;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                    }
                    .id-container img {
                        object-fit: contain;
                    }
                    .front {
                        transform: rotate(${frontRotation}deg);
                    }
                    .back {
                        transform: rotate(${backRotation}deg);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="id-container">
                        <img class="front" src="${frontBase64}" style="margin-top:50px; margin-left: 50px;" alt="Front ID" width="500"/>
                    </div>
                    <div class="id-container" style="margin-top: 200px;margin-left: 80px;">
                        <img class="back" src="${backBase64}" alt="Back ID" width="500"/>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Launch puppeteer and create PDF
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
            protocolTimeout: 60000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-crash-upload',
                '--no-pings',
                '--hide-scrollbars',
                '--dump-dom',
                '--disable-font-subsetting',
            ]
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(120000);
        page.setDefaultTimeout(120000);

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                bottom: '0mm',
                left: '0mm',
                right: '0mm'
            }
        });

        await browser.close();

        console.log(`✓ Combined PDF generated: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error generating combined PDF:', error);
        throw error;
    }
};

/**
 * Create ID document handler - handles multipart form data
 */
export const createIdHandler = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, id, gender, dob, issuing_date, documentId, idServiceType, userPhone, countryCode } = req.body;

        const mode = (String(idServiceType || 'MANUAL').toUpperCase() === 'HOME_AFFAIRS' ? 'HOME_AFFAIRS' : 'MANUAL') as 'MANUAL' | 'HOME_AFFAIRS';
        const country = String(countryCode || 'ZA').toUpperCase();
        const cfg = countries.find((c) => c.country_code === (country as any));
        const manualPrice = cfg?.documents.find((d) => d.documentType === 'ID_MANUAL')?.price || 300;
        const homeAffairsPrice = cfg?.documents.find((d) => d.documentType === 'ID_HOME_AFFAIRS')?.price || 750;
        const requiredCost = mode === 'HOME_AFFAIRS' ? homeAffairsPrice : manualPrice;

        if (!userPhone) {
            return res.status(401).json({ status: 0, message: 'Authentication failed', data: null });
        }

        const userInfo = await authenticateUser(userPhone);
        if (!userInfo?.length) {
            return res.status(401).json({ status: 0, message: 'Authentication failed', data: null });
        }

        const currentBalance = parseFloat(userInfo?.[0]?.balance);
        if (Number.isNaN(currentBalance) || currentBalance < requiredCost) {
            return res.status(200).json({
                status: 0,
                message: 'Insufficient balance',
                data: { requiredCost, currentBalance }
            });
        }

        if (mode === 'HOME_AFFAIRS') {
            if (!id) {
                return res.status(400).json({
                    status: 0,
                    message: 'Missing required field: id'
                });
            }
            return res.status(200).json({
                status: 0,
                message: 'This feature is currently under development',
                data: { requiredCost }
            });
        }

        if (!first_name || !last_name || !id || !gender || !dob || !issuing_date || !documentId) {
            return res.status(400).json({
                status: 0,
                message: 'Missing required fields: first_name, last_name, id, gender, dob, issuing_date, documentId'
            });
        }

        let photoBuffer: Buffer | undefined;
        if (req.files && (req.files as any).photo) {
            const photoFile = (req.files as any).photo as any;
            photoBuffer = Buffer.from(photoFile.data);
        }

        let signatureBuffer: Buffer | undefined;
        if (req.files && (req.files as any).signature) {
            const signatureFile = (req.files as any).signature as any;
            signatureBuffer = Buffer.from(signatureFile.data);
        }

        const idInfo: IdInfo = {
            first_name: String(first_name).toUpperCase(),
            last_name: String(last_name).toUpperCase(),
            id: String(id),
            gender: String(gender).toUpperCase(),
            dob: String(dob),
            issuing_date: String(issuing_date),
            documentId: String(documentId)
        };

        const folder = path.join(process.cwd(), 'files', idInfo.id);
        fs.mkdirSync(folder, { recursive: true });

        const frontPath = path.join(folder, 'front.png');
        const backPath = path.join(folder, 'back.png');
        const frontEnhancedPath = path.join(folder, 'front_enhanced.png');
        const backEnhancedPath = path.join(folder, 'back_enhanced.png');

        await generateIdImage(idInfo, frontPath, photoBuffer, signatureBuffer);
        await generateBackIdImage(idInfo, backPath, photoBuffer);

        await enhanceIdImageWithEffects(frontPath, frontEnhancedPath);
        await enhanceIdImageWithEffects(backPath, backEnhancedPath);

        const frontPdfPath = path.join(folder, 'front_id.pdf');
        const backPdfPath = path.join(folder, 'back_id.pdf');
        const combinedPdfPath = path.join(folder, 'id_completed.pdf');

        await generateFrontIdPdf(frontEnhancedPath, frontPdfPath);
        await generateBackIdPdf(backEnhancedPath, backPdfPath);
        await generateCombinedIdPdf(frontEnhancedPath, backEnhancedPath, combinedPdfPath);

        const baseUrl = secrets?.BASE_URL;
        const nextBalance = (currentBalance - requiredCost).toString();
        await updateData('users', userPhone, { balance: nextBalance });

        return res.status(200).json({
            status: 1,
            message: 'ID created successfully',
            data: {
                frontImage: `${baseUrl}/${idInfo.id}/${path.basename(frontPath)}`,
                backImage: `${baseUrl}/${idInfo.id}/${path.basename(backPath)}`,
                frontEnhancedImage: `${baseUrl}/${idInfo.id}/${path.basename(frontEnhancedPath)}`,
                backEnhancedImage: `${baseUrl}/${idInfo.id}/${path.basename(backEnhancedPath)}`,
                frontPdf: `${baseUrl}/${idInfo.id}/${path.basename(frontPdfPath)}`,
                backPdf: `${baseUrl}/${idInfo.id}/${path.basename(backPdfPath)}`,
                combinedPdf: `${baseUrl}/${idInfo.id}/${path.basename(combinedPdfPath)}`,
                idInfo,
                requiredCost
            }
        });
    } catch (error) {
        console.error('Error creating ID:', error);
        return res.status(500).json({
            status: 0,
            message: 'Failed to create ID',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const create_id = createIdHandler;
