"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Receipt,
  Check,
  Clock,
  Filter,
  Calendar,
  Loader2,
  TrendingDown,
  DollarSign,
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
import { useApp, type Expense } from "@/contexts/AppContext";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const categories = [
  {
    value: "fixo",
    label: "Fixo",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    value: "utilidades",
    label: "Utilidades",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  {
    value: "fornecedores",
    label: "Fornecedores",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    value: "funcionarios",
    label: "Funcionarios",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    value: "manutencao",
    label: "Manutencao",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    value: "outros",
    label: "Outros",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  },
];

export default function Despesas() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pago" | "pendente">(
    "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "outros",
    date: new Date().toISOString().split("T")[0],
    status: "pendente" as "pago" | "pendente",
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = e.description
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || e.category === filterCategory;
      const matchesStatus = filterStatus === "all" || e.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [expenses, search, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return isWithinInterval(expenseDate, {
        start: monthStart,
        end: monthEnd,
      });
    });

    const totalPaid = expenses
      .filter((e) => e.status === "pago")
      .reduce((acc, e) => acc + e.amount, 0);

    const totalPending = expenses
      .filter((e) => e.status === "pendente")
      .reduce((acc, e) => acc + e.amount, 0);

    const monthTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

    return {
      totalPaid,
      totalPending,
      monthTotal,
      paidCount: expenses.filter((e) => e.status === "pago").length,
      pendingCount: expenses.filter((e) => e.status === "pendente").length,
    };
  }, [expenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMM, yyyy", { locale: ptBR });
  };

  const getCategoryBadge = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return (
      <Badge className={cat?.color || "bg-gray-100 text-gray-700"}>
        {cat?.label || category}
      </Badge>
    );
  };

  const openDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: new Date(expense.date).toISOString().split("T")[0],
        status: expense.status,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: "",
        amount: "",
        category: "outros",
        date: new Date().toISOString().split("T")[0],
        status: "pendente",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    setIsLoading(true);
    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        status: formData.status,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      setDialogOpen(false);
      setEditingExpense(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    setIsLoading(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (expense: Expense) => {
    try {
      await updateExpense(expense.id, {
        status: expense.status === "pago" ? "pendente" : "pago",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Despesas
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Controle de gastos e contas
          </p>
        </div>
        <Button onClick={() => openDialog()} size="sm" className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pagas</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.paidCount} despesas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingCount} despesas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Este Mes</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.monthTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hidden lg:block">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Geral</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalPaid + stats.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expenses.length} registros
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar despesa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) =>
            setFilterStatus(v as "all" | "pago" | "pendente")
          }
        >
          <SelectTrigger className="w-full sm:w-[140px] h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pago">Pagas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table - Desktop */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descricao</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma despesa encontrada
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          expense.status === "pago" ? "default" : "outline"
                        }
                        className={`cursor-pointer transition-colors ${
                          expense.status === "pago"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "text-amber-600 border-amber-300 hover:bg-amber-50"
                        }`}
                        onClick={() => toggleStatus(expense)}
                      >
                        {expense.status === "pago" ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            setExpenseToDelete(expense);
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
        </CardContent>
      </Card>

      {/* Cards - Mobile */}
      <div className="grid gap-3 md:hidden">
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                Nenhuma despesa encontrada
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">{expense.description}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getCategoryBadge(expense.category)}
                      <Badge
                        variant={
                          expense.status === "pago" ? "default" : "outline"
                        }
                        className={`cursor-pointer ${
                          expense.status === "pago"
                            ? "bg-emerald-600 text-white"
                            : "text-amber-600 border-amber-300"
                        }`}
                        onClick={() => toggleStatus(expense)}
                      >
                        {expense.status === "pago" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openDialog(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => {
                        setExpenseToDelete(expense);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(expense.date)}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Editar Despesa" : "Nova Despesa"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Atualize os dados da despesa"
                : "Adicione uma nova despesa"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descricao *</Label>
              <Input
                id="description"
                placeholder="Ex: Conta de luz"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as "pago" | "pendente",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingExpense ? "Salvar" : "Adicionar"}
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
              Tem certeza que deseja excluir &ldquo;
              {expenseToDelete?.description}&rdquo;? Esta acao nao pode ser
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
