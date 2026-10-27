import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './src/compartido/routes/auth.routes.js';
import sucursalRoutes from './src/compartido/routes/sucursal.routes.js';
import { requireAuth } from './src/compartido/middleware/auth.js';
import { errorHandler, notFound } from './src/compartido/middleware/error.js';
import clienteRoutes from './src/suplementos/routes/cliente.routes.js';
import dashboardRoutes from './src/suplementos/routes/dashboard.routes.js';
import eventosRoutes from './src/suplementos/routes/eventos.routes.js';
import productoRoutes from './src/suplementos/routes/producto.routes.js';
import trasladoRoutes from './src/suplementos/routes/traslado.routes.js';
import ventaRoutes from './src/suplementos/routes/venta.routes.js';
import accesoRoutes from './src/infinity/routes/acceso.routes.js';
import cajaRoutes from './src/infinity/routes/caja.routes.js';
import infinityDashboardRoutes from './src/infinity/routes/dashboard.routes.js';
import empleadoRoutes from './src/infinity/routes/empleado.routes.js';
import pagoMembresiaRoutes from './src/infinity/routes/pagoMembresia.routes.js';
import planRoutes from './src/infinity/routes/plan.routes.js';
import socioRoutes from './src/infinity/routes/socio.routes.js';

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
app.use('/api/gym/planes', requireAuth, planRoutes);
app.use('/api/gym/socios', requireAuth, socioRoutes);
app.use('/api/gym/pagos', requireAuth, pagoMembresiaRoutes);
app.use('/api/gym/accesos', requireAuth, accesoRoutes);
app.use('/api/gym/cajas', requireAuth, cajaRoutes);
app.use('/api/gym/dashboard', requireAuth, infinityDashboardRoutes);
app.use('/api/empleados', requireAuth, empleadoRoutes);
app.use('/api/eventos', requireAuth, (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  next();
}, eventosRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
