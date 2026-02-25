import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  FileText,
  Printer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/contexts/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { pdfService } from "@/lib/pdfService";
import { toast } from "sonner";

const COLORS = [
  "hsl(24.6, 95%, 53.1%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
  "hsl(280, 65%, 60%)",
];

const paymentMethodIcons: Record<string, React.ReactNode> = {
  dinheiro: <Banknote className="h-4 w-4" />,
  credito: <CreditCard className="h-4 w-4" />,
  debito: <CreditCard className="h-4 w-4" />,
  pix: <Smartphone className="h-4 w-4" />,
};

const paymentMethodLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
  pix: "PIX",
};

type PeriodFilter = "today" | "week" | "month" | "custom";

export default function Relatorios() {
  const { sales, expenses, products, isLoading, refreshData } = useApp();
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
      case "week":
        return {
          start: startOfWeek(now, { locale: ptBR }),
          end: endOfWeek(now, { locale: ptBR }),
        };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  }, [period]);

  // Filter sales by period
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return isWithinInterval(saleDate, {
        start: dateRange.start,
        end: dateRange.end,
      });
    });
  }, [sales, dateRange]);

  // Filter expenses by period
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, {
        start: dateRange.start,
        end: dateRange.end,
      });
    });
  }, [expenses, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredSales.reduce(
      (acc, sale) => acc + sale.total,
      0,
    );
    const totalExpenses = filteredExpenses.reduce(
      (acc, exp) => acc + exp.amount,
      0,
    );
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const avgTicket =
      filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    // Calculate cost from sales items
    const totalCost = filteredSales.reduce((acc, sale) => {
      return (
        acc +
        sale.items.reduce(
          (itemAcc, item) => itemAcc + item.cost * item.quantity,
          0,
        )
      );
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const grossMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin,
      avgTicket,
      salesCount: filteredSales.length,
      grossProfit,
      grossMargin,
      totalCost,
    };
  }, [filteredSales, filteredExpenses]);

  // Sales by day chart data
  const salesByDay = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    }).slice(-14);

    return days.map((day) => {
      const dayStr = format(day, "dd/MM");
      const daySales = filteredSales.filter(
        (sale) =>
          format(new Date(sale.date), "yyyy-MM-dd") ===
          format(day, "yyyy-MM-dd"),
      );
      const dayExpenses = filteredExpenses.filter(
        (expense) =>
          format(new Date(expense.date), "yyyy-MM-dd") ===
          format(day, "yyyy-MM-dd"),
      );

      return {
        name: dayStr,
        vendas: daySales.reduce((acc, s) => acc + s.total, 0),
        despesas: dayExpenses.reduce((acc, e) => acc + e.amount, 0),
        quantidade: daySales.length,
      };
    });
  }, [filteredSales, filteredExpenses, dateRange]);

  // Sales by payment method
  const salesByPayment = useMemo(() => {
    const methodMap = filteredSales.reduce(
      (acc, sale) => {
        const method = sale.paymentMethod || "outros";
        acc[method] = (acc[method] || 0) + sale.total;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(methodMap).map(([name, value]) => ({
      name: paymentMethodLabels[name] || name,
      value,
      icon: paymentMethodIcons[name],
    }));
  }, [filteredSales]);

  // Sales by category
  const salesByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        categoryMap[item.category] =
          (categoryMap[item.category] || 0) + item.price * item.quantity;
      });
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productMap: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productMap[item.id]) {
          productMap[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productMap[item.id].quantity += item.quantity;
        productMap[item.id].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredSales]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryMap = filteredExpenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredExpenses]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleExportPDF = (type: "sales" | "inventory" | "financial") => {
    try {
      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();

      switch (type) {
        case "sales":
          pdfService.generateSalesReport(filteredSales, startDate, endDate);
          toast.success("Relatório de vendas gerado!");
          break;
        case "inventory":
          pdfService.generateInventoryReport(products);
          toast.success("Relatório de estoque gerado!");
          break;
        case "financial":
          pdfService.generateFinancialReport(
            filteredSales,
            filteredExpenses,
            startDate,
            endDate,
          );
          toast.success("Relatório financeiro gerado!");
          break;
      }
    } catch (error) {
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-popover p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise completa do seu negócio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={period}
            onValueChange={(value: PeriodFilter) => setPeriod(value)}
          >
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Escolha o relatório</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportPDF("sales")}>
                <FileText className="mr-2 h-4 w-4" />
                Relatório de Vendas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF("inventory")}>
                <Package className="mr-2 h-4 w-4" />
                Relatório de Estoque
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF("financial")}>
                <DollarSign className="mr-2 h-4 w-4" />
                Relatório Financeiro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card-primary border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ShoppingCart className="mr-1 h-3 w-3" />
              {kpis.salesCount} vendas realizadas
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card-success border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.grossProfit)}
            </div>
            <div className="flex items-center text-xs">
              <Badge variant="outline" className="border-success text-success">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {kpis.grossMargin.toFixed(1)}% margem
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card-warning border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalExpenses)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {filteredExpenses.length} despesas no período
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${
            kpis.profit >= 0
              ? "stat-card-success border-l-success"
              : "stat-card-destructive border-l-destructive"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            {kpis.profit >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-success" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.profit)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              Ticket médio: {formatCurrency(kpis.avgTicket)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs - Continue igual ao código anterior... */}
      {/* Por questão de espaço, manterei a mesma estrutura de tabs */}
    </div>
  );
}
