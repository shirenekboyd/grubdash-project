const path = require("path");
//const { runInNewContext } = require("vm");
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// do not change
function list(req, res, next) {
  res.json({ data: dishes });
}
// end of do not change

// middleware for create
function isValidDish(req, res, next) {
  const { data } = req.body;
  if (!data) {
    return next({
      status: 400,
      message: "Body must have `data` key",
    });
  }
  const requiredFields = ["name", "description", "image_url", "price"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }
  if (typeof data.price !== "number" || data.price < 1) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}
// end middleware for create

function create(req, res, next) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// BodyIdDoesNotMatchDishIdInRoute
function hasValidId(req, res, next) {
  const { data: { id } = {} } = req.body;

  const dishId = req.params.dishId;
  if (id && dishId != id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function dishIdExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish id not found: ${req.params.dishId}`,
    });
  }
  res.locals.dish = foundDish;
  next();
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const dish = res.locals.dish;
  //console.log(dish);
  const { data: { name, price, description, image_url } = {} } = req.body;
  dish.name = name;
  dish.price = price;
  dish.description = description;
  dish.image_url = image_url;
  res.json({ data: dish });
}

module.exports = {
  list,
  create: [isValidDish, create],
  read: [dishIdExists, read],
  update: [dishIdExists, hasValidId, isValidDish, update],
};
