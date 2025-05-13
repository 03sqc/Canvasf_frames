var express = require('express');
var fs = require('fs');
var router = express.Router();
const { shopModel } = require('../module/module')
const path = require('path');
const sharp = require('sharp');


router.get('/index', async (req, res) => {
  const inputDir = path.resolve(__dirname, '../../frame');
  const outputDir = path.resolve(__dirname, '../../frame_webp');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error('无法读取目录:', err);
      return;
    }
    files.forEach(file =>{
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
      sharp(inputPath)
        .toFormat('webp', { quality: 80 }) // 设置WebP质量
        .toFile(outputPath)
        .then(() => {
          console.log(`转换成功: ${file} -> ${path.basename(outputPath)}`);
        })
        .catch(err => {
          console.error(`转换失败: ${file}`, err);
        });
    });
  });
  res.send(
    {
      code: 200,

    }
  );
});


module.exports = router;

module.exports = router;
