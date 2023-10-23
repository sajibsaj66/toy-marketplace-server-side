const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ztr719a.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const kiddoZone1 = client.db("kiddoZone1");

    const toysCollection = kiddoZone1.collection("toysCollection");

    // get all toys, using query parameter also get by sub category and also react data by search query
    app.get("/toys", async (req, res) => {
      // get by category
      const subCategory = req.query.category;
      if (subCategory) {
        const result = await toysCollection
          .find({ subCategory: subCategory })
          .toArray();
        res.send(result);
        return;
      }
      // search implementation
      const searchText = req.query.search;
      if (searchText) {
        const query = {
          productName: {
            $regex: new RegExp(searchText, "i"), // 'i' indicates case-insensitive search
          },
        };

        const result = await toysCollection.find(query).toArray();
        res.send(result);
        return;
      }
      // get 20 data with out search and subcategory
      const result = await toysCollection.find().limit(20).toArray();
      res.send(result);
    });

    // get toys by use  email with and with out sorting
    app.get("/toys/:email", async (req, res) => {
      const email = req.params.email;
      // for sort
      const sortQuery = req.query.sort;
      let options;
      if (sortQuery) {
        if (sortQuery === "ascending") {
          options = {
            sort: {
              price: 1,
            },
          };
        } else {
          options = {
            sort: {
              price: -1,
            },
          };
        }
      }
      const result = await toysCollection
        .find({ email: email }, options)
        .toArray();
      res.send(result);
    });
    // get a single toy by id
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const result = await toysCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    // add a toy
    app.post("/toys", async (req, res) => {
      const updatedDoc = req.body;
      const result = await toysCollection.insertOne(updatedDoc);
      res.send(result);
    });
    // update existing toys details
    app.patch("/toys", async (req, res) => {
      const updatedToys = req.body;
      const id = updatedToys._id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          photoURL: updatedToys.photoURL,
          email: updatedToys.email,
          productName: updatedToys.productName,
          sellerName: updatedToys.sellerName,
          subCategory: updatedToys.subCategory,
          description: updatedToys.description,
          quantity: updatedToys.quantity,
          rating: updatedToys.rating,
          price: updatedToys.price,
        },
      };
      const result = await toysCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // delete a single item by id
    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const result = await toysCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Kiddo Zone server is running");
});

app.listen(port, () => {
  console.log("Kiddo Zone server run on port=", port);
});
