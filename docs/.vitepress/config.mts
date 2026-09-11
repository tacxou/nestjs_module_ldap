import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

const repository = 'https://github.com/tacxou/nestjs_module_ldap'
const base = process.env.NODE_ENV === 'production' ? '/nestjs_module_ldap/' : '/'

const frenchGuide = [
  { text: 'Installation', link: '/guide/installation' },
  { text: 'Utilisation', link: '/guide/usage' },
  { text: 'API', link: '/guide/api' },
  { text: 'Développement', link: '/guide/development' },
]

const englishGuide = [
  { text: 'Installation', link: '/en/guide/installation' },
  { text: 'Usage', link: '/en/guide/usage' },
  { text: 'API', link: '/en/guide/api' },
  { text: 'Development', link: '/en/guide/development' },
]

export default defineConfig({
  title: 'NestJS LDAP Module',
  description: 'Module LDAP pour NestJS construit sur ldapts.',
  base,
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    plugins: [
      ...(llmstxt({
        domain: 'https://tacxou.github.io',
        title: 'NestJS LDAP Module',
        description: 'NestJS LDAP module built on ldapts.',
        details: 'Configure named LDAP connections, inject clients, and use typed helpers in NestJS applications.',
        ignoreFiles: ['branding.md', 'conventions/**'],
      }) as never[]),
    ],
  },
  locales: {
    root: {
      label: 'Français',
      lang: 'fr-FR',
      description: 'Module LDAP pour NestJS construit sur ldapts.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/installation' },
          { text: 'API', link: '/guide/api' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@tacxou/nestjs_module_ldap' },
        ],
        sidebar: [{ text: 'Guide', items: frenchGuide }],
        outline: { level: [2, 3], label: 'Sur cette page' },
        editLink: { pattern: `${repository}/edit/main/docs/:path`, text: 'Modifier cette page' },
        lastUpdated: { text: 'Mis à jour' },
        docFooter: { prev: 'Précédent', next: 'Suivant' },
        returnToTopLabel: 'Retour en haut',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Thème',
        langMenuLabel: 'Changer de langue',
        footer: { message: 'Publié sous licence MIT.', copyright: 'Copyright © tacxou et contributeurs' },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description: 'NestJS LDAP module built on ldapts.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/installation' },
          { text: 'API', link: '/en/guide/api' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@tacxou/nestjs_module_ldap' },
        ],
        sidebar: [{ text: 'Guide', items: englishGuide }],
        editLink: { pattern: `${repository}/edit/main/docs/:path`, text: 'Edit this page' },
        lastUpdated: { text: 'Updated' },
        footer: { message: 'Released under the MIT License.', copyright: 'Copyright © tacxou and contributors' },
      },
    },
  },
  themeConfig: {
    siteTitle: 'NestJS LDAP',
    socialLinks: [{ icon: 'github', link: repository }],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher' },
              modal: {
                displayDetails: 'Afficher le détail',
                resetButtonTitle: 'Réinitialiser',
                backButtonTitle: 'Retour',
                noResultsText: 'Aucun résultat pour',
                footer: { selectText: 'sélectionner', navigateText: 'naviguer', closeText: 'fermer' },
              },
            },
          },
        },
      },
    },
  },
})
