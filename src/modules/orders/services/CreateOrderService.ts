import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import app from '@shared/infra/http/app';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExist = await this.customersRepository.findById(customer_id);

    if(!customerExist){
      throw new AppError('could not find any customer with the given id');
    }

    const existentProduct = await this.productsRepository.findAllById(products);

    if(!existentProduct.length){
      throw new AppError('could not find any products wiht the given ids');
    }

    const existingProductsIds = await existentProduct.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product => !existingProductsIds.includes(product.id),
    );

    if(checkInexistentProducts.length){
      throw new AppError(`could not find product ${checkInexistentProducts[0].id}`);
    }

    const findProductWithQuantityAvailable = products.filter(
      product => existentProduct.filter(p => p.id == product.id)[0].quantity < product.quantity,
    );

    if(findProductWithQuantityAvailable.length){
      throw new AppError(`the quantity ${findProductWithQuantityAvailable[0].quantity} is not availablefor ${findProductWithQuantityAvailable[0].id}`)
    }

    const serailizaProduct = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: existentProduct.filter(p => p.id == product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExist,
      products:serailizaProduct
    });

    const { order_products } = order;

    const orderProductQuantity = order_products.map(product => ({
      id:product.product_id,
      quantity:existentProduct.filter(p => p.id == product.product_id)[0].quantity - product.quantity
    }));

    await this.productsRepository.updateQuantity(orderProductQuantity);

    return order;
  }
}

export default CreateOrderService;
