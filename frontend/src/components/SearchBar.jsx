/**
 * SearchBar — debounced search input + optional filter dropdown
 *
 * Used by UserManagement (search + department filter)
 * and DocumentManagement (search + category filter).
 */

import { useEffect, useState, useRef } from 'react';
import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { COLORS } from '../brand.js';

export default function SearchBar({
  placeholder = 'ค้นหา...',
  onSearchChange,
  filterOptions = null,
  filterValue = '',
  onFilterChange = null,
  filterPlaceholder = 'ทั้งหมด',
  debounceMs = 300
}) {
  const [text, setText] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSearchChange(text.trim());
    }, debounceMs);
    return () => clearTimeout(timer.current);
  }, [text]);

  return (
    <div style={{ marginBottom: 12, padding: '0 4px' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: COLORS.primaryLight }} />}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1 }}
        />
        {filterOptions && filterOptions.length > 0 && (
          <Select
            value={filterValue || undefined}
            onChange={onFilterChange}
            placeholder={filterPlaceholder}
            allowClear
            style={{ width: 130 }}
            options={filterOptions}
          />
        )}
      </Space.Compact>
    </div>
  );
}
