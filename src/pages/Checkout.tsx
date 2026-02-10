import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { CatalogFooter } from "@/components/CatalogFooter";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface CustomerData {
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { settings } = useStoreSettings();

  const [data, setData] = useState<CustomerData>({
    name: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");

  // Redirect to home if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="container flex h-14 items-center gap-3">
            <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm font-medium">Dados do Cliente</span>
          </div>
        </header>
        <main className="flex-1 container max-w-2xl py-20 text-center text-muted-foreground space-y-3">
          <p className="text-lg">Sua sacola está vazia</p>
          <Link to="/" className="text-sm font-medium underline">Voltar ao catálogo</Link>
        </main>
        <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
      </div>
    );
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepBlur = async () => {
    const cepDigits = data.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;

    setLoadingCep(true);
    setCepError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const json = await res.json();

      if (json.erro) {
        setCepError("CEP não encontrado");
        return;
      }

      setData((prev) => ({
        ...prev,
        street: json.logradouro || prev.street,
        neighborhood: json.bairro || prev.neighborhood,
        city: json.localidade || prev.city,
        state: json.uf || prev.state,
      }));
    } catch {
      setCepError("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const update = (field: keyof CustomerData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const isValid =
    data.name.trim().length >= 2 &&
    data.phone.replace(/\D/g, "").length >= 10 &&
    data.cep.replace(/\D/g, "").length === 8 &&
    data.street.trim() !== "" &&
    data.number.trim() !== "" &&
    data.neighborhood.trim() !== "" &&
    data.city.trim() !== "" &&
    data.state.trim() !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    // Store customer data in sessionStorage so the Cart page can use it
    sessionStorage.setItem("customerData", JSON.stringify(data));
    navigate("/sacola");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium">Dados do Cliente</span>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl py-6">
        <div className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp *</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={data.phone}
              onChange={(e) => update("phone", formatPhone(e.target.value))}
            />
          </div>

          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP *</Label>
            <div className="relative">
              <Input
                id="cep"
                placeholder="00000-000"
                value={data.cep}
                onChange={(e) => {
                  update("cep", formatCep(e.target.value));
                  setCepError("");
                }}
                onBlur={handleCepBlur}
              />
              {loadingCep && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {cepError && <p className="text-sm text-destructive">{cepError}</p>}
          </div>

          {/* Rua */}
          <div className="space-y-2">
            <Label htmlFor="street">Rua / Logradouro *</Label>
            <Input
              id="street"
              placeholder="Rua, Avenida..."
              value={data.street}
              onChange={(e) => update("street", e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                placeholder="123"
                value={data.number}
                onChange={(e) => update("number", e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                placeholder="Apto, Bloco..."
                value={data.complement}
                onChange={(e) => update("complement", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              placeholder="Bairro"
              value={data.neighborhood}
              onChange={(e) => update("neighborhood", e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                placeholder="Cidade"
                value={data.city}
                onChange={(e) => update("city", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">UF *</Label>
              <Input
                id="state"
                placeholder="SP"
                value={data.state}
                onChange={(e) => update("state", e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>

          {/* Botão prosseguir */}
          <Button
            className="w-full rounded-full mt-4"
            size="lg"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            Prosseguir para a sacola
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </main>

      <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
    </div>
  );
}
