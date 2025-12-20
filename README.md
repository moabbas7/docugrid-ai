<div align="center">
<img width="1200" height="475" alt="DocuGrid AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<div align="center">

# DocuGrid AI

**Transform unstructured legal documents into structured, actionable intelligence**

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.5%20Pro-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-Google%20AI%20Studio-FF6F61?style=for-the-badge)](https://aistudio.google.com/)

[Live Demo](https://aistudio.google.com/apps/drive/1DJ2e10FIapNOkU-I-o7SK9lW12SlCRR0) | [Report Bug](https://github.com/moabbas7/docugrid-ai/issues) | [Request Feature](https://github.com/moabbas7/docugrid-ai/issues)

</div>

---

## The Problem

Legal teams spend **60% of their time** manually reviewing contracts, extracting key terms, and identifying risks. Traditional document review is:

- Time-consuming (hours per document)
- Error-prone (human fatigue)
- Expensive (senior solicitor hourly rates)
- Unstructured (no standardised output)

## The Solution

**DocuGrid AI** is an agentic AI-powered legal document intelligence platform that transforms how legal professionals interact with contracts.

Upload any contract. Get structured insights in seconds.

---

## Features

### Core Intelligence

| Feature | Description |
|---------|-------------|
| **Universal Schema Extraction** | Automatically extracts parties, dates, values, clauses, and obligations from any contract type |
| **Risk Analysis Engine** | AI-driven risk assessment with HIGH/MEDIUM/LOW categorisation and specific risk flags |
| **Natural Language Querying** | Ask questions like "Show me high risk contracts with rent greater than £50k" |
| **Smart Document Comparison** | Side-by-side diff view with AI-generated executive summaries |

### Document Processing

| Feature | Description |
|---------|-------------|
| **Multi-Format Support** | PDF, DOCX, JPG, PNG - drag, drop, done |
| **Multi-Page PDF Preview** | Full document preview with PDF.js canvas rendering |
| **Batch Processing** | Upload multiple documents, get insights across your entire portfolio |

### Workflow and Management

| Feature | Description |
|---------|-------------|
| **Compliance Checklist** | Auto-calculated compliance scoring across all documents |
| **Document Tagging** | Tag documents as "Needs Review", "Approved", "Flagged", "In Progress" |
| **Matter Management** | Save, load, and organise extractions by legal matter |
| **Export Anywhere** | CSV, Excel, PDF reports - integrate with your existing workflow |

### AI-Powered Analysis

| Feature | Description |
|---------|-------------|
| **One-Click Summaries** | Executive summary of any document in seconds |
| **Document Q and A** | Ask specific questions about any uploaded document |
| **Batch Insights** | Cross-document pattern recognition and anomaly detection |
| **Redline Suggestions** | AI-powered contract improvement recommendations |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **AI Engine** | Google Gemini 2.5 Pro |
| **Framework** | React 19 with TypeScript |
| **Styling** | Tailwind CSS |
| **PDF Rendering** | PDF.js |
| **DOCX Processing** | Mammoth.js |
| **Export** | SheetJS (Excel) and jsPDF |
| **Diffing** | diff library |
| **Icons** | Lucide React |

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### Installation
```bash
# Clone the repository
git clone https://github.com/moabbas7/docugrid-ai.git
cd docugrid-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Run the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

### Try it Live

No setup required: [Open in Google AI Studio](https://aistudio.google.com/apps/drive/1DJ2e10FIapNOkU-I-o7SK9lW12SlCRR0)

---

## Use Cases

### Corporate and Commercial

- **M and A Due Diligence** - Rapidly review hundreds of contracts in target company portfolio
- **Lease Portfolio Analysis** - Extract key terms across all commercial leases
- **Supplier Contract Review** - Analyse vendor agreements for risk and compliance
- **Contract Renewals** - Track expiration dates and renewal terms at scale

### Litigation and Disputes

- **Document Discovery** - Quickly identify relevant documents across large datasets
- **Evidence Extraction** - Extract key facts, dates, and parties from case materials
- **Timeline Construction** - Build chronologies from multiple source documents
- **Witness Statement Analysis** - Compare statements and identify inconsistencies
- **Settlement Agreement Review** - Assess terms and identify potential issues

### Compliance and Regulatory

- **Compliance Audits** - Identify missing clauses and non-standard terms
- **GDPR and Data Processing** - Review data processing agreements at scale
- **Risk Assessment** - Flag high-risk provisions before signing
- **Regulatory Filings** - Extract key data for regulatory submissions

### Employment and HR

- **Employment Contract Review** - Standardise terms across workforce
- **Restrictive Covenant Analysis** - Identify non-compete and confidentiality terms
- **Settlement Agreement Processing** - Review exit terms and calculate payments

---

## Built For

<div align="center">

**Gemini API Developer Competition 2025**

Vibe coded using Google AI Studio and Gemini 2.5 Pro

</div>

---

## Limitations

- **Offline Mode** - Requires active internet connection for Gemini API
- **Large Files** - Files over 20MB may experience slower processing
- **LocalStorage** - Browser storage limits apply for saved matters (5-10MB)
- **Concurrent Processing** - Processes 2 files at a time to respect API rate limits

---

## Licence

This project is licensed under the MIT Licence - see the [LICENCE](LICENCE) file for details.

---

## Acknowledgements

- [Google Gemini](https://ai.google.dev/) for the powerful AI capabilities
- [Google AI Studio](https://aistudio.google.com/) for the vibe coding experience
- Inspired by [Legora](https://legora.com/) and [Harvey AI](https://harvey.ai/)

---

<div align="center">

**Made with dedication by Mohammed Abbas**

[Back to top](#docugrid-ai)

</div>
