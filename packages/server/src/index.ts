import express from 'express';
import cors from 'cors';
import { API_ROUTES, type ApiResponse, type HealthStatus } from '@test-project/iso';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get(API_ROUTES.health, (_req, res) => {
  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
