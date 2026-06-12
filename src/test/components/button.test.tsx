import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByText("Clique aqui")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="destructive">Excluir</Button>);
    expect(container.firstChild).toHaveClass("bg-destructive");
  });

  it("applies size classes", () => {
    const { container } = render(<Button size="sm">Pequeno</Button>);
    expect(container.firstChild).toHaveClass("h-8");
  });

  it("disables the button", () => {
    render(<Button disabled>Desabilitado</Button>);
    expect(screen.getByText("Desabilitado")).toBeDisabled();
  });
});
