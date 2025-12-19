---
title: Hexo 双语言与文章过滤
date: 2025-12-18 00:00:00
lang: zh-CN
tags:
  - Hexo
  - 多语言
---

## 目标
同一仓库实现中英文站点：根目录为默认语言，`/zh-CN/` 为中文；首页、归档、标签等在各自语言下只显示该语言的文章，并生成独立的标签页。

## 配置步骤
1. 安装多语言首页生成器并移除默认首页生成器  
```bash
hexo uninstall hexo-generator-index
hexo install hexo-generator-index-i18n
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
3. 文章 Front‑matter 添加语言标记，所有文章统一放在 `source/_posts/`  
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
4. 中文页面骨架（用于生成中文首页及功能页，放在 `source/zh-CN/`）  
```
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
5. 导航按语言加前缀  
修改 `node_modules/hexo-theme-fluid/layout/_partials/header/navigation.ejs`，渲染菜单时读取 `page.lang`，中文页为相对链接加 `/zh-CN` 前缀；语言切换按钮保持绝对 `/` 与 `/zh-CN/`。
6. 归档按语言过滤  
修改 `node_modules/hexo-theme-fluid/layout/archive.ejs`：  
```ejs
const langKey = (page.lang || '').toLowerCase()
const allPosts = page.posts || site.posts
const filteredPosts = langKey
  ? allPosts.filter(p => (p.lang || '').toLowerCase() === langKey)
  : allPosts
page.posts = filteredPosts
```
7. 标签云与标签页按语言过滤  
   - `node_modules/hexo-theme-fluid/layout/tags.ejs`：生成标签云时按语言过滤，仅保留当前语言有文章的标签，并为链接加语言前缀。  
   ```ejs
   var langKey = (page.lang || '').toLowerCase()
   var langPrefix = (langKey && langKey.startsWith('zh')) ? '/zh-CN' : ''
   site.tags.each(function(tag) {
     var posts = langKey ? tag.posts.filter(p => (p.lang || '').toLowerCase().startsWith(langKey)) : tag.posts
     if (!posts.length) return
     var size = posts.length
     var font = min_font + (max_font - min_font) * (size - 1) / (site.tags.length || 1)
     %><a href="<%= url_for(langPrefix + '/tags/' + tag.slug + '/') %>" style="font-size: <%= font %><%= unit %>"><%= tag.name %></a><%
   })
   ```
   - `node_modules/hexo-theme-fluid/layout/tag.ejs`：标签页内部按语言过滤 `tag.posts`。  
   ```ejs
   const langKey = (page.lang || '').toLowerCase()
   let tag = site.tags.find({name: page.tag}).filter(tag => tag.length).data[0]
   if (tag && langKey) {
     tag = {
       name: tag.name,
       length: tag.posts.filter(p => (p.lang || '').toLowerCase().startsWith(langKey)).length,
       posts: tag.posts.filter(p => (p.lang || '').toLowerCase().startsWith(langKey))
     }
   }
   ```
   - 生成器 `scripts/tag-i18n.js`：为每种语言和每个标签生成独立标签页 `/lang/tags/<slug>/`，并注入当前语言的文章。  
   ```js
   hexo.extend.generator.register('tag-i18n', function (locals) {
     const langs = [].concat(this.config.language || []).filter(l => l && l !== 'default');
     const pages = [];
     langs.forEach(lang => {
       const key = String(lang).toLowerCase();
       locals.tags.forEach(tag => {
         const langPosts = tag.posts.filter(p => (p.lang || '').toLowerCase().startsWith(key));
         if (!langPosts.length) return;
         pages.push({
           path: `${lang}/tags/${tag.slug}/index.html`,
           data: { tag: tag.name, posts: langPosts, page: { tag: tag.name, lang } },
           layout: ['tag', 'archive', 'index']
         });
       });
     });
     return pages;
   });
   ```
8. 生成与预览  
```bash
hexo clean
hexo g
hexo s   # 预览 http://localhost:4000/ 与 http://localhost:4000/zh-CN/
```

## 文件与修改清单
- 新建：`source/zh-CN/about/index.md`、`source/zh-CN/archives/index.md`、`source/zh-CN/categories/index.md`、`source/zh-CN/tags/index.md`、`source/zh-CN/links/index.md`（带 `lang: zh-CN`，并设置对应 layout/type）。
- 修改：`_config.yml`（language、index_generator）、`node_modules/hexo-theme-fluid/layout/_partials/header/navigation.ejs`（按语言前缀菜单）、`node_modules/hexo-theme-fluid/layout/archive.ejs`（按语言过滤文章）、`node_modules/hexo-theme-fluid/layout/tags.ejs` 与 `tag.ejs`（按语言过滤标签云和标签页）。
- 新增：`scripts/tag-i18n.js` 生成多语言标签页。
- 可选：同样思路为分类模板增加语言过滤，确保中文分类页只显示中文文章。

## 验证要点
1. `npx hexo list route` 应出现 `/index.html`、`/en/index.html`、`/zh-CN/index.html`，并有 `/zh-CN/tags/<标签>/`。
2. `http://localhost:4000/` 显示英文文章；`http://localhost:4000/zh-CN/` 只显示中文文章。
3. `http://localhost:4000/zh-CN/archives/` 只列中文；`/archives/` 是全局。
4. 中文标签云 `/zh-CN/tags/` 仅显示中文标签，点击进入 `/zh-CN/tags/<标签>/` 列出中文文章；英文同理。
