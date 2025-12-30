const { generateFNBBankPDF } = require('./build/handlers/fnb/index');
const sampleData = require('./build/handlers/fnb/sample').default;

async function test() {
    console.log('Testing last page summary rendering...');
    try {
        const outputPath = await generateFNBBankPDF(sampleData, 8, './files/fnb/test_output.pdf');
        console.log('PDF generated successfully at:', outputPath);
    } catch (error) {
        console.error('Error generating PDF:', error);
        process.exit(1);
    }
}

test();
