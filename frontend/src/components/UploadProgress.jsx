/**
 * UploadProgress — modal showing upload progress
 */

import { Modal, Progress, Typography } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function UploadProgress({ open, percent, statusText, errorText }) {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      maskClosable={false}
      centered
      width={320}
    >
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <CloudUploadOutlined style={{ fontSize: 40, color: '#1e3a5f', marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', marginBottom: 16 }}>
          {errorText ? 'อัปโหลดผิดพลาด' : 'กำลังอัปโหลด...'}
        </div>
        <Progress
          percent={percent}
          status={errorText ? 'exception' : (percent >= 100 ? 'success' : 'active')}
          strokeColor={errorText ? undefined : '#1e3a5f'}
        />
        <Text type={errorText ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
          {errorText || statusText || 'กำลังเตรียมข้อมูล...'}
        </Text>
      </div>
    </Modal>
  );
}
