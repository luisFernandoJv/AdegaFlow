"use client";

import { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  BarChart3,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import type { Product } from "@/contexts/AppContext";

const categories = ["bebidas", "destilados", "vinhos", "petiscos", "tabacaria"];
const units = [
  { value: "un", label: "Unidade" },
  { value: "kg", label: "Kg" },
  { value: "lt", label: "Litro" },
  { value: "cx", label: "Caixa" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Estoque() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "bebidas",
    price: "",
    cost: "",
    stock: "",
    minStock: "",
    unit: "un",
    barcode: "",
  });

  const inventory = useMemo(() => {
    return products.map((product) => {
      let status = "normal";
      if (product.stock === 0) {
        status = "out";
      } else if (product.stock <= product.minStock * 0.5) {
        status = "critical";
      } else if (product.stock <= product.minStock) {
        status = "low";
      }

      return {
        ...product,
        status,
        maxStock: product.minStock * 4,
      };
    });
  }, [products]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.barcode &&
            item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (selectedStatus === "all" || item.status === selectedStatus) &&
        (selectedCategory === "all" || item.category === selectedCategory),
    );
  }, [inventory, searchTerm, selectedStatus, selectedCategory]);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce(
      (acc, item) => acc + item.stock * item.price,
      0,
    );
    const totalItems = inventory.reduce((acc, item) => acc + item.stock, 0);
    const lowStockCount = inventory.filter(
      (i) => i.status === "low" || i.status === "critical",
    ).length;
    const outOfStockCount = inventory.filter((i) => i.status === "out").length;

    return { totalValue, totalItems, lowStockCount, outOfStockCount };
  }, [inventory]);

  const getStatusBadge = (status: string) => {
    const variants = {
      normal: {
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        label: "Normal",
        icon: CheckCircle2,
      },
      low: {
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        label: "Baixo",
        icon: TrendingUp,
      },
      critical: {
        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        label: "Critico",
        icon: AlertTriangle,
      },
      out: {
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        label: "Esgotado",
        icon: XCircle,
      },
    };
    const variant =
      variants[status as keyof typeof variants] || variants.normal;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.className} gap-1 font-medium`}>
        <Icon className="h-3 w-3" />
        <span className="hidden sm:inline">{variant.label}</span>
      </Badge>
    );
  };

  const getStockPercentage = (quantity: number, maxStock: number) => {
    return Math.min((quantity / maxStock) * 100, 100);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "out":
        return "bg-red-500";
      case "critical":
        return "bg-orange-500";
      case "low":
        return "bg-amber-500";
      default:
        return "bg-emerald-500";
    }
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        unit: product.unit,
        barcode: product.barcode || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "bebidas",
        price: "",
        cost: "",
        stock: "",
        minStock: "",
        unit: "un",
        barcode: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.cost ||
      !formData.stock ||
      !formData.minStock
    ) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    setIsLoading(true);
    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        unit: formData.unit,
        barcode: formData.barcode || undefined,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Controle de Estoque
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seu inventario de produtos
          </p>
        </div>
        <Button onClick={() => openDialog()} size="sm" className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Total em Estoque
                </p>
                <p className="text-xl font-bold">
                  {stats.totalItems.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className="text-xl font-bold">{stats.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Esgotados</p>
                <p className="text-xl font-bold">{stats.outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  Atencao: {stats.lowStockCount + stats.outOfStockCount}{" "}
                  produtos precisam de acao
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {stats.outOfStockCount > 0 &&
                    `${stats.outOfStockCount} esgotado(s)`}
                  {stats.outOfStockCount > 0 &&
                    stats.lowStockCount > 0 &&
                    " - "}
                  {stats.lowStockCount > 0 &&
                    `${stats.lowStockCount} com estoque baixo`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto por nome ou codigo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[140px] h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
            <SelectItem value="critical">Critico</SelectItem>
            <SelectItem value="out">Esgotado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table - Desktop */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preco</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">
                      Nenhum produto encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.barcode && (
                          <p className="text-xs text-muted-foreground">
                            {item.barcode}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.cost)}
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>
                            {item.stock} {item.unit}
                          </span>
                          <span className="text-muted-foreground">
                            min: {item.minStock}
                          </span>
                        </div>
                        <Progress
                          value={getStockPercentage(item.stock, item.maxStock)}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => {
                            setProductToDelete(item);
                            setIsDeleteDialogOpen(true);
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
        {filteredInventory.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredInventory.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.category.charAt(0).toUpperCase() +
                        item.category.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() => {
                        setProductToDelete(item);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Preco</p>
                    <p className="font-bold text-primary">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Custo</p>
                    <p className="font-medium">{formatCurrency(item.cost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Estoque</p>
                    <p className="font-medium">
                      {item.stock} {item.unit}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Estoque atual</span>
                    <span className="text-muted-foreground">
                      min: {item.minStock}
                    </span>
                  </div>
                  <Progress
                    value={getStockPercentage(item.stock, item.maxStock)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Atualize os dados do produto"
                : "Adicione um novo produto ao estoque"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                placeholder="Ex: Cerveja Skol 350ml"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
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
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barcode">Codigo de Barras</Label>
                <Input
                  id="barcode"
                  placeholder="Ex: 7891234567890"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Custo (R$) *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Preco Venda (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Quantidade *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minStock">Estoque Min. *</Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="0"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Unidade *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProduct ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &ldquo;{productToDelete?.name}
              &rdquo;? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
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
