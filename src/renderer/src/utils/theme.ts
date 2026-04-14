/**
 * 颜色混合工具（主要用于生成 Element Plus 所需的浅色/深色变体）
 */
function mixColor(color1: string, color2: string, weight: number): string {
  const d2h = (d: string) => parseInt(d, 16)
  const h2d = (h: number) => {
    const s = Math.round(h).toString(16)
    return s.length === 1 ? '0' + s : s
  }

  let c1 = color1.replace('#', '')
  let c2 = color2.replace('#', '')

  if (c1.length === 3)
    c1 = c1
      .split('')
      .map((c) => c + c)
      .join('')
  if (c2.length === 3)
    c2 = c2
      .split('')
      .map((c) => c + c)
      .join('')

  const r1 = d2h(c1.substring(0, 2))
  const g1 = d2h(c1.substring(2, 4))
  const b1 = d2h(c1.substring(4, 6))

  const r2 = d2h(c2.substring(0, 2))
  const g2 = d2h(c2.substring(2, 4))
  const b2 = d2h(c2.substring(4, 6))

  const r = r1 * weight + r2 * (1 - weight)
  const g = g1 * weight + g2 * (1 - weight)
  const b = b1 * weight + b2 * (1 - weight)

  return '#' + h2d(r) + h2d(g) + h2d(b)
}

/**
 * 动态修改 Element Plus 的主题色
 * @param color 16进制颜色代码，例如 #1677ff
 */
export function setPrimaryColor(color: string): void {
  if (!color) return

  const node = document.documentElement
  node.style.setProperty('--el-color-primary', color)

  // 生成不同层级的浅色 (light-1 到 light-9) 用于 Hover、Active 和背景状态
  for (let i = 1; i <= 9; i++) {
    node.style.setProperty(`--el-color-primary-light-${i}`, mixColor('#ffffff', color, i * 0.1))
  }

  // 生成深色 (dark-2)
  node.style.setProperty('--el-color-primary-dark-2', mixColor('#000000', color, 0.2))
}

/**
 * 切换 Element Plus 的暗黑模式
 * @param isDark 是否开启暗黑模式
 */
export function toggleDarkTheme(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
