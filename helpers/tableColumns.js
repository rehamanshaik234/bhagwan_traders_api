const tableNames = require("./tableNames.js");

const UserCols = {
  id: "id",
  name: "name",
  email: "email",
  password: "password_hash",
  role: "role",
  created_at: "created_at",
};

const CustomerGstCols = {
  id: "id",
  customer_id: "customer_id",
  address_id: "address_id",
  gst_number: "gst_number",
};

const AddressCols = {
  id: "id",
  customer_id: "customer_id",
  title: "title",
  address_line: "address_line",
  area: "area",
  city: "city",
  state: "state",
  postal_code: "postal_code",
  longitude: "longitude",
  latitude: "latitude",
  house_number: "house_number",
  building_name: "building_name",
};

const BrandCols = {
  id: "id",
  name: "name",
  description: "description",
  image_url: "image_url",
  is_active: "is_active",
  created_at: "created_at",
};

const CartCols = {
  id: "id",
  customer_id: "customer_id",
  created_at: "created_at",
};

const CartItemCols = {
  id: "id",
  cart_id: "cart_id",
  product_id: "product_id",
  quantity: "quantity",
};

const CategoryCols = {
  id: "id",
  name: "name",
  image_url: "image_url",
  description: "description",
};

const CustomerCols = {
  id: "id",
  name: "name",
  email: "email",
  password: "password",
  number: "number",
  created_at: "created_at",
};

const DeliveryPartnerCols = {
  id: "id",
  name: "name",
  email: "email",
  password: "password",
  number: "number",
  created_at: "created_at",
};

const OrderCols = {
  id: "id",
  customer_id: "customer_id",
  shipping_address: "shipping_address",
  total_amount: "total_amount",
  status: "status",
  delivery_partner_id: "delivery_partner_id",
  address_id: "address_id",
  latitude: "latitude",
  longitude: "longitude",
  created_at: "created_at",
};

const OrderItemCols = {
  id: "id",
  order_id: "order_id",
  product_id: "product_id",
  quantity: "quantity",
  price: "price",
};

const ProductCols = {
  id: "id",
  name: "name",
  description: "description",
  brand_id: "brand_id",
  category_id: "category_id",
  price: "price",
  stock: "stock",
  is_active: "is_active",
  created_at: "created_at",
};

const ProductVariantCols = {
  id: "id",
  product_id: "product_id",
  variant_name: "variant_name",
  additional_price: "additional_price",
};

const NumberOTPCols = {
  number: "number",
  otp: "otp",
};

const ProductImagesCols = {
  id: "id",
  product_id: "product_id",
  image_url: "image_url",
};

const SubCategoryCols = {
  id: "id",
  name: "name",
  image_url: "image_url",
  description: "description",
  category_id: "category_id",
  created_at: "created_at",
};

function getColumns(tableName) {
  switch (tableName) {
    case tableNames.users:
      return UserCols;

    case tableNames.addresses:
      return AddressCols;

    case tableNames.brands:
      return BrandCols;

    case tableNames.carts:
      return CartCols;

    case tableNames.cartItems:
      return CartItemCols;

    case tableNames.categories:
      return CategoryCols;

    case tableNames.customers:
      return CustomerCols;

    case tableNames.orders:
      return OrderCols;

    case tableNames.orderItems:
      return OrderItemCols;

    case tableNames.products:
      return ProductCols;

    case tableNames.productVariants:
      return ProductVariantCols;

    case tableNames.numberOtps:
      return NumberOTPCols;

    case tableNames.customer_gsts:
      return CustomerGstCols;

    case tableNames.delivery_partner:
      return DeliveryPartnerCols;

    case tableNames.product_images:
      return ProductImagesCols;  

    case tableNames.subCategories:
      return SubCategoryCols;  

    case "":
    default:
      return Object.assign(
        {},
        UserCols,
        AddressCols,
        BrandCols,
        CartCols,
        CartItemCols,
        CategoryCols,
        CustomerCols,
        OrderCols,
        OrderItemCols,
        ProductCols,
        ProductVariantCols,
        NumberOTPCols,
        CustomerGstCols,
        DeliveryPartnerCols,
        ProductImagesCols,
        SubCategoryCols
      );
  }
}

function getKeyColumn(tableName) {
  const userId = "user_id";
  const addressId = "address_id";
  const brandId = "brand_id";
  const cartItemId = "cart_item_id";
  const cartId = "cart_id";
  const categorId = "category_id";
  const customerId = "customer_id";
  const orderItemId = "order_item_id";
  const productVariantId = "product_variant_id";
  const productId = "product_id";
  const otpNumber = "number";
  const customergstId = "customer_gst_id";
  const deliveryPartnerId = "delivery_partner_id";
  const productImageId = "product_image_id";
  const subCategoryId = "sub_category_id";  

  switch (tableName) {
    case tableNames.users:
      return userId;

    case tableNames.addresses:
      return addressId;

    case tableNames.brands:
      return brandId;

    case tableNames.cartItems:
      return cartItemId;

    case tableNames.carts:
      return cartId;

    case tableNames.categories:
      return categorId;

    case tableNames.customers:
      return customerId;

    case tableNames.orderItems:
      return orderItemId;

    case tableNames.productVariants:
      return productVariantId;

    case tableNames.products:
      return productId;

    case tableNames.numberOtps:
      return otpNumber;

    case tableNames.customer_gsts:
      return customergstId;

    case tableNames.delivery_partner:
      return deliveryPartnerId; 
     
     case tableNames.product_images:
      return productImageId; 

     case tableNames.subCategories:
      return subCategoryId; 

    default:
      return "id";
  }
}
module.exports = {
  getColumns,
  getKeyColumn,
  NumberOTPCols,
  CustomerCols,
  ProductVariantCols,
  ProductCols,
  OrderItemCols,
  OrderCols,
  CategoryCols,
  CartItemCols,
  CartCols,
  BrandCols,
  AddressCols,
  UserCols,
  CustomerGstCols,
  DeliveryPartnerCols,
  ProductImagesCols,
  SubCategoryCols
};
