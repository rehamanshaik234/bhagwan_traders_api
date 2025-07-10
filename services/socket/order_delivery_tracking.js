const fndb = require('../../helpers/dbFunctions');
const tableNames = require('../../helpers/tableNames');
const tableColumns = require('../../helpers/tableColumns');

module.exports = (socket, io) => {
  // Handle user authentication/login
  socket.on('get_order_details', async(data) => {
    console.log('Getting order details for:', data);
    socket.orderId = data.orderId;
    socket.join(`${data.orderId}`);
    const result= await fndb.getItemById(
      tableNames.orders,data.orderId
    );
    if (result) {
      console.log('Order details:', result);
      socket.emit('order_details', {
        order: result,
        message: 'Order details retrieved successfully',
        timestamp: new Date()
      });
    }
  });

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
            console.log('Order updated successfully:', result);
            // Emit the updated order details to all clients in the room
            io.to(`${orderId}`).emit('order_details', {
                orderId: orderId,
                latitude: data.latitude,
                longitude: data.longitude,
                status: data.status,
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
            });
        }
    }); 

  
  // Handle user logout
    socket.on('disconnect', () => {
        console.log(`User disconnected from order ${socket.orderId}`);
        socket.leave(`${socket.orderId}`);
    });
};