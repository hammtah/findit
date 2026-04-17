export interface User {
  id: string;
  nom: string;
  email: string;
  photo_url: string | null;
  note_fiabilite: number | null;
  date_inscription: string;
  nb_objets_resolus: number;
}

export interface ReportSummary {
  id: string;
  type: 'lost' | 'found';
  titre: string;
  categorie: string;
  statut: 'en_attente' | 'resolu' | 'rendu';
  adresse: string;
  distance_meters: number;
  first_photo_url: string | null;
  date_evenement: string;
  created_at: string;
  user: { nom: string; photo_url: string | null };
}

export interface MatchSuggestion {
  match_id: string;
  score: number;
  report: {
    id: string;
    titre: string;
    adresse: string;
    categorie: string;
    first_photo_url: string | null;
    date_evenement: string;
    distance_meters: number;
    user: { nom: string; note_fiabilite: number | null };
  };
}

export interface ReportDetail extends ReportSummary {
  description: string;
  photos: string[];
  heure_evenement: string | null;
  updated_at: string;
  user: {
    id: string;
    nom: string;
    photo_url: string | null;
    note_fiabilite: number | null;
  };
  matches?: MatchSuggestion[];
  my_conversation_id?: string | null;
}

export interface ConversationSummary {
  id: string;
  statut: 'en_attente' | 'active' | 'refusee' | 'archivee' | 'lecture_seule';
  report_lost: { id: string; titre: string };
  report_found?: { id: string; titre: string };
  other_user: { id: string; nom: string; photo_url: string | null };
  last_message: { contenu: string; created_at: string; is_read: boolean } | null;
  unread_count: number;
  expires_at: string | null;
  receiver_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  contenu: string;
  photo_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  note: number;
  commentaire: string | null;
  reviewer: { nom: string; photo_url: string | null };
  created_at: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    page: number;
    last_page: number;
  };
}
