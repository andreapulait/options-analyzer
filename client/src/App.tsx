import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StrategyProvider } from "./contexts/StrategyContext";
import Home from "./pages/Home";
import StrategyBuilder from "./pages/StrategyBuilder";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        {/* Key forces remount when logic changes - increment to reset state */}
        <Home key="v2" />
      </Route>
      <Route path={"/strategy"} component={StrategyBuilder} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <StrategyProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </StrategyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
