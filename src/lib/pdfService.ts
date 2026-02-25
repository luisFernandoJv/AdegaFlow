import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
}

interface Sale {
  items: any[];
  total: number;
  paymentMethod: string;
  date: string;
}

interface Expense {
  description: string;
  amount: number;
  category: string;
  date: string;
  status: string;
}

export class PDFService {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  private formatDate(date: string): string {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  }

  private addHeader(doc: jsPDF, title: string) {
    // Logo/Header
    doc.setFillColor(234, 88, 12); // Primary color
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("AdegaPosto", 15, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Gestão", 15, 22);

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 15, 45);

    // Date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado em: ${this.formatDate(new Date().toISOString())} às ${format(new Date(), "HH:mm")}`,
      15,
      52,
    );

    return 60; // Return Y position for content start
  }

  private addFooter(doc: jsPDF, pageNumber: number) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${pageNumber} • AdegaPosto © ${new Date().getFullYear()}`,
      15,
      pageHeight - 10,
    );
  }

  // Relatório de Vendas
  generateSalesReport(sales: Sale[], startDate: string, endDate: string): void {
    const doc = new jsPDF();
    let yPos = this.addHeader(doc, "Relatório de Vendas");

    // Período
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Período: ${this.formatDate(startDate)} a ${this.formatDate(endDate)}`,
      15,
      yPos,
    );
    yPos += 10;

    // Resumo
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalSales = sales.length;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    doc.setFillColor(249, 250, 251);
    doc.rect(15, yPos, 180, 25, "F");

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Receita Total", 20, yPos + 8);
    doc.text("Total de Vendas", 80, yPos + 8);
    doc.text("Ticket Médio", 140, yPos + 8);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(this.formatCurrency(totalRevenue), 20, yPos + 18);
    doc.text(totalSales.toString(), 80, yPos + 18);
    doc.text(this.formatCurrency(avgTicket), 140, yPos + 18);

    yPos += 35;

    // Tabela de vendas
    const tableData = sales.map((sale) => [
      this.formatDate(sale.date),
      sale.items.length.toString(),
      sale.paymentMethod,
      this.formatCurrency(sale.total),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Itens", "Pagamento", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    this.addFooter(doc, 1);
    doc.save(`relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  // Relatório de Produtos/Estoque
  generateInventoryReport(products: Product[]): void {
    const doc = new jsPDF();
    let yPos = this.addHeader(doc, "Relatório de Estoque");

    // Resumo
    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValue = products.reduce((acc, p) => acc + p.stock * p.cost, 0);
    const lowStock = products.filter((p) => p.stock <= p.minStock).length;

    doc.setFillColor(249, 250, 251);
    doc.rect(15, yPos, 180, 25, "F");

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Total de Itens", 20, yPos + 8);
    doc.text("Valor em Estoque", 80, yPos + 8);
    doc.text("Estoque Baixo", 140, yPos + 8);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(totalItems.toString(), 20, yPos + 18);
    doc.text(this.formatCurrency(totalValue), 80, yPos + 18);
    doc.text(lowStock.toString(), 140, yPos + 18);

    yPos += 35;

    // Tabela de produtos
    const tableData = products.map((product) => [
      product.name,
      product.category,
      `${product.stock} ${product.unit}`,
      this.formatCurrency(product.price),
      this.formatCurrency(product.cost),
      this.formatCurrency(product.stock * product.cost),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        ["Produto", "Categoria", "Estoque", "Preço", "Custo", "Valor Total"],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

    this.addFooter(doc, 1);
    doc.save(`relatorio-estoque-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  // Relatório Financeiro
  generateFinancialReport(
    sales: Sale[],
    expenses: Expense[],
    startDate: string,
    endDate: string,
  ): void {
    const doc = new jsPDF();
    let yPos = this.addHeader(doc, "Relatório Financeiro");

    // Período
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Período: ${this.formatDate(startDate)} a ${this.formatDate(endDate)}`,
      15,
      yPos,
    );
    yPos += 10;

    // Cálculos
    const revenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const profit = revenue - totalExpenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Resumo Financeiro
    doc.setFillColor(249, 250, 251);
    doc.rect(15, yPos, 180, 50, "F");

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Receita Bruta", 20, yPos + 8);
    doc.text("Despesas", 105, yPos + 8);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); // Green
    doc.text(this.formatCurrency(revenue), 20, yPos + 18);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(this.formatCurrency(totalExpenses), 105, yPos + 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Lucro Líquido", 20, yPos + 33);
    doc.text("Margem", 105, yPos + 33);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      profit >= 0 ? 34 : 239,
      profit >= 0 ? 197 : 68,
      profit >= 0 ? 94 : 68,
    );
    doc.text(this.formatCurrency(profit), 20, yPos + 43);
    doc.text(`${margin.toFixed(1)}%`, 105, yPos + 43);

    yPos += 60;

    // Despesas por categoria
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Despesas por Categoria", 15, yPos);
    yPos += 8;

    const expensesByCategory = expenses.reduce((acc: any, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const categoryData = Object.entries(expensesByCategory).map(
      ([category, amount]) => [
        category,
        this.formatCurrency(amount as number),
        `${(((amount as number) / totalExpenses) * 100).toFixed(1)}%`,
      ],
    );

    autoTable(doc, {
      startY: yPos,
      head: [["Categoria", "Valor", "% do Total"]],
      body: categoryData,
      theme: "striped",
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    this.addFooter(doc, 1);
    doc.save(`relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }
}

export const pdfService = new PDFService();
