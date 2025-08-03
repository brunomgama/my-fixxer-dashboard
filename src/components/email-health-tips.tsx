"use client"

import { AlertTriangle, CheckCircle, Info, Lightbulb, Shield, XCircle } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailStatusApi, HealthStatus, EMAIL_HEALTH_THRESHOLDS } from "@/lib/api/email-status"
import { useEnvironment } from "@/lib/context/environment"

interface EmailHealthTipsProps {
  bounceRate: number
  complaintRate: number
}

export function EmailHealthTips({ bounceRate, complaintRate }: EmailHealthTipsProps) {
  const { env } = useEnvironment()
  const api = new EmailStatusApi(env)
  
  const bounceHealth = api.getHealthStatus(bounceRate, 'bounce')
  const complaintHealth = api.getHealthStatus(complaintRate, 'complaint')
  const overallHealth = api.getOverallHealthStatus(bounceRate, complaintRate)

  const getBounceAdvice = (status: HealthStatus) => {
    switch (status) {
      case 'danger':
        return {
          title: "Critical: High Bounce Rate",
          description: "Your bounce rate is at dangerous levels (≥10%)",
          tips: [
            "Immediately review and clean your email list",
            "Implement double opt-in for new subscribers",
            "Remove invalid email addresses from your database",
            "Check for typos in email addresses",
            "Verify your sending domain's reputation"
          ]
        }
      case 'warning':
        return {
          title: "Warning: Elevated Bounce Rate",
          description: "Your bounce rate is approaching concerning levels (≥5%)",
          tips: [
            "Review your email list quality",
            "Consider implementing email validation",
            "Monitor for spam traps in your list",
            "Update your data collection practices"
          ]
        }
      default:
        return null
    }
  }

  const getComplaintAdvice = (status: HealthStatus) => {
    switch (status) {
      case 'danger':
        return {
          title: "Critical: High Complaint Rate",
          description: "Your complaint rate is at dangerous levels (≥0.5%)",
          tips: [
            "Immediately review your email content and frequency",
            "Ensure clear unsubscribe options are prominent",
            "Review your subscriber consent and preferences",
            "Consider reducing send frequency temporarily",
            "Audit your email content for spam triggers"
          ]
        }
      case 'warning':
        return {
          title: "Warning: Elevated Complaint Rate",
          description: "Your complaint rate is approaching concerning levels (≥0.1%)",
          tips: [
            "Review email content relevance and quality",
            "Make unsubscribe options more visible",
            "Consider preference center implementation",
            "Monitor sending frequency and timing"
          ]
        }
      default:
        return null
    }
  }

  const getGeneralTips = () => [
    "Maintain list hygiene by regularly removing inactive subscribers",
    "Use double opt-in to ensure subscriber consent",
    "Segment your audience for more targeted messaging",
    "Monitor your sender reputation regularly",
    "Test emails before sending to large lists",
    "Authenticate your domain with SPF, DKIM, and DMARC"
  ]

  const bounceAdvice = getBounceAdvice(bounceHealth)
  const complaintAdvice = getComplaintAdvice(complaintHealth)

  const getHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'danger': return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getAlertVariant = (status: HealthStatus): "default" | "destructive" => {
    return status === 'danger' ? 'destructive' : 'default'
  }

  return (
    <div className="space-y-6">
      {/* Threshold Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Email Health Thresholds
          </CardTitle>
          <CardDescription>
            Understanding when your email metrics require attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Bounce Rate Thresholds</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Healthy:</span>
                  <span>&lt; {EMAIL_HEALTH_THRESHOLDS.bounce.warning}%</span>
                </div>
                <div className="flex justify-between text-yellow-600">
                  <span>Warning:</span>
                  <span>{EMAIL_HEALTH_THRESHOLDS.bounce.warning}% - {EMAIL_HEALTH_THRESHOLDS.bounce.danger - 0.01}%</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Risk:</span>
                  <span>≥ {EMAIL_HEALTH_THRESHOLDS.bounce.danger}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Complaint Rate Thresholds</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Healthy:</span>
                  <span>&lt; {EMAIL_HEALTH_THRESHOLDS.complaint.warning}%</span>
                </div>
                <div className="flex justify-between text-yellow-600">
                  <span>Warning:</span>
                  <span>{EMAIL_HEALTH_THRESHOLDS.complaint.warning}% - {EMAIL_HEALTH_THRESHOLDS.complaint.danger - 0.01}%</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Risk:</span>
                  <span>≥ {EMAIL_HEALTH_THRESHOLDS.complaint.danger}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specific Alerts and Advice */}
      {(bounceAdvice || complaintAdvice) && (
        <div className="space-y-4">
          {bounceAdvice && (
            <Alert variant={getAlertVariant(bounceHealth)}>
              <div className="flex items-start gap-3">
                {getHealthIcon(bounceHealth)}
                <div className="flex-1">
                  <div className="font-medium">{bounceAdvice.title}</div>
                  <AlertDescription className="mt-1">
                    {bounceAdvice.description}
                  </AlertDescription>
                  <ul className="mt-3 space-y-1 text-sm">
                    {bounceAdvice.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Alert>
          )}

          {complaintAdvice && (
            <Alert variant={getAlertVariant(complaintHealth)}>
              <div className="flex items-start gap-3">
                {getHealthIcon(complaintHealth)}
                <div className="flex-1">
                  <div className="font-medium">{complaintAdvice.title}</div>
                  <AlertDescription className="mt-1">
                    {complaintAdvice.description}
                  </AlertDescription>
                  <ul className="mt-3 space-y-1 text-sm">
                    {complaintAdvice.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* General Best Practices */}
      {overallHealth === 'healthy' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Best Practices
            </CardTitle>
            <CardDescription>
              Keep your email health optimal with these recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {getGeneralTips().map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}