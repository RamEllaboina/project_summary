# Math Calculator API

A comprehensive RESTful API service for performing mathematical calculations with history tracking and security features.

## Features

- **Basic Operations**: Sum, Product, Difference calculations
- **History Tracking**: Maintain calculation history with timestamps
- **Security**: Input validation, rate limiting, security headers
- **Error Handling**: Comprehensive error handling and logging
- **RESTful Design**: Clean API endpoints following REST principles

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Calculations
- `POST /api/calculate/sum` - Calculate sum of two numbers
- `POST /api/calculate/product` - Calculate product of two numbers

### History Management
- `GET /api/history` - Retrieve calculation history
- `DELETE /api/history` - Clear calculation history

## Architecture

The application follows a **class-based architecture** with clear separation of concerns:

- **MathService**: Handles business logic and data management
- **APIServer**: Manages HTTP requests, middleware, and routing
- **Modular Design**: Easy to extend and maintain

## Security Features

- **Input Validation**: Type checking for all inputs
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js for security headers
- **CORS**: Cross-origin resource sharing configuration
- **Error Sanitization**: Production-safe error messages

## Technology Stack

- **Runtime**: Node.js (>=14.0.0)
- **Framework**: Express.js
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: Nodemon, Jest, ESLint

## Getting Started

```bash
npm install
npm start
```

The API will be available at `http://localhost:3000`

## Example Usage

```javascript
// Calculate sum
const response = await fetch('/api/calculate/sum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a: 5, b: 3 })
});
// Returns: { operation: 'sum', a: 5, b: 3, result: 8 }
```

## Innovation Points

1. **History Management**: Persistent calculation history with automatic cleanup
2. **Class-Based Architecture**: Modern OOP design for better maintainability  
3. **Comprehensive Security**: Multiple layers of security protection
4. **Rate Limiting**: Prevents abuse while maintaining usability
5. **Error Handling**: Graceful error handling with environment-aware messages
