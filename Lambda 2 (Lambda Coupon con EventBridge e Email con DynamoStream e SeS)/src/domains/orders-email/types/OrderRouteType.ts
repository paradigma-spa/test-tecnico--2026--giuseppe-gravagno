export interface AllOrderRoot {
  allOrders: AllOrder[]
}

export interface AllOrder {
  quantity: number
  userId: string
  status: string
  typeFood: string
  createdAt: string
  id: string
  nextStatusAt: number
  price: number
}
