import type { Directive } from 'vue'

export const vNumberColor: Directive<HTMLElement, number> = {
  mounted(el, binding) {
    el.className = binding.value >= 0 ? 'profit' : 'loss'
  },
  updated(el, binding) {
    el.className = binding.value >= 0 ? 'profit' : 'loss'
  },
}
