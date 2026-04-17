const fndb = require('../../helpers/dbFunctions');
const tableNames = require('../../helpers/tableNames');
const tableColumns = require('../../helpers/tableColumns');

module.exports = (socket, io) => {
  // Handle user authentication/login
  socket.on('get_order_details', async(data) => {
    console.log('Getting order details for:', data);
    socket.orderId = data.orderId;
    socket.join(`${data.orderId}`);
    if(data.pickOrder) {
      const orderId = data.orderId;
        var updateData = {
          ...data,
          status: 'Picked',
        };
        delete updateData.pickOrder;
        delete updateData.orderId; // Remove orderId from updateData
        const result = await fndb.updateItem(
          tableNames.orders,
          orderId,
          updateData
        );
    }
    var result={};
    const query = `SELECT 
                        ${tableNames.orders}.id AS id,
                        ${tableNames.orders}.customer_id,
                        ${tableNames.orders}.customer_gst_id,
                        ${tableNames.orders}.address_id,
                        ${tableNames.orders}.delivery_partner_id,
                        ${tableNames.orders}.status,
                        ${tableNames.orders}.created_at,
                        ${tableNames.orders}.updated_at,
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
                        JSON_OBJECT('id', customers.id, 'name', customers.name, 'number', customers.number, 'fcm_token', customers.fcm_token) AS customer,
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
                    LEFT JOIN ${tableNames.customers} ON orders.customer_id = customers.id
                    WHERE ${tableNames.orders}.id = ?;
                    `;
    var orderDetails= await fndb.customQuery(query, [data.orderId]);
    if (orderDetails && orderDetails.length > 0) {
      orderDetails = orderDetails[0]
      orderDetails.customer_gst = (orderDetails.customer_gst);
      orderDetails.customer = (orderDetails.customer);
      orderDetails.address = (orderDetails.address);
      orderDetails.delivery_partner = (orderDetails.delivery_partner);
      var orderItems= await fndb.customQuery(`SELECT order_items.id AS id, order_items.quantity, order_items.price, order_items.product_brand_prices, order_items.product_id,
          JSON_OBJECT( 'id', products.id, 'name', products.name, 'description', products.description, 'image_url',products.image_url, 'price',products.price, 'is_active',products.is_active, 'stock',products.stock, 'sub_category_id',products.sub_category_id ) AS product FROM order_items 
          LEFT JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`,[data.orderId]);
            const orderItemsWithBrands = [];
              for(let item of orderItems){
                if(item.product_brand_prices){
                  var brands = await fndb.customQuery(`
                          SELECT 
                          pbp.id,
                          pbp.product_id,
                          pbp.brand_id,
                          pbp.price,
                          pbp.stock,
                          pbp.created_at,
                          JSON_OBJECT(
                            'id', b.id,
                            'name', b.name,
                            'description', b.description,
                            'created_at', b.created_at,
                            'image_url', b.image_url
                          ) AS brand
                          FROM ${tableNames.product_brand_prices} pbp
                          LEFT JOIN ${tableNames.brands} as b ON pbp.brand_id = b.id
                    WHERE ${tableColumns.ProductBrandPriceCols.product_id} = ?`, [item.product_id]);
                  
                  // Add brand images for each brand price
                  brands = await Promise.all(brands.map(async (brandPrice) => {
                    const brandImages = await fndb.customQuery(
                      `SELECT image_url FROM ${tableNames.product_images} WHERE product_id = ? AND brand_id = ?`,
                      [item.product_id, brandPrice.brand_id]
                    );
                    return {
                      ...brandPrice,
                      image_urls: brandImages ? brandImages.map(img => img.image_url) : [],
                    };
                  }));
                  
                  brands = brands.filter(brand => brand.id == item.product_brand_prices); // Filter to the specific brand ordered
                  item.brands = brands ?? [];
              }
              orderItemsWithBrands.push(item);
             }
      orderDetails.order_items = orderItemsWithBrands;
      result = orderDetails;
    if (result) {
      if(data.pickOrder) {
        io.to(`${data.orderId}`).emit('order_details', {
          data: result,
          message: 'Order Picked successfully',
          timestamp: new Date()
        });
      } else {
        console.log('Order details retrieved successfully:', result);
        socket.emit('order_details', {
          data: result,
          message: 'Order details retrieved successfully',
          timestamp: new Date()
        });
      }
    }
  }
});

    // Handle order updates
  socket.on('update_location', async(data) => {
        console.log('Order update received:', data);
        const orderId = data.orderId;
        const updateData = {
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

  socket.on('unpick_order', async(data) => {
    console.log('Order unpicked:', data);
    const orderId = data.orderId;
    var updateData = {
      ...data,
      status: 'Dispatched',
    };
    delete updateData.orderId; // Remove orderId from updateData
    const result = await fndb.updateItem(
      tableNames.orders,
      orderId,
      updateData
    );
    if (result) {
      console.log('Order unpicked successfully:', result);
      socket.leave(`${orderId}`); // Leave the room for this order
      io.to(`${orderId}`).emit('unpicked_order', {
        orderId: orderId,
        status: 'Dispatched',
        data: updateData,
        message: 'Order has been unpicked',
        timestamp: new Date()
      });
    }
  });

  socket.on('update_order_status', async(data) => {
        console.log('Order status update received:', data);
        const orderId = data.orderId;
        const updateData = {
            ...data,
            status: data.status,
        };
        delete updateData.orderId; // Remove orderId from updateData
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
                data: updateData,
                message: 'Order status updated successfully',
                timestamp: new Date()
            });
        }
    }); 

  socket.on('cancel_order', async(data) => {
    console.log('Order cancellation request received:', data);
    if(data.status == 'Dispatched' || data.status == 'Picked' || data.status == 'Out for Delivery') {
      return socket.emit('cancel_error', {
        orderId: data.orderId,
        message: 'Order cannot be cancelled at this stage',
        timestamp: new Date()
      });
    }
    const orderId = data.orderId;
    const updateData = {
        status: 'Cancelled',
    };
    delete updateData.orderId; // Remove orderId from updateData
    const result = await fndb.updateItem(
        tableNames.orders,
        orderId,
        updateData
    );
    //re-update order items to increase stock
    var orderItems= await fndb.customQuery(`SELECT order_items.id AS id, order_items.quantity, order_items.price, order_items.product_brand_prices, order_items.product_id FROM order_items 
    WHERE order_items.order_id = ?`,[data.orderId]);
    for(let item of orderItems){
      if(item.product_brand_prices){
        await fndb.customQuery(`UPDATE ${tableNames.product_brand_prices} SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_brand_prices]);
      } else {
        await fndb.customQuery(`UPDATE ${tableNames.products} SET stock = stock + ? WHERE id = ?`, [item.quantity, item.product_id]);
      }
    }
    if(result) {
        console.log('Order cancelled successfully:', result);
        io.emit('admin_order_cancelled', {
            orderId: orderId,
            status: 'Cancelled',
            data: updateData,
            message: 'Order has been cancelled',
            timestamp: new Date()
        });
        // Emit the cancellation message to all clients in the room
        io.to(`${orderId}`).emit('order_cancelled', {
            orderId: orderId,
            status: 'Cancelled',
            data: updateData,
            message: 'Order has been cancelled',
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