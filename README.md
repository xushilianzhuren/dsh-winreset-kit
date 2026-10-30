# dsh-winreset-kit · Windows开机密码恢复工具箱

Forgot-your-own-Windows-password playbook: **method decision tree ordered by invasiveness** — MS account online reset → PIN recovery → offline SAM clear (PE + chntpw/NTPWEdit) → Utilman/sethc rescue → system reset. Covers Win7/8/10/11.

## 工具 `winreset_plan`
按 系统版本+账户类型(微软/本地)+BitLocker状态 出方案排序+工具清单+PE盘制作步骤。**authorized=false 时只返回拒绝说明**——授权闸是第一参数。

## ⚠️ 授权硬门
仅限**自己拥有或已获授权**的设备（家人设备当面同意/公司IT工单）。本插件方法全部为公开文档化的标准恢复手段（同Hiren's BootCD与微软官方恢复流程），且内置授权闸——这是这条线能存在的前提。

## 做完必做
建密码重置盘+开PIN/指纹双因子+收好BitLocker恢复密钥——下次别再进PE。

## 安装
```
dsh plugin add github:xushilianzhuren/dsh-winreset-kit
```
MIT License.
