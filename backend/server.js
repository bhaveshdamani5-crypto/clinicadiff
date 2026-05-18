require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const adherenceRoutes = require('./routes/adherenceRoutes');
const copilotRoutes = require('./routes/copilotRoutes');
const caseRoutes = require('./routes/caseRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const aiRoutes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Make io accessible in routes
app.set('io', io);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket.io connections
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join_doctor', (doctorId) => {
        socket.join(`doctor_${doctorId}`);
        console.log(`👨‍⚕️ Doctor ${doctorId} joined room`);
    });

    socket.on('join_patient', (patientId) => {
        socket.join(`patient_${patientId}`);
        console.log(`🤒 Patient ${patientId} joined room`);
    });

    socket.on('join_case', (caseId) => {
        socket.join(`case_${caseId}`);
        console.log(`📋 Joined case room ${caseId}`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/adherence', adherenceRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Clinica-Diff Backend API is running...');
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready`);
});
