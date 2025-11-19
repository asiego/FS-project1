// node modules
const path = require('path');
const fs = require('fs');

// express setup
const express = require('express');
const app = express();

// set up port
const PORT = process.env.PORT || 3000;

// data file
const DATA = path.join(__dirname, 'leads.json');

// middleware config
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// request logging (helps debugging)
app.use((req, res, next) => {
  console.log("[REQ]", req.method, req.url, "query:", req.query, "body:", req.body);
  next();
});

// data helper functions
function readLeads() {
  if (!fs.existsSync(DATA)) return [];
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}

function writeLeads(leads) {
  fs.writeFileSync(DATA, JSON.stringify(leads, null, 2));
}

// api routes
app.get("/api/leads", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const status = (req.query.status || "").toLowerCase();

  let list = readLeads();

  if (q) {
    list = list.filter(l => {
      const hay = ((l.name || "") + " " + (l.company || "")).toLowerCase();
      return hay.includes(q);
    });
  }

  if (status) {
    list = list.filter(l => (l.status || "").toLowerCase() === status);
  }

  res.json(list);
});

app.delete("/api/leads", (req, res) => {
    writeLeads([]);
    res.json({ message: "All leads cleared" });
  });
  

// [C]reate 
app.post("/api/leads", (req, res) => {
  const { name, email, company, source, notes } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });
  const leads = readLeads();
  const lead = {
    id: Date.now().toString(),
    name,
    email,
    company: company || "",
    source: source || "",
    notes: notes || "",
    status: "New",
    createdAt: new Date().toISOString()
  };
  leads.push(lead);
  writeLeads(leads);
  res.status(201).json(lead);
});

// [U]pdate 
app.patch("/api/leads/:id", (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found." });
  const allowed = ["status", "notes"];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      leads[idx][k] = req.body[k];
    }
  }
  writeLeads(leads);
  res.json(leads[idx]);
});

// root route
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// start server
const ENV = process.env.NODE_ENV || "development";
app.listen(PORT, () => {
  console.log(`Server listening on https://fs-project1.onrender.com (env: ${ENV})`);
});
