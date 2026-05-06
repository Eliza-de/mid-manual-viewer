/**
 * Disabled — account disabled (rebranded)
 */

import { Card, Result, Typography } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { BRAND } from '../brand.js';

const { Text } = Typography;

export default function Disabled() {
  return (
    <div style={containerStyle}>
      <Card>
        <Result
          icon={<StopOutlined style={{ color: '#ef4444' }} />}
          title="บัญชีถูกระงับ"
          subTitle="บัญชีของคุณไม่สามารถใช้งานได้ในขณะนี้ กรุณาติดต่อ admin"
        />
        <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
          IT Department · {BRAND.companyTH}
        </Text>
      </Card>
    </div>
  );
}

const containerStyle = {
  padding: 16,
  maxWidth: 480,
  margin: '0 auto'
};
