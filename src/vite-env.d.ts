/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QUESTION_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css'
