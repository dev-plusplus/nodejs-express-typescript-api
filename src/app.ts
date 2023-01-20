import express, {Express, Request, Response} from 'express';
import * as http from "http";
import cors from 'cors';
import {MongoClient, ObjectId, ServerApiVersion} from 'mongodb'
import {
    validate,
    Length,
    IsString
} from 'class-validator';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({origin: '*'}));

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World from Express");
});

class Task {
    id?: number;

    @IsString()
    @Length(5, 50)
    name: string;

    @IsString()
    @Length(10, 500)
    description: string;
    completedAt: string | null;
    createdAt: string | null;

    constructor(name: string, description: string, completedAt: string | null, createdAt: string | null) {
        this.id = undefined;
        this.name = name;
        this.description = description;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
    }
}

// Database connection
const uri = "";
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1});
const tasksDatabase = client.db('TasksDatabase');
const tasksCollection = tasksDatabase.collection('TasksCollection');
const tasks: Task[] = [];

// ROUTES
const router = express.Router();

router.get("/tasks", async (req: Request, res: Response) => {
    const tasks = await tasksCollection.find().toArray();
    res.status(200).json(tasks);
});

router.post("/tasks/", async (req: Request, res: Response) => {
    const {name, description} = req.body;
    const task: Task = new Task(name, description, null, new Date().toISOString());
    const errors = await validate(task);
    if(errors.length > 0) {
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

router.put("/tasks/:id", async (req: Request, res: Response) => {
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
