export interface AuthenticatedUserInterface extends Request{
  id: string;
  email: string;
  name: string;
  fullName: string;
  createdAt: string;
  lastLogin: string;
  token: string;
}