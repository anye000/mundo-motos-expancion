import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import pinoHttp from 'pino-http'
import concesionariosRouter from './modules/concesionarios/concesionario.routes'
import crmRouter from './modules/crm/crm.routes'
import usersRouter from './modules/users/user.routes'
import expansionesRouter from './modules/expansiones/expansion.routes'
import reportesRouter from './modules/reportes/reporte.routes'
import authRouter from './modules/auth/auth.routes'

// Cargar variables de entorno
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware de seguridad
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Middleware de compresión y logging
app.use(compression())
app.use(pinoHttp())

// Parseo de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  })
})

// API routes
app.use('/api/v1/concesionarios', concesionariosRouter)
app.use('/api/v1/crm', crmRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/expansiones', expansionesRouter)
app.use('/api/v1/reportes', reportesRouter)
app.use('/api/v1/auth', authRouter)

// API raíz (placeholder informativo)
app.use('/api/v1', (_req: Request, res: Response) => {
  res.json({
    message: 'API v1 - Mundo Motos CRM',
    endpoints: {
      concesionarios: '/api/v1/concesionarios',
      ubicaciones: '/api/v1/ubicaciones',
      crm: '/api/v1/crm',
      users: '/api/v1/users',
      expansiones: '/api/v1/expansiones',
      reportes: '/api/v1/reportes',
    },
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
  })
})

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(err.statusCode || err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Mundo Motos CRM ejecutándose en puerto ${PORT}`)
  console.log(`📝 Entorno: ${NODE_ENV}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
})

export default app
