import { Context } from 'koishi'
import { Config } from './index'

// Dark theme colors
const dark = ['#2e3440', '#ffffff', '#434c5e']

export async function renderMarketUpdate(ctx: Context, config: Config, diff: string[], previous: any) {
  const cardHtml = diff.map(item => {
    return `
      <div class="col-4 flex flex-col h-full w-full min-w-[250px] max-w-[350px]">
        <div class="bg-[${dark[2]}] shadow-lg rounded-2xl p-4 flex flex-col justify-between h-full">
          <h2 class="text-lg font-semibold mb-2 flex-grow break-words text-[${dark[1]}]">${item}</h2>
        </div>
      </div>
    `
  }).join('')

  const html = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>插件市场更新</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[${dark[0]}] text-[${dark[1]}]">
      <div class="max-w-7xl mx-auto p-4">
        <div class="text-center mb-5">
          <div class="bg-[${dark[2]}] shadow-lg rounded-2xl py-4 px-6">
            <p class="text-2xl font-bold text-[${dark[1]}]">[插件市场更新]</p>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-3">
          ${cardHtml}
        </div>
      </div>
    </body>
  `

  return await ctx.puppeteer.render(html)
}