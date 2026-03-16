import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { mkdirp } from "mkdirp";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyC8f91TKahyIioCcgP2MTTZOLVM7Wg1GDM';

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


// =============================
// Generate HTML from PDF
// =============================
export const generateFinancialHtmlFromPdf = async (
  pdfPath: string,
  accountingCompanyName: string = "ABC Accounting Services",
  directorName: string = "John Doe"
): Promise<string> => {
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
You are a professional South African Chartered Accountant preparing formal Annual Financial Statements (AFS).

The attached PDF is a bank statement. Extract ALL monetary transactions and use them as the factual basis for preparing financial statements.

CRITICAL EXTRACTION RULES
- Extract REAL values from the PDF.
- Do NOT invent transactions.
- Do NOT estimate figures unless absolutely required for accounting presentation.
- If classification is uncertain, state a reasonable accounting assumption.


DOCUMENTS PROVIDED

Document 1: Reference Financial Statements Template
Purpose: Formatting and structural reference only.

Document 2: Bank Statement
Purpose: Source of financial transaction data.

INSTRUCTIONS

Use Document 1 strictly as the formatting and structural template.

Use Document 2 to extract financial transaction data.

Generate the financial statements using the data from Document 2 but structured like Document 1.

DIRECTOR NAME IS ${directorName}
ACCOUNTING COMPANY NAME IS ${accountingCompanyName}

OUTPUT REQUIREMENTS

Return ONLY VALID HTML.

DO NOT return explanations.
DO NOT wrap in code blocks.

The HTML must be ready for printing as a professional Annual Financial Statement document.

VISUAL STYLE REQUIREMENTS

- Font family MUST be Hind
- Use Google Font import for Hind
- Black text on white background
- No colors
- Add borders and tables as needed to mimic professional financial statement layout
- Professional accounting document layout
- A4 page layout
- Page breaks between major sections
- Use black background colors for section headers to mimic professional statement design
- Align numeric values to the right in tables
- Include all standard sections of South African AFS as per Companies Act requirements

Include this CSS in the HTML head:

<style>
@import url('https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600&display=swap');

body{
 font-family:'Hind', sans-serif;
 font-size:12px;
 line-height:1.6;
 margin:40px;
 color:#000;
}

/* Headings */
h1,h2,h3{
 font-weight:600;
 margin-top:30px;
 margin-bottom:10px;
}

/* Tables */
table{
 width:100%;
 border-collapse:collapse;
 margin-top:12px;
 margin-bottom:18px;
 border:1px solid #000;
}

/* Table header */
th{
 border:1px solid #000;
 padding:6px 8px;
 font-weight:600;
 text-align:left;
 background:#f5f5f5;
}

/* Table cells */
td{
 border:1px solid #000;
 padding:6px 8px;
 text-align:left;
}

/* Right align financial figures */
.statement-table td:last-child,
.statement-table th:last-child{
 text-align:right;
}

/* Financial totals styling */
.total-row td{
 font-weight:600;
 border-top:2px solid #000;
}

/* Section divider */
.section{
 border:1px solid #000;
 padding:15px;
 margin-top:20px;
}

/* Page breaks for PDF */
.page-break{
 page-break-before:always;
}
</style>


DOCUMENT STRUCTURE

The financial statements MUST follow EXACTLY this order and structure:

1. COVER PAGE
- Company Name
- Registration Number
- Title: Annual Financial Statements
- Period Covered
- Subtitle: "Unaudited Unreviewed Financial Statements in compliance with the Companies Act of South Africa"

2. INDEX

Include numbered page references for:

General Information  
Director's Responsibilities and Approval  
Notice of Meeting  
Director's Report  
Report of the Compiler  
Statement of Financial Position  
Statement of Comprehensive Income  
Statement of Changes in Equity  
Statement of Cash Flows  
Accounting Policies  
Notes to the Financial Statements  
Detailed Income Statement  
Income Tax Computation  


3. GENERAL INFORMATION

Table containing:
- Country of Incorporation
- Registration Number
- Nature of Business
- Director
- Shareholder
- Registered Office
- Bankers
- Tax Number
- VAT Number
- Preparer

4. DIRECTOR'S RESPONSIBILITIES AND APPROVAL

Write a formal director responsibility statement similar to a standard South African AFS.

Include signature section for the Director.

5. NOTICE OF MEETING

Formal notice to shareholder including agenda items.

6. DIRECTOR'S REPORT

Sections must include:

- Review of activities
- Going concern
- Events after reporting date
- Director's interest in contracts
- Share capital
- Dividend
- Director
- Shareholder

7. REPORT OF THE COMPILER

Professional accountant compilation statement referencing:

International Standard on Related Services 4410 (Revised)

8. STATEMENT OF FINANCIAL POSITION

Table format:

Assets
Current assets
- Cash and cash equivalents
- Other assets derived from transactions

Equity
- Issued capital
- Retained income

Liabilities
- Current liabilities
- Tax liabilities

Totals must balance.

9. STATEMENT OF COMPREHENSIVE INCOME

Table showing:

Revenue  
Cost of sales  
Gross profit  
Administrative expenses  
Other expenses  
Operating profit  
Finance costs  
Profit before tax  
Income tax  
Profit for the year  

10. STATEMENT OF CHANGES IN EQUITY

Table format showing:

Opening balance  
Profit for the year  
Closing retained income  

11. STATEMENT OF CASH FLOWS

Sections:

Cash flows from operating activities  
Cash flows from investing activities  
Cash flows from financing activities  

Ending with cash balance.

12. ACCOUNTING POLICIES

Include sections:

- General information
- Basis of preparation
- Financial instruments
- Revenue recognition
- Tax
- Employee benefits

13. NOTES TO THE FINANCIAL STATEMENTS

Provide numbered notes explaining:

Current tax liabilities  
Cash and cash equivalents  
Issued capital  
Finance costs  
Income tax expense  
Going concern  

14. DETAILED INCOME STATEMENT

Provide expanded breakdown of income and expenses.

15. INCOME TAX COMPUTATION

Provide reconciliation table showing:

Profit before tax  
Taxable income  
Normal tax  
Final tax liability

PAGE LAYOUT REQUIREMENTS

- Each major section must start on a new page using:

<div class="page-break"></div>

- Tables must align numeric columns to the right.
- All monetary values must be displayed in ZAR (R).

IMPORTANT

The final HTML must visually resemble a professional South African Annual Financial Statements document similar to what a professional accounting firm produces.

Return ONLY the HTML.
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

  // Debug: Log the raw response length
  console.log("Gemini response length:", html.length);
  console.log("Gemini response (first 500 chars):", html.substring(0, 500));

  // Remove markdown blocks if Gemini returns them
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

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

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