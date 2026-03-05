export class Order {
  id: number;
  customerId: number;
  status: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  customer?: any;
  items?: any[];
}