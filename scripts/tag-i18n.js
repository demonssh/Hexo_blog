/* Generate language-specific tag pages under /<lang>/tags/<slug>/ */
const path = require('path');

hexo.extend.generator.register('tag-i18n', function (locals) {
  const configLangs = [].concat(this.config.language || []).filter(l => l && l !== 'default');
  const tags = locals.tags;
  if (!configLangs.length || !tags.length) return [];

  const pages = [];

  configLangs.forEach(lang => {
    const langKey = String(lang).toLowerCase();
    tags.forEach(tag => {
      const langPosts = tag.posts.filter(p => (p.lang || '').toLowerCase().startsWith(langKey));
      if (!langPosts.length) return;
      pages.push({
        path: path.join(lang, 'tags', tag.slug, 'index.html'),
        data: {
          tag: tag.name,
          posts: langPosts,
          page: {
            tag: tag.name,
            lang: lang
          }
        },
        layout: ['tag', 'archive', 'index']
      });
    });
  });

  return pages;
});
