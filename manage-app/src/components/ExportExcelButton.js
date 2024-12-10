import React from 'react';
import * as XLSX from 'xlsx';

const ExportExcelButton = ({ data }) => {
  const handleExport = () => {
    // Flatten data to generate a single array of rows for Excel
    const rows = [];
    const mergeCells = [];  // To store merge info

    // Header row
    rows.push([
      '发票号', '创建时间', 
      '委托单号', '委托方', '委托方联系人', '委托方联系人电话', 
      '业务员', '最终价', '付款方名称', '付款方电话', 
      '付款方联系人电话', '检测项目', '优惠价', 
      '尺寸', '数量', '审批备注', '标准价', 
      '机时', '工时', '委托单备注', 'Status', 
      '检测方法', '样品原号'
    ]);

    // Process data
    // data.forEach((invoice, invoiceIndex) => {
    //     invoice.order_details.forEach((order, orderIndex) => {
    //       order.items.forEach((item, itemIndex) => {
    //         let row = [];
  
    //         // Merge invoice number for all items under the same invoice
    //         if (itemIndex === 0) {
    //           row.push(invoice.invoice_number || '1');  // Add invoice number
    //           mergeCells.push({
    //             s: { r: rows.length, c: 0 },  // Start row and column (invoice_number)
    //             e: { r: rows.length + order.items.length - 1, c: 0 },  // End row (same column)
    //           });
    //         } else {
    //           row.push('');  // Leave empty for merged cells
    //         }
  
    //         // Add other data fields
    //         row.push(invoice.created_at);
    //         row.push(order.order_num);
    //         row.push(order.customer_name);
    //         row.push(order.contact_name);
    //         row.push(order.contact_phone_num);
    //         row.push(order.name);
    //         row.push(order.final_price || '');
    //         row.push(order.payer_name);
    //         row.push(order.payer_contact_name);
    //         row.push(order.payer_contact_phone_num);
    //         row.push(item.test_item);
    //         row.push(item.discounted_price);
    //         row.push(item.size);
    //         row.push(item.quantity);
    //         row.push(item.check_note);
    //         row.push(item.listed_price);
    //         row.push(item.work_hours);
    //         row.push(item.machine_hours);
    //         row.push(item.note);
    //         row.push(item.status);
    //         row.push(item.test_method);
    //         row.push(item.original_no);
  
    //         rows.push(row);  // Add the current row to rows
    //       });
    //     });
    //   });



        // 遍历数据
        data.forEach((invoice, invoiceIndex) => {
          const invoiceRows = [];  // 保存当前发票的所有行
          let rowSpan = 0;  // 记录每个发票行数
    
          invoice.order_details.forEach((order, orderIndex) => {
            order.items.forEach((item, itemIndex) => {
              let row = [];
    
              // 合并发票号列：对于同一发票的所有项，发票号只显示一次
              if (itemIndex === 0) {
                row.push(invoice.invoice_number || '');  // 添加发票号
                rowSpan = order.items.length;  // 设置合并的行数
                mergeCells.push({
                  s: { r: rows.length, c: 0 },  // 合并的开始行和列（发票号列）
                  e: { r: rows.length + rowSpan - 1, c: 0 },  // 合并的结束行
                });
              } else {
                row.push('');  // 其它项保持为空，以便合并
              }
    
              // 添加其它数据
              row.push(invoice.created_at);
              row.push(order.order_num);
              row.push(order.customer_name);
              row.push(order.contact_name);
              row.push(order.contact_phone_num);
              row.push(order.name);
              row.push(order.final_price || '');
              row.push(order.payer_name);
              row.push(order.payer_contact_name);
              row.push(order.payer_contact_phone_num);
              row.push(item.test_item);
              row.push(item.discounted_price);
              row.push(item.size);
              row.push(item.quantity);
              row.push(item.check_note);
              row.push(item.listed_price);
              row.push(item.work_hours);
              row.push(item.machine_hours);
              row.push(item.note);
              row.push(item.status);
              row.push(item.test_method);
              row.push(item.original_no);
    
              invoiceRows.push(row);  // 保存当前项的行
            });
          });
    
          // 将所有发票行添加到 rows
          rows.push(...invoiceRows);
        });
    
    // Create a worksheet from the rows array
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = mergeCells;

    // Create a new workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Data');

    // Write the workbook to an Excel file
    XLSX.writeFile(wb, '结算发票数据.xlsx');
  };

  return (
    <button onClick={handleExport}>导出Excel</button>
  );
};

export default ExportExcelButton;
