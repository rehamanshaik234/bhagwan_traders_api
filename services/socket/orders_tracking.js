const tableNames = require("../../helpers/tableNames");
const fndb = require("../../helpers/dbFunctions");
const tableColumns = require("../../helpers/tableColumns");

module.exports=(socket, io)=>{
  // Handle user authentication/login
  socket.on('create_order', async(data) => {
    console.log('Creating order for:', data);
    const result= await fndb.addNewItem(tableNames.orders, data);
    if (result && result > 0 ) {
       io.emit('new_order', {
        order: result,
        message: 'Order created successfully',
        timestamp: new Date()
      });
    }
  });

};