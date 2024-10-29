const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto"); // For generating signatures (you can replace this with your own signing logic)

const app = express();
app.use(bodyParser.json());

let publicKeys = []; // Array to store all public keys
let groups = []; // Array to store groups, which are arrays of public keys
let signedDocuments = []; // Array to store signed documents
let users = [];

// GET endpoint that returns all public keys
app.get("/public-keys", (req, res) => {
  res.json(publicKeys);
});

// POST endpoint to create a group with an array of public keys
app.post("/group", (req, res) => {
  const { publicKeys: keys } = req.body;

  if (!keys || !Array.isArray(keys)) {
    return res.status(400).json({ error: "Invalid public keys array" });
  }

  groups.push(keys); // Store the group of public keys
  res
    .status(201)
    .json({ message: "Group created", groupId: groups.length - 1 });
});

// POST endpoint to sign a document
app.post("/sign-document", (req, res) => {
  const { password, document } = req.body;

  if (!password || !document) {
    return res
      .status(400)
      .json({ error: "Password and document are required" });
  }

  const signature = signDocument(document, password);

  // For simplicity, we store the signature with the document.
  signedDocuments.push({
    document,
    signature,
    groupId: null, // Optionally store group that signed it, if needed
  });

  res.status(201).json({ message: "Document signed", signature });
});

// GET endpoint that returns documents signed by some group
app.get("/signed-documents", (req, res) => {
  // For simplicity, returning all signed documents
  res.json(signedDocuments);
});

// GET endpoint to get the signature of a document
app.get("/signature/:document", (req, res) => {
  const document = req.params.document;

  const signedDocument = signedDocuments.find(
    (doc) => doc.document === document,
  );

  if (!signedDocument) {
    return res.status(404).json({ error: "Document not found" });
  }

  res.json({ signature: signedDocument.signature });
});

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
