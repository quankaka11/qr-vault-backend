# QR Vault Backend Server

This is the Node.js + Express backend server for the QR Vault application. It provides REST APIs for authentication, QR item management, and image storage.

## Features

- 🔐 User authentication (register, login, logout)
- 🖼️ Image upload and storage
- 📝 QR item CRUD operations
- 🌐 LAN accessibility (binds to 0.0.0.0)
- 💾 File-based data storage (JSON)

## Setup

1. Install dependencies:
```bash
cd project/server
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will start on port 3000 (or the port specified in PORT environment variable).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### QR Items

- `GET /api/qr-items` - Get all QR items (user's + public)
- `GET /api/qr-items/public` - Get public QR items only
- `POST /api/qr-items` - Create new QR item (with image upload)
- `PUT /api/qr-items/:id` - Update QR item
- `DELETE /api/qr-items/:id` - Delete QR item

### Images

- `POST /api/upload` - Upload image
- `GET /uploads/:filename` - Serve uploaded images

### Health

- `GET /api/health` - Health check

## LAN Access

The server binds to `0.0.0.0` so it can be accessed from other devices on your local network.

When you start the server, it will display:
- Local URL: `http://localhost:3000`
- Network URL: `http://<your-local-ip>:3000`

Share the Network URL with other devices on your LAN to access the application.

## Data Storage

Data is stored in JSON files:
- `data/users.json` - User accounts
- `data/qr_items.json` - QR items
- `data/sessions.json` - Active sessions
- `uploads/` - Uploaded images

## Environment Variables

- `PORT` - Server port (default: 3000)

## Security Note

This server is designed for local network use only. For production deployment, additional security measures should be implemented:
- HTTPS
- Environment-based configuration
- Rate limiting
- Input validation and sanitization
- File upload validation
- Session management improvements
