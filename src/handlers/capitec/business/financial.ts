import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { mkdirp } from "mkdirp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSecretKeys } from "../../../helpers/api";





// =============================
// Generate HTML from PDF
// =============================
export const generateFinancialHtmlFromPdf = async (
  pdfPath: string,
  accountingCompanyName: string = "ABC Accounting Services",
  directorName: string = "John Doe"
): Promise<string> => {
  const keys = await getSecretKeys();
  if (!keys?.length || !keys[0].GEMINI_API) {
    throw new Error('Gemini API key not found in database');
  }
  const genAI = new GoogleGenerativeAI(keys?.[0]?.GEMINI_API);
  const referencePdfPath = path.join(process.cwd(), 'files', 'capitec', 'financial_reference.pdf')
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }
  if (!fs.existsSync(referencePdfPath)) {
    throw new Error(`Reference PDF not found: ${referencePdfPath}`);
  }
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro-preview"
  });

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString("base64");

  const referencePdfBuffer = fs.readFileSync(referencePdfPath);
  const referencePdfBase64 = referencePdfBuffer.toString("base64");
 const prompt = `
You are a highly experienced South African Chartered Accountant (CA(SA)) preparing formal Annual Financial Statements (AFS) in accordance with:

• The Companies Act of South Africa
• IFRS for Small and Medium-sized Entities (IFRS for SMEs)
• Standard professional accounting practices

The goal is to generate a professional Annual Financial Statement document based on a bank statement.

---------------------------------------------------------------------

DOCUMENTS PROVIDED

Document 1: Reference Financial Statements Template
Purpose: Formatting and structural reference ONLY.

Document 2: Bank Statement
Purpose: Source of ALL financial transaction data.

---------------------------------------------------------------------

CRITICAL DATA RULES

You MUST extract all monetary transactions from the bank statement.

STRICT REQUIREMENTS:

• Extract REAL values from the bank statement.
• DO NOT invent transactions.
• DO NOT fabricate balances.
• DO NOT create numbers that are not derived from the bank statement.
• If classification is uncertain, apply reasonable accounting judgement and clearly state assumptions in the Notes section.

All amounts must be shown in South African Rand (ZAR).

---------------------------------------------------------------------

MANDATORY ACCOUNTING WORKFLOW (VERY IMPORTANT)

Before generating the financial statements, internally perform the following steps:

STEP 1 — TRANSACTION EXTRACTION
Extract all deposits, withdrawals, and balances from the bank statement.

STEP 2 — TRANSACTION CLASSIFICATION
Classify transactions into accounting categories such as:

Revenue
Cost of sales
Administrative expenses
Operating expenses
Finance costs
Taxes
Shareholder loans
Owner drawings
Other assets or liabilities

STEP 3 — FINANCIAL TOTALS
Calculate the following totals:

Total revenue
Total cost of sales
Total operating expenses
Total profit before tax
Total income tax
Net profit
Closing cash balance

STEP 4 — FINANCIAL STATEMENT CONSISTENCY

Ensure the following relationships are correct:

Profit from the Income Statement
=
Profit in Statement of Changes in Equity

Ending Cash in Cash Flow Statement
=
Cash and Cash Equivalents in Statement of Financial Position

Assets
=
Equity + Liabilities

All statements MUST reconcile mathematically.

---------------------------------------------------------------------

MANDATORY CORE FINANCIAL STATEMENTS

The following THREE statements are REQUIRED and are the most important part of the document:

1. STATEMENT OF COMPREHENSIVE INCOME (Income Statement)

This must show:

Revenue  
Cost of sales  
Gross profit  
Administrative expenses  
Other operating expenses  
Operating profit  
Finance costs  
Profit before tax  
Income tax expense  
Net profit for the year  

2. STATEMENT OF FINANCIAL POSITION (Balance Sheet)

Assets
• Cash and cash equivalents
• Other current assets if identifiable

Equity
• Issued share capital
• Retained earnings

Liabilities
• Current tax liabilities
• Other liabilities if identifiable

TOTAL ASSETS MUST EQUAL TOTAL EQUITY AND LIABILITIES.

3. STATEMENT OF CASH FLOWS

Include the following sections:

Cash flows from operating activities  
Cash flows from investing activities  
Cash flows from financing activities  

Ending cash balance MUST equal the cash balance on the Statement of Financial Position.

These three statements are REQUIRED and must be presented in professional tabular format.

---------------------------------------------------------------------

DIRECTOR AND PREPARER DETAILS

Director name: ${directorName}

Accounting Firm / Preparer: ${accountingCompanyName}

---------------------------------------------------------------------

OUTPUT FORMAT REQUIREMENTS

Return ONLY valid HTML.
I NEED the HTML to be perfectly structured and formatted for PDF generation. 
SHOULD BE VERY BEAUTIFUL AND PROFESSIONAL.
DO NOT include explanations outside the HTML.

The document must be ready for PDF generation.

---------------------------------------------------------------------

VISUAL DESIGN REQUIREMENTS

Use a professional financial statement layout.

• Font family MUST be Hind
• Import the Google Font
• Black text on white background
• Tables with clear borders
• Numeric columns right-aligned
• Totals clearly highlighted
• Structured professional layout
• A4 print layout
• Page breaks between sections

---------------------------------------------------------------------

REQUIRED CSS

Include this CSS inside the HTML head.

<style>
@import url('https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600&display=swap');

body{
 font-family:'Hind', sans-serif;
 font-size:12px;
 line-height:1.6;
 margin:40px;
 color:#000;
}

h1,h2,h3{
 font-weight:600;
 margin-top:30px;
 margin-bottom:10px;
}

table{
 width:100%;
 border-collapse:collapse;
 margin-top:12px;
 margin-bottom:18px;
 border:1px solid #000;
}

th{
 border:1px solid #000;
 padding:6px 8px;
 font-weight:600;
 text-align:left;
 background:#f5f5f5;
}

td{
 border:1px solid #000;
 padding:6px 8px;
 text-align:left;
}

.statement-table td:last-child,
.statement-table th:last-child{
 text-align:right;
}

.total-row td{
 font-weight:600;
 border-top:2px solid #000;
}

.section{
 border:1px solid #000;
 padding:15px;
 margin-top:20px;
}

.page-break{
 page-break-before:always;
}
</style>

---------------------------------------------------------------------

DOCUMENT STRUCTURE

Follow EXACTLY this order:

1. COVER PAGE  
2. INDEX  
3. GENERAL INFORMATION  
4. DIRECTOR'S RESPONSIBILITIES AND APPROVAL  
5. NOTICE OF MEETING  
6. DIRECTOR'S REPORT  
7. REPORT OF THE COMPILER  

8. STATEMENT OF FINANCIAL POSITION (Balance Sheet)  
9. STATEMENT OF COMPREHENSIVE INCOME (Income Statement)  
10. STATEMENT OF CHANGES IN EQUITY  
11. STATEMENT OF CASH FLOWS  

12. ACCOUNTING POLICIES  
13. NOTES TO THE FINANCIAL STATEMENTS  
14. DETAILED INCOME STATEMENT  
15. INCOME TAX COMPUTATION  

Each major section must begin on a new page using:

<div class="page-break"></div>

---------------------------------------------------------------------

PROFESSIONAL STANDARD

The final output must visually resemble a professional Annual Financial Statements document produced by a South African accounting firm.

The document should be approximately 12–18 pages when converted to PDF.

Return ONLY the HTML document.
`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: referencePdfBase64
            }
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64
            }
          },
          { text: prompt },
        ]
      }
    ]
  });

  let html = result.response.text();
  html = html
    .replace(/^```html\s*/, "")
    .replace(/^```\s*/, "")
    .replace(/```$/, "");

  return html;
};


// =============================
// Convert HTML → PDF
// =============================
export const generatePdf = async (
  html: string,
  outputPath: string
): Promise<void> => {

  const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

  // Avoid hanging on remote font/CDN requests (common cause of networkidle0 timeout)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('data:') || url.startsWith('file:') || url.startsWith('about:')) {
          req.continue();
          return;
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
          req.abort();
          return;
      }
      req.continue();
  });

  await page.setContent(html, {
    waitUntil: "networkidle0"
  });
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "25px",
      right: "25px",
      bottom: "25px",
      left: "25px"
    }
  });

  await browser.close();
};


// =============================
// Main Function
// =============================
export const generateFinancialStatementFromPdf = async (
  pdfPath: string,
  accountNumber?: string,
  accountingCompanyName: string = "ABC Accounting Services",
  directorName: string = "John Doe"
): Promise<string> => {

  console.log("Reading PDF:", pdfPath);

  const html = await generateFinancialHtmlFromPdf(pdfPath, accountingCompanyName, directorName);

  const outputFolder = path.join(
    process.cwd(),
    "files",
    "business",
    "capitec",
    String(accountNumber)
  );

  mkdirp.sync(outputFolder);

  const outputFile = path.join(
    outputFolder,
    `financial-statement.pdf`
  );

  await generatePdf(html, outputFile);

  return outputFile;
};