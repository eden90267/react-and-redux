const express = require('express');
const path = require('path');

const renderPage = require('./routes.Server').renderPage;

const app = express();

const assetManifest = require(path.resolve(__dirname, '../build/asset-manifest.json'));

app.use(express.static(path.resolve(__dirname, '../build')));

app.use('/api/count', (req, res) => {
  res.json({count: 100});
});

app.get('*', (req, res) => {
  return renderPage(req, res, assetManifest);
});

app.set('view engine', 'ejs'); // 使用ejs作為渲染模板
app.set('views', path.resolve(__dirname, 'views'));// 模板文件目錄

module.exports = app;