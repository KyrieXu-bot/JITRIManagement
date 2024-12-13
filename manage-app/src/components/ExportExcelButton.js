import React from 'react';
import * as XLSX from 'xlsx';

const ExportExcelButton = ({ data, headers, filename  }) => {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename);
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

return (
    <button onClick={handleExport}>导出为Excel</button>
);
};

export default ExportExcelButton;
