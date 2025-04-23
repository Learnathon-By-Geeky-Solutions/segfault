import 'dotenv/config';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

import express, {Request, Response} from "express";
import cors from "cors";
import {v4 as uuidv4} from "uuid";
import Redis from "ioredis";
import cookieParser from "cookie-parser";

const PROTO_PATH = path.join(__dirname, "../src/proto/hidden_test_process.proto");


// load the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const hiddenTestProcessProto: any =
    grpc.loadPackageDefinition(packageDefinition).hidden_test_process;

/**
 * Implement the streamHiddenTestProcess
 */
const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
});

const clients: Map<string, Response> = new Map();

const streamHiddenTestProcess = async (call: any, callback: Function) => {
    console.log(`Metadata: ${JSON.stringify(call.metadata)}`);
    const clientId = call.metadata.get("client_id")[0];
    console.log(`submission-consumer started streaming for client ${clientId}`);

    call.on("data", async (data: {status: string, message: string }) => {
        console.log(`Received data: ${JSON.stringify(data)}`);
        const response = clients.get(clientId);
        if (response) {
            console.log(`Sending data to client ${clientId}`);
            response.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    });

    call.on("end", () => {
        console.log(`submission-consumer stopped streaming for client ${clientId}`);
        // drop the connection
        call.end();
    });
}

// Create a gRPC server
const server = new grpc.Server();
server.addService(hiddenTestProcessProto.HiddenTestProcess.service, {streamHiddenTestProcess});
const address = "0.0.0.0:50051";
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
        console.error(error);
        return;
    }
    console.log(`gRPC server is running on ${address}`);
});


redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (err) => {
    console.error(err);
});

const app = express();
const PORT = 4000;

const allowedOrigins = [
    "http://localhost:3000",
];

app.use(cors({
    origin: (origin: string | undefined, callback: Function) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(express.json());


const authenticate = async (authorization: string) => {
    try {
        const authResponse = await fetch(`${process.env.DJANGO_BACKEND_URL}/api/v1/auth/whoami`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authorization}`,
            }
        });
        return authResponse;
    } catch (error) {
        throw error;
    }
}


app.get("/", (req: Request, res: Response) => {
    res.send("SSE Server is running...");
});

// Register Client and Return JSON
app.post("/register", async (req: Request, res: Response) => {
    const authorization = req.cookies["access"];
    if (!authorization) {
        res.status(401).json({error: "Access Token is required"});
        return;
    }
    try {
        const response = await authenticate(authorization);
        if (!response.ok) {
            res.status(401).json({error: "Unauthorized"});
            return;
        }
        const user = await response.json();
        const clientId = uuidv4();
        console.log(`Registering client ${clientId} for user ${user.data.id}`);
        await redis.set(clientId, user.data.id, "EX", 3600);
        res.json({clientId});
    } catch (error) {
        console.error(error);
        res.status(401).json({error: "Internal Server Error"});
    }
});

// SSE Streaming for a Specific Client
app.get("/events/:clientId/hidden-tests", async (req: Request, res: Response) => {
    const authorization = req.cookies["access"];
    if (!authorization) {
        res.status(401).json({error: "Access Token is required"});
        return;
    }
    try {
        const response = await authenticate(authorization);
        if (!response.ok) {
            res.status(401).json({error: "Unauthorized"});
            return;
        }
        const user = await response.json();
        console.log(user);
        const clientId = req.params.clientId;
        const userId = await redis.get(clientId);
        console.log(`User ID: ${userId}, Client ID: ${clientId}`);
        if (!userId) {
            res.status(401).json({error: "Unauthorized"});
            return;
        }
        if (userId !== null && parseInt(userId) !== user.data.id) {
            res.status(401).json({error: "Unauthorized"});
            return;
        }
        console.log(`Client ${clientId} connected`);

        clients.set(clientId, res);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        req.on("close", async () => {
            if (clients.has(clientId)) {
                clients.delete(clientId);
            }
            console.log(`Client ${clientId} disconnected`);
        });

    } catch (error) {
        console.error(error);
        res.status(401).json({error: "Internal Server Error"});
    }
});

app.listen(PORT, () => {
    console.log(`SSE server running on http://localhost:${PORT}`);
});
