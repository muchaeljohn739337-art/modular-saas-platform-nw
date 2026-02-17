// Simple Registration Page for Advancia PayLedger - Updated
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organization: "",
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!formData.agreeToTerms)
      errors.agreeToTerms = "You must agree to terms and conditions";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock registration for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful registration
      localStorage.setItem("accessToken", "mock-access-token-" + Date.now());
      localStorage.setItem("refreshToken", "mock-refresh-token-" + Date.now());

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: "",
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <span
              style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}
            >
              $
            </span>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "8px",
            }}
          >
            Create Your Account
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Join Advancia PayLedger - Healthcare payment management
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: validationErrors.firstName
                    ? "1px solid #ef4444"
                    : "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              {validationErrors.firstName && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {validationErrors.firstName}
                </p>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: validationErrors.lastName
                    ? "1px solid #ef4444"
                    : "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              {validationErrors.lastName && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: validationErrors.email
                  ? "1px solid #ef4444"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.email && (
              <p
                style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Phone number (optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Organization (optional)
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="Healthcare organization name"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: validationErrors.password
                  ? "1px solid #ef4444"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.password && (
              <p
                style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              style={{
                width: "100%",
                padding: "12px",
                border: validationErrors.confirmPassword
                  ? "1px solid #ef4444"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.confirmPassword && (
              <p
                style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}
              >
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              style={{ width: "16px", height: "16px" }}
            />
            <label style={{ fontSize: "14px", color: "#6b7280" }}>
              I agree to{" "}
              <a
                href="/terms"
                style={{ color: "#3b82f6", textDecoration: "none" }}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                style={{ color: "#3b82f6", textDecoration: "none" }}
              >
                Privacy Policy
              </a>
            </label>
          </div>
          {validationErrors.agreeToTerms && (
            <p style={{ color: "#ef4444", fontSize: "12px" }}>
              {validationErrors.agreeToTerms}
            </p>
          )}

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Already have an account?{" "}
            <a
              href="/login"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
