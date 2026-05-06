/**
 * Documents.gs — Document CRUD + page serving
 *
 * Phase 2: implement getActiveDocuments, getDocumentsByCategory, getDocumentById
 * Phase 3: implement getDocumentPage (Drive PNG proxy)
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

// ========== Read ==========

function getActiveDocuments() {
  const sheet = getSheet(DOCUMENTS_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, DOC_HEADERS.length).getValues();
  const docs = [];
  for (let i = 0; i < data.length; i++) {
    const doc = rowToDoc(data[i]);
    if (doc.status === 'active') {
      docs.push(doc);
    }
  }
  // Sort by sort_order asc, then created_at asc
  docs.sort(function(a, b) {
    const orderDiff = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    if (orderDiff !== 0) return orderDiff;
    return new Date(a.created_at) - new Date(b.created_at);
  });
  return docs;
}

function getDocumentsByCategory(category) {
  return getActiveDocuments().filter(function(d) {
    return d.category === category;
  });
}

function getDocumentById(docId) {
  const sheet = getSheet(DOCUMENTS_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const data = sheet.getRange(2, 1, lastRow - 1, DOC_HEADERS.length).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][DOC_COL.id - 1] === docId) {
      return rowToDoc(data[i]);
    }
  }
  return null;
}

function rowToDoc(row) {
  const doc = {};
  DOC_HEADERS.forEach(function(h, idx) {
    doc[h] = row[idx];
  });
  return doc;
}

// ========== Write (Phase 7 admin) ==========

function createDocument(docData) {
  const sheet = getSheet(DOCUMENTS_SHEET);
  const now = new Date().toISOString();
  const row = [
    docData.id || Utilities.getUuid(),
    docData.title || '',
    docData.form_code || '',
    docData.category || 'topic',
    docData.description || '',
    docData.drive_pdf_id || '',
    docData.drive_pages_folder_id || '',
    docData.page_count || 0,
    docData.sort_order || 999,
    docData.status || 'active',
    now,
    now,
    docData.created_by || ''
  ];
  sheet.appendRow(row);
  return rowToDoc(row);
}

function updateDocumentField(docId, fieldName, value) {
  const sheet = getSheet(DOCUMENTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const colIdx = DOC_COL[fieldName];
  if (!colIdx) throw new Error('Unknown doc field: ' + fieldName);
  for (let i = 1; i < data.length; i++) {
    if (data[i][DOC_COL.id - 1] === docId) {
      sheet.getRange(i + 1, colIdx).setValue(value);
      // Also update updated_at
      sheet.getRange(i + 1, DOC_COL.updated_at).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

// ========== Page Serving (Phase 3) ==========

function getDocumentPage(docId, pageNumber) {
  const doc = getDocumentById(docId);
  if (!doc) return { ok: false, error: 'Document not found' };
  if (doc.status !== 'active') return { ok: false, error: 'Document not available' };
  if (pageNumber < 1 || pageNumber > doc.page_count) {
    return { ok: false, error: 'Invalid page number' };
  }
  return { ok: false, error: 'Page serving not implemented in Phase 2' };
}
