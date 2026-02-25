"use client";

import React from "react";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Package,
  X,
  Percent,
  Check,
  Receipt,
  User,
  Calendar,
  CalendarDays,
  CalendarRange,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "Todos" },
  { id: "bebidas", name: "Bebidas" },
  { id: "destilados", name: "Destilados" },
  { id: "vinhos", name: "Vinhos" },
  { id: "petiscos", name: "Petiscos" },
  { id: "tabacaria", name: "Tabacaria" },
];

const paymentMethods = [
  {
    id: "dinheiro",
    name: "Dinheiro",
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    id: "pix",
    name: "PIX",
    icon: Smartphone,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    id: "debito",
    name: "Debito",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "credito",
    name: "Credito",
    icon: CreditCard,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

const saleTypes = [
  {
    id: "item",
    name: "Por Item",
    icon: ShoppingCart,
    description: "Venda com desconto de estoque",
  },
  {
    id: "daily",
    name: "Diaria",
    icon: Calendar,
    description: "Registro de venda diaria",
  },
  {
    id: "weekly",
    name: "Semanal",
    icon: CalendarRange,
    description: "Registro de venda semanal",
  },
];

export default function PDV() {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    addSale,
    clearCart,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [saleType, setSaleType] = useState<"item" | "daily" | "weekly">("item");
  const [manualAmount, setManualAmount] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!paymentDialogOpen) {
      searchInputRef.current?.focus();
    }
  }, [paymentDialogOpen, cart.length]);

  const filteredProducts = useMemo(() => {
    const searchLower = search.toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        (product.barcode && product.barcode.includes(search));
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartSubtotal = useMemo(() => {
    if (saleType !== "item") {
      return parseFloat(manualAmount) || 0;
    }
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart, saleType, manualAmount]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discount);
  }, [cartSubtotal, discount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleFinalizeSale = async (paymentMethod: string) => {
    console.log("[v0] handleFinalizeSale called with:", paymentMethod);
    console.log("[v0] Sale type:", saleType);
    console.log("[v0] Cart length:", cart.length);
    console.log("[v0] Manual amount:", manualAmount);

    if (saleType === "item" && cart.length === 0) {
      toast.error("O carrinho esta vazio");
      return;
    }

    if (
      saleType !== "item" &&
      (!manualAmount || parseFloat(manualAmount) <= 0)
    ) {
      toast.error("Informe o valor da venda");
      return;
    }

    setIsProcessing(true);

    try {
      const saleItems =
        saleType === "item"
          ? cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category,
              cost: item.cost,
              stock: item.stock,
              minStock: item.minStock,
            }))
          : [];

      const saleData = {
        items: saleItems,
        total: cartTotal,
        paymentMethod,
        date: new Date().toISOString(),
        discount: discount,
        customerName: customerName.trim() || undefined,
        saleType,
        notes:
          saleType !== "item"
            ? `Venda ${saleType === "daily" ? "diaria" : "semanal"}`
            : undefined,
      };

      console.log("[v0] Sending sale data:", JSON.stringify(saleData, null, 2));

      await addSale(saleData);

      console.log("[v0] Sale completed successfully");
      setPaymentDialogOpen(false);
      setCustomerName("");
      setDiscount(0);
      setManualAmount("");
      setShowMobileCart(false);
    } catch (error) {
      console.error("[v0] PDV Checkout Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search) {
      const product = products.find(
        (p) =>
          p.barcode === search || p.name.toLowerCase() === search.toLowerCase(),
      );
      if (product) {
        if (product.stock > 0) {
          addToCart(product);
          setSearch("");
        } else {
          toast.error("Produto sem estoque");
        }
      } else {
        toast.error("Produto nao encontrado");
      }
    }
  };

  const applyPercentDiscount = (percent: number) => {
    const value = (cartSubtotal * percent) / 100;
    setDiscount(value);
    toast.success(`Desconto de ${percent}% aplicado`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Sale Type Selector */}
      <div className="flex-none p-3 md:p-4 border-b bg-background">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {saleTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant={saleType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSaleType(type.id as "item" | "daily" | "weekly")
                  }
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap",
                    saleType === type.id && "shadow-md",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{type.name}</span>
                  <span className="sm:hidden">{type.name.split(" ")[0]}</span>
                </Button>
              );
            })}
          </div>

          {/* Mobile Cart Button */}
          <Button
            className="md:hidden bg-transparent"
            variant="outline"
            onClick={() => setShowMobileCart(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Carrinho
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cart.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 overflow-hidden">
        {/* Left Side: Products or Manual Entry */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
          {saleType === "item" ? (
            <>
              {/* Search and Categories */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Pesquisar produto ou codigo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="h-11 md:h-12 pl-10 md:pl-12 text-base"
                  />
                </div>

                <div className="overflow-x-auto -mx-3 px-3 pb-1">
                  <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    className="w-max min-w-full"
                  >
                    <TabsList className="h-9 md:h-10 bg-muted/50 p-1">
                      {categories.map((cat) => (
                        <TabsTrigger
                          key={cat.id}
                          value={cat.id}
                          className="px-3 md:px-4 text-xs md:text-sm data-[state=active]:bg-background"
                        >
                          {cat.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto -mx-3 px-3">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    <Package className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-3">
                    {filteredProducts.map((product) => {
                      const inCart = cart.find(
                        (item) => item.id === product.id,
                      );
                      const isLowStock = product.stock <= product.minStock;
                      const outOfStock = product.stock <= 0;

                      return (
                        <Card
                          key={product.id}
                          className={cn(
                            "relative overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
                            inCart && "ring-2 ring-primary bg-primary/5",
                            outOfStock &&
                              "opacity-50 grayscale cursor-not-allowed",
                          )}
                          onClick={() => !outOfStock && addToCart(product)}
                        >
                          <CardContent className="p-3">
                            <div className="flex flex-col h-full min-h-[80px]">
                              <div className="flex justify-between items-start mb-1">
                                <Badge
                                  variant={
                                    outOfStock
                                      ? "destructive"
                                      : isLowStock
                                        ? "outline"
                                        : "secondary"
                                  }
                                  className="text-[10px] px-1.5"
                                >
                                  {outOfStock
                                    ? "Esgotado"
                                    : `${product.stock} ${product.unit}`}
                                </Badge>
                                {inCart && (
                                  <div className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                                    {inCart.quantity}
                                  </div>
                                )}
                              </div>

                              <h3 className="font-medium text-xs md:text-sm line-clamp-2 flex-1">
                                {product.name}
                              </h3>

                              <p className="text-sm md:text-base font-bold text-primary mt-1">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Manual Entry for Daily/Weekly Sales */
            <Card className="flex-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto gap-6">
                  <div className="text-center">
                    {saleType === "daily" ? (
                      <CalendarDays className="h-16 w-16 mx-auto text-primary mb-4" />
                    ) : (
                      <CalendarRange className="h-16 w-16 mx-auto text-primary mb-4" />
                    )}
                    <h2 className="text-xl font-bold">
                      Venda {saleType === "daily" ? "Diaria" : "Semanal"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Registre o valor total da venda sem descontar estoque
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Valor Total da Venda
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        className="h-14 text-2xl text-center font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer" className="text-sm font-medium">
                        Cliente (opcional)
                      </Label>
                      <Input
                        id="customer"
                        placeholder="Nome do cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <Button
                      className="w-full h-12 text-lg font-semibold"
                      disabled={!manualAmount || parseFloat(manualAmount) <= 0}
                      onClick={() => setPaymentDialogOpen(true)}
                    >
                      <Receipt className="h-5 w-5 mr-2" />
                      Finalizar Venda -{" "}
                      {formatCurrency(parseFloat(manualAmount) || 0)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Cart (Desktop) */}
        {saleType === "item" && (
          <div className="hidden lg:flex w-[380px] flex-col gap-4">
            <CartSection
              cart={cart}
              cartSubtotal={cartSubtotal}
              cartTotal={cartTotal}
              discount={discount}
              setDiscount={setDiscount}
              formatCurrency={formatCurrency}
              updateCartQuantity={updateCartQuantity}
              clearCart={clearCart}
              applyPercentDiscount={applyPercentDiscount}
              onCheckout={() => setPaymentDialogOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Mobile Cart Drawer */}
      <Dialog open={showMobileCart} onOpenChange={setShowMobileCart}>
        <DialogContent className="sm:max-w-[425px] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <CartSection
              cart={cart}
              cartSubtotal={cartSubtotal}
              cartTotal={cartTotal}
              discount={discount}
              setDiscount={setDiscount}
              formatCurrency={formatCurrency}
              updateCartQuantity={updateCartQuantity}
              clearCart={clearCart}
              applyPercentDiscount={applyPercentDiscount}
              onCheckout={() => {
                setShowMobileCart(false);
                setPaymentDialogOpen(true);
              }}
              isMobile
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary-foreground">
                <Check className="h-6 w-6" />
                Finalizar Venda
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {saleType === "item"
                  ? "Selecione o metodo de pagamento"
                  : `Venda ${saleType === "daily" ? "diaria" : "semanal"}`}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex justify-between items-end">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-70">
                  Total a pagar
                </p>
                <p className="text-3xl md:text-4xl font-black">
                  {formatCurrency(cartTotal)}
                </p>
              </div>
              {saleType === "item" && (
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider opacity-70">
                    Itens
                  </p>
                  <p className="text-xl font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {saleType === "item" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente (Opcional)
                </Label>
                <Input
                  placeholder="Nome ou CPF do cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.id}
                      variant="outline"
                      className={cn(
                        "h-20 flex-col gap-2 border-2 transition-all hover:scale-[1.02] active:scale-95",
                        method.bg,
                        "hover:border-primary",
                      )}
                      onClick={() => handleFinalizeSale(method.id)}
                      disabled={isProcessing}
                    >
                      <Icon className={cn("h-6 w-6", method.color)} />
                      <span className="font-bold text-xs uppercase tracking-wide">
                        {method.name}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t">
            <Button
              variant="ghost"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={isProcessing}
              className="w-full"
            >
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CartSectionProps {
  cart: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }>;
  cartSubtotal: number;
  cartTotal: number;
  discount: number;
  setDiscount: (value: number) => void;
  formatCurrency: (value: number) => string;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPercentDiscount: (percent: number) => void;
  onCheckout: () => void;
  isMobile?: boolean;
}

function CartSection({
  cart,
  cartSubtotal,
  cartTotal,
  discount,
  setDiscount,
  formatCurrency,
  updateCartQuantity,
  clearCart,
  applyPercentDiscount,
  onCheckout,
  isMobile = false,
}: CartSectionProps) {
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [customDiscount, setCustomDiscount] = useState("");

  return (
    <Card
      className={cn(
        "flex-1 flex flex-col overflow-hidden",
        !isMobile && "border-2 shadow-lg",
      )}
    >
      {!isMobile && (
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Carrinho</h2>
            <Badge variant="secondary">{cart.length}</Badge>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <ShoppingCart className="h-12 w-12 mb-2" />
            <p>Carrinho vazio</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.price)} / {item.unit}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-background rounded-md border p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-bold">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right min-w-[60px]">
                <p className="font-bold text-sm">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary and Actions */}
      <div className="p-4 bg-muted/30 border-t space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(cartSubtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 font-medium">
              <div className="flex items-center gap-1">
                <span>Desconto</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 text-emerald-600 hover:text-emerald-700"
                  onClick={() => setDiscount(0)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-black text-primary">
              {formatCurrency(cartTotal)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Dialog
            open={discountDialogOpen}
            onOpenChange={setDiscountDialogOpen}
          >
            <Button
              variant="outline"
              className="h-11 bg-transparent"
              onClick={() => setDiscountDialogOpen(true)}
            >
              <Percent className="h-4 w-4 mr-2" />
              Desconto
            </Button>
            <DialogContent className="sm:max-w-[350px]">
              <DialogHeader>
                <DialogTitle>Aplicar Desconto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      onClick={() => {
                        applyPercentDiscount(percent);
                        setDiscountDialogOpen(false);
                      }}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Valor personalizado (R$)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        const value = parseFloat(
                          customDiscount.replace(",", "."),
                        );
                        if (
                          !isNaN(value) &&
                          value > 0 &&
                          value <= cartSubtotal
                        ) {
                          setDiscount(value);
                          setCustomDiscount("");
                          setDiscountDialogOpen(false);
                          toast.success(
                            `Desconto de ${formatCurrency(value)} aplicado`,
                          );
                        } else {
                          toast.error("Valor invalido");
                        }
                      }}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            className="h-11 font-bold text-base shadow-md"
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            Pagar
            <Receipt className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
