const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ysotocastro:Mnavarro3041.@cluster0.h5cyaao.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }});
// const MongoClient = require("mongodb").MongoClient;


router.use(express.urlencoded({ extended: true }));

const authRequired = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return res.status(401).json({ message: "Denied Access" });
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

const ValidateData = (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    const { id, descripcion, estado } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .send("El cuerpo de la solicitud no puede estar vacío.");
    }

    if (!id || !descripcion || !estado) {
      return res
        .status(400)
        .send(
          "Por favor valide que todos los campos (id, descripcion y estado) tengan información "
        );
    }

    if (descripcion.length < 3) {
      return res.status(400).send("La descripción no debe ser tan corta.");
    }

    if (estado !== "completado" && estado !== "pendiente") {
      return res.status(400).send("El estado debe ser completado o pendiente.");
    }
  }

  next();
};

router.use(ValidateData);

router.post("/registerUser", async (req, res) => {
  const users = req.body;
  // Manejar la respuesta de la API
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("users");
    const salt = bcrypt.genSaltSync(8);
    const passwordcrypt = bcrypt.hashSync(users.password, salt);
    users.password = passwordcrypt;
    const newDocument = await collection.insertOne(users);
    client.close();
    res.status(200).send(newDocument);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("users");
    const documents = await collection.findOne({ email: email });
    if (!documents) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, documents.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });
    client.close();
    const token = jwt.sign(
      {
        id: documents._id,
      },
      process.env.SECRET_KEY
    );
    const name = documents.firstName;
    res.json({ message: "User Authorized", token, name });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/tasks", authRequired, async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("Tasks");
    const documents = await collection.find({}).toArray();
    client.close();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/tasks/:id/", authRequired, async (req, res) => {
  const IdSeleccionado = req.params.id;
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("Tasks");
    const documents = await collection.findOne({ _id: IdSeleccionado });
    client.close();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/tasks/:status/", authRequired, async (req, res) => {
  const statusTasks = req.params.status;
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("Tasks");
    const documents = await collection.find({ State: { $eq: statusTasks } });
    if (!documents) return res.status(400).json({ message: "Tasks not found" });
    client.close();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/nueva-tarea/", authRequired, async(req, res) => {
  const nuevaTarea = req.body;
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("Tasks");
    const newDocument = await collection.insertOne(nuevaTarea);
    client.close();
    res.status(200).send(newDocument);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/eliminar-tarea/:id/", async(req, res) => {
  const IdSeleccionado = req.params.id;
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("Tasks");
    const newDocument = await collection.deleteOne({_id:{$eq: IdSeleccionado}});
    client.close();
    res.status(200).send(newDocument);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put("/actualizar-tarea/:id", async(req, res) => {
  const taskId = req.params.id;
  const dataupdatedTask = req.body;
  try {
    await client.connect();
    const db = client.db("Tasklists");
    const collection = db.collection("Tasks");
    const newDocument = await collection.updateOne({_id:{$eq: taskId}}, {$set: {
        dataupdatedTask
      }});
    client.close();
    res.status(200).send(newDocument);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
