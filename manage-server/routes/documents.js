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
const uploadsRoot = path.resolve(__dirname, '../uploads');
const imgExt = /\.(png|jpe?g|bmp|gif)$/i;

function collectImages(absDir, relPrefix = '') {
  const out = [];
  fs.readdirSync(absDir, { withFileTypes: true }).forEach(ent => {
    const abs = path.join(absDir, ent.name); // 保留原始路径用于读取
    const rel = path.join(relPrefix, ent.name).replace(/\\/g, '/'); // 使用处理后的名称用于模板

    if (ent.isDirectory()) {
      out.push(...collectImages(abs, rel));
    } else if (imgExt.test(ent.name)) {
      out.push(rel);
    }
  });
  return out.sort();
}

router.post('/', async (req, res) => {
  const { order_num, departmentId, reportType } = req.body;
  let connection;
  const leaderMap = {
    1: 'XW001',
    2: 'WH001',
    3: 'LX001',
  };
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
          t.sample_name,
          t.sample_type,
          t.material,
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
      const testerFirst = (first.team_accounts || '').split(',')[0];


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
        sample_no: `${order.order_num}-${index + 1}`,
        sample_name: item.sample_name || '',
        original_no: item.original_no || '',
        test_item: item.test_item || '',
        test_method: item.test_method || '',
        size: item.size || '',
        material: item.material || '',
        sample_type: item.sample_type || '',
        quantity: item.quantity != null ? item.quantity : '',
        equipment_no: item.equipment_no || '',
        equipment_name: item.equipment_name || '',
        model: item.model || '',
        parameters_and_accuracy: item.parameters_and_accuracy || '',
        validity_period: item.validity_period || '',
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
              parameters_and_accuracy: item.parameters_and_accuracy || '',
              validity_period: item.validity_period || '',
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
        signature_tester: testerFirst + '.png',
        signature_leader: leaderAccount + '.png',
      };
    } else if (reportType === 'XW') {          // ★ 新增显微
      templateFile = 'XW_template.docx';

      // 2.1 订单 + 客户 ↓（与 WH 相同，可抽公共函数，这里直接复用）
      const [[order]] = await connection.execute(
        `SELECT o.order_num, o.create_time,
                c.customer_name, c.customer_address
           FROM orders o
           JOIN customers c ON o.customer_id = c.customer_id
          WHERE o.order_num = ?`,
        [order_num]
      );
      if (!order) throw new Error('ORDER_NOT_FOUND');

      // 2.2 检测项目（多拿 3 个字段）
      const [testItems] = await connection.execute(
        `SELECT t.original_no, t.test_item, t.test_method,
                t.size, t.quantity,
                t.sample_type, t.material, t.sample_name,
                e.equipment_name, e.model, e.parameters_and_accuracy,
                e.validity_period, e.report_title, e.equipment_no,
                ma.manager_accounts, ma.manager_names,
                te.team_accounts,  te.team_names
           FROM test_items t
           LEFT JOIN equipment e ON t.equipment_id = e.equipment_id
           LEFT JOIN (
             SELECT aa.test_item_id,
                    GROUP_CONCAT(DISTINCT ua.account) AS manager_accounts,
                    GROUP_CONCAT(DISTINCT ua.name)    AS manager_names
               FROM assignments aa
               JOIN users ua ON ua.account = aa.account
              WHERE ua.role = 'supervisor'
              GROUP BY aa.test_item_id
           ) ma  ON ma.test_item_id = t.test_item_id
           LEFT JOIN (
             SELECT aa.test_item_id,
                    GROUP_CONCAT(DISTINCT ua.account) AS team_accounts,
                    GROUP_CONCAT(DISTINCT ua.name)    AS team_names
               FROM assignments aa
               JOIN users ua ON ua.account = aa.account
              WHERE ua.role = 'employee'
              GROUP BY aa.test_item_id
           ) te  ON te.test_item_id = t.test_item_id
          WHERE t.order_num = ? AND t.department_id = 1
          ORDER BY t.test_item_id`,
        [order_num]
      );

      const first = testItems[0] || {};
      const managerFirst = (first.manager_accounts || '').split(',')[0];
      const testerFirst = (first.team_accounts || '').split(',')[0];

      /* 2.3 整理 items，多出 3 个键 */
      const sanitizedItems = testItems.map((it, idx) => ({
        sample_name: it.sample_name || `${order.order_num}-${idx + 1}`,
        original_no: it.original_no || '',
        sample_type: it.sample_type || '',
        material: it.material || '',
        test_item: it.test_item || '',
        test_method: it.test_method || '',
        size: it.size || '',
        quantity: it.quantity ?? '',
        equipment_no: it.equipment_no || '',
        equipment_name: it.equipment_name || '',
        model: it.model || '',
        parameters_and_accuracy: it.parameters_and_accuracy || '',
        validity_period: it.validity_period || '',
        report_title: it.report_title || ''
      }));

      /* 2.4 设备去重逻辑与 WH 理同，可直接复用 */
      const equipmentMap = new Map();
      sanitizedItems.forEach(it => {
        if (it.equipment_name) {
          const key = `${it.equipment_name}||${it.model}`;
          if (!equipmentMap.has(key)) {
            equipmentMap.set(key, {
              equipment_no: it.equipment_no,
              equipment_name: it.equipment_name,
              model: it.model,
              parameters_and_accuracy: it.parameters_and_accuracy,
              validity_period: it.validity_period,
              report_title: it.report_title
            });
          }
        }
      });
      const equipments = [...equipmentMap.values()];
      const totalCount = testItems.reduce((s, it) => s + (it.quantity || 0), 0);

      /* ===== 图片：按一级文件夹（标题）分组 ===== */
      const orderUploadDir = path.join(uploadsRoot, order_num);
      let image_folders = [];
      // if (fs.existsSync(orderUploadDir)) {
      //   image_folders = fs.readdirSync(orderUploadDir, { withFileTypes: true })
      //     .filter(d => d.isDirectory())
      //     .map(dir => ({
      //       title: dir.name,
      //       images: collectImages(
      //         path.join(orderUploadDir, dir.name),
      //         path.join(order_num, dir.name)
      //       ).map(file => ({ file: file }))
      //     }))
      //     .filter(f => f.images.length);
      // }

      if (fs.existsSync(orderUploadDir)) {
        image_folders = fs.readdirSync(orderUploadDir, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(dir => {
            const images = collectImages(
              path.join(orderUploadDir, dir.name),
              path.join(order_num, dir.name)
            );
            
            // 将图片添加到扁平化列表
            // images.forEach(img => {
            //   image_list.push({
            //     _type: 'image',
            //     file: img.file,
            //     folder_title: dir.name 
            //   });
            // });
      
            return {
              title: dir.name,
              images:images
            };
          })
          .filter(f => f.images.length);
      }

      console.log('扁平化图片列表:', image_folders);
      templateData = {
        report_title: '显微实验报告',
        order_num: order.order_num,
        create_time: order.create_time.toISOString().slice(0, 10),
        customer_name: order.customer_name,
        customer_address: order.customer_address,
        test_items: sanitizedItems,   // ★ 带 sample_type/material/sample_name
        total_count: totalCount,
        equipments,
        signature_manager: managerFirst + '.png',
        signature_tester: testerFirst + '.png',
        signature_leader: leaderMap[1] + '.png',
        image_folders,
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

    // const imageModule = new ImageModule({
    //   centered: false,
    //   fileType: 'docx',
    //   getImage: (tagValue, tagName) => {
    //     const p = path.join(__dirname, '../signatures', tagValue);
    //     return fs.existsSync(p)
    //       ? fs.readFileSync(p)
    //       : Buffer.alloc(0);
    //   },
    //   getSize: (imgBuffer, tagValue, tagName) => {
    //     if (!imgBuffer || imgBuffer.length === 0) return [0, 0];
    //     const { width, height } = sizeOf(imgBuffer);
    //     const maxWidth = 80;
    //     // 3) 如果原图宽度超出，就按比例缩放；否则保留原大小
    //     if (width > maxWidth) {
    //       const ratio = maxWidth / width;
    //       return [Math.round(width * ratio), Math.round(height * ratio)];
    //     }
    //     return [width, height];
    //   }
    // });


    const imageModule = new ImageModule({
      fileType: 'docx',
      getImage: (tagValue, tagName) => {  // 保持两个参数
        console.log('[DEBUG] 接收参数:', { tagValue, tagName });
        // 优先签名目录
        const sigPath = path.join(__dirname, '../signatures', tagValue);
        if (fs.existsSync(sigPath)) return fs.readFileSync(sigPath);
    
        // 上传目录处理（保持简单拼接）
        const imgPath = path.join(uploadsRoot, tagValue.replace(/\//g, path.sep));
        return fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : Buffer.alloc(0);
      },
      getSize: (imgBuffer) => {  // 简化尺寸计算
        return imgBuffer?.length ? [80, 60] : [0, 0]; // 固定小尺寸测试
      }
    });

    console.log('imageModule 结构:', JSON.stringify(
      Object.getOwnPropertyNames(imageModule), 
      null, 
      2
    ));
    
    // 更详细的属性检查
    console.log('imageModule 详细信息:', {
      constructor: imageModule.constructor.name,
      prototype: Object.getPrototypeOf(imageModule),
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(imageModule))
    });
    
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '',
      undefinedGetter: () => '',
      modules: [imageModule]    // 挂载图片模块
    });


    doc.render(templateData);
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // 4. 提交事务
    await connection.commit();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=${reportType}_${order_num}.docx`
    });
    res.send(buf);

  } catch (err) {
    if (connection) {
      try { await connection.rollback(); }
      catch (rollbackErr) {
        console.error('事务回滚失败:', rollbackErr);
      }
    }

    if (err.message === 'ORDER_NOT_FOUND') {
      return res.status(404).send('订单未找到');
    }
    console.error('生成文档失败:', err);
    res.status(500).send('文档生成失败');

  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;