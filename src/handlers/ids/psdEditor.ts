import * as fs from 'fs';
import * as path from 'path';
import 'ag-psd/initialize-canvas'; // only needed for reading image data and thumbnails
import { readPsd, writePsdBuffer } from 'ag-psd';

export interface IdInfo {
    first_name: string;
    last_name: string;
    id: string;
    gender: string;
    dob: string;
    issuing_date: string;
    documentId: string;
}
export const psdEditorHandler = async (idInfo: IdInfo) => {
    const resolvedPath = path.join(__dirname, 'id.psd');
    const buffer = fs.readFileSync(resolvedPath);
    const psd1 = readPsd(buffer, { skipLayerImageData: true, skipCompositeImageData: true, skipThumbnail: true });
    console.log(psd1);
    const psd2 = readPsd(buffer);
    //console.log('[DEBUG] psd2 has canvas at root level:', !!psd2?.canvas);

    // Find the first layer that has a canvas
    let layerWithCanvas = null;
    if (psd2?.children) {
        for (let i = 0; i < psd2.children.length; i++) {
            const child = psd2.children[i];
            if (child.canvas) {
                layerWithCanvas = child;
                break;
            }
        }
    }

    if (!layerWithCanvas) {
        console.log('[DEBUG] No layer with canvas found');
        return;
    }

    console.log('[DEBUG] Writing layer:', layerWithCanvas.name);
    fs.writeFileSync('layer-1.png', (layerWithCanvas.canvas as any).toBuffer());
};
