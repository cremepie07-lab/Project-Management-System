import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../Modal";

describe("Modal Component", () => {
  it("should render the modal with title and children", () => {
    render(
      <Modal title="Test Modal" onClose={() => {}}>
        <div data-testid="modal-content">Modal Content Here</div>
      </Modal>
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
    expect(screen.getByText("Modal Content Here")).toBeInTheDocument();
  });

  it("should call onClose when the close button is clicked", () => {
    const handleClose = jest.fn();
    
    // Using testing library to query by role or by custom ways
    // The close button has an X icon from lucide-react. We can find it by button role.
    render(
      <Modal title="Test Modal" onClose={handleClose}>
        Content
      </Modal>
    );

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
