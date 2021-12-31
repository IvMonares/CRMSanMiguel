const { GraphQLScalarType } = require("graphql");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

// Proyect files
const Vendor = require("../model/Vendor");
const Product = require("../model/Product");
const Client = require("../model/Client");
const Order = require("../model/Order");

// Function to create vendor JWTs
const createToken = (vendor, jwt_key, expiration) => {
  // Get variables and sign token
  const { id, name, last_name, email } = vendor;
  return jwt.sign({ id, name, last_name, email }, jwt_key, {
    expiresIn: expiration,
  });
};

// Date Scalar resolver
const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    return value.toISOString(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

// Function to return items to inventory
const returnToInventory = async (items) => {
  // Variables
  let products = [];

  // Get data for each product
  for await (const article of items) {
    // Update product and add to array
    const product = await Product.findById(article.id);
    product.amount += article.amount;
    products.push(product);
  }

  return { products };
};

// Function to verify availability and remove items from inventory
const removeFromInventory = async (items) => {
  // Variables
  let products = [];
  let total = 0;

  // Verify stock is available
  for await (const article of items) {
    // Get data for product
    const { id } = article;
    const product = await Product.findById(id);

    if (article.amount > product.amount) {
      throw new Error(
        `The article [${product.name}] excedes the available amount (${product.amount} units)`
      );
    } else {
      // Add article calculation to total
      total += article.amount * product.price;

      // Update product and add to array
      product.amount -= article.amount;
      products.push(product);
    }
  }

  return { products, total };
};

// Resolvers
const resolvers = {
  Date: dateScalar,
  Query: {
    // Vendors
    getVendor: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }
      // Return  user
      return ctx.vendor;
    },
    getTopVendors: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      try {
        const vendors = await Order.aggregate([
          {
            $match: { state: "COMPLETED" },
          },
          {
            $group: { _id: "$vendor", totalSold: { $sum: "$total" } },
          },
          {
            $lookup: {
              from: "vendors",
              localField: "_id",
              foreignField: "_id",
              as: "vendor",
            },
          },
          {
            $limit: 3,
          },
          {
            $sort: { totalSold: -1 },
          },
        ]);

        return vendors;
      } catch (error) {
        console.error(error);
      }
    },

    // Products
    getProducts: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get records
      try {
        const products = await Product.find({});
        return products;
      } catch (error) {
        console.error(error);
      }
    },
    getProduct: async (_, { id }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Verify product exists
      const product = await Product.findById(id);
      if (!product) {
        throw new Error("Product does not exist");
      }

      // Return product
      return product;
    },
    searchProdcut: async (_, { text }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get records
      try {
        const products = await Product.find({ $text: { $search: text } });
        return products;
      } catch (error) {
        console.error(error);
      }
    },

    // Clients
    getAllClients: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get records
      try {
        const client = await Client.find({});
        return client;
      } catch (error) {
        console.error(error);
      }
    },
    getClients: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }
      // Get records
      try {
        const client = await Client.find({
          vendor: ctx.vendor.id.toString(),
        });
        return client;
      } catch (error) {
        console.error(error);
      }
    },
    getClient: async (_, { id }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Verify Client exists
      const client = await Client.findById(id);
      if (!client) {
        throw new Error("Client does not exist");
      }

      // Restrict access to client's vendor
      if (ctx.vendor.id.toString() != client.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // Return client
      return client;
    },
    getTopClients: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get Records
      try {
        const clients = await Order.aggregate([
          {
            $match: { state: "COMPLETED" },
          },
          {
            $group: { _id: "$client", totalBought: { $sum: "$total" } },
          },
          {
            $lookup: {
              from: "clients",
              localField: "_id",
              foreignField: "_id",
              as: "client",
            },
          },
          {
            $limit: 10,
          },
          {
            $sort: { totalBought: -1 },
          },
        ]);

        return clients;
      } catch (error) {
        console.error(error);
      }
    },

    // Orders
    getAllOrders: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get records
      try {
        const order = await Order.find({});
        return order;
      } catch (error) {
        console.error(error);
      }
    },
    getOrders: async (_, {}, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }
      // Get records
      try {
        const orders = await Order.find({
          vendor: ctx.vendor.id.toString(),
        }).populate("client");
        return orders;
      } catch (error) {
        console.error(error);
      }
    },
    getStateOrders: async (_, { state }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }
      // Get records
      try {
        const order = await Order.find({
          state,
          vendor: ctx.vendor.id.toString(),
        });
        return order;
      } catch (error) {
        console.error(error);
      }
    },
    getOrder: async (_, { id }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Verify Order exists
      const order = await Order.findById(id);
      if (!order) {
        throw new Error("Order does not exist");
      }

      // Restrict access to client's vendor
      if (ctx.vendor.id.toString() != order.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // Return order
      return order;
    },
  },
  Mutation: {
    // Vendors
    addVendor: async (_, { input }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get variables
      const { email, password } = input;

      // Verify vendor does not exist
      const vendorExists = await Vendor.findOne({ email });
      if (vendorExists) {
        throw new Error("Vendor is already registered");
      }

      // Hash password
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      // Save to Database
      try {
        const vendor = new Vendor(input);
        await vendor.save();
        return vendor;
      } catch (error) {
        console.error(error);
      }
    },
    authVendor: async (_, { input }) => {
      // Get variables
      const { email, password } = input;

      // Verify vendor does exist
      const foundVendor = await Vendor.findOne({ email });
      if (!foundVendor) {
        throw new Error("Vendor does not exist");
      }

      // Verify password is correct
      const correctPassword = await bcryptjs.compare(
        password,
        foundVendor.password
      );
      if (!correctPassword) {
        throw new Error("Password is incorrect");
      }

      // Return JWT
      return {
        token: createToken(foundVendor, process.env.JWT_KEY, "24h"),
      };
    },

    // Products
    addProduct: async (_, { input }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Save to Database
      try {
        const product = new Product(input);
        await product.save();
        return product;
      } catch (error) {
        console.error(error);
      }
    },
    updateProduct: async (_, { id, input }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Verify product exists
      let product = await Product.findById(id);
      if (!product) {
        throw new Error("Product does not exist");
      }

      // Save to Database
      try {
        product = await Product.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return product;
      } catch (error) {
        console.error(error);
      }
    },
    deleteProduct: async (_, { id }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Verify product exists
      let product = await Product.findById(id);
      if (!product) {
        throw new Error("Product does not exist");
      }

      // Verify product is not being used in pending orders
      const orders = await Order.find({
        state: "PENDING",
      });
      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.id.toString() === id.toString()) {
            throw new Error("Product is being used in pending orders");
          }
        });
      });

      // Delete from Database
      try {
        product = await Product.findOneAndDelete({ _id: id });
        return "Product has been successfully deleted.";
      } catch (error) {
        console.error(error);
      }
    },

    // Clients
    addClient: async (_, { input }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get variables
      const { email } = input;

      // Verify client does not exist
      const clientExists = await Client.findOne({ email });
      if (clientExists) {
        throw new Error("Client is already registered");
      }

      // Link client to current vendor
      input.vendor = ctx.vendor.id;

      // Save to Database
      try {
        const client = new Client(input);
        await client.save();
        return client;
      } catch (error) {
        console.error(error);
      }
    },
    updateClient: async (_, { id, input }, ctx) => {
      // Ensure user is authenticated
      if (!ctx.vendor) {
        throw new Error("User is not authenticated");
      }

      // Get variables
      const { email } = input;

      // Verify Client exists
      let client = await Client.findById(id);
      if (!client) {
        throw new Error("Client does not exist");
      }

      // Restrict access to client's vendor
      if (ctx.vendor.id.toString() != client.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // If updating client's email
      if (email != client.email) {
        // Verify new email has not been registered before
        const clientExists = await Client.findOne({ email });
        if (clientExists) {
          throw new Error("New email is already in use by another client");
        }
      }

      // Save to Database
      try {
        client = await Client.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return client;
      } catch (error) {
        console.error(error);
      }
    },
    deleteClient: async (_, { id }, ctx) => {
      // Verify Client exists
      let client = await Client.findById(id);
      if (!client) {
        throw new Error("Client does not exist");
      }

      // Restrict access to client's vendor
      if (ctx.vendor.id.toString() != client.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // Get all orders for the client
      const orders = await Order.find({
        client: id.toString(),
      });

      // Array of products to update, if needed
      let productArray = [];

      //Review client's orders

      for await (const order of orders) {
        // Adjust inventory if order was pending
        if (order.state === "PENDING") {
          const { products } = await returnToInventory(order.items);
          productArray.push(...products);
        }

        // Delete Orders
        await Order.findOneAndDelete({ _id: order.id });
      }

      // Delete client from Database
      try {
        await Client.findOneAndDelete({ _id: id });

        // Adjust inventory if needed
        if (productArray.length > 0) {
          for await (const product of productArray) {
            await product.save();
          }
        }

        return "Client has been successfully deleted.";
      } catch (error) {
        console.error(error);
      }
    },

    // Orders
    addOrder: async (_, { input }, ctx) => {
      // Get variables
      const { client } = input;

      // Verify Client exists
      let foundClient = await Client.findById(client);
      if (!foundClient) {
        throw new Error("Client does not exist");
      }

      // Restrict access to client's vendor
      if (ctx.vendor.id.toString() != foundClient.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // Create an array of products to update if order is correct and calculate total
      const { products, total } = await removeFromInventory(input.items);

      // Update "total" field
      input.total = total;

      // Link order to current vendor
      input.vendor = ctx.vendor.id;

      // Save to Database
      try {
        const order = new Order(input);
        await order.save();

        // Adjust inventory
        for await (const product of products) {
          await product.save();
        }

        return order.populate("client");
      } catch (error) {
        console.error(error);
      }
    },
    updateOrder: async (_, { id, input }, ctx) => {
      // Verify Order exists
      let order = await Order.findById(id);
      if (!order) {
        throw new Error("Order does not exist");
      }

      // Restrict access to order's vendor
      if (ctx.vendor.id.toString() != order.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // Prevent change of order's client
      if (input.client && input.client.toString() != order.client.toString()) {
        throw new Error("Client cannot be modified");
      }

      // Prevent update of order's articles/amounts
      if (input.items && input.items !== order.items) {
        throw new Error("Order's items cannot be modified");
      }

      // Array of products to update, if needed
      let productArray = [];

      // If updating order's state
      if (input.state) {
        // IF cancelled order was reactivated
        if (
          order.state === "CANCELLED" &&
          (input.state === "PENDING" || input.state === "COMPLETED")
        ) {
          // Remove items from Inventory
          const { products, total } = await removeFromInventory(order.items);
          productArray = products;
          input.total = total;
        }

        // If active order was cancelled
        if (
          input.state === "CANCELLED" &&
          (order.state === "PENDING" || order.state === "COMPLETED")
        ) {
          // Return items to Inventory
          const { products } = await returnToInventory(order.items);
          productArray = products;
        }
      }

      try {
        // Save to Database
        order = await Order.findOneAndUpdate({ _id: id }, input, { new: true });

        // Adjust inventory if needed
        if (productArray.length > 0) {
          for await (const product of productArray) {
            await product.save();
          }
        }

        return order;
      } catch (error) {
        console.error(error);
      }
    },
    deleteOrder: async (_, { id }, ctx) => {
      // Verify Order exists
      let order = await Order.findById(id);
      if (!order) {
        throw new Error("Order does not exist");
      }

      // Restrict access to client's vendor
      if (ctx.vendor.id.toString() != order.vendor.toString()) {
        throw new Error("Access Denied");
      }

      // Array of products to update, if needed
      let productArray = [];

      // If order was pending, update inventory
      if (order.state === "PENDING") {
        const { products } = await returnToInventory(order.items);
        productArray = products;
      }

      // Delete from Database
      try {
        await Order.findOneAndDelete({ _id: id });

        // Adjust inventory if needed
        if (productArray.length > 0) {
          for await (const product of productArray) {
            await product.save();
          }
        }

        return "Order has been successfully deleted.";
      } catch (error) {
        console.error(error);
      }
    },
  },
};

module.exports = resolvers;
