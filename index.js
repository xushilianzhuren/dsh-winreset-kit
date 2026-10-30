/**
 * dsh-winreset-kit · Windows开机密码恢复工具箱（Host插件·零依赖）
 * 忘记自己电脑密码的完整恢复SOP：微软账户在线重置/PIN清除/离线SAM清除/Utilman救援/PE盘方案。
 * 方法均为公开文档化的标准恢复手段（同Hiren's BootCD/微软官方恢复流程）。
 * ⚠️授权硬门：仅限你自己拥有或已获书面授权的设备。未授权设备=不做·这是插件的第一条也是最后一条。
 * 工具: winreset_plan(按系统版本+账户类型出方案+工具清单)。
 */
export const name = 'winreset-kit'
export const inject = ['systemPrompt', 'tools']
const SECTION = 'winreset-kit:rules'
const DEFAULTS = { order: 94, enabled: true, tool: true }

function norm(c) { const r = c ?? {}; return { order: typeof r.order === 'number' ? r.order : DEFAULTS.order, enabled: r.enabled !== false, tool: r.tool !== false } }

function renderSection() {
  return [
    '## Windows密码恢复 · SOP（仅限授权设备）',
    '',
    '**授权闸（第0步·不过不谈）**：这台电脑是你的，或你有明确授权（家人设备当面同意/公司IT工单）。回答不了=止步。本插件不提供任何针对他人设备的方法。',
    '',
    '**方案选择树（从侵入性最低开始）**：',
    '①**微软账户**（Win10/11最常见）——另一台设备走 account.live.com/password/reset 在线重置，零技术含量，先走这条；',
    '②**PIN清除**——设置里PIN忘了可退回密码登录；本地PIN错误次数锁死→重启后"我忘记了我的PIN"走微软账户验证；',
    '③**提示问题/恢复盘**——本地账户建过密码重置盘的直接用；',
    '④**离线SAM清除**——PE启动盘(微PE/Hiren\'s BootCD)+chntpw/NTPWEdit清空本地账户密码：U盘做PE→开机Boot Menu选U盘→密码修改工具选目标账户→clear→重启；BitLocker开启的机器需先有恢复密钥；',
    '⑤**Utilman救援**——PE下把 sethc.exe/utilman.exe 与 cmd.exe 对调，登录界面按5次Shift呼出管理员cmd→`net user 用户名 新密码`→记得把文件换回来；',
    '⑥**微软账户重置本地**——Win11联网账户重置后用新密码登录即恢复。',
    '',
    '**做完必做**：重置后①建密码重置盘②加指纹/PIN双因子③把恢复密钥打印收好——下次别再进PE。',
  ].join('\n')
}

const MATRIX = {
  win11: ['微软账户在线重置(account.live.com)', 'PIN重试锁→"忘记PIN"走账户验证', 'PE+chntpw/NTPWEdit清SAM(需BitLocker密钥若有)', 'Utilman/sethc对调+net user', '系统自带"重置此电脑"(保文件)'],
  win10: ['微软账户在线重置', 'PIN退回密码登录', 'PE+chntpw清SAM', 'Utilman救援', '安全模式内置Administrator(老机器)'],
  win8: ['微软账户在线重置', 'PE+chntpw', 'Utilman救援', '恢复分区重置'],
  win7: ['PE+chntpw(NTPWEdit)', 'Utilman救援(经典款)', '内置Administrator(SAFE模式·常无密码)', '离线注册表编辑'],
}

export default function plugin(ctx) {
  const cfg = norm(ctx.config?.[SECTION])
  if (!cfg.enabled) { ctx.logger?.info?.('dsh-winreset-kit: disabled'); return }
  ctx.registerSection?.({ name: SECTION, order: cfg.order, render: () => renderSection() })
  if (!cfg.tool) return
  ctx.registerTool?.({
    name: 'winreset_plan',
    description: 'Windows开机密码恢复方案生成：按系统版本+账户类型给方案排序（侵入性从低到高）+工具清单+PE制作命令。仅限授权设备。',
    parameters: {
      type: 'object',
      properties: {
        version: { type: 'string', enum: ['win11', 'win10', 'win8', 'win7'], description: 'Windows版本' },
        account: { type: 'string', description: '账户类型：微软账户/本地账户（不确定选本地）' },
        bitlocker: { type: 'string', description: '有无BitLocker：有(需恢复密钥)/无/未知' },
        authorized: { type: 'boolean', description: '是否已确认对该设备有权限（自己的或获授权）——false则只返回拒绝说明' },
      },
      required: ['version', 'authorized'],
      additionalProperties: false,
    },
    output: { schema: { type: 'object', properties: { report: { type: 'string' } }, required: ['report'], additionalProperties: false } },
    execute: async (args) => {
      try {
        if (args?.authorized !== true) {
          return { report: '🔴 授权未确认——本工具只服务"自己的设备或已获授权"的场景。\n确认权限后把 authorized=true 再来。这不是流程阻力，是这条线能存在的前提。' }
        }
        const v = String(args?.version)
        const acc = String(args?.account ?? '本地账户')
        const bl = String(args?.bitlocker ?? '未知')
        const plans = MATRIX[v] ?? []
        const lines = [`【Windows密码恢复方案·${v}·${acc}】`, '', '（按侵入性从低到高·逐个试）']
        if (acc.includes('微软')) lines.push('  ⓪ 微软账户机器九成走在线重置就解决——别急着进PE')
        plans.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`))
        if (bl === '有' || bl.includes('有')) lines.push('', '⚠️ BitLocker开启：离线方案(PE/SAM清除)会触发恢复密钥要求——先在微软账户面板拿48位恢复密钥，拿不到=离线路全堵，只剩在线重置。')
        lines.push('', '【PE盘制作】另一台电脑：下载微PE或Hiren\'s BootCD → Rufus写U盘 → 目标机Boot Menu(开机连按F12/F9/Esc)选U盘',
          '【工具包】chntpw(NTPWEdit)·PE内置密码修改工具',
          '',
          '【做完必做】建密码重置盘+开PIN/指纹双因子+收好恢复密钥。')
        return { report: lines.join('\n') }
      } catch (error) {
        return { report: 'winreset-kit 内部错：' + String(error?.message ?? error).slice(0, 160) }
      }
    },
  })
  ctx.logger?.info?.('dsh-winreset-kit: registered (order=%d)', cfg.order)
}
