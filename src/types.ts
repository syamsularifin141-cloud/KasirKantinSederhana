export interface MenuItem {
  id: number;
  name: string;
  selling_price: number;
  category: 'makanan' | 'minuman' | 'snack';
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}
