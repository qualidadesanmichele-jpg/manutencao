const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://hospitalsys.onrender.com",
  "https://*.onrender.com"
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    // allow if origin is in allowedOrigins or endsWith .onrender.com
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // For production you might want to restrict more strictly
    return callback(null, true);
  },
  credentials: true
}));

// Serve frontend static files
app.use("/", express.static(path.join(__dirname, "..", "frontend")));

// In-memory users/tickets (replace with DB in production)
let users = [
  { id: '1', name: 'Samuel Waltrick', username: 'SamuelWaltrick', password: '11Dez2006', role: 'super_admin', status: 'active' },
  { id: '2', name: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', status: 'active' },
  { id: '3', name: 'João Silva', username: 'joao.silva', password: 'tecnico123', role: 'technician', status: 'active' },
  { id: '4', name: 'Maria Santos', username: 'maria.santos', password: 'enfermeira123', role: 'user', status: 'active' }
];

let tickets = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HospitalSys API Online', version: 'render-ready', timestamp: new Date().toISOString(), users: users.length, tickets: tickets.length });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
  if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, token: user.id });
});

// List tickets
app.get('/api/chamados', (req, res) => {
  const { usuarioId, tecnicoId, status } = req.query;
  let result = tickets.slice();
  if (usuarioId) result = result.filter(t => t.createdBy === usuarioId);
  if (tecnicoId) result = result.filter(t => t.assignedTo === tecnicoId);
  if (status) result = result.filter(t => t.status === status);
  result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, count: result.length, chamados: result });
});

// Create ticket
app.post('/api/chamados', (req, res) => {
  const { title, description, location, priority, cargo } = req.body;
  const usuarioId = req.headers['x-user-id'] || req.body.createdBy;
  if (!usuarioId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
  const novo = { id: uuidv4(), numero: Math.floor(1000 + Math.random()*9000).toString(), title, description, location, priority: priority||'medium', status: 'open', createdBy: usuarioId, assignedTo: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), cargo, timeline: [{date: new Date().toISOString(), user: usuarioId, action: 'created'}] };
  tickets.unshift(novo);
  io.emit('novo-chamado', { ...novo, criadorNome: users.find(u=>u.id===usuarioId)?.name || 'Usuário' });
  res.json({ success: true, message: 'Chamado criado', chamado: novo });
});

// Update ticket
app.put('/api/chamados/:id', (req, res) => {
  const id = req.params.id;
  const idx = tickets.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Chamado não encontrado' });
  const { status, notes, materials, assignedTo } = req.body;
  if (status) tickets[idx].status = status;
  if (notes) tickets[idx].notes = notes;
  if (materials) tickets[idx].materials = materials;
  if (assignedTo !== undefined) tickets[idx].assignedTo = assignedTo;
  tickets[idx].updatedAt = new Date().toISOString();
  io.emit('atualizar-chamado-lista', { chamadoId: id, status: tickets[idx].status, updatedAt: tickets[idx].updatedAt });
  res.json({ success: true, message: 'Chamado atualizado', chamado: tickets[idx] });
});

// Assign ticket
app.post('/api/chamados/:id/atribuir', (req, res) => {
  const id = req.params.id;
  const { tecnicoId } = req.body;
  const idx = tickets.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Chamado não encontrado' });
  tickets[idx].assignedTo = tecnicoId;
  tickets[idx].status = 'awaiting_acceptance';
  tickets[idx].updatedAt = new Date().toISOString();
  io.emit('atualizar-chamado-lista', { chamadoId: id, status: tickets[idx].status, tecnicoId, updatedAt: tickets[idx].updatedAt });
  res.json({ success: true, message: 'Chamado atribuído', chamado: tickets[idx] });
});

// Serve index.html for any unmatched route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // allow all for now; Render domain included above
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const usuariosConectados = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado', socket.id);

  socket.on('register', (userId) => {
    usuariosConectados.set(socket.id, userId);
    socket.userId = userId;
    console.log('👤 Usuário registrado no socket:', userId);
  });

  socket.on('join-room', (room) => { socket.join(room); });
  socket.on('leave-room', (room) => { socket.leave(room); });

  socket.on('disconnect', () => {
    console.log('🔴 Desconectado', socket.id);
    usuariosConectados.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('HospitalSys backend running on port', PORT);
});
