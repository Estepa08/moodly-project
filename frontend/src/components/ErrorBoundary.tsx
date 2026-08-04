import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorBoundaryFallback from "./ErrorBoundaryFallback";
import { reportError } from "../lib/errorReporter";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info.componentStack);
    reportError({
      message: error.message,
      stack: error.stack,
      source: "react-error-boundary",
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback />;
    }
    return this.props.children;
  }
}
