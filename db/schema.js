const { gql } = require("apollo-server");

// Schema
const typeDefs = gql`
  # Scalars
  scalar Date

  # Data constants
  enum OrderState {
    PENDING
    COMPLETED
    CANCELLED
  }

  # Data types

  type Token {
    token: String
  }

  type Vendor {
    id: ID
    name: String
    last_name: String
    email: String
    creation: Date
  }

  type Product {
    id: ID
    name: String
    amount: Int
    price: Float
    creation: Date
  }

  type Client {
    id: ID
    name: String
    last_name: String
    company: String
    address: String
    email: String
    phone: String
    vendor: ID
    creation: Date
  }

  type ProductOrder {
    id: ID
    amount: Int
  }

  type Order {
    id: ID
    items: [ProductOrder]
    total: Float
    client: Client
    vendor: ID
    state: OrderState
    deadline: Date
    creation: Date
  }

  type TopClient {
    totalBought: Float
    client: [Client]
  }

  type TopVendor {
    totalSold: Float
    vendor: [Vendor]
  }

  # Inputs
  input VendorInput {
    name: String!
    last_name: String!
    email: String!
    password: String!
  }

  input AuthInput {
    email: String!
    password: String!
  }

  input ProductInput {
    name: String!
    amount: Int!
    price: Float!
  }

  input ClientInput {
    name: String!
    last_name: String!
    company: String!
    address: String!
    email: String!
    phone: String
  }

  input ProductOrderInput {
    id: ID!
    amount: Int!
  }

  input OrderInput {
    items: [ProductOrderInput]
    client: ID
    state: OrderState
    deadline: String
  }

  # Functions
  type Query {
    # Vendors
    getVendor: Vendor
    getTopVendors: [TopVendor]

    # Products
    getProducts: [Product]
    getProduct(id: ID!): Product
    searchProdcut(text: String!): [Product]

    # Clients
    getAllClients: [Client]
    getClients: [Client]
    getClient(id: ID!): Client
    getTopClients: [TopClient]

    # Orders
    getAllOrders: [Order]
    getOrders: [Order]
    getStateOrders(state: OrderState): [Order]
    getOrder(id: ID!): Order
  }

  type Mutation {
    # Vendors
    addVendor(input: VendorInput): Vendor
    authVendor(input: AuthInput): Token

    # Products
    addProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): String

    # Client
    addClient(input: ClientInput): Client
    updateClient(id: ID!, input: ClientInput): Client
    deleteClient(id: ID!): String

    # Order
    addOrder(input: OrderInput): Order
    updateOrder(id: ID!, input: OrderInput): Order
    deleteOrder(id: ID!): String
  }
`;

module.exports = typeDefs;
