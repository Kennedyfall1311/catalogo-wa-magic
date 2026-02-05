const WHATSAPP_NUMBER = "5511999999999"; // Alterar para número real

export function getWhatsAppLink(productName: string, price: number, catalogUrl: string) {
  const message = encodeURIComponent(
    `Olá! Tenho interesse no produto:\n\n` +
    `*${productName}*\n` +
    `Preço: R$ ${price.toFixed(2).replace(".", ",")}\n\n` +
    `Catálogo: ${catalogUrl}`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

export function getWhatsAppGeneralLink() {
  const message = encodeURIComponent("Olá! Vi o catálogo e gostaria de mais informações.");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}
