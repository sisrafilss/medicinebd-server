const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Database Info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.quv1r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    console.log("database connected successfully");

    // Collections
    const database = client.db("madicinebd_DB");
    const userCollection = database.collection("users");
    const productCollection = database.collection("users");

    /* ========================= User Collection START ======================= */
    // POST - Save user info to user collection
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.json(result);
    });

    // PUT - Update user data to database for third party login system
    app.put("/users", async (req, res) => {
      const userData = req.body;
      const filter = { email: userData.email };
      const options = { upsert: true };
      const updateDoc = { $set: userData };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // GET - Admin Status.
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      let isAdmin = false;
      if (result?.role === "admin") {
        isAdmin = true;
        res.json({ admin: isAdmin });
      } else {
        res.json({ admin: isAdmin });
      }
    });
    /* ========================= User Collection END ======================= */



    /* ========================= Product Collection START ======================= */
    // POST - Add a product by - Admin
    app.post("/products", async (req, res) => {
      // Extract image data and convert it to binary base 64
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      // Extract other information and make our product object including image for saveing into MongoDB
      const { category, name, description, price } = req.body;
      const product = {
        category,
        name,
        description: description.split("\n"),
        image: imageBuffer,
      };
      const result = await productCollection.insertOne(product);
      res.json(result);
    });

    // Delete - Delete a product by user
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // GET - Get all product of a specific category
    app.get("/products", async (req, res) => {
      const category = req.params.id;
      const query = { category: category };
      const cursor = productCollection.find(query);
      if ((await cursor.count()) > 0) {
        const products = await cursor.toArray();
        res.json(products);
      } else {
        res.json({ message: "Product Not Found!" });
      }
    });

    /* ========================= Product Collection END ======================= */
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Simple Express Server is Running");
});

app.listen(port, () => {
  console.log("Server has started at port:", port);
});
