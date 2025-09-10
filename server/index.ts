import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cronService } from "./services/cronService";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Simple authentication middleware for console access only
  const simpleAuth = (req: any, res: any, next: any) => {
    // Skip auth for API endpoints - they need to be public for zodiacbuddy.com
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Check for basic auth or session
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Basic ')) {
      const credentials = Buffer.from(auth.slice(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      
      // Simple hardcoded login (replace with your credentials)
      if (username === 'admin' && (password === process.env.ADMIN_PASSWORD || password === 'horoscope123')) {
        return next();
      }
    }
    
    // Return basic auth challenge for console access
    res.set('WWW-Authenticate', 'Basic realm="Horoscope Console"');
    res.status(401).json({ message: 'Authentication required for console access' });
  };

  app.use(simpleAuth);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the automated horoscope cron service
    cronService.start();
  });
})();
