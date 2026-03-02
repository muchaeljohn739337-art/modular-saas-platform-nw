/**
 * Advancia PayLedger API - Cloudflare Workers
 * Enhanced with authentication and payment processing
 */

// Simple in-memory storage for demo (replace with database in production)
const users = new Map();
const payments = [];
let userIdCounter = 1;
let paymentIdCounter = 1;

// Helper functions
function generateToken() {
  return btoa(
    Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15),
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return (
    password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
  );
}

// Authentication middleware
function authenticateUser(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          service: "advancia-payledger-api",
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Authentication endpoints
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const body = await request.json();
        const { email, password, firstName, lastName } = body;

        // Validation
        if (!email || !password || !firstName || !lastName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "All fields are required",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        if (!validateEmail(email)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Invalid email format",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        if (!validatePassword(password)) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Password must be at least 8 characters with uppercase and numbers",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        // Check if user exists
        if (Array.from(users.values()).some((user) => user.email === email)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "User already exists",
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        // Create user
        const user = {
          id: userIdCounter++,
          email,
          firstName,
          lastName,
          createdAt: new Date().toISOString(),
        };

        users.set(user.id, user);

        // Generate token
        const token = generateToken();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              },
              token,
            },
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid request body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }
    }

    // Login endpoint
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const { email, password } = body;

        // Find user (in real app, verify password hash)
        const user = Array.from(users.values()).find((u) => u.email === email);

        if (!user) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Invalid credentials",
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        const token = generateToken();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              },
              token,
            },
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid request body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }
    }

    // Payment processing endpoint
    if (url.pathname === "/api/payments" && request.method === "POST") {
      const token = authenticateUser(request);
      if (!token) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authentication required",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      try {
        const body = await request.json();
        const { amount, currency, description, recipient } = body;

        if (!amount || !currency || !description) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Amount, currency, and description are required",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        const payment = {
          id: paymentIdCounter++,
          amount: parseFloat(amount),
          currency,
          description,
          recipient: recipient || "Self",
          status: "pending",
          createdAt: new Date().toISOString(),
          userId: 1, // Extract from token in real app
        };

        payments.push(payment);

        return new Response(
          JSON.stringify({
            success: true,
            data: payment,
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid request body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }
    }

    // Get transactions
    if (url.pathname === "/api/transactions" && request.method === "GET") {
      const token = authenticateUser(request);
      if (!token) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authentication required",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: payments,
          total: payments.length,
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // API info
    if (url.pathname === "/api") {
      return new Response(
        JSON.stringify({
          message: "Advancia PayLedger API",
          version: "1.0.0",
          endpoints: [
            "GET /health - Health check",
            "POST /api/auth/register - User registration",
            "POST /api/auth/login - User login",
            "POST /api/payments - Create payment",
            "GET /api/transactions - Get transactions",
          ],
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Default response
    return new Response(
      JSON.stringify({
        message: "Advancia PayLedger API",
        status: "running",
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  },
};
