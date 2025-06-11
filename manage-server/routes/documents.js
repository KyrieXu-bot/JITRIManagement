const express = require('express');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const pool = require('../config/dbConfig');
const Raw = require('docxtemplater-image-module-free');
const ImageModule = Raw.default || Raw;
const sizeOfModule = require('image-size');
const sizeOf = sizeOfModule.default || sizeOfModule;
const router = express.Router();


router.post('/', async (req, res) => {
  const { order_num, departmentId, reportType } = req.body;
  let connection;

  try {
    // 1. 获取连接并开启事务
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let templateFile, templateData;

    if (reportType === 'WH') {
      templateFile = 'WH_template.docx';

      // 2.1 查询订单 + 客户
      const [[order]] = await connection.execute(
        `SELECT 
           o.order_num, 
           o.create_time, 
           c.customer_name, 
           c.customer_address
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.order_num = ?`,
        [order_num]
      );
      if (!order) {
        // 订单不存在，抛到下面的 catch
        throw new Error('ORDER_NOT_FOUND');
      }

      // 2.2 查询测试项 + 设备
      const [testItems] = await connection.execute(
        `SELECT 
          t.original_no, 
          t.test_item, 
          t.test_method, 
          t.size, 
          t.quantity, 
          e.equipment_name, 
          e.model,
          e.parameters_and_accuracy,
          e.validity_period,
          e.report_title,
          e.equipment_no,
          ma.manager_accounts,
          ma.manager_names,
          te.team_accounts,
          te.team_names
         FROM test_items t
         LEFT JOIN equipment e ON t.equipment_id = e.equipment_id
         LEFT JOIN (
          SELECT 
            aa.test_item_id,
            GROUP_CONCAT(DISTINCT ua.account ORDER BY ua.account) AS manager_accounts,
            GROUP_CONCAT(DISTINCT ua.name    ORDER BY ua.name   ) AS manager_names
          FROM assignments aa
          JOIN users ua 
            ON ua.account = aa.account
          WHERE ua.role = 'supervisor'
          GROUP BY aa.test_item_id
        ) AS ma 
          ON t.test_item_id = ma.test_item_id
       LEFT JOIN (
          SELECT 
            aa.test_item_id,
            GROUP_CONCAT(DISTINCT ua.account ORDER BY ua.account) AS team_accounts,
            GROUP_CONCAT(DISTINCT ua.name    ORDER BY ua.name   ) AS team_names
          FROM assignments aa
          JOIN users ua 
            ON ua.account = aa.account
          WHERE ua.role = 'employee'
          GROUP BY aa.test_item_id
        ) AS te 
       ON t.test_item_id = te.test_item_id
         WHERE t.order_num = ? and t.department_id = ?
         ORDER BY t.test_item_id`,
        [order_num, departmentId]
      );
      const first = testItems[0] || {};
      const managerFirst = (first.manager_accounts || '').split(',')[0];
      const testerFirst  = (first.team_accounts    || '').split(',')[0];

      const leaderMap = {
        1: 'XW001',
        2: 'WH001',
        3: 'LX001',
      };
      const leaderAccount = leaderMap[departmentId] || null;

      // 签名图片目录
      const sigDir = path.resolve(__dirname, '../signatures');
      // 约定文件名：{account}.png
      // function loadSignature(acc) {
      //   if (!acc) return Buffer.alloc(0);
      //   const p = path.join(sigDir, `${acc}.png`);
      //   console.log(p)
      //   return fs.existsSync(p) ? fs.readFileSync(p) : Buffer.alloc(0);
      // }

      const sanitizedItems = testItems.map((item, index) => ({
        sample_name: `${order.order_num}-${index + 1}`,
        original_no: item.original_no || '',
        test_item: item.test_item || '',
        test_method: item.test_method || '',
        size: item.size || '',
        quantity: item.quantity != null ? item.quantity : '',
        equipment_no: item.equipment_no || '',
        equipment_name: item.equipment_name || '',
        model: item.model || '',
        parameters_and_accuracy:  item.parameters_and_accuracy || '',  
        validity_period:          item.validity_period || '',
        report_title: item.report_title || ''
      }));


      const equipmentMap = new Map();
      sanitizedItems.forEach(item => {
        // 只保留有设备名的项
        if (item.equipment_name) {
          const key = `${item.equipment_name}||${item.model}`;
          if (!equipmentMap.has(key)) {
            equipmentMap.set(key, {
              equipment_no: item.equipment_no,
              equipment_name: item.equipment_name,
              model: item.model,
              parameters_and_accuracy:  item.parameters_and_accuracy || '', 
              validity_period:          item.validity_period || '',
              report_title: item.report_title || ''
            });
          }
        }
      });
      const equipments = Array.from(equipmentMap.values());
      
      const totalCount = testItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
      templateData = {
        report_title: '物化实验报告',
        order_num: order.order_num,
        create_time: order.create_time.toISOString().slice(0, 10),
        customer_name: order.customer_name,
        customer_address: order.customer_address,
        test_items: sanitizedItems,
        total_count: totalCount,
        equipments,
        signature_manager: managerFirst + '.png',
        signature_tester:  testerFirst  + '.png',
        signature_leader:  leaderAccount + '.png',
      };

    } else if (reportType === 'COMMISSION') {
      templateFile = 'commission_template.docx';

      // 2.3 查询委托单相关信息（示例字段，按需补全）
      const [[info]] = await connection.execute(
        `SELECT 
           o.order_num, 
           o.create_time, 
           c.customer_name, 
           p.payer_name
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         JOIN payers p    ON o.payer_id    = p.payer_id
         WHERE o.order_num = ?`,
        [order_num]
      );
      if (!info) {
        throw new Error('ORDER_NOT_FOUND');
      }

      templateData = {
        title: '委托单',
        order_num: info.order_num,
        create_time: order.create_time.toISOString().slice(0, 10),
        customer_name: info.customer_name,
        payer_name: info.payer_name,
        // …其他 commission 独有字段…
      };

    } else {
      // 非法报表类型
      return res.status(400).send('未知报告类型');
    }

    // 3. 渲染 Word 模板
    const tplPath = path.resolve(__dirname, '../templates', templateFile);
    const content = fs.readFileSync(tplPath, 'binary');
    const zip = new PizZip(content);

    const imageModule = new ImageModule({
      centered: false,
      fileType: 'docx', 
      getImage: (tagValue, tagName) => {
        const p = path.join(__dirname, '../signatures', tagValue);
        return fs.existsSync(p)
          ? fs.readFileSync(p)
          : Buffer.alloc(0);
      },
      getSize: (imgBuffer, tagValue, tagName) => {
        if (!imgBuffer || imgBuffer.length === 0) return [0, 0];
        const { width, height } = sizeOf(imgBuffer);
        const maxWidth = 80;
        // 3) 如果原图宽度超出，就按比例缩放；否则保留原大小
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          return [ Math.round(width * ratio), Math.round(height * ratio) ];
        }
        return [width, height];
      }
    });

    const doc = new Docxtemplater(zip, {
      paragraphLoop:   true,            // 处理 {#…} 循环
      linebreaks:      true,            // 保持换行
      nullGetter:      ()=>'',
      undefinedGetter: ()=>'',
      modules:         [imageModule]    // 挂载图片模块
    });
    doc.render(templateData);
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // 4. 提交事务
    await connection.commit();

    // 5. 返回文档
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=${reportType}_${order_num}.docx`
    });
    res.send(buf);

  } catch (err) {
    // 如果在事务内 出现任何异常，回滚
    if (connection) {
      try { await connection.rollback(); }
      catch (rollbackErr) {
        console.error('事务回滚失败:', rollbackErr);
      }
    }

    // 根据自定义错误类型返回不同状态
    if (err.message === 'ORDER_NOT_FOUND') {
      return res.status(404).send('订单未找到');
    }
    console.error('生成文档失败:', err);
    res.status(500).send('文档生成失败');

  } finally {
    // 最后一定释放连接
    if (connection) connection.release();
  }
});

module.exports = router;