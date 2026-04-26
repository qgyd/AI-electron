<template>
  <div class="calculator-wrapper">
    <div class="mac-calculator" :class="[currentMode]">
      <!-- Top Title Bar -->
      <div class="title-bar">
        <div class="window-controls">
          <div class="dot close"></div>
          <div class="dot minimize"></div>
          <div class="dot maximize"></div>
        </div>
        <div class="toolbar">
          <div class="tool-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <el-dropdown trigger="click" placement="bottom-end" @command="handleModeChange" popper-class="mac-dropdown-popper">
            <div class="tool-btn active">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <line x1="8" y1="6" x2="16" y2="6"></line>
                <line x1="16" y1="10" x2="16" y2="10"></line>
                <line x1="12" y1="10" x2="12" y2="10"></line>
                <line x1="8" y1="10" x2="8" y2="10"></line>
                <line x1="16" y1="14" x2="16" y2="14"></line>
                <line x1="12" y1="14" x2="12" y2="14"></line>
                <line x1="8" y1="14" x2="8" y2="14"></line>
                <line x1="16" y1="18" x2="16" y2="18"></line>
                <line x1="12" y1="18" x2="12" y2="18"></line>
                <line x1="8" y1="18" x2="8" y2="18"></line>
              </svg>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="mac-dropdown-menu">
                <el-dropdown-item command="basic" :class="{ 'is-active': currentMode === 'basic' }">
                  <span class="menu-icon"><el-icon v-if="currentMode === 'basic'"><Check /></el-icon></span>
                  基础
                </el-dropdown-item>
                <el-dropdown-item command="scientific" :class="{ 'is-active': currentMode === 'scientific' }">
                  <span class="menu-icon"><el-icon v-if="currentMode === 'scientific'"><Check /></el-icon></span>
                  <span class="custom-icon"><i>f(x)</i></span> 科学
                </el-dropdown-item>
                <el-dropdown-item command="programmer" :class="{ 'is-active': currentMode === 'programmer' }">
                  <span class="menu-icon"><el-icon v-if="currentMode === 'programmer'"><Check /></el-icon></span>
                  <el-icon><Monitor /></el-icon> 程序员
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Display Area -->
      <div class="display-area">
        <!-- Programmer Base Displays -->
        <div v-if="currentMode === 'programmer'" class="programmer-bases">
          <div class="base-row" :class="{ active: progBase === 16 }" @click="setProgBase(16)">
            <span class="label">16</span>
            <span class="val">{{ hexValue }}</span>
          </div>
          <div class="base-row" :class="{ active: progBase === 10 }" @click="setProgBase(10)">
            <span class="label">10</span>
            <span class="val">{{ decValue }}</span>
          </div>
          <div class="base-row" :class="{ active: progBase === 8 }" @click="setProgBase(8)">
            <span class="label">8</span>
            <span class="val">{{ octValue }}</span>
          </div>
          <div class="base-row" :class="{ active: progBase === 2 }" @click="setProgBase(2)">
            <span class="label">2</span>
            <span class="val bin-val">{{ binValue }}</span>
          </div>
        </div>

        <!-- Main Display -->
        <div class="display">
          <div class="current-value" :style="{ fontSize: displayFontSize }">
            {{ displayValue }}
          </div>
        </div>
      </div>

      <!-- Keypad Container -->
      <div class="keypad-container">
        
        <!-- Basic Mode Keypad -->
        <div v-if="currentMode === 'basic'" class="keypad basic">
          <!-- Row 1 -->
          <button class="btn action" @click="handleBackspace">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          </button>
          <button class="btn action" @click="handleAction('clear')">{{ clearText }}</button>
          <button class="btn action" @click="handleAction('percent')">%</button>
          <button class="btn op" :class="{ active: currentOperator === '/' && waitingForNewValue }" @click="handleOperator('/')">÷</button>

          <!-- Row 2 -->
          <button class="btn num" @click="handleNumber('7')">7</button>
          <button class="btn num" @click="handleNumber('8')">8</button>
          <button class="btn num" @click="handleNumber('9')">9</button>
          <button class="btn op" :class="{ active: currentOperator === '*' && waitingForNewValue }" @click="handleOperator('*')">×</button>

          <!-- Row 3 -->
          <button class="btn num" @click="handleNumber('4')">4</button>
          <button class="btn num" @click="handleNumber('5')">5</button>
          <button class="btn num" @click="handleNumber('6')">6</button>
          <button class="btn op" :class="{ active: currentOperator === '-' && waitingForNewValue }" @click="handleOperator('-')">−</button>

          <!-- Row 4 -->
          <button class="btn num" @click="handleNumber('1')">1</button>
          <button class="btn num" @click="handleNumber('2')">2</button>
          <button class="btn num" @click="handleNumber('3')">3</button>
          <button class="btn op" :class="{ active: currentOperator === '+' && waitingForNewValue }" @click="handleOperator('+')">+</button>

          <!-- Row 5 -->
          <button class="btn num" @click="handleAction('sign')">±</button>
          <button class="btn num" @click="handleNumber('0')">0</button>
          <button class="btn num" @click="handleNumber('.')">.</button>
          <button class="btn op" @click="calculate()">=</button>
        </div>

        <!-- Scientific Mode Keypad -->
        <div v-else-if="currentMode === 'scientific'" class="keypad scientific">
          <!-- Left Panel -->
          <div class="sci-keys">
            <button class="btn sci" @click="handleSciAction('(')">(</button>
            <button class="btn sci" @click="handleSciAction(')')">)</button>
            <button class="btn sci" @click="handleSciAction('mc')">mc</button>
            <button class="btn sci" @click="handleSciAction('m+')">m+</button>
            <button class="btn sci" @click="handleSciAction('m-')">m-</button>
            <button class="btn sci" @click="handleSciAction('mr')">mr</button>
            
            <button class="btn sci" @click="toggle2nd" :class="{ active: is2nd }">2<sup>nd</sup></button>
            <button class="btn sci" @click="handleSciAction('x2')">x<sup>2</sup></button>
            <button class="btn sci" @click="handleSciAction('x3')">x<sup>3</sup></button>
            <button class="btn sci" @click="handleSciAction('xy')">x<sup>y</sup></button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'y^x' : 'ex')">{{ is2nd ? 'yˣ' : 'eˣ' }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? '2^x' : '10x')">{{ is2nd ? '2ˣ' : '10ˣ' }}</button>
            
            <button class="btn sci" @click="handleSciAction('1/x')"><sup>1</sup>/<sub>x</sub></button>
            <button class="btn sci" @click="handleSciAction('sqrt')">²√x</button>
            <button class="btn sci" @click="handleSciAction('cbrt')">³√x</button>
            <button class="btn sci" @click="handleSciAction('yroot')"><sup>y</sup>√x</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'logy' : 'ln')">{{ is2nd ? 'logᵧ' : 'ln' }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'log2' : 'log10')">{{ is2nd ? 'log₂' : 'log₁₀' }}</button>
            
            <button class="btn sci" @click="handleSciAction('x!')">x!</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'asin' : 'sin')">{{ is2nd ? 'sin⁻¹' : 'sin' }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'acos' : 'cos')">{{ is2nd ? 'cos⁻¹' : 'cos' }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'atan' : 'tan')">{{ is2nd ? 'tan⁻¹' : 'tan' }}</button>
            <button class="btn sci" @click="handleSciAction('e')">e</button>
            <button class="btn sci" @click="handleSciAction('EE')">EE</button>
            
            <button class="btn sci" @click="toggleAngle" :class="{ active: angleMode === 'Deg' }">{{ angleMode }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'asinh' : 'sinh')">{{ is2nd ? 'sinh⁻¹' : 'sinh' }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'acosh' : 'cosh')">{{ is2nd ? 'cosh⁻¹' : 'cosh' }}</button>
            <button class="btn sci" @click="handleSciAction(is2nd ? 'atanh' : 'tanh')">{{ is2nd ? 'tanh⁻¹' : 'tanh' }}</button>
            <button class="btn sci" @click="handleSciAction('pi')">π</button>
            <button class="btn sci" @click="handleSciAction('Rand')">Rand</button>
          </div>
          
          <!-- Right Panel (Basic) -->
          <div class="basic-keys">
            <button class="btn action" @click="handleBackspace">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                <line x1="18" y1="9" x2="12" y2="15"></line>
                <line x1="12" y1="9" x2="18" y2="15"></line>
              </svg>
            </button>
            <button class="btn action" @click="handleAction('clear')">{{ clearText }}</button>
            <button class="btn action" @click="handleAction('percent')">%</button>
            <button class="btn op" :class="{ active: currentOperator === '/' && waitingForNewValue }" @click="handleOperator('/')">÷</button>

            <button class="btn num" @click="handleNumber('7')">7</button>
            <button class="btn num" @click="handleNumber('8')">8</button>
            <button class="btn num" @click="handleNumber('9')">9</button>
            <button class="btn op" :class="{ active: currentOperator === '*' && waitingForNewValue }" @click="handleOperator('*')">×</button>

            <button class="btn num" @click="handleNumber('4')">4</button>
            <button class="btn num" @click="handleNumber('5')">5</button>
            <button class="btn num" @click="handleNumber('6')">6</button>
            <button class="btn op" :class="{ active: currentOperator === '-' && waitingForNewValue }" @click="handleOperator('-')">−</button>

            <button class="btn num" @click="handleNumber('1')">1</button>
            <button class="btn num" @click="handleNumber('2')">2</button>
            <button class="btn num" @click="handleNumber('3')">3</button>
            <button class="btn op" :class="{ active: currentOperator === '+' && waitingForNewValue }" @click="handleOperator('+')">+</button>

            <button class="btn num" @click="handleAction('sign')">±</button>
            <button class="btn num" @click="handleNumber('0')">0</button>
            <button class="btn num" @click="handleNumber('.')">.</button>
            <button class="btn op" @click="calculate()">=</button>
          </div>
        </div>

        <!-- Programmer Mode Keypad -->
        <div v-else-if="currentMode === 'programmer'" class="keypad programmer">
          <!-- Left Panel -->
          <div class="sci-keys">
            <button class="btn sci" @click="handleProgOp('<<')">&lt;&lt;</button>
            <button class="btn sci" @click="handleProgOp('>>')">&gt;&gt;</button>
            <button class="btn sci" @click="handleProgOp('AND')">AND</button>
            <button class="btn sci" @click="handleProgOp('OR')">OR</button>
            
            <button class="btn sci" @click="handleProgOp('RoL')">RoL</button>
            <button class="btn sci" @click="handleProgOp('RoR')">RoR</button>
            <button class="btn sci" @click="handleProgOp('XOR')">XOR</button>
            <button class="btn sci" @click="handleProgOp('NOR')">NOR</button>
            
            <button class="btn sci" @click="handleProgOp('2nd')">2<sup>nd</sup></button>
            <button class="btn sci" @click="handleProgOp('NOT')">NOT</button>
            <button class="btn sci num" :disabled="progBase !== 16" @click="handleProgNumber('A')">A</button>
            <button class="btn sci num" :disabled="progBase !== 16" @click="handleProgNumber('B')">B</button>
            
            <button class="btn sci" @click="handleProgOp('FF')">FF</button>
            <button class="btn sci" @click="handleProgOp('00')">00</button>
            <button class="btn sci num" :disabled="progBase !== 16" @click="handleProgNumber('C')">C</button>
            <button class="btn sci num" :disabled="progBase !== 16" @click="handleProgNumber('D')">D</button>
            
            <button class="btn sci" @click="handleProgOp('ASCII')">ASCII</button>
            <button class="btn sci" @click="handleProgOp('Uni')">Uni</button>
            <button class="btn sci num" :disabled="progBase !== 16" @click="handleProgNumber('E')">E</button>
            <button class="btn sci num" :disabled="progBase !== 16" @click="handleProgNumber('F')">F</button>
          </div>
          
          <!-- Right Panel -->
          <div class="basic-keys">
            <button class="btn action" @click="handleProgBackspace">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                <line x1="18" y1="9" x2="12" y2="15"></line>
                <line x1="12" y1="9" x2="18" y2="15"></line>
              </svg>
            </button>
            <button class="btn action" @click="handleProgAction('clear')">{{ clearText }}</button>
            <button class="btn action" @click="handleProgAction('sign')">±</button>
            <button class="btn op" :class="{ active: currentOperator === '/' && waitingForNewValue }" @click="handleOperator('/')">÷</button>

            <button class="btn num" :disabled="progBase === 2" @click="handleProgNumber('7')">7</button>
            <button class="btn num" :disabled="progBase === 2 || progBase === 8" @click="handleProgNumber('8')">8</button>
            <button class="btn num" :disabled="progBase === 2 || progBase === 8" @click="handleProgNumber('9')">9</button>
            <button class="btn op" :class="{ active: currentOperator === '*' && waitingForNewValue }" @click="handleOperator('*')">×</button>

            <button class="btn num" :disabled="progBase === 2" @click="handleProgNumber('4')">4</button>
            <button class="btn num" :disabled="progBase === 2" @click="handleProgNumber('5')">5</button>
            <button class="btn num" :disabled="progBase === 2" @click="handleProgNumber('6')">6</button>
            <button class="btn op" :class="{ active: currentOperator === '-' && waitingForNewValue }" @click="handleOperator('-')">−</button>

            <button class="btn num" @click="handleProgNumber('1')">1</button>
            <button class="btn num" :disabled="progBase === 2" @click="handleProgNumber('2')">2</button>
            <button class="btn num" :disabled="progBase === 2" @click="handleProgNumber('3')">3</button>
            <button class="btn op" :class="{ active: currentOperator === '+' && waitingForNewValue }" @click="handleOperator('+')">+</button>

            <button class="btn num zero" @click="handleProgNumber('0')">0</button>
            <button class="btn num" disabled>.</button>
            <button class="btn op" @click="calculate()">=</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Monitor } from '@element-plus/icons-vue'

const currentMode = ref('basic')
const displayValue = ref('0')
const previousValue = ref<string | null>(null)
const currentOperator = ref<string | null>(null)
const waitingForNewValue = ref(false)

// Scientific Mode State
const is2nd = ref(false)
const angleMode = ref('Rad') // Rad or Deg

// Programmer Mode State
const progBase = ref(10) // 10, 16, 8, 2
const decValue = computed(() => {
  if (displayValue.value === '错误') return '0'
  const val = parseInt(displayValue.value, progBase.value)
  return isNaN(val) ? '0' : val.toString(10)
})
const hexValue = computed(() => {
  if (displayValue.value === '错误') return '0'
  const val = parseInt(displayValue.value, progBase.value)
  return isNaN(val) ? '0' : val.toString(16).toUpperCase()
})
const octValue = computed(() => {
  if (displayValue.value === '错误') return '0'
  const val = parseInt(displayValue.value, progBase.value)
  return isNaN(val) ? '0' : val.toString(8)
})
const binValue = computed(() => {
  if (displayValue.value === '错误') return '0'
  const val = parseInt(displayValue.value, progBase.value)
  if (isNaN(val)) return '0'
  // Format binary into blocks of 4
  const binStr = val.toString(2)
  return binStr.replace(/\B(?=(\d{4})+(?!\d))/g, " ")
})

const setProgBase = (base: number) => {
  if (progBase.value === base) return
  // Convert current display value to new base
  const valDec = parseInt(displayValue.value, progBase.value)
  if (!isNaN(valDec)) {
    displayValue.value = valDec.toString(base).toUpperCase()
  }
  progBase.value = base
}

const handleProgNumber = (num: string) => {
  if (waitingForNewValue.value) {
    displayValue.value = num
    waitingForNewValue.value = false
  } else {
    displayValue.value = displayValue.value === '0' ? num : displayValue.value + num
  }
}

const handleProgBackspace = () => {
  if (waitingForNewValue.value) return
  displayValue.value = displayValue.value.length > 1 ? displayValue.value.slice(0, -1) : '0'
}

const handleProgAction = (action: string) => {
  if (action === 'clear') {
    displayValue.value = '0'
    previousValue.value = null
    currentOperator.value = null
    waitingForNewValue.value = false
  } else if (action === 'sign') {
    // Basic sign flip for programmer (two's complement would be better, but simple flip for now)
    const val = parseInt(displayValue.value, progBase.value)
    if (!isNaN(val)) {
      displayValue.value = (-val).toString(progBase.value).toUpperCase()
    }
  }
}

const handleProgOp = (op: string) => {
  const val = parseInt(displayValue.value, progBase.value)
  if (isNaN(val)) return
  
  switch (op) {
    case 'NOT':
      displayValue.value = (~val >>> 0).toString(progBase.value).toUpperCase()
      break
    case '<<':
      displayValue.value = (val << 1).toString(progBase.value).toUpperCase()
      break
    case '>>':
      displayValue.value = (val >> 1).toString(progBase.value).toUpperCase()
      break
    case 'FF':
      displayValue.value = 'FF'
      break
    case '00':
      displayValue.value = '00'
      break
    // More complex bitwise ops would need state management similar to basic math operators
  }
  waitingForNewValue.value = true
}

const displayFontSize = computed(() => {
  const len = displayValue.value.length
  if (currentMode.value === 'programmer') return len > 12 ? '32px' : '44px'
  return len > 12 ? '32px' : len > 8 ? '44px' : '56px'
})

const handleModeChange = (command: string) => {
  currentMode.value = command
  // Reset on mode switch to avoid cross-mode parsing errors
  displayValue.value = '0'
  previousValue.value = null
  currentOperator.value = null
  progBase.value = 10
}

const clearText = computed(() => {
  return displayValue.value === '0' && !previousValue.value ? 'AC' : 'C'
})

const handleNumber = (num: string) => {
  if (waitingForNewValue.value) {
    displayValue.value = num
    waitingForNewValue.value = false
  } else {
    if (num === '.') {
      if (!displayValue.value.includes('.')) {
        displayValue.value += '.'
      }
    } else {
      displayValue.value = displayValue.value === '0' ? num : displayValue.value + num
    }
  }
}

const handleBackspace = () => {
  if (waitingForNewValue.value) return
  displayValue.value = displayValue.value.length > 1 ? displayValue.value.slice(0, -1) : '0'
}

const handleAction = (action: string) => {
  switch (action) {
    case 'clear':
      if (displayValue.value === '0') {
        previousValue.value = null
        currentOperator.value = null
      }
      displayValue.value = '0'
      waitingForNewValue.value = false
      break
    case 'sign':
      displayValue.value = String(parseFloat(displayValue.value) * -1)
      break
    case 'percent':
      displayValue.value = String(parseFloat(displayValue.value) / 100)
      break
  }
}

const handleOperator = (op: string) => {
  if (currentOperator.value && !waitingForNewValue.value) {
    calculate()
  }
  previousValue.value = displayValue.value
  currentOperator.value = op
  waitingForNewValue.value = true
}

const calculate = () => {
  if (!currentOperator.value || !previousValue.value) return
  
  let prev, current;
  if (currentMode.value === 'programmer') {
    prev = parseInt(previousValue.value, progBase.value)
    current = parseInt(displayValue.value, progBase.value)
  } else {
    prev = parseFloat(previousValue.value)
    current = parseFloat(displayValue.value)
  }
  
  let result = 0
  
  switch (currentOperator.value) {
    case '+': result = prev + current; break
    case '-': result = prev - current; break
    case '*': result = prev * current; break
    case '/':
      if (current === 0) {
        displayValue.value = '错误'
        previousValue.value = null
        currentOperator.value = null
        waitingForNewValue.value = true
        return
      }
      if (currentMode.value === 'programmer') {
        result = Math.floor(prev / current)
      } else {
        result = prev / current
      }
      break
  }
  
  if (currentMode.value === 'programmer') {
    displayValue.value = Math.floor(result).toString(progBase.value).toUpperCase()
  } else {
    const numStr = parseFloat(result.toPrecision(12)) // Remove JS float weirdness
    displayValue.value = String(numStr)
  }
  
  previousValue.value = null
  currentOperator.value = null
  waitingForNewValue.value = true
}

const toggle2nd = () => {
  is2nd.value = !is2nd.value
}

const toggleAngle = () => {
  angleMode.value = angleMode.value === 'Rad' ? 'Deg' : 'Rad'
}

// 科学计算器操作处理
const handleSciAction = (action: string) => {
  const current = parseFloat(displayValue.value)
  let result = 0
  
  // Convert angle if needed
  const toRad = (val: number) => angleMode.value === 'Deg' ? val * Math.PI / 180 : val
  const fromRad = (val: number) => angleMode.value === 'Deg' ? val * 180 / Math.PI : val

  switch (action) {
    case 'x2': result = current * current; break
    case 'x3': result = current * current * current; break
    case '1/x': result = current !== 0 ? 1 / current : NaN; break
    case 'sqrt': result = current >= 0 ? Math.sqrt(current) : NaN; break
    case 'cbrt': result = Math.cbrt(current); break
    case 'ln': result = current > 0 ? Math.log(current) : NaN; break
    case 'log10': result = current > 0 ? Math.log10(current) : NaN; break
    case 'log2': result = current > 0 ? Math.log2(current) : NaN; break
    case 'sin': result = Math.sin(toRad(current)); break
    case 'cos': result = Math.cos(toRad(current)); break
    case 'tan': result = Math.tan(toRad(current)); break
    case 'asin': result = fromRad(Math.asin(current)); break
    case 'acos': result = fromRad(Math.acos(current)); break
    case 'atan': result = fromRad(Math.atan(current)); break
    case 'sinh': result = Math.sinh(current); break
    case 'cosh': result = Math.cosh(current); break
    case 'tanh': result = Math.tanh(current); break
    case 'e': result = Math.E; break
    case 'pi': result = Math.PI; break
    case 'Rand': result = Math.random(); break
    case 'ex': result = Math.exp(current); break
    case '10x': result = Math.pow(10, current); break
    case 'x!':
      if (current >= 0 && Number.isInteger(current)) {
        result = 1;
        for (let i = 2; i <= current; i++) result *= i;
      } else {
        result = NaN
      }
      break
    default:
      return // Unhandled actions
  }
  
  if (isNaN(result)) {
    displayValue.value = '错误'
  } else {
    displayValue.value = String(parseFloat(result.toPrecision(12)))
  }
  waitingForNewValue.value = true
}
</script>

<style scoped lang="scss">
.calculator-wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: auto;
}

.mac-calculator {
  border-radius: 12px;
  padding: 12px 12px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-width: 280px;

  /* 移除硬编码的颜色，使用 CSS 变量来随主题变化 */
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);

  &.basic { width: 280px; }
  &.scientific { width: 680px; }
  &.programmer { width: 560px; }

  .display .current-value { color: var(--el-text-color-primary); }
  
  .programmer-bases {
    color: var(--el-text-color-secondary);
    .base-row {
      &:hover { background-color: var(--el-fill-color-light); }
      &.active { 
        color: var(--el-text-color-primary);
        background-color: var(--el-fill-color);
        .label { color: var(--el-color-warning); }
      }
    }
  }

  .toolbar .tool-btn {
    color: var(--el-text-color-secondary);
    &:hover { background-color: var(--el-fill-color-light); color: var(--el-text-color-primary); }
    &.active { background-color: var(--el-fill-color); color: var(--el-text-color-primary); }
  }
  
  .btn.num { 
    background-color: var(--el-bg-color-overlay); 
    color: var(--el-text-color-primary); 
    box-shadow: var(--el-box-shadow-light); 
  }
  .btn.action { 
    background-color: var(--el-fill-color-dark); 
    color: var(--el-text-color-primary); 
    box-shadow: var(--el-box-shadow-light);
  }
  .btn.op { 
    background-color: var(--el-color-warning); 
    color: #fff; 
    box-shadow: var(--el-box-shadow-light);
  }
  .btn.op.active { 
    background-color: var(--el-text-color-primary); 
    color: var(--el-color-warning); 
  }
  .btn.sci {
    background-color: var(--el-fill-color-dark);
    color: var(--el-text-color-primary);
    box-shadow: var(--el-box-shadow-light);
    &.active {
      background-color: var(--el-text-color-secondary);
      color: var(--el-bg-color);
    }
  }
}



.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 0 6px;

  .window-controls {
    display: flex;
    gap: 8px;

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      &.close { background-color: #FF5F56; }
      &.minimize { background-color: #FFBD2E; }
      &.maximize { background-color: #28C840; } 
    }
  }

  .toolbar {
    display: flex;
    gap: 6px;

    .tool-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }
  }
}

.display-area {
  margin-bottom: 12px;
  padding: 0 8px;
}

.programmer-bases {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
  font-family: 'SF Mono', ui-monospace, monospace;
  font-size: 13px;
  
  .base-row {
    display: flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    
    .label {
      width: 24px;
      font-weight: 600;
    }
    
    .val {
      flex: 1;
      text-align: right;
      letter-spacing: 0.5px;
      
      &.bin-val {
        font-size: 11px;
        letter-spacing: 1px;
      }
    }
  }
}

.display {
  text-align: right;
  height: 64px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;

  .current-value {
    font-weight: 300;
    line-height: 1;
    letter-spacing: -1px;
    white-space: nowrap;
    transition: font-size 0.2s;
  }
}

.keypad-container {
  position: relative;
}

.keypad {
  display: grid;
  gap: 8px;

  .btn {
    border-radius: 8px; /* macOS newer style uses slightly rounded rects for scientific/programmer, and circles for basic */
    border: none;
    outline: none;
    font-size: 22px;
    font-weight: 400;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: filter 0.1s, background-color 0.2s;
    padding: 14px 0;

    &:active:not(:disabled) {
      filter: brightness(0.7);
    }

    &.action { font-size: 18px; }
    &.op { font-size: 26px; }
    &.sci { 
      font-size: 14px; 
      border-radius: 6px;
      padding: 10px 0;
    }
    
    &.zero {
      grid-column: span 2;
    }
  }

  &.basic {
    grid-template-columns: repeat(4, 1fr);
    .btn {
      aspect-ratio: 1 / 1;
      border-radius: 50%; /* Basic mode keeps circles */
      padding: 0;
      
      &.zero {
        aspect-ratio: auto;
        border-radius: 30px;
      }
    }
  }

  &.scientific {
    grid-template-columns: 1.5fr 1fr;
    gap: 12px;

    .sci-keys {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }

    .basic-keys {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
  }
  
  &.programmer {
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .sci-keys {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .basic-keys {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
  }
}



/* 弹出菜单样式重写 (完美复刻图片) */
.custom-icon {
  width: 16px;
  display: inline-block;
  text-align: center;
  font-family: Times, serif;
  font-style: italic;
  font-weight: bold;
}

:global(.mac-dropdown-popper) {
  padding: 4px 0 !important;
  border-radius: 8px !important;
  
  .mac-dropdown-menu {
    padding: 0 !important;
    min-width: 160px;
    
    .el-dropdown-menu__item {
      padding: 6px 16px;
      margin: 2px 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      font-size: 14px;
      color: var(--el-text-color-primary);
      
      .menu-icon {
        width: 24px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }

      &:hover {
        background-color: var(--el-color-primary);
        color: white;
      }
      
      &.is-active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        
        .menu-icon, .el-icon {
          color: var(--el-color-primary);
        }
        
        &:hover {
          background-color: var(--el-color-primary);
          color: white;
          
          .menu-icon, .el-icon {
            color: white;
          }
        }
      }
    }
    
    .el-dropdown-menu__item--divided {
      margin-top: 6px;
      &::before {
        margin: 0 -6px;
      }
    }
  }
}


</style>
