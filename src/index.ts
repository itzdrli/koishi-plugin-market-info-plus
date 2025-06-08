import { Context, Dict, Schema, Time, deepEqual, pick, sleep } from 'koishi'
import {} from '@koishijs/plugin-market'
import type { SearchObject, SearchResult } from '@koishijs/registry'
import { } from 'koishi-plugin-puppeteer'
import { renderMarketUpdate } from './renderImage'

export const name = 'market-info-plus'

interface Receiver {
  platform: string
  selfId: string
  channelId: string
  guildId?: string
}

export const inject = ["puppeteer"]

const Receiver: Schema<Receiver> = Schema.object({
  platform: Schema.string().required().description('平台名称。'),
  selfId: Schema.string().required().description('机器人 ID。'),
  channelId: Schema.string().required().description('频道 ID。'),
  guildId: Schema.string().description('群组 ID。'),
})

export interface Config {
  rules: Receiver[]
  endpoint: string
  interval: number
  showHidden: boolean
  showDeletion: boolean
  showPublisher: boolean
  showDescription: boolean
}

export const Config: Schema<Config> = Schema.object({
  rules: Schema.array(Receiver).role('table').description('推送规则列表。'),
  endpoint: Schema.string().default('https://kp.itzdrli.cc').description('插件市场地址。'),
  interval: Schema.number().default(Time.minute * 30).description('轮询间隔 (毫秒)。'),
  showHidden: Schema.boolean().default(false).description('是否显示隐藏的插件。'),
  showDeletion: Schema.boolean().default(false).description('是否显示删除的插件。'),
  showPublisher: Schema.boolean().default(false).description('是否显示插件发布者。'),
  showDescription: Schema.boolean().default(false).description('是否显示插件描述。'),
})

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('market-info-plus')

  const makeDict = (result: SearchResult) => {
    const dict: Dict<SearchObject> = {}
    for (const object of result.objects) {
      if (object.manifest.hidden && !config.showHidden) continue
      dict[object.shortname] = object
    }
    return dict
  }

  const getMarket = async () => {
    const data = await ctx.http.get<SearchResult>(config.endpoint)
    return makeDict(data)
  }

  ctx.on('ready', async () => {
    let previous = await getMarket()

    ctx.command('market [name]')
      .action(async ({ session, options }, name) => {
  
        if (!name) {
          const objects = Object.values(previous).filter(data => !data.manifest.hidden)
          return `当前共有 ${objects.length} 个插件`
        }

        const data = previous[name]
        if (!data) `未找到插件 ${name}。`
        return `${data.shortname} (${data.package.version})\n\n` +
          `发布者：@${data.package.publisher.username}`
      })

    ctx.setInterval(async () => {
      const current = await getMarket()
      const diff = Object.keys({ ...previous, ...current }).map((name) => {
        const version1 = previous[name]?.package.version
        const version2 = current[name]?.package.version
        if (version1 === version2) {
          return
        }

        if (!version1) {
          let output = `新增：</br>${name} (${version2})`
          if (config.showPublisher) output += ` (@${current[name].package.publisher.username})`
          if (config.showDescription) {
            const { description } = current[name].manifest
            if (description && typeof description === 'object') {
              output += `</br>  ${description.zh || description.en}`
            } else if (description && typeof description === 'string') {
              output += `</br>  ${description}`
            }
          }
          return output
        }

        if (version2) {
          return `更新：</br>${name} (${version1} → ${version2})`
        }

        if (config.showDeletion) {
          return `删除：</br>${name}`
        }
      }).filter(Boolean).sort()
      previous = current
      if (!diff.length) return

      const content = ['插件市场更新', ...diff].join('\n')
      logger.info(content)
      
      // Generate image
      const image = await renderMarketUpdate(ctx, config, diff, previous)
      
      const delay = ctx.root.config.delay.broadcast
      for (let index = 0; index < config.rules.length; ++index) {
        if (index && delay) await sleep(delay)
        const { platform, selfId, channelId, guildId } = config.rules[index]
        const bot = ctx.bots.find(bot => bot.platform === platform && bot.selfId === selfId)
        // Send both text and image
        // await bot.sendMessage(channelId, content, guildId)
        await bot.sendMessage(channelId, image, guildId)
      }
    }, config.interval)
  })

  // test command for example output
  ctx.command('test-m', { authority: 3 }).action(({ session }) => {
    // set demo data then generate image
    const demoData = [
      '新增：</br>koishi-plugin-test (1.0.0) @test',
      '更新：</br>koishi-plugin-test2 (1.0.0 → 2.0.0)',
      '删除：</br>koishi-plugin-test3',
    ]
    const demoPrevious = {
      'koishi-plugin-test': {
        shortname: 'koishi-plugin-test',
        package: {
          version: '1.0.0',
          publisher: {
            username: 'test',
          },
        },
        manifest: {
          hidden: false,
          description: {
            zh: '测试插件',
            en: 'Test plugin',
          },
        },
      },
      'koishi-plugin-test2': {
        shortname: 'koishi-plugin-test2',
        package: {
          version: '2.0.0',
          publisher: {
            username: 'test',
          },   
        },
        manifest: {
          hidden: false,
          description: {
            zh: '测试插件2',
            en: 'Test plugin2',
          },
        },
      },
      'koishi-plugin-test3': {
        shortname: 'koishi-plugin-test3',
        package: {
          version: '1.0.0',
          publisher: {
            username: 'test',
          },
        },
        manifest: {
          hidden: false,
          description: {
            zh: '测试插件3',
            en: 'Test plugin3',
          },
        },
      },
    }
    const image = renderMarketUpdate(ctx, config, demoData, demoPrevious)
    return image.then((image) => {
      return image
    }
    ).catch((error) => {
      logger.error('Error generating image:', error)
      return '生成图片失败'
    })
  })
}