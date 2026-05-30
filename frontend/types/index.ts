export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  products?: { name: string; category: string; rating: string; product_url: string; reason?: string; note?: string }[]
}

export interface SkinProfile {
  ready: boolean
  skin_type: string
  concerns: string[]
  age_range: string
  sensitivities: string[]
}

export interface ChatResponse {
  response: string
  state: "INTAKE" | "RECOMMENDING" | "DONE"
  profile: SkinProfile | null
  products?: { name: string; category: string; rating: string; product_url: string; reason?: string; note?: string }[]
}

export interface SavedSession {
  id: string
  date: number
  title: string
  messages: Message[]
  profile: SkinProfile | null
}
