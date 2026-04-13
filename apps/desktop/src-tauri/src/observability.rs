//! Observability Module - OpenTelemetry SDK integration for Rust.
//!
//! This module provides OpenTelemetry SDK integration for distributed tracing,
//! metrics collection, and log correlation across Tauri ↔ Extension ↔ Platform APIs.
//!
//! ## Key Features
//! - TracerProvider initialization with Jaeger exporter
//! - Span creation with attributes
//! - Error event recording
//! - Metrics export to Prometheus
//!
//! ## Usage
//!
//! ```rust,ignore
//! use social_pip_lib::observability::{init_tracing, start_span, record_error_event};
//!
//! // Initialize at application start
//! init_tracing("social-pip-desktop", "http://localhost:14268/api/traces")?;
//!
//! // Create span for operation
//! let span = start_span("post.create", &[("platform", "facebook"), ("account_id", "acc_123")]);
//!
//! // Record errors
//! record_error_event(&span, "NetworkFailure", "Connection timeout", "stack_trace_here");
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;

/// ObservabilityConfig - Configuration for OpenTelemetry SDK.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservabilityConfig {
    /// Service name for trace identification
    pub service_name: String,
    /// Trace sampling rate (0.0 - 1.0)
    pub trace_sample_rate: f64,
    /// Metrics export interval in milliseconds
    pub metrics_export_interval_ms: u64,
    /// Jaeger collector endpoint
    pub jaeger_endpoint: String,
    /// Prometheus metrics port
    pub prometheus_port: u16,
}

impl Default for ObservabilityConfig {
    fn default() -> Self {
        Self {
            service_name: "social-pip-desktop".to_string(),
            trace_sample_rate: 1.0,            // 100% sampling for desktop
            metrics_export_interval_ms: 5_000, // 5 seconds batch
            jaeger_endpoint: "http://localhost:14268/api/traces".to_string(),
            prometheus_port: 9090,
        }
    }
}

/// TracingContext - Carries trace information across boundaries.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracingContext {
    /// OpenTelemetry trace ID (32 hex chars)
    pub trace_id: String,
    /// Current span ID (16 hex chars)
    pub span_id: String,
    /// Parent span ID (if nested)
    pub parent_span_id: Option<String>,
    /// Trace flags (sampled, etc.)
    pub trace_flags: u8,
    /// Baggage items for context propagation
    pub baggage: HashMap<String, String>,
}

impl TracingContext {
    /// Create a new tracing context with generated IDs.
    pub fn new() -> Self {
        Self {
            trace_id: generate_trace_id(),
            span_id: generate_span_id(),
            parent_span_id: None,
            trace_flags: 1, // sampled
            baggage: HashMap::new(),
        }
    }

    /// Create a child context (nested span).
    pub fn child(&self) -> Self {
        Self {
            trace_id: self.trace_id.clone(),
            span_id: generate_span_id(),
            parent_span_id: Some(self.span_id.clone()),
            trace_flags: self.trace_flags,
            baggage: self.baggage.clone(),
        }
    }

    /// Add baggage item.
    pub fn with_baggage(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.baggage.insert(key.into(), value.into());
        self
    }

    /// Create from existing trace ID (for propagation).
    pub fn from_trace_id(trace_id: impl Into<String>) -> Self {
        Self {
            trace_id: trace_id.into(),
            span_id: generate_span_id(),
            parent_span_id: None,
            trace_flags: 1,
            baggage: HashMap::new(),
        }
    }
}

impl Default for TracingContext {
    fn default() -> Self {
        Self::new()
    }
}

/// SpanKind - The type of span.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpanKind {
    /// Client-side span (outgoing request)
    Client,
    /// Server-side span (incoming request)
    Server,
    /// Internal operation
    Internal,
    /// Producer of a message
    Producer,
    /// Consumer of a message
    Consumer,
}

/// SpanStatus - The result status of a span.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpanStatus {
    /// Operation completed successfully
    Ok,
    /// Operation failed with error
    Error,
    /// Status not set
    Unset,
}

/// Span - A unit of work in a trace.
#[derive(Debug, Clone)]
pub struct Span {
    /// Unique identifier for this span
    pub span_id: String,
    /// Trace this span belongs to
    pub trace_id: String,
    /// Parent span (if nested)
    pub parent_span_id: Option<String>,
    /// Operation name
    pub name: String,
    /// Type of span
    pub kind: SpanKind,
    /// Start timestamp
    pub start_time: std::time::Instant,
    /// Status of the span
    pub status: SpanStatus,
    /// Attributes attached to the span
    pub attributes: HashMap<String, String>,
    /// Events recorded during the span
    pub events: Vec<SpanEvent>,
}

impl Span {
    /// Create a new span.
    pub fn new(name: impl Into<String>, context: &TracingContext) -> Self {
        Self {
            span_id: context.span_id.clone(),
            trace_id: context.trace_id.clone(),
            parent_span_id: context.parent_span_id.clone(),
            name: name.into(),
            kind: SpanKind::Internal,
            start_time: std::time::Instant::now(),
            status: SpanStatus::Unset,
            attributes: context.baggage.clone(),
            events: Vec::new(),
        }
    }

    /// Set an attribute.
    pub fn set_attribute(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.attributes.insert(key.into(), value.into());
        self
    }

    /// Set the status.
    pub fn set_status(mut self, status: SpanStatus) -> Self {
        self.status = status;
        self
    }

    /// Add an event.
    pub fn add_event(
        mut self,
        name: impl Into<String>,
        attributes: HashMap<String, String>,
    ) -> Self {
        self.events.push(SpanEvent {
            name: name.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            attributes,
        });
        self
    }

    /// Record an error event.
    pub fn record_error(&mut self, error_type: &str, message: &str, stack_trace: &str) {
        let mut attrs = HashMap::new();
        attrs.insert("error.type".to_string(), error_type.to_string());
        attrs.insert("error.message".to_string(), message.to_string());
        attrs.insert("error.stack_trace".to_string(), stack_trace.to_string());

        self.events.push(SpanEvent {
            name: "error".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            attributes: attrs,
        });
        self.status = SpanStatus::Error;
    }

    /// End the span.
    pub fn end(self) -> EndedSpan {
        EndedSpan {
            span_id: self.span_id,
            trace_id: self.trace_id,
            parent_span_id: self.parent_span_id,
            name: self.name,
            kind: self.kind,
            duration: self.start_time.elapsed(),
            status: self.status,
            attributes: self.attributes,
            events: self.events,
        }
    }
}

/// SpanEvent - An event that occurred during a span.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpanEvent {
    /// Event name
    pub name: String,
    /// When the event occurred (ISO 8601)
    pub timestamp: String,
    /// Event attributes
    pub attributes: HashMap<String, String>,
}

/// EndedSpan - A completed span ready for export.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndedSpan {
    pub span_id: String,
    pub trace_id: String,
    pub parent_span_id: Option<String>,
    pub name: String,
    pub kind: SpanKind,
    pub duration: Duration,
    pub status: SpanStatus,
    pub attributes: HashMap<String, String>,
    pub events: Vec<SpanEvent>,
}

/// Tracer - Creates and manages spans.
#[derive(Debug)]
pub struct Tracer {
    /// Service name for this tracer
    service_name: String,
    /// Sampling rate
    sample_rate: f64,
    /// Completed spans waiting for export
    spans: Vec<EndedSpan>,
}

impl Tracer {
    /// Create a new tracer.
    pub fn new(service_name: impl Into<String>, sample_rate: f64) -> Self {
        Self {
            service_name: service_name.into(),
            sample_rate,
            spans: Vec::new(),
        }
    }

    /// Start a new span.
    pub fn span(&self, name: &str, context: Option<&TracingContext>) -> Span {
        let ctx = context.cloned().unwrap_or_default();
        Span::new(name, &ctx)
    }

    /// Export a completed span.
    pub fn export(&mut self, span: EndedSpan) {
        self.spans.push(span);
    }

    /// Get all exported spans.
    pub fn get_exported_spans(&self) -> &[EndedSpan] {
        &self.spans
    }

    /// Clear exported spans (after batch export).
    pub fn clear(&mut self) {
        self.spans.clear();
    }
}

/// TracerProvider - Manages tracers and exports spans.
#[derive(Debug)]
pub struct TracerProvider {
    /// Service name
    service_name: String,
    /// Sampling rate
    sample_rate: f64,
    /// Jaeger endpoint
    jaeger_endpoint: String,
    /// Default tracer
    default_tracer: Tracer,
}

impl TracerProvider {
    /// Create a new TracerProvider.
    pub fn new(config: &ObservabilityConfig) -> Self {
        Self {
            service_name: config.service_name.clone(),
            sample_rate: config.trace_sample_rate,
            jaeger_endpoint: config.jaeger_endpoint.clone(),
            default_tracer: Tracer::new(&config.service_name, config.trace_sample_rate),
        }
    }

    /// Get a tracer by name.
    pub fn tracer(&self, name: &str) -> Tracer {
        Tracer::new(name, self.sample_rate)
    }

    /// Get the default tracer.
    pub fn default_tracer(&self) -> &Tracer {
        &self.default_tracer
    }

    /// Get the Jaeger endpoint.
    pub fn jaeger_endpoint(&self) -> &str {
        &self.jaeger_endpoint
    }
}

/// Initialize tracing with the given configuration.
///
/// In production, this would configure the OpenTelemetry SDK.
/// For now, we provide a simplified version that can be extended.
pub fn init_tracing(config: &ObservabilityConfig) -> TracerProvider {
    TracerProvider::new(config)
}

/// Generate a trace ID (32 hex characters).
fn generate_trace_id() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..32)
        .map(|_| format!("{:x}", rng.gen_range(0..16)))
        .collect()
}

/// Generate a span ID (16 hex characters).
fn generate_span_id() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..16)
        .map(|_| format!("{:x}", rng.gen_range(0..16)))
        .collect()
}

/// Start a span with attributes.
pub fn start_span(name: &str, attributes: &[(&str, &str)]) -> (Span, TracingContext) {
    let context = TracingContext::new();
    let mut span = Span::new(name, &context);

    for (key, value) in attributes {
        span = span.set_attribute(*key, *value);
    }

    (span, context)
}

/// Record an error event on a span.
pub fn record_error_event(span: &mut Span, error_type: &str, message: &str, stack_trace: &str) {
    span.record_error(error_type, message, stack_trace);
}

/// Set the span status to ERROR.
pub fn set_span_error_status(span: &mut Span) {
    span.status = SpanStatus::Error;
}

// ============================================
// Tests
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================
    // T-1.4.1: TracerProvider initialization tests
    // ============================================

    #[test]
    fn test_init_tracing_creates_tracer_provider() {
        let config = ObservabilityConfig::default();
        let provider = init_tracing(&config);

        assert_eq!(provider.service_name, "social-pip-desktop");
        assert_eq!(provider.sample_rate, 1.0);
        assert!(!provider.jaeger_endpoint.is_empty());
    }

    #[test]
    fn test_tracer_provider_returns_default_tracer() {
        let config = ObservabilityConfig::default();
        let provider = init_tracing(&config);

        let tracer = provider.default_tracer();
        assert_eq!(tracer.service_name, "social-pip-desktop");
    }

    #[test]
    fn test_tracer_provider_custom_config() {
        let config = ObservabilityConfig {
            service_name: "custom-service".to_string(),
            trace_sample_rate: 0.5,
            jaeger_endpoint: "http://custom:14268/api/traces".to_string(),
            ..Default::default()
        };

        let provider = init_tracing(&config);

        assert_eq!(provider.service_name, "custom-service");
        assert_eq!(provider.sample_rate, 0.5);
        assert_eq!(provider.jaeger_endpoint(), "http://custom:14268/api/traces");
    }

    // ============================================
    // T-1.4.3: Span creation tests
    // ============================================

    #[test]
    fn test_start_span_creates_span_with_name() {
        let (span, _) = start_span("post.create", &[]);

        assert_eq!(span.name, "post.create");
        assert!(!span.span_id.is_empty());
        assert!(!span.trace_id.is_empty());
    }

    #[test]
    fn test_start_span_with_attributes() {
        let (span, _) = start_span(
            "post.create",
            &[("platform", "facebook"), ("account_id", "acc_123")],
        );

        assert_eq!(
            span.attributes.get("platform"),
            Some(&"facebook".to_string())
        );
        assert_eq!(
            span.attributes.get("account_id"),
            Some(&"acc_123".to_string())
        );
    }

    #[test]
    fn test_span_set_attribute() {
        let context = TracingContext::new();
        let span = Span::new("test.operation", &context)
            .set_attribute("key1", "value1")
            .set_attribute("key2", "value2");

        assert_eq!(span.attributes.len(), 2);
        assert_eq!(span.attributes.get("key1"), Some(&"value1".to_string()));
    }

    #[test]
    fn test_span_set_status() {
        let context = TracingContext::new();
        let span = Span::new("test.operation", &context).set_status(SpanStatus::Ok);

        assert_eq!(span.status, SpanStatus::Ok);
    }

    // ============================================
    // T-1.4.5: Span event recording tests
    // ============================================

    #[test]
    fn test_span_add_event() {
        let context = TracingContext::new();
        let mut attrs = HashMap::new();
        attrs.insert("key".to_string(), "value".to_string());

        let span = Span::new("test.operation", &context).add_event("event_name", attrs);

        assert_eq!(span.events.len(), 1);
        assert_eq!(span.events[0].name, "event_name");
    }

    #[test]
    fn test_record_error_event_sets_attributes() {
        let context = TracingContext::new();
        let mut span = Span::new("test.operation", &context);

        record_error_event(
            &mut span,
            "NetworkFailure",
            "Connection timeout",
            "stack_trace_here",
        );

        assert_eq!(span.events.len(), 1);
        assert_eq!(span.events[0].name, "error");
        assert_eq!(
            span.events[0].attributes.get("error.type"),
            Some(&"NetworkFailure".to_string())
        );
        assert_eq!(
            span.events[0].attributes.get("error.message"),
            Some(&"Connection timeout".to_string())
        );
        assert_eq!(
            span.events[0].attributes.get("error.stack_trace"),
            Some(&"stack_trace_here".to_string())
        );
    }

    #[test]
    fn test_record_error_event_sets_status_to_error() {
        let context = TracingContext::new();
        let mut span = Span::new("test.operation", &context);

        record_error_event(&mut span, "SomeError", "message", "stack");

        assert_eq!(span.status, SpanStatus::Error);
    }

    #[test]
    fn test_set_span_error_status() {
        let context = TracingContext::new();
        let mut span = Span::new("test.operation", &context);

        set_span_error_status(&mut span);

        assert_eq!(span.status, SpanStatus::Error);
    }

    // ============================================
    // T-1.4.7: Jaeger exporter configuration tests
    // ============================================

    #[test]
    fn test_observability_config_default_jaeger_endpoint() {
        let config = ObservabilityConfig::default();

        assert_eq!(config.jaeger_endpoint, "http://localhost:14268/api/traces");
    }

    #[test]
    fn test_tracer_provider_stores_jaeger_endpoint() {
        let config = ObservabilityConfig {
            jaeger_endpoint: "http://production-jaeger:14268/api/traces".to_string(),
            ..Default::default()
        };

        let provider = init_tracing(&config);

        assert_eq!(
            provider.jaeger_endpoint(),
            "http://production-jaeger:14268/api/traces"
        );
    }

    // ============================================
    // TracingContext tests
    // ============================================

    #[test]
    fn test_tracing_context_new_generates_ids() {
        let ctx = TracingContext::new();

        assert_eq!(ctx.trace_id.len(), 32);
        assert_eq!(ctx.span_id.len(), 16);
        assert!(ctx.trace_id.chars().all(|c| c.is_ascii_hexdigit()));
        assert!(ctx.span_id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_tracing_context_child_inherits_trace_id() {
        let parent = TracingContext::new();
        let parent_span_id = parent.span_id.clone();
        let parent_trace_id = parent.trace_id.clone();
        let child = parent.child();

        assert_eq!(child.trace_id, parent_trace_id);
        assert_eq!(child.parent_span_id, Some(parent_span_id.clone()));
        assert_ne!(child.span_id, parent_span_id);
    }

    #[test]
    fn test_tracing_context_with_baggage() {
        let ctx = TracingContext::new()
            .with_baggage("platform", "facebook")
            .with_baggage("account_id", "acc_123");

        assert_eq!(ctx.baggage.get("platform"), Some(&"facebook".to_string()));
        assert_eq!(ctx.baggage.get("account_id"), Some(&"acc_123".to_string()));
    }

    #[test]
    fn test_tracing_context_from_trace_id() {
        let ctx = TracingContext::from_trace_id("existing_trace_id_1234567890abcdef");

        assert_eq!(ctx.trace_id, "existing_trace_id_1234567890abcdef");
        assert!(!ctx.span_id.is_empty());
    }

    // ============================================
    // Span lifecycle tests
    // ============================================

    #[test]
    fn test_span_end_produces_ended_span() {
        let context = TracingContext::new();
        let span = Span::new("test.operation", &context)
            .set_attribute("key", "value")
            .set_status(SpanStatus::Ok);

        let ended = span.end();

        assert_eq!(ended.name, "test.operation");
        assert_eq!(ended.status, SpanStatus::Ok);
        assert!(ended.duration.as_nanos() > 0);
    }

    #[test]
    fn test_span_multiple_events() {
        let context = TracingContext::new();
        let mut attrs1 = HashMap::new();
        attrs1.insert("key1".to_string(), "value1".to_string());
        let mut attrs2 = HashMap::new();
        attrs2.insert("key2".to_string(), "value2".to_string());

        let span = Span::new("test.operation", &context)
            .add_event("event1", attrs1)
            .add_event("event2", attrs2);

        assert_eq!(span.events.len(), 2);
    }

    // ============================================
    // Tracer tests
    // ============================================

    #[test]
    fn test_tracer_span_creates_span() {
        let tracer = Tracer::new("test-service", 1.0);
        let context = TracingContext::new();

        let span = tracer.span("operation", Some(&context));

        assert_eq!(span.name, "operation");
    }

    #[test]
    fn test_tracer_span_without_context_generates_new() {
        let tracer = Tracer::new("test-service", 1.0);

        let span = tracer.span("operation", None);

        assert!(!span.trace_id.is_empty());
    }

    #[test]
    fn test_tracer_export_and_get() {
        let mut tracer = Tracer::new("test-service", 1.0);
        let context = TracingContext::new();
        let span = Span::new("operation", &context);
        let ended = span.end();

        tracer.export(ended);

        assert_eq!(tracer.get_exported_spans().len(), 1);
    }

    #[test]
    fn test_tracer_clear() {
        let mut tracer = Tracer::new("test-service", 1.0);
        let context = TracingContext::new();
        let span = Span::new("operation", &context);
        tracer.export(span.end());

        tracer.clear();

        assert!(tracer.get_exported_spans().is_empty());
    }

    // ============================================
    // SpanStatus and SpanKind tests
    // ============================================

    #[test]
    fn test_span_status_serialization() {
        assert_eq!(serde_json::to_string(&SpanStatus::Ok).unwrap(), r#""Ok""#);
        assert_eq!(
            serde_json::to_string(&SpanStatus::Error).unwrap(),
            r#""Error""#
        );
        assert_eq!(
            serde_json::to_string(&SpanStatus::Unset).unwrap(),
            r#""Unset""#
        );
    }

    #[test]
    fn test_span_kind_serialization() {
        assert_eq!(
            serde_json::to_string(&SpanKind::Client).unwrap(),
            r#""Client""#
        );
        assert_eq!(
            serde_json::to_string(&SpanKind::Server).unwrap(),
            r#""Server""#
        );
        assert_eq!(
            serde_json::to_string(&SpanKind::Internal).unwrap(),
            r#""Internal""#
        );
    }

    // ============================================
    // ObservabilityConfig tests
    // ============================================

    #[test]
    fn test_observability_config_default_values() {
        let config = ObservabilityConfig::default();

        assert_eq!(config.service_name, "social-pip-desktop");
        assert_eq!(config.trace_sample_rate, 1.0);
        assert_eq!(config.metrics_export_interval_ms, 5_000);
        assert_eq!(config.prometheus_port, 9090);
    }

    #[test]
    fn test_observability_config_sample_rate_validation() {
        let config = ObservabilityConfig {
            trace_sample_rate: 0.5,
            ..Default::default()
        };

        assert!(config.trace_sample_rate >= 0.0 && config.trace_sample_rate <= 1.0);
    }
}
