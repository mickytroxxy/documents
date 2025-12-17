import { rgb, PDFPage } from 'pdf-lib';

export function drawRoundedBar(page: PDFPage, x: number, y: number, width: number, height: number, radius: number = 5, color = rgb(0.2, 0.6, 0.9)) {
    // ---- hard guards ----
    if (!page || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return; // silently skip invalid draw
    }

    // For now, use a simple rectangle since rounded corners are tricky in pdf-lib
    // We'll add back rounded corners once we confirm the basic shape works
    page.drawRectangle({
        x,
        y,
        width,
        height,
        color,
        borderColor: color,
        borderWidth: 1
    });
}
