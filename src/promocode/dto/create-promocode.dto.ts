export interface CreateOrderDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    menuItemId: string;
    title: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
}