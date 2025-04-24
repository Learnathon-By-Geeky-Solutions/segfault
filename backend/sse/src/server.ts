import 'dotenv/config';
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

import express, { Request, Response } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import cookieParser from "cookie-parser";

/******************** Load proto files and prepare service definitions *********************/
const PROTO_PATHS = [
	path.join(__dirname, "../src/proto/hidden_test_process.proto"),
	path.join(__dirname, "../src/proto/reference_solution.proto"),
];


const loadProtos = (protoPaths: string[]) => {
	const packageDefinitions = protoPaths.map((protoPath) =>
		protoLoader.loadSync(protoPath, {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true,
		})
	);
	return packageDefinitions.map((packageDefinition) =>
		grpc.loadPackageDefinition(packageDefinition) as any
	);
};

// destructuring the service definitions
const [hiddenTestProcessProto, referenceSolution] = loadProtos(PROTO_PATHS);

const hiddenTestProcessService = hiddenTestProcessProto.hidden_test_process.HiddenTestProcess.service;
const referenceSolutionService = referenceSolution.reference_solution.ReferenceSolution.service;

/******************** Redis Connection ********************/
const redis = new Redis({
	host: process.env.REDIS_HOST,
	port: parseInt(process.env.REDIS_PORT || "6379"),
});

redis.on("connect", () => {
	console.log("Connected to Redis");
});

redis.on("error", (err) => {
	console.error(err);
});


// Keep track of connected clients
const clients: Map<string, Response> = new Map();

/****************** Implement streaming services ******************/
const streamHiddenTestProcess = async (call: any, callback: Function) => {
	console.log(`Metadata: ${JSON.stringify(call.metadata)}`);
	const clientId = call.metadata.get("client_id")[0];
	console.log(`hidden-test-consumer started streaming for client ${clientId}`);

	call.on("data", async (data: { status: string, message: string }) => {
		console.log(`Received data: ${JSON.stringify(data)}`);
		const response = clients.get(clientId);
		if (response) {
			console.log(`Sending data to client ${clientId}`);
			response.write(`data: ${JSON.stringify(data)}\n\n`);
		} else {
			console.log(`Stale client ${clientId}`);
		}
	});

	call.on("end", () => {
		console.log(`submission-consumer stopped streaming for client ${clientId}`);
		// drop the connection
		call.end();
	});
}

const streamReferenceSolution = async (call: any, callback: Function) => {
	// TODO: Implement the streaming service
}


/******************** gRPC server ********************/
const server = new grpc.Server();
// Add the service to the server
server.addService(hiddenTestProcessService, { streamHiddenTestProcess });
server.addService(referenceSolutionService, { streamReferenceSolution });
// Start the server
const address = "0.0.0.0:50051";
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
	if (error) {
		console.error(error);
		return;
	}
	console.log(`gRPC server is running on ${address}`);
});


/****************** Express Server ******************/
const app = express();
const PORT = 4000;

const allowedOrigins = [
	"http://localhost:3000",
	"https://codesirius.tech"
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
	/*
		* Authenticate the user using the access token
		* This is a helper function to authenticate the user at middleware level
	 */
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

// Default Route
app.get("/", (req: Request, res: Response) => {
	res.send("SSE Server is running...");
});

// Register Client and Return JSON
app.post("/register", async (req: Request, res: Response) => {
	const authorization = req.cookies["access"];
	if (!authorization) {
		res.status(401).json({ error: "Access Token is required" });
		return;
	}
	try {
		const response = await authenticate(authorization);
		if (!response.ok) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}
		const user = await response.json();
		const clientId = uuidv4();
		console.log(`Registering client ${clientId} for user ${user.data.id}`);
		await redis.set(clientId, user.data.id, "EX", 3600);
		res.json({ clientId });
	} catch (error) {
		console.error(error);
		res.status(401).json({ error: "Internal Server Error" });
	}
});

// SSE Streaming for a Specific Client
app.get("/events/:clientId/hidden-tests", async (req: Request, res: Response) => {
	const authorization = req.cookies["access"];
	if (!authorization) {
		res.status(401).json({ error: "Access Token is required" });
		return;
	}
	try {
		const response = await authenticate(authorization);
		if (!response.ok) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}
		const user = await response.json();
		console.log(user);
		let clientId = req.params.clientId;
		const userId = await redis.get(clientId);
		console.log(`User ID: ${userId}, Client ID: ${clientId}`);
		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}
		if (userId !== null && parseInt(userId) !== user.data.id) {
			res.status(401).json({ error: "Unauthorized" });
			// invalidate the client id otherwise it will be deleted from redis when this connection is closed
			clientId = "";
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
		res.status(401).json({ error: "Internal Server Error" });
	}
});

app.listen(PORT, () => {
	console.log(`SSE server running on http://localhost:${PORT}`);
});
