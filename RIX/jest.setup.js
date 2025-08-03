import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/dashboard'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(dynamicFunction) {
    const DynamicComponent = dynamicFunction()
    DynamicComponent.preload = jest.fn()
    return DynamicComponent
  }
})

// Mock Next.js server APIs for API route testing
global.Request = class MockRequest {
  constructor(input, init = {}) {
    // Use Object.defineProperty to properly set url as a getter property
    Object.defineProperty(this, 'url', {
      value: input,
      writable: false,
      enumerable: true,
      configurable: true
    })
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
    this._bodyUsed = false
  }

  async json() {
    if (this._bodyUsed) throw new Error('Body already used')
    this._bodyUsed = true
    return JSON.parse(this.body || '{}')
  }

  async text() {
    if (this._bodyUsed) throw new Error('Body already used')
    this._bodyUsed = true
    return this.body || ''
  }

  get cookies() {
    return {
      get: jest.fn((name) => {
        const cookie = this.headers.get('Cookie') || ''
        const match = cookie.match(new RegExp(`${name}=([^;]+)`))
        return match ? { value: match[1] } : undefined
      })
    }
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.ok = this.status >= 200 && this.status < 300
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  async text() {
    return this.body || ''
  }

  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    })
  }
}

global.Headers = class MockHeaders extends Map {
  constructor(init) {
    super()
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value))
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value))
      }
    }
  }

  get(name) {
    return super.get(name.toLowerCase())
  }

  set(name, value) {
    return super.set(name.toLowerCase(), value)
  }

  has(name) {
    return super.has(name.toLowerCase())
  }

  delete(name) {
    return super.delete(name.toLowerCase())
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
global.sessionStorage = localStorageMock

// Mock navigator.vibrate for haptic feedback tests
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
})

// Mock geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

// Mock service worker for PWA tests
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn(() => Promise.resolve({
      unregister: jest.fn(() => Promise.resolve(true)),
      update: jest.fn(() => Promise.resolve()),
    })),
    ready: Promise.resolve({
      unregister: jest.fn(() => Promise.resolve(true)),
      update: jest.fn(() => Promise.resolve()),
    }),
    controller: null,
    oncontrollerchange: null,
    onmessage: null,
  },
})

// Mock TextEncoder and TextDecoder for Node.js compatibility
global.TextEncoder = class TextEncoder {
  encode(input) {
    return Buffer.from(input, 'utf8')
  }
}

global.TextDecoder = class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString('utf8')
  }
}

// Mock crypto for JWT and other cryptographic operations
global.crypto = {
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  }),
  randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  subtle: {
    sign: jest.fn(() => Promise.resolve(new ArrayBuffer(64))),
    verify: jest.fn(() => Promise.resolve(true)),
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    importKey: jest.fn(() => Promise.resolve({})),
    generateKey: jest.fn(() => Promise.resolve({})),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16)))
  }
}

// Mock CSS custom properties for theme tests
const getComputedStyleMock = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
  setProperty: jest.fn(),
  removeProperty: jest.fn(),
}))
global.getComputedStyle = getComputedStyleMock

// Mock Element.getBoundingClientRect for layout tests
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
}))

// Mock scroll methods
Element.prototype.scrollIntoView = jest.fn()
window.scrollTo = jest.fn()

// Suppress console warnings for test clarity (except errors)
const originalWarn = console.warn
const originalError = console.error

beforeEach(() => {
  console.warn = jest.fn()
  console.error = originalError
})

afterEach(() => {
  console.warn = originalWarn
  console.error = originalError
  jest.clearAllMocks()
  localStorageMock.clear()
})