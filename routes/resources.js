/**
 * routes/resources.js — Product Regulatory Resources & Dynamic PDF Delivery API
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Load the exported product resources catalog
const catalogPath = path.join(__dirname, '..', 'data', 'productResources.json');
let rawProducts = [];
try {
  rawProducts = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error('[Resources API] Failed to load catalog from', catalogPath, e);
}

// Flat map for quick document lookups by ID
const docMap = new Map();
const ASSET_BASE_DIR = path.resolve(__dirname, '../../assets/Product Repo_CER Website');

for (const product of rawProducts) {
  for (const doc of product.documents) {
    const fullDiskPath = path.join(ASSET_BASE_DIR, product.folderName, doc.fileName);
    docMap.set(doc.id, {
      ...doc,
      productId: product.id,
      productName: product.name,
      folderName: product.folderName,
      fullDiskPath,
    });
  }
}

/**
 * GET /api/resources
 * Returns full dynamic product catalog with server-hosted download and view URLs.
 */
router.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const enrichedProducts = rawProducts.map((prod) => ({
    ...prod,
    documents: prod.documents.map((doc) => ({
      ...doc,
      downloadUrl: `${baseUrl}/api/resources/documents/${doc.id}/download`,
      viewUrl: `${baseUrl}/api/resources/documents/${doc.id}`,
    })),
  }));

  return res.json({
    success: true,
    totalProducts: enrichedProducts.length,
    totalDocuments: docMap.size,
    data: enrichedProducts,
  });
});

/**
 * GET /api/resources/documents/:docId
 * Stream PDF directly for viewing in browser or WebView
 */
router.get('/documents/:docId', (req, res) => {
  const { docId } = req.params;
  const doc = docMap.get(docId);

  if (!doc) {
    return res.status(404).json({ success: false, error: `Document ID '${docId}' not found` });
  }

  if (!fs.existsSync(doc.fullDiskPath)) {
    return res.status(404).json({
      success: false,
      error: `File not found on server disk: ${doc.fileName}`,
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);

  const stream = fs.createReadStream(doc.fullDiskPath);
  stream.on('error', (err) => {
    console.error(`[Resources API] Stream error for ${doc.fileName}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to read document stream' });
    }
  });
  stream.pipe(res);
});

/**
 * GET /api/resources/documents/:docId/download
 * Download PDF binary as attachment
 */
router.get('/documents/:docId/download', (req, res) => {
  const { docId } = req.params;
  const doc = docMap.get(docId);

  if (!doc) {
    return res.status(404).json({ success: false, error: `Document ID '${docId}' not found` });
  }

  if (!fs.existsSync(doc.fullDiskPath)) {
    return res.status(404).json({
      success: false,
      error: `File not found on server disk: ${doc.fileName}`,
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);

  const stream = fs.createReadStream(doc.fullDiskPath);
  stream.pipe(res);
});

module.exports = router;
