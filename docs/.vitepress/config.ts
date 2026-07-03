import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AndroidSimulator233',
  description: 'Open-source Android Simulator',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/installation' },
      { text: 'Features', link: '/features/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quickstart' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/neko233/AndroidSimulator233' },
    ],
  },
})
