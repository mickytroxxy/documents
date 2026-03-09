import * as fs from 'fs';
import 'ag-psd/initialize-canvas'; // only needed for writing image data and thumbnails
import { writePsdBuffer } from 'ag-psd';

/**
 * Sample PSD structure for ID cards
 * This is a minimal version that can be used with writePsdBuffer
 */
export const id_sample = () => {
    return {
        width: 2268,
        height: 3430,
        channels: 4,
        bitsPerChannel: 8,
        colorMode: 3,
        children: [
            {
                name: 'Back side',
                top: 0,
                left: 0,
                bottom: 3430,
                right: 2268,
                opacity: 1,
                blendMode: 'normal',
                hidden: false
            },
            {
                name: 'Front side',
                top: 0,
                left: 0,
                bottom: 3430,
                right: 2268,
                opacity: 1,
                blendMode: 'normal',
                hidden: false
            }
        ]
    };
};

/**
 * Write the PSD from id_sample to a file using writePsdBuffer (no sharp needed)
 * @param outputPath - The path where the PSD file will be saved
 * @returns The buffer that was written to the file
 */
export const writePsdFromIdSample = (outputPath: string): Buffer => {
    const psd = id_sample();
    const result = writePsdBuffer(psd as any);
    // Create a proper Uint8Array from the result to avoid type issues
    const uint8Array = new Uint8Array(result);
    const buffer = Buffer.from(uint8Array);
    // Using as any to bypass TypeScript strict type conflict between Buffer and ArrayBufferView
    fs.writeFileSync(outputPath, buffer as any);
    console.log(`PSD written to ${outputPath}`);
    return buffer;
};

// Example usage:
// writePsdFromIdSample('output.psd');
