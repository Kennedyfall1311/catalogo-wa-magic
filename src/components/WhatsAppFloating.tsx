import { MessageCircle } from "lucide-react";

interface WhatsAppFloatingProps {
  whatsappNumber?: string;
}

export function WhatsAppFloating({ whatsappNumber }: WhatsAppFloatingProps) {
  const number = whatsappNumber || "5511999999999";
  const message = encodeURIComponent("Olá! Vi o catálogo e gostaria de mais informações.");
  const link = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform hover:scale-110 hover:bg-whatsapp-hover"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
