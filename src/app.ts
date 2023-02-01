import express, {Express, Request, Response} from 'express';
import * as http from "http";
import cors from 'cors';
import {MongoClient, ObjectId, ServerApiVersion} from 'mongodb'
import {
    validate,
} from 'class-validator';
import dotenv from 'dotenv';
import {Task} from "./types";
import {authenticatedUser, authenticationMiddleware} from "./middleware";

const jwt = require('jsonwebtoken');

dotenv.config();
const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({origin: '*'}));
app.use(authenticationMiddleware)

// Database connection
const uri = process.env.URI as string;
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1});
const tasksDatabase = client.db('TasksDatabase');
const tasksCollection = tasksDatabase.collection('TasksCollection');
const usersCollection = tasksDatabase.collection('UsersCollection');

// ROUTES
app.get("/", (req: Request, res: Response) => {
    res.send("Hello World from Express");
});

const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({error: "Invalid email or password"});
    }
    const user = await usersCollection.findOne({email: email, password: password});
    if (!user) {
        return res.status(400).json({error: "User Not Found!"});
    }

    const token = jwt.sign({id: user._id, email: email}, process.env.SECRET as string, {expiresIn: 60 * 60 * 24});
    res.status(200).json({token: token});
});

router.get("/tasks", authenticatedUser, async (req: Request, res: Response) => {
    const tasks = await tasksCollection.find().toArray();
    res.status(200).json(tasks);
});

router.post("/tasks/", authenticatedUser, async (req: Request, res: Response) => {
    const {name, description} = req.body;
    const task: Task = new Task(name, description, null, new Date().toISOString());
    const errors = await validate(task);
    if (errors.length > 0) {
        res.status(400).json(errors);
        return;
    }
    await tasksCollection.insertOne(task);
    res.status(200).json(task);
});

router.get("/tasks/:id", async (req: Request, res: Response) => {
    let id: ObjectId | null = null;
    try {
        id = new ObjectId(req.params.id);
    } catch (error) {
        return res.status(400).json({error: "Invalid ID"});
    }
    const task = await tasksCollection.findOne({_id: id});
    if (task === null) {
        return res.status(400).json({error: "Task not found"});
    }
    res.status(200).json(task);
});

router.put("/tasks/:id", authenticatedUser, async (req: Request, res: Response) => {
    let id: ObjectId | null = null;
    try {
        id = new ObjectId(req.params.id);
    } catch (error) {
        return res.status(400).json({error: "Invalid ID"});
    }
    const {name, description, completedAt} = req.body;
    await tasksCollection.updateOne({_id: id}, {$set: {name, description, completedAt}});
    res.status(200).json({name, description, completedAt});
});

router.delete("/tasks/:id", async (req: Request, res: Response) => {
    let id: ObjectId | null = null;
    try {
        id = new ObjectId(req.params.id);
    } catch (error) {
        return res.status(400).json({error: "Invalid ID"});
    }
    await tasksCollection.deleteOne({_id: id});
    res.status(200).json({result: true});
});

router.delete("/tasks", async (req: Request, res: Response) => {
    await tasksCollection.deleteMany({});
    res.status(200).json({result: true});
});

// Adding Router to Express App
app.use(router);

http.createServer(app).listen(3000, () => {
    console.log("Server is running on port 3000");
});
