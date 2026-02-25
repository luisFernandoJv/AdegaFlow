"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Check,
  Clock,
  Users,
  Pencil,
  Trash2,
  Filter,
  Calendar,
  Loader2,
  Receipt,
  Banknote,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, type Vale } from "@/contexts/AppContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const paymentMethods = [
  { id: "dinheiro", name: "Dinheiro", icon: Banknote },
  { id: "pix", name: "PIX", icon: Smartphone },
  { id: "debito", name: "Debito", icon: CreditCard },
  { id: "credito", name: "Credito", icon: CreditCard },
];

export default function Vales() {
  const { vales, addVale, updateVale, deleteVale } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendente" | "pago">(
    "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingVale, setEditingVale] = useState<Vale | null>(null);
  const [valeToDelete, setValeToDelete] = useState<Vale | null>(null);
  const [valeToPayment, setValeToPayment] = useState<Vale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [formData, setFormData] = useState({
    clientName: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    status: "pendente" as "pendente" | "pago",
  });

  const [paymentMethod, setPaymentMethod] = useState("dinheiro");

  const filteredVales = useMemo(() => {
    return vales.filter((v) => {
      const matchesSearch = v.clientName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || v.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [vales, search, filterStatus]);

  const stats = useMemo(() => {
    const pending = vales.filter((v) => v.status === "pendente");
    const paid = vales.filter((v) => v.status === "pago");

    return {
      pendingTotal: pending.reduce((acc, v) => acc + v.amount, 0),
      paidTotal: paid.reduce((acc, v) => acc + v.amount, 0),
      totalClients: new Set(vales.map((v) => v.clientName)).size,
      pendingCount: pending.length,
      paidCount: paid.length,
    };
  }, [vales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMM, yyyy", { locale: ptBR });
  };

  const openDialog = (vale?: Vale) => {
    if (vale) {
      setEditingVale(vale);
      setFormData({
        clientName: vale.clientName,
        amount: vale.amount.toString(),
        description: vale.description || "",
        date: new Date(vale.date).toISOString().split("T")[0],
        status: vale.status,
      });
    } else {
      setEditingVale(null);
      setFormData({
        clientName: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        status: "pendente",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.clientName || !formData.amount) {
      toast.error("Preencha os campos obrigatorios");
      return;
    }

    setIsLoading(true);
    try {
      const valeData = {
        clientName: formData.clientName,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        date: formData.date,
        status: formData.status,
      };

      if (editingVale) {
        await updateVale(editingVale.id, valeData);
      } else {
        await addVale(valeData);
      }

      setDialogOpen(false);
      setEditingVale(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!valeToDelete) return;

    setIsLoading(true);
    try {
      await deleteVale(valeToDelete.id);
      setDeleteDialogOpen(false);
      setValeToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!valeToPayment) return;

    setIsLoading(true);
    try {
      await updateVale(valeToPayment.id, {
        status: "pago",
        paymentMethod,
        paymentDate: new Date().toISOString(),
      });

      toast.success(
        `Pagamento de ${formatCurrency(valeToPayment.amount)} registrado!`,
      );
      setPaymentDialogOpen(false);
      setValeToPayment(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = (vale: Vale) => {
    if (vale.status === "pendente") {
      setValeToPayment(vale);
      setPaymentDialogOpen(true);
    } else {
      updateVale(vale.id, {
        status: "pendente",
        paymentMethod: undefined,
        paymentDate: undefined,
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Vales e Creditos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerenciar vales de clientes
          </p>
        </div>
        <Button onClick={() => openDialog()} size="sm" className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          Novo Vale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.pendingTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingCount} vales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pagos</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.paidTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.paidCount} vales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientes</p>
                <p className="text-xl font-bold">{stats.totalClients}</p>
                <p className="text-xs text-muted-foreground">ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Geral</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.pendingTotal + stats.paidTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vales.length} registros
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) =>
            setFilterStatus(v as "all" | "pendente" | "pago")
          }
        >
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Toggle */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "table" | "cards")}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-[200px] grid-cols-2">
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="cards">Cartoes</TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Descricao
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Data
                      </TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">
                            Nenhum vale encontrado
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVales.map((vale) => (
                        <TableRow key={vale.id}>
                          <TableCell className="font-medium">
                            {vale.clientName}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {vale.description || "-"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {formatDate(vale.date)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(vale.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                vale.status === "pago" ? "default" : "outline"
                              }
                              className={`cursor-pointer transition-colors ${
                                vale.status === "pago"
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "text-amber-600 border-amber-300 hover:bg-amber-50"
                              }`}
                              onClick={() => toggleStatus(vale)}
                            >
                              {vale.status === "pago" ? "Pago" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openDialog(vale)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                onClick={() => {
                                  setValeToDelete(vale);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards View */}
        <TabsContent value="cards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVales.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum vale encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredVales.map((vale) => (
                <Card
                  key={vale.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {vale.clientName}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={vale.status === "pago" ? "default" : "outline"}
                        className={`cursor-pointer ${
                          vale.status === "pago"
                            ? "bg-emerald-600 text-white"
                            : "text-amber-600 border-amber-300"
                        }`}
                        onClick={() => toggleStatus(vale)}
                      >
                        {vale.status === "pago" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vale.description && (
                      <p className="text-sm text-muted-foreground">
                        {vale.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(vale.date)}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(vale.amount)}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => openDialog(vale)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setValeToDelete(vale);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingVale ? "Editar Vale" : "Novo Vale"}
            </DialogTitle>
            <DialogDescription>
              {editingVale
                ? "Atualize os dados do vale"
                : "Adicione um novo vale para cliente"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                placeholder="Ex: Joao Silva"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Compra de bebidas"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingVale ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o pagamento do vale de {valeToPayment?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor do vale</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(valeToPayment?.amount || 0)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.id}
                      variant={
                        paymentMethod === method.id ? "default" : "outline"
                      }
                      className="h-12 flex-col gap-1"
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handlePayment} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o vale de &ldquo;
              {valeToDelete?.clientName}&rdquo;? Esta acao nao pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
