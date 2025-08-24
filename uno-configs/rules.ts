// uno-configs/rules.ts
import type { PresetWind3Theme, Rule } from 'unocss'
import { spacingValues } from './spacing-layout'

export const customRules: Rule<PresetWind3Theme>[] = [
  ['html', { 'font-size': '16px' }],
  [
    /^motion-(productive|expressive)-(standard|entrance|exit)-(fast-01|fast-02|moderate-01|moderate-02|slow-01|slow-02)$/,
    ([_, style, type, duration]) => {
      const easingKey = `${style}-${type}`
      const durations: Record<string, string> = {
        'fast-01': '70ms',
        'fast-02': '110ms',
        'moderate-01': '150ms',
        'moderate-02': '240ms',
        'slow-01': '400ms',
        'slow-02': '700ms',
      }
      const cubicBezier: Record<string, string> = {
        'productive-standard': '0.2, 0, 0.38, 0.9',
        'productive-entrance': '0, 0, 0.38, 0.9',
        'productive-exit': '0.2, 0, 1, 0.9',
        'expressive-standard': '0.4, 0.14, 0.3, 1',
        'expressive-entrance': '0, 0, 0.3, 1',
        'expressive-exit': '0.4, 0.14, 1, 1',
      }
      return {
        'transition-timing-function': `cubic-bezier(${cubicBezier[easingKey]})`,
        'transition-duration': durations[duration],
      }
    },
  ],
  [/^icon-size-(\d+)$/, ([_, d]) => {
    const size = spacingValues[`iconSize0${d}` as keyof typeof spacingValues]
    return { width: size, height: size }
  }],
]
