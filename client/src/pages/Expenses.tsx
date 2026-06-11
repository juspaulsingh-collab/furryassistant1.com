import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  DollarSign, Plus, Calendar, ArrowLeft, TrendingUp,
  Stethoscope, Utensils, Scissors, ShoppingBag, PawPrint
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Expense, Pet } from "@shared/schema";

const categoryIcons: Record<string, typeof DollarSign> = {
  food: Utensils,
  veterinary: Stethoscope,
  grooming: Scissors,
  supplies: ShoppingBag,
  toys: PawPrint,
  other: DollarSign,
};

const categoryColors: Record<string, string> = {
  food: "bg-chart-5/10 text-chart-5",
  veterinary: "bg-chart-2/10 text-chart-2",
  grooming: "bg-chart-4/10 text-chart-4",
  supplies: "bg-chart-3/10 text-chart-3",
  toys: "bg-primary/10 text-primary",
  other: "bg-muted text-muted-foreground",
};

function ExpenseCard({ expense, petName }: { expense: Expense; petName?: string }) {
  const Icon = categoryIcons[expense.category] || DollarSign;
  const colorClass = categoryColors[expense.category] || categoryColors.other;
  
  return (
    <Card data-testid={`expense-${expense.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium truncate">
                {expense.description || expense.category}
              </h3>
              <span className="font-semibold shrink-0">
                ${parseFloat(expense.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="capitalize">{expense.category}</Badge>
              {petName && <span>{petName}</span>}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {expense.date}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Expenses() {
  const [, navigate] = useLocation();

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

  const totalThisMonth = expenses?.reduce((sum, e) => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    if (expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()) {
      return sum + parseFloat(e.amount);
    }
    return sum;
  }, 0) || 0;

  const categoryTotals = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Expenses</h1>
          <ThemeToggle />
          <Button size="sm" asChild data-testid="button-add-expense">
            <Link href="/expenses/new">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="bg-gradient-to-br from-chart-5/10 to-chart-5/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Month</span>
              <TrendingUp className="w-4 h-4 text-chart-5" />
            </div>
            <p className="text-3xl font-bold" data-testid="text-monthly-total">
              ${totalThisMonth.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {Object.keys(categoryTotals).length > 0 && (
          <section>
            <h2 className="font-heading font-semibold text-lg mb-3">By Category</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(categoryTotals).map(([category, total]) => {
                const Icon = categoryIcons[category] || DollarSign;
                const colorClass = categoryColors[category] || categoryColors.other;
                return (
                  <Card key={category} data-testid={`category-${category}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-sm capitalize">{category}</span>
                      </div>
                      <p className="font-semibold">${total.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-heading font-semibold text-lg mb-3">Recent Expenses</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <ExpenseCard 
                  key={expense.id} 
                  expense={expense}
                  petName={expense.petId ? petMap.get(expense.petId) : undefined}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed" data-testid="empty-expenses">
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No expenses logged</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your pet-related spending
                </p>
                <Button asChild>
                  <Link href="/expenses/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Expense
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
