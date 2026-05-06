/**
 * Documents.gs — Document CRUD + page serving
 *
 * Phase 0: stubs only
 * Phase 2: list documents
 * Phase 3: serve PNG pages via base64 proxy
 */

const DOCUMENTS_SHEET = 'Documents';

const DOC_COL = {
  id: 1,
  title: 2,
  form_code: 3,
  category: 4,
  description: 5,
  drive_pdf_id: 6,
  drive_pages_folder_id: 7,
  page_count: 8,
  sort_order: 9,
  status: 10,
  created_at: 11,
  updated_at: 12,
  created_by: 13
};

const DOC_HEADERS = [
  'id', 'title', 'form_code', 'category', 'description',
  'drive_pdf_id', 'drive_pages_folder_id', 'page_count', 'sort_order',
  'status', 'created_at', 'updated_at', 'created_by'
];

// ========== Read (Phase 2) ==========

function getActiveDocuments() {
  const sheet = getSheet(DOCUMENTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const docs = [];
  for (let i = 1; i < data.length; i++) {
    const doc = rowToDoc(data[i]);
    if (doc.status === 'active') {
      docs.push(doc);
    }
  }
  // Sort by sort_order, then created_at
  docs.sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return new Date(a.created_at) - new Date(b.created_at);
  });
  return docs;
}

function getDocumentsByCategory(category) {
  return getActiveDocuments().filter(d => d.category === category);
}

function getDocumentById(docId) {
  const sheet = getSheet(DOCUMENTS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][DOC_COL.id - 1] === docId) {
      return rowToDoc(data[i]);
    }
  }
  return null;
}

function rowToDoc(row) {
  const doc = {};
  DOC_HEADERS.forEach((h, idx) => {
    doc[h] = row[idx];
  });
  return doc;
}

// ========== Page Serving (Phase 3) ==========

/**
 * Get a single page as base64 PNG.
 * Looks up the document, finds the PNG file in Drive, returns base64.
 *
 * Phase 0: stub
 */
function getDocumentPage(docId, pageNumber) {
  const doc = getDocumentById(docId);
  if (!doc) return { ok: false, error: 'Document not found' };
  if (doc.status !== 'active') return { ok: false, error: 'Document not available' };
  if (pageNumber < 1 || pageNumber > doc.page_count) {
    return { ok: false, error: 'Invalid page number' };
  }

  // Phase 3 will implement Drive lookup
  return { ok: false, error: 'Page serving not implemented in Phase 0' };

  // Future implementation sketch:
  /*
  const folder = DriveApp.getFolderById(doc.drive_pages_folder_id);
  const filename = 'page_' + String(pageNumber).padStart(3, '0') + '.png';
  const files = folder.getFilesByName(filename);
  if (!files.hasNext()) return { ok: false, error: 'Page file not found' };
  const file = files.next();
  const blob = file.getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());
  return {
    ok: true,
    page: pageNumber,
    total: doc.page_count,
    mimeType: blob.getContentType(),
    data: base64
  };
  */
}
