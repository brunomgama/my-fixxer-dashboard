"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useEnvironment } from "@/lib/context/environment"
import { useTranslation } from "@/lib/context/translation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SenderApi } from "@/lib/api/sender"
import { AudienceApi } from "@/lib/api/audience"
import { AudienceTypesApi } from "@/lib/api/audience-types"
import { TemplateApi } from "@/lib/api/template"
import { CampaignApi } from "@/lib/api/campaign"
import { ScheduleApi } from "@/lib/api/schedule"
import { Sender } from "@/lib/types/sender"
import { Audience } from "@/lib/types/audience"
import { AudienceType } from "@/lib/types/audience-types"
import { Template } from "@/lib/types/template"
import { LOCALES, LocaleCode } from "@/lib/constants/locales"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"
import { 
  IconMail, 
  IconUsers, 
  IconTemplate, 
  IconPlus, 
  IconChevronLeft, 
  IconChevronRight,
  IconSend,
  IconClock,
  IconCheck,
  IconX
} from "@tabler/icons-react"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"

type WizardStep = 'welcome' | 'sender' | 'audience' | 'template' | 'campaign' | 'schedule' | 'complete'

interface ProcessState {
  // Sender step
  selectedSender: Sender | null
  selectedSenderAlias: string
  
  // Audience step  
  selectedAudience: Audience | null
  
  // Template step
  selectedTemplate: Template | null
  
  // Campaign step
  campaignName: string
  campaignSubject: string
  campaignContent: string
  campaignLocal: LocaleCode
  
  // Schedule step
  sendImmediately: boolean
  scheduledDate: string
  scheduledTime: string
}

interface CreateModalProps {
  type: 'sender' | 'audience' | 'template'
  onClose: () => void
  onCreated: (item: any) => void
}

function CreateModal({ type, onClose, onCreated }: CreateModalProps) {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const { showToast } = useToast()
  
  const senderApi = useMemo(() => new SenderApi(env), [env])
  const audienceApi = useMemo(() => new AudienceApi(env), [env])
  const audienceTypesApi = useMemo(() => new AudienceTypesApi(env), [env])
  const templateApi = useMemo(() => new TemplateApi(env), [env])
  
  const [loading, setLoading] = useState(false)
  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([])
  
  // Sender form
  const [senderEmail, setSenderEmail] = useState("")
  const [senderAlias, setSenderAlias] = useState<string[]>([])
  const [newAlias, setNewAlias] = useState("")
  const [senderEmailType, setSenderEmailType] = useState<string[]>([])
  
  // Audience form
  const [audienceName, setAudienceName] = useState("")
  const [audienceLocal, setAudienceLocal] = useState<LocaleCode>("FR")
  const [audienceTypeId, setAudienceTypeId] = useState("")
  const [audienceEmailType, setAudienceEmailType] = useState<"campaign" | "automation" | "functional">("campaign")
  const [audienceSQL, setAudienceSQL] = useState("")
  
  // Template form
  const [templateName, setTemplateName] = useState("")
  const [templateLocal, setTemplateLocal] = useState<LocaleCode>("FR")
  const [templateAudienceTypeId, setTemplateAudienceTypeId] = useState("")
  const [templateEmailType, setTemplateEmailType] = useState<"campaign" | "automation" | "functional">("campaign")
  const [templateHeader, setTemplateHeader] = useState("")
  const [templateFooter, setTemplateFooter] = useState("")
  
  useEffect(() => {
    if (type === 'audience' || type === 'template') {
      const fetchAudienceTypes = async () => {
        try {
          const result = await audienceTypesApi.list({ limit: 1000 })
          setAudienceTypes(result.results)
        } catch {
          showToast("Error", "Failed to load audience types", "error")
        }
      }
      fetchAudienceTypes()
    }
  }, [type, audienceTypesApi, showToast])
  
  const handleCreate = async () => {
    setLoading(true)
    try {
      let result
      
      if (type === 'sender') {
        if (!senderEmail.trim() || senderAlias.length === 0 || senderEmailType.length === 0) {
          showToast(t("common.error"), t("forms.pleaseCompleteAllFields"), "error")
          return
        }
        result = await senderApi.create({
          email: senderEmail,
          alias: senderAlias,
          emailType: senderEmailType,
          active: true,
          user: "system"
        })
      } else if (type === 'audience') {
        if (!audienceName.trim() || !audienceTypeId || !audienceSQL.trim()) {
          showToast(t("common.error"), t("forms.pleaseCompleteAllFields"), "error")
          return
        }
        result = await audienceApi.create({
          name: audienceName,
          local: audienceLocal,
          definition: `Created during send process for ${audienceName}`,
          audienceTypeId,
          emailType: audienceEmailType,
          sql: audienceSQL,
          active: true,
          user: "system"
        })
      } else if (type === 'template') {
        if (!templateName.trim() || !templateAudienceTypeId || !templateHeader.trim() || !templateFooter.trim()) {
          showToast(t("common.error"), t("forms.pleaseCompleteAllFields"), "error")
          return
        }
        result = await templateApi.create({
          name: templateName,
          local: templateLocal,
          audienceTypeId: templateAudienceTypeId,
          emailType: templateEmailType,
          header: templateHeader,
          footer: templateFooter,
          status: "draft",
          user: "system"
        })
      }
      
      showToast(t("common.success"), t("sendProcess.itemCreatedSuccessfully").replace("{item}", t(`sendProcess.${type}`)), "success")
      onCreated(result)
    } catch (error) {
      showToast(t("common.error"), t("sendProcess.failedToCreate").replace("{item}", t(`sendProcess.${type}`)), "error")
    } finally {
      setLoading(false)
    }
  }
  
  const addAlias = () => {
    if (newAlias.trim() && !senderAlias.includes(newAlias.trim())) {
      setSenderAlias([...senderAlias, newAlias.trim()])
      setNewAlias("")
    }
  }
  
  const removeAlias = (index: number) => {
    setSenderAlias(senderAlias.filter((_, i) => i !== index))
  }
  
  const toggleEmailType = (emailType: string) => {
    if (type === 'sender') {
      setSenderEmailType(prev => 
        prev.includes(emailType) 
          ? prev.filter(t => t !== emailType)
          : [...prev, emailType]
      )
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("sendProcess.createNewItem").replace("{item}", t(`sendProcess.${type}`))}</CardTitle>
              <CardDescription>
                {t("sendProcess.createItemDescription").replace("{item}", t(`sendProcess.${type}`))}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === 'sender' && (
            <>
              <div>
                <Label htmlFor="senderEmail">{t("common.email")} *</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder={t("senders.enterSenderEmail")}
                />
              </div>
              
              <div>
                <Label>{t("sendProcess.aliases")} *</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder={t("sendProcess.addAlias")}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                  />
                  <Button onClick={addAlias} disabled={!newAlias.trim()}>{t("sendProcess.add")}</Button>
                </div>
                {senderAlias.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {senderAlias.map((alias, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeAlias(index)}>
                        {alias} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label>{t("sendProcess.emailTypes")} *</Label>
                <div className="flex gap-2 mt-2">
                  {["campaign", "automation", "functional"].map((emailType) => (
                    <Button
                      key={emailType}
                      type="button"
                      variant={senderEmailType.includes(emailType) ? "default" : "outline"}
                      onClick={() => toggleEmailType(emailType)}
                    >
                      {t(`senders.${emailType}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {type === 'audience' && (
            <>
              <div>
                <Label htmlFor="audienceName">{t("sendProcess.name")} *</Label>
                <Input
                  id="audienceName"
                  value={audienceName}
                  onChange={(e) => setAudienceName(e.target.value)}
                  placeholder={t("sendProcess.enterName").replace("{item}", t("sendProcess.audience"))}
                />
              </div>
              
              <div>
                <Label>{t("sendProcess.locale")} *</Label>
                <Select value={audienceLocal} onValueChange={(value) => setAudienceLocal(value as LocaleCode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale.code} value={locale.code}>
                        {locale.flag} {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t("sendProcess.audienceType")} *</Label>
                <Select value={audienceTypeId} onValueChange={setAudienceTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("sendProcess.selectAudienceType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t("audience.emailType")} *</Label>
                <Select value={audienceEmailType} onValueChange={(value) => setAudienceEmailType(value as typeof audienceEmailType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">{t("senders.campaign")}</SelectItem>
                    <SelectItem value="automation">{t("senders.automation")}</SelectItem>
                    <SelectItem value="functional">{t("senders.functional")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="audienceSQL">{t("sendProcess.sqlQuery")} *</Label>
                <Textarea
                  id="audienceSQL"
                  value={audienceSQL}
                  onChange={(e) => setAudienceSQL(e.target.value)}
                  placeholder={t("sendProcess.enterSQLQuery")}
                  className="min-h-[100px] font-mono"
                />
              </div>
            </>
          )}
          
          {type === 'template' && (
            <>
              <div>
                <Label htmlFor="templateName">{t("sendProcess.name")} *</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={t("sendProcess.enterName").replace("{item}", t("sendProcess.template"))}
                />
              </div>
              
              <div>
                <Label>{t("sendProcess.locale")} *</Label>
                <Select value={templateLocal} onValueChange={(value) => setTemplateLocal(value as LocaleCode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale.code} value={locale.code}>
                        {locale.flag} {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t("sendProcess.audienceType")} *</Label>
                <Select value={templateAudienceTypeId} onValueChange={setTemplateAudienceTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("sendProcess.selectAudienceType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t("audience.emailType")} *</Label>
                <Select value={templateEmailType} onValueChange={(value) => setTemplateEmailType(value as typeof templateEmailType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">{t("senders.campaign")}</SelectItem>
                    <SelectItem value="automation">{t("senders.automation")}</SelectItem>
                    <SelectItem value="functional">{t("senders.functional")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="templateHeader">{t("sendProcess.header")} *</Label>
                <Textarea
                  id="templateHeader"
                  value={templateHeader}
                  onChange={(e) => setTemplateHeader(e.target.value)}
                  placeholder={t("sendProcess.enterHeader")}
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="templateFooter">{t("sendProcess.footer")} *</Label>
                <Textarea
                  id="templateFooter"
                  value={templateFooter}
                  onChange={(e) => setTemplateFooter(e.target.value)}
                  placeholder={t("sendProcess.enterFooter")}
                  className="min-h-[80px]"
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? t("sendProcess.creating") : t("sendProcess.create")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SendEmailProcessPage() {
  const { env } = useEnvironment()
  const { t } = useTranslation()
  const router = useRouter()
  const { toasterRef, showToast } = useToast()
  
  const senderApi = useMemo(() => new SenderApi(env), [env])
  const audienceApi = useMemo(() => new AudienceApi(env), [env])
  const templateApi = useMemo(() => new TemplateApi(env), [env])
  const campaignApi = useMemo(() => new CampaignApi(env), [env])
  const scheduleApi = useMemo(() => new ScheduleApi(env), [env])
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState<'sender' | 'audience' | 'template' | null>(null)
  
  // Data lists
  const [senders, setSenders] = useState<Sender[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  
  // Loading states
  const [loadingSenders, setLoadingSenders] = useState(false)
  const [loadingAudiences, setLoadingAudiences] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  
  // Process state
  const [processState, setProcessState] = useState<ProcessState>({
    selectedSender: null,
    selectedSenderAlias: "",
    selectedAudience: null,
    selectedTemplate: null,
    campaignName: "",
    campaignSubject: "",
    campaignContent: "",
    campaignLocal: "FR",
    sendImmediately: true,
    scheduledDate: "",
    scheduledTime: ""
  })
  
  const steps: { key: WizardStep; title: string; icon: any }[] = [
    { key: 'welcome', title: 'Welcome', icon: IconCheck },
    { key: 'sender', title: 'Sender', icon: IconMail },
    { key: 'audience', title: 'Audience', icon: IconUsers },
    { key: 'template', title: 'Template', icon: IconTemplate },
    { key: 'campaign', title: 'Campaign', icon: IconSend },
    { key: 'schedule', title: 'Schedule', icon: IconClock },
    { key: 'complete', title: 'Complete', icon: IconCheck }
  ]
  
  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Preload data for next steps
  useEffect(() => {
    const preloadData = async () => {
      try {
        // Welcome step: preload senders
        if (currentStep === 'welcome' && senders.length === 0) {
          setLoadingSenders(true)
          const result = await senderApi.list({ limit: 1000 })
          setSenders(result.results)
          setLoadingSenders(false)
        }
        
        // Sender step: preload audiences
        if (currentStep === 'sender' && audiences.length === 0) {
          setLoadingAudiences(true)
          const result = await audienceApi.list({ limit: 1000 })
          setAudiences(result.results)
          setLoadingAudiences(false)
        }
        
        // Audience step: preload templates
        if (currentStep === 'audience' && templates.length === 0) {
          setLoadingTemplates(true)
          const result = await templateApi.list({ limit: 1000 })
          setTemplates(result.results)
          setLoadingTemplates(false)
        }
      } catch (error) {
        console.error('Preload error:', error)
        showToast(t("common.error"), t("sendProcess.failedToPreloadData"), "error")
        setLoadingSenders(false)
        setLoadingAudiences(false)
        setLoadingTemplates(false)
      }
    }
    
    preloadData()
  }, [currentStep, senderApi, audienceApi, templateApi, senders.length, audiences.length, templates.length, showToast, t])
  
  // Load data when user navigates to a step (fallback for fast navigation)
  useEffect(() => {
    const loadCurrentStepData = async () => {
      try {
        if (currentStep === 'sender' && senders.length === 0 && !loadingSenders) {
          setLoadingSenders(true)
          const result = await senderApi.list({ limit: 1000 })
          setSenders(result.results)
          setLoadingSenders(false)
        }
        if (currentStep === 'audience' && audiences.length === 0 && !loadingAudiences) {
          setLoadingAudiences(true)
          const result = await audienceApi.list({ limit: 1000 })
          setAudiences(result.results)
          setLoadingAudiences(false)
        }
        if (currentStep === 'template' && templates.length === 0 && !loadingTemplates) {
          setLoadingTemplates(true)
          const result = await templateApi.list({ limit: 1000 })
          setTemplates(result.results)
          setLoadingTemplates(false)
        }
      } catch (error) {
        showToast(t("common.error"), t("sendProcess.failedToLoadData"), "error")
        setLoadingSenders(false)
        setLoadingAudiences(false)
        setLoadingTemplates(false)
      }
    }
    
    loadCurrentStepData()
  }, [currentStep, senderApi, audienceApi, templateApi, senders.length, audiences.length, templates.length, loadingSenders, loadingAudiences, loadingTemplates, showToast, t])

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key)
    }
  }
  
  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key)
    }
  }
  
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 'welcome':
        return true
      case 'sender':
        return processState.selectedSender && processState.selectedSenderAlias
      case 'audience':
        return processState.selectedAudience
      case 'template':
        return processState.selectedTemplate
      case 'campaign':
        return processState.campaignName.trim() && processState.campaignSubject.trim() && processState.campaignContent.trim()
      case 'schedule':
        return processState.sendImmediately || (processState.scheduledDate && processState.scheduledTime)
      default:
        return false
    }
  }
  
  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      // Create campaign
      const campaign = await campaignApi.create({
        name: processState.campaignName,
        local: processState.campaignLocal,
        audienceId: processState.selectedAudience!.id,
        senderId: processState.selectedSender!.id,
        senderAlias: processState.selectedSenderAlias,
        subject: processState.campaignSubject,
        content: processState.campaignContent,
        templateId: processState.selectedTemplate!.id,
        status: "draft",
        user: "system"
      })
      
      if (processState.sendImmediately) {
        console.log("🚀 Send email right away for campaign:", campaign.id)
        showToast(t("common.success"), t("sendProcess.emailWillBeSent"), "success")
      } else {
        const scheduledDateTime = new Date(`${processState.scheduledDate}T${processState.scheduledTime}`)
        
        // Create schedule
        await scheduleApi.create({
          campaignId: campaign.id,
          emailReceiver: [], // This would need to be populated based on audience
          scheduled_time: scheduledDateTime.toISOString(),
          variables: {}
        })
        
        console.log(`📅 Scheduled to ${scheduledDateTime.toLocaleString()} for campaign:`, campaign.id)
        showToast(t("common.success"), t("sendProcess.emailScheduledFor").replace("{datetime}", scheduledDateTime.toLocaleString()), "success")
      }
      
      setCurrentStep('complete')
    } catch (error) {
      showToast(t("common.error"), t("sendProcess.failedToCreateCampaign"), "error")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCreateModalResult = (type: 'sender' | 'audience' | 'template', newItem: any) => {
    if (type === 'sender') {
      setSenders([...senders, newItem])
      setProcessState(prev => ({ ...prev, selectedSender: newItem, selectedSenderAlias: newItem.alias[0] || "" }))
    } else if (type === 'audience') {
      setAudiences([...audiences, newItem])
      setProcessState(prev => ({ ...prev, selectedAudience: newItem }))
    } else if (type === 'template') {
      setTemplates([...templates, newItem])
      setProcessState(prev => ({ ...prev, selectedTemplate: newItem }))
    }
    setShowCreateModal(null)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br">
      <Toaster ref={toasterRef} />
      
      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{t("sendProcess.title")}</h1>
            <Button variant="outline" onClick={() => router.push(`/${env}`)}>
              <IconX className="w-4 h-4 mr-2" />
              {t("common.cancel")}
            </Button>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.key === currentStep
              const isCompleted = index < currentStepIndex
              const isClickable = index <= currentStepIndex
              
              return (
                <div
                  key={step.key}
                  className={`flex items-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => isClickable && goToStep(step.key)}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 mr-2
                    ${isActive ? 'bg-black border-white text-white' : 
                      isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                      'bg-gray-200 border-gray-300 text-gray-500'}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-black-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {t(`sendProcess.${step.key === 'welcome' ? 'welcome' : step.key === 'sender' ? 'selectSender' : step.key === 'audience' ? 'selectAudience' : step.key === 'template' ? 'selectTemplate' : step.key === 'campaign' ? 'campaignDetails' : step.key === 'schedule' ? 'schedule' : 'complete'}`)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl">{t("sendProcess.welcomeTitle")}</CardTitle>
              <CardDescription className="text-lg">
                {t("sendProcess.welcomeDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={() => router.push(`/${env}`)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={nextStep} size="lg">
                  {t("sendProcess.continue")}
                  <IconChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Sender Step */}
        {currentStep === 'sender' && (
          <>
            {loadingSenders ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <RippleWaveLoader />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IconMail className="w-6 h-6 mr-2" />
                    {t("sendProcess.selectSender")}
                  </CardTitle>
                  <CardDescription>
                    {t("sendProcess.chooseWhoWillSend")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{t("sendProcess.availableSenders")}</h3>
                    <Button variant="outline" onClick={() => setShowCreateModal('sender')}>
                      <IconPlus className="w-4 h-4 mr-2" />
                      {t("sendProcess.createNewSender")}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {senders.map((sender) => (
                      <Card
                        key={sender.id}
                        className={`cursor-pointer transition-all ${
                          processState.selectedSender?.id === sender.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setProcessState(prev => ({ 
                          ...prev, 
                          selectedSender: sender,
                          selectedSenderAlias: sender.alias[0] || ""
                        }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{sender.email}</h4>
                            <Badge variant={sender.active ? "default" : "secondary"}>
                              {sender.active ? t("sendProcess.active") : t("sendProcess.inactive")}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{t("sendProcess.aliases")}: {sender.alias.join(", ")}</div>
                            <div>{t("sendProcess.types")}: {sender.emailType.join(", ")}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {processState.selectedSender && (
                    <div>
                      <Label>{t("sendProcess.selectSenderAlias")} *</Label>
                      <Select 
                        value={processState.selectedSenderAlias} 
                        onValueChange={(value) => setProcessState(prev => ({ ...prev, selectedSenderAlias: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={t("sendProcess.selectAnAlias")} />
                        </SelectTrigger>
                        <SelectContent>
                          {processState.selectedSender.alias.map((alias) => (
                            <SelectItem key={alias} value={alias}>
                              {alias}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {/* Audience Step */}
        {currentStep === 'audience' && (
          <>
            {loadingAudiences ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <RippleWaveLoader />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IconUsers className="w-6 h-6 mr-2" />
                    {t("sendProcess.selectAudience")}
                  </CardTitle>
                  <CardDescription>
                    {t("sendProcess.chooseTargetAudience")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{t("sendProcess.availableAudiences")}</h3>
                    <Button variant="outline" onClick={() => setShowCreateModal('audience')}>
                      <IconPlus className="w-4 h-4 mr-2" />
                      {t("sendProcess.createNewAudience")}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audiences.map((audience) => (
                      <Card
                        key={audience.id}
                        className={`cursor-pointer transition-all ${
                          processState.selectedAudience?.id === audience.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setProcessState(prev => ({ ...prev, selectedAudience: audience }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{audience.name}</h4>
                            <Badge variant="outline">
                              {t(`senders.${audience.emailType}`)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{t("sendProcess.locale")}: {audience.local}</div>
                            <div className="truncate">{t("sendProcess.definition")}: {audience.definition}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {/* Template Step */}
        {currentStep === 'template' && (
          <>
            {loadingTemplates ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <RippleWaveLoader />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IconTemplate className="w-6 h-6 mr-2" />
                    {t("sendProcess.selectTemplate")}
                  </CardTitle>
                  <CardDescription>
                    {t("sendProcess.chooseEmailTemplate")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{t("sendProcess.availableTemplates")}</h3>
                    <Button variant="outline" onClick={() => setShowCreateModal('template')}>
                      <IconPlus className="w-4 h-4 mr-2" />
                      {t("sendProcess.createNewTemplate")}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          processState.selectedTemplate?.id === template.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setProcessState(prev => ({ ...prev, selectedTemplate: template }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">
                              {t(`senders.${template.emailType}`)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{t("sendProcess.locale")}: {template.local}</div>
                            <div>{t("sendProcess.status")}: {t(`templates.${template.status}`)}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {/* Campaign Step */}
        {currentStep === 'campaign' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconSend className="w-6 h-6 mr-2" />
                {t("sendProcess.createCampaign")}
              </CardTitle>
              <CardDescription>
                {t("sendProcess.writeEmailContent")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="campaignName">{t("sendProcess.campaignName")} *</Label>
                <Input
                  id="campaignName"
                  value={processState.campaignName}
                  onChange={(e) => setProcessState(prev => ({ ...prev, campaignName: e.target.value }))}
                  placeholder={t("sendProcess.enterCampaignName")}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>{t("sendProcess.locale")} *</Label>
                <Select 
                  value={processState.campaignLocal} 
                  onValueChange={(value) => setProcessState(prev => ({ ...prev, campaignLocal: value as LocaleCode }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale.code} value={locale.code}>
                        {locale.flag} {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="campaignSubject">{t("sendProcess.emailSubject")} *</Label>
                <Input
                  id="campaignSubject"
                  value={processState.campaignSubject}
                  onChange={(e) => setProcessState(prev => ({ ...prev, campaignSubject: e.target.value }))}
                  placeholder={t("sendProcess.enterEmailSubject")}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="campaignContent">{t("sendProcess.emailContent")} *</Label>
                <Textarea
                  id="campaignContent"
                  value={processState.campaignContent}
                  onChange={(e) => setProcessState(prev => ({ ...prev, campaignContent: e.target.value }))}
                  placeholder={t("sendProcess.enterEmailContent")}
                  className="mt-2 min-h-[200px]"
                />
              </div>
              
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t("sendProcess.campaignSummary")}</h4>
                <div className="text-sm space-y-1">
                  <div><strong>{t("sendProcess.sender")}:</strong> {processState.selectedSender?.email} ({processState.selectedSenderAlias})</div>
                  <div><strong>{t("sendProcess.audience")}:</strong> {processState.selectedAudience?.name}</div>
                  <div><strong>{t("sendProcess.template")}:</strong> {processState.selectedTemplate?.name}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Schedule Step */}
        {currentStep === 'schedule' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconClock className="w-6 h-6 mr-2" />
                {t("sendProcess.scheduleOrSend")}
              </CardTitle>
              <CardDescription>
                {t("sendProcess.chooseWhenToSend")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    processState.sendImmediately 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setProcessState(prev => ({ ...prev, sendImmediately: true }))}
                >
                  <CardContent className="p-6 text-center">
                    <IconSend className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-medium mb-2">{t("sendProcess.sendImmediately")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("sendProcess.sendRightAway")}
                    </p>
                  </CardContent>
                </Card>
                
                <Card
                  className={`cursor-pointer transition-all ${
                    !processState.sendImmediately 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setProcessState(prev => ({ ...prev, sendImmediately: false }))}
                >
                  <CardContent className="p-6 text-center">
                    <IconClock className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="font-medium mb-2">{t("sendProcess.scheduleForLater")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("sendProcess.chooseDateTime")}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {!processState.sendImmediately && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">{t("sendProcess.date")} *</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={processState.scheduledDate}
                      onChange={(e) => setProcessState(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="scheduledTime">{t("sendProcess.time")} *</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={processState.scheduledTime}
                      onChange={(e) => setProcessState(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Complete Step */}
        {currentStep === 'complete' && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl text-green-600">
                <IconCheck className="w-12 h-12 mx-auto mb-4" />
                {t("sendProcess.processComplete")}
              </CardTitle>
              <CardDescription className="text-lg">
                {t("sendProcess.campaignCreatedSuccessfully")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/${env}`)} size="lg">
                {t("sendProcess.returnToDashboard")}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Navigation */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" onClick={prevStep}>
              <IconChevronLeft className="w-4 h-4 mr-2" />
              {t("sendProcess.previous")}
            </Button>
            
            {currentStep === 'schedule' ? (
              <Button onClick={handleFinish} disabled={!canProceed() || isSubmitting}>
                {isSubmitting ? t("sendProcess.processing") : t("sendProcess.finishAndSend")}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()}>
                {t("sendProcess.next")}
                <IconChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Create Modal */}
      {showCreateModal && (
        <CreateModal
          type={showCreateModal}
          onClose={() => setShowCreateModal(null)}
          onCreated={(newItem) => handleCreateModalResult(showCreateModal, newItem)}
        />
      )}
    </div>
  )
}