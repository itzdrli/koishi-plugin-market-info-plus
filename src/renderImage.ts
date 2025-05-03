import { Context } from 'koishi'
import { Config } from './index'
import { } from 'koishi-plugin-puppeteer'

// Dark theme colors
const dark = ['#2e3440', '#cdd6f4', '#434c5e']

export async function renderMarketUpdate(ctx: Context, config: Config, diff: string[], previous: any) {
  const cardHtml = diff.map(item => {
    return `
      <div class="flex justify-center w-full">
        <div class="w-[490px] bg-[${dark[2]}] shadow-lg rounded-2xl p-4">
          <h2 class="text-lg font-semibold mb-2 break-words text-[${dark[1]}]">${item}</h2>
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
    </head>
    <body class="bg-[${dark[0]}] text-[${dark[1]}] h-[fit-content] w-[500px]">
      <div class="w-[490px] mx-auto p-4">
        <div class="text-center mb-5">
          <div class="bg-[${dark[2]}] shadow-lg rounded-2xl py-4 px-6">
            <p class="text-2xl font-bold text-[${dark[1]}]">插件市场更新</p>
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