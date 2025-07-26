const tableNames = require("../../helpers/tableNames");
const fndb = require("../../helpers/dbFunctions");
const tableColumns = require("../../helpers/tableColumns");

module.exports=(socket, io)=>{
  // Handle user authentication/login
  socket.on('create_order', async(data) => {
    if (data && data.order_id) {
       io.emit('new_order', {
        data: data,
        message: 'New Order Received',
        timestamp: new Date()
      });
    }
  });


  socket.on('dispatch_order', async(data) => {
          console.log('Order status update received:', data);
          const orderId = data.orderId;
          const updateData = {
              status: data.status,
          };
          const result = await fndb.updateItem(
              tableNames.orders,
              orderId,
              updateData
          );
          if(result) {
            console.log('Order updated successfully:', result);
            var updatedOrder = await fndb.customQuery(`
                      SELECT 
                        orders.id,
                        orders.customer_id,
                        orders.delivery_partner_id,
                        orders.address_id,
                        orders.status,
                        orders.total_amount,
                        orders.created_at,
                        JSON_OBJECT('id', customers.id, 'name', customers.name, 'number', customers.number, 'fcm_token', customers.fcm_token) AS customer,
                        JSON_OBJECT('id', delivery_partner.id, 'name', delivery_partner.name, 'number', delivery_partner.number, 'fcm_token', delivery_partner.fcm_token) AS delivery_partner,
                        JSON_OBJECT('id', customer_gsts.id, 'gst_number', customer_gsts.gst_number, 'shop_name', customer_gsts.shop_name, 'gst_address', customer_gsts.gst_address) AS customer_gst,
                        JSON_OBJECT('id', addresses.id, 'address_line', addresses.address_line, 'city', addresses.city, 'state', addresses.state, 'postal_code', addresses.postal_code, 'latitude', addresses.latitude, 'longitude', addresses.longitude, 'house_number', addresses.house_number, 'building_name', addresses.building_name) AS address
                      FROM ${tableNames.orders}
                      LEFT JOIN ${tableNames.customers} ON orders.customer_id = customers.id
                      LEFT JOIN ${tableNames.delivery_partner} ON orders.delivery_partner_id = delivery_partner.id
                      LEFT JOIN ${tableNames.addresses} ON orders.address_id = addresses.id
                      LEFT JOIN ${tableNames.customer_gsts} ON orders.customer_gst_id = customer_gsts.id
                      WHERE orders.id = ?`, [data.orderId]);

                    if (updatedOrder && updatedOrder.length > 0) {
                      updatedOrder = updatedOrder[0]; // Get the first (and only) result
                      
                      // Parse JSON objects
                      updatedOrder.customer = JSON.parse(updatedOrder.customer);
                      updatedOrder.delivery_partner = JSON.parse(updatedOrder.delivery_partner);
                      updatedOrder.address = JSON.parse(updatedOrder.address);
                      updatedOrder.customer_gst = JSON.parse(updatedOrder.customer_gst);
                      updatedOrder.status = data.status; // Update the status in the response
                      // Get order items
                      const orderItems = await fndb.customQuery(`SELECT order_items.id AS id, order_items.quantity, order_items.price,
                            JSON_OBJECT( 'id', products.id, 'name', products.name, 'description', products.description, 'image_url',products.image_url, 'price',products.price, 'is_active',products.is_active, 'stock',products.stock, 'sub_category_id',products.sub_category_id ) AS product FROM order_items 
                            LEFT JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`, [orderId]);
                      
                      if (orderItems && orderItems.length > 0) {
                        orderItems.forEach(item => {
                          item.product = JSON.parse(item.product);
                        });
                      }

                      updatedOrder.order_items = orderItems;
                    }   
               //Notification to all delivery partners
              // Emit the updated order details to all clients in the room
              io.emit('dispatched_order', {
                  orderId: data.orderId,
                  data: updatedOrder,
                  status: data.status,
                  message: 'Order dispatched successfully',
                  timestamp: new Date()
              });
              
          }
      }); 


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });


};