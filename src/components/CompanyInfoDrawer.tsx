import { Phone, Mail, MapPin, Clock, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface CompanyInfoDrawerProps {
  storeName?: string;
  logoUrl?: string;
  headerColor?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyHours?: string;
  companyDescription?: string;
}

export function CompanyInfoDrawer({
  storeName,
  logoUrl,
  headerColor,
  companyPhone,
  companyEmail,
  companyAddress,
  companyHours,
  companyDescription,
}: CompanyInfoDrawerProps) {
  const hasAnyInfo = companyPhone || companyEmail || companyAddress || companyHours || companyDescription;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 hover:opacity-70 rounded-md transition-colors" aria-label="Menu">
          <Menu className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[360px]">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3 mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || "Logo"} className="h-14 w-14 rounded-full object-cover" />
            ) : null}
            <SheetTitle className="text-lg font-bold uppercase">
              {storeName || "Nossa Empresa"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {companyDescription && (
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Sobre</p>
                <p className="text-sm">{companyDescription}</p>
              </div>
            </div>
          )}

          {companyPhone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Telefone</p>
                <a href={`tel:${companyPhone}`} className="text-sm hover:underline">{companyPhone}</a>
              </div>
            </div>
          )}

          {companyEmail && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">E-mail</p>
                <a href={`mailto:${companyEmail}`} className="text-sm hover:underline">{companyEmail}</a>
              </div>
            </div>
          )}

          {companyAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Endereço</p>
                <p className="text-sm">{companyAddress}</p>
              </div>
            </div>
          )}

          {companyHours && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Horário</p>
                <p className="text-sm">{companyHours}</p>
              </div>
            </div>
          )}

          {!hasAnyInfo && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma informação cadastrada ainda. Configure no painel administrativo.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
