export interface User {
  id: number;
  username: string;
  has_completed_qa: boolean;
}

export interface UserCreate {
  username: string;
  password: string;
}
