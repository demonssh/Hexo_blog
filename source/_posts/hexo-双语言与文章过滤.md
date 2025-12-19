---
title: Hexo 双语言与文章过滤
date: 2025-12-18
lang: zh-CN
tags:
  - Hexo
  - 多语言
---

## 目标
实现同一仓库的中英文站点：根目录保留默认语言，`/zh-CN/` 提供中文；首页、归档、分类、标签等页面在对应语言下只显示该语言的文章。

## 配置步骤
1. 安装多语言首页生成器并移除默认首页生成器  
```bash
npm uninstall hexo-generator-index
npm install hexo-generator-index-i18n --save
```
2. 根配置 `_config.yml` 设定语言顺序，开启多语言首页  
```yml
language:
  - en
  - zh-CN
index_generator:
  path: ''
  per_page: 10
  order_by: -date
```
3. 文章前置数据添加语言标记，并将所有语言的文章统一放在 `source/_posts/` 下  
```md
---
title: Hello World
lang: en
---
```
```md
---
title: 你好，世界
lang: zh-CN
---
```
4. 中文页面骨架（放在 `source/zh-CN/`，用于生成中文首页及各功能页）  
```bash
source/zh-CN/about/index.md        # lang: zh-CN
source/zh-CN/archives/index.md     # lang: zh-CN, layout: archive, type: archives
source/zh-CN/categories/index.md   # lang: zh-CN, layout: categories, type: categories
source/zh-CN/tags/index.md         # lang: zh-CN, layout: tags, type: tags
source/zh-CN/links/index.md        # lang: zh-CN, layout: links, type: links
```
示例 Front‑matter：  
```md
---
title: 归档
lang: zh-CN
layout: archive
type: archives
---
```
5. 导航链接按语言自动加前缀：修改 `node_modules/hexo-theme-fluid/layout/_partials/header/navigation.ejs`，在渲染菜单时读取 `page.lang`，当前语言是中文则为相对链接添加 `/zh-CN` 前缀；语言切换按钮保持绝对路径 `/` 与 `/zh-CN/`。
6. 归档按语言过滤：修改 `node_modules/hexo-theme-fluid/layout/archive.ejs`，根据 `page.lang` 过滤 `site.posts`，并将过滤结果赋给 `page.posts` 后再渲染。示例：  
```ejs
const langKey = (page.lang || '').toLowerCase()
const allPosts = page.posts || site.posts
const filteredPosts = langKey
  ? allPosts.filter(p => (p.lang || '').toLowerCase() === langKey)
  : allPosts
page.posts = filteredPosts
```
7. 生成与预览  
```bash
npm run clean
npm run build
npm run server   # 预览 http://localhost:4000/ 与 http://localhost:4000/zh-CN/
```

## 文件与修改清单
必需新建：`source/zh-CN/about/index.md`、`source/zh-CN/archives/index.md`、`source/zh-CN/categories/index.md`、`source/zh-CN/tags/index.md`、`source/zh-CN/links/index.md`（均带 `lang: zh-CN`，并设置对应 layout/type）。  
必需修改：`_config.yml`（language、index_generator）、`node_modules/hexo-theme-fluid/layout/_partials/header/navigation.ejs`（按语言前缀菜单）、`node_modules/hexo-theme-fluid/layout/archive.ejs`（按语言过滤文章）。  
可选扩展：同样思路为分类/标签模板增加语言过滤，确保中文分类页只显示中文文章。

## 验证要点
1. `npx hexo list route` 应出现 `/index.html`、`/en/index.html`、`/zh-CN/index.html`。  
2. `http://localhost:4000/` 显示英文文章列表；`http://localhost:4000/zh-CN/` 只显示中文文章。  
3. `http://localhost:4000/archives/` 列出所有语言；`http://localhost:4000/zh-CN/archives/` 只列中文（依赖归档模板过滤）。  
4. 导航在中文页指向 `/zh-CN/...`，在英文页指向 `/...`，语言切换按钮可互跳。
