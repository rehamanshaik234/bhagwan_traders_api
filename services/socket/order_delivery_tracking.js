const fndb = require('../../helpers/dbFunctions');
const tableNames = require('../../helpers/tableNames');
const tableColumns = require('../../helpers/tableColumns');

module.exports = (socket, io) => {
  // Handle user authentication/login
  socket.on('get_order_details', async(data) => {
    console.log('Getting order details for:', data);
    socket.orderId = data.orderId;
    socket.join(`${data.orderId}`);
    var result={};
    const query = `SELECT 
                        ${tableNames.orders}.id AS id,
                        ${tableNames.orders}.customer_id,
                        ${tableNames.orders}.customer_gst_id,
                        ${tableNames.orders}.address_id,
                        ${tableNames.orders}.delivery_partner_id,
                        ${tableNames.orders}.status,
                        ${tableNames.orders}.created_at,
                        ${tableNames.orders}.total_amount,
                        ${tableNames.orders}.shipping_address,
                        ${tableNames.orders}.delivery_charges,
                        ${tableNames.orders}.delivery_distance,
                        ${tableNames.orders}.latitude,
                        ${tableNames.orders}.longitude,
                        JSON_OBJECT(
                            'id', ${tableNames.customer_gsts}.id,
                            'gst_number', ${tableNames.customer_gsts}.gst_number,
                            'customer_id', ${tableNames.customer_gsts}.customer_id,
                            'shop_name', ${tableNames.customer_gsts}.shop_name,
                            'gst_address', ${tableNames.customer_gsts}.gst_address,
                            'address_id', ${tableNames.customer_gsts}.address_id
                        ) AS customer_gst,
                        JSON_OBJECT(
                            'id', ${tableNames.addresses}.id,
                            'customer_id', ${tableNames.addresses}.customer_id,
                            'title', ${tableNames.addresses}.title,
                            'area', ${tableNames.addresses}.area,
                            'address_line', ${tableNames.addresses}.address_line,
                            'state', ${tableNames.addresses}.state,
                            'longitude', ${tableNames.addresses}.longitude,
                            'latitude', ${tableNames.addresses}.latitude,
                            'house_number', ${tableNames.addresses}.house_number,
                            'building_name', ${tableNames.addresses}.building_name,
                            'city', ${tableNames.addresses}.city,
                            'postal_code', ${tableNames.addresses}.postal_code
                        ) AS address,
                        JSON_OBJECT(
                            'id', ${tableNames.delivery_partner}.id,
                            'name', ${tableNames.delivery_partner}.name,
                            'number', ${tableNames.delivery_partner}.number
                        ) AS delivery_partner
                    FROM ${tableNames.orders}
                    LEFT JOIN ${tableNames.customer_gsts} ON ${tableNames.orders}.customer_gst_id = ${tableNames.customer_gsts}.id
                    LEFT JOIN ${tableNames.addresses} ON ${tableNames.orders}.address_id = ${tableNames.addresses}.id
                    LEFT JOIN ${tableNames.delivery_partner} ON ${tableNames.orders}.delivery_partner_id = ${tableNames.delivery_partner}.id
                    WHERE ${tableNames.orders}.id = ?;
                    `;
    var orderDetails= await fndb.customQuery(query, [data.orderId]);
    if (orderDetails && orderDetails.length > 0) {
      orderDetails = orderDetails[0]
      orderDetails.customer_gst = JSON.parse(orderDetails.customer_gst);
      orderDetails.address = JSON.parse(orderDetails.address);
      orderDetails.delivery_partner = JSON.parse(orderDetails.delivery_partner);
      const orderItems= await fndb.customQuery(`SELECT order_items.id AS id, order_items.quantity, order_items.price,
       JSON_OBJECT( 'id', products.id, 'name', products.name, 'description', products.description, 'image_url',products.image_url, 'price',products.price, 'is_active',products.is_active, 'stock',products.stock, 'sub_category_id',products.sub_category_id ) AS product FROM order_items 
       LEFT JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`,[data.orderId]);
      if (orderItems && orderItems.length > 0) {
        orderItems.forEach(item => {
          item.product = JSON.parse(item.product);
        });
      }
       result = { 
          order: orderDetails,
          order_items: orderItems
        };
    if (result) {
      socket.emit('order_details', {
        data: result,
        message: 'Order details retrieved successfully',
        timestamp: new Date()
      });
    }
  }});

    // Handle order updates
  socket.on('update_location', async(data) => {
        console.log('Order update received:', data);
        const orderId = data.orderId;
        const updateData = {
            order_id: orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            status: data.status,
        };
        const result = await fndb.updateItem(
            tableNames.orders,
            orderId,
            updateData
        );
        if(result) {
            io.to(`${orderId}`).emit('order_details', {
                orderId: orderId,
                latitude: data.latitude,
                longitude: data.longitude,
                status: data.status,
                message: 'Order location updated successfully',
                timestamp: new Date()
            });
        }
    });

  socket.on('update_order_status', async(data) => {
        console.log('Order status update received:', data);
        const orderId = data.orderId;
        const updateData = {
            order_id: orderId,
            status: data.status,
        };
        const result = await fndb.updateItem(
            tableNames.orders,
            orderId,
            updateData
        );
        if(result) {
            console.log('Order updated successfully:', result);
            // Emit the updated order details to all clients in the room
            io.to(`${orderId}`).emit('order_details', {
                orderId: orderId,
                status: data.status,
                message: 'Order status updated successfully',
                timestamp: new Date()
            });
        }
    }); 

  
  // Handle user logout
    socket.on('disconnect', () => {
        console.log(`User disconnected from order ${socket.orderId}`);
        socket.leave(`${socket.orderId}`);
    });
};