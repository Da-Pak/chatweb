export interface Persona {
  name: string;
  description: string;
  color: string;
  prompt: string;
  category: string;
  subcategory: string;
}

export interface PersonaResponse {
  persona_id: string;
  persona_name: string;
  content: string;
  timestamp: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  persona_id?: string;
  persona_name?: string;
}

export interface Conversation {
  id: string;
  persona_id: string;
  messages: Message[];
  created_at: string;
}

export interface GlobalMessage {
  id: string;
  user_message: string;
  responses: PersonaResponse[];
  timestamp: string;
}

export interface ChatState {
  personas: Record<string, Persona>;
  globalMessages: GlobalMessage[];
  conversations: Record<string, Conversation>;
  selectedConversation: string | null;
  selectedPersona: string | null;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface InterpretationStatus {
  persona_id: string;
  has_interpretation: boolean;
  created_at?: string;
}

export interface InterpretationResponse {
  persona_id: string;
  persona_name: string;
  interpretation: string;
  created_at: string;
}

export interface InterpretationRequest {
  persona_id: string;
  user_input?: string;
}

// 새로운 기능들을 위한 타입들
export interface ProceedRequest {
  persona_id: string;
  interpretation_content: string;
}

export interface ProceedResponse {
  persona_id: string;
  persona_name: string;
  proceed_content: string;
  created_at: string;
}

export interface SentenceRequest {
  persona_id: string;
  interpretation_content: string;
}

export interface SentenceResponse {
  persona_id: string;
  persona_name: string;
  sentence_content: string;
  created_at: string;
}

export interface TrainingThread {
  id: string;
  persona_id: string;
  thread_type: 'interpretation' | 'proceed' | 'sentence' | 'verbalization';
  content: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface InteractionRecord {
  id: string;
  persona_id: string;
  persona_name: string;
  threads: TrainingThread[];
  created_at: string;
  updated_at: string;
}

export interface ThreadChatRequest {
  thread_id: string;
  user_message: string;
}

export interface ThreadChatResponse {
  success: boolean;
  thread: TrainingThread;
  new_response: Message;
}

export interface GenerateWithExtrasResponse {
  interpretation: InterpretationResponse;
  proceed: ProceedResponse;
  sentence: SentenceResponse;
  interaction_record: InteractionRecord;
} 