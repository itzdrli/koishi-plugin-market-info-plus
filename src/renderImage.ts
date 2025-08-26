import { Context } from 'koishi'
import { Config } from './index'
import { marked } from 'marked'

// Dark theme colors
const dark = ['#2e3440', '#cdd6f4', '#434c5e']

export interface UpdateItem {
  type: 'new' | 'update' | 'delete'
  name: string
  version?: string
  oldVersion?: string
  newVersion?: string
  publisher?: string | null
  description?: string | null
}

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

export async function renderMarketUpdate(ctx: Context, config: Config, diff: UpdateItem[], previous: any) {
  const cardHtml = diff.map(item => {
    let title = ''
    let content = ''
    
    switch (item.type) {
      case 'new':
        title = `新增：${item.name} (${item.version})`
        if (item.publisher) {
          title += ` @${item.publisher}`
        }
        if (item.description) {
          // Convert markdown to HTML
          const descriptionHtml = marked.parse(item.description) as string
          content = `<div class="mt-2 text-sm markdown-content">${descriptionHtml}</div>`
        }
        break
      case 'update':
        title = `更新：${item.name} (${item.oldVersion} → ${item.newVersion})`
        break
      case 'delete':
        title = `删除：${item.name}`
        break
    }
    
    return `
      <div class="flex justify-center w-full">
        <div class="w-[490px] bg-[${dark[2]}] shadow-lg rounded-2xl p-4">
          <h2 class="text-lg font-semibold mb-2 break-words text-[${dark[1]}]">${title}</h2>
          ${content}
        </div>
      </div>
    `
  }).join('')

  const html = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=auto, initial-scale=1.0, max-height: auto">
      <title>market-info-plus</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* Markdown content styling */
        .markdown-content {
          color: ${dark[1]};
        }
        .markdown-content p {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .markdown-content code {
          background-color: ${dark[0]};
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .markdown-content pre {
          background-color: ${dark[0]};
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        .markdown-content blockquote {
          border-left: 4px solid ${dark[1]};
          padding-left: 1rem;
          margin: 0.5rem 0;
          font-style: italic;
        }
        .markdown-content ul, .markdown-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .markdown-content li {
          margin: 0.25rem 0;
        }
        .markdown-content a {
          color: #88c0d0;
          text-decoration: underline;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3, 
        .markdown-content h4, .markdown-content h5, .markdown-content h6 {
          margin: 0.75rem 0 0.5rem 0;
          font-weight: bold;
        }
        .markdown-content h1 { font-size: 1.5rem; }
        .markdown-content h2 { font-size: 1.25rem; }
        .markdown-content h3 { font-size: 1.125rem; }
      </style>
    </head>
    <body class="bg-[${dark[0]}] text-[${dark[1]}] h-[fit-content] w-[500px]">
      <div class="w-[490px] mx-auto p-4">
        <div class="text-center mb-5">
          <div class="bg-[${dark[2]}] shadow-lg rounded-2xl py-4 px-6">
            <p class="text-2xl font-bold text-[${dark[1]}]">插件市场更新</p>
            <p class="text-sm text-[${dark[1]}]">Powered by FSD</p>
          </div>
        </div>
        <div class="flex flex-col items-center gap-3">
          ${cardHtml}
        </div>
      </div>
    </body>
  `
  
  return await ctx.puppeteer.render(html)
}