const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/post");
const messageRoute = require("./routes/message");
const conversationRoute = require("./routes/conversations");
const multer = require("multer");
const path = require("path");

dotenv.config();
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true }, () => {
  console.log("Connected to MondoDb");
});

app.use("/images", express.static(path.join(__dirname, "public/images")));

//middleware
app.use(express.json());
// it helped image from cors-header-problem
app.use(helmet());
app.use(morgan("common"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});
const upload = multer({ storage: storage });
app.post(
  "/api/upload",
  upload.single("file", (req, res) => {
    try {
      return res.status(200).json("File uploaded successfully");
    } catch (error) {
      return res.status(500).json("File upload error: " + error);
    }
  })
);

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);

app.get("/", (req, res) => {
  res.send("Welcome to homepage");
});

app.listen(8800, () => {
  console.log("Backend server is ready! ");
});
