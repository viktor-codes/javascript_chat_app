import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;

const ADMIN = "Admin";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const io = new Server(expressServer, {
    cors: {
        origin:
            process.env.NODE_ENV === "production"
                ? false
                : ["http://localhost:5500", "http://127.0.0.1:5500"],
    },
});

// state
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray;
    },
};

io.on("connection", (socket) => {
    console.log(`User ${socket.id} connected`);

    // Upon connection - only to user

    socket.emit("message", "Welcome to the chat room!");

    // Upon connection - all others
    socket.broadcast.emit(
        "message",
        `User ${socket.id.substring(0, 5)} connected`
    );

    // Listen for activity
    socket.on("message", (data) => {
        console.log(data);
        io.emit("message", `${socket.id.substring(0, 5)}: ${data}`);
    });

    // When user disconnects - to all others
    socket.on("disconnect", () => {
        socket.broadcast.emit(
            "message",
            `User ${socket.id.substring(0, 5)} disconnected`
        );
    });

    // Listen for activity
    socket.on("activity", (name) => {
        socket.broadcast.emit("activity", name);
    });
});

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        }).format(new Date()),
    };
}

//User functions

function activateUser(id, name, room) {
    const user = { id, name, room };
    UsersState.setUsers([
        ...UsersState.users.filter((user) => user.id !== id),
        user,
    ]);
    return user;
}

function userLeavesApp(id) {
    UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room);
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room))); 
}