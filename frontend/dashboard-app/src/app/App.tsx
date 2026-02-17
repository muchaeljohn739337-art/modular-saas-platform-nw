import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          {/* Router will render the appropriate layout and page */}
        </div>
      </RouterProvider>
    </QueryClientProvider>
  );
}

export default App;
