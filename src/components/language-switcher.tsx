import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation, LANGUAGES } from "@/lib/context/translation"
import { Globe } from "lucide-react"

export function LanguageSwitcher({ isCollapsed }: { isCollapsed: boolean }) {
  const { language, setLanguage } = useTranslation()
  const currentLanguage = LANGUAGES.find(lang => lang.code === language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm"
          className={`flex items-center gap-2 p-2 w-full justify-start border-none shadow-none`}>
          {!isCollapsed && (
            <span className="flex-1 flex items-center gap-2 w-full">
              <span className="hidden sm:inline">{currentLanguage?.flag}</span>
              <span className="hidden md:inline">{currentLanguage?.name}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-2 ${
              language === lang.code ? "bg-accent" : ""
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {language === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}