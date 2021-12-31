const { ApolloServer } = require("apollo-server");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

// Proyect files
const connectDB = require("./config/db");

// Connect to DB
connectDB();

// Create server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers["authorization"] || "";
    if (token) {
      try {
        const vendor = await jwt.verify(
          token.replace("Bearer ", ""),
          process.env.JWT_KEY
        );
        return { vendor };
      } catch (error) {
        console.error(error);
      }
    }
  },
});

// Start server
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server running in url: ${url}`);
});
