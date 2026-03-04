import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import teamsRoutes from './routes/teamsRoutes';
import corporateRoutes from './routes/corporateRoutes';
import insightsRoutes from './routes/insightsRoutes';
import healthScoreRoutes from './routes/healthScoreRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());


// Increase payload size limit if needed for file uploads (CSV/JSON)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/teams', insightsRoutes);
app.use('/api/teams', healthScoreRoutes);
app.use('/api/manager/teams', teamsRoutes);
app.use('/api/corporate', corporateRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Gestor Dashboard API is running. Use /api/auth/login or /api/auth/register.' });
});

// Start Server
// Export for Vercel
export default app;

// Start Server locally
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
