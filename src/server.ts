import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/user.route'


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: [
    "*"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

//ROUTES
app.use('/api/users',userRoutes)

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
