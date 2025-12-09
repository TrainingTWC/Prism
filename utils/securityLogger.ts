// Security event logging utility
// Tracks authentication attempts, security events, and anomalies

interface SecurityEvent {
  event: string;
  timestamp: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents: number = 1000; // Keep last 1000 events in memory
  
  /**
   * Log a login attempt
   */
  logLoginAttempt(userId: string, success: boolean, method: 'password' | 'empid' | 'email'): void {
    this.log({
      event: 'login_attempt',
      timestamp: new Date().toISOString(),
      userId: this.maskUserId(userId),
      details: {
        success,
        method
      },
      severity: success ? 'low' : 'medium'
    });

    // If failed login, check for brute force
    if (!success) {
      this.checkBruteForce(userId);
    }
  }

  /**
   * Log a logout event
   */
  logLogout(userId: string): void {
    this.log({
      event: 'logout',
      timestamp: new Date().toISOString(),
      userId: this.maskUserId(userId),
      severity: 'low'
    });
  }

  /**
   * Log a session event
   */
  logSessionEvent(userId: string, event: 'created' | 'expired' | 'invalidated'): void {
    this.log({
      event: 'session_' + event,
      timestamp: new Date().toISOString(),
      userId: this.maskUserId(userId),
      severity: event === 'invalidated' ? 'medium' : 'low'
    });
  }

  /**
   * Log a security violation
   */
  logSecurityViolation(type: string, details: any, userId?: string): void {
    this.log({
      event: 'security_violation',
      timestamp: new Date().toISOString(),
      userId: userId ? this.maskUserId(userId) : 'anonymous',
      details: {
        type,
        ...details
      },
      severity: 'high'
    });
  }

  /**
   * Log a data access event
   */
  logDataAccess(userId: string, resource: string, action: 'read' | 'write' | 'delete'): void {
    this.log({
      event: 'data_access',
      timestamp: new Date().toISOString(),
      userId: this.maskUserId(userId),
      details: {
        resource,
        action
      },
      severity: action === 'delete' ? 'medium' : 'low'
    });
  }

  /**
   * Log a permission denial
   */
  logPermissionDenied(userId: string, attemptedAction: string, requiredRole: string): void {
    this.log({
      event: 'permission_denied',
      timestamp: new Date().toISOString(),
      userId: this.maskUserId(userId),
      details: {
        attemptedAction,
        requiredRole
      },
      severity: 'medium'
    });
  }

  /**
   * Log input validation failure
   */
  logValidationFailure(field: string, value: string, reason: string): void {
    this.log({
      event: 'validation_failure',
      timestamp: new Date().toISOString(),
      details: {
        field,
        value: this.maskSensitiveData(value),
        reason
      },
      severity: 'low'
    });
  }

  /**
   * Log API rate limit exceeded
   */
  logRateLimitExceeded(endpoint: string, userId?: string): void {
    this.log({
      event: 'rate_limit_exceeded',
      timestamp: new Date().toISOString(),
      userId: userId ? this.maskUserId(userId) : 'anonymous',
      details: {
        endpoint
      },
      severity: 'medium'
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(description: string, details: any, userId?: string): void {
    this.log({
      event: 'suspicious_activity',
      timestamp: new Date().toISOString(),
      userId: userId ? this.maskUserId(userId) : 'anonymous',
      details: {
        description,
        ...details
      },
      severity: 'high'
    });
  }

  /**
   * Generic log method
   */
  private log(event: SecurityEvent): void {
    // Add browser info if available
    if (typeof window !== 'undefined') {
      event.userAgent = navigator.userAgent;
    }

    this.events.push(event);

    // Trim events array if too large
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Console log based on severity
    const logMethod = event.severity === 'critical' || event.severity === 'high' 
      ? console.error 
      : event.severity === 'medium'
      ? console.warn
      : console.log;

    logMethod('[SECURITY]', {
      event: event.event,
      severity: event.severity,
      timestamp: event.timestamp,
      userId: event.userId,
      details: event.details
    });

    // Send to backend if available (implement this based on your backend)
    this.sendToBackend(event);
  }

  /**
   * Send event to backend for permanent storage
   */
  private sendToBackend(event: SecurityEvent): void {
    // TODO: Implement backend logging endpoint
    // Example:
    // fetch('/api/security/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(console.error);
  }

  /**
   * Check for brute force attack pattern
   */
  private checkBruteForce(userId: string): void {
    const maskedId = this.maskUserId(userId);
    const recentFailures = this.events.filter(e => 
      e.event === 'login_attempt' &&
      e.userId === maskedId &&
      e.details?.success === false &&
      new Date(e.timestamp).getTime() > Date.now() - 15 * 60 * 1000 // Last 15 minutes
    );

    if (recentFailures.length >= 5) {
      this.logSuspiciousActivity(
        'Possible brute force attack detected',
        {
          failedAttempts: recentFailures.length,
          timeWindow: '15 minutes'
        },
        userId
      );
    }
  }

  /**
   * Mask user ID for logging (partial)
   */
  private maskUserId(userId: string): string {
    if (!userId || userId.length < 3) return '***';
    return userId.substring(0, 3) + '***';
  }

  /**
   * Mask sensitive data
   */
  private maskSensitiveData(value: string): string {
    if (!value || value.length < 4) return '***';
    return value.substring(0, 2) + '***' + value.substring(value.length - 2);
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 100, severity?: SecurityEvent['severity']): SecurityEvent[] {
    let filtered = this.events;
    
    if (severity) {
      filtered = filtered.filter(e => e.severity === severity);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(e => e.event === eventType)
      .slice(-limit);
  }

  /**
   * Clear all logged events
   */
  clearLogs(): void {
    this.events = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Get summary statistics
   */
  getSummary(): any {
    const now = Date.now();
    const last24h = this.events.filter(e => 
      new Date(e.timestamp).getTime() > now - 24 * 60 * 60 * 1000
    );

    return {
      totalEvents: this.events.length,
      last24Hours: last24h.length,
      bySeverity: {
        critical: this.events.filter(e => e.severity === 'critical').length,
        high: this.events.filter(e => e.severity === 'high').length,
        medium: this.events.filter(e => e.severity === 'medium').length,
        low: this.events.filter(e => e.severity === 'low').length
      },
      byType: this.groupByType()
    };
  }

  /**
   * Group events by type
   */
  private groupByType(): Record<string, number> {
    const grouped: Record<string, number> = {};
    this.events.forEach(e => {
      grouped[e.event] = (grouped[e.event] || 0) + 1;
    });
    return grouped;
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

// Export for testing or multiple instances if needed
export { SecurityLogger };
