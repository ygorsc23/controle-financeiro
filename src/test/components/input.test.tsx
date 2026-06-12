import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Digite algo" />);
    expect(screen.getByPlaceholderText("Digite algo")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Input className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
