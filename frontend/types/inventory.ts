export interface MaterialStock {
  id: number;
  material_id: string;
  material_description: string | null;
  quantity: number;
  reserved: number;
  available: number;
  created_at: string;
  updated_at: string | null;
}

export interface MaterialStockCreate {
  material_id: string;
  material_description?: string;
  quantity: number;
  reserved?: number;
}

export interface MaterialStockUpdate {
  material_description?: string;
  quantity?: number;
  reserved?: number;
}

export interface StockHistory {
  id: number;
  material_id: string;
  quantity_change: number;
  is_reserved: boolean;
  previous_quantity: number;
  new_quantity: number;
  created_at: string;
  user_id?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}