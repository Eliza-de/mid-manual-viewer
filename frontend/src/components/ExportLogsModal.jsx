/**
 * ExportLogsModal — filter form for exporting logs to CSV
 *
 * Used in LogViewer page. Shows different filter fields depending on log type:
 *   - auth: date range + event filter
 *   - audit: date range + action filter
 *   - access: date range + document filter
 */

import { useState } from 'react';
import {
  Modal, Form, DatePicker, Select, Input, InputNumber, Button, Alert, Space, Typography
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { getIdToken } from '../api/liff.js';
import { exportAuthLogs, exportAuditLogs, exportAccessLogs } from '../api/admin.js';
import { COLORS } from '../brand.js';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const AUTH_EVENTS = [
  { label: '— ทั้งหมด —', value: '' },
  { label: 'register', value: 'register' },
  { label: 'login_success', value: 'login_success' },
  { label: 'login_fail', value: 'login_fail' },
  { label: 'pin_set', value: 'pin_set' },
  { label: 'locked', value: 'locked' }
];

// Common audit action prefixes
const AUDIT_ACTIONS = [
  { label: '— ทั้งหมด —', value: '' },
  { label: 'admin_approve_user', value: 'admin_approve_user' },
  { label: 'admin_disable_user', value: 'admin_disable_user' },
  { label: 'admin_enable_user', value: 'admin_enable_user' },
  { label: 'admin_grant_admin', value: 'admin_grant_admin' },
  { label: 'admin_revoke_admin', value: 'admin_revoke_admin' },
  { label: 'admin_reset_pin', value: 'admin_reset_pin' },
  { label: 'admin_create_document', value: 'admin_create_document' },
  { label: 'admin_update_document', value: 'admin_update_document' },
  { label: 'admin_archive_document', value: 'admin_archive_document' },
  { label: 'admin_restore_document', value: 'admin_restore_document' },
  { label: 'admin_replace_page', value: 'admin_replace_page' },
  { label: 'admin_append_pages', value: 'admin_append_pages' },
  { label: 'admin_replace_all_pages', value: 'admin_replace_all_pages' },
  { label: 'admin_bulk_approve_users', value: 'admin_bulk_approve_users' },
  { label: 'admin_bulk_disable_users', value: 'admin_bulk_disable_users' },
  { label: 'admin_bulk_archive_documents', value: 'admin_bulk_archive_documents' },
  { label: 'admin_export_logs', value: 'admin_export_logs' }
];

export default function ExportLogsModal({ open, type, onClose }) {
  const auth = useAuth();
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function reset() {
    form.resetFields();
    setError(null);
    setSuccess(null);
    setExporting(false);
  }

  function handleClose() {
    if (exporting) return;
    reset();
    onClose();
  }

  async function handleExport(values) {
    setExporting(true);
    setError(null);
    setSuccess(null);

    const filters = { max_rows: values.max_rows || 10000 };

    if (values.dateRange && values.dateRange.length === 2) {
      filters.date_from = values.dateRange[0].toISOString();
      filters.date_to = values.dateRange[1].toISOString();
    }

    if (type === 'auth') {
      if (values.event) filters.event = values.event;
      if (values.line_user_id) filters.line_user_id = values.line_user_id.trim();
    } else if (type === 'audit') {
      if (values.action) filters.action = values.action;
    } else if (type === 'access') {
      if (values.document_id) filters.document_id = values.document_id.trim();
      if (values.line_user_id) filters.line_user_id = values.line_user_id.trim();
    }

    try {
      const idToken = getIdToken();
      const sessionToken = auth.session.token;
      const fn = type === 'auth' ? exportAuthLogs :
                 type === 'audit' ? exportAuditLogs :
                 exportAccessLogs;

      const r = await fn(idToken, sessionToken, filters);

      if (r.ok) {
        const sizeKB = Math.round(r.size / 1024);
        setSuccess(`✅ ดาวน์โหลด ${r.filename} (${sizeKB} KB)`);
        setTimeout(() => { handleClose(); }, 1500);
      } else {
        if (r.needsLogin) auth.logout();
        else setError(r.error || 'Export ไม่สำเร็จ');
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setExporting(false);
    }
  }

  const title = type === 'auth' ? '📥 Export Auth Logs (CSV)' :
                type === 'audit' ? '📥 Export Audit Logs (CSV)' :
                type === 'access' ? '📥 Export Access Logs (CSV)' :
                'Export Logs';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      maskClosable={!exporting}
      closable={!exporting}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}
        {success && <Alert type="success" showIcon message={success} />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleExport}
          requiredMark={false}
          disabled={exporting}
          initialValues={{ max_rows: 10000 }}
        >
          <Form.Item label="ช่วงวันที่ (ไม่บังคับ)" name="dateRange">
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder={['เริ่ม', 'สิ้นสุด']}
            />
          </Form.Item>

          {type === 'auth' && (
            <>
              <Form.Item label="Event" name="event">
                <Select options={AUTH_EVENTS} allowClear placeholder="— ทั้งหมด —" />
              </Form.Item>
              <Form.Item label="Line User ID (ไม่บังคับ)" name="line_user_id">
                <Input placeholder="U..." />
              </Form.Item>
            </>
          )}

          {type === 'audit' && (
            <Form.Item label="Action" name="action">
              <Select options={AUDIT_ACTIONS} allowClear showSearch placeholder="— ทั้งหมด —"
                filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())} />
            </Form.Item>
          )}

          {type === 'access' && (
            <>
              <Form.Item label="Document ID (ไม่บังคับ)" name="document_id">
                <Input placeholder="UUID ของเอกสาร" />
              </Form.Item>
              <Form.Item label="Line User ID (ไม่บังคับ)" name="line_user_id">
                <Input placeholder="U..." />
              </Form.Item>
            </>
          )}

          <Form.Item label="จำกัดจำนวนแถว (1-50,000)" name="max_rows">
            <InputNumber min={1} max={50000} style={{ width: 150 }} />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
            💡 ไฟล์ CSV จะรองรับภาษาไทย (UTF-8 BOM) สามารถเปิดด้วย Excel ได้ทันที
          </Text>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} disabled={exporting}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={exporting}
                icon={<DownloadOutlined />}
                style={{ background: COLORS.primary, borderColor: COLORS.primary }}
              >
                {exporting ? 'กำลัง Export...' : 'ดาวน์โหลด CSV'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}
