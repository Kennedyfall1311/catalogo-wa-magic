import { MessageCircle } from "lucide-react";
import { getWhatsAppGeneralLink } from "@/lib/whatsapp";

export function WhatsAppFloating() {
  return (
    <a
      href={getWhatsAppGeneralLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform hover:scale-110 hover:bg-whatsapp-hover"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
