"use client";

import React from "react";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/contexts/AppContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { products, sales, expenses, vales } = useApp();

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const weekAgo = startOfDay(subDays(now, 7));
    const monthAgo = startOfDay(subDays(now, 30));

    // Filter today's data
    const todaySales = sales.filter((s) => {
      const saleDate = new Date(s.date);
      return isWithinInterval(saleDate, { start: today, end: endOfDay(now) });
    });

    const todayExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return isWithinInterval(expenseDate, {
        start: today,
        end: endOfDay(now),
      });
    });

    // Yesterday's data for comparison
    const yesterdaySales = sales.filter((s) => {
      const saleDate = new Date(s.date);
      return isWithinInterval(saleDate, {
        start: yesterday,
        end: endOfDay(yesterday),
      });
    });

    // Week data
    const weekSales = sales.filter((s) => new Date(s.date) >= weekAgo);
    const weekExpenses = expenses.filter((e) => new Date(e.date) >= weekAgo);

    // Month data
    const monthSales = sales.filter((s) => new Date(s.date) >= monthAgo);

    // Calculate totals
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
    const yesterdayRevenue = yesterdaySales.reduce(
      (acc, s) => acc + s.total,
      0,
    );
    const weekRevenue = weekSales.reduce((acc, s) => acc + s.total, 0);
    const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);

    const todayExpenseTotal = todayExpenses.reduce(
      (acc, e) => acc + e.amount,
      0,
    );
    const weekExpenseTotal = weekExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Calculate costs and profit
    const todayCost = todaySales.reduce(
      (acc, s) =>
        acc +
        s.items.reduce(
          (itemAcc, item) => itemAcc + (item.cost || 0) * item.quantity,
          0,
        ),
      0,
    );
    const weekCost = weekSales.reduce(
      (acc, s) =>
        acc +
        s.items.reduce(
          (itemAcc, item) => itemAcc + (item.cost || 0) * item.quantity,
          0,
        ),
      0,
    );

    const todayProfit = todayRevenue - todayCost - todayExpenseTotal;
    const weekProfit = weekRevenue - weekCost - weekExpenseTotal;

    // Revenue change
    const revenueChange =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : 0;

    // Stock alerts
    const lowStockProducts = products.filter(
      (p) => p.stock <= p.minStock && p.stock > 0,
    );
    const outOfStock = products.filter((p) => p.stock === 0);

    // Pending vales
    const pendingVales = vales.filter((v) => v.status === "pendente");
    const valesTotal = pendingVales.reduce((acc, v) => acc + v.amount, 0);

    // Average ticket
    const avgTicket =
      todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

    return {
      todayRevenue,
      todayProfit,
      todaySalesCount: todaySales.length,
      todayExpenseTotal,
      weekRevenue,
      weekProfit,
      monthRevenue,
      revenueChange,
      avgTicket,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStock.length,
      lowStockProducts,
      outOfStock,
      valesTotal,
      valesCount: pendingVales.length,
      totalProducts: products.length,
    };
  }, [products, sales, expenses, vales]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        dayName: format(date, "EEE", { locale: ptBR }),
        fullDate: format(date, "dd/MM"),
      };
    });

    return days.map(({ date, dayName, fullDate }) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const daySales = sales.filter((s) => {
        const saleDate = new Date(s.date);
        return isWithinInterval(saleDate, { start: dayStart, end: dayEnd });
      });

      const dayExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return isWithinInterval(expenseDate, { start: dayStart, end: dayEnd });
      });

      const revenue = daySales.reduce((acc, s) => acc + s.total, 0);
      const expenseTotal = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

      return {
        name: dayName,
        date: fullDate,
        vendas: revenue,
        despesas: expenseTotal,
        lucro: revenue - expenseTotal,
      };
    });
  }, [sales, expenses]);

  const topProducts = useMemo(() => {
    const productMap: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productMap[item.id]) {
          productMap[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productMap[item.id].quantity += item.quantity;
        productMap[item.id].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard
          icon={ShoppingCart}
          label="Nova Venda"
          sublabel="PDV"
          href="/pdv"
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <QuickActionCard
          icon={Package}
          label="Estoque"
          sublabel="Gerenciar"
          href="/estoque"
          color="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-950/50"
        />
        <QuickActionCard
          icon={Receipt}
          label="Despesa"
          sublabel="Adicionar"
          href="/despesas"
          color="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-950/50"
        />
        <QuickActionCard
          icon={Users}
          label="Vales"
          sublabel="Clientes"
          href="/vales"
          color="text-emerald-600"
          bgColor="bg-emerald-100 dark:bg-emerald-950/50"
        />
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {stats.revenueChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  stats.revenueChange >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatPercentage(stats.revenueChange)}
              </span>
              <span className="text-xs text-muted-foreground">vs ontem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Hoje</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.todaySalesCount} vendas - Ticket medio:{" "}
              {formatCurrency(stats.avgTicket)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Hoje</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
              <TrendingDown className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayExpenseTotal)}
            </div>
            {stats.todayRevenue > 0 && (
              <>
                <Progress
                  value={(stats.todayExpenseTotal / stats.todayRevenue) * 100}
                  className="mt-2 h-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    (stats.todayExpenseTotal / stats.todayRevenue) *
                    100
                  ).toFixed(1)}
                  % da receita
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vales Pendentes
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
              <Clock className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.valesTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.valesCount} vales a receber
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Desempenho Semanal
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Vendas, despesas e lucro dos ultimos 7 dias
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total semana</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(stats.weekRevenue)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorVendas"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(142, 76%, 36%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142, 76%, 36%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="vendas"
                    name="Vendas"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorVendas)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="lucro"
                    name="Lucro"
                    stroke="hsl(142, 76%, 36%)"
                    fillOpacity={1}
                    fill="url(#colorLucro)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma venda registrada
                </p>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card
          className={
            stats.lowStockCount + stats.outOfStockCount > 0
              ? "border-amber-500/50"
              : ""
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${stats.lowStockCount + stats.outOfStockCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}
              />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockCount + stats.outOfStockCount === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Todos os produtos em estoque normal
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.outOfStock.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="font-medium text-sm">
                        {product.name}
                      </span>
                    </div>
                    <Badge variant="destructive">Esgotado</Badge>
                  </div>
                ))}
                {stats.lowStockProducts.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="font-medium text-sm">
                        {product.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-300"
                    >
                      {product.stock} {product.unit}
                    </Badge>
                  </div>
                ))}
                {stats.lowStockCount + stats.outOfStockCount > 6 && (
                  <p className="text-center text-xs text-muted-foreground">
                    +{stats.lowStockCount + stats.outOfStockCount - 6} outros
                    produtos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Semanal</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.weekRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Semanal</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.weekProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Produtos Cadastrados
                </p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  href: string;
  color: string;
  bgColor: string;
}

function QuickActionCard({
  icon: Icon,
  label,
  sublabel,
  href,
  color,
  bgColor,
}: QuickActionCardProps) {
  return (
    <a href={href}>
      <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {sublabel}
              </p>
              <p className="text-sm font-bold">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
