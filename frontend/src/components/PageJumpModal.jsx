/**
 * PageJumpModal — modal for entering a specific page number
 */

import { useState, useEffect } from 'react';
import { Modal, InputNumber, Button, Space, Typography } from 'antd';

const { Text } = Typography;

export default function PageJumpModal({
  open,
  currentPage,
  totalPages,
  onJump,
  onCancel
}) {
  const [value, setValue] = useState(currentPage);

  useEffect(() => {
    if (open) setValue(currentPage);
  }, [open, currentPage]);

  function submit() {
    if (typeof value === 'number' && value >= 1 && value <= totalPages) {
      onJump(value);
    }
  }

  return (
    <Modal
      title="ไปยังหน้า"
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      destroyOnClose
      width={300}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">
          เอกสารมีทั้งหมด {totalPages} หน้า
        </Text>
        <InputNumber
          autoFocus
          min={1}
          max={totalPages}
          value={value}
          onChange={setValue}
          onPressEnter={submit}
          style={{ width: '100%', fontSize: 18 }}
          size="large"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={onCancel} style={{ flex: 1 }}>
            ยกเลิก
          </Button>
          <Button type="primary" onClick={submit} style={{ flex: 1 }}>
            ไป
          </Button>
        </div>
      </Space>
    </Modal>
  );
}
