import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './src/routes/auth.routes.js';
import clienteRoutes from './src/routes/cliente.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import eventosRoutes from './src/routes/eventos.routes.js';
import productoRoutes from './src/routes/producto.routes.js';
import sucursalRoutes from './src/routes/sucursal.routes.js';
import trasladoRoutes from './src/routes/traslado.routes.js';
import ventaRoutes from './src/routes/venta.routes.js';
import { requireAuth } from './src/middleware/auth.js';
import { errorHandler, notFound } from './src/middleware/error.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/sucursales', requireAuth, sucursalRoutes);
app.use('/api/productos', requireAuth, productoRoutes);
app.use('/api/ventas', requireAuth, ventaRoutes);
app.use('/api/traslados', requireAuth, trasladoRoutes);
app.use('/api/clientes', requireAuth, clienteRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/eventos', requireAuth, (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  next();
}, eventosRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
