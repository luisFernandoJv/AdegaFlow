import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export default function Configuracoes() {
  const { theme, toggleTheme } = useApp();

  const handleClearData = () => {
    if (
      confirm(
        "Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.",
      )
    ) {
      localStorage.clear();
      window.location.reload();
      toast.success("Dados limpos com sucesso!");
    }
  };

  const handleResetDemo = () => {
    localStorage.removeItem("products");
    localStorage.removeItem("sales");
    localStorage.removeItem("expenses");
    window.location.reload();
    toast.success("Dados de demonstração restaurados!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Configurações</h1>
        <p className="text-muted-foreground">Personalize o sistema</p>
      </div>

      <div className="grid gap-6 md:max-w-2xl">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Ativa o tema escuro do sistema
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Gerenciamento de Dados
            </CardTitle>
            <CardDescription>Gerencie os dados do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label>Restaurar Dados de Demonstração</Label>
                <p className="text-sm text-muted-foreground">
                  Restaura os produtos, vendas e despesas de exemplo
                </p>
              </div>
              <Button variant="outline" onClick={handleResetDemo}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Restaurar
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">
                  Limpar Todos os Dados
                </Label>
                <p className="text-sm text-muted-foreground">
                  Remove todos os dados armazenados. Esta ação não pode ser
                  desfeita.
                </p>
              </div>
              <Button variant="destructive" onClick={handleClearData}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Sistema de Gestão - Adega</strong>
            </p>
            <p>Versão: 1.0.0</p>
            <p>Desenvolvido com React + Vite + Tailwind CSS</p>
            <p className="pt-2">
              Um sistema completo para gerenciamento de adegas e postos de
              conveniência, incluindo PDV, controle de estoque e despesas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
