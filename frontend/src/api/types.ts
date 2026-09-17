export interface User {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  image_url: string | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: string;
}

export interface OrderSummary {
  id: number;
  status: string;
  total_amount: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
}

export interface OrderDetail extends OrderSummary {
  user_id: number;
  items: OrderItem[];
}
