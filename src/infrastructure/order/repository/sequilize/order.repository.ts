import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderItemModel.destroy({
      where: { order_id: entity.id },
    });
    const items = entity.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      product_id: item.productId,
      quantity: item.quantity,
      order_id: entity.id,
    }));
    await OrderItemModel.bulkCreate(items);
    await OrderModel.update(
      { total: entity.total(), items },
      { where: { id: entity.id } }
    );
  }

  async find(id: string): Promise<Order> {
    const find = await OrderModel.findOne({
      where: { id },
      include: ["items"],
    });

    if (!find) {
      throw new Error("Order not found");
    }

    const items = find.items.map(
      (item) =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
        )
    );

    return new Order(find.id, find.customer_id, items);
  }

  async findAll(): Promise<Order[]> {
    const find = await OrderModel.findAll({
      include: ["items"],
    });

    const orders = find
      .map((order) => {
        const items = order.items.map(
          (item) =>
            new OrderItem(
              item.id,
              item.name,
              item.price,
              item.product_id,
              item.quantity
            )
        );
        return new Order(order.id, order.customer_id, items);
      })
      .filter((order) => order.items.length > 0);

    return orders;
  }
}
