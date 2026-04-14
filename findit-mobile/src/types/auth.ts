export interface User {
  id: string;
  nom: string;
  email: string;
  photo_url: string | null;
  note_fiabilite: number | null;
  date_inscription: string;
  nb_objets_resolus: number;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends Tokens {
  user: User;
}
