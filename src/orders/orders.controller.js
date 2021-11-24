const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderIdExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order id not found: ${req.params.orderId}`,
    });
  }
  res.locals.order = foundOrder;
  next();
}

function isValidOrder(req, res, next) {
  const { data } = req.body;
  if (!data) {
    return next({
      status: 400,
      message: "Body must have `data` key",
    });
  }
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }
  next();
}

function dishHasQuantity(req, res, next){
    const { data } = req.body;
    data.dishes.forEach((dish, index) => {
        if (typeof dish.quantity !== "number" || dish.quantity < 1) {
          return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          });
        }
      });
      next();
}

function hasValidId(req, res, next) {
  const { data: { id } = {} } = req.body;

  const orderId = req.params.orderId;
  if (id && orderId != id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

// do not change
function list(req, res, next) {
  res.json({ data: orders });
}
// end of do not change

function create (req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function delivered(req, res, next) {
  const status = res.locals.order.status;
  //console.log(status)
  const orderStatus = req.body.data.status 
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  } else if (!orderStatus || !["pending", "preparing","out-for-delivery"].includes(orderStatus)) {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

function validateDishes (req, res, next){
    const { data: { dishes } } = req.body
    if(dishes.length > 0 && Array.isArray(dishes)) {
        return next();
    }
    next({
        status: 400,
        message: "Order must include at least one dish",
    })
}


function update(req, res, next) {
  const order = res.locals.order;
  //console.log(order)
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}

function pending(req, res, next) {
  const status = res.locals.order.status;
  if (status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function destroy(req, res, next) {
  const orderId = res.locals.order.id;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [isValidOrder, validateDishes, dishHasQuantity, create],
  read: [orderIdExists, read],
  update: [orderIdExists, isValidOrder, delivered, validateDishes, dishHasQuantity, hasValidId, update],
  destroy: [orderIdExists, pending, destroy],
};
